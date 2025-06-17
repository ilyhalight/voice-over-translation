import YoutubeHelper from "@vot.js/ext/helpers/youtube";
import {
  AudioAdaptiveFormat,
  PlayerElement,
} from "@vot.js/ext/types/helpers/youtube";
import { VideoIdPayload } from "../../../types/audioDownloader";
import { MessagePayload } from "../../../types/iframeConnector";
import debug from "../../../utils/debug";
import { waitForCondition } from "../../../utils/utils";
import { getRequestUrl, serializeRequestInit } from "../../shared";

let lastMessageId = "";

const getAdaptiveFormats = () =>
  YoutubeHelper.getPlayerResponse()?.streamingData?.adaptiveFormats;

async function isEncodedRequest(url: string, request: RequestInfo) {
  if (
    !url.includes("googlevideo.com/videoplayback") ||
    typeof request === "string"
  ) {
    return false;
  }

  try {
    const reader = request.clone().body?.getReader();
    if (!reader) {
      return false;
    }

    let totalLength = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      totalLength += value.length;
      if (totalLength > 2) {
        return true;
      }
    }
  } catch {}

  return false;
}

function selectBestAudioFormat() {
  const allFormats = getAdaptiveFormats();
  if (!allFormats?.length) {
    const reason = !allFormats
      ? "Cannot get adaptive formats"
      : "Empty adaptive formats";
    throw new Error(`Audio downloader. WEB API. ${reason}`);
  }

  const audioFormats = (allFormats as AudioAdaptiveFormat[]).filter(
    ({ audioQuality, mimeType }) => audioQuality || mimeType?.includes("audio"),
  );
  if (!audioFormats.length) {
    throw new Error("Audio downloader. WEB API. No audio adaptive formats");
  }

  const itag251Sorted = audioFormats
    .filter(({ itag }) => itag === 251)
    .sort(({ contentLength: a }, { contentLength: b }) =>
      a && b ? Number.parseInt(a) - Number.parseInt(b) : -1,
    );

  return itag251Sorted.at(-1) ?? audioFormats[0];
}

const waitForPlayer = async (): Promise<PlayerElement | null> => {
  await waitForCondition(() => Boolean(YoutubeHelper.getPlayer()), 10_000);
  return YoutubeHelper.getPlayer();
};

const loadVideo = async (data: MessagePayload<VideoIdPayload>) => {
  const player = await waitForPlayer();
  if (data.messageId !== lastMessageId) {
    throw new Error(
      "Audio downloader. Download started for another video while getting player",
    );
  }
  if (!player?.loadVideoById) {
    throw new Error(
      "Audio downloader. There is no player.loadVideoById in iframe",
    );
  }
  player.loadVideoById(data.payload.videoId);
  player.pauseVideo?.();
  player.mute?.();

  setTimeout(() => {
    if (data.messageId !== lastMessageId) {
      console.error(
        "Audio Downloader. Download started for another video while waiting to repause video",
      );
      return;
    }

    if (!player) {
      console.error(
        "[Critical] Audio Downloader. Player not found in iframe after timeout",
      );
      return;
    }

    player.pauseVideo?.();
  }, 1000);
};

export async function getDownloadAudioData(
  data: MessagePayload<VideoIdPayload>,
) {
  try {
    lastMessageId = data.messageId;
    debug.log("getDownloadAudioData", data);
    const originalFetch = unsafeWindow.fetch;

    unsafeWindow.fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      if (input instanceof URL) {
        input = input.toString();
      }

      const requestUrl = getRequestUrl(input);
      if (await isEncodedRequest(requestUrl, input)) {
        window.parent.postMessage(
          {
            ...data,
            messageDirection: "response",
            error: "Audio downloader. Detected encoded request.",
          },
          "*",
        );
        unsafeWindow.fetch = originalFetch;
        return originalFetch(input, init);
      }

      const response = await originalFetch(input, init);
      if (data.messageId !== lastMessageId) {
        unsafeWindow.fetch = originalFetch;
        return response;
      }

      if (requestUrl.includes("&itag=251&")) {
        unsafeWindow.fetch = originalFetch;
        window.parent.postMessage(
          {
            ...data,
            messageDirection: "response",
            payload: {
              requestInfo: requestUrl,
              requestInit: init || serializeRequestInit(input),
              adaptiveFormat: selectBestAudioFormat(),
              itag: 251,
            },
          },
          "*",
        );
      }

      return response;
    };

    await loadVideo(data);
  } catch (error) {
    window.parent.postMessage(
      {
        ...data,
        messageDirection: "response",
        error,
      },
      "*",
    );
  }
}
