import type { SabrFormat } from "googlevideo/shared-types";
import { createAbortableDelay } from "../../utils/abort";
import debug from "../../utils/debug";
import {
  getYoutubeAudioFormatLanguage as getAudioFormatLanguage,
  normalizeAudioLanguageTag as normalizeAudioLanguage,
} from "../utils";
import {
  audioLanguageMatches,
  isDrcAudioFormat,
  type WebAbrWindow,
  type WebEmbeddedFormat,
} from "./webAbr";
import { getTopPageWindow } from "./youtubeSabrPlayer";

export function splitTopLevelProto(
  bytes: Uint8Array,
): Array<{ field: number; start: number; end: number }> {
  const out: Array<{ field: number; start: number; end: number }> = [];
  const readVarint = (offset: number) => {
    let value = 0;
    let shift = 0;
    let index = offset;
    while (index < bytes.length && shift <= 35) {
      const byte = bytes[index++];
      value += (byte & 0x7f) * 2 ** shift;
      if ((byte & 0x80) === 0) return { value, next: index };
      shift += 7;
    }
    throw new Error("invalid protobuf varint");
  };

  let offset = 0;
  while (offset < bytes.length) {
    const start = offset;
    const tag = readVarint(offset);
    offset = tag.next;
    const field = Math.floor(tag.value / 8);
    const wire = tag.value & 7;
    if (wire === 0) offset = readVarint(offset).next;
    else if (wire === 1) offset += 8;
    else if (wire === 2) {
      const length = readVarint(offset);
      offset = length.next + length.value;
    } else if (wire === 5) offset += 4;
    else throw new Error(`unsupported protobuf wire ${wire}`);
    if (offset > bytes.length) throw new Error("truncated protobuf field");
    out.push({ field, start, end: offset });
  }
  return out;
}

export function toSabrFormat(
  format: WebEmbeddedFormat,
): SabrFormat | undefined {
  const itag = Number(format.itag);
  const bitrate = Number(format.bitrate ?? format.averageBitrate);
  const approxDurationMs = Number(format.approxDurationMs);
  const lastModified = String(format.lastModified ?? "");
  if (!(itag > 0) || !(bitrate > 0) || !(approxDurationMs > 0) || !lastModified)
    return;
  const language = getAudioFormatLanguage(format) || undefined;
  return {
    itag,
    lastModified,
    xtags: format.xtags,
    width: format.width,
    height: format.height,
    contentLength: Number(format.contentLength) || undefined,
    audioTrackId: format.audioTrackId ?? format.audioTrack?.id,
    mimeType: format.mimeType,
    isDrc: isDrcAudioFormat(format),
    quality: format.quality,
    qualityLabel: format.qualityLabel,
    averageBitrate: Number(format.averageBitrate) || undefined,
    bitrate,
    audioQuality: format.audioQuality,
    approxDurationMs,
    language,
    isOriginal: format.audioTrack?.audioIsDefault === true,
  };
}

function describeError(error: unknown) {
  return {
    errorName: error instanceof Error ? error.name : typeof error,
    errorMessage: error instanceof Error ? error.message : String(error),
    errorStack: error instanceof Error ? error.stack : undefined,
    errorCause:
      error instanceof Error && "cause" in error
        ? String(error.cause)
        : undefined,
  };
}

function encodeProtoVarint(value: number): Uint8Array {
  const out: number[] = [];
  let current = Math.max(0, Math.floor(value));
  do {
    let byte = current % 128;
    current = Math.floor(current / 128);
    if (current > 0) byte |= 0x80;
    out.push(byte);
  } while (current > 0);
  return new Uint8Array(out);
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const size = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
}

function readProtoVarintAt(
  bytes: Uint8Array,
  offset: number,
): { value: number; next: number } {
  let value = 0;
  let shift = 0;
  let cursor = offset;
  while (cursor < bytes.length && shift <= 49) {
    const byte = bytes[cursor++];
    value += (byte & 0x7f) * 2 ** shift;
    if ((byte & 0x80) === 0) return { value, next: cursor };
    shift += 7;
  }
  throw new Error("invalid protobuf varint");
}

/**
 * SABR-only: set ClientAbrState.audioTrackId (nested field 69 inside
 * VideoPlaybackAbrRequest field 1). We keep SabrStream's generated ABR state
 * authoritative and only add/replace the concrete YouTube audio track id.
 *
 * Native requests observed on multi-audio videos carry values such as
 * "ar.10", "de-DE.10" and "en-US.4" in this field.
 */
