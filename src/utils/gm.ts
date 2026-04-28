type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "CONNECT"
  | "TRACE";

import { executeWithResponseCache } from "../core/cacheManager";
import type { FetchOpts } from "../types/utils/gm";
import { createTimeoutSignal } from "./abort";
import { browserInfo } from "./browserInfo";
import debug from "./debug";
import { getErrorMessage, isAbortError, makeAbortError } from "./errors";
import { getHeaders } from "./utils";

const YANDEX_API_HOST = "api.browser.yandex.ru";
const GOOGLEVIDEO_HOST_SUFFIX = "googlevideo.com";
const HEADER_LINE_RE = /^([\w-]+):\s*(.+)$/;
// Matches statusText reason-phrase: printable ASCII except control chars
const URL_SCHEME_RE = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

type RequestUrlLike = string | URL | Request;
type GmXhrResponse = {
  finalUrl?: string;
  response?: Blob | null;
  responseHeaders?: string;
  status?: number;
  statusText?: string;
};
type GmXhrCallbackApi = (
  details: Record<string, unknown>,
) => { abort?: () => void } | undefined;
type GmXhrPromiseApi = (
  details: Record<string, unknown>,
) => Promise<GmXhrResponse> & { abort?: () => void };

const scriptHandler =
  typeof GM_info === "undefined" ? undefined : GM_info?.scriptHandler;

function getCallbackGmXhr(): GmXhrCallbackApi | undefined {
  const gmXhr =
    typeof GM_xmlhttpRequest === "undefined"
      ? (globalThis as any).GM_xmlhttpRequest
      : GM_xmlhttpRequest;

  return typeof gmXhr === "function" ? gmXhr : undefined;
}

function getPromiseGmXhr(): GmXhrPromiseApi | undefined {
  const gm = typeof GM === "undefined" ? (globalThis as any).GM : GM;
  const gmXhr = gm?.xmlHttpRequest ?? gm?.xmlhttpRequest;

  return typeof gmXhr === "function" ? gmXhr.bind(gm) : undefined;
}

function hasSupportedGmXhr(): boolean {
  return !!(getCallbackGmXhr() || getPromiseGmXhr());
}

export const isProxyOnlyExtension =
  !(typeof IS_EXTENSION !== "undefined" && IS_EXTENSION) &&
  (browserInfo.browser?.name === "Safari" ||
    !["Tampermonkey", "Violentmonkey"].includes(scriptHandler));
export const isSupportGM4 =
  typeof GM !== "undefined" || (globalThis as any).GM !== undefined;
export const isSupportGMXhr = hasSupportedGmXhr();

function getRequestHost(url: string): string | undefined {
  const normalizedUrl = url.trim();
  try {
    return new URL(normalizedUrl).hostname.toLowerCase();
  } catch {
    if (!URL_SCHEME_RE.test(normalizedUrl)) {
      try {
        return new URL(`https://${normalizedUrl}`).hostname.toLowerCase();
      } catch {}
    }
    return undefined;
  }
}

function isHostOrSubdomain(host: string, targetHost: string): boolean {
  return host === targetHost || host.endsWith(`.${targetHost}`);
}

function shouldUseGmXhr(
  host: string | undefined,
  url: string,
  forceGmXhr = false,
): boolean {
  if (forceGmXhr) {
    return true;
  }

  if (!host) {
    const lowerUrl = url.toLowerCase();
    return (
      lowerUrl.includes(YANDEX_API_HOST) ||
      lowerUrl.includes(GOOGLEVIDEO_HOST_SUFFIX)
    );
  }

  return (
    isHostOrSubdomain(host, YANDEX_API_HOST) ||
    isHostOrSubdomain(host, GOOGLEVIDEO_HOST_SUFFIX)
  );
}

function toRequestUrl(url: RequestUrlLike): string {
  if (typeof url === "string") {
    return url;
  }
  if (url instanceof URL) {
    return url.href;
  }
  return url.url;
}

function resolveRequestMethod(url: RequestUrlLike, method?: string): string {
  if (method) {
    return method.toUpperCase();
  }
  if (url instanceof Request) {
    return (url.method || "GET").toUpperCase();
  }
  return "GET";
}

function parseResponseHeaders(rawHeaders: unknown): Record<string, string> {
  if (typeof rawHeaders !== "string" || rawHeaders.length === 0) {
    return {};
  }

  return rawHeaders
    .split(/\r?\n/)
    .reduce<Record<string, string>>((acc, line) => {
      const headerMatch = HEADER_LINE_RE.exec(line);
      if (!headerMatch) {
        return acc;
      }
      const [, key, value] = headerMatch;
      acc[key] = value;
      return acc;
    }, {});
}

