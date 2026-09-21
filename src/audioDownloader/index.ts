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
  throwIfAborted(signal);

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
    // Upload handlers may abort the run.
    throwIfAborted(signal);
    index++;
  };

  for await (const raw of getMediaBuffers()) {
    throwIfAborted(signal);
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
  // Only the most recent completed download is kept so a failed upload can
  // resume the same video without re-downloading. Completing a different
  // video replaces it; this is a single-entry cache, not an LRU/TTL.
  private completedAudioCache: {
    videoId: string;
    fileId: string;
    chunks: Uint8Array[];
    version: 1;
  } | null = null;
  private readonly collectingChunks = new Map<string, Uint8Array[]>();

  onDownloadedAudio = new EventImpl<[string, DownloadedAudioData]>();
  onDownloadedPartialAudio = new EventImpl<
    [string, DownloadedPartialAudioData]
  >();
  onDownloadAudioError = new EventImpl<[string, string]>();

  strategy: AvailableAudioDownloadType;

  constructor(strategy: AvailableAudioDownloadType = WEB_ABR_STRATEGY) {
    this.strategy = strategy;
    this.onDownloadedPartialAudio.addListener((_translationId, data) => {
      const chunks = this.collectingChunks.get(data.videoId);
      if (!chunks) return;
      chunks[data.index] = data.audioData.slice();
      if (
        data.amount !== undefined &&
        data.amount > 0 &&
        data.index === data.amount - 1
      ) {
        this.completedAudioCache = {
          videoId: data.videoId,
          fileId: data.fileId,
          chunks: chunks.slice(0, data.amount),
          version: data.version,
        };
        this.collectingChunks.delete(data.videoId);
        debug.log("[VOT][AudioDownload] prepared audio cached for retry", {
          videoId: data.videoId,
          chunks: data.amount,
        });
      }
    });
    debug.log("Audio downloader created", {
      strategy,
    });
  }

  clearCachedAudio(videoId: string) {
    if (this.completedAudioCache?.videoId === videoId) {
      this.completedAudioCache = null;
    }
    this.collectingChunks.delete(videoId);
  }

  private async replayCachedAudio(
    videoId: string,
    translationId: string,
    signal: AbortSignal,
  ): Promise<boolean> {
    const cached = this.completedAudioCache;
    if (cached?.videoId !== videoId) return false;
    debug.log("[VOT][AudioDownload] replaying cached prepared audio", {
      videoId,
      chunks: cached.chunks.length,
    });
    for (let index = 0; index < cached.chunks.length; index++) {
      throwIfAborted(signal);
      await this.onDownloadedPartialAudio.dispatchAsync(translationId, {
        videoId,
        fileId: cached.fileId,
        audioData: cached.chunks[index] ?? new Uint8Array(),
        version: cached.version,
        index,
        amount: index === cached.chunks.length - 1 ? cached.chunks.length : 0,
      });
    }
    return true;
  }

  async runAudioDownload(
    videoId: string,
    translationId: string,
    signal: AbortSignal,
    sourceLanguage?: string,
  ) {
    if (await this.replayCachedAudio(videoId, translationId, signal)) {
      return;
    }

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

    let collecting: Uint8Array[] | undefined;
    try {
      // A predecessor may have finished the same video while this run waited.
      if (await this.replayCachedAudio(videoId, translationId, signal)) {
        return;
      }
      // Buffer chunks in a run-local array so an abort/failure can drop them.
      // The identity guard keeps a queued same-video run from losing its own
      // collection when an overlapping predecessor cleans up.
      collecting = [];
      this.collectingChunks.set(videoId, collecting);
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
      if (collecting && this.collectingChunks.get(videoId) === collecting) {
        this.collectingChunks.delete(videoId);
      }
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
