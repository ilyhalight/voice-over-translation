import { config } from "@vot.js/shared";
import logger from "#utils/logger.ts";
import {
  encodeWav,
  getLocalFileSource,
  LOCAL_FILE_AUDIO_RATE,
  mixToMonoPcm16,
  splitIntoChunks,
} from "../../core/localFile";
import type { GetAudioFromAPIOptions } from "../../types/audioDownloader";
import { throwIfAborted } from "../../utils/abort";
import debug from "../../utils/debug";
import { GM_fetch } from "../../utils/gm";
import type { AudioChunk } from "./audioChunks";
import { WEB_MSE_PROXY_STRATEGY } from "./audioStrategy";

const READ_TIMEOUT_MS = 120_000;

/**
 * Reads the local file through the background fetch (a content script cannot
 * fetch file:// itself), decodes its audio track and returns it as WAV chunks.
 */
export async function getAudioFromLocalFile({
  videoId,
  signal,
}: GetAudioFromAPIOptions) {
  const fileUrl = getLocalFileSource(videoId);
  if (!fileUrl) {
    throw new Error("Audio downloader. Local file source is not registered");
  }

  const startedAt = performance.now();
  const response = await GM_fetch(fileUrl, {
    forceGmXhr: true,
    timeout: READ_TIMEOUT_MS,
    signal,
  });
  const fileBytes = await response.arrayBuffer();
  throwIfAborted(signal);
  debug.log("[LocalFile] file read", {
    bytes: fileBytes.byteLength,
    ms: Math.round(performance.now() - startedAt),
  });
  if (!fileBytes.byteLength) {
    throw new Error("Audio downloader. Local file is empty or unreadable");
  }

  // Decoding in an offline context resamples to its rate without playback.
  const decodeStartedAt = performance.now();
  const context = new OfflineAudioContext(
    1,
    LOCAL_FILE_AUDIO_RATE,
    LOCAL_FILE_AUDIO_RATE,
  );
  let audio: AudioBuffer;
  try {
    audio = await context.decodeAudioData(fileBytes);
  } catch (error) {
    // The generic UI error hides the cause: the browser has no decoder for
    // this audio track (AC-3, DTS) or the file has none at all.
    logger.error(
      "[LocalFile] the browser could not decode the audio track of this file",
      error,
    );
    throw new Error("Audio downloader. Local file audio is not decodable", {
      cause: error,
    });
  }
  throwIfAborted(signal);
  const channels = Array.from({ length: audio.numberOfChannels }, (_, index) =>
    audio.getChannelData(index),
  );
  const wav = encodeWav(mixToMonoPcm16(channels), LOCAL_FILE_AUDIO_RATE);
  const chunks = splitIntoChunks(wav, config.minChunkSize);
  debug.log("[LocalFile] audio prepared", {
    format: `wav pcm16 mono ${LOCAL_FILE_AUDIO_RATE} Hz`,
    durationSeconds: Math.round(audio.duration),
    sourceChannels: audio.numberOfChannels,
    wavBytes: wav.byteLength,
    chunks: chunks.length,
    decodeMs: Math.round(performance.now() - decodeStartedAt),
  });

  return {
    // Yandex is known to accept this file id shape for client uploads.
    fileId: `random-${WEB_MSE_PROXY_STRATEGY}-${crypto.randomUUID()}`,
    mediaPartsLength: chunks.length,
    getMediaBuffers: async function* (): AsyncGenerator<AudioChunk> {
      for (let index = 0; index < chunks.length; index++) {
        yield {
          buffer: chunks[index] as Uint8Array,
          isLastChunk: index === chunks.length - 1,
        };
      }
    },
  };
}
