/**
 * Picks the stream the downloader reads out of a `player` response.
 *
 * Two independent decisions:
 *
 * 1. Which audio track (language). English first — the original English audio
 *    as well as a dub, including an automatic one — and the original track of
 *    the upload when the video carries no English audio at all.
 * 2. Which format of that track. Only the audio is needed and every byte is
 *    paid for twice (downloaded from GVS, uploaded to the translation
 *    backend), so the cheapest stream of the track wins: Opus with the lowest
 *    bitrate (`itag 249`, ~50 kbps), otherwise the lowest-bitrate audio-only
 *    stream of any codec (`itag 139`, ~48 kbps AAC-HE).
 *
 * Video is never part of a normal selection. It is only offered by
 * {@link selectVideoFallbackFormat} and {@link selectSmallestVideoStream},
 * which the caller uses as a last resort.
 */

/** Audio-track descriptor of a multi-language upload. */
export type AudioTrackInfo = {
  /** `en.4`, `ru-RU.3`, ...: a BCP-47 tag plus the index of the track. */
  id?: string;
  displayName?: string;
  /** InnerTube marks the track the player starts with. */
  audioIsDefault?: boolean;
  isDefault?: boolean;
  default?: boolean;
};

/** A `streamingData` entry, from `adaptiveFormats` or from `formats`. */
export type MediaFormat = {
  itag?: number;
  url?: string;
  mimeType?: string;
  bitrate?: number;
  averageBitrate?: number;
  contentLength?: string;
  lastModified?: string;
  signatureCipher?: string;
  /** Present once an upload has more than one audio track. */
  audioTrack?: AudioTrackInfo;
  /** `acont=original:lang=en`: the machine-readable track description. */
  xtags?: string;
  /** Volume-compressed ("stable volume") duplicate of a track. */
  isDrc?: boolean;
  audioIsDefault?: boolean;
  isDefaultAudio?: boolean;
  height?: number;
  qualityLabel?: string;
};

/** Track variants `acont` names, in the order the field spells them. */
const TRACK_CONTENTS = [
  "original",
  "dubbed",
  "dubbed-auto",
  "descriptive",
] as const;

/** `acont` of the `xtags` field, or the same fact read off the track name. */
export type TrackContent = (typeof TRACK_CONTENTS)[number] | "unknown";

export type TrackDescriptor = {
  /** Identity of the track inside one `player` response. */
  key: string;
  /** Primary language subtag, `en` for `en-US`. */
  language?: string;
  content: TrackContent;
  /** The track the player would start with. */
  isDefault: boolean;
};

export type SelectedFormat = {
  format: MediaFormat;
  track?: TrackDescriptor;
  /** Why this format was picked. Logged, never parsed. */
  reason: string;
};

export type FormatSelectionOptions = {
  /**
   * `true` (default) for the direct download: only a format with a URL can be
   * requested. `false` when the formats are handed back to the player itself
   * (`playerResponseFilter`), because a SABR answer carries no URL at all.
   */
  requireUrl?: boolean;
};

const AUDIO_MIME = /^audio\//i;
const VIDEO_MIME = /^video\//i;
const OPUS_CODEC = /\bopus\b/i;
/** A muxed format names an audio codec next to the video codec. */
const MUXED_AUDIO_CODEC = /\b(?:mp4a|aac|opus|vorbis|ac-3|ec-3|mp3)\b/i;
const ENGLISH_NAME = /\benglish\b/i;
const DESCRIPTIVE_NAME = /\bdescri/i;
const DUBBED_NAME = /\bdub/i;
const AUTO_NAME = /\bauto/i;
const ORIGINAL_NAME = /\borigin/i;
const QUALITY_HEIGHT = /(\d+)p/;
const ACONT_VALUES = new Set<string>(TRACK_CONTENTS);

/**
 * Rank of an English track, lower is better: the original audio wins, and an
 * audio description is the least useful variant because it talks over the
 * content. Hoisted so ranking a track allocates nothing.
 */
const ENGLISH_RANKS: Record<TrackContent, number> = {
  original: 0,
  dubbed: 1,
  "dubbed-auto": 2,
  unknown: 3,
  descriptive: 4,
};

/** Every other language ranks behind every English track. */
const OTHER_LANGUAGE_RANK = 10;

/** Sorting helper that keeps `Infinity` comparable (`Infinity - Infinity` is `NaN`). */
function compareNumbers(a: number, b: number): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

/** A reported measure, or `Infinity` when the answer does not carry it. */
function toPositive(value: unknown): number {
  const parsed = Number(value);
  return parsed > 0 ? parsed : Number.POSITIVE_INFINITY;
}

/** The first entry `compare` ranks best, without copying or sorting. */
function pickBest<T>(
  items: Iterable<T>,
  compare: (a: T, b: T) => number,
): T | undefined {
  let best: T | undefined;
  for (const item of items) {
    if (best === undefined || compare(item, best) < 0) best = item;
  }
  return best;
}

