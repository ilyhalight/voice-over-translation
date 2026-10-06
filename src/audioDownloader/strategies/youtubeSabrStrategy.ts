import { createAbortableDelay } from "../../utils/abort";
import debug from "../../utils/debug";
import type { AudioChunk } from "./audioChunks";
import type { WebAbrWindow } from "./webAbr";
import { trySabrAudioChunks } from "./youtubeSabr";

const SABR_MAX_ATTEMPTS = 2;
const SABR_RETRY_DELAY_MS = 750;
const SABR_DOWNLOAD_QUEUE = new Map<string, Promise<void>>();

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
        error: error instanceof Error ? error.message : String(error),
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
    : new Error(String(lastError ?? "Audio downloader. SABR failed"));
}

export async function* getSabrAudioChunks(
  targetWindow: WebAbrWindow,
  videoId: string,
  signal: AbortSignal,
  sourceLanguage?: string,
): AsyncGenerator<AudioChunk> {
  const queueKey = String(videoId);
  const previous = SABR_DOWNLOAD_QUEUE.get(queueKey) ?? Promise.resolve();
  const hadPrevious = SABR_DOWNLOAD_QUEUE.has(queueKey);
  let releaseCurrent: (() => void) | undefined;
  const current = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });
  SABR_DOWNLOAD_QUEUE.set(queueKey, current);
  debug.log("Audio downloader. SABR queued", {
    videoId,
    hasPrevious: hadPrevious,
  });
  try {
    await previous;
    signal.throwIfAborted();
    yield* getSabrAudioChunksImpl(
      targetWindow,
      videoId,
      signal,
      sourceLanguage,
    );
  } finally {
    releaseCurrent?.();
    if (SABR_DOWNLOAD_QUEUE.get(queueKey) === current)
      SABR_DOWNLOAD_QUEUE.delete(queueKey);
    debug.log("Audio downloader. SABR queue released", { videoId });
  }
}
