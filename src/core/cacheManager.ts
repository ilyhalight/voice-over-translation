import type { ClientSession, SessionModule } from "@vot.js/shared/types/secure";
import type {
  CacheSubtitle,
  CacheTranslationSuccess,
  CacheVideoById,
} from "../types/core/cacheManager";
import type { ResponseCacheOptions } from "../types/utils/gm";
import { votStorage } from "../utils/storage";
import { fnv1a32ToKeyPart } from "../utils/utils";

export const YANDEX_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const RESPONSE_CACHE_CREATED_AT_HEADER = "x-vot-cache-created-at";
const RESPONSE_CACHE_KEY_HEADER = "x-vot-cache-key";
const DEFAULT_RESPONSE_CACHE_NAME = "vot-http-cache-v1";
const MAX_MEMORY_CACHE_ENTRIES = 500;
const VOT_SESSION_STORAGE_KEY = "VOTSession";

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

type RequestCacheContext = {
  url: string;
  method?: string;
  body?: BodyInit | null;
};

type MemoryResponseCacheEntry = {
  expiresAt: number;
  response: Response;
};

type CacheReadResult = {
  fresh?: Response;
  stale?: Response;
  expiresAt?: number;
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

export { InMemoryCacheManager as CacheManager };

class ResponseCacheManager {
  private readonly memoryCache = new Map<string, MemoryResponseCacheEntry>();
  private readonly inFlightRequests = new Map<string, Promise<Response>>();

  async execute(
    context: RequestCacheContext,
    options: ResponseCacheOptions | undefined,
    fetcher: () => Promise<Response>,
  ): Promise<Response> {
    if (!options || options.ttlMs <= 0) {
      return fetcher();
    }

    const key = options.key ?? this.buildDefaultCacheKey(context);
    if (!key) {
      return fetcher();
    }

    const method = this.normalizeMethod(context.method);
    const ttlMs = options.ttlMs;
    const cacheName = options.cacheName || DEFAULT_RESPONSE_CACHE_NAME;
    const useMemory = options.useMemory !== false;
    const useCacheApi =
      options.useCacheApi !== false &&
      method === "GET" &&
      this.supportsCacheApi();
    const cacheApiKey = useCacheApi ? fnv1a32ToKeyPart(key) : "";
    const dedupe = options.dedupe !== false;
    const allowStaleOnError = options.allowStaleOnError !== false;
    const nowMs = Date.now();

    const staleFallback = await this.readCachedResponse({
      key,
      nowMs,
      useMemory,
      useCacheApi,
      cacheName,
      url: context.url,
      cacheApiKey,
      ttlMs,
      allowStaleOnError,
    });
    if (staleFallback.fresh) {
      return staleFallback.fresh;
    }

    if (!dedupe) {
      return await this.runNetworkRequestWithFallback(
        {
          key,
          cacheName,
          url: context.url,
          cacheApiKey,
          ttlMs,
          useMemory,
          useCacheApi,
        },
        fetcher,
        allowStaleOnError ? staleFallback.stale : undefined,
      );
    }

    const inFlight = this.inFlightRequests.get(key);
    if (inFlight !== undefined) {
      return (await inFlight).clone();
    }

    const networkPromise = this.runNetworkRequestWithFallback(
      {
        key,
        cacheName,
        url: context.url,
        cacheApiKey,
        ttlMs,
        useMemory,
        useCacheApi,
      },
      fetcher,
      allowStaleOnError ? staleFallback.stale?.clone() : undefined,
    );
    this.inFlightRequests.set(key, networkPromise);

    try {
      return (await networkPromise).clone();
    } finally {
      this.inFlightRequests.delete(key);
    }
  }

  private async readCachedResponse({
    key,
    nowMs,
    useMemory,
    useCacheApi,
    cacheName,
    url,
    cacheApiKey,
    ttlMs,
    allowStaleOnError,
  }: {
    key: string;
    nowMs: number;
    useMemory: boolean;
    useCacheApi: boolean;
    cacheName: string;
    url: string;
    cacheApiKey: string;
    ttlMs: number;
    allowStaleOnError: boolean;
  }): Promise<{ fresh?: Response; stale?: Response }> {
    let staleFallback: Response | undefined;

    if (useMemory) {
      const memoryHit = this.readMemoryCache(key, nowMs);
      if (memoryHit.fresh) {
        return { fresh: memoryHit.fresh };
      }
      staleFallback = memoryHit.stale;
    }

    if (!useCacheApi) {
      return { stale: staleFallback };
    }

    const cacheApiHit = await this.readCacheApi(
      cacheName,
      url,
      cacheApiKey,
      ttlMs,
      nowMs,
      allowStaleOnError,
    );
    if (cacheApiHit.fresh) {
      if (useMemory) {
        this.writeMemoryCache(
          key,
          cacheApiHit.fresh.clone(),
          cacheApiHit.expiresAt ?? nowMs + ttlMs,
        );
      }

      return { fresh: cacheApiHit.fresh };
    }

    return { stale: staleFallback ?? cacheApiHit.stale };
  }

  private async runNetworkRequestWithFallback(
    cacheConfig: {
      key: string;
      cacheName: string;
      url: string;
      cacheApiKey: string;
      ttlMs: number;
      useMemory: boolean;
      useCacheApi: boolean;
    },
    fetcher: () => Promise<Response>,
    staleFallback?: Response,
  ): Promise<Response> {
    try {
      return await this.runNetworkRequest(cacheConfig, fetcher);
    } catch (err) {
      if (staleFallback) {
        return staleFallback;
      }
      throw err;
    }
  }

  private async runNetworkRequest(
    {
      key,
      cacheName,
      url,
      cacheApiKey,
      ttlMs,
      useMemory,
      useCacheApi,
    }: {
      key: string;
      cacheName: string;
      url: string;
      cacheApiKey: string;
      ttlMs: number;
      useMemory: boolean;
      useCacheApi: boolean;
    },
    fetcher: () => Promise<Response>,
  ): Promise<Response> {
    const response = await fetcher();
    if (!response.ok) {
      return response;
    }

    const createdAtMs = Date.now();
    const expiresAt = this.computeExpiresAt(createdAtMs, ttlMs);

    if (useMemory) {
      this.writeMemoryCache(key, response.clone(), expiresAt);
    }
    if (useCacheApi) {
      const storable = this.toStorableResponse(response.clone(), createdAtMs);
      await this.writeCacheApi(cacheName, url, cacheApiKey, storable);
    }

    return response;
  }

  private computeExpiresAt(createdAtMs: number, ttlMs: number): number {
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      return createdAtMs;
    }
    const maxAdd = Number.MAX_SAFE_INTEGER - createdAtMs;
    if (ttlMs >= maxAdd) {
      return Number.MAX_SAFE_INTEGER;
    }
    return createdAtMs + ttlMs;
  }

  private normalizeMethod(method?: string): string {
    return (method || "GET").toUpperCase();
  }

  private resolveBodyKey(
    body: BodyInit | null | undefined,
  ): string | undefined {
    if (body == null) return "";
    if (typeof body === "string") return body;
    if (body instanceof URLSearchParams) return body.toString();
    return undefined;
  }

  private buildDefaultCacheKey(
    context: RequestCacheContext,
  ): string | undefined {
    const method = this.normalizeMethod(context.method);
    if (method === "GET") {
      return `${method}:${context.url}`;
    }

    const bodyKey = this.resolveBodyKey(context.body);
    if (bodyKey === undefined) return undefined;

    return `${method}:${context.url}#${fnv1a32ToKeyPart(bodyKey)}`;
  }

  private supportsCacheApi(): boolean {
    return typeof caches !== "undefined" && typeof caches.open === "function";
  }

  private readCreatedAtMs(response: Response): number | null {
    const raw = response.headers.get(RESPONSE_CACHE_CREATED_AT_HEADER);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  private ensureVaryByCacheKey(headers: Headers): void {
    const varyRaw = headers.get("vary");
    if (!varyRaw) {
      headers.set("vary", RESPONSE_CACHE_KEY_HEADER);
      return;
    }

    const varyParts = new Set(
      varyRaw.split(",").map((part) => part.trim().toLowerCase()),
    );
    if (!varyParts.has("*") && !varyParts.has(RESPONSE_CACHE_KEY_HEADER)) {
      headers.set("vary", `${varyRaw}, ${RESPONSE_CACHE_KEY_HEADER}`);
    }
  }

  private toStorableResponse(
    response: Response,
    createdAtMs: number,
  ): Response {
    const headers = new Headers(response.headers);
    headers.set(RESPONSE_CACHE_CREATED_AT_HEADER, String(createdAtMs));
    this.ensureVaryByCacheKey(headers);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  private readMemoryCache(key: string, nowMs: number): CacheReadResult {
    const entry = this.memoryCache.get(key);
    if (!entry) return {};

    if (entry.expiresAt > nowMs) {
      this.touchMemoryCache(key, entry);
      return {
        fresh: entry.response.clone(),
        expiresAt: entry.expiresAt,
      };
    }

    this.memoryCache.delete(key);
    return {
      stale: entry.response.clone(),
      expiresAt: entry.expiresAt,
    };
  }

  private touchMemoryCache(key: string, entry: MemoryResponseCacheEntry): void {
    this.memoryCache.delete(key);
    this.memoryCache.set(key, entry);
  }

  private trimMemoryCache(): void {
    while (this.memoryCache.size > MAX_MEMORY_CACHE_ENTRIES) {
      const first = this.memoryCache.keys().next().value;
      if (typeof first !== "string") break;
      this.memoryCache.delete(first);
    }
  }

  private writeMemoryCache(
    key: string,
    response: Response,
    expiresAt: number,
  ): void {
    if (this.memoryCache.has(key)) {
      this.memoryCache.delete(key);
    }
    this.memoryCache.set(key, {
      response,
      expiresAt,
    });
    this.trimMemoryCache();
  }

  private async readCacheApi(
    cacheName: string,
    url: string,
    cacheKey: string,
    ttlMs: number,
    nowMs: number,
    allowStaleOnError: boolean,
  ): Promise<CacheReadResult> {
    try {
      const request = new Request(url, {
        method: "GET",
        headers: {
          [RESPONSE_CACHE_KEY_HEADER]: cacheKey,
        },
      });
      const cache = await caches.open(cacheName);
      const cached = await cache.match(request);
      if (!cached) return {};

      const createdAtMs = this.readCreatedAtMs(cached);
      if (createdAtMs === null) {
        await cache.delete(request);
        return {};
      }

      const expiresAt = this.computeExpiresAt(createdAtMs, ttlMs);
      if (expiresAt > nowMs) {
        return {
          fresh: cached.clone(),
          expiresAt,
        };
      }

      if (!allowStaleOnError) {
        await cache.delete(request);
        return {};
      }

      const stale = cached.clone();
      await cache.delete(request);
      return {
        stale,
        expiresAt,
      };
    } catch {
      return {};
    }
  }

  private async writeCacheApi(
    cacheName: string,
    url: string,
    cacheKey: string,
    response: Response,
  ): Promise<void> {
    try {
      const request = new Request(url, {
        method: "GET",
        headers: {
          [RESPONSE_CACHE_KEY_HEADER]: cacheKey,
        },
      });
      const cache = await caches.open(cacheName);
      await cache.put(request, response);
    } catch {
      // ignore cache storage failures
    }
  }
}

const responseCacheManager = new ResponseCacheManager();

export async function executeWithResponseCache(
  context: RequestCacheContext,
  options: ResponseCacheOptions | undefined,
  fetcher: () => Promise<Response>,
): Promise<Response> {
  return responseCacheManager.execute(context, options, fetcher);
}
