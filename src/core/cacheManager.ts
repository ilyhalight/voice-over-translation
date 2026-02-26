import type {
  CacheSubtitle,
  CacheTranslationSuccess,
  CacheVideoById,
} from "../types/core/cacheManager";

export const YANDEX_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

type CacheField = "translation" | "subtitles";
type CacheExpiryField = "translationExpiresAt" | "subtitlesExpiresAt";

type CacheValueByField = {
  translation: CacheTranslationSuccess;
  subtitles: CacheSubtitle[];
};

const EXPIRY_FIELD_BY_FIELD: Record<CacheField, CacheExpiryField> = {
  translation: "translationExpiresAt",
  subtitles: "subtitlesExpiresAt",
};

/**
 * Small in-memory cache with TTL for both translations and subtitles.
 *
 * The cache is keyed by a stable key built by VideoHandler.
 */
export class CacheManager {
  private readonly cache = new Map<string, CacheVideoById>();

  /**
   * Clears all cached entries.
   *
   * Used when runtime settings change (e.g. proxy mode/host), because cached
   * translation URLs and especially previous failures can become stale.
   */
  clear(): void {
    this.cache.clear();
  }

  getTranslation(key: string): CacheTranslationSuccess | undefined {
    return this.getValue(key, "translation");
  }

  setTranslation(key: string, translation: CacheTranslationSuccess): void {
    this.setValue(key, "translation", translation);
  }

  getSubtitles(key: string): CacheSubtitle[] | undefined {
    return this.getValue(key, "subtitles");
  }

  setSubtitles(key: string, subtitles: CacheSubtitle[]): void {
    this.setValue(key, "subtitles", subtitles);
  }

  deleteSubtitles(key: string): void {
    this.deleteValue(key, "subtitles");
  }

  private getValue<K extends CacheField>(
    key: string,
    field: K,
  ): CacheValueByField[K] | undefined {
    const now = Date.now();
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const expiryField = EXPIRY_FIELD_BY_FIELD[field];
    const expiresAt = entry[expiryField];
    if (expiresAt !== undefined && expiresAt <= now) {
      entry[field] = undefined;
      entry[expiryField] = undefined;
      this.evictIfEmpty(key, entry);
      return undefined;
    }

    return entry[field] as CacheValueByField[K] | undefined;
  }

  private setValue<K extends CacheField>(
    key: string,
    field: K,
    value: CacheValueByField[K],
  ): void {
    const now = Date.now();

    const entry = this.getOrCreateEntry(key);
    const expiresAt = now + YANDEX_TTL_MS;
    const expiryField = EXPIRY_FIELD_BY_FIELD[field];

    entry[field] = value as CacheVideoById[K];
    entry[expiryField] = expiresAt;
  }

  private deleteValue(key: string, field: CacheField): void {
    const entry = this.cache.get(key);
    if (!entry) return;

    const expiryField = EXPIRY_FIELD_BY_FIELD[field];
    entry[field] = undefined;
    entry[expiryField] = undefined;
    this.evictIfEmpty(key, entry);
  }

  private evictIfEmpty(key: string, entry: CacheVideoById): void {
    if (entry.translation === undefined && entry.subtitles === undefined) {
      this.cache.delete(key);
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
