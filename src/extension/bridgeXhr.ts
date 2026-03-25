import debug from "../utils/debug";
import { toErrorMessage } from "../utils/errors";
import {
  base64ToArrayBuffer,
  isBodySerializedForPort,
  serializeBodyForPort,
  summarizeBodyForDebug,
} from "./bodySerialization";
import { toPageMessage } from "./bridgeTransport";
import type { AnyObject } from "./constants";
import { PORT_NAME, TYPE_XHR_ACK, TYPE_XHR_EVENT } from "./constants";
import { ext, runtimeMessagesUseStructuredClone } from "./webext";
import { isYandexApiHostname, shouldStripYandexHeader } from "./yandexHeaders";

type UaBrandVersion = { brand: string; version: string };
type XhrPortState = {
  port: {
    onMessage: { addListener: (fn: (msg: AnyObject) => void) => void };
    onDisconnect: { addListener: (fn: () => void) => void };
    postMessage: (msg: AnyObject) => void;
    disconnect: () => void;
  };
  responseType: string;
  chunks: ArrayBuffer[];
  totalBytes: number;
  settled: boolean;
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

function freezeHeaders(
  headers: Record<string, string>,
): Readonly<Record<string, string>> {
  return Object.freeze({ ...headers });
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
    const headers = freezeHeaders(await getUaChHeaders());
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
  if (!raw || typeof raw !== "object") {
    const headers: Record<string, string> = {};
    details.headers = headers;
    return headers;
  }

  const headers = raw as Record<string, unknown>;
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
  const existingNames = new Set<string>();
  for (const name of Object.keys(headers)) {
    existingNames.add(name.toLowerCase());
  }

  for (const [name, value] of Object.entries(additions)) {
    if (!value) continue;
    const normalizedName = name.toLowerCase();
    if (existingNames.has(normalizedName)) continue;
    headers[name] = value;
    existingNames.add(normalizedName);
  }
}

function getHostname(url: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function postToPage(payload: AnyObject) {
  const { message, transfer } = toPageMessage(payload);
  if (transfer.length) {
    globalThis.postMessage(message, "*", transfer);
    return;
  }
  globalThis.postMessage(message, "*");
}

function disconnectPortSafely(port: XhrPortState["port"]): void {
  try {
    port.disconnect();
  } catch {
    // ignore
  }
}

function settleXhrPort(requestId: string, state: XhrPortState): void {
  state.settled = true;
  disconnectPortSafely(state.port);
  xhrPorts.delete(requestId);
}

function isRequestStateActive(
  requestId: string,
  expectedState: XhrPortState,
): boolean {
  const currentState = xhrPorts.get(requestId);
  return currentState === expectedState && !currentState.settled;
}

function toLifecycleState(kind: string): "in_flight" | "terminal" {
  return kind === "progress" ? "in_flight" : "terminal";
}

function postXhrEvent(requestId: string, payload: AnyObject): void {
  const kind = String(payload?.type ?? "");
  postToPage({
    type: TYPE_XHR_EVENT,
    requestId,
    payload: {
      ...payload,
      state: toLifecycleState(kind),
    },
  });
}

function makeBridgeXhrError(details: AnyObject, error: string): AnyObject {
  return {
    finalUrl: String(details?.url || ""),
    readyState: 4,
    status: 0,
    statusText: "",
    responseHeaders: "",
    response: null,
    responseText: "",
    error,
  };
}

function concatArrayBuffers(
  chunks: ArrayBuffer[],
  totalBytes: number,
): ArrayBuffer {
  const out = new Uint8Array(totalBytes);
  let offset = 0;
  for (const ab of chunks) {
    const u8 = new Uint8Array(ab);
    out.set(u8, offset);
    offset += u8.byteLength;
  }
  return out.buffer;
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
    return concatArrayBuffers(chunks, totalBytes);
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

function createXhrPortState(
  port: XhrPortState["port"],
  responseType: string,
): XhrPortState {
  return {
    port,
    responseType,
    chunks: [],
    totalBytes: 0,
    settled: false,
  };
}

function postBridgeXhrAck(
  requestId: string,
  safeDetails: AnyObject,
  responseType: string,
): void {
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

  if (msg.progress.chunk instanceof ArrayBuffer) {
    const aggregateCopy = msg.progress.chunk.slice(0);
    st.chunks.push(aggregateCopy);
    st.totalBytes += aggregateCopy.byteLength;
    return;
  }

  const b64 = msg.progress.chunkB64;
  if (typeof b64 !== "string" || !b64.length) {
    return;
  }

  const ab = base64ToArrayBuffer(b64);
  const aggregateCopy = ab.slice(0);
  st.chunks.push(aggregateCopy);
  st.totalBytes += aggregateCopy.byteLength;
  msg.progress.chunk = ab;
  delete msg.progress.chunkB64;
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

function settleBridgePortOnTerminalEvent(
  requestId: string,
  st: XhrPortState,
  msg: AnyObject,
): void {
  if (!TERMINAL_XHR_EVENT_TYPES.has(String(msg.type ?? ""))) {
    return;
  }

  debug.log("[VOT EXT][bridge] terminal event", {
    requestId,
    kind: msg.type,
    status: msg.response?.status ?? msg.error?.status ?? null,
  });
  settleXhrPort(requestId, st);
}

function handleBridgePortMessage(requestId: string, msg: AnyObject): void {
  const st = xhrPorts.get(requestId);
  if (!st || st.settled) return;
  if (!msg || typeof msg !== "object") return;

  logBridgePortMessage(requestId, msg);
  applyBridgeProgressChunk(st, msg);
  applyBridgeBinaryLoadResponse(st, msg);
  postXhrEvent(requestId, msg);
  settleBridgePortOnTerminalEvent(requestId, st, msg);
}

function handleBridgePortDisconnect(
  requestId: string,
  safeDetails: AnyObject,
): void {
  const st = xhrPorts.get(requestId);
  if (!st || st.settled) return;

  debug.warn("[VOT EXT][bridge] port disconnected before terminal event", {
    requestId,
    url: safeDetails?.url ?? null,
  });
  settleXhrPort(requestId, st);
  postXhrEvent(requestId, {
    type: "error",
    error: makeBridgeXhrError(
      safeDetails,
      "Bridge port disconnected before response",
    ),
  });
}

function attachBridgePortListeners(
  requestId: string,
  port: XhrPortState["port"],
  safeDetails: AnyObject,
): void {
  port.onMessage.addListener((msg: AnyObject) => {
    handleBridgePortMessage(requestId, msg);
  });
  port.onDisconnect.addListener(() => {
    handleBridgePortDisconnect(requestId, safeDetails);
  });
}

async function normalizeYandexBridgeHeaders(
  requestId: string,
  safeDetails: AnyObject,
  state: XhrPortState,
): Promise<void> {
  const urlStr = String(safeDetails?.url ?? "");
  const hostname = getHostname(urlStr);
  if (!isYandexApiHostname(hostname)) {
    return;
  }

  const headers = ensureHeadersObject(safeDetails);
  stripYandexHeaders(headers);

  const uaCh = await getCachedUaChHeaders();
  if (!isRequestStateActive(requestId, state)) return;
  mergeHeadersIfMissing(headers, uaCh);

  debug.log("[VOT EXT][bridge] yandex header normalization", {
    requestId,
    url: urlStr,
    headerCount: Object.keys(headers).length,
    headerNames: Object.keys(headers),
  });
}

async function serializeBridgeRequestData(
  safeDetails: AnyObject,
): Promise<AnyObject["data"]> {
  if (isBodySerializedForPort(safeDetails?.data)) {
    return safeDetails.data;
  }

  if (runtimeMessagesUseStructuredClone) {
    return safeDetails?.data;
  }

  return await serializeBodyForPort(safeDetails?.data);
}

function buildSerializedBridgeDetails(
  safeDetails: AnyObject,
  data: AnyObject["data"],
): AnyObject {
  return {
    ...safeDetails,
    data,
    responseType: safeDetails?.responseType,
  };
}

function logSerializedBridgeBody(
  requestId: string,
  safeDetails: AnyObject,
  data: AnyObject["data"],
): void {
  const serializedBodySummary = summarizeBodyForDebug(data);
  debug.log("[VOT EXT][bridge] serialized body", {
    requestId,
    url: safeDetails?.url ?? null,
    from: summarizeBodyForDebug(safeDetails?.data),
    to: serializedBodySummary,
  });
}

function postBridgeStart(
  requestId: string,
  state: XhrPortState,
  serializedDetails: AnyObject,
): void {
  debug.log("[VOT EXT][bridge] post start to background", {
    requestId,
    url: serializedDetails.url,
    method: serializedDetails.method,
    responseType: serializedDetails.responseType,
    body: summarizeBodyForDebug(serializedDetails.data),
  });
  state.port.postMessage({ type: "start", details: serializedDetails });
}

function handleStartXhrError(
  requestId: string,
  normalizedRequestId: string,
  safeDetails: AnyObject,
  error: unknown,
): void {
  const requestKey = normalizedRequestId || requestId;
  const st = xhrPorts.get(requestKey);
  if (st && !st.settled) {
    settleXhrPort(requestKey, st);
  }

  const errorMessage = toErrorMessage(error);
  debug.log("[VOT EXT][bridge] startXhr error", {
    requestId: requestKey,
    error: errorMessage,
    lastError: ext?.runtime?.lastError ?? null,
  });

  if (requestKey) {
    postXhrEvent(requestKey, {
      type: "error",
      error: makeBridgeXhrError(safeDetails, errorMessage),
    });
  }
}

export async function startBridgeXhr(
  requestId: string,
  details: AnyObject,
): Promise<void> {
  const normalizedRequestId = String(requestId || "");
  const safeDetails: AnyObject = details ?? {};

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

    const connected = ext?.runtime?.connect?.({ name: PORT_NAME });
    if (!connected || typeof connected !== "object") {
      throw new Error("Bridge port is not available");
    }
    const port = connected as XhrPortState["port"];
    const responseType = String(
      safeDetails?.responseType || "text",
    ).toLowerCase();
    const state = createXhrPortState(port, responseType);
    xhrPorts.set(requestId, state);
    postBridgeXhrAck(requestId, safeDetails, responseType);
    attachBridgePortListeners(requestId, port, safeDetails);
    await normalizeYandexBridgeHeaders(requestId, safeDetails, state);

    if (!isRequestStateActive(requestId, state)) return;

    const data = await serializeBridgeRequestData(safeDetails);
    logSerializedBridgeBody(requestId, safeDetails, data);

    if (!isRequestStateActive(requestId, state)) return;

    const serializedDetails = buildSerializedBridgeDetails(safeDetails, data);
    postBridgeStart(requestId, state, serializedDetails);
  } catch (error: unknown) {
    handleStartXhrError(requestId, normalizedRequestId, safeDetails, error);
  }
}

export function abortBridgeXhr(requestId: string): void {
  const st = xhrPorts.get(requestId);
  if (!st || st.settled) return;
  st.settled = true;

  debug.warn("[VOT EXT][bridge] abortXhr", { requestId });

  try {
    st.port.postMessage({ type: "abort" });
  } catch {
    // ignore
  }

  disconnectPortSafely(st.port);
  xhrPorts.delete(requestId);
}
