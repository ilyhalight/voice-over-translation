/**
 * HLS audio path — the only YouTube transport that a logged-out browser
 * session is still served without a GVS PO token.
 *
 * WHY
 * ---
 * yt-dlp's PO token table says it in one line: for every web-family client
 * the HTTPS (`videoplayback`) URLs are `required=True`, while HLS is
 * `required=False`. That is exactly the difference between a signed-in and an
 * anonymous download in this extension: with an account the page BotGuard
 * token matches the session that issued the HTTPS URLs, in a private window it
 * does not and GVS answers 403 — but the very same session is served its HLS
 * manifest and segments without any token at all.
 *
 * The `-F` listing of such a video shows what this path reads:
 *
 *     233-20 mp4 audio only  m3u8  [en-US] American English - original
 *     234-20 mp4 audio only  m3u8  [en-US] American English - original
 *
 * `itag 233` is the low-bitrate AAC audio-only rendition — the cheapest
 * complete audio track YouTube offers over HLS, and the one this module
 * downloads: master playlist -> audio rendition of the wanted track -> media
 * playlist -> segments, concatenated into the same chunk stream every other
 * strategy produces.
 *
 * Everything here is intentionally free of realm plumbing: the two playlist
 * parsers and the rendition ranking are pure functions, which is what the unit
 * tests exercise.
 */
import { config } from "@vot.js/shared";
import debug from "../../utils/debug";
import { createChunkAccumulator } from "../internal/chunkAccumulator";
import type { AudioChunk } from "./audioChunks";
import {
  describeTrack,
  type MediaFormat,
  rankTrack,
  type TrackDescriptor,
} from "./formatSelection";
import { fetchMediaResource, type MediaTransport } from "./mediaTransport";

/** `/itag/233/` inside a GVS playlist or segment path. */
const ITAG_PATH_PATTERN = /\/itag\/(\d+)/;
/** yt-dlp appends the GVS token as a path segment on manifest URLs. */
const POT_PATH_PATTERN = /\/pot\/[^/]+/;
/** `.../file/index.m3u8` and `.../playlist/index.m3u8` keep their suffix. */
const MANIFEST_SUFFIX_PATTERN = /^(.+)(\/(?:file|playlist)\/index\.m3u8)$/;
/** Audio-only HLS ladder, cheapest first (`233` low AAC, `234` high AAC). */
const HLS_AUDIO_ITAG_ORDER = [233, 234];
/** Segments in flight. Enough to saturate a link, small enough to be cheap. */
const SEGMENT_PARALLELISM = 4;
/** A playlist is a few kilobytes; anything slower than this is broken. */
const PLAYLIST_TIMEOUT_MS = 30_000;

export type HlsAudioRendition = {
  /** Absolute URL of the rendition's media playlist. */
  readonly uri: string;
  readonly itag?: number;
  /** `LANGUAGE` attribute, e.g. `en-US`. */
  readonly language?: string;
  /** `NAME` attribute, e.g. `American English original (original)`. */
  readonly name?: string;
  readonly groupId?: string;
  readonly isDefault: boolean;
  readonly isAutoselect: boolean;
};

export type SelectedHlsRendition = {
  readonly rendition: HlsAudioRendition;
  readonly track: TrackDescriptor;
  /** Why this rendition was picked. Logged, never parsed. */
  readonly reason: string;
};

export type HlsSegment = {
  readonly url: string;
  /** `bytes=start-end` for a playlist that slices one file with BYTERANGE. */
  readonly range?: string;
};

export type HlsMediaPlaylist = {
  /** `#EXT-X-MAP` init segment of a fragmented-MP4 rendition. */
  readonly initSegment?: HlsSegment;
  readonly segments: readonly HlsSegment[];
};

/**
 * Parses an `#EXT-X-...:KEY=VALUE,KEY="VALUE"` attribute list.
 *
 * Quoted values may contain commas (`CODECS="mp4a.40.5,avc1"`), so a plain
 * `split(",")` is wrong; keys are upper-cased because the spec is
 * case-sensitive but YouTube is not always consistent.
 */
