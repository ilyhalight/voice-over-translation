import type { ClientSession, SessionModule } from "@vot.js/shared/types/secure";
import type {
  CacheSubtitle,
  CacheTranslationSuccess,
} from "../types/core/cacheManager";
import type { ResponseCacheOptions } from "../types/utils/gm";
import { votStorage } from "../utils/storage";
import { fnv1a32ToKeyPart } from "../utils/utils";

export const YANDEX_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const RESPONSE_CACHE_CREATED_AT_HEADER = "x-vot-cache-created-at";
const RESPONSE_CACHE_KEY_HEADER = "x-vot-cache-key";
const DEFAULT_RESPONSE_CACHE_NAME = "vot-http-cache-v1";
const VOT_SESSION_STORAGE_KEY = "VOTSession";

type RequestCacheContext = {
  url: string;
  method?: string;
  body?: BodyInit | null;
};

type TimedCacheEntry<T> = {
  expiresAt: number;
  value: T;
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

function computeExpiresAt(createdAtMs: number, ttlMs: number): number {
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
    return createdAtMs;
  }

  const maxAdd = Number.MAX_SAFE_INTEGER - createdAtMs;
  return ttlMs >= maxAdd ? Number.MAX_SAFE_INTEGER : createdAtMs + ttlMs;
}

function normalizeMethod(method?: string): string {
  return (method || "GET").toUpperCase();
}

function resolveBodyKey(body: BodyInit | null | undefined): string | undefined {
  if (body == null) return "";
  if (typeof body === "string") return body;
  if (body instanceof URLSearchParams) return body.toString();
  return undefined;
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

class ResponseCacheManager {
  private readonly inFlightRequests = new Map<string, Promise<Response>>();

  async execute(
    context: RequestCacheContext,
    options: ResponseCacheOptions | undefined,
    fetcher: () => Promise<Response>,
  ): Promise<Response> {
    if (!options || options.ttlMs <= 0) {
      return fetcher();
    }

    const method = normalizeMethod(context.method);
    const key = options.key ?? this.buildDefaultCacheKey(context);
    if (!key) {
      return fetcher();
    }

    const ttlMs = options.ttlMs;
    const cacheName = options.cacheName || DEFAULT_RESPONSE_CACHE_NAME;
    const useCacheApi =
      options.useCacheApi !== false &&
      method === "GET" &&
      this.supportsCacheApi();
    const cacheApiKey = useCacheApi ? fnv1a32ToKeyPart(key) : "";
    const dedupe = options.dedupe !== false;
    const allowStaleOnError = options.allowStaleOnError !== false;

    const cached = useCacheApi
      ? await this.readCacheApi(
          cacheName,
          context.url,
          cacheApiKey,
          ttlMs,
          Date.now(),
          allowStaleOnError,
        )
      : {};
    if (cached.fresh) {
      return cached.fresh;
    }

    const networkRequest = () =>
      this.runNetworkRequestWithFallback(
        {
          cacheName,
          url: context.url,
          cacheApiKey,
          useCacheApi,
        },
        fetcher,
        allowStaleOnError ? cached.stale : undefined,
      );

    if (!dedupe) {
      return await networkRequest();
    }

    const inFlight = this.inFlightRequests.get(key);
    if (inFlight !== undefined) {
      return (await inFlight).clone();
    }

    const networkPromise = networkRequest();
    this.inFlightRequests.set(key, networkPromise);

    try {
      return (await networkPromise).clone();
    } finally {
      this.inFlightRequests.delete(key);
    }
  }

  private async runNetworkRequestWithFallback(
    cacheConfig: {
      cacheName: string;
      url: string;
      cacheApiKey: string;
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
      cacheName,
      url,
      cacheApiKey,
      useCacheApi,
    }: {
      cacheName: string;
      url: string;
      cacheApiKey: string;
      useCacheApi: boolean;
    },
    fetcher: () => Promise<Response>,
  ): Promise<Response> {
    const response = await fetcher();
    if (!response.ok) {
      return response;
    }

    const createdAtMs = Date.now();

    if (useCacheApi) {
      const storable = this.toStorableResponse(response.clone(), createdAtMs);
      await this.writeCacheApi(cacheName, url, cacheApiKey, storable);
    }

    return response;
  }

  private buildDefaultCacheKey(
    context: RequestCacheContext,
  ): string | undefined {
    const method = normalizeMethod(context.method);
    if (method === "GET") {
      return `${method}:${context.url}`;
    }

    const bodyKey = resolveBodyKey(context.body);
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

      const expiresAt = computeExpiresAt(createdAtMs, ttlMs);
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
