import { config } from "@vot.js/shared";
import { SerializedRequestInitData } from "../types/audioDownloader";

export const IFRAME_HASH = "vot_iframe";
export const IFRAME_ID = "vot_iframe_player";

export const MIN_CHUNK_RANGES_PART_SIZE = config.minChunkSize; // 5295308
export const MIN_CONTENT_LENGTH_MULTIPLIER = 0.9;
export const CHUNK_STEPS = [60_000, 80_000, 150_000, 330_000, 460_000];
export const MIN_ARRAY_BUFFER_LENGTH = 15_000;
export const ACCEPTABLE_LENGTH_DIFF = 0.9;

export const getRequestUrl = (request: RequestInfo) =>
  typeof request === "string" ? request : request.url;

export function serializeRequestInit(
  request: RequestInfo,
): SerializedRequestInitData {
  const body = new Uint8Array([120, 0]);
  if (typeof request === "string") {
    return {
      body,
      cache: "no-store" as RequestCache,
      credentials: "include" as RequestCredentials,
      method: "POST",
    };
  }

  const {
    headers,
    cache,
    credentials,
    integrity,
    keepalive,
    method,
    mode,
    redirect,
    referrer,
    referrerPolicy,
  } = request;
  const headersEntries = [...headers.entries()];

  return {
    body,
    cache,
    credentials,
    headersEntries,
    integrity,
    keepalive,
    method,
    mode,
    redirect,
    referrer,
    referrerPolicy,
  };
}

export function deserializeRequestInit(request: SerializedRequestInitData) {
  const { headersEntries, ...options } = request;
  const headers = new Headers(headersEntries);
  return {
    ...options,
    headers,
  };
}

export function serializeResponse(response: Response) {
  const { ok, redirected, status, statusText, type, url } = response;
  return {
    ok,
    redirected,
    status,
    statusText,
    type,
    url,
  };
}
