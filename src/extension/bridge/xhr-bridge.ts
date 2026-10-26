import { createTerminalXhrError } from "#extension/shared/xhr.ts";
import debug from "../../utils/debug";
import { toErrorMessage } from "../../utils/errors";
import {
  base64ToArrayBuffer,
  isBodySerializedForPort,
  serializeBodyForPort,
  summarizeBodyForDebug,
} from "../shared/bodySerialization";
import type { AnyObject } from "../shared/constants";
import { PORT_NAME, TYPE_XHR_ACK, TYPE_XHR_EVENT } from "../shared/constants";
import { browser } from "wxt/browser";
import { postToPage } from "../shared/transport";
import {
  ExtensionContextInvalidatedError,
  isContextInvalidatedError,
  isExtensionContextValid,
  lastErrorMessage,
  runtimeMessagesUseStructuredClone,
} from "../shared/webext";
import {
  isYandexApiHostname,
  shouldStripYandexHeader,
} from "../shared/yandexHeaders";
import { formatBridgeRestartError } from "./lifecycle";

type UaBrandVersion = { brand: string; version: string };
type XhrPortState = {
  readonly requestId: string;
  port: {
    onMessage: { addListener: (fn: (msg: AnyObject) => void) => void };
    onDisconnect: { addListener: (fn: () => void) => void };
    postMessage: (msg: AnyObject) => void;
    disconnect: () => void;
  };
  url: string;
  responseType: string;
  chunks: ArrayBuffer[];
  totalBytes: number;
};

const UA_CH_CACHE_TTL_MS = 10 * 60 * 1000;
const UA_CH_HIGH_ENTROPY_HINTS = ["fullVersionList"];
const TERMINAL_XHR_EVENT_TYPES = new Set(["load", "error", "timeout", "abort"]);
const EMPTY_HEADERS = Object.freeze({}) as Readonly<Record<string, string>>;
const ESCAPED_DOUBLE_QUOTE = String.raw`\"`;

let cachedUaChHeaders: Readonly<Record<string, string>> = EMPTY_HEADERS;
let cachedUaChHeadersExpiresAt = 0;
let cachedUaChHeadersPromise: Promise<Readonly<Record<string, string>>> | null =
  null;

const xhrPorts = new Map<string, XhrPortState>();

function escapeHeaderValue(value: string): string {
  return value.replaceAll('"', ESCAPED_DOUBLE_QUOTE);
}

function formatUaBrands(brands: UaBrandVersion[]): string {
  return brands
    .filter(
      (b) => b && typeof b.brand === "string" && typeof b.version === "string",
    )
    .map(
      (b) =>
        `"${escapeHeaderValue(b.brand)}";v="${escapeHeaderValue(b.version)}"`,
    )
    .join(", ");
}

async function getUaChHeaders(): Promise<Record<string, string>> {
  const uaData = (
    navigator as Navigator & {
      userAgentData?: {
        brands?: UaBrandVersion[];
        uaList?: UaBrandVersion[];
        mobile?: boolean;
        platform?: string;
        getHighEntropyValues?: (
          values: string[],
        ) => Promise<{ fullVersionList?: UaBrandVersion[] }>;
      };
    }
  )?.userAgentData;
  if (!uaData) return {};

  const headers: Record<string, string> = {};
  const brands: UaBrandVersion[] =
    (Array.isArray(uaData.brands) && uaData.brands) ||
    (Array.isArray(uaData.uaList) && uaData.uaList) ||
    [];

  if (brands.length) headers["sec-ch-ua"] = formatUaBrands(brands);
  if (typeof uaData.mobile === "boolean") {
    headers["sec-ch-ua-mobile"] = uaData.mobile ? "?1" : "?0";
  }
  if (typeof uaData.platform === "string" && uaData.platform) {
    headers["sec-ch-ua-platform"] = `"${escapeHeaderValue(uaData.platform)}"`;
  }

  try {
    const high = await uaData.getHighEntropyValues?.(UA_CH_HIGH_ENTROPY_HINTS);
    if (Array.isArray(high?.fullVersionList) && high.fullVersionList.length) {
      headers["sec-ch-ua-full-version-list"] = formatUaBrands(
        high.fullVersionList,
      );
    }
  } catch {
    // ignore optional high entropy lookup failures
  }

  return headers;
}

async function getCachedUaChHeaders(): Promise<
  Readonly<Record<string, string>>
