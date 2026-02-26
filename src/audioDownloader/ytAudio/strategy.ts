import { AudioDownloadType } from "@vot.js/core/types/yandex";
import { config } from "@vot.js/shared";

import type { GetAudioFromAPIOptions } from "../../types/audioDownloader";
import { GM_fetch } from "../../utils/gm";
import { makeFileId } from "../strategies/fileId";
import {
  type AudioChunkStreamResult,
  type AudioStreamRequest,
  AudioDownloader as YtAudioDownloader,
} from "./index";

const DEFAULT_YT_AUDIO_QUALITY = "bestefficiency";
const DEFAULT_FETCH_TIMEOUT_MS = 30_000;

type YtAudioDownloaderLike = {
  downloadAudioToUint8Array: (
    request: AudioStreamRequest,
  ) => Promise<{ bytes: Uint8Array }>;
  downloadAudioToChunkStream?: (
    request: AudioStreamRequest,
    options: { chunkSize: number },
  ) => Promise<AudioChunkStreamResult>;
};

type YtAudioStrategyDeps = {
  chunkSize?: number;
  fetchTimeoutMs?: number;
  createDownloader?: (
    fetchImplementation: typeof fetch,
  ) => YtAudioDownloaderLike;
};

function assertValidChunkSize(chunkSize: number): void {
  if (chunkSize <= 0) {
    throw new RangeError("Audio downloader. ytAudio. chunkSize must be > 0");
  }
}

function splitAudioIntoChunks(
  bytes: Uint8Array,
  chunkSize: number,
): Uint8Array[] {
  if (bytes.byteLength <= chunkSize) {
    return [bytes];
  }

  const chunks: Uint8Array[] = [];
  for (let start = 0; start < bytes.byteLength; start += chunkSize) {
    chunks.push(
      bytes.subarray(start, Math.min(start + chunkSize, bytes.length)),
    );
  }

  return chunks;
}

function createYtAudioFetch({
  signal,
  timeoutMs,
}: {
  signal: AbortSignal;
  timeoutMs: number;
}): typeof fetch {
  return async (input, init = {}) =>
    await GM_fetch(input, {
      ...init,
      signal: init.signal ?? signal,
      forceGmXhr: true,
      timeout: timeoutMs,
    });
}

export async function getAudioFromYtAudio(
  { videoId, signal }: GetAudioFromAPIOptions,
  deps: YtAudioStrategyDeps = {},
) {
  const chunkSize = deps.chunkSize ?? config.minChunkSize;
  assertValidChunkSize(chunkSize);

  const fetchImplementation = createYtAudioFetch({
    signal,
    timeoutMs: deps.fetchTimeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS,
  });
  const downloader =
    deps.createDownloader?.(fetchImplementation) ??
    new YtAudioDownloader({ fetchImplementation });

  const streamingDownload =
    typeof downloader.downloadAudioToChunkStream === "function"
      ? downloader.downloadAudioToChunkStream.bind(downloader)
      : undefined;
  if (typeof streamingDownload === "function") {
    try {
      const streamResult = await streamingDownload(
        {
          videoId,
          videoQuality: DEFAULT_YT_AUDIO_QUALITY,
          signal,
        },
        { chunkSize },
      );

      return {
        fileId: makeFileId(
          AudioDownloadType.WEB_API_STEAL_SIG_AND_N,
          streamResult.itag,
          String(streamResult.fileSize),
          chunkSize,
        ),
        mediaPartsLength: streamResult.mediaPartsLength,
        getMediaBuffers: streamResult.getMediaBuffers,
      };
    } catch (error) {
      console.warn(
        "[VOT] ytAudio streaming mode failed, falling back to buffered mode",
        error,
      );
    }
  }

  const result = await downloader.downloadAudioToUint8Array({
    videoId,
    videoQuality: DEFAULT_YT_AUDIO_QUALITY,
    signal,
  });

  const bytes = result.bytes;
  if (!bytes || bytes.byteLength === 0) {
    throw new Error("Audio downloader. ytAudio. Empty audio");
  }

  const chunks = splitAudioIntoChunks(bytes, chunkSize);
  if (!chunks.length) {
    throw new Error("Audio downloader. ytAudio. Can not split audio");
  }

  const fileId = makeFileId(
    AudioDownloadType.WEB_API_STEAL_SIG_AND_N,
    0,
    String(bytes.byteLength),
    chunkSize,
  );

  return {
    fileId,
    mediaPartsLength: chunks.length,
    async *getMediaBuffers(): AsyncGenerator<Uint8Array> {
      for (const chunk of chunks) {
        yield chunk;
      }
    },
  };
}
