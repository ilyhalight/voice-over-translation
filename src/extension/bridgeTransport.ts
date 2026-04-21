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
