import { AudioDownloadType } from "@vot.js/core/types/yandex";
import { AdaptiveFormat } from "@vot.js/ext/types/helpers/youtube";
import { ChunkRange, VideoIdPayload } from "../../types/audioDownloader";
import { MessagePayload } from "../../types/iframeConnector";
import {
  ensureServiceIframe,
  generateMessageId,
  hasServiceIframe,
} from "../../utils/iframeConnector";
import {
  CHUNK_STEPS,
  IFRAME_HOST,
  IFRAME_ID,
  IFRAME_SERVICE,
  MIN_CHUNK_RANGES_PART_SIZE,
  MIN_CONTENT_LENGTH_MULTIPLIER,
} from "../shared";

let serviceIframe: HTMLIFrameElement | null = null;

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

export function getChunkRangesPartsFromAdaptiveFormat(format: AdaptiveFormat) {
  const contentLength = parseContentLength(format);
  const chunkParts = getChunkRangesPartsFromContentLength(contentLength);
  if (!chunkParts.length) {
    throw new Error("Audio downloader. WEB API. No chunk parts generated");
  }

  return chunkParts;
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

export function getChunkRangesFromAdaptiveFormat(
  adaptiveFormat: AdaptiveFormat,
): ChunkRange[] {
  const contentLength = parseContentLength(adaptiveFormat);
  const chunkRanges = getChunkRangesFromContentLength(contentLength);
  if (!chunkRanges.length) {
    throw new Error("Audio downloader. WEB API. Empty chunk ranges");
  }

  return chunkRanges;
}

export function mergeBuffers(buffers: ArrayBuffer[]): Uint8Array {
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

export async function sendRequestToIframe(
  messageType: string,
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
        messageType,
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

export function makeFileId(
  downloadType: AudioDownloadType,
  itag: number,
  fileSize: string,
) {
  return JSON.stringify({
    downloadType,
    itag,
    minChunkSize: MIN_CHUNK_RANGES_PART_SIZE,
    fileSize,
  });
}
