/*
 * Manifest V3 background script for the extension build.
 *
 * - Chromium-based browsers run this file as a MV3 **service worker**.
 *
 * Responsibilities:
 *  - Perform cross-origin network requests for GM_xmlhttpRequest (content
 *    scripts are subject to page CORS restrictions).
 *  - Display notifications (GM_notification / GM.notification).
 */

import debug from "../utils/debug";
import { arrayBufferToBase64, base64ToBytes, bytesToBase64 } from "./base64";
import {
  coerceBodyToBytes,
  decodeSerializedBody,
  summarizeBodyForDebug,
} from "./bodySerialization";
import { PORT_NAME } from "./constants";
import {
  ext,
  lastErrorMessage,
  notificationsClear,
  notificationsCreate,
  tabsUpdate,
  windowsUpdate,
} from "./webext";
import {
  filterYandexHeadersForDnr,
  isYandexApiHostname,
  normalizeHeaderName,
  SUPPRESSED_UA_CH_HEADERS,
} from "./yandexHeaders";

type XhrStartMessage = {
  type: "start";
  details: {
    url: string;
    method?: string;
    headers?: Record<string, unknown>;
    data?: unknown;
    responseType?: string;
    timeout?: number;
    anonymous?: boolean;
    withCredentials?: boolean;
    // Tampermonkey exposes a few extra flags; we ignore unsupported ones.
    redirect?: RequestRedirect;
    nocache?: boolean;
    revalidate?: boolean;
  };
};

// SerializedBody type and decoding helpers live in bodySerialization.ts.

type XhrAbortMessage = { type: "abort" };

type XhrPortMessage = XhrStartMessage | XhrAbortMessage;
const MAX_INLINE_BINARY_RESPONSE_BYTES = 512 * 1024;

// -----------------------------
// declarativeNetRequest helper
// -----------------------------

/**
 * Some request headers are "forbidden" for fetch()/XHR (e.g. `Sec-*` and
 * `User-Agent`). Userscript managers (Tampermonkey/Violentmonkey) can still
 * send these headers via extension-level request interception.
 *
 * Our MV3 extension background uses `fetch()` to implement GM_xmlhttpRequest,
 * which means these headers get silently stripped and no-proxy mode breaks for
 * endpoints that expect them.
 *
 * In MV3, the supported way to modify such headers is
 * `chrome.declarativeNetRequest` ("modifyHeaders"). We install/update a
 * **session** rule scoped to requests that don't originate from a tab
 * (TAB_ID_NONE), i.e. service-worker initiated requests.
 */

const DNR_RULE_ID_YANDEX_HEADERS = 9001;
const DNR_RULE_ID_YOUTUBEI_ORIGIN = 9002;
const DNR_RULE_ID_GOOGLEVIDEO_HEADERS = 9003;
const dnrAppliedSignatures = new Map<number, string>();
let dnrRuleUpdateQueue: Promise<void> = Promise.resolve();

type DnrRequestHeaderRemove = {
  header: string;
  operation: "remove";
};
type DnrRequestHeaderSet = {
  header: string;
  operation: "set";
  value: string;
};
type DnrRequestHeader = DnrRequestHeaderRemove | DnrRequestHeaderSet;

function hasDnr(): boolean {
  return Boolean(ext?.declarativeNetRequest?.updateSessionRules);
}

function updateSessionRules(args: {
  addRules?: unknown[];
  removeRuleIds?: number[];
}): Promise<void> {
  const dnr = ext?.declarativeNetRequest;
  const updateSessionRulesFn = dnr?.updateSessionRules;
  if (typeof updateSessionRulesFn !== "function") {
    return Promise.resolve();
  }

  try {
    const maybe = updateSessionRulesFn({
      addRules: args.addRules || [],
      removeRuleIds: args.removeRuleIds || [],
    });
    if (maybe && typeof (maybe as any).then === "function") {
      return maybe as Promise<void>;
    }
  } catch {
    // fall back to callback style below
  }

  return new Promise((resolve, reject) => {
    try {
      updateSessionRulesFn(
        {
          addRules: args.addRules || [],
          removeRuleIds: args.removeRuleIds || [],
        },
        () => {
          const err = lastErrorMessage();
          if (err) reject(new Error(err));
          else resolve();
        },
      );
    } catch (e) {
      reject(e);
    }
  });
}

