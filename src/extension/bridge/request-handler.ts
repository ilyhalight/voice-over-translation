import {
  type AnyObject,
  BG_MSG_STORAGE,
  BG_MSG_TELEMETRY_CONSENT,
} from "../shared/constants";
import { ext, runtimeSendMessage } from "../shared/webext";

export async function handleBridgeRequest(
  action: string,
  payload: AnyObject,
): Promise<unknown> {
  switch (action) {
    case BG_MSG_TELEMETRY_CONSENT: {
      const response = await runtimeSendMessage<{
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
    case "gm_getValues": {
      const response = await runtimeSendMessage<{
        ok?: boolean;
        result?: unknown;
        error?: string;
      }>({
        type: BG_MSG_STORAGE,
        action,
        payload,
      });

      if (!response?.ok) {
        throw new Error(response?.error || `Storage request failed: ${action}`);
      }

      return response.result;
    }
    default:
      throw new Error(`Unknown bridge action: ${action}`);
  }
}
