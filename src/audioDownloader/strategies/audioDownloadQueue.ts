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
  let previousSettled = previous === undefined;
  void previous?.then(() => {
    previousSettled = true;
  });
  try {
    await waitForPrevious(previous, signal);
    signal.throwIfAborted();
    yield* download();
  } finally {
    const release = () => {
      releaseCurrent();
      if (queue.get(videoId) === current) queue.delete(videoId);
      debug.log(`Audio downloader. ${strategy} queue released`, { videoId });
    };
    // Aborted while waiting: keep serialization, release after predecessor.
    if (previousSettled || !previous) release();
    else void previous.then(release);
  }
}

function waitForPrevious(
  previous: Promise<void> | undefined,
  signal: AbortSignal,
): Promise<void> {
  if (!previous) return Promise.resolve();
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    void previous.then(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    });
  });
}
