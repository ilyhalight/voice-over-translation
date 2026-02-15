import debug from "../utils/debug";
import { base64ToArrayBuffer } from "./base64";
import {
  serializeBodyForPort,
  summarizeBodyForDebug,
} from "./bodySerialization";
import { toPageMessage } from "./bridgeTransport";
import {
  type AnyObject,
  type BridgeWireMessage,
  isOurMessage,
  PORT_NAME,
  TYPE_NOTIFY,
  TYPE_REQ,
  TYPE_RES,
  TYPE_XHR_ABORT,
  TYPE_XHR_ACK,
  TYPE_XHR_EVENT,
  TYPE_XHR_START,
} from "./constants";
import { ext, storageGet, storageRemove, storageSet } from "./webext";
import { isYandexApiHostname, shouldStripYandexHeader } from "./yandexHeaders";

const BRIDGE_BOOT_KEY = "__VOT_EXT_BRIDGE_BOOTED__";

/**
 * VOT Extension bridge (ISOLATED world content script).
 *
 * MAIN-world content scripts have direct access to the page JS context but do
 * NOT have access to WebExtension APIs (runtime/storage/etc.).
 *
 * This file runs in the default (ISOLATED) content-script world and exposes a
 * minimal "userscript" API surface to the MAIN-world bundle via
 * globalThis.postMessage:
 *   - GM.getValue / setValue / deleteValue / listValues / getValues
 *   - GM_xmlhttpRequest (proxied through the background service worker)
 *   - GM_notification (proxied through the background service worker)
 */

type UaBrandVersion = { brand: string; version: string };
const UA_CH_CACHE_TTL_MS = 10 * 60 * 1000;
let cachedUaChHeaders: Record<string, string> | null = null;
let cachedUaChHeadersExpiresAt = 0;
let cachedUaChHeadersPromise: Promise<Record<string, string>> | null = null;

// -- UA Client Hints helpers -------------------------------------------------
//
// Some endpoints (notably api.browser.yandex.ru) validate that requests look
// like they were initiated by a real Chromium tab. When we proxy requests via
// the extension service worker, Chromium may omit high-entropy UA-CH headers.
//
// We collect UA-CH from the tab (content-script context) and forward them as
// request headers. The background service worker then injects them using
// declarativeNetRequest.modifyHeaders because `sec-ch-ua*` headers are
// forbidden to set from fetch/XHR.
//
// This mirrors the overall architecture used by userscript managers such as
// ScriptCat (content-side API -> privileged background operations).

function escapeHeaderValue(value: string): string {
  // Avoid breaking quoted header values.
  return value.replace(/"/g, '\\"');
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

/**
 * Return the minimal UA-CH header set required by the valid request capture.
 *
 * Important: do NOT include other high-entropy UA-CH headers (arch/bitness/
 * platform-version/full-version/model). Those extra headers were present in
 * the invalid request capture and must not be emitted.
 */
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
    // Some Chromium variants used `uaList` historically.
    (Array.isArray(uaData.uaList) && uaData.uaList) ||
    [];

  if (brands.length) headers["sec-ch-ua"] = formatUaBrands(brands);

  if (typeof uaData.mobile === "boolean")
    headers["sec-ch-ua-mobile"] = uaData.mobile ? "?1" : "?0";

  if (typeof uaData.platform === "string" && uaData.platform)
    headers["sec-ch-ua-platform"] = `"${escapeHeaderValue(uaData.platform)}"`;

  // Only request the high entropy value required by the valid capture:
  // `sec-ch-ua-full-version-list`.
  try {
    const high = await uaData.getHighEntropyValues?.(["fullVersionList"]);
    if (Array.isArray(high?.fullVersionList) && high.fullVersionList.length) {
      headers["sec-ch-ua-full-version-list"] = formatUaBrands(
        high.fullVersionList,
      );
    }
  } catch {
    // High entropy values are optional; ignore failures.
  }

  return headers;
}

async function getCachedUaChHeaders(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedUaChHeaders && now < cachedUaChHeadersExpiresAt) {
    return { ...cachedUaChHeaders };
  }
  if (cachedUaChHeadersPromise !== null) {
    return { ...(await cachedUaChHeadersPromise) };
  }

  cachedUaChHeadersPromise = (async () => {
    const headers = await getUaChHeaders();
    cachedUaChHeaders = headers;
    cachedUaChHeadersExpiresAt = Date.now() + UA_CH_CACHE_TTL_MS;
    return headers;
  })();

  try {
    return { ...(await cachedUaChHeadersPromise) };
  } finally {
    cachedUaChHeadersPromise = null;
  }
}

