export type YouTubeAudioFormat = {
  itag?: unknown;
  mimeType?: unknown;
  bitrate?: unknown;
  averageBitrate?: unknown;
  contentLength?: unknown;
  approxDurationMs?: unknown;
  language?: unknown;
  languageCode?: unknown;
  audioTrackId?: unknown;
  audioTrack?: {
    id?: unknown;
    language?: unknown;
    languageCode?: unknown;
    audioIsDefault?: unknown;
  };
  url?: unknown;
  signatureCipher?: unknown;
  xtags?: unknown;
  isDrc?: unknown;
  width?: unknown;
  height?: unknown;
  hasVideo?: unknown;
  hasAudio?: unknown;
  hasText?: unknown;
  qualityLabel?: unknown;
  isDrm?: unknown;
  hasDrm?: unknown;
  drm?: unknown;
  drmFamilies?: unknown;
  drmInfo?: unknown;
  licenseInfos?: unknown;
};

export type YouTubeAudioSelectionOptions = {
  requestedLanguage?: string;
  requestedTrackId?: string;
  preferNonDrc?: boolean;
  durationMs?: number;
};

const ITAG_BITRATES: Readonly<Record<number, number>> = {
  599: 31_000,
  600: 35_000,
  249: 50_000,
  250: 70_000,
  139: 48_000,
  140: 128_000,
  251: 160_000,
};

function positiveNumber(value: unknown): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function language(value: unknown): string {
  const normalized = text(value).replaceAll("_", "-");
  if (["und", "zxx", "mul"].includes(normalized)) return "";
  return /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(normalized) ? normalized : "";
}

function hasMetadata(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return (
    value !== undefined && value !== null && value !== false && value !== ""
  );
}

export function isUsableYouTubeAudioFormat(
  format: YouTubeAudioFormat | null | undefined,
): format is YouTubeAudioFormat {
  if (!format || typeof format !== "object") return false;
  const itag = positiveNumber(format.itag);
  const mimeType = text(format.mimeType);
  return Boolean(
    itag &&
      Number.isSafeInteger(itag) &&
      /^audio\/[a-z0-9][a-z0-9.+-]*(?:\s*;|$)/.test(mimeType) &&
      !mimeType.includes("video/") &&
      !positiveNumber(format.width) &&
      !positiveNumber(format.height) &&
      format.hasVideo !== true &&
      format.hasAudio !== false &&
      format.hasText !== true &&
      !text(format.qualityLabel) &&
      ![
        format.isDrm,
        format.hasDrm,
        format.drm,
        format.drmFamilies,
        format.drmInfo,
        format.licenseInfos,
      ].some(hasMetadata),
  );
}

export function getYouTubeAudioBitrate(
  format: YouTubeAudioFormat,
): number | undefined {
  const measured =
    positiveNumber(format.averageBitrate) ?? positiveNumber(format.bitrate);
  if (measured) return measured;
  const size = positiveNumber(format.contentLength);
  const duration = positiveNumber(format.approxDurationMs);
  if (size && duration) {
    const derived = positiveNumber((size / duration) * 8_000);
    if (derived) return derived;
  }
  const itag = positiveNumber(format.itag);
  return itag ? ITAG_BITRATES[itag] : undefined;
}

export function getYouTubeAudioSize(
  format: YouTubeAudioFormat,
  durationMs?: number,
): number | undefined {
  const size = positiveNumber(format.contentLength);
  if (size) return size;
  const duration =
    positiveNumber(format.approxDurationMs) ?? positiveNumber(durationMs);
  const bitrate = getYouTubeAudioBitrate(format);
  return duration && bitrate
    ? positiveNumber((bitrate / 8_000) * duration)
    : undefined;
}

function xtags(format: YouTubeAudioFormat): string {
  const tags = [text(format.xtags)];
  try {
    const cipher =
      typeof format.signatureCipher === "string"
        ? new URLSearchParams(format.signatureCipher)
        : undefined;
    const url =
      typeof format.url === "string" && format.url.trim()
        ? format.url
        : cipher?.get("url");
    if (url) tags.push(text(new URL(url).searchParams.get("xtags")));
  } catch {}
  return tags.join(":");
}

