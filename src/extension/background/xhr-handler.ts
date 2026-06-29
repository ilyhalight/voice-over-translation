import debug from "../../utils/debug";
import {
  arrayBufferToBase64,
  base64ToBytes,
  bytesToBase64,
  coerceBodyToBytes,
  decodeSerializedBody,
  summarizeBodyForDebug,
} from "../shared/bodySerialization";
import { PORT_NAME } from "../shared/constants";
import { asErrorMessage } from "../shared/utils";
import { ext, runtimeMessagesUseStructuredClone } from "../shared/webext";
import {
  ensureDnrHeaderRuleForYandex,
  ensureDnrOriginStripRuleForYoutubei,
  ensureDnrStripRuleForGooglevideo,
  isForbiddenToSetViaFetch,
} from "./dnr-rules";

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
    redirect?: RequestRedirect;
    nocache?: boolean;
    revalidate?: boolean;
  };
};

type XhrAbortMessage = { type: "abort" };

type XhrPortMessage = XhrStartMessage | XhrAbortMessage;
const MAX_INLINE_BINARY_RESPONSE_BYTES = 512 * 1024;
const PROTOBUF_CONTENT_TYPE_RE =
  /application\/(?:x-)?protobuf|application\/octet-stream/;
const STRICT_BASE64_PAYLOAD_RE = /^(?=.*[+/=_-])[A-Za-z0-9+/=_-]+$/;

