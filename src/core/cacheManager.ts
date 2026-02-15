import type {
  CacheSubtitle,
  CacheTranslationSuccess,
  CacheVideoById,
} from "../types/core/cacheManager";

export const YANDEX_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Small in-memory cache with TTL for both translations and subtitles.
 *
 * The cache is keyed by a stable key built by VideoHandler.
 */
export class CacheManager {
  private readonly cache = new Map<string, CacheVideoById>();
  private lastCleanupAt = 0;

  /**
   * Clears all cached entries.
   *
   * Used when runtime settings change (e.g. proxy mode/host), because cached
   * translation URLs and especially previous failures can become stale.
   */
  clear(): void {
    this.cache.clear();
    this.lastCleanupAt = 0;
  }

  getTranslation(key: string): CacheTranslationSuccess | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const exp = entry.translationExpiresAt;
    if (exp !== undefined && exp <= Date.now()) {
      entry.translation = undefined;
      entry.translationExpiresAt = undefined;
      this.evictIfEmpty(key, entry);
      return undefined;
    }

    return entry.translation;
  }

  setTranslation(key: string, translation: CacheTranslationSuccess): void {
    this.maybeCleanup();
    const entry = this.getOrCreateEntry(key);
    entry.translation = translation;
    entry.translationExpiresAt = Date.now() + YANDEX_TTL_MS;
  }

  getSubtitles(key: string): CacheSubtitle[] | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const exp = entry.subtitlesExpiresAt;
    if (exp !== undefined && exp <= Date.now()) {
      entry.subtitles = undefined;
      entry.subtitlesExpiresAt = undefined;
      this.evictIfEmpty(key, entry);
      return undefined;
    }

    return entry.subtitles;
  }

  setSubtitles(key: string, subtitles: CacheSubtitle[]): void {
    this.maybeCleanup();
    const entry = this.getOrCreateEntry(key);
    entry.subtitles = subtitles;
    entry.subtitlesExpiresAt = Date.now() + YANDEX_TTL_MS;
  }

  deleteSubtitles(key: string): void {
    const entry = this.cache.get(key);
    if (!entry) return;
    entry.subtitles = undefined;
    entry.subtitlesExpiresAt = undefined;
    this.evictIfEmpty(key, entry);
  }

  private evictIfEmpty(key: string, entry: CacheVideoById): void {
    if (entry.translation === undefined && entry.subtitles === undefined) {
      this.cache.delete(key);
    }
  }

  private maybeCleanup(): void {
    const now = Date.now();
    // Cleanup at most once per minute to keep overhead low.
    if (now - this.lastCleanupAt < 60_000) return;
    this.lastCleanupAt = now;

    for (const [key, entry] of this.cache) {
      if (
        entry.translationExpiresAt !== undefined &&
        entry.translationExpiresAt <= now
      ) {
        entry.translation = undefined;
        entry.translationExpiresAt = undefined;
      }
      if (
        entry.subtitlesExpiresAt !== undefined &&
        entry.subtitlesExpiresAt <= now
      ) {
        entry.subtitles = undefined;
        entry.subtitlesExpiresAt = undefined;
      }
      this.evictIfEmpty(key, entry);
    }
  }

  private getOrCreateEntry(key: string): CacheVideoById {
    const existing = this.cache.get(key);
    if (existing) return existing;
    const entry: CacheVideoById = {};
    this.cache.set(key, entry);
    return entry;
  }
}
