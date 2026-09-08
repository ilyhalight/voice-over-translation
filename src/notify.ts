import type { GMNotificationOptions } from "@toil/gm-types/types/notification/index";
import { localizationProvider } from "./localization/localizationProvider";
import type { Phrase } from "./types/localization";
import debug from "./utils/debug";
import { getErrorMessage, isAbortError } from "./utils/errors";
import { getScriptTitle } from "./utils/gm";

type NotifySendOpts = {
  /**
   * Used to de-duplicate and rate-limit notifications.
   * If omitted, uses details.tag or details.title+details.text.
   */
  key?: string;
  /** Cooldown globalThis in ms for notifications with the same key */
  cooldownMs?: number;
};

type LocalizedErrorLike = {
  name?: unknown;
  localizedMessage?: unknown;
  unlocalizedMessage?: unknown;
};

function canSend(
  lastSentAt: Map<string, number>,
  key: string,
  cooldownMs: number,
): boolean {
  if (!cooldownMs) return true;
  const prev = lastSentAt.get(key) ?? 0;
  return Date.now() - prev >= cooldownMs;
}

function markSent(lastSentAt: Map<string, number>, key: string) {
  lastSentAt.set(key, Date.now());
}

function resolveLocalizedErrorFromObject(message: unknown): string | null {
  if (!message || typeof message !== "object") {
    return null;
  }

  const localizedError = message as LocalizedErrorLike;
  if (localizedError.name !== "VOTLocalizedError") {
    return null;
  }

  if (
    typeof localizedError.localizedMessage === "string" &&
    localizedError.localizedMessage.trim()
  ) {
    return localizedError.localizedMessage;
  }

  if (typeof localizedError.unlocalizedMessage === "string") {
    return localizationProvider.get(
      localizedError.unlocalizedMessage as Phrase,
    );
  }

  return null;
}

function resolveLocalizedErrorMessage(message: unknown): string {
  const localizedObjectMessage = resolveLocalizedErrorFromObject(message);
  if (localizedObjectMessage) return localizedObjectMessage;

  return localizationProvider.get(
    (getErrorMessage(message) || "requestTranslationFailed") as Phrase,
  );
}

function trySendViaUserscriptApi(details: GMNotificationOptions): boolean {
  try {
    // Important: many userscript managers expose GM_* as sandbox globals,
    // not as properties on globalThis/globalThis.
    if (typeof GM_notification === "function") {
      GM_notification(details);
      return true;
    }

    const gmApi = globalThis.GM;
    if (gmApi !== undefined && typeof gmApi.notification === "function") {
      const gmDetails: GMNotificationOptions = {
        text: details.text,
        title: details.title,
        image: details.image,
        onclick: details.onclick,
        ondone: details.ondone,
      };
      gmApi.notification(gmDetails);
      return true;
    }
  } catch (err) {
    debug.log("[notify] userscript api error", err);
  }

  return false;
}

/**
 * Notification helper with dedupe/rate-limit and safe fallbacks.
 */
export class Notifier {
  private readonly lastSentAt = new Map<string, number>();

  send(details: GMNotificationOptions, opts: NotifySendOpts = {}): void {
    try {
      const key =
        opts.key ||
        details.tag ||
        `${details.title ?? ""}|${details.text ?? ""}`;

      const cooldownMs = opts.cooldownMs ?? 0;
      if (!canSend(this.lastSentAt, key, cooldownMs)) return;

      // Always ensure we have a title for UIs that render it.
      const normalized: GMNotificationOptions = {
        ...details,
        title: details.title ?? getScriptTitle(),
      };

      const ok = trySendViaUserscriptApi(normalized);

      if (ok) {
        markSent(this.lastSentAt, key);
      } else {
        // Last resort: avoid alerts; just log.
        debug.log("[notify] unavailable", normalized);
      }
    } catch (err) {
      debug.log("[notify] send error", err);
    }
  }

  translationCompleted(host: string): void {
    const text = localizationProvider
      .get("VOTTranslationCompletedNotify")
      .replace("{0}", host);

    this.send(
      {
        text,
        title: getScriptTitle(),
        timeout: 5000,
        silent: true,
        tag: "VOTTranslationCompleted",
        onclick: () => {
          try {
            globalThis.focus();
          } catch {
            /* ignore */
          }
        },
      },
      { key: `translation_completed_${host}`, cooldownMs: 10_000 },
    );
  }

  translationFailed(params: { videoId?: string; message?: unknown }): void {
    const { videoId, message } = params;

    if (isAbortError(message)) return;

    const msg = resolveLocalizedErrorMessage(message);
    const title = getScriptTitle();

    this.send(
      {
        text: msg,
        title,
        timeout: 8000,
        silent: true,
        // Keep legacy tag casing so existing notification replacement/dedupe continues to work.
        tag: `VOTtranslationFailed_${videoId || "unknown"}`,
        onclick: () => {
          try {
            globalThis.focus();
          } catch {
            /* ignore */
          }
        },
      },
      // Errors can loop while polling; keep these non-spammy.
      { key: `translation_failed_${videoId || "unknown"}`, cooldownMs: 30_000 },
    );
  }
}