export function setGeneratedSabrAudioTrackId(
  generated: Uint8Array,
  trackId: string,
): Uint8Array {
  const topLevel = splitTopLevelProto(generated);
  const encodedTrackId = new TextEncoder().encode(trackId);
  const trackField = concatBytes([
    encodeProtoVarint((69 << 3) | 2),
    encodeProtoVarint(encodedTrackId.byteLength),
    encodedTrackId,
  ]);

  const chunks: Uint8Array[] = [];
  let replacedClientAbrState = false;

  for (const part of topLevel) {
    if (part.field !== 1 || replacedClientAbrState) {
      chunks.push(generated.slice(part.start, part.end));
      continue;
    }

    const tag = readProtoVarintAt(generated, part.start);
    const length = readProtoVarintAt(generated, tag.next);
    const payloadStart = length.next;
    const payloadEnd = payloadStart + length.value;
    if (payloadEnd > part.end) throw new Error("truncated ClientAbrState");

    const payload = generated.slice(payloadStart, payloadEnd);
    const fields = splitTopLevelProto(payload);
    const payloadChunks = fields
      .filter((field) => field.field !== 69)
      .map((field) => payload.slice(field.start, field.end));
    payloadChunks.push(new Uint8Array(trackField));
    const patchedPayload = concatBytes(payloadChunks);

    chunks.push(
      concatBytes([
        encodeProtoVarint((1 << 3) | 2),
        encodeProtoVarint(patchedPayload.byteLength),
        patchedPayload,
      ]),
    );
    replacedClientAbrState = true;
  }

  if (!replacedClientAbrState) {
    throw new Error("SABR ClientAbrState field is unavailable");
  }
  return concatBytes(chunks);
}

type YouTubeRuntimeAudioTrack = {
  id?: string;
  xtags?: string;
  wM?: {
    id?: string;
    name?: string;
    isDefault?: boolean;
    isAutoDubbed?: boolean;
    getId?: () => string;
    getName?: () => string;
  };
  captionTracks?: Array<{ kind?: string; languageCode?: string }>;
};

function getYouTubeRuntimeAudioTracks(
  targetWindow: WebAbrWindow,
): YouTubeRuntimeAudioTrack[] {
  try {
    const pageWindow = getTopPageWindow(targetWindow);
    const player = pageWindow.document.querySelector("#movie_player") as
      | (HTMLElement & { getAvailableAudioTracks?: () => unknown })
      | null;
    const value = player?.getAvailableAudioTracks?.();
    return Array.isArray(value)
      ? value.filter((track): track is YouTubeRuntimeAudioTrack =>
          Boolean(track && typeof track === "object"),
        )
      : [];
  } catch {
    return [];
  }
}

function getRuntimeAudioTrackId(
  track: YouTubeRuntimeAudioTrack,
): string | undefined {
  let methodId: string | undefined;
  try {
    methodId = track.wM?.getId?.();
  } catch {}
  const id = typeof methodId === "string" ? methodId : track.wM?.id;
  return typeof id === "string" &&
    /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?\.\d{1,3}$/.test(id)
    ? id
    : undefined;
}

type YouTubeSabrTrackDiscovery = {
  trackId: string;
  raw?: object;
  source: string;
};