export function parseHlsAttributeList(line: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const colon = line.indexOf(":");
  const source = colon < 0 ? line : line.slice(colon + 1);
  let index = 0;
  while (index < source.length) {
    const equals = source.indexOf("=", index);
    if (equals < 0) break;
    const key = source.slice(index, equals).trim().toUpperCase();
    let value: string;
    if (source[equals + 1] === '"') {
      const end = source.indexOf('"', equals + 2);
      const stop = end < 0 ? source.length : end;
      value = source.slice(equals + 2, stop);
      index = stop + 2;
    } else {
      const comma = source.indexOf(",", equals + 1);
      const stop = comma < 0 ? source.length : comma;
      value = source.slice(equals + 1, stop).trim();
      index = stop + 1;
    }
    if (key) attributes.set(key, value);
  }
  return attributes;
}

/** The itag a GVS playlist or segment URL carries in its path. */
export function readHlsItag(uri: string): number | undefined {
  const itag = Number(ITAG_PATH_PATTERN.exec(uri)?.[1]);
  return itag > 0 ? itag : undefined;
}

function resolveHlsUrl(uri: string, baseUrl: string): string | undefined {
  const trimmed = uri.trim();
  if (!trimmed) return undefined;
  if (URL.canParse(trimmed)) return trimmed;
  if (!URL.canParse(trimmed, baseUrl)) return undefined;
  return new URL(trimmed, baseUrl).toString();
}

/** True for a master playlist, i.e. one that lists other playlists. */
export function isHlsMasterPlaylist(playlist: string): boolean {
  return (
    playlist.includes("#EXT-X-STREAM-INF") || playlist.includes("#EXT-X-MEDIA:")
  );
}

/**
 * Audio-only renditions of a master playlist.
 *
 * A `TYPE=AUDIO` entry without a `URI` describes audio that is muxed into the
 * video renditions, so it carries nothing this downloader could read on its
 * own and is skipped.
 */
export function parseHlsAudioRenditions(
  playlist: string,
  baseUrl: string,
): HlsAudioRendition[] {
  const renditions: HlsAudioRendition[] = [];
  for (const rawLine of playlist.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("#EXT-X-MEDIA:")) continue;
    const attributes = parseHlsAttributeList(line);
    if ((attributes.get("TYPE") ?? "").toUpperCase() !== "AUDIO") continue;
    const rawUri = attributes.get("URI");
    if (!rawUri) continue;
    const uri = resolveHlsUrl(rawUri, baseUrl);
    if (!uri) continue;
    renditions.push({
      uri,
      itag: readHlsItag(uri),
      language: attributes.get("LANGUAGE") || undefined,
      name: attributes.get("NAME") || undefined,
      groupId: attributes.get("GROUP-ID") || undefined,
      isDefault: (attributes.get("DEFAULT") ?? "").toUpperCase() === "YES",
      isAutoselect:
        (attributes.get("AUTOSELECT") ?? "").toUpperCase() === "YES",
    });
  }
  return renditions;
}

/**
 * Describes an HLS rendition the way `formatSelection` describes a
 * `streamingData` entry, so both paths rank tracks by the same rule (English
 * original first, an automatic dub last, the upload's own audio when the video
 * has no English track at all).
 */
function toTrackFormat(rendition: HlsAudioRendition): MediaFormat {
  return {
    itag: rendition.itag,
    mimeType: 'audio/mp4; codecs="mp4a.40.5"',
    audioTrack: {
      id: rendition.language
        ? `${rendition.language}.${rendition.groupId ?? "0"}`
        : undefined,
      displayName: rendition.name,
      audioIsDefault: rendition.isDefault,
    },
  };
}

export function describeHlsRendition(
  rendition: HlsAudioRendition,
): TrackDescriptor {
  return describeTrack(toTrackFormat(rendition));
}

function hlsItagRank(rendition: HlsAudioRendition): number {
  const index = HLS_AUDIO_ITAG_ORDER.indexOf(rendition.itag ?? 0);
  return index === -1 ? HLS_AUDIO_ITAG_ORDER.length : index;
}

/**
 * The cheapest audio-only rendition of the preferred track.
 *
 * Track first (the language decides what the translation backend receives),
 * bitrate second (`itag 233` before `234`): every byte is paid for twice, once
 * on the way down from GVS and once on the way up to the backend.
 */
