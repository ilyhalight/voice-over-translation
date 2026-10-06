import {
  findJsonValueEnd,
  getConfigValue,
  getPlayerUrl,
  isDrcAudioFormat,
  solveYouTubeChallenges,
  validPageValue,
  type WebAbrWindow,
  type WebEmbeddedFormat,
  type WebEmbeddedPlayerResponse,
  type YouTubeConfig,
} from "./webAbr";

import { getTopPageWindow } from "./youtubePage";

export { getTopPageWindow } from "./youtubePage";

function readInitialPlayerResponseFromDocument(
  targetWindow: WebAbrWindow,
): WebEmbeddedPlayerResponse | undefined {
  let scripts: HTMLScriptElement[] = [];
  try {
    const pageWindow = getTopPageWindow(targetWindow);
    scripts = [
      ...pageWindow.document.querySelectorAll<HTMLScriptElement>(
        "script:not([src])",
      ),
    ];
  } catch {
    return undefined;
  }

  const markers = [
    "ytInitialPlayerResponse =",
    "ytInitialPlayerResponse=",
    'window["ytInitialPlayerResponse"] =',
    "window['ytInitialPlayerResponse'] =",
  ];

  for (const script of scripts) {
    const source = script.textContent ?? "";
    if (!source.includes("ytInitialPlayerResponse")) continue;

    for (const marker of markers) {
      let cursor = 0;
      while (cursor < source.length) {
        const markerIndex = source.indexOf(marker, cursor);
        if (markerIndex < 0) break;
        let start = markerIndex + marker.length;
        while (start < source.length && /\s/.test(source[start] ?? "")) start++;
        if (source[start] !== "{") {
          cursor = start + 1;
          continue;
        }
        const end = findJsonValueEnd(source, start);
        if (end < 0) break;
        try {
          const value = JSON.parse(
            source.slice(start, end),
          ) as WebEmbeddedPlayerResponse;
          if (value && typeof value === "object") return value;
        } catch {
          // Keep looking: pages can contain stale/non-JSON occurrences too.
        }
        cursor = end;
      }
    }
  }

  return undefined;
}

export function getNativePlayerResponse(
  targetWindow: WebAbrWindow,
  videoId: string,
): WebEmbeddedPlayerResponse | undefined {
  const candidates: WebEmbeddedPlayerResponse[] = [];
  try {
    const pageWindow = getTopPageWindow(targetWindow);
    const moviePlayer = pageWindow.document.querySelector("#movie_player") as
      | (HTMLElement & { getPlayerResponse?: () => unknown })
      | null;
    if (moviePlayer && typeof moviePlayer.getPlayerResponse === "function") {
      candidates.push(
        moviePlayer.getPlayerResponse() as WebEmbeddedPlayerResponse,
      );
    }
  } catch {}

  try {
    if (targetWindow.ytInitialPlayerResponse) {
      candidates.push(targetWindow.ytInitialPlayerResponse);
    }
  } catch {}

  const documentResponse = readInitialPlayerResponseFromDocument(targetWindow);
  if (documentResponse) candidates.push(documentResponse);

  for (const value of candidates) {
    const responseVideoId = value.videoDetails?.videoId;
    if (responseVideoId && responseVideoId !== videoId) continue;
    if (
      value.streamingData?.serverAbrStreamingUrl &&
      value.playerConfig?.mediaCommonConfig?.mediaUstreamerRequestConfig
        ?.videoPlaybackUstreamerConfig &&
      value.streamingData?.adaptiveFormats?.length
    ) {
      return value;
    }
  }
}

