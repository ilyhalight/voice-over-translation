import type {
  AudioDownloadRequestOptions,
  DownloadedAudioData,
  DownloadedPartialAudioData,
} from "../types/audioDownloader";
import { throwIfAborted } from "../utils/abort";
import debug from "../utils/debug";
import { isAbortError, makeAbortError } from "../utils/errors";
import { EventImpl } from "../utils/eventImpl";

import {
  type AvailableAudioDownloadType,
  strategies,
  WEB_ABR_STRATEGY,
  WEB_MSE_PROXY_STRATEGY,
} from "./strategies";
import type { AudioChunk } from "./strategies/audioChunks";

async function handleCommonAudioDownloadRequest({
  audioDownloader,
  attemptedStrategy,
  translationId,
  videoId,
  signal,
  sourceLanguage,
}: AudioDownloadRequestOptions & {
  attemptedStrategy: AvailableAudioDownloadType;
}) {
  const audioData = await strategies[attemptedStrategy]({
    videoId,
    signal,
    sourceLanguage,
  });
  if (!audioData) {
    throw new Error("Audio downloader. Can not get audio data");
  }
  debug.log("Audio downloader. Url found", {
    audioDownloadType: attemptedStrategy,
  });

  const { getMediaBuffers, fileId } = audioData;

  // One-item lookahead: hold each real chunk until the next item (or clean
  // EOF) confirms it, so a terminal zero-byte marker is absorbed and the
  // last real chunk is sent as terminal with amount = total. Nothing held is
  // dispatched if iteration throws before clean EOF.
  let index = 0;
  let pending: AudioChunk | undefined;
  let sawTerminal = false;
  const dispatchChunk = async (chunk: Uint8Array, isLastChunk: boolean) => {
    await audioDownloader.onDownloadedPartialAudio.dispatchAsync(
      translationId,
      {
        videoId,
        fileId,
        audioData: chunk,
        version: 1,
        index,
        amount: isLastChunk ? index + 1 : 0,
      },
    );
    index++;
  };

  for await (const raw of getMediaBuffers()) {
    if (sawTerminal) {
      // A real last chunk is final; only trailing empty markers are allowed.
      if (raw.buffer.byteLength === 0 && raw.isLastChunk) continue;
      throw new Error(
        "Audio downloader. Malformed audio stream after last chunk",
      );
    }
    if (raw.isLastChunk) {
      if (raw.buffer.byteLength === 0) {
        // Terminal marker: promote the held chunk to terminal.
        if (!pending) throw new Error("Audio downloader. Empty audio");
        await dispatchChunk(pending.buffer, true);
        pending = undefined;
      } else {
        if (pending) await dispatchChunk(pending.buffer, false);
        pending = raw;
      }
      sawTerminal = true;
      continue;
    }
    if (raw.buffer.byteLength === 0) {
      throw new Error("Audio downloader. Empty audio");
    }
    if (pending) await dispatchChunk(pending.buffer, false);
    pending = raw;
  }

  if (pending) {
    if (!pending.isLastChunk) {
      throw new Error("Audio downloader. Stream ended without a last chunk");
    }
    await dispatchChunk(pending.buffer, true);
  } else if (!sawTerminal) {
    throw new Error("Audio downloader. Stream ended without a last chunk");
  }
}

// Per-video tails shared by every AudioDownloader instance in this realm.
// The WEB_ABR queue used to live inside the service iframe realm, where each
// download creates a fresh iframe (fresh module state), so same-video runs
// never shared a Map. Queuing here, before any iframe exists, serializes the
// whole run (WEB_ABR plus fallback) FIFO per videoId.
const audioDownloadTails = new Map<string, Promise<void>>();

function waitForPreviousDownload(
  previous: Promise<void>,
  signal: AbortSignal,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(makeAbortError());
      return;
    }
    const onAbort = () => reject(makeAbortError());
    signal.addEventListener("abort", onAbort, { once: true });
    const settled = () => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    };
    // A failed predecessor must not fail the waiter; it only gates ordering.
    previous.then(settled, settled);
  });
}

async function acquireAudioDownloadSlot(
  videoId: string,
  signal: AbortSignal,
): Promise<() => void> {
  throwIfAborted(signal);
  const previous = audioDownloadTails.get(videoId) ?? Promise.resolve();
  let resolveOwn!: () => void;
  const ownDone = new Promise<void>((resolve) => {
    resolveOwn = resolve;
  });
  const tail = previous.then(
    () => ownDone,
    () => ownDone,
  );
  audioDownloadTails.set(videoId, tail);
  const cleanup = () => {
    if (audioDownloadTails.get(videoId) === tail) {
      audioDownloadTails.delete(videoId);
    }
  };
  tail.then(cleanup, cleanup);
  try {
    await waitForPreviousDownload(previous, signal);
    throwIfAborted(signal);
  } catch (error) {
    // Settle our link so later callers still wait for the real predecessor.
    resolveOwn();
    throw error;
  }
  return resolveOwn;
}

