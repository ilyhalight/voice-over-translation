import type { AudioChunk } from "./audioChunks";
import { getQueuedAudioChunks } from "./audioDownloadQueue";
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
  yield* getQueuedAudioChunks(
    WEB_ABR_DOWNLOAD_QUEUE,
    "WebABR",
    videoId,
    signal,
    () =>
      getLegacyWebAbrAudioChunks(targetWindow, videoId, signal, sourceLanguage),
  );
}
