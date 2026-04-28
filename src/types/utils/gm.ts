export type ResponseCacheOptions = {
  /**
   * Time-to-live in milliseconds.
   * Cache API storage applies to GET requests only; other methods use in-flight
   * request deduplication when enabled.
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
  /**
   * Control redirect behavior for GM_xhr.
   * "follow" - automatically follow redirects (default)
   * "manual" - return 302 response with Location header
   * "error" - throw error on redirect
   */
  redirect?: "follow" | "manual" | "error";
};