export function selectEconomyAudioFormat(
  formats: WebEmbeddedFormat[],
): WebEmbeddedFormat | undefined {
  const audioOnly = formats.filter(
    (format) =>
      typeof format.itag === "number" &&
      format.mimeType?.includes("audio/") &&
      !format.mimeType?.includes("video/"),
  );
  const nonDrc = audioOnly.filter((format) => !isDrcAudioFormat(format));
  const candidates = nonDrc.length > 0 ? nonDrc : audioOnly;
  const contentLength = (format: WebEmbeddedFormat) => {
    const value = Number(format.contentLength);
    return Number.isFinite(value) && value > 0
      ? value
      : Number.POSITIVE_INFINITY;
  };
  const bitrate = (format: WebEmbeddedFormat) => {
    const value = Number(format.averageBitrate ?? format.bitrate);
    return Number.isFinite(value) && value > 0
      ? value
      : Number.POSITIVE_INFINITY;
  };
  return [...candidates].sort((a, b) => {
    const sizeDiff = contentLength(a) - contentLength(b);
    if (Number.isFinite(sizeDiff) && sizeDiff !== 0) return sizeDiff;
    const bitrateDiff = bitrate(a) - bitrate(b);
    if (Number.isFinite(bitrateDiff) && bitrateDiff !== 0) return bitrateDiff;
    return (
      (a.itag ?? Number.MAX_SAFE_INTEGER) - (b.itag ?? Number.MAX_SAFE_INTEGER)
    );
  })[0];
}

const N_PATTERN = /^[A-Za-z0-9_-]{4,}$/;

export async function resolveSabrStreamingUrl(
  targetWindow: WebAbrWindow,
  rawUrl: string,
  config: YouTubeConfig,
  signal: AbortSignal,
): Promise<string> {
  signal.throwIfAborted();
  const url = new URL(rawUrl);
  const n = url.searchParams.get("n") ?? undefined;
  if (!n) return url.toString();

  const playerUrl = getPlayerUrl(config);
  if (!playerUrl) {
    throw new Error(
      "Audio downloader. YouTube player URL is unavailable for SABR n solve",
    );
  }
  const response = await targetWindow.fetch(playerUrl, { signal });
  if (!response.ok) {
    throw new Error(
      `Audio downloader. YouTube player request failed (${response.status})`,
    );
  }
  const code = await response.text();
  signal.throwIfAborted();
  const raw = solveYouTubeChallenges(targetWindow, code, undefined, n);
  const solvedN = validPageValue(raw.n, n, N_PATTERN);
  if (!solvedN) {
    throw new Error("Audio downloader. SABR n challenge solve invalid");
  }
  url.searchParams.set("n", solvedN);
  return url.toString();
}

function buildContentPlaybackContext(
  signatureTimestamp: unknown,
): Record<string, unknown> {
  const context: Record<string, unknown> = {
    html5Preference: "HTML5_PREF_WANTS",
  };
  const timestamp = Number(signatureTimestamp);
  if (Number.isFinite(timestamp) && timestamp > 0) {
    context.signatureTimestamp = timestamp;
  }
  return context;
}

export function buildSabrPlayerRequest(
  config: YouTubeConfig,
  videoId: string,
  extractedSignatureTimestamp?: number,
): Record<string, unknown> {
  const rawContext = getConfigValue(config, "INNERTUBE_CONTEXT");
  if (!rawContext || typeof rawContext !== "object") {
    throw new Error("Audio downloader. web client context is unavailable");
  }

  const context = JSON.parse(JSON.stringify(rawContext)) as {
    client?: Record<string, unknown>;
    thirdParty?: Record<string, unknown>;
  };
  context.client ??= {};
  const client = context.client;
  client.clientName = "WEB";
  client.clientVersion =
    getConfigValue(config, "INNERTUBE_CLIENT_VERSION") ?? client.clientVersion;
  client.originalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  delete context.thirdParty;

  return {
    context,
    videoId,
    playbackContext: {
      contentPlaybackContext: buildContentPlaybackContext(
        extractedSignatureTimestamp ?? getConfigValue(config, "STS"),
      ),
    },
    contentCheckOk: true,
    racyCheckOk: true,
  };
}
