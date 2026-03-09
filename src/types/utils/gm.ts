export type ResponseCacheOptions = {
  /**
   * Time-to-live in milliseconds.
   */
  ttlMs: number;
  /**
   * Optional explicit cache key.
   * When omitted, key is derived from method + url (+ body hash for text POST).
   */
  key?: string;
  /**
   * CacheStorage bucket name.
   */
  cacheName?: string;
  /**
   * Enable in-memory cache layer.
   * Defaults to `true`.
   */
  useMemory?: boolean;
  /**
   * Enable Cache API layer (GET only, when available).
   * Defaults to `true`.
   */
  useCacheApi?: boolean;
  /**
   * Deduplicate concurrent requests by cache key.
   * Defaults to `true`.
   */
  dedupe?: boolean;
  /**
   * Return stale cached value when network request fails.
   * Defaults to `true`.
   */
  allowStaleOnError?: boolean;
};

export type FetchOpts = RequestInit & {
  timeout?: number;
  forceGmXhr?: boolean;
  responseCache?: ResponseCacheOptions;
};
