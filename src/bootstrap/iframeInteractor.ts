type IframeConfig = {
  targetOrigin: string;
  dataFilter: (data: unknown) => boolean;
  extractVideoId: (url: URL) => string | null;
  responseFormatter: (videoId: string, data: unknown) => unknown;
};

let iframeInteractorInitialized = false;

const IFRAME_CONFIGS: Record<string, IframeConfig> = {
  "https://dev.epicgames.com": {
    targetOrigin: "https://dev.epicgames.com",
    dataFilter: (data: unknown) =>
      typeof data === "string" && data.startsWith("getVideoId:"),
    extractVideoId: (url: URL) => url.pathname.split("/").at(-2) ?? null,
    responseFormatter: (videoId: string, data: unknown) =>
      `${typeof data === "string" ? data : ""}:${videoId}`,
  },
  "https://www.dailymotion.com": {
    targetOrigin: "https://geo.dailymotion.com",
    dataFilter: (data: unknown) =>
      typeof data === "string" && data.startsWith("getVideoId:"),
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

  const currentConfig = IFRAME_CONFIGS[globalThis.location.origin];
  if (!currentConfig) return;

  globalThis.addEventListener("message", (event) => {
    try {
      if (event.origin !== currentConfig.targetOrigin) return;
      if (!currentConfig.dataFilter(event.data)) return;

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
      console.error("Iframe communication error:", error);
    }
  });
}
