import type { VideoIdPayload } from "../types/audioDownloader";
import type { MessagePayload } from "../types/iframeConnector";
import debug from "../utils/debug";
import { initIframeService } from "../utils/iframeConnector";
import { IFRAME_SERVICE } from "./shared";

import { getDownloadAudioData } from "./strategies/webApiGetAllGeneratingUrlsData/iframe";

const handleIframeMessage = async ({ data }: MessageEvent<MessagePayload>) => {
  if (data?.messageDirection !== "request") {
    return;
  }

  try {
    if (data.messageType === "get-download-audio-data-in-iframe") {
      await getDownloadAudioData(
        data.payload as MessagePayload<VideoIdPayload>,
      );
    } else {
      debug.log(`NOT IMPLEMENTED: ${data.messageType}`, data.payload);
    }
  } catch (error) {
    console.error("[VOT] Main world bridge", {
      error,
    });
  }
};

export function initAudioDownloaderIframe() {
  return initIframeService(IFRAME_SERVICE, handleIframeMessage);
}