function collectYouTubeSabrTrackDiscoveries(
  targetWindow: WebAbrWindow,
): YouTubeSabrTrackDiscovery[] {
  const pageWindow = getTopPageWindow(targetWindow);
  const roots: Array<{ value: unknown; source: string }> = [];
  const addRoot = (value: unknown, source: string) => {
    if (value != null) roots.push({ value, source });
  };

  try {
    addRoot(pageWindow.ytInitialPlayerResponse, "ytInitialPlayerResponse");
  } catch {
    // Ignore sandbox visibility failures.
  }

  try {
    const player = pageWindow.document.querySelector("#movie_player") as
      | (HTMLElement &
          Record<string, unknown> & {
            getPlayerResponse?: () => unknown;
            getAudioTrack?: () => unknown;
            getAudioTrackList?: () => unknown;
            getAvailableAudioTracks?: () => unknown;
            getOption?: (namespace: string, key: string) => unknown;
          })
      | null;

    if (player) {
      for (const getter of [
        "getPlayerResponse",
        "getAudioTrack",
        "getAudioTrackList",
        "getAvailableAudioTracks",
      ] as const) {
        try {
          const fn = player[getter];
          if (typeof fn === "function") {
            addRoot(fn.call(player), `player.${getter}()`);
          }
        } catch {
          // Private player APIs vary by WEB/MWEB build.
        }
      }

      // This is important for multi-audio YouTube videos. On current WEB/MWEB
      // builds the concrete ids (ar.10, de-DE.10, en-US.4, ...) can be absent
      // from /player adaptiveFormats and the public-ish audio getters, while
      // still being exposed through getOption/internal player state.
      if (typeof player.getOption === "function") {
        for (const [namespace, key] of [
          ["audio", "tracklist"],
          ["audio", "track"],
        ] as const) {
          try {
            addRoot(
              player.getOption(namespace, key),
              `player.getOption(${namespace},${key})`,
            );
          } catch {
            // Keep scanning other runtime state.
          }
        }
      }

      for (const key of [
        "playerData",
        "playerResponse",
        "audioTracks",
        "tracklist",
        "config",
      ] as const) {
        try {
          addRoot(player[key], `player.${key}`);
        } catch {
          // Some private properties can throw through page wrappers.
        }
      }
    }
  } catch {
    // Ignore inaccessible page DOM.
  }

  const trackIdPattern = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?\.\d{1,3}$/;
  const found = new Map<string, YouTubeSabrTrackDiscovery>();
  const seen = new WeakSet<object>();
  let visited = 0;

  const walk = (
    value: unknown,
    depth: number,
    path: string,
    source: string,
  ) => {
    if (value == null || depth > 9 || visited > 30000) return;

    if (typeof value === "string") {
      if (trackIdPattern.test(value) && /audio/i.test(`${source}:${path}`)) {
        found.set(`${value}|${source}|${path}`, {
          trackId: value,
          source: `${source}:${path}`,
        });
      }
      return;
    }

    if (typeof value !== "object") return;
    if (seen.has(value as object)) return;
    seen.add(value as object);
    visited += 1;

    const record = value as Record<string, unknown>;
    for (const key of ["trackId", "audioTrackId", "id"] as const) {
      const id = record[key];
      if (
        typeof id === "string" &&
        trackIdPattern.test(id) &&
        (/audio/i.test(`${source}:${path}`) || key === "audioTrackId")
      ) {
        found.set(`${id}|${source}|${path}`, {
          trackId: id,
          raw: value as object,
          source: `${source}:${path}`,
        });
      }
    }

    const nestedAudioTrack = record.audioTrack;
    if (nestedAudioTrack && typeof nestedAudioTrack === "object") {
      const nestedId = (nestedAudioTrack as Record<string, unknown>).id;
      if (typeof nestedId === "string" && trackIdPattern.test(nestedId)) {
        found.set(`${nestedId}|${source}|${path}.audioTrack`, {
          trackId: nestedId,
          raw: nestedAudioTrack as object,
          source: `${source}:${path}.audioTrack`,
        });
      }
    }

    let entries: [string, unknown][];
    try {
      entries = Array.isArray(value)
        ? value.slice(0, 400).map((child, index) => [String(index), child])
        : Object.entries(record).slice(0, 400);
    } catch {
      return;
    }

    for (const [key, child] of entries) {
      if (typeof child === "function") continue;
      walk(child, depth + 1, path ? `${path}.${key}` : key, source);
    }
  };

  for (const root of roots) walk(root.value, 0, "", root.source);
  return [...found.values()];
}

function collectYouTubeSabrTrackIds(targetWindow: WebAbrWindow): string[] {
  const runtimeIds = getYouTubeRuntimeAudioTracks(targetWindow)
    .map(getRuntimeAudioTrackId)
    .filter((id): id is string => Boolean(id));
  if (runtimeIds.length > 0) return [...new Set(runtimeIds)].sort();
  return [
    ...new Set(
      collectYouTubeSabrTrackDiscoveries(targetWindow).map(
        (entry) => entry.trackId,
      ),
    ),
  ].sort();
}

export function switchYouTubeSabrAudioTrack(
  targetWindow: WebAbrWindow,
  trackId: string,
): boolean {
  const pageWindow = getTopPageWindow(targetWindow);
  try {
    const player = pageWindow.document.querySelector("#movie_player") as
      | (HTMLElement & {
          getAudioTrack?: () => unknown;
          setAudioTrack?: (track: unknown) => unknown;
        })
      | null;
    if (!player || typeof player.setAudioTrack !== "function") return false;
    const exact = getYouTubeRuntimeAudioTracks(targetWindow).find(
      (track) => getRuntimeAudioTrackId(track) === trackId,
    );
    if (!exact) return false;
    const current = player.getAudioTrack?.() as
      | YouTubeRuntimeAudioTrack
      | undefined;
    if (current && getRuntimeAudioTrackId(current) === trackId) return true;
    player.setAudioTrack(exact);
    return true;
  } catch {
    return false;
  }
}