> {
  const now = Date.now();
  if (now < cachedUaChHeadersExpiresAt) {
    return cachedUaChHeaders;
  }
  if (cachedUaChHeadersPromise !== null) {
    return await cachedUaChHeadersPromise;
  }

  cachedUaChHeadersPromise = (async () => {
    const headers = Object.freeze({ ...(await getUaChHeaders()) });
    cachedUaChHeaders = headers;
    cachedUaChHeadersExpiresAt = Date.now() + UA_CH_CACHE_TTL_MS;
    return headers;
  })();

  try {
    return await cachedUaChHeadersPromise;
  } finally {
    cachedUaChHeadersPromise = null;
  }
}

function ensureHeadersObject(details: AnyObject): Record<string, string> {
  const raw = details?.headers;
  const headers: Record<string, unknown> =
    raw && typeof raw === "object" ? raw : {};
  for (const [name, value] of Object.entries(headers)) {
    if (typeof value === "string") continue;
    if (typeof value === "number" || typeof value === "boolean") {
      headers[name] = String(value);
      continue;
    }
    delete headers[name];
  }

  details.headers = headers;
  return headers as Record<string, string>;
}

function stripYandexHeaders(headers: Record<string, string>): void {
  for (const headerName of Object.keys(headers)) {
    if (shouldStripYandexHeader(headerName)) {
      delete headers[headerName];
    }
  }
}

function mergeHeadersIfMissing(
  headers: Record<string, string>,
  additions: Readonly<Record<string, string>>,
): void {
  const existingNames = new Set(
    Object.keys(headers).map((name) => name.toLowerCase()),
  );

  for (const [name, value] of Object.entries(additions)) {
    if (!value) continue;
    const normalizedName = name.toLowerCase();
    if (existingNames.has(normalizedName)) continue;
    headers[name] = value;
    existingNames.add(normalizedName);
  }
}

function settleXhrPort(state: XhrPortState, abort = false): void {
  if (!isRequestStateActive(state)) return;
  xhrPorts.delete(state.requestId);
  state.chunks.length = 0;
  state.totalBytes = 0;

  if (abort) {
    try {
      state.port.postMessage({ type: "abort" });
    } catch {
      // The port may already be disconnected.
    }
  }
  try {
    state.port.disconnect();
  } catch {
    // The extension context may already be invalidated.
  }
}

/**
 * Settles the request (if still tracked) and posts a terminal error. A context
 * invalidation is tagged with BRIDGE_RESTART_ERROR_CODE so the page retries
 * through the next bridge instead of failing for good.
 */
function failBridgeXhr(requestId: string, url: string, error: unknown): void {
  const message = toErrorMessage(error);
  postBridgeXhrError(
    requestId,
    url,
    isContextInvalidatedError(error)
      ? formatBridgeRestartError(message)
      : message,
  );
}

function postBridgeXhrError(
  requestId: string,
  url: string,
  message: string,
): void {
  const st = xhrPorts.get(requestId);
  if (st) settleXhrPort(st);
  postXhrEvent(requestId, {
    type: "error",
    error: createTerminalXhrError(url, message),
  });
}

function isRequestStateActive(state: XhrPortState): boolean {
  return xhrPorts.get(state.requestId) === state;
}

function postXhrEvent(requestId: string, payload: AnyObject): void {
  const kind = String(payload?.type ?? "");
  postToPage({
    type: TYPE_XHR_EVENT,
    requestId,
    payload: {
      ...payload,
      state: kind === "progress" ? "in_flight" : "terminal",
    },
  });
}

function resolveBinaryResponseBuffer(
  directResponse: unknown,
  chunks: ArrayBuffer[],
  totalBytes: number,
  fallbackB64: unknown,
): ArrayBuffer {
  if (directResponse instanceof ArrayBuffer) {
    return directResponse;
  }
  try {
    if (ArrayBuffer.isView(directResponse)) {
      const view = directResponse;
      const out = new Uint8Array(view.byteLength);
      out.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
      return out.buffer;
    }
  } catch {
    // ignore and continue
  }
  if (totalBytes > 0) {
    const out = new Uint8Array(totalBytes);
    let offset = 0;
    for (const ab of chunks) {
      const u8 = new Uint8Array(ab);
      out.set(u8, offset);
      offset += u8.byteLength;
    }
    return out.buffer;
  }
  if (typeof fallbackB64 === "string" && fallbackB64.length > 0) {
    return base64ToArrayBuffer(fallbackB64);
  }
  return new ArrayBuffer(0);
}

