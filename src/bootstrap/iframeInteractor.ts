import { isIframe } from "#utils/iframeConnector.ts";
import logger from "#utils/logger.ts";

type IframeConfig = {
  targetOrigin: string;
  extractVideoId: (url: URL) => string | null;
  responseFormatter: (videoId: string, data: string) => string;
};

let iframeInteractorInitialized = false;

const IFRAME_CONFIGS: Record<string, IframeConfig> = {
  "https://dev.epicgames.com": {
    targetOrigin: "https://dev.epicgames.com",
    extractVideoId: (url: URL) => url.pathname.split("/").at(-2) ?? null,
    responseFormatter: (videoId: string, data: string) => `${data}:${videoId}`,
  },
  "https://www.dailymotion.com": {
    targetOrigin: "https://geo.dailymotion.com",
    extractVideoId: (url: URL) =>
      /(?:^|\/)video\/([^/]+)/.exec(url.pathname)?.[1] ?? null,
    responseFormatter: (videoId: string) => `getVideoId:${videoId}`,
  },
};

export function initIframeInteractor(): void {
  if (iframeInteractorInitialized) {
    return;
  }
  iframeInteractorInitialized = true;

  const origin = globalThis.location.origin;
  if (isIframe() && origin.endsWith(".boomio-cdn.com")) {
    // get raw mp4 link for rule34video (bypass ddos-guard to access video on server)
    globalThis.top?.postMessage(`getVideoId:${globalThis.location.href}`, "*");
    return;
  }

  const currentConfig = IFRAME_CONFIGS[origin];
  if (!currentConfig) return;

  globalThis.addEventListener("message", (event) => {
    try {
      if (event.origin !== currentConfig.targetOrigin) return;
      if (
        typeof event.data !== "string" ||
        !event.data.startsWith("getVideoId:")
      ) {
        return;
      }

      const videoId = currentConfig.extractVideoId(
        new URL(globalThis.location.href),
      );
      if (!videoId) return;

      const response = currentConfig.responseFormatter(videoId, event.data);

      (event.source as Window | null)?.postMessage(
        response,
        currentConfig.targetOrigin,
      );
    } catch (error) {
      logger.error("Iframe communication error:", error);
    }
  });
}
