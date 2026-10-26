import debug from "../../utils/debug";
import type { AudioChunk } from "./audioChunks";

export async function* getQueuedAudioChunks(
  queue: Map<string, Promise<void>>,
  strategy: string,
  videoId: string,
  signal: AbortSignal,
  download: () => AsyncGenerator<AudioChunk>,
): AsyncGenerator<AudioChunk> {
  const previous = queue.get(videoId);
  let releaseCurrent!: () => void;
  const current = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });
  queue.set(videoId, current);
  debug.log(`Audio downloader. ${strategy} queued`, {
    videoId,
    hasPrevious: previous !== undefined,
  });
  try {
    await previous;
    signal.throwIfAborted();
    yield* download();
  } finally {
    releaseCurrent();
    if (queue.get(videoId) === current) queue.delete(videoId);
    debug.log(`Audio downloader. ${strategy} queue released`, { videoId });
  }
}
