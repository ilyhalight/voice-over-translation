import debug from "../../utils/debug";
import { toErrorMessage } from "../../utils/errors";
import {
  type AnyObject,
  isOurMessage,
  TYPE_RES,
  TYPE_XHR_ACK,
  TYPE_XHR_EVENT,
} from "../shared/constants";
import { isSameWindowBridgeEvent } from "../shared/transport";
import { callXhrCallback } from "../shared/utils";
import {
  armXhrFallbackWatchdog,
  extractXhrStatus,
  pending,
  popXhrCallbacks,
  xhrCallbacks,
} from "./gm-polyfills";

export function wireMessageHandlers() {
  globalThis.addEventListener("message", (event) => {
    if (!isSameWindowBridgeEvent(event)) return;
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
  if (data.ok) {
    debug.log("[VOT EXT][prelude] GM API response", {
      requestId: id,
      action: item.action,
      ok: true,
      resultType: Array.isArray(data.result) ? "array" : typeof data.result,
    });
    item.resolve(data.result);
  } else {
    const errorMessage = toErrorMessage(data.error ?? "Bridge error");
    debug.warn("[VOT EXT][prelude] GM API response", {
      requestId: id,
      action: item.action,
      ok: false,
      error: errorMessage,
    });
    item.reject(new Error(errorMessage));
  }
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
  const payload = data.payload as AnyObject;
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