function getGmXhrErrorMessage(error: unknown): string {
  const maybeError = error as {
    error?: unknown;
    statusText?: unknown;
  };
  if (
    typeof maybeError?.error === "string" &&
    maybeError.error.trim().length > 0
  ) {
    return maybeError.error;
  }
  if (
    typeof maybeError?.statusText === "string" &&
    maybeError.statusText.trim().length > 0 &&
    maybeError.statusText !== '""' &&
    maybeError.statusText !== "''"
  ) {
    return maybeError.statusText;
  }

  return getErrorMessage(error) || "Unknown GM XHR error";
}

function buildResponse(resp: GmXhrResponse, urlStr: string): Response {
  const status = resp.status;
  const statusText = typeof resp.statusText === "string" ? resp.statusText : "";
  const body = resp.response instanceof Blob ? resp.response : null;
  const responseHeaders = parseResponseHeaders(resp.responseHeaders);

  const response = new Response(body, {
    status,
    statusText,
    headers: responseHeaders,
  });

  Object.defineProperty(response, "url", {
    value: resp.finalUrl ?? urlStr,
  });

  return response;
}

async function executeCallbackGmXhr(
  gmXhr: GmXhrCallbackApi,
  urlStr: string,
  timeout: number,
  fetchOptions: Omit<FetchOpts, "timeout">,
  method: string,
  headers: Record<string, string>,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let onAbort: (() => void) | undefined;

    const cleanupAbort = () => {
      if (onAbort) {
        fetchOptions.signal?.removeEventListener("abort", onAbort);
      }
    };

    const failOnce = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanupAbort();
      reject(error);
    };

    const redirectMode = fetchOptions.redirect;
    const request = gmXhr({
      method: method as HttpMethod,
      url: urlStr,
      responseType: "blob" as any,
      data: fetchOptions.body as any,
      timeout,
      headers,
      ...(redirectMode && { redirect: redirectMode }),
      onload: (resp: GmXhrResponse) => {
        if (settled) return;
        settled = true;
        cleanupAbort();

        try {
          const response = buildResponse(resp, urlStr);
          debug.log("[GM_fetch] GM_xmlhttpRequest completed", {
            url: response.url,
            method,
            status: response.status,
            statusText: response.statusText,
          });
          resolve(response);
        } catch (buildErr) {
          // Constructing Response failed even after sanitization — surface error
          debug.warn("[GM_fetch] GM_xmlhttpRequest response build failed", {
            url: urlStr,
            method,
            error: getErrorMessage(buildErr),
            rawStatus: resp.status,
            rawStatusText: resp.statusText,
          });
          reject(
            buildErr instanceof Error
              ? buildErr
              : new Error(getErrorMessage(buildErr)),
          );
        }
      },
      ontimeout: () => {
        debug.warn("[GM_fetch] GM_xmlhttpRequest timed out", {
          url: urlStr,
          method,
          timeout,
        });
        failOnce(new Error("Timeout"));
      },
      onerror: (error: unknown) => {
        // Safari can deliver an empty-string error — fall back to generic message
        const message = getGmXhrErrorMessage(error);
        debug.warn("[GM_fetch] GM_xmlhttpRequest failed", {
          url: urlStr,
          method,
          error: message,
        });
        failOnce(new Error(message));
      },
      onabort: () => {
        debug.warn("[GM_fetch] GM_xmlhttpRequest aborted", {
          url: urlStr,
          method,
        });
        failOnce(makeAbortError());
      },
    });

    onAbort = () => {
      try {
        request?.abort?.();
      } catch {}
      failOnce(makeAbortError());
    };

    if (fetchOptions.signal) {
      fetchOptions.signal.addEventListener("abort", onAbort, { once: true });
      if (fetchOptions.signal.aborted) {
        onAbort();
        return;
      }
    }
  });
}

async function executePromiseGmXhr(
  gmXhr: GmXhrPromiseApi,
  urlStr: string,
  timeout: number,
  fetchOptions: Omit<FetchOpts, "timeout">,
  method: string,
  headers: Record<string, string>,
): Promise<Response> {
  const redirectMode = fetchOptions.redirect;
  const request = gmXhr({
    method: method as HttpMethod,
    url: urlStr,
    responseType: "blob" as any,
    data: fetchOptions.body as any,
    timeout,
    headers,
    ...(redirectMode && { redirect: redirectMode }),
  });

  let abortHandler: (() => void) | undefined;
  try {
    const abortPromise = new Promise<never>((_, reject) => {
      if (!fetchOptions.signal) {
        return;
      }

      abortHandler = () => {
        try {
          request.abort?.();
        } catch {}
        reject(makeAbortError());
      };

      fetchOptions.signal.addEventListener("abort", abortHandler, {
        once: true,
      });
      if (fetchOptions.signal.aborted) {
        abortHandler();
      }
    });

    const resp = (await Promise.race([request, abortPromise])) as GmXhrResponse;

    const response = buildResponse(resp, urlStr);

    debug.log("[GM_fetch] GM.xmlHttpRequest completed", {
      url: response.url,
      method,
      status: response.status,
      statusText: response.statusText,
    });
    return response;
  } finally {
    if (abortHandler) {
      fetchOptions.signal?.removeEventListener("abort", abortHandler);
    }
  }
}

