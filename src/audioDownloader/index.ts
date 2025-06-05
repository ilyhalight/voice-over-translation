import { AudioDownloadType } from "@vot.js/core/types/yandex";

import { AdaptiveFormat } from "@vot.js/ext/types/helpers/youtube";
import { EventImpl } from "../core/eventImpl";
import {
  AudioDownloadRequestOptions,
  ChunkRange,
  DownloadAudioDataIframeResponsePayload,
  DownloadedAudioData,
  DownloadedPartialAudioData,
  FetchMediaWithMetaByChunkRangesResult,
  FetchMediaWithMetaOptions,
  FetchMediaWithMetaResult,
  GetAudioFromAPIWithReplacedFetchOptions,
  VideoIdPayload,
} from "../types/audioDownloader";
import { MessagePayload } from "../types/iframeConnector";
import debug from "../utils/debug";
import { GM_fetch } from "../utils/gm";
import {
  ensureServiceIframe,
  generateMessageId,
  hasServiceIframe,
  requestDataFromMainWorld,
} from "../utils/iframeConnector";
import { timeout } from "../utils/utils";
import {
  ACCEPTABLE_LENGTH_DIFF,
  CHUNK_STEPS,
  IFRAME_HOST,
  IFRAME_ID,
  IFRAME_SERVICE,
  MIN_ARRAY_BUFFER_LENGTH,
  MIN_CHUNK_RANGES_PART_SIZE,
  MIN_CONTENT_LENGTH_MULTIPLIER,
  deserializeRequestInit,
  getRequestUrl,
  serializeRequestInit,
  serializeResponse,
} from "./shared";

let serviceIframe: HTMLIFrameElement | null = null;
let mediaQuaryIndex = 1;
const textDecoder = new TextDecoder("ascii");

async function sendAudioDownloadRequestToIframe(
  data: MessagePayload<VideoIdPayload>,
) {
  const { videoId } = data.payload;
  const iframeUrl = `https://${IFRAME_HOST}/embed/${videoId}?autoplay=0&mute=1`;

  try {
    const iframe = await ensureServiceIframe(
      serviceIframe,
      iframeUrl,
      IFRAME_ID,
      IFRAME_SERVICE,
    );
    if (!hasServiceIframe(IFRAME_ID)) {
      throw new Error("Audio downloader. WEB API. Service iframe deleted");
    }

    iframe.contentWindow?.postMessage(
      {
        messageId: generateMessageId(),
        messageType: "get-download-audio-data-in-iframe",
        messageDirection: "request",
        payload: data,
        error: data.error,
      },
      "*",
    );
  } catch (err) {
    data.error = err;
    data.messageDirection = "response";
    window.postMessage(data, "*");
  }
}

const getDownloadAudioDataInMainWorld = (payload: VideoIdPayload) =>
  requestDataFromMainWorld<
    VideoIdPayload,
    DownloadAudioDataIframeResponsePayload
  >("get-download-audio-data-in-main-world", payload);

const GET_AUDIO_DATA_ERROR_MESSAGE =
  "Audio downloader. WEB API. Can not get getGeneratingAudioUrlsDataFromIframe due to timeout";

async function getGeneratingAudioUrlsDataFromIframe(
  videoId: string,
): Promise<DownloadAudioDataIframeResponsePayload> {
  try {
    return await Promise.race([
      getDownloadAudioDataInMainWorld({ videoId }),
      timeout(20000, GET_AUDIO_DATA_ERROR_MESSAGE),
    ]);
  } catch (err) {
    const isTimeout =
      err instanceof Error && err.message === GET_AUDIO_DATA_ERROR_MESSAGE;

    debug.log("getGeneratingAudioUrlsDataFromIframe error", err);
    throw new Error(
      isTimeout
        ? GET_AUDIO_DATA_ERROR_MESSAGE
        : "Audio downloader. WEB API. Failed to get audio data",
    );
  }
}

function makeFileId(itag: number, fileSize: string) {
  return JSON.stringify({
    downloadType:
      AudioDownloadType.WEB_API_GET_ALL_GENERATING_URLS_DATA_FROM_IFRAME,
    itag,
    minChunkSize: MIN_CHUNK_RANGES_PART_SIZE,
    fileSize,
  });
}

