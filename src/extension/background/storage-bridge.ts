import { storageKeys } from "../../types/storage";
import { BG_MSG_STORAGE } from "../shared/constants";
import { asErrorMessage, sendBridgeResponse } from "../shared/utils";
import { ext, storageGet, storageRemove, storageSet } from "../shared/webext";

type GmStorageMessage = {
  type: string;
  action?: string;
  payload?: Record<string, unknown>;
};

// SECURITY: allowlist of storage keys the page's MAIN-world polyfill may
// read/write. Without this, any page script (including third-party ads) could
// call `GM.setValue("account", {token: ...})` to overwrite the Yandex auth
// token with an attacker-controlled value, or `GM.getValue("account")` to
// exfiltrate it.
const ALLOWED_STORAGE_KEYS: ReadonlySet<string> = new Set(storageKeys);

function isAllowedStorageKey(key: string): boolean {
  return ALLOWED_STORAGE_KEYS.has(key);
}

function isGmStorageMessage(msg: unknown): msg is GmStorageMessage {
  if (!msg || typeof msg !== "object") return false;
  return (msg as { type?: unknown }).type === BG_MSG_STORAGE;
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
      if (!isAllowedStorageKey(key)) {
        throw new Error(
          `VOT storage bridge blocked getValue for non-allowlisted key: ${key}`,
        );
      }
      const def = payload?.def;
      const items = await storageGet<Record<string, unknown>>(key);
      return Object.hasOwn(items, key) ? items[key] : def;
    }

    case "gm_setValue": {
      const key = normalizeStorageRequestKey(payload?.key);
      if (!isAllowedStorageKey(key)) {
        throw new Error(
          `VOT storage bridge blocked setValue for non-allowlisted key: ${key}`,
        );
      }
      await storageSet({ [key]: payload?.value });
      return true;
    }

    case "gm_deleteValue": {
      const key = normalizeStorageRequestKey(payload?.key);
      if (!isAllowedStorageKey(key)) {
        throw new Error(
          `VOT storage bridge blocked deleteValue for non-allowlisted key: ${key}`,
        );
      }
      await storageRemove(key);
      return true;
    }

    case "gm_listValues": {
      const items = await storageGet<Record<string, unknown>>(null);
      // Filter out any keys that are not in the allowlist (defensive).
      const all = Object.keys(items ?? {});
      return all.filter((k) => isAllowedStorageKey(k));
    }

    case "gm_getValues": {
      const defaults = (payload?.defaults ?? {}) as Record<string, unknown>;
      // Filter defaults to allowlisted keys only.
      const filtered: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(defaults)) {
        if (isAllowedStorageKey(k)) filtered[k] = v;
      }
      return await storageGet(filtered);
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
