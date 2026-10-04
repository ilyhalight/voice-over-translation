import type { BaseProviderType } from "@toil/translate/types";
import { toErrorMessage } from "#utils/errors.ts";
import { GM_fetch } from "#utils/gm.ts";
import { votStorage } from "#utils/storage.ts";
import {
  DEFAULT_DETECT_SERVICE,
  DEFAULT_TRANSLATION_SERVICE,
  DETECT_RUST_SERVER_URL,
  DETECT_SERVICES,
  FOSWLY_TRANSLATE_URL,
  TRANSLATE_TEXT_SERVICES,
} from "./consts";
import type { FOSWLYErrorResponse, TranslateTextService } from "./types";

/**
 * Short enough that a settings change applies almost immediately,
 * long enough to skip storage reads during retry/error bursts
 */
const SETTINGS_CACHE_TTL_MS = 5_000;

/**
 * GET: cached until evicted, results are immutable.
 * POST: not stored, but needs ttlMs > 0 to keep in-flight deduplication
 */
const IMMUTABLE_LOOKUP_CACHE_TTL_MS = Number.MAX_SAFE_INTEGER;

function createCachedSetting<T extends string>(
  key: "translationService" | "detectService",
  allowed: readonly T[],
  fallback: T,
) {
  let value: T | null = null;
  let cachedAt = 0;

  return async (): Promise<T> => {
    const now = Date.now();
    if (value && now - cachedAt < SETTINGS_CACHE_TTL_MS) {
      return value;
    }

    const stored = await votStorage.get(key, fallback);
    value = allowed.includes(stored as T) ? (stored as T) : fallback;
    cachedAt = now;
    return value;
  };
}

const getTranslationService = createCachedSetting(
  "translationService",
  TRANSLATE_TEXT_SERVICES,
  DEFAULT_TRANSLATION_SERVICE,
);
const getDetectService = createCachedSetting(
  "detectService",
  DETECT_SERVICES,
  DEFAULT_DETECT_SERVICE,
);

const isFOSWLYError = <T extends object>(
  data: T | FOSWLYErrorResponse,
): data is FOSWLYErrorResponse => {
  return Object.hasOwn(data, "error");
};

/**
 * Limit: 10k symbols for yandex, 50k for msedge
 */
const FOSWLYTranslateAPI = new (class {
  async request<T extends object>(
    path: string,
    opts: Record<string, unknown> = {},
  ) {
    try {
      const res = await GM_fetch(`${FOSWLY_TRANSLATE_URL}${path}`, {
        timeout: 3000,
        responseCache: {
          ttlMs: IMMUTABLE_LOOKUP_CACHE_TTL_MS,
          cacheName: "vot-foswly-api-v1",
          allowStaleOnError: true,
        },
        ...opts,
      });

      const data = (await res.json()) as T | FOSWLYErrorResponse;
      if (isFOSWLYError<T>(data)) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error(
        `[VOT] Failed to get data from FOSWLY Translate API, because ${toErrorMessage(
          error,
        )}`,
      );
      return undefined;
    }
  }

  async translateMultiple(
    text: string[],
    lang: string,
    service: TranslateTextService,
  ) {
    const result = await this.request<BaseProviderType.TranslationResponse>(
      "/translate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          lang,
          service,
        }),
      },
    );

    return result ? result.translations : text;
  }

  async translate(text: string, lang: string, service: TranslateTextService) {
    const result = await this.request<BaseProviderType.TranslationResponse>(
      `/translate?${new URLSearchParams({
        text,
        lang,
        service,
      })}`,
    );

    return result ? result.translations[0] : text;
  }

  async detect(text: string, service: TranslateTextService) {
    const result = await this.request<BaseProviderType.DetectResponse>(
      `/detect?${new URLSearchParams({
        text,
        service,
      })}`,
    );

    return result ? result.lang : "en";
  }
})();

const RustServerAPI = {
  async detect(text: string) {
    try {
      const response = await GM_fetch(DETECT_RUST_SERVER_URL, {
        method: "POST",
        body: text,
        timeout: 3000,
        responseCache: {
          ttlMs: IMMUTABLE_LOOKUP_CACHE_TTL_MS,
          cacheName: "vot-rust-detect-v1",
          allowStaleOnError: true,
        },
      });

      return await response.text();
    } catch (error) {
      console.error(
        `[VOT] Error getting lang from text, because ${toErrorMessage(error)}`,
      );
      return "en";
    }
  },
};

export async function translate(
  text: string | string[],
  fromLang = "",
  toLang = "ru",
) {
  if (fromLang && toLang && fromLang === toLang) {
    return text;
  }

  const service = await getTranslationService();
  switch (service) {
    case "yandexbrowser":
    case "msedge": {
      const langPair = fromLang && toLang ? `${fromLang}-${toLang}` : toLang;
      return Array.isArray(text)
        ? await FOSWLYTranslateAPI.translateMultiple(text, langPair, service)
        : await FOSWLYTranslateAPI.translate(text, langPair, service);
    }
    default:
      return text;
  }
}

export async function detect(text: string) {
  const service = await getDetectService();
  switch (service) {
    case "yandexbrowser":
    case "msedge":
      return await FOSWLYTranslateAPI.detect(text, service);
    case "rust-server":
      return await RustServerAPI.detect(text);
    default:
      return "en";
  }
}
