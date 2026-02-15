// Minimal HTTP method type for GM_xmlhttpRequest compatibility.
// (Avoid pulling external typings just for this union.)
type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
  | "CONNECT"
  | "TRACE";

import { nonProxyExtensions } from "../config/config";
import type { FetchOpts } from "../types/utils/gm";
import { createTimeoutSignal } from "./abort";
import debug from "./debug";
import { isAbortError, makeAbortError } from "./errors";
import { getHeaders } from "./utils";

export const isProxyOnlyExtension =
  // The extension build provides a full GM_xmlhttpRequest implementation, so
  // we should not fall into the "proxy-only" compatibility mode.
  !(typeof IS_EXTENSION !== "undefined" && IS_EXTENSION) &&
  !!GM_info?.scriptHandler &&
  !nonProxyExtensions.includes(GM_info.scriptHandler);
export const isSupportGM4 = typeof GM !== "undefined";
export const isUnsafeWindowAllowed = typeof unsafeWindow !== "undefined";
export const isSupportGMXhr = typeof GM_xmlhttpRequest !== "undefined";

const DEFAULT_TIMEOUT = 15_000;
const YANDEX_TRANSLATE_HOST = "api.browser.yandex.ru";
const YANDEX_MIN_TIMEOUT = 30_000;
const YANDEX_MAX_ATTEMPTS = 2;
const RETRYABLE_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
let gmFetchRequestSeq = 0;
const HEADER_DEBUG_LIMIT = 32;
const BODY_OBJECT_KEYS_DEBUG_LIMIT = 12;

type RequestAttemptTrace = {
  requestId: string;
  attempt: number;
  effectiveTimeoutMs: number;
};

const toUrlString = (u: string | URL | Request) => {
  if (typeof u === "string") {
    return u;
  }

  if (u instanceof URL) {
    return u.href;
  }

  return u.url;
};

type NoFallbackError = {
  __gmFetchNoFallback?: boolean;
};

function isNoFallbackError(err: unknown): err is NoFallbackError {
  return (
    !!err &&
    typeof err === "object" &&
    "__gmFetchNoFallback" in (err as Record<string, unknown>)
  );
}

function markNoFallbackError(err: unknown): void {
  if (!err || typeof err !== "object") {
    return;
  }

  (err as NoFallbackError).__gmFetchNoFallback = true;
}

function isYandexTranslateRequest(urlStr: string): boolean {
  try {
    return new URL(urlStr).hostname === YANDEX_TRANSLATE_HOST;
  } catch {
    return urlStr.includes(YANDEX_TRANSLATE_HOST);
  }
}

const forceGmXhr = (urlStr: string) => isYandexTranslateRequest(urlStr);

function getEffectiveTimeoutMs(urlStr: string, timeoutMs: number): number {
  if (!isYandexTranslateRequest(urlStr)) return timeoutMs;
  return Math.max(timeoutMs, YANDEX_MIN_TIMEOUT);
}

function makeRequestId(): string {
  gmFetchRequestSeq += 1;
  return `gm_fetch_${Date.now()}_${gmFetchRequestSeq}`;
}

function isRetryableError(
  err: unknown,
  signal?: AbortSignal,
): err is Error | DOMException {
  if ((err as any)?.__gmFetchNoFallback) return false;
  if (signal?.aborted) return false;
  if (isAbortError(err)) return true;
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("timeout") ||
    msg.includes("network") ||
    msg.includes("failed to fetch") ||
    msg.includes("load failed") ||
    msg.includes("bridge port disconnected")
  );
}

function shouldRetryResponseStatus(
  urlStr: string,
  status: number,
  attempt: number,
  maxAttempts: number,
): boolean {
  return (
    isYandexTranslateRequest(urlStr) &&
    attempt < maxAttempts &&
    RETRYABLE_HTTP_STATUSES.has(status)
  );
}

function shouldRetryRequestError(
  urlStr: string,
  err: unknown,
  attempt: number,
  maxAttempts: number,
  signal?: AbortSignal,
): boolean {
  return (
    isYandexTranslateRequest(urlStr) &&
    attempt < maxAttempts &&
    isRetryableError(err, signal)
  );
}