function ensureHeadersObject(details: AnyObject): Record<string, string> {
  const raw = details?.headers;
  if (raw && typeof raw === "object") {
    // Normalize to string values.
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v == null) continue;
      out[String(k)] = String(v);
    }
    details.headers = out;
    return out;
  }
  const out: Record<string, string> = {};
  details.headers = out;
  return out;
}

function getHeaderInsensitive(
  headers: Record<string, string>,
  name: string,
): string | undefined {
  const needle = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === needle) return v;
  }
  return undefined;
}

function setHeaderIfMissing(
  headers: Record<string, string>,
  name: string,
  value: string,
): void {
  if (!value) return;
  if (getHeaderInsensitive(headers, name) != null) return;
  headers[name] = value;
}

function deleteHeaderInsensitive(
  headers: Record<string, string>,
  name: string,
): void {
  const needle = name.toLowerCase();
  for (const k of Object.keys(headers)) {
    if (k.toLowerCase() === needle) {
      delete headers[k];
    }
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

const xhrPorts = new Map<string, XhrPortState>();

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

async function startXhr(requestId: string, details: AnyObject) {
  try {
    debug.log("[VOT EXT][bridge] startXhr", {
      requestId,
      url: details?.url,
      method: details?.method,
      responseType: details?.responseType,
      timeoutMs: Number(details?.timeout ?? 0),
      headerCount:
        details?.headers && typeof details.headers === "object"
          ? Object.keys(details.headers).length
          : 0,
      body: summarizeBodyForDebug(details?.data),
    });

    const connected = ext?.runtime?.connect?.({ name: PORT_NAME });
    if (!connected || typeof connected !== "object") {
      throw new Error("Bridge port is not available");
    }
    const port = connected as XhrPortState["port"];
    const responseType = String(details?.responseType || "text").toLowerCase();
    const state: XhrPortState = {
      port,
      responseType,
      chunks: [],
      totalBytes: 0,
      settled: false,
    };
    xhrPorts.set(requestId, state);
    postToPage({
      type: TYPE_XHR_ACK,
      requestId,
      payload: {
        state: "acknowledged",
        timeoutMs: Number(details?.timeout ?? 0),
        responseType,
        ts: Date.now(),
      },
    });

    port.onMessage.addListener((msg: AnyObject) => {
      const st = xhrPorts.get(requestId);
      if (!st || st.settled) return;
      if (!msg || typeof msg !== "object") return;

      debug.log("[VOT EXT][bridge] port message", {
        requestId,
        kind: msg.type ?? "unknown",
        state: msg.state ?? null,
        status:
          msg.response?.status ??
          msg.error?.status ??
          msg.progress?.status ??
          null,
        loaded: msg.progress?.loaded ?? null,
        total: msg.progress?.total ?? null,
      });

      // Decode binary chunks coming from the service worker (sent as base64
      // because extension messaging only supports JSON-serializable payloads).
      if (st && msg.type === "progress" && msg.progress) {
        const b64 = msg.progress.chunkB64;
        if (typeof b64 === "string" && b64.length) {
          const ab = base64ToArrayBuffer(b64);
          // Important: `msg.progress.chunk` is posted to MAIN world with
          // transferables. That detaches the transferred ArrayBuffer in this
          // realm, so we must keep our own copy for final load aggregation.
          const aggregateCopy = ab.slice(0);
          st.chunks.push(aggregateCopy);
          st.totalBytes += aggregateCopy.byteLength;
          msg.progress.chunk = ab;
          delete msg.progress.chunkB64;
        }
      }

      if (st && msg.type === "load" && msg.response) {
        const rt = String(
          msg.response.responseType || st.responseType || "text",
        ).toLowerCase();

        if (rt === "arraybuffer" || rt === "blob") {
          const directResponse = msg.response.response;
          const fallbackB64 = msg.response.responseB64;
          const ab =
            directResponse instanceof ArrayBuffer
              ? directResponse
              : st.totalBytes > 0
                ? concatArrayBuffers(st.chunks, st.totalBytes)
                : typeof fallbackB64 === "string" && fallbackB64.length
                  ? base64ToArrayBuffer(fallbackB64)
                  : new ArrayBuffer(0);
          delete msg.response.responseB64;
          st.chunks.length = 0;
          st.totalBytes = 0;

          if (rt === "blob") {
            const ct =
              msg.response.contentType || msg.response.mime || undefined;
            msg.response.response = ct
              ? new Blob([ab], { type: String(ct) })
              : new Blob([ab]);
          } else {
            msg.response.response = ab;
          }
        }
      }

      postXhrEvent(requestId, msg);

      // Close port for terminal events.
      if (
        msg.type === "load" ||
        msg.type === "error" ||
        msg.type === "timeout" ||
        msg.type === "abort"
      ) {
        debug.log("[VOT EXT][bridge] terminal event", {
          requestId,
          kind: msg.type,
          status: msg.response?.status ?? msg.error?.status ?? null,
        });
        st.settled = true;
        try {
          port.disconnect();
        } catch {}
        xhrPorts.delete(requestId);
      }
    });

    port.onDisconnect.addListener(() => {
      const st = xhrPorts.get(requestId);
      if (!st || st.settled) return;
      debug.warn("[VOT EXT][bridge] port disconnected before terminal event", {
        requestId,
        url: details?.url ?? null,
      });
      st.settled = true;
      postXhrEvent(requestId, {
        type: "error",
        error: makeBridgeXhrError(
          details,
          "Bridge port disconnected before response",
        ),
      });
      xhrPorts.delete(requestId);
    });

    try {
      const urlStr = String(details?.url || "");
      const hostname = urlStr ? new URL(urlStr).hostname : "";
      if (isYandexApiHostname(hostname)) {
        const headers = ensureHeadersObject(details);

        for (const headerName of Object.keys(headers)) {
          if (shouldStripYandexHeader(headerName)) {
            deleteHeaderInsensitive(headers, headerName);
          }
        }

        const uaCh = await getCachedUaChHeaders();
        for (const [k, v] of Object.entries(uaCh)) {
          setHeaderIfMissing(headers, k, v);
        }

        debug.log("[VOT EXT][bridge] yandex header normalization", {
          requestId,
          url: urlStr,
          headerCount: Object.keys(headers).length,
          headerNames: Object.keys(headers),
        });
      }
    } catch {
      // best-effort only
    }

    const data = await serializeBodyForPort(details?.data);
    const serializedBodySummary = summarizeBodyForDebug(data);
    debug.log("[VOT EXT][bridge] serialized body", {
      requestId,
      url: details?.url ?? null,
      from: summarizeBodyForDebug(details?.data),
      to: serializedBodySummary,
    });

    // The request could be aborted while we're async-serializing (Blob -> bytes).
    // If so, avoid starting a network request.
    if (!xhrPorts.has(requestId)) {
      state.settled = true;
      try {
        port.disconnect();
      } catch {
        // ignore
      }
      return;
    }

    const serializedDetails: AnyObject = {
      ...details,
      data,
      responseType: details?.responseType,
    };

    debug.log("[VOT EXT][bridge] post start to background", {
      requestId,
      url: serializedDetails.url,
      method: serializedDetails.method,
      responseType: serializedDetails.responseType,
      body: serializedBodySummary,
    });

    port.postMessage({ type: "start", details: serializedDetails });
  } catch (error: unknown) {
    const st = xhrPorts.get(requestId);
    if (st) {
      st.settled = true;
      xhrPorts.delete(requestId);
      try {
        st.port.disconnect();
      } catch {
        // ignore
      }
    }
    debug.log("[VOT EXT][bridge] startXhr error", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      lastError: ext?.runtime?.lastError ?? null,
    });
    postXhrEvent(requestId, {
      type: "error",
      error: makeBridgeXhrError(
        details,
        error instanceof Error ? error.message : String(error),
      ),
    });
  }
}

function abortXhr(requestId: string) {
  const st = xhrPorts.get(requestId);
  if (!st) return;
  st.settled = true;

  debug.warn("[VOT EXT][bridge] abortXhr", { requestId });

  try {
    st.port.postMessage({ type: "abort" });
  } catch {}

  try {
    st.port.disconnect();
  } catch {}

  xhrPorts.delete(requestId);
}

async function handleRequest(
  action: string,
  payload: AnyObject,
): Promise<unknown> {
  switch (action) {
    case "handshake": {
      // Provide manifest metadata to the MAIN-world prelude.
      const manifest = ext?.runtime?.getManifest?.() ?? {};
      const id = ext?.runtime?.id ?? null;
      return { manifest, id };
    }

    case "gm_getValue": {
      const key = String(payload?.key ?? "");
      const def = payload?.def;
      const items = await storageGet({ [key]: def });
      return items[key];
    }

    case "gm_setValue": {
      const key = String(payload?.key ?? "");
      await storageSet({ [key]: payload?.value });
      return true;
    }

    case "gm_deleteValue": {
      const key = String(payload?.key ?? "");
      await storageRemove(key);
      return true;
    }

    case "gm_listValues": {
      const items = await storageGet(null);
      return Object.keys(items ?? {});
    }

    case "gm_getValues": {
      const defaults = payload?.defaults ?? {};
      const items = await storageGet(defaults);
      return items;
    }

    default:
      throw new Error(`Unknown bridge action: ${action}`);
  }
}

function sendResponse(
  id: string,
  ok: boolean,
  result?: unknown,
  error?: string,
) {
  postToPage({ type: TYPE_RES, id, ok, result, error });
}

// Guard: if the bridge cannot access extension APIs, there is nothing useful
// we can do.
const bridgeGlobal = globalThis as Record<string, unknown>;
if (bridgeGlobal[BRIDGE_BOOT_KEY]) {
  debug.log("[VOT EXT][bridge] already initialized");
} else {
  bridgeGlobal[BRIDGE_BOOT_KEY] = true;

  if (!ext?.runtime || !ext?.storage?.local) {
    console.warn("[VOT Extension] bridge: missing WebExtension APIs");
  } else {
    globalThis.addEventListener("message", async (event) => {
      if (event.source !== globalThis.window) return;
      const data = event.data as BridgeWireMessage;
      if (!isOurMessage(data)) return;

      try {
        if (data.type === TYPE_REQ) {
          const id = String(data.id ?? "");
          const action = String(data.action ?? "");
          const payload = (data.payload ?? {}) as AnyObject;
          const result = await handleRequest(action, payload);
          sendResponse(id, true, result);
          return;
        }

        if (data.type === TYPE_NOTIFY) {
          // Relay to background so we can use the privileged notifications API.
          ext?.runtime?.sendMessage?.({
            type: "gm_notification",
            details: data.details,
          });
          return;
        }

        if (data.type === TYPE_XHR_START) {
          startXhr(
            String(data.requestId ?? ""),
            (data.details ?? {}) as AnyObject,
          );
          return;
        }

        if (data.type === TYPE_XHR_ABORT) {
          abortXhr(String(data.requestId ?? ""));
          return;
        }
      } catch (err: unknown) {
        // Best-effort error reporting back to the page (only for REQ messages).
        if (data?.type === TYPE_REQ) {
          sendResponse(
            String(data.id ?? ""),
            false,
            undefined,
            err instanceof Error ? err.message : String(err),
          );
        } else {
          console.error("[VOT Extension] bridge error", err);
        }
      }
    });
  }
}