function parseContentLength({ contentLength }: AdaptiveFormat): number {
  if (typeof contentLength !== "string") {
    throw new Error(
      `Audio downloader. WEB API. Content length (${contentLength}) is not a string`,
    );
  }

  const parsed = Number.parseInt(contentLength);
  if (!Number.isFinite(parsed)) {
    throw new Error(
      `Audio downloader. WEB API. Parsed content length is not finite (${parsed})`,
    );
  }

  return parsed;
}

function getChunkRangesPartsFromContentLength(
  contentLength: number,
): ChunkRange[][] {
  if (contentLength < 1) {
    throw new Error(
      "Audio downloader. WEB API. contentLength must be at least 1",
    );
  }

  const minChunkSize = Math.round(
    contentLength * MIN_CONTENT_LENGTH_MULTIPLIER,
  );
  const parts = [];
  let currentPart = [];
  let currentPartSize = 0;
  let stepIndex = 0;
  let start = 0;
  let end = Math.min(CHUNK_STEPS[stepIndex], contentLength);
  while (end < contentLength) {
    const mustExist = end < minChunkSize;
    currentPart.push({ start, end, mustExist });
    currentPartSize += end - start;
    if (currentPartSize >= MIN_CHUNK_RANGES_PART_SIZE) {
      parts.push(currentPart);
      currentPart = [];
      currentPartSize = 0;
    }

    if (stepIndex < CHUNK_STEPS.length - 1) {
      stepIndex++;
    }

    start = end + 1;
    end += CHUNK_STEPS[stepIndex];
  }

  end = contentLength;
  currentPart.push({ start, end, mustExist: false });
  parts.push(currentPart);
  return parts;
}

function getChunkRangesFromContentLength(contentLength: number): ChunkRange[] {
  if (contentLength < 1) {
    throw new Error(
      "Audio downloader. WEB API. contentLength cannot be less than 1",
    );
  }

  const minChunkSize = Math.round(
    contentLength * MIN_CONTENT_LENGTH_MULTIPLIER,
  );
  const chunkRanges: ChunkRange[] = [];
  let stepIndex = 0;
  let start = 0;
  let end = Math.min(CHUNK_STEPS[stepIndex], contentLength);
  while (end < contentLength) {
    const mustExist = end < minChunkSize;
    chunkRanges.push({
      start,
      end: end,
      mustExist,
    });

    if (stepIndex !== CHUNK_STEPS.length - 1) {
      stepIndex++;
    }

    start = end + 1;
    end += CHUNK_STEPS[stepIndex];
  }

  chunkRanges.push({
    start,
    end: contentLength,
    mustExist: false,
  });

  return chunkRanges;
}

function getChunkRangesPartsFromAdaptiveFormat(format: AdaptiveFormat) {
  const contentLength = parseContentLength(format);
  const chunkParts = getChunkRangesPartsFromContentLength(contentLength);
  if (!chunkParts.length) {
    throw new Error("Audio downloader. WEB API. No chunk parts generated");
  }

  return chunkParts;
}

const INCORRECT_FETCH_MEDIA_MESSAGE =
  "Audio downloader. WEB API. Incorrect response on fetch media url";
const CANT_FETCH_MEDIA_MESSAGE =
  "Audio downloader. WEB API. Can not fetch media url";
const CANT_GET_ARRAY_BUFFER_MESSAGE =
  "Audio downloader. WEB API. Can not get array buffer from media url";

function isChunkLengthAcceptable(
  buffer: ArrayBuffer,
  { start, end }: ChunkRange,
) {
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
    ACCEPTABLE_LENGTH_DIFF
  );
}

function patchMediaUrl(
  url: string,
  { start, end }: { start: number; end: number },
) {
  const modifiedUrl = new URL(url);
  modifiedUrl.searchParams.set("range", `${start}-${end}`);
  modifiedUrl.searchParams.set("rn", String(mediaQuaryIndex++));
  modifiedUrl.searchParams.delete("ump");
  return modifiedUrl.toString();
}

