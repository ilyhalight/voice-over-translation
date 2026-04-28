/**
 * Minimal cross-browser WebExtension API access.
 *
 * - Chromium exposes APIs under `chrome` (callback-based).
 * - Firefox exposes APIs under `browser` (Promise-based) and often also
 *   provides a `chrome` alias.
 *
 * We keep a tiny wrapper so the rest of the codebase can use `await` even when
 * running on Chromium.
 */

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
};

type WebExtCallbackFn = (...args: unknown[]) => unknown;
type WebExtCallbackOptions<T> = {
  // Some callbacks return multiple values, most return a single `result`.
  mapCbArgs?: (...cbArgs: unknown[]) => T;
  // If false, don't treat runtime.lastError as fatal.
  rejectOnLastError?: boolean;
};
type StorageLocalMethod = "get" | "set" | "remove";

const browserNamespace = (globalThis as Record<string, unknown>).browser as
  | WebExtNamespace
  | undefined;
const chromeNamespace = (globalThis as Record<string, unknown>).chrome as
  | WebExtNamespace
  | undefined;

export const ext: WebExtNamespace | null =
  browserNamespace ?? chromeNamespace ?? null;

const isBrowserNamespace = !!browserNamespace && ext === browserNamespace;
const isFirefoxLike =
  typeof (browserNamespace?.runtime as { getBrowserInfo?: unknown } | undefined)
    ?.getBrowserInfo === "function";

export const runtimeMessagesUseStructuredClone = isFirefoxLike;
export const runtimeMessagesUseJsonSerialization =
  !runtimeMessagesUseStructuredClone;

export function lastErrorMessage(): string | null {
  // `runtime.lastError` is a Chromium callback-era mechanism.
  const err = chromeNamespace?.runtime?.lastError ?? ext?.runtime?.lastError;
  return err?.message ? String(err.message) : null;
}

function getPreferredStorageArea():
  | NonNullable<NonNullable<WebExtNamespace["storage"]>["local"]>
  | undefined {
  return isFirefoxLike
    ? (browserNamespace?.storage?.local ?? ext?.storage?.local)
    : (chromeNamespace?.storage?.local ??
        browserNamespace?.storage?.local ??
        ext?.storage?.local);
}

function isChromeStorageArea(
  area: NonNullable<NonNullable<WebExtNamespace["storage"]>["local"]>,
): boolean {
  return !isFirefoxLike && area === chromeNamespace?.storage?.local;
}

async function callCallbackApi<T>(
  fn: WebExtCallbackFn,
  args: unknown[] = [],
  opts: WebExtCallbackOptions<T> = {},
): Promise<T> {
  const mapCbArgs = opts.mapCbArgs;
  const rejectOnLastError = opts.rejectOnLastError !== false;

  return await new Promise<T>((resolve, reject) => {
    try {
      fn(...args, (...cbArgs: unknown[]) => {
        const err = rejectOnLastError ? lastErrorMessage() : null;
        if (err) reject(new Error(err));
        else resolve(mapCbArgs ? mapCbArgs(...cbArgs) : (cbArgs[0] as T));
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function callAsync<T>(
  fn: WebExtCallbackFn | undefined,
  args: unknown[] = [],
  opts: WebExtCallbackOptions<T> = {},
): Promise<T> {
  if (typeof fn !== "function") {
    throw new TypeError("WebExtension API is not available");
  }

  const mapCbArgs = opts.mapCbArgs;
  const rejectOnLastError = opts.rejectOnLastError !== false;

  // Promise-first for the `browser.*` namespace.
  if (isBrowserNamespace) {
    return (await fn(...args)) as T;
  }

  // Callback-based fallback (Chromium).
  return await callCallbackApi(fn, args, {
    mapCbArgs,
    rejectOnLastError,
  });
}

async function callStorageLocal<T>(
  method: StorageLocalMethod,
  args: unknown[] = [],
  opts: WebExtCallbackOptions<T> = {},
): Promise<T> {
  const area = getPreferredStorageArea();
  const fn = area?.[method]?.bind(area) as WebExtCallbackFn | undefined;

  if (!area || typeof fn !== "function") {
    throw new TypeError("WebExtension API is not available");
  }

  return isChromeStorageArea(area)
    ? await callCallbackApi<T>(fn, args, opts)
    : await callAsync<T>(fn, args, opts);
}

export async function storageGet<T = Record<string, unknown>>(
  keys: unknown,
): Promise<T> {
  return await callStorageLocal<T>("get", [keys]);
}

export async function storageSet(
  items: Record<string, unknown>,
): Promise<void> {
  await callStorageLocal<void>("set", [items], {
    mapCbArgs: () => undefined,
  });
}

export async function storageRemove(keys: string | string[]): Promise<void> {
  await callStorageLocal<void>("remove", [keys], {
    mapCbArgs: () => undefined,
  });
}

export async function notificationsCreate(
  notificationId: string,
  options: Record<string, unknown>,
): Promise<void> {
  // Best-effort: in some environments notifications may be unavailable.
  const api = ext?.notifications;
  const createFn = api?.create;
  if (!api || typeof createFn !== "function") return;
  await callAsync<void>(createFn.bind(api), [notificationId, options], {
    mapCbArgs: () => undefined,
  });
}

export async function notificationsClear(
  notificationId: string,
): Promise<void> {
  const api = ext?.notifications;
  const clearFn = api?.clear;
  if (!api || typeof clearFn !== "function") return;
  await callAsync<void>(clearFn.bind(api), [notificationId], {
    mapCbArgs: () => undefined,
    rejectOnLastError: false,
  });
}

export async function windowsUpdate(
  windowId: number,
  updateInfo: Record<string, unknown>,
): Promise<void> {
  const api = ext?.windows;
  const updateFn = api?.update;
  if (!api || typeof updateFn !== "function") return;
  await callAsync<void>(updateFn.bind(api), [windowId, updateInfo], {
    mapCbArgs: () => undefined,
    rejectOnLastError: false,
  });
}

export async function tabsUpdate(
  tabId: number,
  updateInfo: Record<string, unknown>,
): Promise<void> {
  const api = ext?.tabs;
  const updateFn = api?.update;
  if (!api || typeof updateFn !== "function") return;
  await callAsync<void>(updateFn.bind(api), [tabId, updateInfo], {
    mapCbArgs: () => undefined,
    rejectOnLastError: false,
  });
}