function formatHeaders(headers: Headers): string {
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
  responseType?: string;
  contentType?: string;
  response?: unknown;
  responseB64?: string;
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

function cloneArrayBufferView(view: Uint8Array): ArrayBuffer {
  const out = new Uint8Array(view.byteLength);
  out.set(view);
  return out.buffer;
}

function encodeProgressChunkForPort(chunk: Uint8Array): {
  chunk?: ArrayBuffer;
  chunkB64?: string;
} {
  return runtimeMessagesUseStructuredClone
    ? { chunk: cloneArrayBufferView(chunk) }
    : { chunkB64: bytesToBase64(chunk) };
}

function encodeBinaryResponseForPort(ab: ArrayBuffer): {
  response?: ArrayBuffer;
  responseB64?: string;
} {
  if (runtimeMessagesUseStructuredClone) return { response: ab };
  if (ab.byteLength <= 0) return {};
  return { responseB64: arrayBufferToBase64(ab) };
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
  return PROTOBUF_CONTENT_TYPE_RE.test(String(contentType ?? "").toLowerCase());
}

function tryDecodeStrictBase64Payload(s: string): Uint8Array | null {
  const str = String(s ?? "");
  if (!STRICT_BASE64_PAYLOAD_RE.test(str)) return null;

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

function recoverProtobufBody(
  details: XhrStartMessage["details"],
  body: unknown,
  xhrSessionId: string,
  url: string,
  method: string,
): BodyInit | undefined {
  const rawBytes = coerceBodyToBytes(details.data);

  if ((body === undefined || body === null) && rawBytes) {
    debug.warn(
      "[VOT EXT][background][xhr] protobuf body recovered from raw payload",
      {
        xhrSessionId,
        url,
        method,
        recoveredBody: summarizeBodyForDebug(rawBytes),
      },
    );
    return rawBytes as unknown as BodyInit;
  }

  if (typeof body === "string") {
    if (looksLikeObjectToStringPayload(body) && rawBytes) {
      debug.warn(
        "[VOT EXT][background][xhr] recovered protobuf body from object-like string fallback",
        {
          xhrSessionId,
          url,
          method,
          sourceBody: summarizeBodyForDebug(details.data),
          recoveredBody: summarizeBodyForDebug(rawBytes),
        },
      );
      return rawBytes as unknown as BodyInit;
    }

    const maybeBase64Bytes = tryDecodeStrictBase64Payload(body);
    const converted = (maybeBase64Bytes ??
      latin1StringToBytes(body)) as unknown as BodyInit;
    debug.log("[VOT EXT][background][xhr] protobuf string converted to bytes", {
      xhrSessionId,
      url,
      method,
      strategy: maybeBase64Bytes ? "base64" : "latin1",
      convertedBody: summarizeBodyForDebug(converted),
    });
    return converted;
  }

  return body as BodyInit | undefined;
}

async function parseFetchResponseBody(
  res: Response,
  responseType: string,
  makeBase: (readyState: number) => {
    finalUrl: string;
    readyState: number;
    status: number;
    statusText: string;
    responseHeaders: string;
  },
  postMessage: (msg: unknown) => void,
): Promise<{
  response: unknown;
  responseText?: string;
  responseB64?: string;
}> {
  const wantBinary =
    responseType === "arraybuffer" ||
    responseType === "blob" ||
    responseType === "stream";

  if (wantBinary) {
    return await parseBinaryResponse(res, makeBase, postMessage);
  }

  if (responseType === "json") {
    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    return { response: parsed, responseText: text };
  }

  const text = await res.text();
  return { response: text, responseText: text };
}

async function parseBinaryResponse(
  res: Response,
  makeBase: (readyState: number) => {
    finalUrl: string;
    readyState: number;
    status: number;
    statusText: string;
    responseHeaders: string;
  },
  postMessage: (msg: unknown) => void,
): Promise<{
  response: unknown;
  responseText?: string;
  responseB64?: string;
}> {
  const contentLength = Number(res.headers.get("content-length") || 0);
  const shouldStream =
    !!res.body &&
    (!Number.isFinite(contentLength) ||
      contentLength > MAX_INLINE_BINARY_RESPONSE_BYTES);

  if (shouldStream) {
    let loaded = 0;
    const total = Number.isFinite(contentLength) ? contentLength : 0;
    const reader = res.body?.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      loaded += value.byteLength;
      postMessage({
        type: "progress",
        state: "in_flight",
        progress: {
          ...makeBase(3),
          loaded,
          total,
          lengthComputable: total > 0,
          ...encodeProgressChunkForPort(value),
        },
      });
    }
    return { response: undefined };
  }

  const ab = await res.arrayBuffer();
  const binaryResponse = encodeBinaryResponseForPort(ab);
  return {
    response: binaryResponse.response,
    responseB64: binaryResponse.responseB64,
  };
}

export function registerXhrPortListener(): void {
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
    const xhrSessionId = String(xhrSessionSeq);

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
      requestAbort();
    });

    const requestAbort = () => {
      try {
        controller?.abort();
      } catch {
        // ignore
      }
    };

    const handleAbortMessage = () => {
      abortedByUser = true;
      debug.warn("[VOT EXT][background][xhr] abort requested", {
        xhrSessionId,
      });
      requestAbort();
    };

    const splitRequestHeaders = (details: XhrStartMessage["details"]) => {
      const allHeaders = toHeaderRecord(details.headers);
      const headers: Record<string, string> = {};
      const forbiddenHeaders: Record<string, string> = {};
      for (const [k, v] of Object.entries(allHeaders)) {
        if (isForbiddenToSetViaFetch(k)) forbiddenHeaders[k] = v;
        else headers[k] = v;
      }
      return { allHeaders, headers, forbiddenHeaders };
    };

    const postAbortBeforeStart = (url: string) => {
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
    };

    const resolveFetchCredentials = (
      details: XhrStartMessage["details"],
    ): RequestCredentials =>
      details.anonymous || details.withCredentials === false
        ? "omit"
        : "include";

    const resolveFetchCache = (
      details: XhrStartMessage["details"],
    ): RequestCache | undefined => {
      if (details.nocache) return "no-store";
      if (details.revalidate) return "no-cache";
      return undefined;
    };

    const normalizeRequestBody = (
      details: XhrStartMessage["details"],
      method: string,
      allHeaders: Record<string, string>,
      url: string,
    ): BodyInit | undefined => {
      if (method === "GET") return undefined;

      const contentType = getHeader(allHeaders, "content-type");
      const isProtobuf = isProtobufContentType(contentType);
      let body = decodeSerializedBody(details.data);

      debug.log("[VOT EXT][background][xhr] body decoded", {
        xhrSessionId,
        url,
        method,
        contentType: contentType ?? null,
        isProtobufRequest: isProtobuf,
        sourceBody: summarizeBodyForDebug(details.data),
        decodedBody: summarizeBodyForDebug(body),
      });

      if (isProtobuf) {
        body = recoverProtobufBody(details, body, xhrSessionId, url, method);
      }

      return body;
    };

    const createRequestInit = (params: {
      method: string;
      headers: Record<string, string>;
      redirect: RequestRedirect;
      credentials: RequestCredentials;
      body: BodyInit | undefined;
      cache: RequestCache | undefined;
    }): RequestInit => {
      const init: RequestInit = {
        method: params.method,
        headers: params.headers,
        redirect: params.redirect,
        credentials: params.credentials,
        signal: controller?.signal,
      };
      if (params.body !== undefined) init.body = params.body;
      if (params.cache !== undefined) init.cache = params.cache;
      return init;
    };

    const handleFetchSuccess = async (params: {
      url: string;
      method: string;
      responseType: string;
      res: Response;
    }) => {
      const { url, method, responseType, res } = params;
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
      const makeBase = (readyState: number) => ({
        finalUrl,
        readyState,
        status: res.status,
        statusText: res.statusText,
        responseHeaders,
      });

      const parsed = await parseFetchResponseBody(
        res,
        responseType,
        makeBase,
        safePostMessage,
      );

      cleanup();
      debug.log("[VOT EXT][background][xhr] terminal", {
        xhrSessionId,
        state: "terminal",
        kind: "load",
        url: finalUrl,
        status: res.status,
        responseType,
        responseBody: summarizeBodyForDebug(parsed.response),
        responseTextLength: parsed.responseText?.length ?? 0,
        responseB64Length: parsed.responseB64?.length ?? 0,
      });
      safePostMessage({
        type: "load",
        state: "terminal",
        response: {
          ...makeBase(4),
          responseType,
          ...(responseContentType ? { contentType: responseContentType } : {}),
          ...(parsed.responseB64 ? { responseB64: parsed.responseB64 } : {}),
          response: parsed.response,
          ...(typeof parsed.responseText === "string"
            ? { responseText: parsed.responseText }
            : {}),
        } satisfies XhrResponse,
      });
    };

    const handleFetchFailure = (
      url: string,
      method: string,
      responseType: string,
      err: unknown,
    ) => {
      cleanup();
      const isAbort =
        abortedByUser ||
        timedOut ||
        (err instanceof DOMException && err.name === "AbortError");

      if (isAbort) {
        const kind: "abort" | "timeout" = timedOut ? "timeout" : "abort";
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
      safePostMessage({ type: "error", state: "terminal", error: errorObj });
      debug.error("[VOT EXT][background][xhr] terminal", {
        xhrSessionId,
        state: "terminal",
        kind: "error",
        url,
        method,
        responseType,
        error: errorObj.error,
      });
    };

    const handleStartMessage = async (
      msg: Extract<XhrPortMessage, { type: "start" }>,
    ) => {
      const shouldAbortImmediately = abortedByUser && controller === null;
      abortedByUser = false;

      const { details } = msg;
      const url = details.url;
      const method = (details.method || "GET").toUpperCase();
      const { allHeaders, headers, forbiddenHeaders } =
        splitRequestHeaders(details);
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

      if (shouldAbortImmediately) {
        postAbortBeforeStart(url);
        return;
      }

      timedOut = false;
      controller = new AbortController();

      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          timedOut = true;
          requestAbort();
        }, timeout) as unknown as number;
      }

      const credentials = resolveFetchCredentials(details);
      const cache = resolveFetchCache(details);
      const redirect: RequestRedirect =
        details.redirect === "error" || details.redirect === "manual"
          ? details.redirect
          : "follow";

      try {
        try {
          await ensureDnrStripRuleForGooglevideo(url, forbiddenHeaders);
          await ensureDnrOriginStripRuleForYoutubei(url, forbiddenHeaders);
          await ensureDnrHeaderRuleForYandex(url, forbiddenHeaders);
        } catch (e) {
          console.warn(
            "[VOT Extension] Failed to apply DNR header rules; requests may break:",
            e,
          );
        }

        const body = normalizeRequestBody(details, method, allHeaders, url);
        debug.log("[VOT EXT][background][xhr] fetch dispatch", {
          xhrSessionId,
          url,
          method,
          credentials,
          redirect,
          cache: cache ?? "default",
          body: summarizeBodyForDebug(body),
        });

        const res = await fetch(
          url,
          createRequestInit({
            method,
            headers,
            redirect,
            credentials,
            body,
            cache,
          }),
        );
        await handleFetchSuccess({ url, method, responseType, res });
      } catch (err) {
        handleFetchFailure(url, method, responseType, err);
      }
    };

    typedPort.onMessage.addListener(async (msg: XhrPortMessage) => {
      if (!msg || typeof msg !== "object") return;
      if (msg.type === "abort") {
        handleAbortMessage();
        return;
      }
      if (msg.type !== "start") return;
      await handleStartMessage(msg);
    });
  });
}
