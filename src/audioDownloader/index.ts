import type {
  AudioDownloadRequestOptions,
  DownloadedPartialAudioData,
} from "../types/audioDownloader";
import debug from "../utils/debug";
import { isAbortError, toErrorMessage } from "../utils/errors";
import { EventImpl } from "../utils/eventImpl";
import {
  AUDIO_DOWNLOAD_TYPES,
  type AvailableAudioDownloadType,
} from "./strategies/bridgeProtocol";
import { initPageAudioHandler } from "./strategies/pageAudioHandler";
import { getAudioFromBridge } from "./strategies/webAudioBridge";

// The download itself runs in the page realm, so the handler has to be ready
// before the first request is posted to it.
initPageAudioHandler();

/**
 * How a whole download attempt ended.
 *
 * The caller needs it for `shouldSendFailedAudio`: the translation backend
 * refuses a request that announces failed audio while a complete upload is
 * sitting in its storage, so the flag may only be set when every strategy
 * really failed.
 */
export type AudioDownloadOutcome =
  | { status: "completed"; audioDownloadType: AvailableAudioDownloadType }
  | { status: "aborted" }
  | { status: "failed" };

function assertHasAudioChunk(chunk: Uint8Array | undefined): Uint8Array {
  if (!chunk || chunk.byteLength === 0) {
    throw new Error("Audio downloader. Empty audio");
  }
  return chunk;
}

async function handleAudioDownloadRequest({
  audioDownloader,
  translationId,
  videoId,
  signal,
  audioDownloadType,
}: AudioDownloadRequestOptions) {
  const { getMediaBuffers, fileId } = getAudioFromBridge(
    { videoId, signal },
    audioDownloadType,
  );

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
  onDownloadedPartialAudio = new EventImpl<
    [string, DownloadedPartialAudioData]
  >();
  onDownloadAudioError = new EventImpl<[string, string]>();

  async runAudioDownload(
    videoId: string,
    translationId: string,
    signal: AbortSignal,
  ): Promise<AudioDownloadOutcome> {
    let failure: unknown;
    // The direct-URL strategy goes first because it costs two requests. The
    // MediaSource capture needs no request of its own, but it has to load a
    // hidden player, so it only runs when YouTube answers no usable URL.
    for (const audioDownloadType of AUDIO_DOWNLOAD_TYPES) {
      try {
        await handleAudioDownloadRequest({
          audioDownloader: this,
          translationId,
          videoId,
          signal,
          audioDownloadType,
        });
        debug.log("Audio downloader. Audio download finished", {
          videoId,
          audioDownloadType,
        });
        return { status: "completed", audioDownloadType };
      } catch (error) {
        if (signal.aborted || isAbortError(error)) {
          debug.log("Audio downloader. Audio download aborted", { videoId });
          return { status: "aborted" };
        }
        failure = error;
        // Every attempt uploads under its own file id, so the next strategy
        // starts a clean file instead of continuing a broken one.
        debug.error("Audio downloader. Audio download strategy failed", {
          videoId,
          audioDownloadType,
          error: toErrorMessage(error),
        });
      }
    }

    debug.error("Audio downloader. Audio download failed", {
      videoId,
      error: toErrorMessage(failure),
    });
    // Awaited, so the caller sees the final state of the upload (the
    // fail-audio fallback included) before it decides on its flags.
    await this.onDownloadAudioError.dispatchAsync(translationId, videoId);
    return { status: "failed" };
  }

  addEventListener(
    type: "downloadedPartialAudio",
    listener: (translationId: string, data: DownloadedPartialAudioData) => void,
  ): this;
  addEventListener(
    type: "downloadAudioError",
    listener: (translationId: string, videoId: string) => void,
  ): this;
  addEventListener(
    type: "downloadedPartialAudio" | "downloadAudioError",
    listener: (...data: any[]) => void,
  ): this {
    switch (type) {
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
    type: "downloadedPartialAudio",
    listener: (translationId: string, data: DownloadedPartialAudioData) => void,
  ): this;
  removeEventListener(
    type: "downloadAudioError",
    listener: (translationId: string, videoId: string) => void,
  ): this;
  removeEventListener(
    type: "downloadedPartialAudio" | "downloadAudioError",
    listener: (...data: any[]) => void,
  ): this {
    switch (type) {
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
