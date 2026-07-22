import { type AnyObject, MARK, TYPE_XHR_EVENT } from "./constants";

type BridgeMarkedMessage = AnyObject & { [MARK]: true };

function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer;
}

function getTransferables(payload: AnyObject): Transferable[] {
  if (payload.type !== TYPE_XHR_EVENT) return [];

  const eventPayload = payload.payload as AnyObject | undefined;
  const progressChunk = eventPayload?.progress?.chunk;
  const responseBody = eventPayload?.response?.response;

  if (!isArrayBuffer(progressChunk)) {
    return isArrayBuffer(responseBody) ? [responseBody] : [];
  }

  if (!isArrayBuffer(responseBody) || responseBody === progressChunk) {
    return [progressChunk];
  }

  return [progressChunk, responseBody];
}

export function toBridgeMessage(payload: AnyObject): BridgeMarkedMessage {
  // Always force the marker at the final write position.
  return { ...payload, [MARK]: true };
}

export function getSameWindowPostMessageTargetOrigin(): string {
  const origin = globalThis.location?.origin;

  // Opaque origins (about:blank, about:srcdoc, sandboxed frames) expose
  // location.origin as "null". That string is not a valid postMessage
  // target origin, so the only valid target is "*". The bridge still
  // verifies event.source and the private marker before accepting messages.
  return !origin || origin === "null" ? "*" : origin;
}

export function isSameWindowBridgeEvent(event: MessageEvent): boolean {
  if (event.source !== globalThis.window) return false;

  const origin = globalThis.location?.origin;
  if (!origin || origin === "null") {
    return event.origin === "null" || event.origin === origin;
  }

  return event.origin === origin;
}

export function toPageMessage(payload: AnyObject): {
  message: BridgeMarkedMessage;
  transfer: Transferable[];
} {
  const message = toBridgeMessage(payload);
  return {
    message,
    transfer: getTransferables(payload),
  };
}
