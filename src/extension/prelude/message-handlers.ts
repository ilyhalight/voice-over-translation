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
import { installBridgeClient, isBridgeRestartError } from "./bridge-client";
import {
  armXhrFallbackWatchdog,
  extractXhrStatus,
  popPendingRequest,
  popXhrCallbacks,
  xhrCallbacks,
} from "./gm-polyfills";

export function wireMessageHandlers(): void {
  installBridgeClient();
  globalThis.addEventListener("message", (event) => {
    if (!isSameWindowBridgeEvent(event)) return;
    const data = event.data;
    if (!isOurMessage(data)) return;

    switch (data.type) {
      case TYPE_RES:
        handlePromiseResponse(data);
        break;
      case TYPE_XHR_ACK:
        handleXhrAck(data);
        break;
      case TYPE_XHR_EVENT:
        handleXhrEvent(data);
        break;
    }
  });
}

function handlePromiseResponse(data: AnyObject): void {
  const id = String(data.id ?? "");
  const item = popPendingRequest(id);
  if (!item) return;

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
}

function handleXhrAck(data: AnyObject): void {
  const requestId = String(data.requestId ?? "");
  const state = xhrCallbacks.get(requestId);
  if (!state || state.acknowledged) return;
  state.acknowledged = true;
  state.lastBridgeEventAt = Date.now();
  armXhrFallbackWatchdog(requestId, state);
  debug.log("[VOT EXT][prelude] XHR acknowledged", {
    requestId,
    state: "acknowledged",
    timeoutMs: state.timeoutMs,
    payload: data.payload ?? null,
  });
}

function handleXhrEvent(data: AnyObject): void {
  const requestId = String(data.requestId ?? "");
  const state = xhrCallbacks.get(requestId);
  if (!state) return;

  const callbacks = state.callbacks;
  const payload = data.payload;
  if (!payload || typeof payload !== "object") return;
  const kind = String(payload.type ?? "");

  debug.log("[VOT EXT][prelude] XHR event", {
    requestId,
    state: kind === "progress" ? "in_flight" : "terminal",
    kind,
    ...extractXhrStatus(payload.response ?? payload.error ?? payload.progress),
  });

  if (kind === "progress") {
    state.progressDelivered = true;
    state.acknowledged = true;
    state.lastBridgeEventAt = Date.now();
    armXhrFallbackWatchdog(requestId, state);
    callXhrCallback(callbacks.onprogress, payload.progress);
    return;
  }

  if (
    kind === "error" &&
    !state.progressDelivered &&
    typeof state.retryOnBridgeRestart === "function" &&
    isBridgeRestartError(payload) &&
    state.retryOnBridgeRestart(payload)
  ) {
    return;
  }

  if (
    kind === "load" ||
    kind === "error" ||
    kind === "timeout" ||
    kind === "abort"
  ) {
    // Remove the request before user code can re-enter or abort it.
    const terminalCallbacks = popXhrCallbacks(requestId);
    if (terminalCallbacks) {
      callXhrCallback(
        terminalCallbacks[`on${kind}`],
        kind === "load" ? payload.response : payload.error,
      );
    }
    return;
  }

  debug.warn("[VOT EXT][prelude] unexpected XHR bridge event", {
    requestId,
    kind,
    payload,
  });
}
