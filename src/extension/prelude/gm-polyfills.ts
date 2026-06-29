import debug from "../../utils/debug";
import { toErrorMessage } from "../../utils/errors";
import { summarizeBodyForDebug } from "../shared/bodySerialization";
import {
  type AnyObject,
  TYPE_NOTIFY,
  TYPE_REQ,
  TYPE_XHR_ABORT,
  TYPE_XHR_START,
} from "../shared/constants";
import { toBridgeMessage } from "../shared/transport";
import { callXhrCallback } from "../shared/utils";

const XHR_FALLBACK_TIMEOUT_GRACE_MS = 1_000;
const BRIDGE_REQUEST_TIMEOUT_MS = 15_000;
const REQUEST_ID_PREFIX =
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;

type UnknownRecord = Record<string, unknown>;
export type PendingRequest = {
  action: string;
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

function postToBridge(payload: AnyObject) {
  globalThis.postMessage(toBridgeMessage(payload), globalThis.location.origin);
}

// Notifications cannot transport functions (onclick/ondone) over postMessage.
// We strip non-serializable fields here and handle click behaviour in the
// background script (see background/notifications.ts).
function sanitizeNotificationDetails(details: unknown): AnyObject {
  const d = asRecord(details);
  return {
    title: d.title == null ? undefined : String(d.title),
    text: d.text == null ? undefined : String(d.text),
    image: d.image == null ? undefined : String(d.image),
    silent: !!d.silent,
    timeout: toFiniteNumber(d.timeout),
    tag: d.tag == null ? undefined : String(d.tag),
  };
}

// Request/response plumbing for GM.* promises API.
let seq = 0;
export const pending = new Map<string, PendingRequest>();

function makeId(): string {
  seq += 1;
  return `${REQUEST_ID_PREFIX}_${seq.toString(36)}`;
}

export function request<T = unknown>(
  action: string,
  payload: AnyObject = {},
): Promise<T> {
  const id = makeId();
  return new Promise<T>((resolve, reject) => {
    const timeoutId = globalThis.setTimeout(() => {
      pending.delete(id);
      debug.warn("[VOT EXT][prelude] GM API timeout", {
        requestId: id,
        action,
      });
      reject(new Error(`VOT bridge timeout for ${action}`));
    }, BRIDGE_REQUEST_TIMEOUT_MS);

    debug.log("[VOT EXT][prelude] GM API request", {
      requestId: id,
      action,
      payload,
    });
    pending.set(id, {
      action,
      resolve: (value) => resolve(value as T),
      reject,
      timeoutId,
    });
    postToBridge({ type: TYPE_REQ, id, action, payload });
  });
}

export type XhrCallbackState = {
  callbacks: AnyObject;
  timeoutId: ReturnType<typeof setTimeout> | null;
  timeoutMs: number;
  acknowledged: boolean;
  settled: boolean;
  lastBridgeEventAt: number;
};

// GM_xmlhttpRequest callback plumbing.
export const xhrCallbacks = new Map<string, XhrCallbackState>();

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

export function popXhrCallbacks(requestId: string): AnyObject | null {
  const state = xhrCallbacks.get(requestId);
  if (!state) return null;
  state.settled = true;
  xhrCallbacks.delete(requestId);
  if (state.timeoutId !== null) {
    clearTimeout(state.timeoutId);
  }
  return state.callbacks;
}

export function armXhrFallbackWatchdog(
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

export function extractXhrStatus(data: unknown): AnyObject {
  const src = asRecord(data);
  return {
    status: src.status ?? null,
    statusText: src.statusText ?? null,
    readyState: src.readyState ?? null,
    finalUrl: src.finalUrl ?? null,
  };
}

export function makeXhrTerminalErrorPayload(
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

  // Promise-based GM4 API (Tampermonkey/ScriptCat style).
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
        /* ignore */
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
    xmlHttpRequest: (details: AnyObject) => gmPromiseXmlHttpRequest(details),
  };

  // Provide GM_info so the core code can report environment information.
  (globalThis as any).GM_info = {
    script: { name: "VOT Extension", version: "0.0.0" },
    scriptHandler: "VOT Extension",
    version: "0.0.0",
  };
}
