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

export function selectSmallestAudioFormat<
  T extends { contentLength?: unknown; averageBitrate?: unknown },
>(candidates: T[]): T | undefined {
  const smallest = (key: "contentLength" | "averageBitrate") => {
    let best: T | undefined;
    let bestValue = Number.POSITIVE_INFINITY;
    for (const candidate of candidates) {
      const raw = candidate[key];
      const value =
        raw == null
          ? Number.NaN
          : typeof raw === "number"
            ? raw
            : Number(String(raw));
      if (Number.isFinite(value) && value > 0 && value < bestValue) {
        best = candidate;
        bestValue = value;
      }
    }
    return best;
  };
  return (
    smallest("contentLength") ?? smallest("averageBitrate") ?? candidates[0]
  );
}
