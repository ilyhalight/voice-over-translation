import type { AudioDownloadType } from "@vot.js/core/types/yandex";

import type { GetAudioFromAPIOptions } from "../../types/audioDownloader";
import debug from "../../utils/debug";
import type { AudioChunk } from "./audioChunks";

const MESSAGE_TYPE = "get-audio-chunks-by-mse-in-main-world";
export const STREAM_TIMEOUT_MS = 30 * 60_000;
const MESSAGE_TIMEOUT_MS = 5 * 60_000;

export function parseAudioBridgeChunk(payload: unknown): AudioChunk {
  if (!payload || typeof payload !== "object" || !("buffer" in payload)) {
    throw new Error("Audio downloader. Invalid audio bridge chunk");
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
    throw new Error("Audio downloader. Invalid audio bridge chunk");
  }

  return { buffer: bytes, isLastChunk };
}

function createAbortError(reason: unknown): Error {
  if (reason instanceof Error && reason.name === "AbortError") return reason;
  return new DOMException(
    reason instanceof Error ? reason.message : String(reason ?? "Aborted"),
    "AbortError",
  );
}

async function* getAudioBridgeChunks(
  videoId: string,
  signal: AbortSignal,
  audioDownloadType:
    | AudioDownloadType.WEB_ABR
    | AudioDownloadType.WEB_MSE_PROXY,
): AsyncGenerator<AudioChunk> {
  if (signal.aborted) throw createAbortError(signal.reason);

  const messageId = `stream-message-id-${performance.now()}-${Math.random()}`;
  const chunks: AudioChunk[] = [];
  let wake: (() => void) | undefined;
  let streamFinished = false;
  let failure: Error | undefined;
  let receivedChunks = 0;
  let messageTimeout: ReturnType<typeof setTimeout>;

  const notify = () => {
    wake?.();
    wake = undefined;
  };
  const finish = (error?: Error) => {
    if (error) {
      if (failure) return;
      failure = error;
      debug.error("Audio downloader. Audio bridge failed", {
        videoId,
        messageId,
        audioDownloadType,
        receivedChunks,
        error: error.message,
      });
    } else {
      streamFinished = true;
      clearTimeout(messageTimeout);
      debug.log("Audio downloader. Audio bridge stream finished", {
        videoId,
        messageId,
        audioDownloadType,
        receivedChunks,
      });
    }
    notify();
  };
  const resetMessageTimeout = () => {
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(
      () => finish(new Error("Audio bridge message timed out")),
      MESSAGE_TIMEOUT_MS,
    );
  };
  const throwIfFailed = () => {
    if (!failure) return;
    if (!globalThis.location.href.includes(videoId)) {
      throw createAbortError("URL changed during audio download");
    }
    throw failure;
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
    if (message.isAborted) {
      finish(createAbortError(message.error));
      return;
    }
    if (message.error) {
      finish(
        new Error(
          typeof message.error === "string"
            ? message.error
            : "Audio bridge failed",
        ),
      );
      return;
    }
    if (message.isStreamFinished) {
      finish();
      return;
    }
    if (message.isProgress) {
      debug.log("Audio downloader. Audio bridge progress", {
        videoId,
        messageId,
        audioDownloadType,
      });
      return;
    }

    try {
      const chunk = parseAudioBridgeChunk(message.payload);
      chunks.push(chunk);
      receivedChunks++;
      debug.log("Audio downloader. Audio bridge chunk received", {
        videoId,
        messageId,
        audioDownloadType,
        index: receivedChunks - 1,
        size: chunk.buffer.byteLength,
        isLastChunk: chunk.isLastChunk,
      });
      notify();
    } catch (error) {
      finish(error instanceof Error ? error : new Error(String(error)));
    }
  };
  const onAbort = () => finish(createAbortError(signal.reason));
  const streamTimeout = setTimeout(
    () => finish(new Error("Audio bridge stream timed out")),
    STREAM_TIMEOUT_MS,
  );
  const navigationInterval = setInterval(() => {
    if (!globalThis.location.href.includes(videoId)) {
      finish(createAbortError("URL changed during audio download"));
    }
  }, 100);

  globalThis.addEventListener("message", onMessage);
  signal.addEventListener("abort", onAbort, { once: true });
  if (signal.aborted) onAbort();
  resetMessageTimeout();

  debug.log("Audio downloader. Audio bridge request started", {
    videoId,
    messageId,
    audioDownloadType,
  });

  try {
    if (!streamFinished && !failure) {
      globalThis.postMessage(
        {
          messageId,
          messageType: MESSAGE_TYPE,
          messageDirection: "request",
          payload: {
            pureVideoId: videoId,
            audioDownloadType,
          },
        },
        "*",
      );
    }

    while (!streamFinished || chunks.length > 0) {
      throwIfFailed();
      const chunk = chunks.shift();
      if (chunk) {
        yield chunk;
      } else {
        await new Promise<void>((resolve) => {
          wake = resolve;
        });
      }
    }
    throwIfFailed();
  } finally {
    clearTimeout(messageTimeout);
    clearTimeout(streamTimeout);
    clearInterval(navigationInterval);
    globalThis.removeEventListener("message", onMessage);
    signal.removeEventListener("abort", onAbort);
    if (!streamFinished || failure) postAbort();
  }
}

export async function getAudioFromBridge(
  { videoId, signal }: GetAudioFromAPIOptions,
  audioDownloadType:
    | AudioDownloadType.WEB_ABR
    | AudioDownloadType.WEB_MSE_PROXY,
) {
  return {
    fileId: `random-${audioDownloadType}-${crypto.randomUUID()}`,
    mediaPartsLength: null,
    getMediaBuffers: () =>
      getAudioBridgeChunks(videoId, signal, audioDownloadType),
  };
}