/** `xtags` is a colon-separated key list, sometimes percent-encoded. */
export function parseXtags(xtags?: string): Map<string, string> {
  const tags = new Map<string, string>();
  if (!xtags) return tags;
  let source = xtags;
  if (source.includes("%")) {
    try {
      source = decodeURIComponent(source);
    } catch {
      // Keep the raw value: a broken escape is still readable as plain text.
    }
  }
  for (const part of source.split(":")) {
    const separator = part.indexOf("=");
    if (separator > 0) {
      tags.set(
        part.slice(0, separator).trim().toLowerCase(),
        part
          .slice(separator + 1)
          .trim()
          .toLowerCase(),
      );
    }
  }
  return tags;
}

function readLanguage(
  format: MediaFormat,
  tags: Map<string, string>,
): string | undefined {
  // `lang` of the xtags and the audio track id are both BCP-47 tags; the id
  // carries the track index behind a dot (`en-US.4`).
  const tag = tags.get("lang") ?? format.audioTrack?.id?.split(".")[0];
  const primary = tag?.trim().toLowerCase().split(/[-_]/)[0];
  if (primary) return primary;
  // Some clients only answer the human-readable track name.
  return ENGLISH_NAME.test(format.audioTrack?.displayName ?? "")
    ? "en"
    : undefined;
}

function readContent(
  format: MediaFormat,
  tags: Map<string, string>,
  isDefault: boolean,
): TrackContent {
  const acont = tags.get("acont");
  if (acont && ACONT_VALUES.has(acont)) return acont as TrackContent;
  const name = format.audioTrack?.displayName ?? "";
  if (DESCRIPTIVE_NAME.test(name)) return "descriptive";
  if (DUBBED_NAME.test(name)) {
    return AUTO_NAME.test(name) ? "dubbed-auto" : "dubbed";
  }
  if (ORIGINAL_NAME.test(name)) return "original";
  // `audioIsDefault` / `default: true` marks the audio of the upload itself.
  return isDefault ? "original" : "unknown";
}

/** The clients of the ladder spell the same flag in five different ways. */
function isDefaultTrack(format: MediaFormat): boolean {
  const track = format.audioTrack;
  return (
    track?.audioIsDefault === true ||
    track?.isDefault === true ||
    track?.default === true ||
    format.audioIsDefault === true ||
    format.isDefaultAudio === true
  );
}

export function describeTrack(format: MediaFormat): TrackDescriptor {
  const tags = parseXtags(format.xtags);
  const isDefault = isDefaultTrack(format);
  const language = readLanguage(format, tags);
  const content = readContent(format, tags, isDefault);
  return {
    key: format.audioTrack?.id ?? `${language ?? "und"}:${content}`,
    language,
    content,
    isDefault,
  };
}

/**
 * Lower is better. English wins over every other language, and inside a
 * language the original audio wins over a dub, the default track over an
 * unnamed one, and everything over an audio description.
 *
 * Exported because the HLS path (`hlsAudio.ts`) ranks its `#EXT-X-MEDIA`
 * renditions by the very same rule: two transports of one video must never
 * pick two different languages.
 */
export function rankTrack({
  language,
  content,
  isDefault,
}: TrackDescriptor): number {
  if (language === "en") return ENGLISH_RANKS[content];
  if (content === "descriptive") return OTHER_LANGUAGE_RANK + 4;
  if (content === "original") return OTHER_LANGUAGE_RANK;
  if (isDefault) return OTHER_LANGUAGE_RANK + 1;
  return OTHER_LANGUAGE_RANK + (content === "unknown" ? 2 : 3);
}

/** The rate the format is billed at: the lower of both reported bitrates. */
function getFormatBitrate(format: MediaFormat): number {
  return Math.min(
    toPositive(format.averageBitrate),
    toPositive(format.bitrate),
  );
}

function getFormatHeight(format: MediaFormat): number {
  return toPositive(
    format.height ?? QUALITY_HEIGHT.exec(format.qualityLabel ?? "")?.[1],
  );
}

/**
 * Formats of the wanted kind that can actually be requested: a URL, or a
 * cipher that produces one.
 */
function narrowToRequestable(
  formats: readonly MediaFormat[],
  mime: RegExp,
  requireUrl: boolean,
): readonly MediaFormat[] {
  const matching: MediaFormat[] = [];
  const playable: MediaFormat[] = [];
  for (const format of formats) {
    if (!mime.test(format.mimeType ?? "")) continue;
    matching.push(format);
    if (
      typeof format.url === "string" ||
      typeof format.signatureCipher === "string"
    ) {
      playable.push(format);
    }
  }
  // When some formats do carry a URL, those are the only ones anything could
  // request directly, so they win over their URL-less duplicates.
  return requireUrl || playable.length ? playable : matching;
}

