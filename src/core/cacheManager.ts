import type { ClientSession, SessionModule } from "@vot.js/shared/types/secure";
import type {
  CacheSubtitle,
  CacheTranslationSuccess,
} from "../types/core/cacheManager";
import { computeExpiresAt } from "../utils/responseCache";
import { votStorage } from "../utils/storage";

export const YANDEX_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const VOT_SESSION_STORAGE_KEY = "VOTSession";

type TimedCacheEntry<T> = {
  expiresAt: number;
  value: T;
};

type VOTSessions = Partial<Record<SessionModule, ClientSession>>;
type VOTSessionStorage = Pick<
  typeof votStorage,
  "getRaw" | "setRaw" | "deleteRaw"
>;

function getCurrentUnixTimestampSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

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

  const now = getCurrentUnixTimestampSeconds();
  const entries = Object.entries(value as Record<string, unknown>).flatMap(
    ([module, session]) => {
      if (!isClientSession(session)) {
        return [];
      }

      if (session.timestamp + session.expires <= now) {
        return [];
      }

      return [[module as SessionModule, session] as const];
    },
  );

  return Object.fromEntries(entries) as VOTSessions;
}

function hasSessions(sessions: VOTSessions): boolean {
  return Object.keys(sessions).length > 0;
}

export class VOTSessionStorageCache {
  constructor(private readonly storage: VOTSessionStorage = votStorage) {}

  private getStorageKey(): string {
    return VOT_SESSION_STORAGE_KEY;
  }

  async restore(
    _host: string,
    currentSessions: VOTSessions = {},
  ): Promise<VOTSessions> {
    const storageKey = this.getStorageKey();
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
    const storageKey = this.getStorageKey();
    const sanitizedSessions = sanitizeVOTSessions(sessions);
    if (!hasSessions(sanitizedSessions)) {
      await this.storage.deleteRaw(storageKey);
      return;
    }

    await this.storage.setRaw(storageKey, sanitizedSessions);
  }
}

/**
 * Small in-memory cache with TTL for both translations and subtitles.
 *
 * The cache is keyed by a stable key built by VideoHandler.
 */
class InMemoryCacheManager {
  private readonly translations = new Map<
    string,
    TimedCacheEntry<CacheTranslationSuccess>
  >();
  private readonly subtitles = new Map<
    string,
    TimedCacheEntry<CacheSubtitle[]>
  >();

  /**
   * Clears all cached entries.
   *
   * Used when runtime settings change (e.g. proxy mode/host), because cached
   * translation URLs and especially previous failures can become stale.
   */
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
