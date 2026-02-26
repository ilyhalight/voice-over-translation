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
import { getErrorMessage, isAbortError, makeAbortError } from "./errors";
import { getHeaders } from "./utils";

const YANDEX_API_HOST = "api.browser.yandex.ru";
const GOOGLEVIDEO_HOST_SUFFIX = "googlevideo.com";
const HEADER_LINE_RE = /^([\w-]+):\s*(.+)$/;
const URL_SCHEME_RE = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

const scriptHandler =
  typeof GM_info === "undefined" ? undefined : GM_info?.scriptHandler;

export const isProxyOnlyExtension =
  // The extension build provides a full GM_xmlhttpRequest implementation, so
  // we should not fall into the "proxy-only" compatibility mode.
  !(typeof IS_EXTENSION !== "undefined" && IS_EXTENSION) &&
  !!scriptHandler &&
  !nonProxyExtensions.includes(scriptHandler);
export const isSupportGM4 = typeof GM !== "undefined";
export const isSupportGMXhr = typeof GM_xmlhttpRequest !== "undefined";

function getRequestHost(url: string): string | undefined {
  const normalizedUrl = url.trim();
  try {
    return new URL(normalizedUrl).hostname.toLowerCase();
  } catch {
    if (!URL_SCHEME_RE.test(normalizedUrl)) {
      try {
        return new URL(`https://${normalizedUrl}`).hostname.toLowerCase();
      } catch {
        // fall through
      }
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

  // These endpoints are routinely blocked by page-world CORS. Going through
  // native fetch first only adds noisy console errors and an extra failed hop.
  return (
    isHostOrSubdomain(host, YANDEX_API_HOST) ||
    isHostOrSubdomain(host, GOOGLEVIDEO_HOST_SUFFIX)
  );
}

function toRequestUrl(url: string | URL | Request): string {
  if (typeof url === "string") {
    return url;
  }
  if (url instanceof URL) {
    return url.href;
  }
  return url.url;
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
  if (typeof maybeError?.error === "string") {
    return maybeError.error;
  }
  if (typeof maybeError?.statusText === "string") {
    return maybeError.statusText;
  }

  return getErrorMessage(error) || "Unknown error";
}

async function gmXhrFetch(
  urlStr: string,
  timeout: number,
  fetchOptions: Omit<FetchOpts, "timeout">,
): Promise<Response> {
  const headers = getHeaders(fetchOptions.headers);

  return await new Promise((resolve, reject) => {
    const gmXhr =
      typeof GM_xmlhttpRequest === "undefined"
        ? (globalThis as any).GM_xmlhttpRequest
        : GM_xmlhttpRequest;

    if (typeof gmXhr !== "function") {
      reject(new TypeError("GM_xmlhttpRequest is not available"));
      return;
    }

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

    const request = gmXhr({
      method: (fetchOptions.method || "GET") as HttpMethod,
      url: urlStr,
      responseType: "blob" as any,
      data: fetchOptions.body as any,
      timeout,
      headers,
      onload: (resp) => {
        if (settled) return;
        settled = true;
        cleanupAbort();
        const responseHeaders = parseResponseHeaders(resp.responseHeaders);

        const response = new Response(resp.response as Blob, {
          status: resp.status,
          statusText:
            typeof resp.statusText === "string" ? resp.statusText : "",
          headers: responseHeaders,
        });

        // Response has empty url by default (readonly).
        // Keep parity with classic fetch by exposing final URL.
        Object.defineProperty(response, "url", {
          value: resp.finalUrl ?? urlStr,
        });

        resolve(response);
      },
      ontimeout: () => failOnce(new Error("Timeout")),
      onerror: (error: unknown) =>
        failOnce(new Error(getGmXhrErrorMessage(error))),
      onabort: () => failOnce(makeAbortError()),
    });

    onAbort = () => {
      try {
        request?.abort?.();
      } catch {
        // ignore abort races
      }
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

export async function GM_fetch(
  url: string | URL | Request,
  opts: FetchOpts = {},
): Promise<Response> {
  const { timeout = 15_000, forceGmXhr = false, ...fetchOptions } = opts;
  const urlStr = toRequestUrl(url);
  const host = getRequestHost(urlStr);

  if (shouldUseGmXhr(host, urlStr, forceGmXhr)) {
    debug.log("GM_fetch: routing request via GM_xmlhttpRequest", {
      host: host ?? "unknown",
      reason: forceGmXhr ? "forced" : "host-policy",
      url: urlStr,
    });
    return await gmXhrFetch(urlStr, timeout, fetchOptions);
  }

  const { signal, cleanup } = createTimeoutSignal(timeout, fetchOptions.signal);
  try {
    return await fetch(url, {
      ...fetchOptions,
      signal,
    });
  } catch (err) {
    if (signal.aborted || isAbortError(err)) {
      throw err;
    }
    // If fetch fails, retry via GM_xmlhttpRequest.
    debug.log(
      "GM_fetch preventing CORS by GM_xmlhttpRequest",
      getErrorMessage(err) || "Unknown error",
    );
    return await gmXhrFetch(urlStr, timeout, fetchOptions);
  } finally {
    cleanup();
  }
}