async function gmXhrFetch(
  urlStr: string,
  timeout: number,
  fetchOptions: Omit<FetchOpts, "timeout">,
): Promise<Response> {
  const headers = getHeaders(fetchOptions.headers);
  const method = (fetchOptions.method || "GET").toUpperCase();
  debug.log("[GM_fetch] GM_xmlhttpRequest start", {
    url: urlStr,
    method,
    timeout,
    headerCount: Object.keys(headers).length,
  });

  const callbackGmXhr = getCallbackGmXhr();
  if (callbackGmXhr) {
    debug.log("[GM_fetch] attempting callback-style GM_xmlhttpRequest");
    try {
      return await executeCallbackGmXhr(
        callbackGmXhr,
        urlStr,
        timeout,
        fetchOptions,
        method,
        headers,
      );
    } catch (error) {
      if (isAbortError(error)) throw error;
      debug.warn("[GM_fetch] callback-style GM_xmlhttpRequest failed", {
        url: urlStr,
        method,
        error: getGmXhrErrorMessage(error),
      });
    }
  }

  const promiseGmXhr = getPromiseGmXhr();
  if (promiseGmXhr) {
    debug.log("[GM_fetch] attempting promise-style GM.xmlHttpRequest");
    try {
      return await executePromiseGmXhr(
        promiseGmXhr,
        urlStr,
        timeout,
        fetchOptions,
        method,
        headers,
      );
    } catch (error) {
      if (isAbortError(error)) throw error;
      debug.warn("[GM_fetch] promise-style GM.xmlHttpRequest failed", {
        url: urlStr,
        method,
        error: getGmXhrErrorMessage(error),
      });
    }
  }

  debug.warn("[GM_fetch] none of the GM approaches worked");
  throw new Error("All GM approaches failed");
}

export async function GM_fetch(
  url: RequestUrlLike,
  opts: FetchOpts = {},
): Promise<Response> {
  const {
    timeout = 15_000,
    forceGmXhr = false,
    responseCache,
    ...fetchOptions
  } = opts;
  const urlStr = toRequestUrl(url);
  const host = getRequestHost(urlStr);
  const method = resolveRequestMethod(url, fetchOptions.method);
  const useGmXhr = shouldUseGmXhr(host, urlStr, forceGmXhr);

  debug.log("[GM_fetch] request", {
    url: urlStr,
    method,
    host: host ?? "unknown",
    timeout,
    transport: useGmXhr ? "GM_xmlhttpRequest" : "fetch",
    forced: forceGmXhr,
    responseCache: responseCache
      ? {
          ttlMs: responseCache.ttlMs,
          key: responseCache.key ?? null,
          useCacheApi: responseCache.useCacheApi ?? true,
          dedupe: responseCache.dedupe ?? true,
          allowStaleOnError: responseCache.allowStaleOnError ?? true,
        }
      : null,
  });

  const performRequest = async (): Promise<Response> => {
    if (useGmXhr) {
      debug.log("[GM_fetch] using GM_xmlhttpRequest transport", {
        url: urlStr,
        method,
        host: host ?? "unknown",
        reason: forceGmXhr ? "forced" : "host-policy",
      });
      try {
        return await gmXhrFetch(urlStr, timeout, fetchOptions);
      } catch (err) {
        if (isAbortError(err)) throw err;
        if (forceGmXhr || shouldUseGmXhr(host, urlStr)) throw err;
        debug.warn(
          "[GM_fetch] all GM approaches failed, falling back to native fetch",
          {
            url: urlStr,
            method,
            host: host ?? "unknown",
            error: getErrorMessage(err) || "Unknown error",
          },
        );
        const { signal, cleanup } = createTimeoutSignal(
          timeout,
          fetchOptions.signal,
        );
        try {
          return await fetch(url, {
            ...fetchOptions,
            signal,
          });
        } finally {
          cleanup();
        }
      }
    }

    const { signal, cleanup } = createTimeoutSignal(
      timeout,
      fetchOptions.signal,
    );
    try {
      return await fetch(url, {
        ...fetchOptions,
        signal,
      });
    } catch (err) {
      if (signal.aborted || isAbortError(err)) {
        throw err;
      }
      debug.warn("[GM_fetch] fetch failed, retrying via GM_xmlhttpRequest", {
        url: urlStr,
        method,
        host: host ?? "unknown",
        error: getErrorMessage(err) || "Unknown error",
      });
      return await gmXhrFetch(urlStr, timeout, fetchOptions);
    } finally {
      cleanup();
    }
  };

  if (!responseCache) {
    return await performRequest();
  }

  return await executeWithResponseCache(
    {
      url: urlStr,
      method,
      body: fetchOptions.body,
    },
    responseCache,
    performRequest,
  );
}
