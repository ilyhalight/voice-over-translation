type IframeConfig = {
  targetOrigin: string;
  dataFilter: (data: unknown) => boolean;
  extractVideoId: (url: URL) => string | null;
  responseFormatter: (videoId: string, data: unknown) => unknown;
};

export function initIframeInteractor(): void {
  const configs: Record<string, IframeConfig> = {
    "https://www.dailymotion.com": {
      targetOrigin: "https://geo.dailymotion.com",
      dataFilter: (data: unknown) =>
        typeof data === "object" &&
        data !== null &&
        "type" in data &&
        (data as { type?: unknown }).type === "getDailymotionVideoId",
      extractVideoId: (url: URL) => {
        const match = /\/video\/(\w+)/.exec(url.pathname);
        return match?.[1] ?? null;
      },
      responseFormatter: (videoId: string) => ({
        type: "dailymotionVideoId",
        videoId,
      }),
    },
    "https://dev.epicgames.com": {
      targetOrigin: "https://dev.epicgames.com",
      dataFilter: (data: unknown) =>
        typeof data === "string" && data.startsWith("getVideoId:"),
      extractVideoId: (url: URL) => url.pathname.split("/").at(-2) ?? null,
      responseFormatter: (videoId: string, data: unknown) =>
        `${typeof data === "string" ? data : ""}:${videoId}`,
    },
  };

  const currentConfig = Object.entries(configs).find(
    ([origin]) =>
      globalThis.location.origin === origin &&
      (origin !== "https://dev.epicgames.com" ||
        globalThis.location.pathname.includes("/community/learning/")),
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
