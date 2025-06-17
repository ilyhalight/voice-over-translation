import { VideoIdPayload } from "../types/audioDownloader";
import { MessagePayload } from "../types/iframeConnector";
import debug from "../utils/debug";
import { initIframeService } from "../utils/iframeConnector";
import { IFRAME_SERVICE } from "./shared";

import { getDownloadAudioData } from "./strategies/webApiGetAllGeneratingUrlsData/iframe";

const handleIframeMessage = async ({ data }: MessageEvent<MessagePayload>) => {
  if (data?.messageDirection !== "request") {
    return;
  }

  try {
    switch (data.messageType) {
      case "get-download-audio-data-in-iframe":
        await getDownloadAudioData(
          data.payload as MessagePayload<VideoIdPayload>,
        );
        break;
      default:
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