function getBodyDebugInfo(body: RequestInit["body"]) {
  if (body == null) return { type: "none", size: 0 };
  if (typeof body === "string") {
    return {
      type: "string",
      size: body.length,
      looksLikeObjectString: /^\[object [^\]]+\]$/.test(body.trim()),
    };
  }
  if (body instanceof URLSearchParams)
    return { type: "URLSearchParams", size: body.toString().length };
  if (body instanceof FormData) return { type: "FormData", size: -1 };
  if (body instanceof Blob) return { type: "Blob", size: body.size };
  if (body instanceof ArrayBuffer)
    return { type: "ArrayBuffer", size: body.byteLength };
  if (ArrayBuffer.isView(body))
    return {
      type: body.constructor?.name ?? "TypedArray",
      size: body.byteLength,
    };
  if (typeof ReadableStream !== "undefined" && body instanceof ReadableStream) {
    return { type: "ReadableStream", size: -1 };
  }
  const objectTag = (() => {
    try {
      return Object.prototype.toString.call(body);
    } catch {
      return null;
    }
  })();
  const ctor = (() => {
    try {
      const ctorName = (body as any)?.constructor?.name;
      return typeof ctorName === "string" ? ctorName : null;
    } catch {
      return null;
    }
  })();
  const keys =
    body && typeof body === "object"
      ? Object.keys(body as unknown as Record<string, unknown>).slice(
          0,
          BODY_OBJECT_KEYS_DEBUG_LIMIT,
        )
      : undefined;
  return { type: typeof body, size: -1, objectTag, ctor, keys };
}

function getHeaderDebugInfo(headers: HeadersInit | undefined) {
  if (!headers) {
    return {
      headerCount: 0,
      headerNames: [] as string[],
      contentType: null as string | null,
    };
  }

  const names: string[] = [];
  let contentType: string | null = null;

  const addHeader = (name: string, value: string) => {
    const normalized = String(name || "").trim();
    if (!normalized) return;
    names.push(normalized);
    if (normalized.toLowerCase() === "content-type" && contentType === null) {
      contentType = String(value);
    }
  };

  try {
    if (headers instanceof Headers) {
      for (const [name, value] of headers.entries()) addHeader(name, value);
    } else if (Array.isArray(headers)) {
      for (const pair of headers) {
        if (!Array.isArray(pair) || pair.length < 2) continue;
        addHeader(String(pair[0]), String(pair[1]));
      }
    } else {
      for (const [name, value] of Object.entries(headers)) {
        addHeader(name, String(value));
      }
    }
  } catch {
    return {
      headerCount: -1,
      headerNames: [] as string[],
      contentType: null as string | null,
    };
  }

  return {
    headerCount: names.length,
    headerNames: names.slice(0, HEADER_DEBUG_LIMIT),
    contentType,
  };
}

