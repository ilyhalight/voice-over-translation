import { type AnyObject, MARK, TYPE_XHR_EVENT } from "./constants";

type BridgeMarkedMessage = AnyObject & { [MARK]: true };

function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer;
}

function getTransferables(payload: AnyObject): Transferable[] {
  if (payload.type !== TYPE_XHR_EVENT) return [];

  const out: Transferable[] = [];
  const eventPayload = payload.payload as AnyObject | undefined;

  const progressChunk = eventPayload?.progress?.chunk;
  if (isArrayBuffer(progressChunk)) out.push(progressChunk);

  const responseBody = eventPayload?.response?.response;
  if (isArrayBuffer(responseBody) && responseBody !== progressChunk) {
    out.push(responseBody);
  }

  return out;
}

function markMessage(payload: AnyObject): BridgeMarkedMessage {
  return { [MARK]: true, ...payload };
}

export function toBridgeMessage(payload: AnyObject): BridgeMarkedMessage {
  return markMessage(payload);
}

export function toPageMessage(payload: AnyObject): {
  message: BridgeMarkedMessage;
  transfer: Transferable[];
} {
  const message = markMessage(payload);
  return {
    message,
    transfer: getTransferables(payload),
  };
}
