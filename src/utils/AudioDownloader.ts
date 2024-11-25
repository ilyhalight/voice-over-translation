import { AudioDownloadType } from "@vot.js/core/types/yandex";

import {
  AdaptiveFormat,
  AudioAdaptiveFormat,
  AudioTrack,
  AudioTrackPlaceholder,
  BaseAdaptiveFormatWithUrl,
} from "../types/youtube";
import debug from "./debug";
import youtubeUtils from "./youtubeUtils";
import { config } from "@vot.js/shared";
import {
  AudioObject,
  ChunkRange,
  fetchAudioWithMetaOpts,
} from "../types/AudioDownloader";
import { GM_fetch } from "./utils";

const desktopAudioItag = 251;
const signatureCipherKeys = ["sp", "s", "url"];
const MIN_CONTENT_LENGTH_MULTIPLAIER = 0.9;
const CHUNK_STEPS = [6e4, 8e4, 15e4, 33e4, 46e4];
const ACCEPTABLE_REQUEST_AND_RESPONSE_LENGTHS_DIFF = 0.9;
const MIN_ARRAY_BUFFER_LENGTH = 15e3;

export class YouTubeAudioDownloader {
  minChunkSize: number;
  nr = 1;

  constructor({ minChunkSize = config.minChunkSize } = {}) {
    this.minChunkSize = minChunkSize;
  }

  isSignatureCipherKey(key: string) {
    return signatureCipherKeys.includes(key);
  }

  getAudioAdaptiveFormat() {
    const playerResponse = youtubeUtils.getPlayerResponse();
    if (!playerResponse) {
      return;
    }

    const {
      streamingData: { adaptiveFormats },
    } = playerResponse;
    const formatsWithItag = adaptiveFormats.filter(
      (format) => format.itag === desktopAudioItag,
    );
    debug.log("formatsWithItag", formatsWithItag);
    if (formatsWithItag.length < 2) {
      return adaptiveFormats[0];
    }

    const hasAudioTrack = formatsWithItag.some((format) =>
      Object.hasOwn(format, "audioTrack"),
    );
    debug.log("hasAudioTrack", hasAudioTrack);
    if (!hasAudioTrack) {
      return formatsWithItag[0];
    }

    const {
      captions: {
        playerCaptionsTracklistRenderer: {
          audioTracks,
          defaultAudioTrackIndex,
        },
      },
    } = playerResponse;
    const hasMultiTracks = audioTracks.some(
      (track: AudioTrack | AudioTrackPlaceholder) =>
        Object.hasOwn(track, "hasDefaultTrack"),
    );
    debug.log("hasMultiTracks", hasMultiTracks);
    if (!hasMultiTracks) {
      return formatsWithItag[0];
    }

    const defaultAudioTrack = audioTracks?.[defaultAudioTrackIndex];
    debug.log("defaultAudioTrack", defaultAudioTrack);
    if (!defaultAudioTrack) {
      return formatsWithItag[0];
    }

    return (
      (formatsWithItag as AudioAdaptiveFormat[]).find(
        (format) =>
          format.audioTrack?.id ===
          (defaultAudioTrack as AudioTrack).audioTrackId,
      ) ?? formatsWithItag[0]
    );
  }

  makeFileId(fileSize: string) {
    return JSON.stringify({
      downloadType:
        AudioDownloadType.WEB_API_GET_ALL_GENERATING_URLS_DATA_FROM_IFRAME,
      itag: desktopAudioItag,
      minChunkSize: this.minChunkSize,
      fileSize,
    });
  }

  getContentLength(adaptiveFormat: AdaptiveFormat) {
    const { contentLength } = adaptiveFormat;
    const numericContentLength = parseInt(contentLength);
    if (!Number.isFinite(numericContentLength)) {
      throw new Error("Content length number isn't finite");
    }

    return numericContentLength;
  }

  fetchLocationOriginText = async () => {
    let response, textContent;
    try {
      response = await GM_fetch(location.origin);
      textContent = await response.text();
    } catch (err) {
      throw new Error(
        `Can't get text from ${location.origin}, because ${
          (err as Error).message
        }`,
      );
    }
    return textContent;
  };

  getUrlFromAdaptiveFormat(adaptiveFormat: AudioAdaptiveFormat) {
    const { url } = adaptiveFormat as BaseAdaptiveFormatWithUrl;
    if (typeof url === "string" && url) {
      return url;
    }

    // decryptSignatureCipher...
    console.error("[VOT] SignatureCipher not supported yet");
    return undefined;
  }

