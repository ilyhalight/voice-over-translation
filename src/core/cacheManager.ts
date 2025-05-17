import {
  CacheSubtitle,
  CacheTranslation,
  CacheVideoById,
} from "../types/core/cacheManager";

export class CacheManager {
  cache: Map<string, unknown>;

  constructor() {
    this.cache = new Map();
  }

  get<T = unknown>(key: string) {
    return this.cache.get(key) as T;
  }

  set(key: string, value: unknown) {
    this.cache.set(key, value);
    return this;
  }

  delete(key: string) {
    this.cache.delete(key);
    return this;
  }

  getTranslation(key: string) {
    const entry = this.get<CacheVideoById | undefined>(key);
    return entry ? entry.translation : undefined;
  }

  setTranslation(key: string, translation: CacheTranslation) {
    const entry = this.get<CacheVideoById | undefined>(key) || {};
    entry.translation = translation;
    this.set(key, entry);
  }

  getSubtitles(key: string) {
    const entry = this.get<CacheVideoById | undefined>(key);
    return entry ? entry.subtitles : undefined;
  }

  setSubtitles(key: string, subtitles: CacheSubtitle[]) {
    const entry = this.get<CacheVideoById | undefined>(key) || {};
    entry.subtitles = subtitles;
    this.set(key, entry);
  }

  deleteSubtitles(key: string) {
    const entry = this.get<CacheVideoById | undefined>(key);
    if (entry) {
      entry.subtitles = undefined;
      this.set(key, entry);
    }
  }
}
