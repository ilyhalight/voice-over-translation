import { type Browser, browser } from "wxt/browser";
import { toErrorMessage } from "#utils/errors.ts";
import { EXT_NAME_FALLBACK } from "../../config/config";
import debug from "../../utils/debug";
import { BG_MSG_NOTIFICATION } from "../shared/constants";
import { sendBridgeResponse } from "../shared/utils";

type GmNotificationDetails = {
  title: string;
  text: string;
  silent: boolean;
  timeout: number;
};

type GmNotificationMessage = {
  type: string;
  details?: unknown;
};

// Copied from src/public/icons to /icons in the extension build output.
const NOTIFICATION_ICON_PATH = "/icons/icon-128.png";

function isGmNotificationMessage(msg: unknown): msg is GmNotificationMessage {
  if (!msg || typeof msg !== "object") return false;
  return (msg as { type?: unknown }).type === BG_MSG_NOTIFICATION;
}

function normalizeGmNotificationDetails(
  details: unknown,
): GmNotificationDetails {
  const raw =
    details && typeof details === "object"
      ? (details as Record<string, unknown>)
      : {};

  const timeoutRaw = Number(raw.timeout ?? 0);
  return {
    title: typeof raw.title === "string" ? raw.title : "",
    text: typeof raw.text === "string" ? raw.text : "",
    silent: Boolean(raw.silent),
    timeout: Number.isFinite(timeoutRaw) && timeoutRaw > 0 ? timeoutRaw : 0,
  };
}

function createBridgeNotificationId(
  sender: Browser.runtime.MessageSender,
): string {
  const tabId = sender.tab?.id;
  const windowId = sender.tab?.windowId;

  const safeTab = typeof tabId === "number" ? tabId : -1;
  const safeWin = typeof windowId === "number" ? windowId : -1;

  return `vot:${safeTab}:${safeWin}:${crypto.randomUUID()}`;
}

function createBridgeNotificationOptions(
  details: GmNotificationDetails,
): Browser.notifications.NotificationCreateOptions {
  const options: Browser.notifications.NotificationCreateOptions = {
    type: "basic",
    // Chrome requires iconUrl for "basic"; both browsers resolve the absolute
    // extension URL from runtime.getURL.
    iconUrl: browser.runtime.getURL(NOTIFICATION_ICON_PATH),
    title: details.title || EXT_NAME_FALLBACK,
    message: details.text,
  };
  if (!import.meta.env.FIREFOX) {
    options.silent = details.silent;
  }
  return options;
}

// Chrome 106–115 only support callbacks here; Firefox uses promises.
async function notificationsCreate(
  notificationId: string,
  options: Browser.notifications.NotificationCreateOptions,
): Promise<void> {
  if (import.meta.env.FIREFOX) {
    await browser.notifications.create(notificationId, options);
    return;
  }
  await new Promise<void>((resolve, reject) => {
    browser.notifications.create(notificationId, options, () => {
      const error = browser.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve();
    });
  });
}

async function notificationsClear(notificationId: string): Promise<void> {
  if (import.meta.env.FIREFOX) {
    await browser.notifications.clear(notificationId);
    return;
  }
  await new Promise<void>((resolve) => {
    browser.notifications.clear(notificationId, () => {
      void browser.runtime.lastError;
      resolve();
    });
  });
}

export function registerBackgroundNotifications(): void {
  browser.runtime.onMessage.addListener(
    (msg, sender: Browser.runtime.MessageSender, sendResponse) => {
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
            error: toErrorMessage(error),
          });
        }
      })();

      return true;
    },
  );

  browser.notifications.onClicked.addListener((notificationId) => {
    if (!notificationId.startsWith("vot:")) return;
    const parts = notificationId.split(":");
    if (parts.length < 3) return;

    const tabId = Number(parts[1]);
    const windowId = Number(parts[2]);

    if (Number.isFinite(windowId) && windowId >= 0) {
      void browser.windows.update(windowId, { focused: true });
    }

    if (Number.isFinite(tabId) && tabId >= 0) {
      void browser.tabs.update(tabId, { active: true });
    }
  });
}
