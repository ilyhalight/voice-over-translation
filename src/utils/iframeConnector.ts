import type { MessagePayload } from "../types/iframeConnector";
import { makeAbortError } from "./errors";

export const IFRAME_HASH = "vot_iframe";
export const isIframe = () => globalThis.self !== globalThis.top;
export const generateMessageId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? `main-world-bridge-${crypto.randomUUID()}`
    : `main-world-bridge-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const SERVICE_IFRAME_READY_TIMEOUT_MS = 15_000;

export const hasServiceIframe = (iframeId: string) =>
  document.getElementById(iframeId) as HTMLIFrameElement | null;

type BridgeMessageLike = {
  messageType: string;
  messageDirection: string;
  messageId?: string;
  payload?: unknown;
  error?: unknown;
};

const isBridgeMessageLike = (value: unknown): value is BridgeMessageLike => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;
  return (
    typeof data.messageType === "string" &&
    typeof data.messageDirection === "string"
  );
};

const normalizedHref = (url: string): string | null => {
  try {
    return new URL(url, globalThis.location.href).href;
  } catch {
    return null;
  }
};

const iframeSrcMatches = (iframe: HTMLIFrameElement, expectedSrc: string) => {
  const expected = normalizedHref(expectedSrc);
  const current = normalizedHref(iframe.src);

  // Best effort: if URL parsing fails, fall back to raw attribute comparison.
  if (!expected || !current) {
    return iframe.getAttribute("src") === expectedSrc;
  }

  return current === expected;
};

const isLiveMatchingServiceIframe = (
  iframe: HTMLIFrameElement | null | undefined,
  expectedSrc: string,
): boolean => {
  if (!iframe?.isConnected || !iframe.contentWindow) {
    return false;
  }

  return iframeSrcMatches(iframe, expectedSrc);
};

export async function setupServiceIframe(
  src: string,
  id: string,
  service: string,
) {
  if (!document.body) {
    await new Promise<void>((resolve) => {
      if (document.readyState === "loading") {
        globalThis.addEventListener("DOMContentLoaded", () => resolve(), {
          once: true,
        });
      } else {
        resolve();
      }
    });
  }

  const iframe = document.createElement("iframe");

  // IMPORTANT:
  // We intentionally avoid `display:none` for this iframe.
  //
  // Some browsers may throttle or block media/network activity in non-rendered
  // frames, which makes our YouTube "service iframe" unreliable and causes the
  // extension to fall back to remote audio extraction (fail-audio-js).
  //
  // Keeping the iframe 1x1px and fully transparent makes it effectively invisible
  // while still being considered rendered by the browser.
  iframe.style.position = "fixed";
  iframe.style.left = "0";
  iframe.style.top = "0";
  iframe.style.width = "1px";
  iframe.style.height = "1px";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.border = "0";
  iframe.style.zIndex = "-1";

  // Allow autoplay so the embedded YouTube player can generate media requests
  // without a user gesture (muted autoplay is still subject to iframe policies).
  iframe.setAttribute("allow", "autoplay; encrypted-media");

  iframe.id = id;
  iframe.src = `${src}#${IFRAME_HASH}`;
  document.body.appendChild(iframe);

  const expectedSource = iframe.contentWindow;
  const readyMessageType = `say-${service}-iframe-is-ready`;

  try {
    await new Promise<void>((resolve, reject) => {
      const handleMessage = (event: MessageEvent<unknown>) => {
        if (event.source !== expectedSource) {
          return;
        }

        if (!isBridgeMessageLike(event.data)) {
          return;
        }

        if (
          event.data.messageType !== readyMessageType ||
          event.data.messageDirection !== "response"
        ) {
          return;
        }

        cleanup();
        resolve();
      };

      const timeoutId = globalThis.setTimeout(() => {
        cleanup();
        reject(new Error("Service iframe did not have time to be ready"));
      }, SERVICE_IFRAME_READY_TIMEOUT_MS);

      const cleanup = () => {
        globalThis.clearTimeout(timeoutId);
        globalThis.removeEventListener("message", handleMessage);
      };

      globalThis.addEventListener("message", handleMessage);
    });
  } catch (error) {
    iframe.remove();
    throw error;
  }

  return iframe;
}

export async function ensureServiceIframe(
  iframe: HTMLIFrameElement | null,
  src: string,
  iframeId: string,
  service: string,
): Promise<HTMLIFrameElement> {
  if (src.includes("#")) {
    throw new Error(
      "The src parameter should not contain a hash (#) character.",
    );
  }

  const expectedSrc = `${src}#${IFRAME_HASH}`;
  const iframeFromDom = hasServiceIframe(iframeId);

  if (isLiveMatchingServiceIframe(iframeFromDom, expectedSrc)) {
    return iframeFromDom;
  }

  if (iframeFromDom) {
    iframeFromDom.remove();
  }

  if (iframe && iframe !== iframeFromDom) {
    if (isLiveMatchingServiceIframe(iframe, expectedSrc)) {
      return iframe;
    }

    iframe.remove();
  }

  return setupServiceIframe(src, iframeId, service);
}

export function initIframeService(
  service: string,
  onmessage: ({ data }: MessageEvent<MessagePayload>) => Promise<void>,
) {
  globalThis.addEventListener("message", onmessage);
  globalThis.parent.postMessage(
    {
      messageType: `say-${service}-iframe-is-ready`,
      messageDirection: "response",
    },
    "*",
  );
}

export type RequestDataFromMainWorldOptions = {
  signal?: AbortSignal;
};

export type RequestDataFromMainWorldWithIdResult<ResponseType> = {
  messageId: string;
  promise: Promise<ResponseType>;
};

/**
 * Requests data from the main world and also exposes the generated messageId.
 *
 * This is useful when you need to send a best-effort cancellation message to
 * another context (e.g. our YouTube service iframe) and want to correlate it
 * with the original request.
 */
export function requestDataFromMainWorldWithId<
  PayloadType,
  ResponseType = unknown,
>(
  messageType: string,
  payload?: PayloadType,
  options?: RequestDataFromMainWorldOptions,
): RequestDataFromMainWorldWithIdResult<ResponseType> {
  const messageId = generateMessageId();
  const signal = options?.signal;

  const promise = new Promise<ResponseType>((resolve, reject) => {
    let settled = false;

    let handleMessage: ((ev: MessageEvent<unknown>) => void) | null = null;
    let onAbort: (() => void) | null = null;

    const cleanup = () => {
      if (handleMessage) {
        globalThis.removeEventListener("message", handleMessage);
      }
      if (signal && onAbort) {
        signal.removeEventListener("abort", onAbort);
      }
    };

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    };

    onAbort = () => {
      settle(() => reject(makeAbortError()));
    };

    handleMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== globalThis.window) {
        return;
      }

      if (!isBridgeMessageLike(event.data)) {
        return;
      }

      const data = event.data as MessagePayload<ResponseType>;
      if (
        data?.messageId === messageId &&
        data.messageType === messageType &&
        data.messageDirection === "response"
      ) {
        settle(() => (data.error ? reject(data.error) : resolve(data.payload)));
      }
    };

    if (signal?.aborted) {
      onAbort();
      return;
    }

    globalThis.addEventListener("message", handleMessage);
    signal?.addEventListener("abort", onAbort, { once: true });

    globalThis.postMessage(
      {
        messageId,
        messageType,
        messageDirection: "request",
        ...(payload !== undefined && { payload }),
      },
      "*",
    );
  });

  return { messageId, promise };
}
