import { localizationProvider } from "../localization/localizationProvider";
import type { Phrase } from "../types/localization";
import debug from "./debug";
import { getErrorMessage, isAbortError } from "./errors";

export type NotifyDetails = {
  text: string;
  title?: string;
  timeout?: number;
  silent?: boolean;
  tag?: string;
  onclick?: () => void;
  image?: string;
  ondone?: () => void;
};

// Userscript globals are injected by the manager at runtime.
// Declare them so TS builds don't complain, and so we can reference them
// directly (many managers don't attach them to globalThis/globalThis).
declare const GM_notification:
  | undefined
  | ((details: any, ondone?: (() => void) | undefined) => void);
declare const GM:
  | undefined
  | {
      notification?: (details: any) => void;
    };
declare const GM_info:
  | undefined
  | {
      script?: {
        name?: string;
      };
    };

type NotifySendOpts = {
  /**
   * Used to de-duplicate and rate-limit notifications.
   * If omitted, uses details.tag or details.title+details.text.
   */
  key?: string;
  /** Cooldown globalThis in ms for notifications with the same key */
  cooldownMs?: number;
};

const now = () => Date.now();

function getScriptTitle(): string {
  return GM_info?.script?.name || "VOT";
}

function safeL10n(key: Phrase, fallback: string): string {
  try {
    const value = localizationProvider?.get?.(key);
    return value || fallback;
  } catch {
    return fallback;
  }
}

function canSend(
  lastSentAt: Map<string, number>,
  key: string,
  cooldownMs: number,
): boolean {
  if (!cooldownMs) return true;
  const prev = lastSentAt.get(key) ?? 0;
  return now() - prev >= cooldownMs;
}

function markSent(lastSentAt: Map<string, number>, key: string) {
  lastSentAt.set(key, now());
}

function trySendViaUserscriptApi(details: NotifyDetails): boolean {
  try {
    // Tampermonkey / Violentmonkey: legacy GM_notification.
    // Important: many userscript managers expose GM_* as sandbox globals,
    // not as properties on globalThis/globalThis.
    if (typeof GM_notification === "function") {
      GM_notification(details);
      return true;
    }

    // Greasemonkey 4+ / Violentmonkey: GM.notification.
    // Greasemonkey's API documents only a small option set (text/title/image/onclick/ondone),
    // so avoid passing extra properties like tag/timeout/silent.
    const gmApi = (globalThis as typeof globalThis & { GM?: typeof GM }).GM;
    if (gmApi !== undefined && typeof gmApi.notification === "function") {
      const gmDetails = {
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

  send(details: NotifyDetails, opts: NotifySendOpts = {}): void {
    try {
      const key =
        opts.key ||
        details.tag ||
        `${details.title ?? ""}|${details.text ?? ""}`;

      const cooldownMs = opts.cooldownMs ?? 0;
      if (!canSend(this.lastSentAt, key, cooldownMs)) return;

      // Always ensure we have a title for UIs that render it.
      const normalized: NotifyDetails = {
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
    const text = safeL10n(
      "VOTTranslationCompletedNotify",
      "The translation on the {0} has been completed!",
    ).replace("{0}", host);

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

    const msg = getErrorMessage(message) || "Translation failed";
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