/** True when a MIME type names an audio codec, muxed or audio-only. */
export function hasAudioCodec(mimeType?: string): boolean {
  return MUXED_AUDIO_CODEC.test(mimeType ?? "");
}

/**
 * The `ultralow` Opus streams (itag 599 and 600) are the cheapest audio a
 * response can carry, but GVS only serves them to a part of YouTube's own
 * surfaces: a browser session that signs its URLs with a PO token is answered
 * 403 for a regular video (yt-dlp issue #14605). Picking them saves a few
 * hundred kilobytes and costs the whole download, so they are only taken when
 * the upload carries nothing else.
 */
const ULTRALOW_AUDIO_ITAGS = new Set([599, 600]);

/** Traffic-first order: bitrate, then the untouched track, then real bytes. */
function compareAudioCost(a: MediaFormat, b: MediaFormat): number {
  return (
    compareNumbers(getFormatBitrate(a), getFormatBitrate(b)) ||
    Number(a.isDrc === true) - Number(b.isDrc === true) ||
    compareNumbers(toPositive(a.contentLength), toPositive(b.contentLength)) ||
    compareNumbers(a.itag ?? 0, b.itag ?? 0)
  );
}

/**
 * Opus ladder of a YouTube response, cheapest first: `249` (~50 kbps),
 * `250` (~70 kbps), `251` (<= 160 kbps).
 *
 * The itag is ranked before the reported bitrate because `bitrate` is the peak
 * of the stream and some client answers repeat the same value on every entry
 * of the ladder, which made the "cheapest" pick land on `251` and upload three
 * times the bytes. An Opus itag outside the ladder ranks behind all three.
 */
const OPUS_ITAG_ORDER = [249, 250, 251];

function opusRank(format: MediaFormat): number {
  const index = OPUS_ITAG_ORDER.indexOf(format.itag ?? 0);
  return index === -1 ? OPUS_ITAG_ORDER.length : index;
}

/** Opus streams only: the itag ladder first, then the generic cost. */
function compareOpusCost(a: MediaFormat, b: MediaFormat): number {
  return compareNumbers(opusRank(a), opusRank(b)) || compareAudioCost(a, b);
}

function compareVideoCost(a: MediaFormat, b: MediaFormat): number {
  return (
    compareNumbers(getFormatHeight(a), getFormatHeight(b)) ||
    compareNumbers(getFormatBitrate(a), getFormatBitrate(b)) ||
    compareNumbers(toPositive(a.contentLength), toPositive(b.contentLength))
  );
}

export function describeFormat(format: MediaFormat): Record<string, unknown> {
  return {
    itag: format.itag,
    mimeType: format.mimeType,
    bitrate: getFormatBitrate(format),
    contentLength: format.contentLength ?? "none",
    isDrc: format.isDrc === true,
  };
}

/**
 * Selects the cheapest audio-only stream of the preferred language track.
 *
 * Every other track is dropped by the caller, so a multi-language upload can
 * never switch languages mid-download.
 *
 * @throws when the response carries no audio-only format at all, or none with
 * a URL while one is required, which is what a SABR-only client answers.
 */
export function selectAudioFormat(
  formats: readonly MediaFormat[],
  { requireUrl = true }: FormatSelectionOptions = {},
): SelectedFormat {
  const candidates = narrowToRequestable(formats, AUDIO_MIME, requireUrl);
  if (!candidates.length) {
    throw new Error(
      requireUrl
        ? "Audio downloader. web ABR returned no direct audio formats"
        : "Audio downloader. player response carries no audio formats",
    );
  }

  const tracks = new Map<
    string,
    { track: TrackDescriptor; formats: MediaFormat[] }
  >();
  for (const format of candidates) {
    const track = describeTrack(format);
    const group = tracks.get(track.key);
    if (group) group.formats.push(format);
    else tracks.set(track.key, { track, formats: [format] });
  }

  // `candidates` is not empty, so there is at least one track to pick from,
  // and a track always holds the format it was created from.
  const selected = pickBest(
    tracks.values(),
    (a, b) => rankTrack(a.track) - rankTrack(b.track),
  ) as { track: TrackDescriptor; formats: MediaFormat[] };
  const servable = selected.formats.filter(
    (format) => !ULTRALOW_AUDIO_ITAGS.has(format.itag ?? 0),
  );
  const usable = servable.length ? servable : selected.formats;
  const opus = usable.filter((format) =>
    OPUS_CODEC.test(format.mimeType ?? ""),
  );
  return {
    format: pickBest(
      opus.length ? opus : usable,
      opus.length ? compareOpusCost : compareAudioCost,
    ) as MediaFormat,
    track: selected.track,
    reason: opus.length ? "lowest-bitrate opus" : "lowest-bitrate audio",
  };
}