const getUrlFromArrayBuffer = (buffer: ArrayBuffer): string | null => {
  const match = textDecoder.decode(buffer).match(/https:\/\/.*$/);
  return match?.[0] ?? null;
};

async function fetchMediaWithMeta({
  mediaUrl,
  chunkRange,
  requestInit,
  signal,
  isUrlChanged = false,
}: FetchMediaWithMetaOptions): Promise<FetchMediaWithMetaResult> {
  const patchedUrl = patchMediaUrl(mediaUrl, chunkRange);
  let response: Response;

  try {
    response = await GM_fetch(patchedUrl, {
      ...requestInit,
      signal,
    });

    if (!response.ok) {
      const errorDetails = serializeResponse(response);
      console.error(INCORRECT_FETCH_MEDIA_MESSAGE, errorDetails);
      throw new Error(INCORRECT_FETCH_MEDIA_MESSAGE);
    }
  } catch (err) {
    if (err instanceof Error && err.message === INCORRECT_FETCH_MEDIA_MESSAGE) {
      throw err;
    }

    console.error(CANT_FETCH_MEDIA_MESSAGE, {
      mediaUrl: patchedUrl,
      error: err,
    });

    throw new Error(CANT_FETCH_MEDIA_MESSAGE);
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await response.arrayBuffer();
  } catch (err) {
    console.error(CANT_GET_ARRAY_BUFFER_MESSAGE, {
      mediaUrl: patchedUrl,
      error: err,
    });
    throw new Error(CANT_GET_ARRAY_BUFFER_MESSAGE);
  }

  if (isChunkLengthAcceptable(arrayBuffer, chunkRange)) {
    return {
      media: arrayBuffer,
      url: isUrlChanged ? mediaUrl : null,
      isAcceptableLast: false,
    };
  }

  const redirectedUrl = getUrlFromArrayBuffer(arrayBuffer);
  if (redirectedUrl) {
    return fetchMediaWithMeta({
      mediaUrl: redirectedUrl,
      chunkRange,
      requestInit,
      signal,
      isUrlChanged: true,
    });
  }

  if (!chunkRange.mustExist) {
    return {
      media: arrayBuffer,
      url: null,
      isAcceptableLast: true,
    };
  }

  throw new Error(
    `Audio downloader. WEB API. Can not get redirected media url ${patchedUrl}`,
  );
}

function mergeBuffers(buffers: ArrayBuffer[]): Uint8Array {
  const totalLength = buffers.reduce(
    (total, buffer) => total + buffer.byteLength,
    0,
  );
  const merged = new Uint8Array(totalLength);
  let offset = 0;

  for (const buffer of buffers) {
    merged.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }

  return merged;
}

async function fetchMediaWithMetaByChunkRanges(
  mediaUrl: string,
  requestInit: RequestInit,
  chunkRanges: ChunkRange[],
  signal: AbortSignal,
): Promise<FetchMediaWithMetaByChunkRangesResult> {
  let currentUrl = mediaUrl;
  const mediaBuffers: ArrayBuffer[] = [];
  let isAcceptableLast = false;

  for (const chunkRange of chunkRanges) {
    const result = await fetchMediaWithMeta({
      mediaUrl: currentUrl,
      chunkRange,
      requestInit,
      signal,
    });

    if (result.url) {
      currentUrl = result.url;
    }

    mediaBuffers.push(result.media);
    isAcceptableLast = result.isAcceptableLast;

    if (isAcceptableLast) {
      break;
    }
  }

  return {
    media: mergeBuffers(mediaBuffers),
    url: currentUrl,
    isAcceptableLast,
  };
}

function getChunkRangesFromAdaptiveFormat(
  adaptiveFormat: AdaptiveFormat,
): ChunkRange[] {
  const contentLength = parseContentLength(adaptiveFormat);
  const chunkRanges = getChunkRangesFromContentLength(contentLength);
  if (!chunkRanges.length) {
    throw new Error("Audio downloader. WEB API. Empty chunk ranges");
  }

  return chunkRanges;
}

