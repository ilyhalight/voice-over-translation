import { toErrorMessage } from "#utils/errors.ts";
import logger from "#utils/logger.ts";
import debug from "../../utils/debug";
import {
  BG_MSG_NOTIFICATION,
  type BridgeWireMessage,
  isOurMessage,
  TYPE_NOTIFY,
  TYPE_REQ,
  TYPE_RES,
  TYPE_XHR_ABORT,
  TYPE_XHR_START,
} from "../shared/constants";
import { browser } from "wxt/browser";
import { isSameWindowBridgeEvent, postToPage } from "../shared/transport";
import {
  assertExtensionContext,
  isExtensionContextValid,
  runtimeSendMessage,
} from "../shared/webext";
import {
  type BridgeLifecycle,
  createBridgeLifecycle,
  formatBridgeRestartError,
} from "./lifecycle";
import { handleBridgeRequest } from "./request-handler";
import {
  abortBridgeXhr,
  failAllBridgeXhrs,
  rejectBridgeXhr,
  startBridgeXhr,
} from "./xhr-bridge";

// Re-injections reuse a live bridge in this world; lifecycle retires other worlds.
const BRIDGE_INSTANCE_KEY = "__VOT_EXT_BRIDGE__instance";

type IncomingBridgeMessage = Extract<
  BridgeWireMessage,
  {
    type:
      | typeof TYPE_REQ
      | typeof TYPE_NOTIFY
      | typeof TYPE_XHR_START
      | typeof TYPE_XHR_ABORT;
  }
>;

function isIncomingBridgeMessage(
  data: BridgeWireMessage,
): data is IncomingBridgeMessage {
  return (
    data.type === TYPE_REQ ||
    data.type === TYPE_NOTIFY ||
    data.type === TYPE_XHR_START ||
    data.type === TYPE_XHR_ABORT
  );
}

function getLiveBridgeInstance(): BridgeLifecycle | null {
  const candidate = (globalThis as Record<string, unknown>)[
    BRIDGE_INSTANCE_KEY
  ] as Partial<BridgeLifecycle> | undefined;
  if (!candidate || typeof candidate.isAlive !== "function") return null;
  try {
    return candidate.isAlive() ? (candidate as BridgeLifecycle) : null;
  } catch {
    return null;
  }
}

function sendResponse(
  id: string,
  ok: boolean,
  result?: unknown,
  error?: string,
) {
  postToPage({ type: TYPE_RES, id, ok, result, error });
}

function handleBridgeMessageError(
  lifecycle: BridgeLifecycle,
  data: IncomingBridgeMessage,
  err: unknown,
): void {
  // Retire first so the page sees DOWN before the restart error and retries
  // through the next bridge instead of this orphan.
  const contextLost = lifecycle.retireIfContextLost(err);
  const detail = toErrorMessage(err);
  const message = contextLost ? formatBridgeRestartError(detail) : detail;

  switch (data.type) {
    case TYPE_REQ:
      sendResponse(String(data.id ?? ""), false, undefined, message);
      return;
    case TYPE_XHR_START:
      rejectBridgeXhr(
        String(data.requestId ?? ""),
        data.details ?? {},
        message,
      );
      return;
    default:
      if (contextLost) {
        debug.log("[VOT EXT][bridge] dropped message: context invalidated", {
          type: data.type,
        });
        return;
      }
      logger.error("[VOT Extension] bridge error", err);
  }
}

async function handlePageMessage(
  lifecycle: BridgeLifecycle,
  event: MessageEvent,
): Promise<void> {
  if (!lifecycle.isAlive()) return;
  if (!isSameWindowBridgeEvent(event)) return;
  const data = event.data as BridgeWireMessage;
  if (!isOurMessage(data) || !isIncomingBridgeMessage(data)) return;

  try {
    // An orphan can receive a message before its lifecycle port notices.
    assertExtensionContext();
    switch (data.type) {
      case TYPE_REQ: {
        const id = String(data.id ?? "");
        const action = String(data.action ?? "");
        const payload = data.payload ?? {};
        const result = await handleBridgeRequest(action, payload);
        sendResponse(id, true, result);
        return;
      }
      case TYPE_NOTIFY: {
        void runtimeSendMessage({
          type: BG_MSG_NOTIFICATION,
          details: data.details,
        }).catch((error: unknown) => {
          if (lifecycle.retireIfContextLost(error)) return;
          debug.warn("[VOT EXT][bridge] notification dispatch failed", error);
        });
        return;
      }
      case TYPE_XHR_START: {
        // startBridgeXhr reports its own failures as XHR error events.
        await startBridgeXhr(String(data.requestId ?? ""), data.details ?? {});
        lifecycle.retireIfContextLost();
        return;
      }
      case TYPE_XHR_ABORT: {
        abortBridgeXhr(String(data.requestId ?? ""));
      }
    }
  } catch (err: unknown) {
    handleBridgeMessageError(lifecycle, data, err);
  }
}

function bootstrapExtensionBridge(): void {
  const previous = getLiveBridgeInstance();
  if (previous) {
    debug.log("[VOT EXT][bridge] already initialized", {
      instanceId: previous.instanceId,
    });
    return;
  }

  if (!browser?.runtime || !browser.storage?.local) {
    logger.warn("[VOT Extension] bridge: missing WebExtension APIs");
    return;
  }

  if (!isExtensionContextValid()) {
    debug.warn("[VOT EXT][bridge] extension context invalidated, not booting");
    return;
  }

  const lifecycle = createBridgeLifecycle();
  (globalThis as Record<string, unknown>)[BRIDGE_INSTANCE_KEY] = lifecycle;
  lifecycle.onRetire((reason) => {
    debug.log("[VOT EXT][bridge] retired", {
      instanceId: lifecycle.instanceId,
      reason,
    });
    failAllBridgeXhrs(reason);
  });

  globalThis.addEventListener(
    "message",
    (event) => {
      void handlePageMessage(lifecycle, event);
    },
    { signal: lifecycle.signal },
  );

  lifecycle.start();
}

bootstrapExtensionBridge();