/**
 * The smallest picture of a response: 144p whenever YouTube offers one.
 *
 * `preferMuxed` decides what a tie between a muxed and a video-only stream
 * means. A muxed format carries the audio with it, a video-only one is
 * smaller but silent, so the caller picks by what it needs next to the
 * picture. When the response only carries the other kind, that kind is taken
 * and named in the reason.
 */
function selectVideoStream(
  formats: readonly MediaFormat[],
  preferMuxed: boolean,
  { requireUrl = true }: FormatSelectionOptions = {},
): SelectedFormat | undefined {
  const candidates = narrowToRequestable(formats, VIDEO_MIME, requireUrl);
  const preferred = candidates.filter(
    (format) => hasAudioCodec(format.mimeType) === preferMuxed,
  );
  const format = pickBest(
    preferred.length ? preferred : candidates,
    compareVideoCost,
  );
  if (!format) return undefined;
  const muxed = preferred.length ? preferMuxed : !preferMuxed;
  return {
    format,
    reason: muxed ? "lowest-quality muxed video" : "lowest-quality video-only",
  };
}

/** The only picture worth paying for when the audio is the payload. */
const MAX_FALLBACK_VIDEO_HEIGHT = 144;

function isLowQualityVideo(format: MediaFormat): boolean {
  const height = getFormatHeight(format);
  // An answer without any height information is not assumed to be 144p.
  return height > 0 && height <= MAX_FALLBACK_VIDEO_HEIGHT;
}

/**
 * Last resort: the smallest video stream that carries audio, 144p first.
 *
 * This format is uploaded to the translation backend as it is downloaded, so
 * a video-only stream is not an option here even though the 144p video-only
 * streams (`597`, `598`, `160`, `278`, `394`) are the smallest bytes a
 * response offers: they are silent, and silence is answered with a translation
 * that never completes instead of an error the caller can fall back from.
 *
 * `itag 17` (3GP, 144p plus 24 kbps AAC) is the cheapest muxed stream, but
 * YouTube stopped serving it for most uploads, so in practice this is `18`
 * (progressive 360p). It is accepted only because the alternative is no audio,
 * and only after every audio-only format has failed.
 *
 * @throws when the response carries no muxed video format with a URL, which
 * tells the caller to try the next strategy instead of uploading silence.
 */
export function selectVideoFallbackFormat(
  formats: readonly MediaFormat[],
  { requireUrl = true }: FormatSelectionOptions = {},
): SelectedFormat {
  const candidates = narrowToRequestable(
    formats,
    VIDEO_MIME,
    requireUrl,
  ).filter((format) => hasAudioCodec(format.mimeType));
  if (!candidates.length) {
    throw new Error("Audio downloader. no muxed video fallback format");
  }
  const lowest = candidates.filter(isLowQualityVideo);
  const format = pickBest(
    lowest.length ? lowest : candidates,
    compareVideoCost,
  ) as MediaFormat;
  return {
    format,
    track: describeTrack(format),
    reason: lowest.length
      ? "lowest-quality muxed video"
      : "smallest muxed video above 144p",
  };
}

/**
 * Matches the stream a download is already reading against a fresh `player`
 * response, so an expired GVS URL can be replaced without restarting.
 *
 * A stream is identified by its itag and its audio track only. `contentLength`,
 * `lastModified` and even the exact `mimeType` string differ between two
 * answers for the same video (another client, another CDN node, a re-muxed
 * upload), and comparing them turned every URL refresh into
 * "Refreshed audio format changed" in the middle of a working download.
 *
 * @returns the same stream of the fresh response, the same itag of another
 * track when the response no longer carries that track, or `undefined` when
 * the itag is gone entirely.
 */
export function findRefreshedFormat(
  formats: readonly MediaFormat[],
  previous: MediaFormat,
): MediaFormat | undefined {
  const trackKey = describeTrack(previous).key;
  const sameItag = formats.filter(
    (format) =>
      format.itag === previous.itag &&
      (typeof format.url === "string" ||
        typeof format.signatureCipher === "string"),
  );
  return (
    sameItag.find((format) => describeTrack(format).key === trackKey) ??
    sameItag[0]
  );
}

/**
 * The cheapest picture of a response: 144p video-only whenever YouTube offers
 * one.
 *
 * Unlike {@link selectVideoFallbackFormat} a video-only stream is preferred
 * here, because this format is kept next to the captured audio: a muxed one
 * would pay for a second copy of the audio track.
 *
 * @returns `undefined` when the response carries no video format.
 */
export function selectSmallestVideoStream(
  formats: readonly MediaFormat[],
  options: FormatSelectionOptions = {},
): SelectedFormat | undefined {
  return selectVideoStream(formats, false, options);
}
