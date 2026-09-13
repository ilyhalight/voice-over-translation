/**
 * Transport of the media (`videoplayback`) requests.
 *
 * GVS answers a part of its hosts with a cross-host redirect
 * (`cms_redirect=yes`), and that redirected answer carries no
 * `Access-Control-Allow-Origin`: a page request is dropped by the browser
 * before the download reads its first byte (`Failed to fetch`), and the retry
 * looks like a transport hiccup even though no retry can ever succeed. Page
 * level `fetch` wrappers of content blockers drop a part of these requests as
 * well (`ERR_BLOCKED_BY_CLIENT`).
 *
 * Two independent ways around it, in this order:
 *
 * 1. `GM_xmlhttpRequest` (userscript manager) or the extension background:
 *    the request leaves a privileged context, so no CORS check and no page
 *    `fetch` wrapper applies and redirects are followed transparently. Every
 *    googlevideo.com host is already routed through it by `utils/gm.ts`,
 *    which is why the extension build never sees the redirect problem.
 * 2. `alr=yes`, the parameter the YouTube player itself sends: instead of a
 *    redirect GVS answers the next host as a `text/plain` body, which the
 *    caller requests again itself. It keeps a bare page realm working when no
 *    privileged transport exists (GM API missing, host not in `@connect`).
 */
import debug from "../../utils/debug";
import { GM_fetch, isSupportGMXhr } from "../../utils/gm";

/**
 * A 4 MiB range needs far more than the 15 s GM default on a slow connection.
 * The download is bounded by the caller's abort signal anyway.
 */
export const MEDIA_REQUEST_TIMEOUT_MS = 10 * 60_000;

export type MediaTransport = "gm" | "page";

/** The privileged transport whenever this build has one. */
export function getMediaTransport(): MediaTransport {
  const transport: MediaTransport = isSupportGMXhr ? "gm" : "page";
  debug.log("Audio downloader. media transport selected", { transport });
  return transport;
}

/**
 * The bare URL is requested with explicit `Range` headers, so everything the
 * player adds to slice and wrap the stream itself is stripped:
 * - `ump` would wrap the body into the UMP container,
 * - `range`/`rn` are the player's own slicing into hundreds of small
 *   requests, replaced here by a few fixed-size ranges.
 *
 * `alr` is the exception: the page transport can only read a GVS redirect
 * when it arrives as a body instead of a `302`, while the privileged
 * transport follows redirects itself and would only pay for the extra hop.
 */
export function buildMediaRequestUrl(
  streamUrl: string,
  transport: MediaTransport,
): string {
  const url = new URL(streamUrl);
  for (const param of ["ump", "range", "rn"]) {
    url.searchParams.delete(param);
  }
  if (transport === "page") url.searchParams.set("alr", "yes");
  else url.searchParams.delete("alr");
  return url.toString();
}

export type MediaRangeRequest = {
  readonly transport: MediaTransport;
  readonly targetWindow: Window;
  readonly url: string;
  /** `bytes=start-end`. A CORS-safelisted header, so it costs no preflight. */
  readonly range: string;
  readonly signal: AbortSignal;
};

/** One ranged media request over the selected transport. */
export async function fetchMediaRange({
  transport,
  targetWindow,
  url,
  range,
  signal,
}: MediaRangeRequest): Promise<Response> {
  if (transport === "gm") {
    return await GM_fetch(url, {
      method: "GET",
      headers: { range },
      redirect: "follow",
      timeout: MEDIA_REQUEST_TIMEOUT_MS,
      // Never fall back to `fetch` silently: the caller downgrades the whole
      // download instead, so the URL is rebuilt with `alr=yes` first.
      forceGmXhr: true,
      signal,
    });
  }
  return await targetWindow.fetch(url, {
    signal,
    // The URL authorizes itself (`sig`, `pot`, `expire`), so no cookie is
    // needed — and none would be sent to googlevideo.com anyway. Nothing else
    // can be added from a page either: `Origin`, `Referer` and `User-Agent`
    // are forbidden header names, which is why a client whose token GVS ties
    // to another user agent can never be satisfied from a browser realm.
    credentials: "omit",
    headers: { range },
  });
}
