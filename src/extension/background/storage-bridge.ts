import { browser } from "wxt/browser";
import { toErrorMessage } from "#utils/errors.ts";
import { BG_MSG_STORAGE } from "../shared/constants";
import { sendBridgeResponse } from "../shared/utils";

type GmStorageMessage = {
  type: string;
  action?: string;
  payload?: Record<string, unknown>;
};

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
      const def = payload?.def;
      const items = await browser.storage.local.get(key);
      return Object.hasOwn(items, key) ? items[key] : def;
    }

    case "gm_setValue": {
      const key = normalizeStorageRequestKey(payload?.key);
      await browser.storage.local.set({ [key]: payload?.value });
      return true;
    }

    case "gm_deleteValue": {
      const key = normalizeStorageRequestKey(payload?.key);
      await browser.storage.local.remove(key);
      return true;
    }

    case "gm_listValues": {
      const items = await browser.storage.local.get(null);
      return Object.keys(items);
    }

    case "gm_getValues": {
      const defaults = (payload?.defaults ?? {}) as Record<string, unknown>;
      return await browser.storage.local.get(defaults);
    }

    default:
      throw new Error(`Unknown storage action: ${action}`);
  }
}

export function registerBackgroundStorageBridge(): void {
  browser.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
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
          error: toErrorMessage(error),
        });
      }
    })();

    return true;
  });
}
