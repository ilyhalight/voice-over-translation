import debug from "../../utils/debug";
import type { AudioChunk } from "./audioChunks";
import {
  getWebAbrAudioChunks as getLegacyWebAbrAudioChunks,
  type WebAbrWindow,
} from "./webAbr";

const WEB_ABR_DOWNLOAD_QUEUE = new Map<string, Promise<void>>();

/** Pure WebABR strategy. SABR is implemented separately. */
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
  debug.log("Audio downloader. WebABR queued", {
    videoId,
    hasPrevious: hadPrevious,
  });
  try {
    await previous;
    signal.throwIfAborted();
    yield* getLegacyWebAbrAudioChunks(
      targetWindow,
      videoId,
      signal,
      sourceLanguage,
    );
  } finally {
    releaseCurrent?.();
    if (WEB_ABR_DOWNLOAD_QUEUE.get(queueKey) === current)
      WEB_ABR_DOWNLOAD_QUEUE.delete(queueKey);
    debug.log("Audio downloader. WebABR queue released", { videoId });
  }
}
