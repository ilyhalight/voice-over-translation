export type ProgressiveQuality = "best" | "bestefficiency";

export interface ProgressiveFormatCandidate {
  bitrate?: number;
  mimeType?: string;
  qualityLabel?: string;
}

function normalizeMimeType(mimeType: string | undefined): string {
  return mimeType?.toLowerCase() ?? "";
}

export function isAudioOnlyMimeType(mimeType: string | undefined): boolean {
  const normalizedMimeType = normalizeMimeType(mimeType);
  return (
    normalizedMimeType.includes("audio/") &&
    !normalizedMimeType.includes("video/")
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
  if (!codecsMatch?.[1]) {
    return "mp4a.40.2";
  }

  const codecs = codecsMatch[1].split(",").map((value) => value.trim());
  return (
    codecs.find((value) => value.toLowerCase().startsWith("mp4a.")) ??
    codecs[0] ??
    "mp4a.40.2"
  );
}

function pickByBitrate<T extends ProgressiveFormatCandidate>(
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

  const pickDirection = quality === "bestefficiency" ? "min" : "max";
  const candidateGroups: readonly T[][] =
    quality === "bestefficiency"
      ? [
          audioFormats.filter((format) =>
            isOpusAdaptiveAudioMimeType(format.mimeType),
          ),
          audioFormats,
        ]
      : [
          audioFormats.filter((format) =>
            isMp4aAdaptiveAudioMimeType(format.mimeType),
          ),
          audioFormats.filter((format) =>
            isOpusAdaptiveAudioMimeType(format.mimeType),
          ),
          audioFormats,
        ];

  for (const candidates of candidateGroups) {
    if (!candidates.length) {
      continue;
    }

    const selected = pickByBitrate(candidates, pickDirection);
    if (selected) {
      return selected;
    }
  }

  throw new Error("No adaptive audio formats were found in player response");
}