function logBridgeXhrStart(requestId: string, safeDetails: AnyObject): void {
  debug.log("[VOT EXT][bridge] startXhr", {
    requestId,
    url: safeDetails?.url,
    method: safeDetails?.method,
    responseType: safeDetails?.responseType,
    timeoutMs: Number(safeDetails?.timeout ?? 0),
    headerCount:
      safeDetails?.headers && typeof safeDetails.headers === "object"
        ? Object.keys(safeDetails.headers).length
        : 0,
    body: summarizeBodyForDebug(safeDetails?.data),
  });
}

function logBridgePortMessage(requestId: string, msg: AnyObject): void {
  debug.log("[VOT EXT][bridge] port message", {
    requestId,
    kind: msg.type ?? "unknown",
    state: msg.state ?? null,
    status:
      msg.response?.status ?? msg.error?.status ?? msg.progress?.status ?? null,
    loaded: msg.progress?.loaded ?? null,
    total: msg.progress?.total ?? null,
  });
}

function applyBridgeProgressChunk(st: XhrPortState, msg: AnyObject): void {
  if (msg.type !== "progress" || !msg.progress) {
    return;
  }

  let chunk = msg.progress.chunk;
  if (!(chunk instanceof ArrayBuffer)) {
    const b64 = msg.progress.chunkB64;
    if (typeof b64 !== "string" || !b64.length) return;
    chunk = base64ToArrayBuffer(b64);
    msg.progress.chunk = chunk;
    delete msg.progress.chunkB64;
  }

  // postToPage transfers the original buffer, so retain an independent copy.
  const aggregateCopy = chunk.slice(0);
  st.chunks.push(aggregateCopy);
  st.totalBytes += aggregateCopy.byteLength;
}

function applyBridgeBinaryLoadResponse(st: XhrPortState, msg: AnyObject): void {
  if (msg.type !== "load" || !msg.response) {
    return;
  }

  const rt = String(
    msg.response.responseType || st.responseType || "text",
  ).toLowerCase();
  if (rt !== "arraybuffer" && rt !== "blob") {
    return;
  }

  const ab = resolveBinaryResponseBuffer(
    msg.response.response,
    st.chunks,
    st.totalBytes,
    msg.response.responseB64,
  );
  delete msg.response.responseB64;
  st.chunks.length = 0;
  st.totalBytes = 0;

  if (rt === "blob") {
    const ct = msg.response.contentType || msg.response.mime || undefined;
    msg.response.response = ct
      ? new Blob([ab], { type: String(ct) })
      : new Blob([ab]);
    return;
  }

  msg.response.response = ab;
}

function handleBridgePortMessage(state: XhrPortState, msg: AnyObject): void {
  if (!isRequestStateActive(state)) return;
  const { requestId } = state;
  if (!msg || typeof msg !== "object") return;

  logBridgePortMessage(requestId, msg);
  applyBridgeProgressChunk(state, msg);
  applyBridgeBinaryLoadResponse(state, msg);
  postXhrEvent(requestId, msg);
  if (TERMINAL_XHR_EVENT_TYPES.has(String(msg.type ?? ""))) {
    settleXhrPort(state);
  }
}

function handleBridgePortDisconnect(
  st: XhrPortState,
  lastError: string | null,
): void {
  if (!isRequestStateActive(st)) return;
  const { requestId } = st;

  // runtime.id is the only reliable invalidation signal. With it still
  // present the background worker merely restarted mid-request (transient).
  const error = isExtensionContextValid()
    ? new Error("Bridge port disconnected before response")
    : new ExtensionContextInvalidatedError();
  debug.warn("[VOT EXT][bridge] port disconnected before terminal event", {
    requestId,
    url: st.url,
    lastError,
    contextLost: error instanceof ExtensionContextInvalidatedError,
  });
  failBridgeXhr(requestId, st.url, error);
}

async function normalizeYandexBridgeHeaders(
  safeDetails: AnyObject,
  state: XhrPortState,
): Promise<void> {
  const urlStr = String(safeDetails?.url ?? "");
  try {
    if (!isYandexApiHostname(new URL(urlStr).hostname)) return;
  } catch {
    return;
  }

  const headers = ensureHeadersObject(safeDetails);
  stripYandexHeaders(headers);

  const uaCh = await getCachedUaChHeaders();
  if (!isRequestStateActive(state)) return;
  mergeHeadersIfMissing(headers, uaCh);

  debug.log("[VOT EXT][bridge] yandex header normalization", {
    requestId: state.requestId,
    url: urlStr,
    headerCount: Object.keys(headers).length,
    headerNames: Object.keys(headers),
  });
}

