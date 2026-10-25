
type WebExtRuntimeLike = {
  lastError?: { message?: string };
};

type WebExtNamespace = {
  runtime?: WebExtRuntimeLike & {
    getManifest?: () => unknown;
    getURL?: (path: string) => string;
    id?: string;
    connect?: (...args: unknown[]) => unknown;
    sendMessage?: (...args: unknown[]) => unknown;
    onMessage?: { addListener?: (...args: unknown[]) => void };
    onConnect?: { addListener?: (...args: unknown[]) => void };
  };
  storage?: {
    local?: {
      get?: (...args: unknown[]) => unknown;
      set?: (...args: unknown[]) => unknown;
      remove?: (...args: unknown[]) => unknown;
    };
  };
  notifications?: {
    create?: (...args: unknown[]) => unknown;
    clear?: (...args: unknown[]) => unknown;
    onClicked?: { addListener?: (...args: unknown[]) => void };
  };
  windows?: {
    update?: (...args: unknown[]) => unknown;
  };
  tabs?: {
    update?: (...args: unknown[]) => unknown;
  };
  declarativeNetRequest?: {
    updateSessionRules?: (...args: unknown[]) => unknown;
  };
  permissions?: {
    getAll?: (...args: unknown[]) => unknown;
  };
};

const browserNamespace = (globalThis as Record<string, unknown>).browser as
  | WebExtNamespace
  | undefined;
const chromeNamespace = (globalThis as Record<string, unknown>).chrome as
  | WebExtNamespace
  | undefined;

export const ext: WebExtNamespace | null =
  browserNamespace ?? chromeNamespace ?? null;

export const isBrowserNamespace =
  !!browserNamespace && ext === browserNamespace;
const isFirefoxLike =
  typeof (browserNamespace?.runtime as { getBrowserInfo?: unknown } | undefined)
    ?.getBrowserInfo === "function";

export const runtimeMessagesUseStructuredClone = isFirefoxLike;

export function lastErrorMessage(): string | null {
  const err = chromeNamespace?.runtime?.lastError ?? ext?.runtime?.lastError;
  return err?.message ? String(err.message) : null;
}

// Invalidation has exactly ONE reliable, browser-agnostic signal: an orphaned
// context (extension reloaded/updated/removed) loses `runtime.id` — Chrome,
// Edge and Firefox return `undefined`, Safari may throw. Error *messages* are
// browser-specific and unstable, so they are never parsed here.

const TRANSPORT_RETRY_DELAYS_MS: readonly number[] = [50, 250];

export class ExtensionContextInvalidatedError extends Error {
  constructor(message = "Extension context invalidated") {
    super(message);
    this.name = "ExtensionContextInvalidatedError";
  }
}

/**
 * The callback API reported `runtime.lastError`: the message was not
 * delivered/answered (MV3 worker waking up, no listener registered yet).
 * Structural signal — the receiver's own errors never arrive this way.
 */
export class ExtensionTransportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtensionTransportError";
  }
}

export function isExtensionContextValid(): boolean {
  try {
    return !!ext?.runtime?.id;
  } catch {
    return false;
  }
}

/**
 * An extension runtime exists but its id is gone (orphaned context). False
 * outside extension environments, so plain errors there are never treated as
 * invalidation.
 */
function isRuntimeGone(): boolean {
  try {
    const runtime = ext?.runtime;
    return !!runtime && !runtime.id;
  } catch {
    return true;
  }
}

export function isContextInvalidatedError(error: unknown): boolean {
  return error instanceof ExtensionContextInvalidatedError || isRuntimeGone();
}

export function assertExtensionContext(): void {
  if (!isExtensionContextValid()) throw new ExtensionContextInvalidatedError();
}

function normalizeError(error: unknown): unknown {
  if (error instanceof ExtensionContextInvalidatedError) return error;
  if (!isRuntimeGone()) return error;
  const message = error instanceof Error ? error.message : undefined;
  return new ExtensionContextInvalidatedError(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries transport failures (up to 2 retries, 50ms then 250ms). Anything else
 * — receiver errors, invalidation — propagates immediately; callAsync
 * re-asserts the context before every attempt.
 */
async function withTransportRetry<T>(op: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await op();
    } catch (error) {
      const delay = TRANSPORT_RETRY_DELAYS_MS[attempt];
      if (delay === undefined || !(error instanceof ExtensionTransportError)) {
        throw error;
      }
      await sleep(delay);
    }
  }
}

