import type { ResponseCacheOptions } from "../types/utils/gm";
import { fnv1a32ToKeyPart } from "./utils";

const RESPONSE_CACHE_CREATED_AT_HEADER = "x-vot-cache-created-at";
const RESPONSE_CACHE_KEY_HEADER = "x-vot-cache-key";
const DEFAULT_RESPONSE_CACHE_NAME = "vot-http-cache-v1";

type RequestCacheContext = {
  url: string;
  method?: string;
  body?: BodyInit | null;
};

type CacheReadResult = {
  fresh?: Response;
  stale?: Response;
  expiresAt?: number;
};

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
    let response: Response;
    try {
      response = await fetcher();
    } catch (err) {
      if (staleFallback) {
        return staleFallback;
      }
      throw err;
    }

    if (!response.ok) {
      return response;
    }

    if (cacheConfig.useCacheApi) {
      const createdAtMs = Date.now();
      const storable = this.toStorableResponse(response.clone(), createdAtMs);
      await this.writeCacheApi(
        cacheConfig.cacheName,
        cacheConfig.url,
        cacheConfig.cacheApiKey,
        storable,
      );
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

export { computeExpiresAt };
