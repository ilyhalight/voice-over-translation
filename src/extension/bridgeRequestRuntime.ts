import type { AnyObject } from "./constants";
import { ext } from "./webext";

export const GM_STORAGE_MESSAGE_TYPE = "gm_storage";

async function sendRuntimeMessage<T = unknown>(message: AnyObject): Promise<T> {
  const sendMessage = ext?.runtime?.sendMessage;
  if (typeof sendMessage !== "function") {
    throw new TypeError("runtime.sendMessage is not available");
  }

  return await new Promise<T>((resolve, reject) => {
    try {
      const maybePromise = sendMessage(message, (response: unknown) => {
        const runtimeError =
          (
            globalThis as {
              chrome?: { runtime?: { lastError?: { message?: string } } };
            }
          ).chrome?.runtime?.lastError?.message ?? null;
        if (runtimeError) {
          reject(new Error(runtimeError));
          return;
        }

        resolve(response as T);
      });

      if (
        maybePromise &&
        typeof (maybePromise as Promise<T>).then === "function"
      ) {
        void (maybePromise as Promise<T>).then(resolve, reject);
      }
    } catch (error) {
      reject(error);
    }
  });
}

async function requestStorage(
  action: string,
  payload: AnyObject,
): Promise<unknown> {
  const response = await sendRuntimeMessage<{
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