export async function startBridgeXhr(
  requestId: string,
  details: AnyObject,
): Promise<void> {
  const normalizedRequestId = String(requestId || "");
  const safeDetails: AnyObject = details ?? {};
  let state: XhrPortState | undefined;

  try {
    if (!normalizedRequestId) {
      throw new Error("Missing requestId for bridge XHR");
    }
    requestId = normalizedRequestId;

    if (xhrPorts.has(requestId)) {
      debug.warn("[VOT EXT][bridge] replacing active XHR request", {
        requestId,
      });
      abortBridgeXhr(requestId);
    }

    logBridgeXhrStart(requestId, safeDetails);

    const port = browser.runtime.connect({
      name: PORT_NAME,
    }) as unknown as XhrPortState["port"];
    const responseType = String(
      safeDetails?.responseType || "text",
    ).toLowerCase();
    const nextState: XhrPortState = {
      requestId,
      port,
      url: String(safeDetails?.url || ""),
      responseType,
      chunks: [],
      totalBytes: 0,
    };
    state = nextState;
    xhrPorts.set(requestId, state);
    postToPage({
      type: TYPE_XHR_ACK,
      requestId,
      payload: {
        state: "acknowledged",
        timeoutMs: Number(safeDetails?.timeout ?? 0),
        responseType,
        ts: Date.now(),
      },
    });
    // Capture the state, not just the ID: a replaced port can still deliver
    // queued messages or disconnect after its successor has started.
    port.onMessage.addListener((msg: AnyObject) => {
      handleBridgePortMessage(nextState, msg);
    });
    port.onDisconnect.addListener(() => {
      // Always consume lastError, including callbacks from obsolete ports.
      handleBridgePortDisconnect(nextState, lastErrorMessage());
    });
    await normalizeYandexBridgeHeaders(safeDetails, state);

    if (!isRequestStateActive(state)) return;

    const data =
      isBodySerializedForPort(safeDetails.data) ||
      runtimeMessagesUseStructuredClone
        ? safeDetails.data
        : await serializeBodyForPort(safeDetails.data);
    debug.log("[VOT EXT][bridge] serialized body", {
      requestId,
      url: safeDetails?.url ?? null,
      from: summarizeBodyForDebug(safeDetails?.data),
      to: summarizeBodyForDebug(data),
    });

    if (!isRequestStateActive(state)) return;

    const serializedDetails: AnyObject = {
      ...safeDetails,
      data,
      responseType: safeDetails?.responseType,
    };
    debug.log("[VOT EXT][bridge] post start to background", {
      requestId,
      url: serializedDetails.url,
      method: serializedDetails.method,
      responseType: serializedDetails.responseType,
      body: summarizeBodyForDebug(serializedDetails.data),
    });
    state.port.postMessage({ type: "start", details: serializedDetails });
  } catch (error: unknown) {
    if (state && !isRequestStateActive(state)) return;
    debug.log("[VOT EXT][bridge] startXhr error", {
      requestId: normalizedRequestId,
      error: toErrorMessage(error),
      contextLost: isContextInvalidatedError(error),
    });
    if (normalizedRequestId) {
      failBridgeXhr(normalizedRequestId, String(safeDetails?.url || ""), error);
    }
  }
}

export function abortBridgeXhr(requestId: string): void {
  const st = xhrPorts.get(requestId);
  if (!st) return;
  debug.warn("[VOT EXT][bridge] abortXhr", { requestId });
  settleXhrPort(st, true);
}

/**
 * Terminates a request that never reached the background (e.g. the bridge
 * found its extension context dead before starting it).
 */
export function rejectBridgeXhr(
  requestId: string,
  details: AnyObject,
  message: string,
): void {
  if (!requestId) return;
  postBridgeXhrError(requestId, String(details?.url || ""), message);
}

/**
 * Settles every in-flight request with a terminal error tagged with
 * BRIDGE_RESTART_ERROR_CODE (so the page retries via the next bridge) and
 * disconnects their ports. Called when the bridge lifecycle retires.
 */
export function failAllBridgeXhrs(reason = "bridge retired"): void {
  if (!xhrPorts.size) return;
  const message = formatBridgeRestartError(`Bridge retired (${reason})`);
  for (const [requestId, st] of xhrPorts) {
    postBridgeXhrError(requestId, st.url, message);
  }
}