/**
 * Languages that SABR may use as an alternative source audio track.
 *
 * Keep this list local on purpose: alternative SABR selection must not expand
 * automatically when the global VOT language list changes.
 *
 * Visible as supported source languages in the supplied VOT UI:
 * Russian, English, Chinese, Korean, French, Italian, Spanish, German, Japanese.
 *
 * Add any other explicitly allowed source language here by its BCP-47/base code.
 */
const SABR_ALTERNATIVE_SOURCE_LANGUAGES = [
  "ru",
  "en",
  "zh",
  "ko",
  "fr",
  "it",
  "es",
  "de",
  "ja",
] as const;

const VOT_SUPPORTED_SABR_SOURCE_LANGUAGES = new Set<string>(
  SABR_ALTERNATIVE_SOURCE_LANGUAGES.map((language) =>
    normalizeAudioLanguage(language),
  ).filter(Boolean),
);

export function sabrTrackLanguage(trackId: string): string {
  return normalizeAudioLanguage(trackId.replace(/\.\d+$/, ""));
}

function isVotSupportedSabrTrack(trackId: string): boolean {
  const language = sabrTrackLanguage(trackId);
  if (!language) return false;
  if (VOT_SUPPORTED_SABR_SOURCE_LANGUAGES.has(language)) return true;
  const base = language.split("-")[0];
  return [...VOT_SUPPORTED_SABR_SOURCE_LANGUAGES].some(
    (supported) => supported.split("-")[0] === base,
  );
}

type CurrentYouTubeAudioEvidence = {
  language?: string;
  trackId?: string;
  representationId?: string;
  source: "track-id" | "track-language" | "default-asr" | "unknown";
  isDefault?: boolean;
  isAutoDubbed?: boolean;
  asrLanguages: string[];
};

function isVotSupportedAudioLanguage(language: string | undefined): boolean {
  const normalized = normalizeAudioLanguage(language);
  if (!normalized) return false;
  if (VOT_SUPPORTED_SABR_SOURCE_LANGUAGES.has(normalized)) return true;
  const base = normalized.split("-")[0];
  return [...VOT_SUPPORTED_SABR_SOURCE_LANGUAGES].some(
    (supported) => supported.split("-")[0] === base,
  );
}

/**
 * Read the audio track that the native YouTube player is actually playing.
 *
 * Ordinary single-audio videos frequently expose the track itself as `und` and
 * leave adaptiveFormats language-less. In that case YouTube still attaches its
 * ASR captions to getAudioTrack().captionTracks. A single ASR language on the
 * default, non-auto-dubbed track is strong evidence for the language of the
 * original audio (e.g. und + Default + ASR pt => Portuguese original).
 *
 * Be deliberately conservative: translated/manual captions are never used as
 * audio-language evidence, and ambiguous ASR languages produce no decision.
 */
