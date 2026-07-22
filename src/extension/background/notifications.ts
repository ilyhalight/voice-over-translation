import debug from "../../utils/debug";
import { BG_MSG_NOTIFICATION } from "../shared/constants";
import { asErrorMessage, sendBridgeResponse } from "../shared/utils";
import {
  ext,
  notificationsClear,
  notificationsCreate,
  tabsUpdate,
  windowsUpdate,
} from "../shared/webext";

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
  type: string;
  details?: unknown;
};

const FIREFOX_NOTIFICATION_ICON_PATH = "icons/icon-128.png";
const CHROME_NOTIFICATION_ICON_PATH = "src/extension/icons/icon-128.png";

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

function createBridgeNotificationId(sender: GmNotificationSender): string {
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

function isFirefoxRuntime(): boolean {
  return (
    typeof (ext?.runtime as { getBrowserInfo?: unknown })?.getBrowserInfo ===
    "function"
  );
}

function resolveNotificationIconUrl(): string {
  const isFirefox = isFirefoxRuntime();
  const iconPath = isFirefox
    ? FIREFOX_NOTIFICATION_ICON_PATH
    : CHROME_NOTIFICATION_ICON_PATH;

  // Firefox examples use a fully-qualified moz-extension:// URL, while Chrome's
  // notification API explicitly allows paths relative to the packaged .crx.
  // The two build pipelines package icons in different locations:
  //   - Firefox: icons/icon-128.png
  //   - Chrome/CRXJS: src/extension/icons/icon-128.png
  // Keep the path runtime-specific so a Firefox fix does not break Chrome.
  if (isFirefox && ext?.runtime?.getURL) {
    return ext.runtime.getURL(iconPath);
  }
  return iconPath;
}

function createBridgeNotificationOptions(
  details: GmNotificationDetails,
): Record<string, unknown> {
  const isFirefox = isFirefoxRuntime();

  const options: Record<string, unknown> = {
    type: "basic",
    iconUrl: resolveNotificationIconUrl(),
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
