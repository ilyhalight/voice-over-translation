import { AudioDownloadType } from "@vot.js/core/types/yandex";
import {
  ChunkRange,
  DownloadAudioDataIframeResponsePayload,
  FetchMediaWithMetaByChunkRangesResult,
  FetchMediaWithMetaOptions,
  FetchMediaWithMetaResult,
  GetAudioFromAPIOptions,
  VideoIdPayload,
} from "../../../types/audioDownloader";
import debug from "../../../utils/debug";
import { GM_fetch } from "../../../utils/gm";
import { requestDataFromMainWorld } from "../../../utils/iframeConnector";
import { timeout } from "../../../utils/utils";
import {
  deserializeRequestInit,
  getRequestUrl,
  serializeRequestInit,
  serializeResponse,
} from "../../shared";
import {
  getChunkRangesFromAdaptiveFormat,
  getChunkRangesPartsFromAdaptiveFormat,
  makeFileId,
  mergeBuffers,
} from "../utils";
import {
  CANT_FETCH_MEDIA_MESSAGE,
  CANT_GET_ARRAY_BUFFER_MESSAGE,
  GET_AUDIO_DATA_ERROR_MESSAGE,
  INCORRECT_FETCH_MEDIA_MESSAGE,
} from "./consts";
import {
  getUrlFromArrayBuffer,
  isChunkLengthAcceptable,
  patchMediaUrl,
} from "./helpers";

const STRATEGY_TYPE =
  AudioDownloadType.WEB_API_GET_ALL_GENERATING_URLS_DATA_FROM_IFRAME;

const getDownloadAudioDataInMainWorld = (payload: VideoIdPayload) =>
  requestDataFromMainWorld<
    VideoIdPayload,
    DownloadAudioDataIframeResponsePayload
  >("get-download-audio-data-in-main-world", payload);

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

  debug.log(
    "isChunkLengthAcceptable",
    isChunkLengthAcceptable(arrayBuffer, chunkRange),
    arrayBuffer.byteLength,
    chunkRange,
  );
  if (isChunkLengthAcceptable(arrayBuffer, chunkRange)) {
    return {
      media: arrayBuffer,
      url: isUrlChanged ? mediaUrl : null,
      isAcceptableLast: false,
    };
  }

  const redirectedUrl = getUrlFromArrayBuffer(arrayBuffer);
  debug.log("redirectedUrl", redirectedUrl);
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

export async function fetchMediaWithMetaByChunkRanges(
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

export async function getAudioFromWebApiWithReplacedFetch({
  videoId,
  returnByParts = false,
  signal,
}: GetAudioFromAPIOptions) {
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
    fileId: makeFileId(STRATEGY_TYPE, itag, adaptiveFormat.contentLength),
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
        const chunkRanges = getChunkRangesFromAdaptiveFormat(adaptiveFormat);
        const { media } = await fetchMediaWithMetaByChunkRanges(
          mediaUrl,
          finalRequestInit,
          chunkRanges,
          signal,
        );
        yield media;
      }
    },
  };
}