function getCurrentYouTubeAudioEvidence(
  targetWindow: WebAbrWindow,
): CurrentYouTubeAudioEvidence {
  try {
    const pageWindow = getTopPageWindow(targetWindow);
    const moviePlayer = pageWindow.document.querySelector("#movie_player") as
      | (HTMLElement & { getAudioTrack?: () => unknown })
      | null;
    if (!moviePlayer || typeof moviePlayer.getAudioTrack !== "function") {
      return { source: "unknown", asrLanguages: [] };
    }

    const raw = moviePlayer.getAudioTrack() as
      | {
          id?: unknown;
          language?: unknown;
          languageCode?: unknown;
          xtags?: unknown;
          wM?: {
            id?: unknown;
            language?: unknown;
            languageCode?: unknown;
            isDefault?: unknown;
            isAutoDubbed?: unknown;
          };
          captionTracks?: Array<{
            kind?: unknown;
            languageCode?: unknown;
          }>;
        }
      | undefined;
    if (!raw) return { source: "unknown", asrLanguages: [] };

    const isDefault = raw.wM?.isDefault === true;
    const isAutoDubbed = raw.wM?.isAutoDubbed === true;
    const representationId =
      typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : undefined;
    const concreteTrackId =
      typeof raw.wM?.id === "string" &&
      /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?\.\d{1,3}$/.test(raw.wM.id.trim())
        ? raw.wM.id.trim()
        : undefined;

    // Only wM.id is a logical YouTube audioTrackId. raw.id is a media
    // representation identity (for example `251;<attrs>`) and must never be
    // fed back into ClientAbrState.audioTrackId.
    if (concreteTrackId) {
      return {
        language: sabrTrackLanguage(concreteTrackId),
        trackId: concreteTrackId,
        representationId,
        source: "track-id",
        isDefault,
        isAutoDubbed,
        asrLanguages: [],
      };
    }

    const directLanguage = [
      raw.languageCode,
      raw.language,
      raw.wM?.languageCode,
      raw.wM?.language,
    ]
      .filter((value): value is string => typeof value === "string")
      .map(normalizeAudioLanguage)
      .find((value) => value && value !== "und" && value !== "auto");
    if (directLanguage) {
      return {
        language: directLanguage,
        trackId: concreteTrackId,
        representationId,
        source: "track-language",
        isDefault,
        isAutoDubbed,
        asrLanguages: [],
      };
    }

    const asrLanguages = [
      ...new Set(
        (raw.captionTracks ?? [])
          .filter((caption) => caption?.kind === "asr")
          .map((caption) =>
            typeof caption.languageCode === "string"
              ? normalizeAudioLanguage(caption.languageCode)
              : "",
          )
          .filter(
            (language) => language && language !== "und" && language !== "auto",
          ),
      ),
    ];

    // Only infer from ASR for the ordinary original/default track. Auto-dubbed
    // tracks must have their own concrete language evidence instead.
    if (isDefault && !isAutoDubbed && asrLanguages.length === 1) {
      return {
        language: asrLanguages[0],
        trackId: concreteTrackId,
        representationId,
        source: "default-asr",
        isDefault,
        isAutoDubbed,
        asrLanguages,
      };
    }

    return {
      trackId: concreteTrackId,
      representationId,
      source: "unknown",
      isDefault,
      isAutoDubbed,
      asrLanguages,
    };
  } catch {
    return { source: "unknown", asrLanguages: [] };
  }
}

export function assertYouTubeAudioIsUsefulForVot(
  targetWindow: WebAbrWindow,
  videoId: string,
  requestedLanguage?: string,
): void {
  const evidence = getCurrentYouTubeAudioEvidence(targetWindow);
  const actual = normalizeAudioLanguage(evidence.language);
  const requested = normalizeAudioLanguage(requestedLanguage);

  debug.log("Audio downloader. current YouTube audio evidence", {
    videoId,
    requestedLanguage: requested || undefined,
    actualLanguage: actual || undefined,
    trackId: evidence.trackId,
    representationId: evidence.representationId,
    source: evidence.source,
    isDefault: evidence.isDefault,
    isAutoDubbed: evidence.isAutoDubbed,
    asrLanguages: evidence.asrLanguages,
  });

  if (!actual) return;

  const runtimeTrackIds = getYouTubeRuntimeAudioTracks(targetWindow)
    .map(getRuntimeAudioTrackId)
    .filter((id): id is string => Boolean(id));
  const requestedConcreteTrack =
    requested && requested !== "auto"
      ? runtimeTrackIds.find((id) =>
          audioLanguageMatches(sabrTrackLanguage(id), requested),
        )
      : undefined;
  const supportedAlternate = runtimeTrackIds.find(isVotSupportedSabrTrack);

  if (!isVotSupportedAudioLanguage(actual)) {
    // A concrete requested language may only be satisfied by that language.
    // An arbitrary supported alternate is valid only for auto/no-language mode.
    if (requested && requested !== "auto") {
      if (requestedConcreteTrack) return;
    } else if (supportedAlternate) {
      return;
    }
    throw new Error(
      `Audio downloader. refusing audio download/upload: native YouTube audio language ${actual} ` +
        `is not supported by VOT/Yandex and no supported YouTube alternate audio track is available ` +
        `(evidence: ${evidence.source})`,
    );
  }

  if (
    requested &&
    requested !== "auto" &&
    !audioLanguageMatches(actual, requested)
  ) {
    if (requestedConcreteTrack) return;
    throw new Error(
      `Audio downloader. refusing audio download/upload: requested ${requested}, but native YouTube audio is ${actual} ` +
        `and no matching YouTube audio track is available (evidence: ${evidence.source})`,
    );
  }
}

export type WebAbrResolvedAudioLanguage = {
  videoId: string;
  requestedLanguage?: string;
  actualLanguage?: string;
  trackId?: string;
  selection:
    | "ui-language"
    | "supported-alternative"
    | "native-only"
    | "native-auto";
};

