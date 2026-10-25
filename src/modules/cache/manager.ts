import type { ClientSession } from "@vot.js/shared/types/secure";
import { computeExpiresAt } from "#utils/responseCache.ts";
import { votStorage } from "#utils/storage.ts";
import { getTimestamp } from "#utils/utils.ts";
import type {
  CacheSubtitle,
  CacheTranslationSuccess,
  TimedCacheEntry,
  VOTSessionStorage,
  VOTSessions,
} from "./types";

const YANDEX_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const VOT_SESSION_STORAGE_KEY = "VOTSession";

function isClientSession(value: unknown): value is ClientSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    expires?: unknown;
    timestamp?: unknown;
    uuid?: unknown;
    secretKey?: unknown;
  };

  return (
    typeof candidate.expires === "number" &&
    Number.isFinite(candidate.expires) &&
    typeof candidate.timestamp === "number" &&
    Number.isFinite(candidate.timestamp) &&
    typeof candidate.uuid === "string" &&
    candidate.uuid.length > 0 &&
    typeof candidate.secretKey === "string" &&
    candidate.secretKey.length > 0
  );
}

function sanitizeVOTSessions(value: unknown): VOTSessions {
  if (!value || typeof value !== "object") {
    return {};
  }

  const now = getTimestamp();
  const entries = Object.entries(value).filter(
    ([, session]) =>
      isClientSession(session) && session.timestamp + session.expires > now,
  );

  return Object.fromEntries(entries) as VOTSessions;
}

function hasSessions(sessions: VOTSessions): boolean {
  return Object.keys(sessions).length > 0;
}

export class VOTSessionStorageCache {
  constructor(private readonly storage: VOTSessionStorage = votStorage) {}

  async restore(
    _host: string,
    currentSessions: VOTSessions = {},
  ): Promise<VOTSessions> {
    const storageKey = VOT_SESSION_STORAGE_KEY;
    const rawStoredSession = await this.storage.getRaw<unknown>(storageKey);
    const restoredSessions = sanitizeVOTSessions(rawStoredSession);
    if (!hasSessions(restoredSessions)) {
      if (rawStoredSession !== undefined) {
        await this.storage.deleteRaw(storageKey);
      }
      return currentSessions;
    }

    return {
      ...currentSessions,
      ...restoredSessions,
    };
  }

  async persist(
    _host: string,
    sessions: VOTSessions | undefined,
  ): Promise<void> {
    const storageKey = VOT_SESSION_STORAGE_KEY;
    // Merge with stored sessions so one client/tab doesn't wipe valid
    // sessions of other modules created elsewhere.
    const storedSessions = sanitizeVOTSessions(
      await this.storage.getRaw<unknown>(storageKey),
    );
    const sanitizedSessions = {
      ...storedSessions,
      ...sanitizeVOTSessions(sessions),
    };
    if (!hasSessions(sanitizedSessions)) {
      await this.storage.deleteRaw(storageKey);
      return;
    }

    await this.storage.setRaw(storageKey, sanitizedSessions);
  }
}

/** TTL cache keyed by stable keys built by VideoHandler. */
class InMemoryCacheManager {
  private readonly translations = new Map<
    string,
    TimedCacheEntry<CacheTranslationSuccess>
  >();
  private readonly subtitles = new Map<
    string,
    TimedCacheEntry<CacheSubtitle[]>
  >();

  /** Runtime settings changes can make cached translation URLs stale. */
  clear(): void {
    this.translations.clear();
    this.subtitles.clear();
  }

  getTranslation(key: string): CacheTranslationSuccess | undefined {
    return this.getFreshValue(this.translations, key);
  }

  setTranslation(key: string, translation: CacheTranslationSuccess): void {
    this.setFreshValue(this.translations, key, translation);
  }

  getSubtitles(key: string): CacheSubtitle[] | undefined {
    return this.getFreshValue(this.subtitles, key);
  }

  setSubtitles(key: string, subtitles: CacheSubtitle[]): void {
    this.setFreshValue(this.subtitles, key, subtitles);
  }

  deleteSubtitles(key: string): void {
    this.subtitles.delete(key);
  }

  private getFreshValue<T>(
    cache: Map<string, TimedCacheEntry<T>>,
    key: string,
  ): T | undefined {
    const entry = cache.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  private setFreshValue<T>(
    cache: Map<string, TimedCacheEntry<T>>,
    key: string,
    value: T,
  ): void {
    cache.set(key, {
      value,
      expiresAt: computeExpiresAt(Date.now(), YANDEX_TTL_MS),
    });
  }
}

export { InMemoryCacheManager as CacheManager };
