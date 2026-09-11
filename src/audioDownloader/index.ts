import type {
  AudioDownloadRequestOptions,
  DownloadedAudioData,
  DownloadedPartialAudioData,
} from "../types/audioDownloader";
import debug from "../utils/debug";
import { EventImpl } from "../utils/eventImpl";

import {
  type AvailableAudioDownloadType,
  strategies,
  WEB_ABR_STRATEGY,
  WEB_MSE_PROXY_STRATEGY,
} from "./strategies";

function assertHasAudioChunk(chunk: Uint8Array | undefined): Uint8Array {
  if (!chunk || chunk.byteLength === 0) {
    throw new Error("Audio downloader. Empty audio");
  }
  return chunk;
}

async function handleCommonAudioDownloadRequest({
  audioDownloader,
  attemptedStrategy,
  translationId,
  videoId,
  signal,
}: AudioDownloadRequestOptions & {
  attemptedStrategy: AvailableAudioDownloadType;
}) {
  const audioData = await strategies[attemptedStrategy]({
    videoId,
    signal,
  });
  if (!audioData) {
    throw new Error("Audio downloader. Can not get audio data");
  }
  debug.log("Audio downloader. Url found", {
    audioDownloadType: attemptedStrategy,
  });

  const { getMediaBuffers, fileId } = audioData;

  let index = 0;
  let receivedLastChunk = false;
  for await (const { buffer, isLastChunk } of getMediaBuffers()) {
    const chunk =
      isLastChunk && index > 0 ? buffer : assertHasAudioChunk(buffer);
    const amount = isLastChunk ? index + 1 : 0;

    await audioDownloader.onDownloadedPartialAudio.dispatchAsync(
      translationId,
      {
        videoId,
        fileId,
        audioData: chunk,
        version: 1,
        index,
        amount,
      },
    );

    receivedLastChunk ||= isLastChunk;
    index++;
  }

  if (!receivedLastChunk) {
    throw new Error("Audio downloader. Stream ended without a last chunk");
  }
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
  ) {
    const attempts: AvailableAudioDownloadType[] =
      this.strategy === WEB_ABR_STRATEGY
        ? [WEB_ABR_STRATEGY, WEB_MSE_PROXY_STRATEGY]
        : [this.strategy];
    const errors: unknown[] = [];

    for (const attemptedStrategy of attempts) {
      try {
        await handleCommonAudioDownloadRequest({
          audioDownloader: this,
          attemptedStrategy,
          translationId,
          videoId,
          signal,
        });
        debug.log("Audio downloader. Audio download finished", {
          videoId,
          audioDownloadType: attemptedStrategy,
        });
        return;
      } catch (error) {
        if (
          signal.aborted ||
          (error as { name?: string } | null)?.name === "AbortError"
        ) {
          debug.log("Audio downloader. Audio download aborted", {
            videoId,
            audioDownloadType: attemptedStrategy,
          });
          return;
        }
        errors.push(error);
        debug.error("Audio downloader. Strategy failed", {
          videoId,
          audioDownloadType: attemptedStrategy,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const error =
      errors.length === 1
        ? errors[0]
        : new AggregateError(errors, "All audio download strategies failed");
    debug.error("Audio downloader. Failed to download audio", {
      videoId,
      error: error instanceof Error ? error.message : String(error),
    });
    this.onDownloadAudioError.dispatch(translationId, videoId);
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