function parseRawHeaders(raw = "") {
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = /^([\w!#$%&'*+.^`|~-]+)\s*:\s*(.*)$/.exec(line);
    if (m) out[m[1].toLowerCase()] = m[2];
  }
  return out;
}

async function nativeFetchWithTimeout(
  url: string | URL | Request,
  init: RequestInit,
  timeoutMs: number,
  trace?: RequestAttemptTrace,
): Promise<Response> {
  const { signal, didTimeout, cleanup } = createTimeoutSignal(
    timeoutMs,
    init.signal,
  );

  try {
    debug.log("[VOT][GM_fetch][native] start", {
      url: toUrlString(url),
      method: init.method ?? "GET",
      timeoutMs,
      requestId: trace?.requestId,
      attempt: trace?.attempt,
      effectiveTimeoutMs: trace?.effectiveTimeoutMs,
      credentials: init.credentials ?? "same-origin",
      mode: init.mode ?? "cors",
      ...getHeaderDebugInfo(init.headers),
      ...getBodyDebugInfo(init.body),
    });
    return await fetch(url, { ...init, signal });
  } catch (e) {
    debug.error("[VOT][GM_fetch][native] error", {
      url: toUrlString(url),
      message: e instanceof Error ? e.message : String(e),
      requestId: trace?.requestId,
      attempt: trace?.attempt,
      effectiveTimeoutMs: trace?.effectiveTimeoutMs,
      isAbortError: isAbortError(e),
      signalAborted: !!init.signal?.aborted,
      didTimeout: didTimeout(),
    });
    if (isAbortError(e) && !didTimeout() && init.signal?.aborted) {
      markNoFallbackError(e);
    }
    throw e;
  } finally {
    cleanup();
  }
}

function gmXhrFetch(
  urlStr: string,
  init: RequestInit,
  timeoutMs: number,
  fetchErrForAbortReuse?: unknown,
  trace?: RequestAttemptTrace,
): Promise<Response> {
  const headers = getHeaders(init.headers);
  const method = (init.method ?? "GET") as HttpMethod;
  const supportsReadableStream = typeof ReadableStream !== "undefined";
  // Yandex API requests are small protobuf payloads and don't benefit from
  // progressive streaming. Using a single terminal payload avoids races where
  // late abort/timeout events can poison the response body read.
  const useProgressStream = supportsReadableStream && !forceGmXhr(urlStr);

  // Align cookie behavior with fetch():
  // - credentials: 'include' => send cookies/auth headers cross-site
  // - credentials: 'omit'    => do not send cookies
  // Many userscript managers support `withCredentials` / `anonymous`.
  // Unsupported flags are ignored by engines that don't implement them.
  const credentials = init.credentials;
  const withCredentials = credentials === "include" ? true : undefined;
  const anonymous = credentials === "omit" ? true : undefined;

  return new Promise((resolve, reject) => {
    let responseResolved = false;
    let req: { abort?(): void } | undefined;

    let streamCtrl: ReadableStreamDefaultController<Uint8Array> | undefined;
    let seenBytes = 0;

    const cleanup = () => init.signal?.removeEventListener("abort", onAbort);

    const resolveResponse = (
      body: BodyInit | null,
      status: number,
      statusText: string,
      rawHeaders?: string,
    ) => {
      if (responseResolved) return;
      responseResolved = true;
      debug.log("[VOT][GM_fetch][xhr] resolve", {
        url: urlStr,
        method,
        requestId: trace?.requestId,
        attempt: trace?.attempt,
        effectiveTimeoutMs: trace?.effectiveTimeoutMs,
        status,
        statusText,
        hasBody: body != null,
      });
      resolve(
        new Response(body, {
          status,
          statusText,
          headers: parseRawHeaders(rawHeaders),
        }),
      );
    };

    const fail = (err: unknown) => {
      if (responseResolved && !useProgressStream) {
        cleanup();
        debug.warn("[VOT][GM_fetch][xhr] late terminal event after resolve", {
          url: urlStr,
          method,
          requestId: trace?.requestId,
          attempt: trace?.attempt,
          effectiveTimeoutMs: trace?.effectiveTimeoutMs,
          message: err instanceof Error ? err.message : String(err),
        });
        return;
      }
      cleanup();
      debug.error("[VOT][GM_fetch][xhr] fail", {
        url: urlStr,
        method,
        requestId: trace?.requestId,
        attempt: trace?.attempt,
        effectiveTimeoutMs: trace?.effectiveTimeoutMs,
        message: err instanceof Error ? err.message : String(err),
      });
      if (useProgressStream) streamCtrl?.error(err);
      if (!responseResolved) reject(err);
    };

    const onAbort = () => {
      req?.abort?.();
      const abortErr =
        fetchErrForAbortReuse && isAbortError(fetchErrForAbortReuse)
          ? (fetchErrForAbortReuse as any)
          : makeAbortError();
      fail(abortErr);
    };

    if (init.signal) {
      if (init.signal.aborted) return onAbort();
      init.signal.addEventListener("abort", onAbort, { once: true });
    }

    debug.log("[VOT][GM_fetch][xhr] start", {
      url: urlStr,
      method,
      timeoutMs,
      requestId: trace?.requestId,
      attempt: trace?.attempt,
      effectiveTimeoutMs: trace?.effectiveTimeoutMs,
      responseType: "arraybuffer",
      withCredentials: withCredentials ?? false,
      anonymous: anonymous ?? false,
      useProgressStream,
      ...getHeaderDebugInfo(headers),
      ...getBodyDebugInfo(init.body),
    });

    if (
      typeof init.body === "string" &&
      /^\[object [^\]]+\]$/.test(init.body.trim())
    ) {
      const contentType = getHeaderDebugInfo(headers).contentType;
      debug.warn("[VOT][GM_fetch][xhr] suspicious body string before request", {
        url: urlStr,
        method,
        requestId: trace?.requestId,
        attempt: trace?.attempt,
        contentType,
        body: init.body,
      });
    }

    const stream = useProgressStream
      ? new ReadableStream<Uint8Array>({
          start(controller) {
            streamCtrl = controller;
          },
          cancel() {
            req?.abort?.();
          },
        })
      : null;

    /**
     * Pushes new bytes into the ReadableStream.
     *
     * Userscript managers typically expose the *cumulative* `response`
     * ArrayBuffer on progress events. Our extension shim can emit either:
     *   - `progress.response`: cumulative ArrayBuffer (TM-like)
     *   - `progress.chunk`: incremental ArrayBuffer chunk (more efficient)
     */
    const pushNewBytes = (evtOrResp: any) => {
      if (!useProgressStream || !streamCtrl) return;

      // Extension-optimized mode: pass only the incremental chunk.
      const chunk = evtOrResp?.chunk;
      if (chunk && typeof chunk !== "string") {
        const u8 = new Uint8Array(chunk as ArrayBuffer);
        if (u8.byteLength) {
          streamCtrl.enqueue(u8);
          seenBytes += u8.byteLength;
        }
        return;
      }

      // Classic GM/TM mode: pass the cumulative response buffer.
      const resp = evtOrResp?.response ?? evtOrResp;
      if (!resp || typeof resp === "string") return;

      const u8 = new Uint8Array(resp as ArrayBuffer);
      if (u8.byteLength <= seenBytes) return;

      streamCtrl.enqueue(u8.slice(seenBytes));
      seenBytes = u8.byteLength;
    };

    const gmXhr =
      typeof GM_xmlhttpRequest !== "undefined"
        ? GM_xmlhttpRequest
        : (globalThis as any).GM_xmlhttpRequest;

    if (typeof gmXhr !== "function") {
      throw new TypeError("GM_xmlhttpRequest is not available");
    }

    req = gmXhr({
      method,
      url: urlStr,
      headers,
      data: init.body as any,
      withCredentials,
      anonymous,
      timeout: timeoutMs,
      responseType: "arraybuffer" as any,

      onprogress: useProgressStream
        ? (p) => {
            const progress = p as {
              loaded?: number;
              total?: number;
              status?: number;
              statusText?: string;
              responseHeaders?: string;
              response?: ArrayBuffer | string | null;
            };
            debug.log("[VOT][GM_fetch][xhr] progress", {
              url: urlStr,
              method,
              requestId: trace?.requestId,
              attempt: trace?.attempt,
              loaded: progress.loaded ?? null,
              total: progress.total ?? null,
              status: progress.status ?? null,
            });
            if (!stream) return;
            if (!responseResolved) {
              resolveResponse(
                stream,
                progress.status,
                progress.statusText,
                progress.responseHeaders,
              );
            }
            pushNewBytes(progress);
          }
        : undefined,

      onload: (r) => {
        cleanup();
        debug.log("[VOT][GM_fetch][xhr] onload", {
          url: urlStr,
          method,
          requestId: trace?.requestId,
          attempt: trace?.attempt,
          effectiveTimeoutMs: trace?.effectiveTimeoutMs,
          status: r.status,
          statusText: r.statusText,
          responseType: "arraybuffer",
          responseSize:
            r.response && typeof r.response !== "string"
              ? ((r.response as ArrayBuffer).byteLength ?? null)
              : null,
        });

        if (useProgressStream) {
          if (!responseResolved) {
            if (!stream) return;
            resolveResponse(stream, r.status, r.statusText, r.responseHeaders);
          }
          pushNewBytes(r);
          streamCtrl?.close();
          return;
        }

        resolveResponse(
          r.response && typeof r.response !== "string"
            ? (r.response as ArrayBuffer)
            : null,
          r.status,
          r.statusText,
          r.responseHeaders,
        );
      },

      onerror: fail,
      ontimeout: () => {
        debug.error("[VOT][GM_fetch][xhr] timeout", {
          url: urlStr,
          method,
          timeoutMs,
          requestId: trace?.requestId,
          attempt: trace?.attempt,
          effectiveTimeoutMs: trace?.effectiveTimeoutMs,
        });
        fail(new Error("GM_xmlhttpRequest timeout"));
      },
      onabort: () => {
        debug.warn("[VOT][GM_fetch][xhr] abort", {
          url: urlStr,
          method,
          requestId: trace?.requestId,
          attempt: trace?.attempt,
          effectiveTimeoutMs: trace?.effectiveTimeoutMs,
        });
        fail(makeAbortError());
      },
    });
  });
}

