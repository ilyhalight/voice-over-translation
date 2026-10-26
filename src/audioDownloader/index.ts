import { isAbortError, makeAbortError, toErrorMessage } from "#utils/errors.ts";
import logger from "#utils/logger.ts";
import { captureException } from "../modules/telemetry/client";
import {
  getAudioFailureTags,
  type StrategyFailure,
  selectStrategyFailuresToReport,
} from "../modules/telemetry/context";
import type {
  AudioDownloadRequestOptions,
  DownloadedAudioData,
  DownloadedPartialAudioData,
} from "../types/audioDownloader";
import { throwIfAborted } from "../utils/abort";
import debug from "../utils/debug";
import { EventImpl } from "../utils/eventImpl";

import {
  type AvailableAudioDownloadType,
  SABR_STRATEGY,
  strategies,
  WEB_ABR_STRATEGY,
  WEB_MSE_PROXY_STRATEGY,
} from "./strategies";
import type { AudioChunk } from "./strategies/audioChunks";

// Not keyed by video: a broken strategy affects every video, and one warning
// per strategy and outcome keeps the session event budget for other errors.
function reportStrategyFailures(
  failures: StrategyFailure[],
  downloadSucceeded: boolean,
): void {
  for (const { strategy, error, recovered } of selectStrategyFailuresToReport(
    failures,
    downloadSucceeded,
  )) {
    captureException(error, {
      source: "audio",
      operation: "audioStrategy",
      level: "warning",
      dedupeKey: `${strategy}:${recovered}`,
      // Strategy errors can embed media urls and ids.
      redactedMessage: `Audio strategy failed: ${strategy}`,
      tags: {
        ...getAudioFailureTags(error, "download"),
        audio_strategy: strategy,
        audio_recovered: String(recovered),
      },
    });
  }
}

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

type AudioDownloaderEventMap = {
  downloadedAudio: [translationId: string, data: DownloadedAudioData];
  downloadedPartialAudio: [
    translationId: string,
    data: DownloadedPartialAudioData,
  ];
  downloadAudioError: [
    translationId: string,
    videoId: string,
    signInSuggested: boolean,
  ];
};

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

  onDownloadedAudio = new EventImpl<
    AudioDownloaderEventMap["downloadedAudio"]
  >();
  onDownloadedPartialAudio = new EventImpl<
    AudioDownloaderEventMap["downloadedPartialAudio"]
  >();
  onDownloadAudioError = new EventImpl<
    AudioDownloaderEventMap["downloadAudioError"]
  >();

  private readonly events: {
    [K in keyof AudioDownloaderEventMap]: EventImpl<AudioDownloaderEventMap[K]>;
  } = {
    downloadedAudio: this.onDownloadedAudio,
    downloadedPartialAudio: this.onDownloadedPartialAudio,
    downloadAudioError: this.onDownloadAudioError,
  };

  strategy: AvailableAudioDownloadType;

  constructor(strategy: AvailableAudioDownloadType = "auto") {
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
        debug.log("[AudioDownload] prepared audio cached for retry", {
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
    debug.log("[AudioDownload] replaying cached prepared audio", {
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
      logger.error("Audio downloader. All audio download strategies failed", {
        videoId,
      });
      this.onDownloadAudioError.dispatch(translationId, videoId, false);
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
        this.strategy === "auto"
          ? [SABR_STRATEGY, WEB_ABR_STRATEGY, WEB_MSE_PROXY_STRATEGY]
          : [this.strategy];
      const failures: StrategyFailure[] = [];
      let signInSuggested = false;
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
          logger.log("Audio downloader. Audio download finished", {
            videoId,
            sourceLanguage,
            audioDownloadType: attemptedStrategy,
          });
          reportStrategyFailures(failures, true);
          return;
        } catch (error) {
          if (signal.aborted || isAbortError(error)) {
            debug.log("Audio downloader. Audio download aborted", {
              videoId,
              audioDownloadType: attemptedStrategy,
            });
            return;
          }
          if (
            attemptedStrategy === WEB_ABR_STRATEGY &&
            error instanceof Error &&
            error.message.includes("YOUTUBE_SIGN_IN_SUGGESTED")
          ) {
            // A client-level login hint must not suppress the native MSE fallback.
            signInSuggested = true;
          }
          failures.push({ strategy: attemptedStrategy, error });
          logger.error("Audio downloader. Strategy failed", {
            videoId,
            audioDownloadType: attemptedStrategy,
            error: toErrorMessage(error),
          });
        }
      }

      logger.error("Audio downloader. All audio download strategies failed", {
        videoId,
      });
      const lastError = failures.at(-1)?.error;
      reportStrategyFailures(failures, false);
      captureException(lastError, {
        source: "audio",
        operation: "downloadSourceAudio",
        dedupeKey: videoId,
        // Strategy errors can embed media urls and ids.
        redactedMessage: "All audio download strategies failed",
        tags: {
          ...getAudioFailureTags(lastError, "download"),
          audio_strategies: attempts.join(","),
        },
      });
      this.onDownloadAudioError.dispatch(
        translationId,
        videoId,
        signInSuggested,
      );
    } finally {
      if (collecting && this.collectingChunks.get(videoId) === collecting) {
        this.collectingChunks.delete(videoId);
      }
      release();
    }
  }

  addEventListener<K extends keyof AudioDownloaderEventMap>(
    type: K,
    listener: (...data: AudioDownloaderEventMap[K]) => void,
  ): this {
    this.events[type].addListener(listener);
    return this;
  }

  removeEventListener<K extends keyof AudioDownloaderEventMap>(
    type: K,
    listener: (...data: AudioDownloaderEventMap[K]) => void,
  ): this {
    this.events[type].removeListener(listener);
    return this;
  }
}
