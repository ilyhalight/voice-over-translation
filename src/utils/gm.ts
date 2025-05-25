import type { HttpMethod } from "@toil/gm-types/types/web/http";

import { nonProxyExtensions } from "../config/config";
import { FetchOpts } from "../types/utils/gm";
import debug from "./debug";
import { getHeaders } from "./utils";

export const isProxyOnlyExtension =
  GM_info?.scriptHandler && !nonProxyExtensions.includes(GM_info.scriptHandler);
export const isSupportGM4 = typeof GM !== "undefined";
export const isUnsafeWindowAllowed = typeof unsafeWindow !== "undefined";
export const isSupportGMXhr = typeof GM_xmlhttpRequest !== "undefined";

export async function GM_fetch(
  url: string | URL | Request,
  opts: FetchOpts = {},
): Promise<Response> {
  const { timeout = 15000, ...fetchOptions } = opts;
  const controller = new AbortController();

  try {
    if (typeof url === "string" && url.includes("api.browser.yandex.ru")) {
      throw new Error("Preventing yandex cors");
    }

    return await fetch(url, {
      signal: controller.signal,
      ...fetchOptions,
    });
  } catch (err) {
    // Если fetch завершился ошибкой, используем GM_xmlhttpRequest
    // https://greasyfork.org/ru/scripts/421384-gm-fetch/code
    debug.log(
      "GM_fetch preventing CORS by GM_xmlhttpRequest",
      (err as Error).message,
    );

    const headers = getHeaders(fetchOptions.headers);
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: (fetchOptions.method || "GET") as HttpMethod,
        url: url.toString(),
        responseType: "blob",
        data: fetchOptions.body,
        timeout,
        headers,
        onload: (resp) => {
          const headers = resp.responseHeaders
            .split(/\r?\n/)
            .reduce<Record<string, string>>((acc, line) => {
              const [, key, value] = line.match(/^([\w-]+): (.+)$/) || [];
              if (key) {
                acc[key] = value;
              }
              return acc;
            }, {});

          const response = new Response(resp.response, {
            status: resp.status,
            headers: headers,
          });
          // Response have empty url by default (readonly)
          // this need to get same response url as in classic fetch
          Object.defineProperty(response, "url", {
            value: resp.finalUrl ?? "",
          });

          resolve(response);
        },
        ontimeout: () => reject(new Error("Timeout")),
        onerror: (error) => reject(new Error(error as any)),
        onabort: () => reject(new Error("AbortError")),
      });
    });
  }
}
