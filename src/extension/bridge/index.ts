import debug from "../../utils/debug";
import {
  type AnyObject,
  type BridgeWireMessage,
  isOurMessage,
  TYPE_NOTIFY,
  TYPE_REQ,
  TYPE_RES,
  TYPE_XHR_ABORT,
  TYPE_XHR_START,
} from "../shared/constants";
import { toPageMessage } from "../shared/transport";
import { ext } from "../shared/webext";
import { handleBridgeRequest } from "./request-handler";
import { abortBridgeXhr, startBridgeXhr } from "./xhr-bridge";

const BRIDGE_BOOT_KEY = "__VOT_EXT_BRIDGE_BOOTED__";

function injectPageModule(fileName: string): void {
  const parent = document.head ?? document.documentElement;
  if (!parent) {
    console.error("[VOT Extension] bridge: missing document root");
    return;
  }

  const script = document.createElement("script");
  script.type = "module";
  script.src = ext.runtime?.getURL(fileName);
  script.addEventListener(
    "error",
    () => {
      console.error(`[VOT Extension] bridge: failed to inject ${fileName}`);
    },
    { once: true },
  );
  parent.appendChild(script);
}

function postToPage(payload: AnyObject) {
  const { message, transfer } = toPageMessage(payload);
  const targetOrigin = globalThis.location.origin;
  if (transfer.length) {
    globalThis.postMessage(message, targetOrigin, transfer);
    return;
  }
  globalThis.postMessage(message, targetOrigin);
}

function sendResponse(
  id: string,
  ok: boolean,
  result?: unknown,
  error?: string,
) {
  postToPage({ type: TYPE_RES, id, ok, result, error });
}

function bootstrapExtensionBridge(): void {
  const bridgeGlobal = globalThis as Record<string, unknown>;
  if (bridgeGlobal[BRIDGE_BOOT_KEY]) {
    debug.log("[VOT EXT][bridge] already initialized");
    return;
  }

  bridgeGlobal[BRIDGE_BOOT_KEY] = true;

  if (!ext?.runtime || !ext?.storage?.local) {
    console.warn("[VOT Extension] bridge: missing WebExtension APIs");
    return;
  }

  // In CRXJS builds, prelude and content are injected as MAIN world
  // content scripts via the manifest — no manual injection needed.
  if (typeof __CRXJS_BUILD__ === "undefined" || !__CRXJS_BUILD__) {
    injectPageModule("prelude.module.js");
    injectPageModule("content.module.js");
  }

  globalThis.addEventListener("message", async (event) => {
    if (event.source !== globalThis.window) return;
    if (event.origin !== globalThis.location.origin) return;
    const data = event.data as BridgeWireMessage;
    if (!isOurMessage(data)) return;

    try {
      if (data.type === TYPE_REQ) {
        const id = String(data.id ?? "");
        const action = String(data.action ?? "");
        const payload = data.payload ?? {};
        const result = await handleBridgeRequest(action, payload);
        sendResponse(id, true, result);
        return;
      }

      if (data.type === TYPE_NOTIFY) {
        ext?.runtime?.sendMessage?.({
          type: "gm_notification",
          details: data.details,
        });
        return;
      }

      if (data.type === TYPE_XHR_START) {
        await startBridgeXhr(String(data.requestId ?? ""), data.details ?? {});
        return;
      }

      if (data.type === TYPE_XHR_ABORT) {
        abortBridgeXhr(String(data.requestId ?? ""));
        return;
      }
    } catch (err: unknown) {
      if (data?.type === TYPE_REQ) {
        sendResponse(
          String(data.id ?? ""),
          false,
          undefined,
          err instanceof Error ? err.message : String(err),
        );
      } else {
        console.error("[VOT Extension] bridge error", err);
      }
    }
  });
}

bootstrapExtensionBridge();
