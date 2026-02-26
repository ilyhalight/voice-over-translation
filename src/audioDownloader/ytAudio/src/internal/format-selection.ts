const MAX_PROGRESSIVE_QUALITY = 360;
const ALLOWED_PROGRESSIVE_QUALITIES = [144, 240, 360] as const;

type AllowedProgressiveQuality = (typeof ALLOWED_PROGRESSIVE_QUALITIES)[number];
export type ProgressiveResolutionQuality = `${AllowedProgressiveQuality}p`;
export type ProgressiveQuality =
  | "best"
  | "bestefficiency"
  | ProgressiveResolutionQuality;

export interface ProgressiveFormatCandidate {
  bitrate?: number;
  mimeType?: string;
  qualityLabel?: string;
}

const QUALITY_LABEL_PATTERN = /^(\d+)p/i;

function normalizeMimeType(mimeType: string | undefined): string {
  return mimeType?.toLowerCase() ?? "";
}

function isProgressiveMp4MimeType(mimeType: string | undefined): boolean {
  const normalizedMimeType = normalizeMimeType(mimeType);
  return (
    normalizedMimeType.includes("video/mp4") &&
    normalizedMimeType.includes("mp4a")
  );
}

export function isAudioOnlyMimeType(mimeType: string | undefined): boolean {
  const normalizedMimeType = normalizeMimeType(mimeType);
  return (
    normalizedMimeType.includes("audio/") &&
    !normalizedMimeType.includes("video/")
  );
}

function isPreferredAdaptiveAudioMimeType(
  mimeType: string | undefined,
): boolean {
  const normalizedMimeType = normalizeMimeType(mimeType);
  return (
    normalizedMimeType.includes("opus") || normalizedMimeType.includes("mp4a.")
  );
}

function isMp4aAdaptiveAudioMimeType(mimeType: string | undefined): boolean {
  const normalizedMimeType = normalizeMimeType(mimeType);
  return (
    normalizedMimeType.includes("audio/mp4") &&
    normalizedMimeType.includes("mp4a.")
  );
}

function isOpusAdaptiveAudioMimeType(mimeType: string | undefined): boolean {
  const normalizedMimeType = normalizeMimeType(mimeType);
  return (
    normalizedMimeType.includes("audio/webm") &&
    normalizedMimeType.includes("opus")
  );
}

export function extractAudioCodecFromMimeType(
  mimeType: string | undefined,
): string {
  if (!mimeType) {
    return "mp4a.40.2";
  }

  const codecsMatch = /codecs="([^"]+)"/i.exec(mimeType);
  if (!codecsMatch) {
    return "mp4a.40.2";
  }

  const codecBlock = codecsMatch[1];
  if (!codecBlock) {
    return "mp4a.40.2";
  }

  const codecs = codecBlock.split(",").map((value) => value.trim());
  const firstCodec = codecs[0];
  return (
    codecs.find((value) => value.toLowerCase().startsWith("mp4a.")) ??
    firstCodec ??
    "mp4a.40.2"
  );
}

export function parseQualityNumber(label: string | undefined): number | null {
  if (!label) {
    return null;
  }
  const match = QUALITY_LABEL_PATTERN.exec(label.trim());
  return match?.[1] ? Number.parseInt(match[1], 10) : null;
}

function isAboveQualityLimit(label: string | undefined): boolean {
  const quality = parseQualityNumber(label);
  return quality !== null && quality > MAX_PROGRESSIVE_QUALITY;
}

function normalizeRequestedQuality(quality: ProgressiveQuality): number | null {
  const parsed = parseQualityNumber(quality);
  if (parsed === null) {
    return null;
  }
  return Math.min(parsed, MAX_PROGRESSIVE_QUALITY);
}

export function pickByBitrate<T extends ProgressiveFormatCandidate>(
  formats: readonly T[],
  direction: "max" | "min",
): T | null {
  let selected: T | null = null;
  let selectedBitrate = direction === "max" ? -Infinity : Infinity;

  for (const format of formats) {
    const bitrate = format.bitrate ?? 0;
    if (
      (direction === "max" && bitrate > selectedBitrate) ||
      (direction === "min" && bitrate < selectedBitrate)
    ) {
      selected = format;
      selectedBitrate = bitrate;
    }
  }

  return selected;
}

type ProgressiveSelectableCandidate<T extends ProgressiveFormatCandidate> = {
  format: T;
  bitrate: number;
  qualityNumber: number | null;
};