export function selectHlsAudioRendition(
  renditions: readonly HlsAudioRendition[],
): SelectedHlsRendition | undefined {
  let best: SelectedHlsRendition | undefined;
  let bestRank = Number.POSITIVE_INFINITY;
  let bestItagRank = Number.POSITIVE_INFINITY;
  for (const rendition of renditions) {
    const track = describeHlsRendition(rendition);
    const rank = rankTrack(track);
    const itagRank = hlsItagRank(rendition);
    if (rank > bestRank || (rank === bestRank && itagRank >= bestItagRank)) {
      continue;
    }
    bestRank = rank;
    bestItagRank = itagRank;
    best = {
      rendition,
      track,
      reason:
        rendition.itag === HLS_AUDIO_ITAG_ORDER[0]
          ? "lowest-bitrate hls audio"
          : "hls audio rendition",
    };
  }
  return best;
}

/** `#EXT-X-BYTERANGE:<length>[@<offset>]`, offsets continuing the previous one. */
function parseByteRange(
  value: string,
  previousEnd: number,
): { range: string; end: number } | undefined {
  const [rawLength, rawOffset] = value.split("@");
  const length = Number(rawLength);
  if (!(length > 0)) return undefined;
  const offset = rawOffset === undefined ? previousEnd : Number(rawOffset);
  if (!(offset >= 0)) return undefined;
  return {
    range: `bytes=${offset}-${offset + length - 1}`,
    end: offset + length,
  };
}

/** Segments (and the init segment) of one media playlist, in playback order. */
export function parseHlsMediaPlaylist(
  playlist: string,
  baseUrl: string,
): HlsMediaPlaylist {
  const segments: HlsSegment[] = [];
  let initSegment: HlsSegment | undefined;
  let pendingRange: string | undefined;
  let previousEnd = 0;
  for (const rawLine of playlist.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("#EXT-X-MAP:")) {
      const attributes = parseHlsAttributeList(line);
      const uri = resolveHlsUrl(attributes.get("URI") ?? "", baseUrl);
      if (!uri) continue;
      const rawRange = attributes.get("BYTERANGE");
      const parsed = rawRange ? parseByteRange(rawRange, 0) : undefined;
      initSegment = { url: uri, ...(parsed ? { range: parsed.range } : {}) };
      continue;
    }
    if (line.startsWith("#EXT-X-BYTERANGE:")) {
      const parsed = parseByteRange(
        line.slice("#EXT-X-BYTERANGE:".length),
        previousEnd,
      );
      if (parsed) {
        pendingRange = parsed.range;
        previousEnd = parsed.end;
      }
      continue;
    }
    if (line.startsWith("#")) continue;
    const url = resolveHlsUrl(line, baseUrl);
    if (!url) continue;
    segments.push({ url, ...(pendingRange ? { range: pendingRange } : {}) });
    pendingRange = undefined;
  }
  return { initSegment, segments };
}

/**
 * Attaches a GVS PO token to a manifest URL the way YouTube expects it: as a
 * `/pot/<token>` path segment, before a `/file/index.m3u8` or
 * `/playlist/index.m3u8` suffix (this is verbatim what yt-dlp's YouTube
 * extractor does for HLS and DASH manifests).
 *
 * HLS needs no token for any client this downloader speaks for, so this is
 * only ever used when a token happens to be available anyway.
 */
export function applyHlsPoToken(
  manifestUrl: string,
  poToken: string | undefined,
): string {
  if (!poToken || !URL.canParse(manifestUrl)) return manifestUrl;
  const url = new URL(manifestUrl);
  if (POT_PATH_PATTERN.test(url.pathname)) return url.toString();
  const match = MANIFEST_SUFFIX_PATTERN.exec(url.pathname);
  const path = (match?.[1] ?? url.pathname).replace(/\/+$/, "");
  url.pathname = `${path}/pot/${encodeURIComponent(poToken)}${match?.[2] ?? ""}`;
  return url.toString();
}

export type HlsAudioRequest = {
  readonly targetWindow: Window;
  readonly transport: MediaTransport;
  /** `streamingData.hlsManifestUrl` of a `player` answer. */
  readonly manifestUrl: string;
  readonly signal: AbortSignal;
  /** Optional, and never required: HLS is served without a token. */
  readonly poToken?: string;
};

async function fetchPlaylist(
  { targetWindow, transport, signal }: HlsAudioRequest,
  url: string,
): Promise<string> {
  const response = await fetchMediaResource({
    transport,
    targetWindow,
    url,
    signal,
    timeoutMs: PLAYLIST_TIMEOUT_MS,
  });
  if (!response.ok) {
    throw new Error(
      `Audio downloader. HLS playlist request failed (${response.status})`,
    );
  }
  const text = await response.text();
  if (!text.includes("#EXTM3U")) {
    throw new Error("Audio downloader. HLS playlist is not a playlist");
  }
  return text;
}

