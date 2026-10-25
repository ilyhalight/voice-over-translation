import debug from "../../utils/debug";
import type { AudioChunk } from "./audioChunks";

export async function* getQueuedAudioChunks(
  queue: Map<string, Promise<void>>,
  strategy: string,
  videoId: string,
  signal: AbortSignal,
  download: () => AsyncGenerator<AudioChunk>,
): AsyncGenerator<AudioChunk> {
  const queueKey = String(videoId);
  const previous = queue.get(queueKey) ?? Promise.resolve();
  const hadPrevious = queue.has(queueKey);
  let releaseCurrent!: () => void;
  const current = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });
  queue.set(queueKey, current);
  debug.log(`Audio downloader. ${strategy} queued`, {
    videoId,
    hasPrevious: hadPrevious,
  });
  try {
    await previous;
    signal.throwIfAborted();
    yield* download();
  } finally {
    releaseCurrent();
    if (queue.get(queueKey) === current) queue.delete(queueKey);
    debug.log(`Audio downloader. ${strategy} queue released`, { videoId });
  }
}