export class AudioDownloader {
  onDownloadedAudio = new EventImpl<[string, DownloadedAudioData]>();
  onDownloadedPartialAudio = new EventImpl<
    [string, DownloadedPartialAudioData]
  >();
  onDownloadAudioError = new EventImpl<[string, string]>();

  strategy: AvailableAudioDownloadType;

  constructor(strategy: AvailableAudioDownloadType = WEB_ABR_STRATEGY) {
    this.strategy = strategy;
    debug.log("Audio downloader created", {
      strategy,
    });
  }

  async runAudioDownload(
    videoId: string,
    translationId: string,
    signal: AbortSignal,
    sourceLanguage?: string,
  ) {
    let release: (() => void) | undefined;
    try {
      release = await acquireAudioDownloadSlot(videoId, signal);
    } catch (error) {
      if (signal.aborted || isAbortError(error)) {
        debug.log("Audio downloader. Audio download aborted", {
          videoId,
        });
        return;
      }
      debug.error("Audio downloader. All audio download strategies failed", {
        videoId,
      });
      this.onDownloadAudioError.dispatch(translationId, videoId);
      return;
    }
    try {
      const attempts: AvailableAudioDownloadType[] =
        this.strategy === WEB_ABR_STRATEGY
          ? [WEB_ABR_STRATEGY, WEB_MSE_PROXY_STRATEGY]
          : [this.strategy];
      for (const attemptedStrategy of attempts) {
        try {
          await handleCommonAudioDownloadRequest({
            audioDownloader: this,
            attemptedStrategy,
            translationId,
            videoId,
            signal,
            sourceLanguage,
          });
          debug.log("Audio downloader. Audio download finished", {
            videoId,
            sourceLanguage,
            audioDownloadType: attemptedStrategy,
          });
          return;
        } catch (error) {
          if (signal.aborted || isAbortError(error)) {
            debug.log("Audio downloader. Audio download aborted", {
              videoId,
              audioDownloadType: attemptedStrategy,
            });
            return;
          }
          debug.error("Audio downloader. Strategy failed", {
            videoId,
            audioDownloadType: attemptedStrategy,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      debug.error("Audio downloader. All audio download strategies failed", {
        videoId,
      });
      this.onDownloadAudioError.dispatch(translationId, videoId);
    } finally {
      release();
    }
  }

  addEventListener(
    type: "downloadedAudio",
    listener: (translationId: string, data: DownloadedAudioData) => void,
  ): this;
  addEventListener(
    type: "downloadedPartialAudio",
    listener: (translationId: string, data: DownloadedPartialAudioData) => void,
  ): this;
  addEventListener(
    type: "downloadAudioError",
    listener: (translationId: string, videoId: string) => void,
  ): this;
  addEventListener(
    type: "downloadedAudio" | "downloadedPartialAudio" | "downloadAudioError",
    listener: (...data: any[]) => void,
  ): this {
    switch (type) {
      case "downloadedAudio":
        this.onDownloadedAudio.addListener(listener);
        break;
      case "downloadedPartialAudio":
        this.onDownloadedPartialAudio.addListener(listener);
        break;
      case "downloadAudioError":
        this.onDownloadAudioError.addListener(listener);
        break;
    }

    return this;
  }

  removeEventListener(
    type: "downloadedAudio",
    listener: (translationId: string, data: DownloadedAudioData) => void,
  ): this;
  removeEventListener(
    type: "downloadedPartialAudio",
    listener: (translationId: string, data: DownloadedPartialAudioData) => void,
  ): this;
  removeEventListener(
    type: "downloadAudioError",
    listener: (translationId: string, videoId: string) => void,
  ): this;
  removeEventListener(
    type: "downloadedAudio" | "downloadedPartialAudio" | "downloadAudioError",
    listener: (...data: any[]) => void,
  ): this {
    switch (type) {
      case "downloadedAudio":
        this.onDownloadedAudio.removeListener(listener);
        break;
      case "downloadedPartialAudio":
        this.onDownloadedPartialAudio.removeListener(listener);
        break;
      case "downloadAudioError":
        this.onDownloadAudioError.removeListener(listener);
        break;
    }

    return this;
  }
}
