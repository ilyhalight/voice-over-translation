import { AudioDownloadType } from "@vot.js/core/types/yandex";

import type { GetAudioFromAPIOptions } from "../../types/audioDownloader";

import "./mseProxyHandler";

const MESSAGE_TYPE = "get-audio-chunks-by-mse-in-main-world";
export const STREAM_TIMEOUT_MS = 30 * 60_000;
const MESSAGE_TIMEOUT_MS = 2 * 60_000;

export type MseProxyChunk = {
  buffer: Uint8Array;
  isLastChunk: boolean;
};

export function parseMseProxyChunk(payload: unknown): MseProxyChunk {
  if (!payload || typeof payload !== "object" || !("buffer" in payload)) {
    throw new Error("Audio downloader. Invalid MSE chunk");
  }

  const { buffer, isLastChunk } = payload as {
    buffer: unknown;
    isLastChunk?: unknown;
  };
  const bytes =
    buffer instanceof Uint8Array
      ? buffer
      : buffer instanceof ArrayBuffer
        ? new Uint8Array(buffer)
        : ArrayBuffer.isView(buffer)
          ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
          : null;

  if (!bytes || typeof isLastChunk !== "boolean") {
    throw new Error("Audio downloader. Invalid MSE chunk");
  }

  return { buffer: bytes, isLastChunk };
}

async function* getMseProxyChunks(
  videoId: string,
  signal: AbortSignal,
): AsyncGenerator<MseProxyChunk> {
  if (signal.aborted) throw new Error(String(signal.reason ?? "Aborted"));

  const messageId = `stream-message-id-${performance.now()}-${Math.random()}`;
  const chunks: MseProxyChunk[] = [];
  let wake: (() => void) | undefined;
  let streamFinished = false;
  let failure: Error | undefined;
  let messageTimeout: ReturnType<typeof setTimeout>;

  const notify = () => {
    wake?.();
    wake = undefined;
  };
  const finish = (error?: Error) => {
    if (error) {
      if (failure) return;
      failure = error;
    } else {
      streamFinished = true;
      clearTimeout(messageTimeout);
    }
    notify();
  };
  const resetMessageTimeout = () => {
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(
      () => finish(new Error("MSE proxy message timed out")),
      MESSAGE_TIMEOUT_MS,
    );
  };
  const postAbort = () =>
    globalThis.postMessage(
      {
        messageId,
        messageType: MESSAGE_TYPE,
        messageDirection: "request",
        isStreamFinished: true,
        isAborted: true,
      },
      "*",
    );
  const onMessage = (event: MessageEvent) => {
    const message = event.data;
    const iframe = document.getElementById(
      `vot-mse-proxy-${messageId}`,
    ) as HTMLIFrameElement | null;
    if (
      !message ||
      (event.source !== (globalThis as unknown as Window) &&
        event.source !== iframe?.contentWindow) ||
      message.messageId !== messageId ||
      message.messageType !== MESSAGE_TYPE ||
      message.messageDirection !== "response"
    ) {
      return;
    }

    resetMessageTimeout();
    if (message.error || message.isAborted) {
      finish(
        new Error(
          typeof message.error === "string"
            ? message.error
            : "MSE proxy stream aborted",
        ),
      );
      return;
    }
    if (message.isStreamFinished) {
      finish();
      return;
    }

    try {
      chunks.push(parseMseProxyChunk(message.payload));
      notify();
    } catch (error) {
      finish(error instanceof Error ? error : new Error(String(error)));
    }
  };
  const onAbort = () => finish(new Error(String(signal.reason ?? "Aborted")));
  const streamTimeout = setTimeout(
    () => finish(new Error("MSE proxy stream timed out")),
    STREAM_TIMEOUT_MS,
  );
  const navigationInterval = setInterval(() => {
    if (!globalThis.location.href.includes(videoId)) {
      finish(new Error("URL changed during MSE proxy download"));
    }
  }, 100);

  globalThis.addEventListener("message", onMessage);
  signal.addEventListener("abort", onAbort, { once: true });
  if (signal.aborted) onAbort();
  resetMessageTimeout();

  try {
    if (!streamFinished && !failure) {
      globalThis.postMessage(
        {
          messageId,
          messageType: MESSAGE_TYPE,
          messageDirection: "request",
          payload: { pureVideoId: videoId, fromPlayer: true },
        },
        "*",
      );
    }

    while (!streamFinished || chunks.length > 0) {
      if (failure) throw failure;
      const chunk = chunks.shift();
      if (chunk) {
        yield chunk;
      } else {
        await new Promise<void>((resolve) => {
          wake = resolve;
        });
      }
    }
    if (failure) throw failure;
  } finally {
    clearTimeout(messageTimeout);
    clearTimeout(streamTimeout);
    clearInterval(navigationInterval);
    globalThis.removeEventListener("message", onMessage);
    signal.removeEventListener("abort", onAbort);
    if (!streamFinished || failure) postAbort();
  }
}

export async function getAudioFromWebMseProxy({
  videoId,
  signal,
}: GetAudioFromAPIOptions) {
  return {
    fileId: `random-${AudioDownloadType.WEB_MSE_PROXY}-${crypto.randomUUID()}`,
    mediaPartsLength: null,
    getMediaBuffers: () => getMseProxyChunks(videoId, signal),
  };
}