async function getAudioFromWebApiWithReplacedFetch({
  videoId,
  returnByParts = false,
  signal,
}: GetAudioFromAPIWithReplacedFetchOptions) {
  const { requestInit, requestInfo, adaptiveFormat, itag } =
    await getGeneratingAudioUrlsDataFromIframe(videoId);
  if (!requestInfo) {
    throw new Error("Audio downloader. WEB API. Can not get requestInfo");
  }

  let mediaUrl = getRequestUrl(requestInfo);
  const serializedInit = serializeRequestInit(requestInfo);
  const fallbackInit = deserializeRequestInit(serializedInit);
  const finalRequestInit = requestInit || fallbackInit;

  return {
    fileId: makeFileId(itag, adaptiveFormat.contentLength),
    mediaPartsLength: returnByParts
      ? getChunkRangesPartsFromAdaptiveFormat(adaptiveFormat).length
      : 1,
    async *getMediaBuffers(): AsyncGenerator<Uint8Array> {
      if (returnByParts) {
        const chunkParts =
          getChunkRangesPartsFromAdaptiveFormat(adaptiveFormat);
        for (const part of chunkParts) {
          const { media, url, isAcceptableLast } =
            await fetchMediaWithMetaByChunkRanges(
              mediaUrl,
              finalRequestInit,
              part,
              signal,
            );

          if (url) {
            mediaUrl = url;
          }

          yield media;
          if (isAcceptableLast) {
            break;
          }
        }
      } else {
        const fullRange = getChunkRangesFromAdaptiveFormat(adaptiveFormat);
        const { media } = await fetchMediaWithMetaByChunkRanges(
          mediaUrl,
          finalRequestInit,
          fullRange,
          signal,
        );
        yield media;
      }
    },
  };
}

async function handleCommonAudioDownloadRequest({
  audioDownloader,
  translationId,
  videoId,
  signal,
}: AudioDownloadRequestOptions) {
  const audioData = await getAudioFromWebApiWithReplacedFetch({
    videoId,
    returnByParts: true,
    signal,
  });
  if (!audioData) {
    throw new Error("Audio downloader. Can not get audio data");
  }
  debug.log("Audio downloader. Url found", {
    audioDownloadType: "web_api_get_all_generating_urls_data_from_iframe",
  });

  const { getMediaBuffers, mediaPartsLength, fileId } = audioData;
  if (mediaPartsLength < 2) {
    const { value }: { value: Uint8Array } = await getMediaBuffers().next();
    if (!value) {
      throw new Error("Audio downloader. Empty audio");
    }

    audioDownloader.onDownloadedAudio.dispatch(translationId, {
      videoId,
      fileId,
      audioData: value,
    });
    return;
  }

  let index = 0;
  for await (const audioChunk of getMediaBuffers()) {
    if (!audioChunk) {
      throw new Error("Audio downloader. Empty audio");
    }

    audioDownloader.onDownloadedPartialAudio.dispatch(translationId, {
      videoId,
      fileId,
      audioData: audioChunk,
      version: 1,
      index,
      amount: mediaPartsLength,
    });

    index++;
  }
}

export async function mainWorldMessageHandler({
  data,
}: MessageEvent<MessagePayload>) {
  try {
    if (data?.messageDirection !== "request") {
      return;
    }

    switch (data.messageType) {
      case "get-download-audio-data-in-main-world": {
        await sendAudioDownloadRequestToIframe(
          data as MessagePayload<VideoIdPayload>,
        );
        break;
      }
    }
  } catch (error) {
    console.error("[VOT] Main world bridge", {
      error,
    });
  }
}

export class AudioDownloader {
  onDownloadedAudio = new EventImpl();
  onDownloadedPartialAudio = new EventImpl();
  onDownloadAudioError = new EventImpl();

  async runAudioDownload(
    videoId: string,
    translationId: string,
    signal: AbortSignal,
  ) {
    window.addEventListener("message", mainWorldMessageHandler);
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
      console.error("Audio downloader. Failed to download audio", err);
      this.onDownloadAudioError.dispatch(videoId);
    }

    window.removeEventListener("message", mainWorldMessageHandler);
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
