import type { GetAudioFromAPIOptions } from "../../types/audioDownloader";
import debug from "../../utils/debug";
import { makeAbortError } from "../../utils/errors";
import { createAsyncQueue } from "../internal/asyncQueue";
import { isTrustedYouTubeOrigin } from "../internal/hosts";
import type { AudioChunk } from "./audioChunks";
import {
  type AvailableAudioDownloadType,
  MESSAGE_TYPE,
} from "./bridgeProtocol";

export const STREAM_TIMEOUT_MS = 30 * 60_000;
/** Between two answers of a running stream: one range can legitimately be slow. */
const MESSAGE_TIMEOUT_MS = 5 * 60_000;
/**
 * Until the *first* answer.
 *
 * The handler acknowledges a request as soon as it accepts it, so nothing
 * answering inside this budget means nothing is listening (no handler in this
 * realm, or the message never reached one). Waiting the full message timeout
 * in that case only delays the server-side fallback by five minutes.
 */
const FIRST_RESPONSE_TIMEOUT_MS = 30_000;

/**
 * Origins whose answers are accepted.
 *
 * An answer is already tied to a `messageId` that nothing outside this module
 * knows, so this is only the second guard. It has to stay wide: the answer
 * comes from the page realm itself (the site the video is embedded on), from
 * the hidden youtube.com realm, or from a realm that reports no origin.
 */
/**
 * Whether a bridge answer from `origin` may be trusted.
 *
 * Deliberately wide: the answer comes from the page realm itself, from the
 * hidden youtube.com realm, or from a realm that reports no origin at all.
 *
 * CONSOLIDATION: the accepted-origin pattern moved to `internal/hosts.ts`
 * (copied verbatim, flags included), so the accepted set is unchanged.
 */
export function isTrustedBridgeOrigin(origin: string | undefined): boolean {
  if (!origin || origin === "null") return true;
  if (origin === globalThis.location?.origin) return true;
  return isTrustedYouTubeOrigin(origin);
}

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

async function* getAudioBridgeChunks(
  videoId: string,
  signal: AbortSignal,
  audioDownloadType: AvailableAudioDownloadType,
): AsyncGenerator<AudioChunk> {
  if (signal.aborted) throw makeAbortError(signal.reason);

  // MODERNIZATION (R-9): `crypto.randomUUID()` is already the id source in
  // `poToken.ts` and `webAbr.ts`; this was the last
  // `performance.now()` + `Math.random()` holdout, and it is both shorter
  // and collision-free by construction.
  const messageId = `stream-message-id-${crypto.randomUUID()}`;
  // CONSOLIDATION: the hand-rolled `chunks` + `wake` pump is now the shared
  // producer/consumer queue (`internal/asyncQueue.ts`), which encodes the
  // same three rules: FIFO, park a single waiter, drain before failing.
  const queue = createAsyncQueue<AudioChunk>();
  let streamFinished = false;
  let failure: Error | undefined;
  let receivedChunks = 0;
  let receivedAnyResponse = false;
  let messageTimeout: ReturnType<typeof setTimeout> | undefined;

  const finish = (error?: Error) => {
    if (error) {
      if (failure) return;
      failure = error;
      debug.error("Audio downloader. Audio bridge failed", {
        videoId,
        messageId,
        receivedChunks,
        error: error.message,
      });
      // Buffered chunks still drain before the failure surfaces.
      queue.fail(error);
    } else {
      streamFinished = true;
      clearTimeout(messageTimeout);
      debug.log("Audio downloader. Audio bridge stream finished", {
        videoId,
        messageId,
        receivedChunks,
      });
      queue.close();
    }
  };
  const resetMessageTimeout = () => {
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(
      () =>
        finish(
          new Error(
            receivedAnyResponse
              ? "Audio bridge message timed out"
              : "Audio bridge did not answer",
          ),
        ),
      receivedAnyResponse ? MESSAGE_TIMEOUT_MS : FIRST_RESPONSE_TIMEOUT_MS,
    );
  };
  const throwIfFailed = () => {
    if (!failure) return;
    if (!globalThis.location.href.includes(videoId)) {
      throw makeAbortError("URL changed during audio download");
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
    // Answers are matched by their `messageId` and their origin, never by
    // `event.source`. A userscript runs in a realm whose `globalThis` is not
    // the page `window`, so the handler answers the page window and every
    // response fails an `event.source === globalThis` test: that comparison
    // is what silently dropped all chunks (`receivedChunks: 0`) and left the
    // upload with nothing to send.
    if (
      !message ||
      message.messageId !== messageId ||
      message.messageType !== MESSAGE_TYPE ||
      message.messageDirection !== "response" ||
      !isTrustedBridgeOrigin(event.origin)
    ) {
      return;
    }

    receivedAnyResponse = true;
    resetMessageTimeout();
    if (message.isAborted) {
      finish(makeAbortError(message.error));
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
      });
      return;
    }

    try {
      const chunk = parseAudioBridgeChunk(message.payload);
      queue.push(chunk);
      receivedChunks++;
      debug.log("Audio downloader. Audio bridge chunk received", {
        videoId,
        messageId,
        index: receivedChunks - 1,
        size: chunk.buffer.byteLength,
        isLastChunk: chunk.isLastChunk,
      });
    } catch (error) {
      finish(error instanceof Error ? error : new Error(String(error)));
    }
  };
  const onAbort = () => finish(makeAbortError(signal.reason));
  const streamTimeout = setTimeout(
    () => finish(new Error("Audio bridge stream timed out")),
    STREAM_TIMEOUT_MS,
  );
  const navigationInterval = setInterval(() => {
    if (!globalThis.location.href.includes(videoId)) {
      finish(makeAbortError("URL changed during audio download"));
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
          payload: { pureVideoId: videoId, audioDownloadType },
        },
        "*",
      );
    }

    // Buffered chunks are handed out before a failure is raised. An error
    // that arrives together with the last chunk (a realm closing, the user
    // navigating away) must not throw away a download that already finished:
    // the consumer stops at `isLastChunk` and never sees the error.
    // CONSOLIDATION: `drain()` is that rule, once.
    for await (const chunk of queue.drain()) yield chunk;
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

export function getAudioFromBridge(
  { videoId, signal }: GetAudioFromAPIOptions,
  audioDownloadType: AvailableAudioDownloadType,
) {
  return {
    fileId: `random-${audioDownloadType}-${crypto.randomUUID()}`,
    getMediaBuffers: () =>
      getAudioBridgeChunks(videoId, signal, audioDownloadType),
  };
}
