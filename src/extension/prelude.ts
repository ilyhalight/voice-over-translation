import debug from "../utils/debug";
import { toErrorMessage } from "../utils/errors";
import { summarizeBodyForDebug } from "./bodySerialization";
import { toBridgeMessage } from "./bridgeTransport";
import {
  type AnyObject,
  isOurMessage,
  TYPE_NOTIFY,
  TYPE_REQ,
  TYPE_RES,
  TYPE_XHR_ABORT,
  TYPE_XHR_ACK,
  TYPE_XHR_EVENT,
  TYPE_XHR_START,
} from "./constants";

const PRELUDE_BOOT_KEY = "__VOT_EXT_PRELUDE_BOOTED__";
const XHR_FALLBACK_TIMEOUT_GRACE_MS = 1_000;
const BRIDGE_REQUEST_TIMEOUT_MS = 15_000;
const REQUEST_ID_PREFIX =
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;

type UnknownRecord = Record<string, unknown>;
type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timeoutId: number;
};

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function toFiniteNumber(value: unknown): number | undefined {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Extension prelude script (MAIN world content script).
 *
 * Why MAIN world?
 * - The VOT codebase relies on page-context events and direct media controls on
 *   some sites (YouTube subtitles/lang detection, VK Video, NicoNico, etc.).
 * - MAIN world scripts do not have WebExtension APIs, so we expose a tiny userscript-like API
 *   surface by talking to `src/extension/bridge.ts` via globalThis.postMessage.
 */

function postToBridge(payload: AnyObject) {
  globalThis.postMessage(toBridgeMessage(payload), "*");
}

// Notifications cannot transport functions (onclick/ondone) over postMessage.
// Userscript managers accept callbacks, but WebExtension messaging uses the
// structured clone algorithm which throws on functions.
//
// If we forward the raw details object produced by the core code, it will
// often contain an `onclick` callback (e.g. to focus the current tab). That
// makes `postMessage()` throw a DataCloneError and notifications silently stop
// working.
//
// We strip non-serializable fields here and handle click behaviour in the
// background script (see src/extension/background.ts).
function sanitizeNotificationDetails(details: unknown): AnyObject {
  const d = asRecord(details);
  return {
    title: d.title != null ? String(d.title) : undefined,
    text: d.text != null ? String(d.text) : undefined,
    image: d.image != null ? String(d.image) : undefined,
    silent: !!d.silent,
    timeout: toFiniteNumber(d.timeout),
    tag: d.tag != null ? String(d.tag) : undefined,
  };
}

// Request/response plumbing for GM.* promises API.
let seq = 0;
const pending = new Map<string, PendingRequest>();

function makeId(): string {
  seq += 1;
  return `${REQUEST_ID_PREFIX}_${seq.toString(36)}`;
}

function request<T = unknown>(
  action: string,
  payload: AnyObject = {},
): Promise<T> {
  const id = makeId();
  return new Promise<T>((resolve, reject) => {
    // Safety timeout so calls don't hang forever if the bridge isn't available.
    const timeoutId = globalThis.setTimeout(() => {
      pending.delete(id);
      reject(new Error(`VOT bridge timeout for ${action}`));
    }, BRIDGE_REQUEST_TIMEOUT_MS);

    pending.set(id, {
      resolve: (value) => resolve(value as T),
      reject,
      timeoutId,
    });
    postToBridge({ type: TYPE_REQ, id, action, payload });
  });
}

type XhrCallbackState = {
  callbacks: AnyObject;
  timeoutId: ReturnType<typeof setTimeout> | null;
  timeoutMs: number;
  acknowledged: boolean;
  settled: boolean;
  lastBridgeEventAt: number;
};

// GM_xmlhttpRequest callback plumbing.
const xhrCallbacks = new Map<string, XhrCallbackState>();

function callXhrCallback(fn: unknown, arg: unknown): void {
  try {
    if (typeof fn === "function") {
      fn(arg);
    }
  } catch (err) {
    console.error("[VOT Extension] GM_xmlhttpRequest callback error", err);
  }
}

type XhrSettleCallbackName = "onload" | "onerror" | "ontimeout" | "onabort";
type XhrSettleState = { isSettled: boolean };

function createXhrSettleHandler(
  callbackName: XhrSettleCallbackName,
  original: AnyObject,
  settleState: XhrSettleState,
  resolve: (value: unknown) => void,
  reject: (reason: unknown) => void,
): (value: unknown) => void {
  return (value: unknown) => {
    callXhrCallback(original[callbackName], value);
    if (settleState.isSettled) return;
    settleState.isSettled = true;
    if (callbackName === "onload") {
      resolve(value);
      return;
    }
    reject(value);
  };
}

function popXhrCallbacks(requestId: string): AnyObject | null {
  const state = xhrCallbacks.get(requestId);
  if (!state) return null;
  state.settled = true;
  xhrCallbacks.delete(requestId);
  if (state.timeoutId !== null) {
    clearTimeout(state.timeoutId);
  }
  return state.callbacks;
}

function armXhrFallbackWatchdog(
  requestId: string,
  state: XhrCallbackState,
): void {
  if (state.timeoutId !== null) {
    clearTimeout(state.timeoutId);
    state.timeoutId = null;
  }
  if (
    state.settled ||
    !state.acknowledged ||
    !Number.isFinite(state.timeoutMs) ||
    state.timeoutMs <= 0
  ) {
    return;
  }

  state.timeoutId = globalThis.setTimeout(() => {
    const current = xhrCallbacks.get(requestId);
    if (!current || current.settled) return;
    debug.warn("[VOT EXT][prelude] GM_xmlhttpRequest timeout fallback fired", {
      requestId,
      timeoutMs: current.timeoutMs,
      state: "terminal",
      lastBridgeEventAt: current.lastBridgeEventAt || null,
    });
    const callbackFns = popXhrCallbacks(requestId);
    if (!callbackFns) return;
    try {
      postToBridge({ type: TYPE_XHR_ABORT, requestId });
    } catch {
      // ignore
    }
    callXhrCallback(callbackFns.ontimeout, {
      finalUrl: String(current.callbacks.url || ""),
      readyState: 4,
      status: 0,
      statusText: "",
      responseHeaders: "",
      response: null,
      responseText: "",
      error: "Timeout",
    });
  }, state.timeoutMs + XHR_FALLBACK_TIMEOUT_GRACE_MS);
}

function toSerializableXhrDetails(details: AnyObject): AnyObject {
  // Functions cannot be posted to the bridge; keep callbacks in `xhrCallbacks`.
  return {
    method: details.method,
    url: details.url,
    headers: details.headers,
    data: summarizeBodyForDebug(details.data),
    timeout: details.timeout,
    responseType: details.responseType,
    anonymous: details.anonymous,
    withCredentials: details.withCredentials,
  };
}

function toBridgeXhrDetails(details: AnyObject): AnyObject {
  debug.log("[VOT EXT][prelude] GM_xmlhttpRequest body passthrough", {
    url: details.url,
    method: details.method,
    body: summarizeBodyForDebug(details.data),
  });
  return {
    method: details.method,
    url: details.url,
    headers: details.headers,
    data: details.data,
    timeout: details.timeout,
    responseType: details.responseType,
    anonymous: details.anonymous,
    withCredentials: details.withCredentials,
  };
}

function extractXhrStatus(data: unknown): AnyObject {
  const src = asRecord(data);
  return {
    status: src.status ?? null,
    statusText: src.statusText ?? null,
    readyState: src.readyState ?? null,
    finalUrl: src.finalUrl ?? null,
  };
}

function makeXhrTerminalErrorPayload(
  callbacks: AnyObject,
  error: string,
): AnyObject {
  return {
    finalUrl: String(callbacks.url ?? ""),
    readyState: 4,
    status: 0,
    statusText: "",
    responseHeaders: "",
    response: null,
    responseText: "",
    error,
  };
}

export function installPageGmPolyfills() {
  // Legacy GM_notification (callback-based). Used by src/utils/notify.ts.
  (globalThis as any).GM_notification = (details: unknown) => {
    try {
      postToBridge({
        type: TYPE_NOTIFY,
        details: sanitizeNotificationDetails(details),
      });
    } catch {
      // ignore
    }
  };

  // GM_addStyle helper.
  (globalThis as any).GM_addStyle = (css: string) => {
    const style = document.createElement("style");
    style.textContent = String(css ?? "");
    (document.head || document.documentElement).appendChild(style);
    return style;
  };

  // GM_xmlhttpRequest shim backed by the extension service worker.
  (globalThis as any).GM_xmlhttpRequest = (details: AnyObject) => {
    const requestId = makeId();
    const callbacks: AnyObject = asRecord(details);
    const timeoutMs = Number(callbacks.timeout ?? 0);
    const callbackState: XhrCallbackState = {
      callbacks,
      timeoutId: null,
      timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 0,
      acknowledged: false,
      settled: false,
      lastBridgeEventAt: 0,
    };
    xhrCallbacks.set(requestId, callbackState);

    let active = true;

    debug.log("[VOT EXT][prelude] GM_xmlhttpRequest", {
      requestId,
      state: "created",
      timeoutMs: callbackState.timeoutMs,
      details: toSerializableXhrDetails(callbacks),
    });

    const startRequest = () => {
      try {
        if (!active || !xhrCallbacks.has(requestId)) return;

        // `window.postMessage()` already uses structured clone, so keep native
        // bodies intact here and serialize only once at the runtime messaging
        // boundary inside the isolated-world bridge.
        const requestDetails = toBridgeXhrDetails(callbacks);

        debug.log("[VOT EXT][prelude] GM_xmlhttpRequest post TYPE_XHR_START", {
          requestId,
          details: toSerializableXhrDetails(callbacks),
        });
        postToBridge({
          type: TYPE_XHR_START,
          requestId,
          details: requestDetails,
        });
      } catch (err: unknown) {
        if (!active || !xhrCallbacks.has(requestId)) return;
        active = false;
        const errorMsg = toErrorMessage(err);
        debug.log("[VOT EXT][prelude] GM_xmlhttpRequest start error", {
          requestId,
          error: errorMsg,
        });
        callXhrCallback(
          popXhrCallbacks(requestId)?.onerror,
          makeXhrTerminalErrorPayload(callbacks, errorMsg),
        );
      }
    };
    startRequest();

    return {
      abort: () => {
        if (!active) return;
        active = false;
        debug.warn("[VOT EXT][prelude] GM_xmlhttpRequest abort called", {
          requestId,
        });
        popXhrCallbacks(requestId);
        postToBridge({ type: TYPE_XHR_ABORT, requestId });
      },
    };
  };

  /**
   * Promise-based GM4 API.
   *
   * Tampermonkey's docs specify that GM.xmlHttpRequest returns a Promise
   * (which also has an `abort()` function) that resolves to the same response
   * object that callback-based GM_xmlhttpRequest receives.
   *
   * We also align with ScriptCat's published GM API typings here
   * (GM_xmlhttpRequest -> abort handle, GM.xmlHttpRequest -> abortable Promise),
   * so scripts written for ScriptCat/Tampermonkey behave consistently.
   */
  type AbortablePromise<T> = Promise<T> & { abort: () => void };

  const gmPromiseXmlHttpRequest = (details: AnyObject) => {
    const original = asRecord(details);

    let abortFn: (() => void) | null = null;

    const p = new Promise<unknown>((resolve, reject) => {
      const wrapped: AnyObject = { ...original };
      const settleState: XhrSettleState = { isSettled: false };

      wrapped.onload = createXhrSettleHandler(
        "onload",
        original,
        settleState,
        resolve,
        reject,
      );
      wrapped.onerror = createXhrSettleHandler(
        "onerror",
        original,
        settleState,
        resolve,
        reject,
      );
      wrapped.ontimeout = createXhrSettleHandler(
        "ontimeout",
        original,
        settleState,
        resolve,
        reject,
      );
      wrapped.onabort = createXhrSettleHandler(
        "onabort",
        original,
        settleState,
        resolve,
        reject,
      );

      const ctrl = (globalThis as any).GM_xmlhttpRequest(wrapped);
      abortFn =
        ctrl && typeof ctrl.abort === "function" ? ctrl.abort.bind(ctrl) : null;
    }) as AbortablePromise<unknown>;

    p.abort = () => {
      try {
        abortFn?.();
      } catch {
        // ignore
      }
    };

    return p;
  };

  // GM4 promises API used by src/utils/storage.ts.
  (globalThis as any).GM = {
    getValue: <T>(key: string, def?: T) =>
      request<T>("gm_getValue", { key, def }),
    setValue: (key: string, value: unknown) =>
      request<void>("gm_setValue", { key, value }),
    deleteValue: (key: string) => request<void>("gm_deleteValue", { key }),
    listValues: <T extends string = string>() => request<T[]>("gm_listValues"),
    getValues: <T extends AnyObject>(defaults: T) =>
      request<T>("gm_getValues", { defaults }),
    notification: (details: unknown) => {
      postToBridge({
        type: TYPE_NOTIFY,
        details: sanitizeNotificationDetails(details),
      });
    },
    // GM4 promise API (Tampermonkey-style)
    xmlHttpRequest: (details: AnyObject) => gmPromiseXmlHttpRequest(details),
  };

  // Provide GM_info so the core code can report environment information.
  // (We update it after handshake if available, but keep a usable default.)
  (globalThis as any).GM_info = {
    script: {
      name: "VOT Extension",
      version: "0.0.0",
    },
    scriptHandler: "VOT Extension",
    version: "0.0.0",
  };
}

export function wireMessageHandlers() {
  globalThis.addEventListener("message", (event) => {
    if (event.source !== globalThis.window) return;
    const data = event.data;
    if (!isOurMessage(data)) return;

    if (handlePromiseResponse(data)) return;
    if (handleXhrAck(data)) return;
    handleXhrEvent(data);
  });
}

function handlePromiseResponse(data: AnyObject): boolean {
  if (data.type !== TYPE_RES) return false;

  const id = String(data.id ?? "");
  const item = pending.get(id);
  if (!item) return true;

  pending.delete(id);
  clearTimeout(item.timeoutId);
  if (data.ok) item.resolve(data.result);
  else item.reject(new Error(toErrorMessage(data.error ?? "Bridge error")));
  return true;
}

function handleXhrAck(data: AnyObject): boolean {
  if (data.type !== TYPE_XHR_ACK) return false;

  const requestId = String(data.requestId ?? "");
  const state = xhrCallbacks.get(requestId);
  if (!state) return true;

  state.acknowledged = true;
  state.lastBridgeEventAt = Date.now();
  armXhrFallbackWatchdog(requestId, state);
  debug.log("[VOT EXT][prelude] XHR acknowledged", {
    requestId,
    state: "acknowledged",
    timeoutMs: state.timeoutMs,
    payload: data.payload ?? null,
  });
  return true;
}

function logXhrEvent(
  requestId: string,
  kind: string,
  payload: AnyObject,
): void {
  debug.log("[VOT EXT][prelude] XHR event", {
    requestId,
    state: kind === "progress" ? "in_flight" : "terminal",
    kind,
    ...extractXhrStatus(payload.response ?? payload.error ?? payload.progress),
  });
}

function finalizeXhrLoad(
  requestId: string,
  callbacks: AnyObject,
  payload: AnyObject,
): void {
  debug.log("[VOT EXT][prelude] XHR terminal load", {
    requestId,
    state: "terminal",
    ...extractXhrStatus(payload.response),
  });
  callXhrCallback(callbacks.onload, payload.response);
  popXhrCallbacks(requestId);
}

function finalizeXhrFailure(
  requestId: string,
  callbacks: AnyObject,
  payload: AnyObject,
  kind: "error" | "timeout" | "abort",
): void {
  const logger = kind === "error" ? debug.error : debug.warn;
  const callbackByKind: Record<"error" | "timeout" | "abort", string> = {
    error: "onerror",
    timeout: "ontimeout",
    abort: "onabort",
  };
  const callbackName = callbackByKind[kind];

  logger(`[VOT EXT][prelude] XHR terminal ${kind}`, {
    requestId,
    state: "terminal",
    ...extractXhrStatus(payload.error),
    error: payload?.error?.error ?? null,
  });
  callXhrCallback(callbacks[callbackName], payload.error);
  popXhrCallbacks(requestId);
}

function handleXhrEvent(data: AnyObject): void {
  if (data.type !== TYPE_XHR_EVENT) return;

  const requestId = String(data.requestId ?? "");
  const state = xhrCallbacks.get(requestId);
  if (!state) return;

  const callbacks = state.callbacks;
  const payload = asRecord(data.payload) as AnyObject;
  const kind = String(payload.type ?? "");

  logXhrEvent(requestId, kind, payload);

  if (kind === "progress") {
    state.lastBridgeEventAt = Date.now();
    armXhrFallbackWatchdog(requestId, state);
    callXhrCallback(callbacks.onprogress, payload.progress);
    return;
  }

  if (kind === "load") {
    finalizeXhrLoad(requestId, callbacks, payload);
    return;
  }

  if (kind === "error" || kind === "timeout" || kind === "abort") {
    finalizeXhrFailure(requestId, callbacks, payload, kind);
    return;
  }

  debug.warn("[VOT EXT][prelude] unexpected XHR bridge event", {
    requestId,
    kind,
    payload,
  });
}

export async function initializePrelude(): Promise<void> {
  installPageGmPolyfills();
  wireMessageHandlers();

  // Best-effort handshake to populate GM_info with real manifest metadata.
  try {
    const { manifest } = await request<{ manifest: AnyObject }>("handshake");
    const gmInfo = (globalThis as any).GM_info as AnyObject;
    if (manifest?.name) gmInfo.script.name = manifest.name;
    if (manifest?.version) {
      gmInfo.script.version = manifest.version;
      gmInfo.version = manifest.version;
    }
  } catch {
    // ignore
  }
}

export function bootstrapExtensionPrelude(): void {
  const preludeGlobal = globalThis as Record<string, unknown>;
  if (preludeGlobal[PRELUDE_BOOT_KEY]) {
    debug.log("[VOT EXT][prelude] already initialized");
    return;
  }

  preludeGlobal[PRELUDE_BOOT_KEY] = true;

  void (async () => {
    try {
      await initializePrelude();
    } catch {
      // initializePrelude already handles non-fatal startup failures.
    }
  })();
}

bootstrapExtensionPrelude();