function collectProgressiveMp4Candidates<T extends ProgressiveFormatCandidate>(
  formats: readonly T[],
): ProgressiveSelectableCandidate<T>[] {
  const candidates: ProgressiveSelectableCandidate<T>[] = [];

  for (const format of formats) {
    if (!isProgressiveMp4MimeType(format.mimeType)) {
      continue;
    }
    if (isAboveQualityLimit(format.qualityLabel)) {
      continue;
    }

    candidates.push({
      format,
      bitrate: format.bitrate ?? 0,
      qualityNumber: parseQualityNumber(format.qualityLabel),
    });
  }

  return candidates;
}

export function pickAdaptiveAudioFormat<T extends ProgressiveFormatCandidate>(
  formats: readonly T[],
  quality: ProgressiveQuality,
): T {
  const audioFormats = formats.filter((format) =>
    isAudioOnlyMimeType(format.mimeType),
  );
  if (!audioFormats.length) {
    throw new Error("No adaptive audio formats were found in player response");
  }

  const preferredMp4aFormats = audioFormats.filter((format) =>
    isMp4aAdaptiveAudioMimeType(format.mimeType),
  );
  const preferredOpusFormats = audioFormats.filter((format) =>
    isOpusAdaptiveAudioMimeType(format.mimeType),
  );
  const preferredFormats = audioFormats.filter((format) =>
    isPreferredAdaptiveAudioMimeType(format.mimeType),
  );
  const preferredCandidates =
    quality === "bestefficiency"
      ? [preferredOpusFormats, preferredFormats, audioFormats]
      : [
          preferredMp4aFormats,
          preferredOpusFormats,
          preferredFormats,
          audioFormats,
        ];
  const candidates =
    preferredCandidates.find((formats) => formats.length > 0) ?? audioFormats;

  const selected = pickByBitrate(
    candidates,
    quality === "bestefficiency" ? "min" : "max",
  );
  if (!selected) {
    throw new Error("No adaptive audio formats were found in player response");
  }

  return selected;
}

export function pickProgressiveFormat<T extends ProgressiveFormatCandidate>(
  formats: readonly T[],
  quality: ProgressiveQuality,
): T {
  const candidates = collectProgressiveMp4Candidates(formats);
  if (!candidates.length) {
    throw new Error("No progressive mp4 formats were found in player response");
  }

  if (quality === "best") {
    const selected = pickByBitrate(candidates, "max");
    if (!selected) {
      throw new Error(
        "No progressive mp4 formats were found in player response",
      );
    }
    return selected.format;
  }

  if (quality === "bestefficiency") {
    const selected = pickByBitrate(candidates, "min");
    if (!selected) {
      throw new Error(
        "No progressive mp4 formats were found in player response",
      );
    }
    return selected.format;
  }

  const requestedQuality = normalizeRequestedQuality(quality);

  const bestFormat = pickByBitrate(candidates, "max")?.format ?? null;

  let exactMatch: T | null = null;
  let exactBitrate = -Infinity;

  let belowMatch: T | null = null;
  let belowQuality = -Infinity;
  let belowBitrate = -Infinity;

  let aboveMatch: T | null = null;
  let aboveQuality = Infinity;
  let aboveBitrate = -Infinity;

  let lowestBitrateMatch: T | null = null;
  let lowestBitrate = Infinity;

  for (const candidate of candidates) {
    const { format, bitrate, qualityNumber } = candidate;

    if (bitrate < lowestBitrate) {
      lowestBitrateMatch = format;
      lowestBitrate = bitrate;
    }

    if (requestedQuality === null) {
      continue;
    }

    if (qualityNumber === null) {
      continue;
    }

    if (qualityNumber === requestedQuality) {
      if (bitrate > exactBitrate) {
        exactMatch = format;
        exactBitrate = bitrate;
      }
      continue;
    }

    if (
      qualityNumber < requestedQuality &&
      (qualityNumber > belowQuality ||
        (qualityNumber === belowQuality && bitrate > belowBitrate))
    ) {
      belowMatch = format;
      belowQuality = qualityNumber;
      belowBitrate = bitrate;
      continue;
    }

    if (
      qualityNumber > requestedQuality &&
      (qualityNumber < aboveQuality ||
        (qualityNumber === aboveQuality && bitrate > aboveBitrate))
    ) {
      aboveMatch = format;
      aboveQuality = qualityNumber;
      aboveBitrate = bitrate;
    }
  }

  if (!bestFormat) {
    throw new Error("No progressive mp4 formats were found in player response");
  }

  return (
    exactMatch ?? belowMatch ?? aboveMatch ?? lowestBitrateMatch ?? bestFormat
  );
}
