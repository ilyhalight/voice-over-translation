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

const YANDEX_API_HOST = "api.browser.yandex.ru";

const scriptHandler =
  typeof GM_info !== "undefined" ? GM_info?.scriptHandler : undefined;

export const isProxyOnlyExtension =
  // The extension build provides a full GM_xmlhttpRequest implementation, so
  // we should not fall into the "proxy-only" compatibility mode.
  !(typeof IS_EXTENSION !== "undefined" && IS_EXTENSION) &&
  !!scriptHandler &&
  !nonProxyExtensions.includes(scriptHandler);
export const isSupportGM4 = typeof GM !== "undefined";
export const isUnsafeWindowAllowed = typeof unsafeWindow !== "undefined";
export const isSupportGMXhr = typeof GM_xmlhttpRequest !== "undefined";

function shouldUseGmXhr(url: string): boolean {
  // These endpoints are routinely blocked by page-world CORS. Going through
  // native fetch first only adds noisy console errors and an extra failed hop.
  return url.includes(YANDEX_API_HOST);
}

async function gmXhrFetch(
  urlStr: string,
  timeout: number,
  fetchOptions: Omit<FetchOpts, "timeout">,
): Promise<Response> {
  const headers = getHeaders(fetchOptions.headers);

  return await new Promise((resolve, reject) => {
    const gmXhr =
      typeof GM_xmlhttpRequest !== "undefined"
        ? GM_xmlhttpRequest
        : (globalThis as any).GM_xmlhttpRequest;

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
        const responseHeaders = String(resp.responseHeaders || "")
          .split(/\r?\n/)
          .reduce<Record<string, string>>((acc, line) => {
            const [, key, value] = line.match(/^([\w-]+):\s*(.+)$/) || [];
            if (key) {
              acc[key] = value;
            }
            return acc;
          }, {});

        const response = new Response(resp.response as Blob, {
          status: resp.status,
          headers: responseHeaders,
        });

        // Response has empty url by default (readonly).
        // Keep parity with classic fetch by exposing final URL.
        Object.defineProperty(response, "url", {
          value: resp.finalUrl ?? "",
        });

        resolve(response);
      },
      ontimeout: () => failOnce(new Error("Timeout")),
      onerror: (error: unknown) => failOnce(new Error(String(error))),
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
      if (fetchOptions.signal.aborted) {
        onAbort();
        return;
      }
      fetchOptions.signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

export async function GM_fetch(
  url: string | URL | Request,
  opts: FetchOpts = {},
): Promise<Response> {
  const { timeout = 15_000, ...fetchOptions } = opts;
  const urlStr =
    typeof url === "string" ? url : url instanceof URL ? url.href : url.url;

  if (shouldUseGmXhr(urlStr)) {
    debug.log("GM_fetch: routing request via GM_xmlhttpRequest", {
      host: YANDEX_API_HOST,
      url: urlStr,
    });
    return await gmXhrFetch(urlStr, timeout, fetchOptions);
  }

  const { signal, cleanup } = createTimeoutSignal(timeout, fetchOptions.signal);
  try {
    return await fetch(url, {
      signal,
      ...fetchOptions,
    });
  } catch (err) {
    if (isAbortError(err) || fetchOptions.signal?.aborted) {
      throw err;
    }
    // If fetch fails, retry via GM_xmlhttpRequest.
    debug.log(
      "GM_fetch preventing CORS by GM_xmlhttpRequest",
      (err as Error)?.message ?? String(err),
    );
    return await gmXhrFetch(urlStr, timeout, fetchOptions);
  } finally {
    cleanup();
  }
}