function isForbiddenToSetViaFetch(headerName: string): boolean {
  const n = normalizeHeaderName(headerName).toLowerCase();
  if (!n) return false;
  // Fetch "forbidden header names" (subset) that matter for VOT.
  if (n.startsWith("sec-")) return true;
  if (n.startsWith("proxy-")) return true;
  if (n === "user-agent") return true;
  if (n === "origin") return true;
  if (n === "referer") return true;
  return false;
}

function signatureFromDnrRequestHeaders(
  requestHeaders: readonly DnrRequestHeader[],
): string {
  const entries = requestHeaders
    .map(
      (h) =>
        [
          `${normalizeHeaderName(String(h.header)).toLowerCase()}:${String(h.operation)}`,
          String("value" in h ? h.value : ""),
        ] as const,
    )
    .sort((a, b) => a[0].localeCompare(b[0]));
  return JSON.stringify(entries);
}

function queueDnrSessionRuleUpdate(
  ruleId: number,
  signature: string,
  rule: unknown,
): Promise<void> {
  if (signature === dnrAppliedSignatures.get(ruleId)) {
    return Promise.resolve();
  }

  // Serialize session rule updates so concurrent requests cannot race and
  // revert each other's header set.
  dnrRuleUpdateQueue = dnrRuleUpdateQueue
    .catch(() => undefined)
    .then(async () => {
      if (signature === dnrAppliedSignatures.get(ruleId)) return;
      await updateSessionRules({
        removeRuleIds: [ruleId],
        addRules: [rule],
      });
      dnrAppliedSignatures.set(ruleId, signature);
    });

  return dnrRuleUpdateQueue;
}

async function ensureDnrHeaderRuleForYandex(
  url: string,
  forbiddenHeaders: Record<string, string>,
): Promise<void> {
  if (!hasDnr()) return;

  let hostname = "";
  try {
    hostname = new URL(url).hostname;
  } catch {
    return;
  }
  if (!isYandexApiHostname(hostname)) return;

  // ---------------------------------------------------------------------
  // Header injection / normalization
  //
  // `https://api.browser.yandex.ru/video-translation/translate` does NOT include
  // an `Origin` header.
  //
  // In MV3, fetch()/XHR cannot control forbidden headers like `Origin` or
  // `Sec-*`. We use declarativeNetRequest.modifyHeaders (session rules) to:
  //   - remove Origin completely,
  //   - remove extra UA-CH headers that were present in the broken capture,
  //   - set ONLY the minimal UA-CH headers required by the correct capture,
  //     while still allowing other required `Sec-*` headers for the endpoint
  //     (e.g. `sec-vtrans-*`).

  const requestHeaders: DnrRequestHeader[] = [
    // Must be absent in the known-good request capture.
    { header: "Origin", operation: "remove" },
    // Not present in the capture; remove if added by caller/stack.
    { header: "Referer", operation: "remove" },
    ...SUPPRESSED_UA_CH_HEADERS.map(
      (h): DnrRequestHeaderRemove => ({ header: h, operation: "remove" }),
    ),
  ];

  const headersToSet = filterYandexHeadersForDnr(forbiddenHeaders);

  for (const [header, value] of Object.entries(headersToSet)) {
    requestHeaders.push({
      header: normalizeHeaderName(header),
      operation: "set",
      value: String(value),
    });
  }

  const signature = signatureFromDnrRequestHeaders(requestHeaders);

  const rule = {
    id: DNR_RULE_ID_YANDEX_HEADERS,
    priority: 1,
    action: {
      type: "modifyHeaders",
      requestHeaders,
    },
    condition: {
      // Anchor at the URL start to avoid accidental matches.
      urlFilter: "|https://api.browser.yandex.ru/",
      // Extension-initiated fetch()/XHR can show up as "xmlhttprequest"
      // in Chromium.
      resourceTypes: ["xmlhttprequest"],
      // Only match requests not associated with a tab (service worker).
      tabIds: [-1],
    },
  };

  await queueDnrSessionRuleUpdate(DNR_RULE_ID_YANDEX_HEADERS, signature, rule);
}

function isYoutubeiApiUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "www.youtube.com" &&
      parsed.pathname.startsWith("/youtubei/")
    );
  } catch {
    return false;
  }
}

function isGooglevideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (
      parsed.protocol === "https:" &&
      (host === "googlevideo.com" || host.endsWith(".googlevideo.com"))
    );
  } catch {
    return false;
  }
}

async function ensureDnrOriginStripRuleForYoutubei(url: string): Promise<void> {
  if (!hasDnr()) return;
  if (!isYoutubeiApiUrl(url)) return;

  const requestHeaders: DnrRequestHeader[] = [
    { header: "Origin", operation: "remove" },
    { header: "x-client-data", operation: "remove" },
    { header: "x-goog-visitor-id", operation: "remove" },
  ];
  const signature = JSON.stringify({
    v: 2,
    headers: signatureFromDnrRequestHeaders(requestHeaders),
  });

  const rule = {
    id: DNR_RULE_ID_YOUTUBEI_ORIGIN,
    priority: 1,
    action: {
      type: "modifyHeaders",
      requestHeaders,
    },
    condition: {
      urlFilter: "|https://www.youtube.com/youtubei/",
      resourceTypes: ["xmlhttprequest"],
      // Scope header mutations to service-worker initiated requests.
      tabIds: [-1],
    },
  };

  await queueDnrSessionRuleUpdate(DNR_RULE_ID_YOUTUBEI_ORIGIN, signature, rule);
}

async function ensureDnrStripRuleForGooglevideo(url: string): Promise<void> {
  if (!hasDnr()) return;
  if (!isGooglevideoUrl(url)) return;

  const requestHeaders: DnrRequestHeader[] = [
    { header: "x-client-data", operation: "remove" },
  ];
  const signature = JSON.stringify({
    v: 1,
    headers: signatureFromDnrRequestHeaders(requestHeaders),
  });

  const rule = {
    id: DNR_RULE_ID_GOOGLEVIDEO_HEADERS,
    priority: 1,
    action: {
      type: "modifyHeaders",
      requestHeaders,
    },
    condition: {
      urlFilter: "||googlevideo.com/",
      resourceTypes: ["xmlhttprequest"],
      // Scope header mutations to service-worker initiated requests.
      tabIds: [-1],
    },
  };

  await queueDnrSessionRuleUpdate(
    DNR_RULE_ID_GOOGLEVIDEO_HEADERS,
    signature,
    rule,
  );
}

function asErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    try {
      return JSON.stringify(err);
    } catch {
      return Object.prototype.toString.call(err);
    }
  }
  try {
    return String(err);
  } catch {
    return "Unknown error";
  }
}

function formatHeaders(headers: Headers): string {
  // Tampermonkey's GM_xmlhttpRequest returns a raw header string.
  return Array.from(headers.entries())
    .map(([k, v]) => `${k}: ${v}`)
    .join("\r\n");
}

function toHeaderRecord(
  input: Record<string, unknown> | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!input) return out;
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined) continue;
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      out[String(k)] = String(v);
    }
  }
  return out;
}

type XhrResponse = {
  finalUrl: string;
  readyState: number;
  status: number;
  statusText: string;
  responseHeaders: string;
  // Extra metadata to help the content-script bridge reconstruct binary bodies
  // without having to ship non-JSON types through extension messaging.
  responseType?: string;
  contentType?: string;
  // Optional fallback for binary payloads in terminal messages.
  responseB64?: string;
  response?: unknown;
  responseText?: string;
  error?: string;
};

function createTerminalXhrError(url: string, error: string): XhrResponse {
  return {
    finalUrl: url,
    readyState: 4,
    status: 0,
    statusText: "",
    responseHeaders: "",
    response: null,
    responseText: "",
    error,
  };
}

function getHeader(
  headers: Record<string, string>,
  name: string,
): string | undefined {
  const needle = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (String(k).toLowerCase() === needle) return String(v);
  }
  return undefined;
}

function isProtobufContentType(contentType: string | undefined): boolean {
  const ct = String(contentType || "").toLowerCase();
  if (!ct) return false;
  return (
    ct.includes("application/x-protobuf") ||
    ct.includes("application/protobuf") ||
    ct.includes("application/octet-stream")
  );
}

