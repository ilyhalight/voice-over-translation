import { type AnyObject, BG_MSG_TELEMETRY_CONSENT } from "../shared/constants";
import { ext, runtimeSendMessage } from "../shared/webext";

const GM_STORAGE_MESSAGE_TYPE = "gm_storage";

async function sendBridgeRuntimeMessage<T = unknown>(
  message: AnyObject,
): Promise<T> {
  return await runtimeSendMessage<T>(message);
}

async function requestStorage(
  action: string,
  payload: AnyObject,
): Promise<unknown> {
  const response = await sendBridgeRuntimeMessage<{
    ok?: boolean;
    result?: unknown;
    error?: string;
  }>({
    type: GM_STORAGE_MESSAGE_TYPE,
    action,
    payload,
  });

  if (!response?.ok) {
    throw new Error(response?.error || `Storage request failed: ${action}`);
  }

  return response.result;
}

export async function handleBridgeRequest(
  action: string,
  payload: AnyObject,
): Promise<unknown> {
  switch (action) {
    case BG_MSG_TELEMETRY_CONSENT: {
      const response = await sendBridgeRuntimeMessage<{
        ok?: boolean;
        result?: unknown;
      }>({ type: BG_MSG_TELEMETRY_CONSENT });
      return response?.ok === true && response.result === true;
    }
    case "handshake": {
      const manifest = ext?.runtime?.getManifest?.() ?? {};
      const id = ext?.runtime?.id ?? null;
      return { manifest, id };
    }
    case "gm_getValue":
    case "gm_setValue":
    case "gm_deleteValue":
    case "gm_listValues":
    case "gm_getValues":
      return await requestStorage(action, payload);
    default:
      throw new Error(`Unknown bridge action: ${action}`);
  }
}
