type IframeConfig = {
  targetOrigin: string;
  dataFilter: (data: unknown) => boolean;
  extractVideoId: (url: URL) => string | null;
  responseFormatter: (videoId: string, data: unknown) => unknown;
};

export function initIframeInteractor(): void {
  const configs: Record<string, IframeConfig> = {
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
      extractVideoId: (url: URL) => {
        return /(?:^|\/)video\/([^/]+)/.exec(url.pathname)?.[1];
      },
      responseFormatter: (videoId: string) => `getVideoId:${videoId}`,
    },
  };

  const currentConfig = Object.entries(configs).find(
    ([origin]) => globalThis.location.origin === origin,
  )?.[1];

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

      if (event.source && "postMessage" in event.source) {
        (event.source as Window).postMessage(
          response,
          currentConfig.targetOrigin,
        );
      }
    } catch (error) {
      console.error("Iframe communication error:", error);
    }
  });
}
