import {
  getYouTubeAudioBitrate,
  getYouTubeAudioSize,
  type YouTubeAudioFormat,
} from "./strategies/youtubeAudioSelection";

type YoutubeAudioFormatLike = {
  languageCode?: unknown;
  language?: unknown;
  audioTrackId?: unknown;
  url?: unknown;
  signatureCipher?: unknown;
  audioTrack?: {
    id?: unknown;
    languageCode?: unknown;
    language?: unknown;
  };
};

export function normalizeAudioLanguageTag(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replaceAll("_", "-");
}

// Invalid candidates fall through to later metadata sources.
export function getYoutubeAudioFormatLanguage(
  format: YoutubeAudioFormatLike | null | undefined,
  isValid?: (tag: string) => boolean,
): string {
  const accept = (value: unknown): string | undefined => {
    const tag = normalizeAudioLanguageTag(value);
    if (!tag) return undefined;
    if (isValid && !isValid(tag)) return undefined;
    return tag;
  };

  const direct = accept(
    format?.languageCode ??
      format?.language ??
      format?.audioTrack?.languageCode ??
      format?.audioTrack?.language,
  );
  if (direct) return direct;

  const trackId = format?.audioTrack?.id ?? format?.audioTrackId;
  if (typeof trackId === "string" && trackId) {
    const idLanguage = accept(trackId.split(".")[0]);
    if (idLanguage) return idLanguage;
  }

  try {
    const cipher =
      typeof format?.signatureCipher === "string"
        ? new URLSearchParams(format.signatureCipher)
        : undefined;
    const rawUrl = format?.url ?? cipher?.get("url");
    if (typeof rawUrl === "string") {
      const xtags = new URL(rawUrl).searchParams.get("xtags") ?? "";
      const match = /(?:^|:)lang=([^:]+)/i.exec(xtags);
      const fromUrl = accept(match?.[1]);
      if (fromUrl) return fromUrl;
    }
  } catch {
    // Optional URL metadata is not required for language selection.
  }

  return "";
}

export function selectSmallestAudioFormat<T extends YouTubeAudioFormat>(
  candidates: T[],
): T | undefined {
  const duration = candidates
    .map((format) => Number(format.approxDurationMs))
    .find((value) => Number.isFinite(value) && value > 0);
  const sizes = candidates.map((format) =>
    getYouTubeAudioSize(format, duration),
  );
  const useSizes = sizes.every((size) => size !== undefined);
  let selected: T | undefined;
  let best = Infinity;
  let bestSecondary = Infinity;
  candidates.forEach((format, index) => {
    const size = sizes[index] ?? Infinity;
    const bitrate = getYouTubeAudioBitrate(format) ?? Infinity;
    const cost = useSizes ? size : bitrate;
    const secondary = useSizes ? bitrate : size;
    if (
      !selected ||
      cost < best ||
      (cost === best && secondary < bestSecondary)
    ) {
      selected = format;
      best = cost;
      bestSecondary = secondary;
    }
  });
  return selected;
}

export function toPrimitiveString(value: unknown, fallback = ""): string {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint" ||
    typeof value === "symbol"
  ) {
    return String(value);
  }
  return fallback;
}
