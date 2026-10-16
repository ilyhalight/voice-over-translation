import {
  BG_MSG_TELEMETRY_CONSENT,
  isOurMessage,
  TYPE_REQ,
  TYPE_RES,
} from "./shared/constants";
import {
  getSameWindowPostMessageTargetOrigin,
  isSameWindowBridgeEvent,
  toBridgeMessage,
} from "./shared/transport";

const CONSENT_REQUEST_TIMEOUT_MS = 15_000;

export function requestTelemetryConsent(): Promise<boolean> {
  return new Promise((resolve) => {
    const id = crypto.randomUUID();
    const finish = (allowed: boolean) => {
      clearTimeout(timeoutId);
      globalThis.removeEventListener("message", onMessage);
      resolve(allowed);
    };
    const onMessage = (event: MessageEvent) => {
      if (!isSameWindowBridgeEvent(event)) return;
      const data = event.data;
      if (!isOurMessage(data) || data.type !== TYPE_RES || data.id !== id) {
        return;
      }
      finish(data.ok === true && data.result === true);
    };
    const timeoutId = setTimeout(
      () => finish(false),
      CONSENT_REQUEST_TIMEOUT_MS,
    );

    globalThis.addEventListener("message", onMessage);
    try {
      globalThis.postMessage(
        toBridgeMessage({
          type: TYPE_REQ,
          id,
          action: BG_MSG_TELEMETRY_CONSENT,
        }),
        getSameWindowPostMessageTargetOrigin(),
      );
    } catch {
      finish(false);
    }
  });
}
