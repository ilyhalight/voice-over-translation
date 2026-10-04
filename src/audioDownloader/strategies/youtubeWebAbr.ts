import { createAbortableDelay } from "../../utils/abort";
import debug from "../../utils/debug";
import type { AudioChunk } from "./audioChunks";
import {
  getWebAbrAudioChunks as getLegacyWebAbrAudioChunks,
  type WebAbrWindow,
} from "./webAbr";
import { trySabrAudioChunks } from "./youtubeSabr";

const SABR_MAX_ATTEMPTS = 2;
const SABR_RETRY_DELAY_MS = 750;

function isDeterministicSabrError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("SABR could not resolve requested audio language") ||
    message.includes("SABR found no VOT-supported audio track") ||
    (message.includes("SABR audio language") &&
      message.includes("is ambiguous")) ||
    message.includes("refusing array[0] fallback")
  );
}

/**
 * Prefer YouTube SABR, but keep the existing WebABR implementation as the
 * byte-zero fallback. A SABR attempt is transactional: no chunk escapes until
 * the SABR generator reaches clean EOF.
 */
async function* getWebAbrAudioChunksImpl(
  targetWindow: WebAbrWindow,
  videoId: string,
  signal: AbortSignal,
  sourceLanguage?: string,
): AsyncGenerator<AudioChunk> {
  let sabrError: unknown;

  for (let attempt = 1; attempt <= SABR_MAX_ATTEMPTS; attempt++) {
    const chunks: AudioChunk[] = [];
    let bytes = 0;
    try {
      for await (const chunk of trySabrAudioChunks(
        targetWindow,
        videoId,
        signal,
        sourceLanguage,
      )) {
        const buffer = chunk.buffer.slice();
        chunks.push({ buffer, isLastChunk: chunk.isLastChunk });
        bytes += buffer.byteLength;
      }
      if (chunks.length === 0) {
        throw new Error(
          "Audio downloader. SABR completed without audio chunks",
        );
      }
      debug.log("Audio downloader. SABR completed", {
        videoId,
        attempt,
        chunks: chunks.length,
        bytes,
      });

      yield* chunks;
      return;
    } catch (error) {
      signal.throwIfAborted();
      sabrError = error;
      debug.log("Audio downloader. SABR attempt failed", {
        videoId,
        attempt,
        bufferedChunks: chunks.length,
        bufferedBytes: bytes,
        error: error instanceof Error ? error.message : String(error),
      });
      if (attempt < SABR_MAX_ATTEMPTS && !isDeterministicSabrError(error)) {
        await createAbortableDelay(SABR_RETRY_DELAY_MS, signal);
        continue;
      }
      break;
    }
  }

  debug.log("Audio downloader. SABR failed; trying existing WebABR", {
    videoId,
    error: sabrError instanceof Error ? sabrError.message : String(sabrError),
  });
  yield* getLegacyWebAbrAudioChunks(
    targetWindow,
    videoId,
    signal,
    sourceLanguage,
  );
}
const WEB_ABR_DOWNLOAD_QUEUE = new Map<string, Promise<void>>();

/**
 * Serialize concurrent web_abr downloads for the same video.
 *
 * The queue covers the complete YouTube acquisition chain: SABR attempts and
 * the existing WebABR byte-zero fallback. Calls for different videos can still
 * run independently.
 */
export async function* getWebAbrAudioChunks(
  targetWindow: WebAbrWindow,
  videoId: string,
  signal: AbortSignal,
  sourceLanguage?: string,
): AsyncGenerator<AudioChunk> {
  const queueKey = String(videoId);
  const previous = WEB_ABR_DOWNLOAD_QUEUE.get(queueKey) ?? Promise.resolve();
  const hadPrevious = WEB_ABR_DOWNLOAD_QUEUE.has(queueKey);

  let releaseCurrent: (() => void) | undefined;
  const current = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });
  WEB_ABR_DOWNLOAD_QUEUE.set(queueKey, current);

  debug.log("Audio downloader. web ABR queued", {
    videoId,
    hasPrevious: hadPrevious,
  });

  try {
    await previous;
    signal.throwIfAborted();
    yield* getWebAbrAudioChunksImpl(
      targetWindow,
      videoId,
      signal,
      sourceLanguage,
    );
  } finally {
    releaseCurrent?.();
    if (WEB_ABR_DOWNLOAD_QUEUE.get(queueKey) === current) {
      WEB_ABR_DOWNLOAD_QUEUE.delete(queueKey);
    }
    debug.log("Audio downloader. web ABR queue released", { videoId });
  }
}
