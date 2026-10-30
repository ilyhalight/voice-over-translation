import { createAbortableDelay } from "../../utils/abort";
import debug from "../../utils/debug";
import { toErrorMessage } from "../../utils/errors";
import type { AudioChunk } from "./audioChunks";
import { getQueuedAudioChunks } from "./audioDownloadQueue";
import type { WebAbrWindow } from "./webAbr";
import { trySabrAudioChunks } from "./youtubeSabr";

const SABR_MAX_ATTEMPTS = 2;
const SABR_RETRY_DELAY_MS = 750;
const SABR_DOWNLOAD_QUEUE = new Map<string, Promise<void>>();

function isDeterministicSabrError(error: unknown): boolean {
  const message = toErrorMessage(error);
  return (
    message.includes("SABR could not resolve requested audio language") ||
    message.includes("SABR found no VOT-supported audio track") ||
    (message.includes("SABR audio language") &&
      message.includes("is ambiguous")) ||
    message.includes("refusing array[0] fallback") ||
    message.includes("SABR has no compatible available audio format")
  );
}

async function* getSabrAudioChunksImpl(
  targetWindow: WebAbrWindow,
  videoId: string,
  signal: AbortSignal,
  sourceLanguage?: string,
): AsyncGenerator<AudioChunk> {
  let lastError: unknown;
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
      if (!chunks.length)
        throw new Error(
          "Audio downloader. SABR completed without audio chunks",
        );
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
      lastError = error;
      debug.log("Audio downloader. SABR attempt failed", {
        videoId,
        attempt,
        bufferedChunks: chunks.length,
        bufferedBytes: bytes,
        error: toErrorMessage(error),
      });
      if (attempt < SABR_MAX_ATTEMPTS && !isDeterministicSabrError(error)) {
        await createAbortableDelay(SABR_RETRY_DELAY_MS, signal);
        continue;
      }
      break;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(toErrorMessage(lastError, "Audio downloader. SABR failed"));
}

export async function* getSabrAudioChunks(
  targetWindow: WebAbrWindow,
  videoId: string,
  signal: AbortSignal,
  sourceLanguage?: string,
): AsyncGenerator<AudioChunk> {
  yield* getQueuedAudioChunks(
    SABR_DOWNLOAD_QUEUE,
    "SABR",
    videoId,
    signal,
    () => getSabrAudioChunksImpl(targetWindow, videoId, signal, sourceLanguage),
  );
}