async function fetchSegment(
  { targetWindow, transport, signal }: HlsAudioRequest,
  segment: HlsSegment,
): Promise<Uint8Array> {
  const response = await fetchMediaResource({
    transport,
    targetWindow,
    url: segment.url,
    range: segment.range,
    signal,
  });
  if (!response.ok) {
    throw new Error(
      `Audio downloader. HLS segment request failed (${response.status})`,
    );
  }
  return new Uint8Array(await response.arrayBuffer());
}

/**
 * Resolves the media playlist of the wanted audio track.
 *
 * A manifest URL can already point at a media playlist (a rendition URL that
 * was handed over directly), in which case it is used as it is.
 */
async function resolveAudioPlaylist(request: HlsAudioRequest): Promise<{
  playlistUrl: string;
  playlist: string;
  selected?: SelectedHlsRendition;
}> {
  const manifestUrl = applyHlsPoToken(request.manifestUrl, request.poToken);
  const manifest = await fetchPlaylist(request, manifestUrl);
  if (!isHlsMasterPlaylist(manifest)) {
    return { playlistUrl: manifestUrl, playlist: manifest };
  }
  const renditions = parseHlsAudioRenditions(manifest, manifestUrl);
  const selected = selectHlsAudioRendition(renditions);
  if (!selected) {
    throw new Error(
      "Audio downloader. HLS manifest carries no audio-only rendition",
    );
  }
  const playlist = await fetchPlaylist(request, selected.rendition.uri);
  return { playlistUrl: selected.rendition.uri, playlist, selected };
}

/**
 * Streams the audio track of a YouTube HLS manifest.
 *
 * Segments are requested a few at a time but emitted strictly in order, so
 * the consumer can upload chunk `n` while chunk `n + 1` is still arriving,
 * and the resulting byte stream is a plain concatenation of the rendition's
 * segments — which is what an MPEG-TS/fMP4 audio track is.
 */
export async function* streamHlsAudio(
  request: HlsAudioRequest,
): AsyncGenerator<AudioChunk> {
  const { signal } = request;
  signal.throwIfAborted();
  const { playlistUrl, playlist, selected } =
    await resolveAudioPlaylist(request);
  const { initSegment, segments } = parseHlsMediaPlaylist(
    playlist,
    playlistUrl,
  );
  if (!segments.length) {
    throw new Error("Audio downloader. HLS playlist carries no segments");
  }
  const queue = initSegment ? [initSegment, ...segments] : [...segments];
  debug.log("Audio downloader. HLS audio selected", {
    itag: selected?.rendition.itag ?? readHlsItag(playlistUrl) ?? "unknown",
    reason: selected?.reason ?? "single rendition",
    track: selected?.track.key ?? "single",
    language: selected?.track.language ?? "unknown",
    content: selected?.track.content ?? "unknown",
    segments: segments.length,
    initSegment: Boolean(initSegment),
    hasPoToken: Boolean(request.poToken),
  });

  const accumulator = createChunkAccumulator(config.minChunkSize);
  const inFlight: Array<Promise<Uint8Array>> = [];
  let next = 0;
  const fill = () => {
    while (inFlight.length < SEGMENT_PARALLELISM && next < queue.length) {
      inFlight.push(fetchSegment(request, queue[next++]));
    }
  };

  try {
    fill();
    while (inFlight.length) {
      signal.throwIfAborted();
      const bytes = await (inFlight.shift() as Promise<Uint8Array>);
      fill();
      const chunk = accumulator.add(bytes);
      if (chunk) yield { buffer: chunk, isLastChunk: false };
    }
  } finally {
    // A consumer that stops early leaves the overlapping requests behind, and
    // their rejection is nobody's error.
    for (const pending of inFlight) void pending.catch(() => undefined);
  }

  if (!accumulator.received) {
    throw new Error("Audio downloader. Empty HLS audio");
  }
  debug.log("Audio downloader. HLS audio finished", {
    segments: queue.length,
    received: accumulator.received,
  });
  yield { buffer: accumulator.flush() ?? new Uint8Array(0), isLastChunk: true };
}
