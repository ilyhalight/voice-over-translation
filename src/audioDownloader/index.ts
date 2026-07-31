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
    // Respect an explicit abort signal: when the upload of a previous chunk
    // failed (and the translation handler aborted its actions controller) or
    // when the VideoHandler was released, stop fetching further chunks.
    // Without this check the loop would continue downloading the entire
    // audio even though no one will upload it, wasting bandwidth.
    if (signal?.aborted) {
      debug.log("Audio downloader. Aborting chunk loop — signal aborted", {
        index,
        mediaPartsLength,
      });
      break;
    }

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

  // Tolerate early exit when the download was cancelled mid-stream via the
  // abort signal — the caller (translation handler) has already been
  // notified of failure via `onDownloadAudioError`.
  if (!signal?.aborted && index !== mediaPartsLength) {
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