export const WEB_ABR_RESOLVED_AUDIO_LANGUAGES = new Map<
  string,
  WebAbrResolvedAudioLanguage
>();

export function getWebAbrResolvedAudioLanguage(
  videoId: string,
): WebAbrResolvedAudioLanguage | undefined {
  return WEB_ABR_RESOLVED_AUDIO_LANGUAGES.get(videoId);
}

function resolveSabrAudioTrackId(
  targetWindow: WebAbrWindow,
  requestedLanguage?: string,
): {
  trackId?: string;
  availableTrackIds: string[];
  supportedAlternativeTrackIds: string[];
  usedSupportedAlternative: boolean;
} {
  const requested = normalizeAudioLanguage(requestedLanguage);
  const availableTrackIds = collectYouTubeSabrTrackIds(targetWindow);
  const supportedAlternativeTrackIds = availableTrackIds.filter(
    isVotSupportedSabrTrack,
  );

  if (!requested || requested === "auto") {
    return {
      availableTrackIds,
      supportedAlternativeTrackIds,
      usedSupportedAlternative: false,
    };
  }

  if (availableTrackIds.length === 0) {
    return {
      availableTrackIds,
      supportedAlternativeTrackIds,
      usedSupportedAlternative: false,
    };
  }

  const exact = availableTrackIds.find(
    (trackId) => sabrTrackLanguage(trackId) === requested,
  );
  if (exact) {
    return {
      trackId: exact,
      availableTrackIds,
      supportedAlternativeTrackIds,
      usedSupportedAlternative: false,
    };
  }

  const requestedBase = requested.split("-")[0];
  const baseMatches = availableTrackIds.filter(
    (trackId) => sabrTrackLanguage(trackId).split("-")[0] === requestedBase,
  );

  if (baseMatches.length === 1) {
    return {
      trackId: baseMatches[0],
      availableTrackIds,
      supportedAlternativeTrackIds,
      usedSupportedAlternative: false,
    };
  }

  if (baseMatches.length > 1) {
    throw new Error(
      `Audio downloader. SABR audio language ${requestedLanguage} is ambiguous ` +
        `(matches: ${baseMatches.join(", ")})`,
    );
  }

  // The requested YouTube track is absent. webAbr must not choose a different
  // translation language. videoManager is responsible for selecting a concrete
  // supported source language before calling webAbr.
  return {
    availableTrackIds,
    supportedAlternativeTrackIds,
    usedSupportedAlternative: false,
  };
}

export async function waitForSabrAudioTrackId(
  targetWindow: WebAbrWindow,
  signal: AbortSignal,
  requestedLanguage?: string,
  timeoutMs = 2000,
): Promise<ReturnType<typeof resolveSabrAudioTrackId>> {
  const requested = normalizeAudioLanguage(requestedLanguage);
  if (!requested || requested === "auto") {
    return resolveSabrAudioTrackId(targetWindow, requestedLanguage);
  }

  const startedAt = Date.now();
  let lastAvailable: string[] = [];

  while (Date.now() - startedAt < timeoutMs) {
    signal.throwIfAborted();
    const resolved = resolveSabrAudioTrackId(targetWindow, requestedLanguage);
    lastAvailable = resolved.availableTrackIds;
    if (resolved.trackId) return resolved;
    await createAbortableDelay(250, signal);
  }

  // YouTube does not expose runtime audio track IDs for ordinary single-audio
  // videos. In that case there is no multi-audio choice to enforce, so keep the
  // proven native SABR/default-track path. Strict matching is required only once
  // YouTube actually exposes one or more concrete multi-audio track IDs.
  if (lastAvailable.length === 0) {
    return {
      availableTrackIds: [],
      supportedAlternativeTrackIds: [],
      usedSupportedAlternative: false,
    };
  }

  throw new Error(
    `Audio downloader. SABR could not resolve requested audio language ${requestedLanguage} ` +
      `to a YouTube trackId within ${timeoutMs}ms ` +
      `(available: ${lastAvailable.join(", ")})`,
  );
}

type VotNativeProtoContext = {
  videoId: string;
  sabrAudioTrackId?: string;
  buildIndex: number;
  pageWindow: WebAbrWindow;
};

// Context must belong to a SabrStream INSTANCE, not SabrStream.prototype.
// YouTube SPA navigation can leave the previous stream alive briefly.
export const VOT_SABR_INSTANCE_CONTEXT = new WeakMap<
  object,
  VotNativeProtoContext
>();
