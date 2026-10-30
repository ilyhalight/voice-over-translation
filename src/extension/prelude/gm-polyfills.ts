import { isObjectLike } from "#utils/guards.ts";
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
import { postToPage as postToBridge } from "../shared/transport";
import { callXhrCallback } from "../shared/utils";
import {
  getBridgeInstanceId,
  getBridgeState,
  isBridgeRestartError,
  whenBridgeReady,
} from "./bridge-client";

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
  timeoutId: ReturnType<typeof setTimeout>;
};

function asRecord(value: unknown): UnknownRecord {
  return isObjectLike(value) ? (value as UnknownRecord) : {};
}

function toFiniteNumber(value: unknown): number | undefined {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

// Notifications cannot transport functions (onclick/ondone) over postMessage.
// We strip non-serializable fields here and handle click behaviour in the
// background script (see background/notifications.ts).
const NOTIFICATION_STRING_FIELDS = ["title", "text", "image", "tag"] as const;

function sanitizeNotificationDetails(details: unknown): AnyObject {
  const d = asRecord(details);
  const sanitized: AnyObject = {
    silent: !!d.silent,
    timeout: toFiniteNumber(d.timeout),
  };

  for (const field of NOTIFICATION_STRING_FIELDS) {
    const value = d[field];
    if (typeof value === "string") {
      sanitized[field] = value;
    }
  }

  return sanitized;
}

let seq = 0;
export const pending = new Map<string, PendingRequest>();

function makeId(): string {
  seq += 1;
  return `${REQUEST_ID_PREFIX}_${seq.toString(36)}`;
}

export async function request<T = unknown>(
  action: string,
  payload: AnyObject = {},
): Promise<T> {
  if (getBridgeState() === "down") await whenBridgeReady();
  const sentToInstance = getBridgeInstanceId();
  try {
    return await sendRequestOnce<T>(action, payload);
  } catch (err: unknown) {
    if (!isBridgeRestartError(err)) throw err;
    debug.warn("[VOT EXT][prelude] GM API bridge restarted, retrying once", {
      action,
      instanceId: sentToInstance,
    });
    await whenBridgeReady(BRIDGE_REQUEST_TIMEOUT_MS, sentToInstance);
    return sendRequestOnce<T>(action, payload);
  }
}

export function popPendingRequest(id: string): PendingRequest | undefined {
  const item = pending.get(id);
  if (item) {
    pending.delete(id);
    clearTimeout(item.timeoutId);
  }
  return item;
}

function sendRequestOnce<T>(action: string, payload: AnyObject): Promise<T> {
  const id = makeId();
  return new Promise<T>((resolve, reject) => {
    const timeoutId = globalThis.setTimeout(() => {
      const item = popPendingRequest(id);
      if (!item) return;
      debug.warn("[VOT EXT][prelude] GM API timeout", {
        requestId: id,
        action,
      });
      item.reject(new Error(`VOT bridge timeout for ${action}`));
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
    try {
      postToBridge({ type: TYPE_REQ, id, action, payload });
    } catch (error) {
      popPendingRequest(id)?.reject(error);
    }
  });
}

export type XhrCallbackState = {
  callbacks: AnyObject;
  timeoutId: ReturnType<typeof setTimeout> | null;
  timeoutMs: number;
  acknowledged: boolean;
  settled: boolean;
  lastBridgeEventAt: number;
  /** Set once a progress event reached the page (no restart retry after that). */
  progressDelivered?: boolean;
  /**
   * Called by the message handler for a bridge-restart error event.
   * Returns true when the request was re-queued (event must not be surfaced).
   */
  retryOnBridgeRestart?: (payload: AnyObject) => boolean;
};

export const xhrCallbacks = new Map<string, XhrCallbackState>();

function clearXhrTimeout(state: XhrCallbackState): void {
  if (state.timeoutId !== null) clearTimeout(state.timeoutId);
  state.timeoutId = null;
}

export function popXhrCallbacks(requestId: string): AnyObject | null {
  const state = xhrCallbacks.get(requestId);
  if (!state) return null;
  state.settled = true;
  xhrCallbacks.delete(requestId);
  clearXhrTimeout(state);
  return state.callbacks;
}

export function armXhrFallbackWatchdog(
  requestId: string,
  state: XhrCallbackState,
): void {
  clearXhrTimeout(state);
  let timeoutMs = BRIDGE_REQUEST_TIMEOUT_MS;
  if (state.acknowledged) {
    timeoutMs = 0;
    if (state.timeoutMs > 0 && Number.isFinite(state.timeoutMs)) {
      timeoutMs = state.timeoutMs + XHR_FALLBACK_TIMEOUT_GRACE_MS;
    }
  }
  if (state.settled || timeoutMs <= 0) return;

  state.timeoutId = globalThis.setTimeout(() => {
    if (xhrCallbacks.get(requestId) !== state) return;
    const callbacks = popXhrCallbacks(requestId);
    if (!callbacks) return;
    abortBridgeXhr(requestId);
    const error = state.acknowledged
      ? "Timeout"
      : "VOT bridge did not acknowledge XHR request";
    debug.warn("[VOT EXT][prelude] GM_xmlhttpRequest timeout fallback", {
      requestId,
      error,
      lastBridgeEventAt: state.lastBridgeEventAt || null,
    });
    callXhrCallback(
      state.acknowledged ? callbacks.ontimeout : callbacks.onerror,
      makeXhrTerminalErrorPayload(callbacks, error),
    );
  }, timeoutMs);
}

function abortBridgeXhr(requestId: string): void {
  try {
    postToBridge({ type: TYPE_XHR_ABORT, requestId });
  } catch {
    // The bridge may already be gone; local cleanup must still complete.
  }
}

function toBridgeXhrDetails(details: AnyObject): AnyObject {
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

export function installPageGmPolyfills(): void {
  const pageGlobal = globalThis as any;
  const notification = (details: unknown) => {
    postToBridge({
      type: TYPE_NOTIFY,
      details: sanitizeNotificationDetails(details),
    });
  };

  pageGlobal.GM_notification = (details: unknown) => {
    try {
      notification(details);
    } catch {
      // ignore
    }
  };

  pageGlobal.GM_addStyle = (css: string) => {
    const style = document.createElement("style");
    style.textContent = String(css ?? "");
    (document.head || document.documentElement).appendChild(style);
    return style;
  };

  pageGlobal.GM_xmlhttpRequest = (details: AnyObject) => {
    let requestId = makeId();
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

    const waitController = new AbortController();
    const isActive = (id = requestId) => xhrCallbacks.get(id) === callbackState;
    let restartRetried = false;
    let sentToInstance: string | null = null;

    debug.log("[VOT EXT][prelude] GM_xmlhttpRequest", {
      requestId,
      state: "created",
      timeoutMs: callbackState.timeoutMs,
    });

    const failRequest = (id: string, error: unknown) => {
      if (!isActive(id)) return;
      const errorPayload =
        isObjectLike(error) && !(error instanceof Error)
          ? (error as AnyObject)
          : makeXhrTerminalErrorPayload(callbacks, toErrorMessage(error));
      callXhrCallback(popXhrCallbacks(id)?.onerror, errorPayload);
    };

    const startRequest = () => {
      try {
        if (!isActive()) return;
        const requestDetails = toBridgeXhrDetails(callbacks);

        debug.log("[VOT EXT][prelude] GM_xmlhttpRequest post TYPE_XHR_START", {
          requestId,
          details: {
            ...requestDetails,
            data: summarizeBodyForDebug(requestDetails.data),
          },
        });
        sentToInstance = getBridgeInstanceId();
        armXhrFallbackWatchdog(requestId, callbackState);
        postToBridge({
          type: TYPE_XHR_START,
          requestId,
          details: requestDetails,
        });
      } catch (err: unknown) {
        failRequest(requestId, err);
      }
    };

    const waitAndStart = (staleInstanceId?: string | null, error?: unknown) => {
      const waitId = requestId;
      whenBridgeReady(
        BRIDGE_REQUEST_TIMEOUT_MS,
        staleInstanceId,
        waitController.signal,
      ).then(
        () => {
          if (isActive(waitId)) startRequest();
        },
        (waitError: unknown) => failRequest(waitId, error ?? waitError),
      );
    };

    // Re-send TYPE_XHR_START once on the next bridge (new request id) when the
    // bridge died before any load/progress was delivered.
    callbackState.retryOnBridgeRestart = (payload: AnyObject) => {
      if (restartRetried || !isActive() || callbackState.progressDelivered) {
        return false;
      }
      restartRetried = true;
      const staleInstance = sentToInstance;
      const originalError = payload?.error ?? payload;
      xhrCallbacks.delete(requestId);
      clearXhrTimeout(callbackState);
      callbackState.acknowledged = false;
      callbackState.lastBridgeEventAt = 0;
      const previousId = requestId;
      requestId = makeId();
      xhrCallbacks.set(requestId, callbackState);
      debug.warn("[VOT EXT][prelude] GM_xmlhttpRequest bridge restarted", {
        requestId: previousId,
        retryRequestId: requestId,
        instanceId: staleInstance,
      });
      waitAndStart(staleInstance, originalError);
      return true;
    };

    if (getBridgeState() === "down") waitAndStart();
    else startRequest();

    return {
      abort: () => {
        const callbacks = popXhrCallbacks(requestId);
        if (!callbacks) return;
        waitController.abort();
        abortBridgeXhr(requestId);
        callXhrCallback(
          callbacks.onabort,
          makeXhrTerminalErrorPayload(callbacks, "Aborted"),
        );
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
      let settled = false;
      for (const name of [
        "onload",
        "onerror",
        "ontimeout",
        "onabort",
      ] as const) {
        wrapped[name] = (value: unknown) => {
          if (settled) return;
          settled = true;
          callXhrCallback(original[name], value);
          if (name === "onload") resolve(value);
          else reject(value);
        };
      }

      const ctrl = pageGlobal.GM_xmlhttpRequest(wrapped);
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

  pageGlobal.GM = {
    getValue: <T>(key: string, def?: T) =>
      request<T>("gm_getValue", { key, def }),
    setValue: (key: string, value: unknown) =>
      request<void>("gm_setValue", { key, value }),
    deleteValue: (key: string) => request<void>("gm_deleteValue", { key }),
    listValues: <T extends string = string>() => request<T[]>("gm_listValues"),
    getValues: <T extends AnyObject>(defaults: T) =>
      request<T>("gm_getValues", { defaults }),
    notification,
    xmlHttpRequest: gmPromiseXmlHttpRequest,
  };

  const buildVersion =
    typeof VOT_VERSION === "undefined"
      ? "0.0.0"
      : String(VOT_VERSION || "0.0.0");
  pageGlobal.GM_info = {
    script: { name: "VOT Extension", version: buildVersion },
    scriptHandler: "VOT Extension",
    version: buildVersion,
  };
}