export async function GM_fetch(
  url: string | URL | Request,
  opts: FetchOpts = {},
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, ...init } = opts;
  const urlStr = toUrlString(url);

  const shouldForce = isSupportGMXhr && forceGmXhr(urlStr);
  const effectiveTimeoutMs = getEffectiveTimeoutMs(urlStr, timeout);
  const requestId = makeRequestId();
  const maxAttempts = isYandexTranslateRequest(urlStr)
    ? YANDEX_MAX_ATTEMPTS
    : 1;
  const requestMeta = {
    url: urlStr,
    method: init.method ?? "GET",
    timeoutMs: timeout,
    effectiveTimeoutMs,
    requestId,
    shouldForceGmXhr: shouldForce,
    canUseGmXhr: isSupportGMXhr,
    ...getHeaderDebugInfo(init.headers),
    ...getBodyDebugInfo(init.body),
  };

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const trace: RequestAttemptTrace = {
      requestId,
      attempt,
      effectiveTimeoutMs,
    };
    debug.log("[VOT][GM_fetch] start", { ...requestMeta, attempt });

    try {
      if (!shouldForce) {
        const res = await nativeFetchWithTimeout(
          url,
          init,
          effectiveTimeoutMs,
          trace,
        );
        debug.log("[VOT][GM_fetch] native response", {
          ...requestMeta,
          attempt,
          status: res.status,
          statusText: res.statusText,
          type: res.type,
          redirected: res.redirected,
        });

        // If the caller requested `no-cors` (or the browser downgraded the
        // request), fetch() can return an opaque response (status 0) which
        // cannot be read. In the userscript environment GM_xmlhttpRequest is
        // commonly used as a CORS-bypass for media downloads; mirror that
        // behaviour here to avoid false "download failed" paths.
        if (
          isSupportGMXhr &&
          (res.type === "opaque" ||
            res.type === "opaqueredirect" ||
            res.status === 0)
        ) {
          debug.log(
            "GM_fetch got an opaque/blocked response; retrying via GM_xmlhttpRequest",
            { ...requestMeta, attempt },
          );
          const xhrRes = await gmXhrFetch(
            urlStr,
            init,
            effectiveTimeoutMs,
            undefined,
            trace,
          );
          if (
            shouldRetryResponseStatus(
              urlStr,
              xhrRes.status,
              attempt,
              maxAttempts,
            )
          ) {
            debug.warn("[VOT][GM_fetch] retrying after retryable XHR status", {
              ...requestMeta,
              attempt,
              status: xhrRes.status,
            });
            continue;
          }
          return xhrRes;
        }

        if (
          shouldRetryResponseStatus(urlStr, res.status, attempt, maxAttempts)
        ) {
          debug.warn("[VOT][GM_fetch] retrying after retryable native status", {
            ...requestMeta,
            attempt,
            status: res.status,
          });
          continue;
        }

        return res;
      }
      throw new Error("Force GM_xmlhttpRequest");
    } catch (e) {
      if (isNoFallbackError(e) && e.__gmFetchNoFallback) throw e;
      if (!isSupportGMXhr) {
        if (
          shouldRetryRequestError(urlStr, e, attempt, maxAttempts, init.signal)
        ) {
          debug.warn("[VOT][GM_fetch] retrying after native error", {
            ...requestMeta,
            attempt,
            reason: e instanceof Error ? e.message : String(e),
          });
          lastError = e;
          continue;
        }
        throw e;
      }

      debug.warn("[VOT][GM_fetch] fallback to GM_xmlhttpRequest", {
        ...requestMeta,
        attempt,
        reason: e instanceof Error ? e.message : String(e),
      });

      try {
        const res = await gmXhrFetch(
          urlStr,
          init,
          effectiveTimeoutMs,
          e,
          trace,
        );
        if (
          shouldRetryResponseStatus(urlStr, res.status, attempt, maxAttempts)
        ) {
          debug.warn("[VOT][GM_fetch] retrying after retryable XHR status", {
            ...requestMeta,
            attempt,
            status: res.status,
          });
          continue;
        }
        return res;
      } catch (error_) {
        if (
          shouldRetryRequestError(
            urlStr,
            error_,
            attempt,
            maxAttempts,
            init.signal,
          )
        ) {
          debug.warn("[VOT][GM_fetch] retrying after XHR error", {
            ...requestMeta,
            attempt,
            reason: error_ instanceof Error ? error_.message : String(error_),
          });
          lastError = error_;
          continue;
        }
        throw error_;
      }
    }
  }

  throw lastError ?? new Error("GM_fetch failed");
}