  calcChunkRangesParts(contentLength: number) {
    if (contentLength < 1) {
      throw new Error("Content length can't be less than 1");
    }

    const minimumChunkSize = Math.round(
      contentLength * MIN_CONTENT_LENGTH_MULTIPLAIER,
    );
    const chunkRanges = [];
    let currentChunk = [];
    let accumulatedSize = 0;
    let stepIndex = 0;
    let start = 0;
    let end = Math.min(CHUNK_STEPS[stepIndex], contentLength);

    while (end < contentLength) {
      const mustExist = end < minimumChunkSize;
      currentChunk.push({
        start,
        end,
        mustExist,
      });
      accumulatedSize += end - start;
      if (accumulatedSize >= this.minChunkSize) {
        chunkRanges.push(currentChunk);
        currentChunk = [];
        accumulatedSize = 0;
      }
      if (stepIndex !== CHUNK_STEPS.length - 1) stepIndex++;
      start = end + 1;
      end += CHUNK_STEPS[stepIndex];
    }

    end = contentLength;
    currentChunk.push({
      start,
      end,
      mustExist: false,
    });
    chunkRanges.push(currentChunk);
    return chunkRanges;
  }

  calcChunkRanges(contentLength: number) {
    if (contentLength < 1) {
      throw new Error("Content length can't be less than 1");
    }

    const minimumChunkSize = Math.round(
      contentLength * MIN_CONTENT_LENGTH_MULTIPLAIER,
    );
    const chunkRanges = [];
    let stepIndex = 0;
    let start = 0;
    let end = Math.min(CHUNK_STEPS[stepIndex], contentLength);

    while (end < contentLength) {
      const mustExist = end < minimumChunkSize;
      chunkRanges.push({
        start: start,
        end: end,
        mustExist: mustExist,
      });
      if (stepIndex !== CHUNK_STEPS.length - 1) stepIndex++;
      start = end + 1;
      end += CHUNK_STEPS[stepIndex];
    }

    end = contentLength;
    chunkRanges.push({
      start: start,
      end: end,
      mustExist: false,
    });

    return chunkRanges;
  }

  mergeBuffers(buffers: ArrayBuffer[]) {
    const totalByteLength = buffers.reduce(
      (sum, buffer) => sum + buffer.byteLength,
      0,
    );
    const mergedArray = new Uint8Array(totalByteLength);
    let offset = 0;

    for (const buffer of buffers) {
      mergedArray.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }

    return mergedArray;
  }

  getChunkRanges(
    adaptiveFormat: AdaptiveFormat,
    isPartialMode: false,
  ): ChunkRange[];
  getChunkRanges(
    adaptiveFormat: AdaptiveFormat,
    isPartialMode: true,
  ): ChunkRange[][];
  getChunkRanges(
    adaptiveFormat: AdaptiveFormat,
    isPartialMode = false,
  ): ChunkRange[][] | ChunkRange[] {
    // 12044969
    const contentLength = this.getContentLength(adaptiveFormat);
    debug.log(
      `[getChunkRanges (isPartialMode: ${isPartialMode})] contentLength: ${contentLength}`,
    );
    const chunkRanges = isPartialMode
      ? this.calcChunkRangesParts(contentLength)
      : this.calcChunkRanges(contentLength);
    debug.log("[getChunkRanges] chunkRanges: ", chunkRanges);
    if (!chunkRanges.length) {
      throw new Error("Empty chunk ranges");
    }

    return chunkRanges;
  }

  async *getPartialAudioBuffers(
    audioAdaptiveFormat: AudioAdaptiveFormat,
    currentUrl: string,
    fetchOpts: Record<string, unknown> = {},
  ): AsyncGenerator<Uint8Array> {
    const chunkRangesParts = this.getChunkRanges(audioAdaptiveFormat, true);

    for (const chunkRange of chunkRangesParts) {
      const { audio, url, isAcceptableLast } =
        await this.fetchAudioWithMetaByChunkRanges(
          currentUrl,
          fetchOpts,
          chunkRange,
        );

      if (url) {
        currentUrl = url;
      }

      yield audio;

      if (isAcceptableLast) {
        break;
      }
    }
  }

  changeRangeAndNrInUrl(audioUrl: string, { start, end }: ChunkRange) {
    const url = new URL(audioUrl);
    url.searchParams.set("range", `${start}-${end}`);
    url.searchParams.set("nr", String(this.nr++));
    url.searchParams.delete("ump");
    return url.toString();
  }

  checkIsChunkLengthOk(buffer: ArrayBuffer, { start, end }: ChunkRange) {
    const rangeLength = end - start;
    if (
      rangeLength > MIN_ARRAY_BUFFER_LENGTH &&
      buffer.byteLength < MIN_ARRAY_BUFFER_LENGTH
    ) {
      return false;
    }

    return (
      Math.min(rangeLength, buffer.byteLength) /
        Math.max(rangeLength, buffer.byteLength) >
      ACCEPTABLE_REQUEST_AND_RESPONSE_LENGTHS_DIFF
    );
  }

