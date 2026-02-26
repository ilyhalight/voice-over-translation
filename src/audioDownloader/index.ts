import { EventImpl } from "../core/eventImpl";
import type {
  AudioDownloadRequestOptions,
  DownloadedAudioData,
  DownloadedPartialAudioData,
} from "../types/audioDownloader";
import debug from "../utils/debug";

import {
  type AvailableAudioDownloadType,
  strategies,
  YT_AUDIO_STRATEGY,
} from "./strategies";

function assertValidMediaPartsLength(mediaPartsLength: number): void {
  if (!Number.isInteger(mediaPartsLength) || mediaPartsLength < 1) {
    throw new Error("Audio downloader. Invalid media parts length");
  }
}

function assertHasAudioChunk(chunk: Uint8Array | undefined): Uint8Array {
  if (!chunk || chunk.byteLength === 0) {
    throw new Error("Audio downloader. Empty audio");
  }
  return chunk;
}

async function handleCommonAudioDownloadRequest({
  audioDownloader,
  translationId,
  videoId,
  signal,
}: AudioDownloadRequestOptions) {
  const audioData = await strategies[audioDownloader.strategy]({
    videoId,
    signal,
  });
  if (!audioData) {
    throw new Error("Audio downloader. Can not get audio data");
  }
  debug.log("Audio downloader. Url found", {
    audioDownloadType: audioDownloader.strategy,
  });

  const { getMediaBuffers, mediaPartsLength, fileId } = audioData;
  assertValidMediaPartsLength(mediaPartsLength);

  if (mediaPartsLength < 2) {
    const iterator = getMediaBuffers();
    const { value } = (await iterator.next()) as { value: Uint8Array };
    const singleChunk = assertHasAudioChunk(value);

    await audioDownloader.onDownloadedAudio.dispatchAsync(translationId, {
      videoId,
      fileId,
      audioData: singleChunk,
    });
    return;
  }

  let index = 0;
  for await (const audioChunk of getMediaBuffers()) {
    const chunk = assertHasAudioChunk(audioChunk);

    await audioDownloader.onDownloadedPartialAudio.dispatchAsync(
      translationId,
      {
        videoId,
        fileId,
        audioData: chunk,
        version: 1,
        index,
        amount: mediaPartsLength,
      },
    );

    index++;
  }

  if (index !== mediaPartsLength) {
    throw new Error(
      `Audio downloader. Expected ${mediaPartsLength} chunks, got ${index}`,
    );
  }
}

export class AudioDownloader {
  onDownloadedAudio = new EventImpl<[string, DownloadedAudioData]>();
  onDownloadedPartialAudio = new EventImpl<
    [string, DownloadedPartialAudioData]
  >();
  onDownloadAudioError = new EventImpl<[string]>();

  strategy: AvailableAudioDownloadType;

  constructor(strategy: AvailableAudioDownloadType = YT_AUDIO_STRATEGY) {
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
    try {
      await handleCommonAudioDownloadRequest({
        audioDownloader: this,
        translationId,
        videoId,
        signal,
      });
      debug.log("Audio downloader. Audio download finished", {
        videoId,
      });
    } catch (err) {
      debug.error("Audio downloader. Failed to download audio", {
        videoId,
        error: err instanceof Error ? err.message : String(err),
      });
      this.onDownloadAudioError.dispatch(videoId);
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
    listener: (videoId: string) => void,
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
    listener: (videoId: string) => void,
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