function trackIds(format: YouTubeAudioFormat): string[] {
  return [text(format.audioTrackId), text(format.audioTrack?.id)].filter(
    Boolean,
  );
}

function languages(format: YouTubeAudioFormat): string[] {
  const fromTags = /(?:^|:)lang=([^:]+)/i.exec(xtags(format))?.[1];
  return [
    format.languageCode,
    format.language,
    format.audioTrack?.languageCode,
    format.audioTrack?.language,
    ...trackIds(format).map((id) => id.split(".")[0]),
    fromTags,
  ]
    .map(language)
    .filter(Boolean);
}

function sameLanguage(a: string, b: string): boolean {
  return a.split("-")[0] === b.split("-")[0];
}

function trackRank(
  format: YouTubeAudioFormat,
  requestedTrackId: string,
  requestedLanguage: string,
): number | undefined {
  const ids = trackIds(format);
  const tags = languages(format);
  // A language match must never turn a different concrete track into a match.
  if (requestedTrackId && ids.some((id) => id !== requestedTrackId)) return;
  if (
    requestedLanguage &&
    tags.some((tag) => !sameLanguage(tag, requestedLanguage))
  )
    return;
  if (requestedTrackId && ids.includes(requestedTrackId)) return 0;
  if (requestedLanguage && tags.includes(requestedLanguage)) return 1;
  if (requestedLanguage && tags.length) return 2;
  return 3;
}

export function selectYouTubeAudioFormat<T extends YouTubeAudioFormat>(
  formats: readonly T[],
  options: YouTubeAudioSelectionOptions = {},
): T | undefined {
  const requestedTrackId = text(options.requestedTrackId);
  const trackLanguage = language(requestedTrackId.split(".")[0]);
  const requestedLanguage =
    language(options.requestedLanguage) || trackLanguage;
  if (
    trackLanguage &&
    requestedLanguage &&
    !sameLanguage(trackLanguage, requestedLanguage)
  )
    return;
  let candidates = formats.filter((format) =>
    isUsableYouTubeAudioFormat(format),
  );
  if (requestedTrackId || requestedLanguage) {
    let bestRank = Number.POSITIVE_INFINITY;
    candidates = candidates
      .filter((format) => {
        const rank = trackRank(format, requestedTrackId, requestedLanguage);
        if (rank === undefined) return false;
        bestRank = Math.min(bestRank, rank);
        return true;
      })
      .filter(
        (format) =>
          trackRank(format, requestedTrackId, requestedLanguage) === bestRank,
      );
  } else {
    const defaults = candidates.filter(
      (format) => format.audioTrack?.audioIsDefault === true,
    );
    if (defaults.length) candidates = defaults;
  }
  if (options.preferNonDrc !== false) {
    const nonDrc = candidates.filter(
      (format) =>
        format.isDrc !== true && !/(?:^|:)drc=1(?:$|:)/i.test(xtags(format)),
    );
    if (nonDrc.length) candidates = nonDrc;
  }
  const duration =
    positiveNumber(options.durationMs) ??
    candidates
      .map((format) => positiveNumber(format.approxDurationMs))
      .find(Boolean);
  const sizes = candidates.map((format) =>
    getYouTubeAudioSize(format, duration),
  );
  // Without a shared duration, bytes and bits/s cannot be compared directly.
  const useSizes = sizes.every((size) => size !== undefined);
  let selected: T | undefined;
  let bestCost = Number.POSITIVE_INFINITY;
  let bestSecondaryCost = Number.POSITIVE_INFINITY;
  candidates.forEach((format, index) => {
    const bitrate = getYouTubeAudioBitrate(format) ?? Number.POSITIVE_INFINITY;
    const size = sizes[index] ?? Number.POSITIVE_INFINITY;
    const cost = useSizes ? size : bitrate;
    const secondaryCost = useSizes ? bitrate : size;
    if (
      !selected ||
      cost < bestCost ||
      (cost === bestCost && secondaryCost < bestSecondaryCost)
    ) {
      selected = format;
      bestCost = cost;
      bestSecondaryCost = secondaryCost;
    }
  });
  return selected;
}
