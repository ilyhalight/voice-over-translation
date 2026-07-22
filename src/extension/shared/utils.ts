import { toErrorMessage } from "../../utils/errors";

export function asErrorMessage(err: unknown): string {
  return toErrorMessage(err);
}
export function callXhrCallback(fn: unknown, arg: unknown): void {
  try {
    if (typeof fn === "function") {
      fn(arg);
    }
  } catch (err) {
    console.error("[VOT Extension] GM_xmlhttpRequest callback error", err);
  }
}

export function sendBridgeResponse(
  sendResponse: ((value: unknown) => void) | undefined,
  payload: unknown,
): void {
  if (typeof sendResponse !== "function") return;
  try {
    sendResponse(payload);
  } catch {
    // ignore
  }
}