function tryDecodeStrictBase64Payload(s: string): Uint8Array | null {
  const str = String(s || "");
  if (!str || /\s/.test(str)) return null;
  if (!/^[A-Za-z0-9+/=_-]+$/.test(str)) return null;
  // Require explicit base64/base64url markers to avoid decoding plain tokens.
  if (!/[+/=_-]/.test(str)) return null;

  const normalized = str.replaceAll("-", "+").replaceAll("_", "/");
  const remainder = normalized.length % 4;
  if (remainder === 1) return null;
  const padded =
    remainder === 0 ? normalized : `${normalized}${"=".repeat(4 - remainder)}`;

  try {
    return base64ToBytes(padded);
  } catch {
    return null;
  }
}

function latin1StringToBytes(s: string): Uint8Array {
  const str = String(s || "");
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i += 1) {
    out[i] = (str.codePointAt(i) ?? 0) & 0xff;
  }
  return out;
}

function looksLikeObjectToStringPayload(value: string): boolean {
  return /^\[object [^\]]+\]$/.test(String(value || "").trim());
}

// -----------------------------
// GM_xmlhttpRequest bridge
// -----------------------------

let xhrSessionSeq = 0;

ext?.runtime?.onConnect?.addListener?.((port: unknown) => {
  if (!port || typeof port !== "object") return;
  const typedPort = port as {
    name?: string;
    onDisconnect?: { addListener?: (fn: () => void) => void };
    onMessage?: { addListener?: (fn: (msg: XhrPortMessage) => void) => void };
    postMessage?: (payload: unknown) => void;
  };
  if (typedPort.name !== PORT_NAME) return;
  if (
    typeof typedPort.onDisconnect?.addListener !== "function" ||
    typeof typedPort.onMessage?.addListener !== "function" ||
    typeof typedPort.postMessage !== "function"
  ) {
    return;
  }

  const safePostMessage = (payload: unknown) => {
    typedPort.postMessage?.(payload);
  };

  xhrSessionSeq += 1;
  const xhrSessionId = xhrSessionSeq;

  let controller: AbortController | null = null;
  let timeoutId: number | null = null;
  let abortedByUser = false;
  let timedOut = false;

  const cleanup = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  typedPort.onDisconnect.addListener(() => {
    cleanup();
    debug.warn("[VOT EXT][background][xhr] port disconnected", {
      xhrSessionId,
    });
    try {
      controller?.abort();
    } catch {
      // ignore
    }
  });

  typedPort.onMessage.addListener(async (msg: XhrPortMessage) => {
    if (!msg || typeof msg !== "object") return;

    if (msg.type === "abort") {
      abortedByUser = true;
      debug.warn("[VOT EXT][background][xhr] abort requested", {
        xhrSessionId,
      });
      try {
        controller?.abort();
      } catch {
        // ignore
      }
      return;
    }

    if (msg.type !== "start") return;
    // Preserve "abort-before-start" semantics only when no request has been
    // started on this port yet. Otherwise, allow the next request to proceed.
    const shouldAbortImmediately = abortedByUser && controller === null;
    abortedByUser = false;

    const { details } = msg;
    const url = details.url;
    const method = (details.method || "GET").toUpperCase();
    const allHeaders = toHeaderRecord(details.headers);
    const headers: Record<string, string> = {};
    const forbiddenHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(allHeaders)) {
      if (isForbiddenToSetViaFetch(k)) forbiddenHeaders[k] = v;
      else headers[k] = v;
    }
    const timeout = Number(details.timeout || 0);
    const responseType = String(details.responseType || "text").toLowerCase();
    debug.log("[VOT EXT][background][xhr] start", {
      xhrSessionId,
      state: "in_flight",
      url,
      method,
      responseType,
      timeoutMs: timeout,
      headerCount: Object.keys(allHeaders).length,
      headerNames: Object.keys(allHeaders),
      forbiddenHeaderNames: Object.keys(forbiddenHeaders),
      body: summarizeBodyForDebug(details.data),
    });

    // If the caller aborted before we even received the start payload,
    // respond immediately without starting a network request.
    if (shouldAbortImmediately) {
      const errorObj: XhrResponse = {
        finalUrl: url,
        readyState: 4,
        status: 0,
        statusText: "",
        responseHeaders: "",
        response: null,
        responseText: "",
        error: "Aborted",
      };
      try {
        safePostMessage({ type: "abort", state: "terminal", error: errorObj });
      } catch {
        // ignore
      }
      return;
    }

    timedOut = false;
    controller = new AbortController();

    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        timedOut = true;
        try {
          controller?.abort();
        } catch {
          // ignore
        }
      }, timeout) as unknown as number;
    }

    let credentials: RequestCredentials = "include";
    if (details.anonymous || details.withCredentials === false) {
      credentials = "omit";
    }

    try {
      let cache: RequestCache | undefined;
      if (details.nocache) {
        cache = "no-store";
      } else if (details.revalidate) {
        cache = "no-cache";
      }

      const redirect: RequestRedirect =
        details.redirect === "error" || details.redirect === "manual"
          ? details.redirect
          : "follow";

      const isBodyAllowed = method !== "GET" && method !== "HEAD";
      // Make sure "forbidden" headers (Sec-*, User-Agent, ... ) are applied.
      // Without this, no-proxy mode cannot faithfully emulate the userscript
      // manager's GM_xmlhttpRequest and Yandex endpoints reject the request.
      try {
        await ensureDnrStripRuleForGooglevideo(url);
        await ensureDnrOriginStripRuleForYoutubei(url);
        await ensureDnrHeaderRuleForYandex(url, forbiddenHeaders);
      } catch (e) {
        console.warn(
          "[VOT Extension] Failed to apply DNR header rules; requests may break:",
          e,
        );
      }

      let body: BodyInit | undefined = isBodyAllowed
        ? decodeSerializedBody(details.data)
        : undefined;
      let recoveredBodyFromDetails: Uint8Array | null | undefined;
      const getRecoveredBodyFromDetails = (): Uint8Array | null => {
        if (recoveredBodyFromDetails !== undefined) {
          return recoveredBodyFromDetails;
        }
        recoveredBodyFromDetails = coerceBodyToBytes(details.data);
        return recoveredBodyFromDetails;
      };
      const contentType = getHeader(allHeaders, "content-type");
      const isProtobufRequest = isProtobufContentType(contentType);

      debug.log("[VOT EXT][background][xhr] body decoded", {
        xhrSessionId,
        url,
        method,
        contentType: contentType ?? null,
        isProtobufRequest,
        sourceBody: summarizeBodyForDebug(details.data),
        decodedBody: summarizeBodyForDebug(body),
      });

      if (
        isBodyAllowed &&
        isProtobufRequest &&
        (body === undefined || body === null)
      ) {
        const recovered = getRecoveredBodyFromDetails();
        if (recovered) {
          body = recovered as unknown as BodyInit;
          debug.warn(
            "[VOT EXT][background][xhr] protobuf body recovered from raw payload",
            {
              xhrSessionId,
              url,
              method,
              recoveredBody: summarizeBodyForDebug(body),
            },
          );
        }
      }

      // Preserve Protobuf request bodies that were built as "binary strings"
      // (Latin-1/byte-per-code-unit), which would otherwise be UTF-8 re-encoded
      // by fetch() and corrupt the payload.
      if (isBodyAllowed && typeof body === "string" && isProtobufRequest) {
        if (looksLikeObjectToStringPayload(body)) {
          const recovered = getRecoveredBodyFromDetails();
          if (recovered) {
            body = recovered as unknown as BodyInit;
            debug.warn(
              "[VOT EXT][background][xhr] recovered protobuf body from object-like string fallback",
              {
                xhrSessionId,
                url,
                method,
                sourceBody: summarizeBodyForDebug(details.data),
                recoveredBody: summarizeBodyForDebug(recovered),
              },
            );
          }
        }

        if (typeof body === "string") {
          const maybeBase64Bytes = tryDecodeStrictBase64Payload(body);
          body = (maybeBase64Bytes ??
            latin1StringToBytes(body)) as unknown as BodyInit;
          debug.log(
            "[VOT EXT][background][xhr] protobuf string converted to bytes",
            {
              xhrSessionId,
              url,
              method,
              strategy: maybeBase64Bytes ? "base64" : "latin1",
              convertedBody: summarizeBodyForDebug(body),
            },
          );
        }
      }

      debug.log("[VOT EXT][background][xhr] fetch dispatch", {
        xhrSessionId,
        url,
        method,
        credentials,
        redirect,
        cache: cache ?? "default",
        body: summarizeBodyForDebug(body),
      });

      const requestInit: RequestInit = {
        method,
        headers,
        redirect,
        credentials,
        signal: controller.signal,
      };
      if (body !== undefined) {
        requestInit.body = body;
      }
      if (cache !== undefined) {
        requestInit.cache = cache;
      }

      const res = await fetch(url, requestInit);

      debug.log("[VOT EXT][background][xhr] fetch response received", {
        xhrSessionId,
        url: res.url || url,
        method,
        status: res.status,
        statusText: res.statusText,
        responseType,
        contentType: res.headers.get("content-type") || null,
        contentLength: res.headers.get("content-length") || null,
      });

      const responseHeaders = formatHeaders(res.headers);
      const finalUrl = res.url || url;
      const responseContentType = res.headers.get("content-type") || "";

      const makeBase = (
        readyState: number,
      ): Omit<
        XhrResponse,
        "response" | "responseText" | "error" | "responseB64"
      > => ({
        finalUrl,
        readyState,
        status: res.status,
        statusText: res.statusText,
        responseHeaders,
      });

      const wantBinary =
        responseType === "arraybuffer" ||
        responseType === "blob" ||
        responseType === "stream";

      let response: unknown;
      let responseText: string | undefined;
      let responseB64: string | undefined;

      if (wantBinary) {
        const contentLength = Number(res.headers.get("content-length") || 0);
        const shouldStreamBinary =
          !!res.body &&
          (!Number.isFinite(contentLength) ||
            contentLength > MAX_INLINE_BINARY_RESPONSE_BYTES);

        if (shouldStreamBinary) {
          // Large binaries are streamed as progress chunks to avoid one huge
          // base64 payload in extension messaging.
          let loaded = 0;
          const total = Number.isFinite(contentLength) ? contentLength : 0;
          const reader = res.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!value) continue;

            loaded += value.byteLength;
            safePostMessage({
              type: "progress",
              state: "in_flight",
              progress: {
                ...makeBase(3),
                loaded,
                total,
                lengthComputable: total > 0,
                chunkB64: bytesToBase64(value),
              },
            });
          }
          response = undefined;
        } else {
          // Small binaries can be delivered in one terminal payload.
          const ab = await res.arrayBuffer();
          if (ab.byteLength > 0) {
            responseB64 = arrayBufferToBase64(ab);
          }
          response = undefined;
        }
      } else if (responseType === "json") {
        responseText = await res.text();
        try {
          response = JSON.parse(responseText);
        } catch {
          response = null;
        }
      } else {
        responseText = await res.text();
        response = responseText;
      }

      cleanup();
      debug.log("[VOT EXT][background][xhr] terminal", {
        xhrSessionId,
        state: "terminal",
        kind: "load",
        url: finalUrl,
        status: res.status,
        responseType,
        responseBody: summarizeBodyForDebug(response),
        responseTextLength: responseText?.length ?? 0,
        responseB64Length: responseB64?.length ?? 0,
      });
      safePostMessage({
        type: "load",
        state: "terminal",
        response: {
          ...makeBase(4),
          responseType,
          ...(responseContentType ? { contentType: responseContentType } : {}),
          ...(responseB64 ? { responseB64 } : {}),
          response,
          ...(typeof responseText === "string" ? { responseText } : {}),
        } satisfies XhrResponse,
      });
    } catch (err) {
      cleanup();

      const isAbort =
        abortedByUser ||
        timedOut ||
        (err instanceof DOMException && err.name === "AbortError");

      if (isAbort) {
        let kind: "abort" | "timeout";
        if (timedOut) {
          kind = "timeout";
        } else {
          kind = "abort";
        }
        const errorObj = createTerminalXhrError(
          url,
          kind === "timeout" ? "Timeout" : "Aborted",
        );

        try {
          safePostMessage({ type: kind, state: "terminal", error: errorObj });
        } catch {
          // ignore
        }
        debug.warn("[VOT EXT][background][xhr] terminal", {
          xhrSessionId,
          state: "terminal",
          kind,
          url,
          method,
          responseType,
        });
        return;
      }

      const errorObj = createTerminalXhrError(url, asErrorMessage(err));

      safePostMessage({
        type: "error",
        state: "terminal",
        error: errorObj,
      });
      debug.error("[VOT EXT][background][xhr] terminal", {
        xhrSessionId,
        state: "terminal",
        kind: "error",
        url,
        method,
        responseType,
        error: errorObj.error,
      });
    }
  });
});

