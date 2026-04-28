import { asErrorMessage, sendBridgeResponse } from "./bridgeUtils";
import { ext, storageGet, storageRemove, storageSet } from "./webext";

type GmStorageMessage = {
  type: "gm_storage";
  action?: string;
  payload?: Record<string, unknown>;
};

function isGmStorageMessage(msg: unknown): msg is GmStorageMessage {
  if (!msg || typeof msg !== "object") return false;
  return (msg as { type?: unknown }).type === "gm_storage";
}

function normalizeStorageRequestKey(value: unknown): string {
  switch (typeof value) {
    case "string":
      return value;
    case "number":
    case "boolean":
    case "bigint":
      return String(value);
    default:
      return "";
  }
}

async function handleStorageRequest(
  action: string,
  payload: Record<string, unknown> | undefined,
): Promise<unknown> {
  switch (action) {
    case "gm_getValue": {
      const key = normalizeStorageRequestKey(payload?.key);
      const def = payload?.def;
      const items = await storageGet<Record<string, unknown>>(key);
      return Object.hasOwn(items, key) ? items[key] : def;
    }

    case "gm_setValue": {
      const key = normalizeStorageRequestKey(payload?.key);
      await storageSet({ [key]: payload?.value });
      return true;
    }

    case "gm_deleteValue": {
      const key = normalizeStorageRequestKey(payload?.key);
      await storageRemove(key);
      return true;
    }

    case "gm_listValues": {
      const items = await storageGet<Record<string, unknown>>(null);
      return Object.keys(items ?? {});
    }

    case "gm_getValues": {
      const defaults = (payload?.defaults ?? {}) as Record<string, unknown>;
      return await storageGet(defaults);
    }

    default:
      throw new Error(`Unknown storage action: ${action}`);
  }
}

export function registerBackgroundStorageBridge(): void {
  ext?.runtime?.onMessage?.addListener?.(
    (
      msg: unknown,
      _sender: unknown,
      sendResponse: ((value: unknown) => void) | undefined,
    ) => {
      if (!isGmStorageMessage(msg)) return;

      void (async () => {
        try {
          const result = await handleStorageRequest(
            String(msg.action ?? ""),
            msg.payload,
          );
          sendBridgeResponse(sendResponse, { ok: true, result });
        } catch (error) {
          sendBridgeResponse(sendResponse, {
            ok: false,
            error: asErrorMessage(error),
          });
        }
      })();

      return true;
    },
  );
}