function callbackToPromise<T>(
  fn: (...args: unknown[]) => unknown,
  args: unknown[],
  rejectOnLastError = true,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    try {
      fn(...args, (...cbArgs: unknown[]) => {
        // Always read lastError so Chromium never logs "Unchecked runtime.lastError".
        const err = lastErrorMessage();
        if (err && rejectOnLastError) {
          reject(normalizeError(new ExtensionTransportError(err)));
        } else {
          resolve(cbArgs[0] as T);
        }
      });
    } catch (e) {
      reject(normalizeError(e));
    }
  });
}

async function callAsync<T>(
  fn: ((...args: unknown[]) => unknown) | undefined,
  args: unknown[] = [],
  rejectOnLastError = true,
): Promise<T> {
  if (typeof fn !== "function") {
    throw new TypeError("WebExtension API is not available");
  }
  assertExtensionContext();

  if (isBrowserNamespace) {
    try {
      return (await fn(...args)) as T;
    } catch (e) {
      throw normalizeError(e);
    }
  }

  return callbackToPromise<T>(fn, args, rejectOnLastError);
}

async function callStorage<T>(
  method: "get" | "set" | "remove",
  value: unknown,
): Promise<T> {
  // Chromium may expose browser.* too; keep storage on its callback API.
  const chromeArea = isFirefoxLike
    ? undefined
    : chromeNamespace?.storage?.local;
  if (typeof chromeArea?.[method] === "function") {
    assertExtensionContext();
    return callbackToPromise<T>(chromeArea[method].bind(chromeArea), [value]);
  }

  const area = browserNamespace?.storage?.local ?? ext?.storage?.local;
  return callAsync<T>(area?.[method]?.bind(area), [value]);
}

export function storageGet<T = Record<string, unknown>>(
  keys: unknown,
): Promise<T> {
  return callStorage<T>("get", keys);
}

export async function storageSet(
  items: Record<string, unknown>,
): Promise<void> {
  await callStorage("set", items);
}

export async function storageRemove(keys: string | string[]): Promise<void> {
  await callStorage("remove", keys);
}

export async function runtimeSendMessage<T = unknown>(
  message: unknown,
): Promise<T> {
  const api = ext?.runtime;
  return withTransportRetry(() =>
    callAsync<T>(api?.sendMessage?.bind(api), [message]),
  );
}

export async function permissionsGetAll<
  T = Record<string, unknown>,
>(): Promise<T> {
  const api = ext?.permissions;
  return await callAsync<T>(api?.getAll?.bind(api));
}

export async function dnrUpdateSessionRules(args: {
  addRules?: unknown[];
  removeRuleIds?: number[];
}): Promise<void> {
  const api = ext?.declarativeNetRequest;
  if (typeof api?.updateSessionRules !== "function") return;

  await callAsync<void>(api.updateSessionRules.bind(api), [
    {
      addRules: args.addRules ?? [],
      removeRuleIds: args.removeRuleIds ?? [],
    },
  ]);
}

export async function notificationsCreate(
  notificationId: string,
  options: Record<string, unknown>,
): Promise<void> {
  const api = ext?.notifications;
  if (typeof api?.create !== "function") return;
  await callAsync<void>(api.create.bind(api), [notificationId, options]);
}

export async function notificationsClear(
  notificationId: string,
): Promise<void> {
  const api = ext?.notifications;
  if (typeof api?.clear !== "function") return;
  await callAsync<void>(api.clear.bind(api), [notificationId], false);
}

export async function windowsUpdate(
  windowId: number,
  updateInfo: Record<string, unknown>,
): Promise<void> {
  const api = ext?.windows;
  if (typeof api?.update !== "function") return;
  await callAsync<void>(api.update.bind(api), [windowId, updateInfo], false);
}

export async function tabsUpdate(
  tabId: number,
  updateInfo: Record<string, unknown>,
): Promise<void> {
  const api = ext?.tabs;
  if (typeof api?.update !== "function") return;
  await callAsync<void>(api.update.bind(api), [tabId, updateInfo], false);
}