// -----------------------------
// GM_notification bridge
// -----------------------------

type GmNotificationSender = {
  tab?: {
    id?: number;
    windowId?: number;
  };
};

type GmNotificationDetails = {
  title: string;
  text: string;
  silent: boolean;
  timeout: number;
};

type GmNotificationMessage = {
  type: "gm_notification";
  details?: unknown;
};

export function isGmNotificationMessage(
  msg: unknown,
): msg is GmNotificationMessage {
  if (!msg || typeof msg !== "object") return false;
  return (msg as { type?: unknown }).type === "gm_notification";
}

export function normalizeGmNotificationDetails(
  details: unknown,
): GmNotificationDetails {
  const raw =
    details && typeof details === "object"
      ? (details as Record<string, unknown>)
      : {};

  const timeoutRaw = Number(raw.timeout ?? 0);
  return {
    title: raw.title != null ? String(raw.title) : "",
    text: raw.text != null ? String(raw.text) : "",
    silent: Boolean(raw.silent),
    timeout: Number.isFinite(timeoutRaw) && timeoutRaw > 0 ? timeoutRaw : 0,
  };
}

export function createBridgeNotificationId(
  sender: GmNotificationSender,
): string {
  const tabId = sender.tab?.id;
  const windowId = sender.tab?.windowId;

  const safeTab = typeof tabId === "number" ? tabId : -1;
  const safeWin = typeof windowId === "number" ? windowId : -1;

  const nonce =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}:${Math.random().toString(36).slice(2)}`;

  return `vot:${safeTab}:${safeWin}:${nonce}`;
}

export function createBridgeNotificationOptions(
  details: GmNotificationDetails,
): Record<string, unknown> {
  const isFirefox =
    typeof (ext?.runtime as { getBrowserInfo?: unknown })?.getBrowserInfo ===
    "function";
  const iconUrl = ext?.runtime?.getURL
    ? ext.runtime.getURL("icons/icon-128.png")
    : "icons/icon-128.png";

  // Firefox's notifications API does not support some Chrome-only fields
  // (e.g. `silent`). Passing unsupported fields can cause the call to throw
  // and the notification to never show.
  const options: Record<string, unknown> = {
    type: "basic",
    iconUrl,
    title: details.title || "VOT",
    message: details.text,
  };
  if (!isFirefox) {
    options.silent = details.silent;
  }
  return options;
}

function sendNotificationResponse(
  sendResponse: ((value: unknown) => void) | undefined,
  payload: unknown,
): void {
  if (typeof sendResponse !== "function") return;
  try {
    sendResponse(payload);
  } catch {
    // ignore
  }
}

ext?.runtime?.onMessage?.addListener?.(
  (
    msg: unknown,
    sender: GmNotificationSender,
    sendResponse: ((value: unknown) => void) | undefined,
  ) => {
    if (!isGmNotificationMessage(msg)) return;

    const details = normalizeGmNotificationDetails(msg.details);
    const notificationId = createBridgeNotificationId(sender);
    const options = createBridgeNotificationOptions(details);

    void (async () => {
      try {
        await notificationsCreate(notificationId, options);

        if (details.timeout > 0) {
          setTimeout(() => {
            void notificationsClear(notificationId);
          }, details.timeout);
        }

        sendNotificationResponse(sendResponse, { ok: true });
      } catch (error) {
        // Avoid crashing the background service worker on notification API errors.
        debug.error(
          "[VOT EXT][background] Failed to create notification",
          error,
        );
        sendNotificationResponse(sendResponse, {
          ok: false,
          error: asErrorMessage(error),
        });
      }
    })();

    // Keep the channel alive while notification creation finishes in MV3 SW.
    return true;
  },
);

ext?.notifications?.onClicked?.addListener?.((notificationId: string) => {
  if (!notificationId.startsWith("vot:")) return;
  const parts = notificationId.split(":");
  if (parts.length < 3) return;

  const tabId = Number(parts[1]);
  const windowId = Number(parts[2]);

  // Focus the originating tab/globalThis when possible.
  if (Number.isFinite(windowId) && windowId >= 0) {
    void windowsUpdate(windowId, { focused: true });
  }

  if (Number.isFinite(tabId) && tabId >= 0) {
    void tabsUpdate(tabId, { active: true });
  }
});
