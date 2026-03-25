import debug from "../utils/debug";
import {
  ext,
  notificationsClear,
  notificationsCreate,
  tabsUpdate,
  windowsUpdate,
} from "./webext";

type GmNotificationSender = {
  tab?: {
    id?: number;
    windowId?: number;
  };
};

type GmNotificationDetails = {
  title: string;
  text: string;
  silent: boolean;
  timeout: number;
};

type GmNotificationMessage = {
  type: "gm_notification";
  details?: unknown;
};

function asErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    try {
      return JSON.stringify(err);
    } catch {
      return Object.prototype.toString.call(err);
    }
  }
  try {
    return String(err);
  } catch {
    return "Unknown error";
  }
}

function sendBridgeResponse(
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

export function isGmNotificationMessage(
  msg: unknown,
): msg is GmNotificationMessage {
  if (!msg || typeof msg !== "object") return false;
  return (msg as { type?: unknown }).type === "gm_notification";
}

export function normalizeGmNotificationDetails(
  details: unknown,
): GmNotificationDetails {
  const raw =
    details && typeof details === "object"
      ? (details as Record<string, unknown>)
      : {};

  const timeoutRaw = Number(raw.timeout ?? 0);
  return {
    title: raw.title != null ? String(raw.title) : "",
    text: raw.text != null ? String(raw.text) : "",
    silent: Boolean(raw.silent),
    timeout: Number.isFinite(timeoutRaw) && timeoutRaw > 0 ? timeoutRaw : 0,
  };
}

export function createBridgeNotificationId(
  sender: GmNotificationSender,
): string {
  const tabId = sender.tab?.id;
  const windowId = sender.tab?.windowId;

  const safeTab = typeof tabId === "number" ? tabId : -1;
  const safeWin = typeof windowId === "number" ? windowId : -1;

  const nonce =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}:${Math.random().toString(36).slice(2)}`;

  return `vot:${safeTab}:${safeWin}:${nonce}`;
}

export function createBridgeNotificationOptions(
  details: GmNotificationDetails,
): Record<string, unknown> {
  const isFirefox =
    typeof (ext?.runtime as { getBrowserInfo?: unknown })?.getBrowserInfo ===
    "function";
  const iconUrl = ext?.runtime?.getURL
    ? ext.runtime.getURL("icons/icon-128.png")
    : "icons/icon-128.png";

  const options: Record<string, unknown> = {
    type: "basic",
    iconUrl,
    title: details.title || "VOT",
    message: details.text,
  };
  if (!isFirefox) {
    options.silent = details.silent;
  }
  return options;
}

export function registerBackgroundNotifications(): void {
  ext?.runtime?.onMessage?.addListener?.(
    (
      msg: unknown,
      sender: GmNotificationSender,
      sendResponse: ((value: unknown) => void) | undefined,
    ) => {
      if (!isGmNotificationMessage(msg)) return;

      const details = normalizeGmNotificationDetails(msg.details);
      const notificationId = createBridgeNotificationId(sender);
      const options = createBridgeNotificationOptions(details);

      void (async () => {
        try {
          await notificationsCreate(notificationId, options);

          if (details.timeout > 0) {
            setTimeout(() => {
              void notificationsClear(notificationId);
            }, details.timeout);
          }

          sendBridgeResponse(sendResponse, { ok: true });
        } catch (error) {
          debug.error(
            "[VOT EXT][background] Failed to create notification",
            error,
          );
          sendBridgeResponse(sendResponse, {
            ok: false,
            error: asErrorMessage(error),
          });
        }
      })();

      return true;
    },
  );

  ext?.notifications?.onClicked?.addListener?.((notificationId: string) => {
    if (!notificationId.startsWith("vot:")) return;
    const parts = notificationId.split(":");
    if (parts.length < 3) return;

    const tabId = Number(parts[1]);
    const windowId = Number(parts[2]);

    if (Number.isFinite(windowId) && windowId >= 0) {
      void windowsUpdate(windowId, { focused: true });
    }

    if (Number.isFinite(tabId) && tabId >= 0) {
      void tabsUpdate(tabId, { active: true });
    }
  });
}