  convertArrayBufferToString(buffer: ArrayBuffer) {
    return new TextDecoder("ascii").decode(buffer);
  }

  getUrlFromArrayBuffer(buffer: ArrayBuffer) {
    const urlMatch =
      this.convertArrayBufferToString(buffer).match(/https:\/\/.*$/);
    return urlMatch ? urlMatch[0] : null;
  }

  async fetchAudioWithMeta({
    audioUrl,
    chunkRange,
    fetchOpts,
    isUrlChanged = false,
  }: fetchAudioWithMetaOpts): Promise<AudioObject> {
    const updatedUrl = this.changeRangeAndNrInUrl(audioUrl, chunkRange);

    let response, audioBuffer;

    try {
      response = await GM_fetch(updatedUrl, fetchOpts);
    } catch (error) {
      throw new Error(
        `Can't fetch audio URL ${updatedUrl}, because: ${
          (error as Error).message
        }`,
      );
    }

    try {
      audioBuffer = await response.arrayBuffer();
    } catch (error) {
      throw new Error(
        `Can't get array buffer from audio URL ${updatedUrl}, because: ${
          (error as Error).message
        }`,
      );
    }

    debug.log(
      "[fetchAudioWithMeta] before checkIsChunkLengthOk",
      audioBuffer,
      chunkRange,
    );
    if (this.checkIsChunkLengthOk(audioBuffer, chunkRange)) {
      return {
        audio: audioBuffer,
        url: isUrlChanged ? audioUrl : null,
        isAcceptableLast: false,
      };
    }

    const redirectedUrl = this.getUrlFromArrayBuffer(audioBuffer);
    debug.log("[fetchAudioWithMeta] getUrlFromArrayBuffer", redirectedUrl);
    if (redirectedUrl) {
      return await this.fetchAudioWithMeta({
        audioUrl: redirectedUrl,
        chunkRange,
        fetchOpts,
        isUrlChanged: true,
      });
    }

    if (!chunkRange.mustExist) {
      return {
        audio: audioBuffer,
        url: null,
        isAcceptableLast: true,
      };
    }

    throw new Error(`Can't get redirected audio URL: ${updatedUrl}`);
  }

  async fetchAudioWithMetaByChunkRanges(
    audioUrl: string,
    fetchOpts: Record<string, unknown>,
    chunkRanges: ChunkRange[],
  ) {
    let currentUrl = audioUrl;
    const audioBuffers = [];
    let isAcceptableLast = false;
    for await (const chunkRange of chunkRanges) {
      const res = await this.fetchAudioWithMeta({
        audioUrl: currentUrl,
        chunkRange,
        fetchOpts,
      });

      debug.log(
        "[fetchAudioWithMetaByChunkRanges] fetchAudioWithMeta result",
        res,
      );

      if (res.url) {
        currentUrl = res.url;
      }

      audioBuffers.push(res.audio);
      isAcceptableLast = res.isAcceptableLast;
      if (isAcceptableLast) {
        break;
      }
    }

    return {
      audio: this.mergeBuffers(audioBuffers),
      url: currentUrl,
      isAcceptableLast,
    };
  }

  async *getAudioBuffers(
    audioAdaptiveFormat: AudioAdaptiveFormat,
    currentUrl: string,
    fetchOpts: Record<string, unknown> = {},
  ): AsyncGenerator<Uint8Array> {
    const chunkRanges = this.getChunkRanges(audioAdaptiveFormat, false);
    const { audio } = await this.fetchAudioWithMetaByChunkRanges(
      currentUrl,
      fetchOpts,
      chunkRanges,
    );

    yield audio;
  }

  async download(isPartialMode = false) {
    const audioAdaptiveFormat = this.getAudioAdaptiveFormat() as
      | (AudioAdaptiveFormat & BaseAdaptiveFormatWithUrl)
      | undefined;
    debug.log("[download] audioAdaptiveFormat", audioAdaptiveFormat);
    if (!audioAdaptiveFormat) {
      throw new Error("Failed to get audioAdaptiveFormat");
    }

    const audioUrl = this.getUrlFromAdaptiveFormat(audioAdaptiveFormat);
    if (!audioUrl) {
      throw new Error("Failed to get audioUrl");
    }

    const fileId = this.makeFileId(audioAdaptiveFormat.contentLength);
    debug.log("[download] audioAdaptiveFormat", audioAdaptiveFormat);
    return {
      fileId,
      audioPartsLength: isPartialMode
        ? this.getChunkRanges(audioAdaptiveFormat, true).length
        : 1,
      getAudioBuffers: async function* (this: YouTubeAudioDownloader) {
        yield* isPartialMode
          ? this.getPartialAudioBuffers(audioAdaptiveFormat, audioUrl)
          : this.getAudioBuffers(audioAdaptiveFormat, audioUrl);
      }.bind(this),
    };
  }
}
