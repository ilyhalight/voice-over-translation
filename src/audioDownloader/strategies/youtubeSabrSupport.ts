import { FormatXTags } from "googlevideo/protos";
import type { SabrFormat } from "googlevideo/shared-types";
import { base64ToU8, buildSabrFormat } from "googlevideo/utils";
import { createAbortableDelay } from "../../utils/abort";
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
import { selectYouTubeAudioFormat } from "./youtubeAudioSelection";
import { getTopPageWindow } from "./youtubePage";

export function toSabrFormat(
  format: WebEmbeddedFormat,
): SabrFormat | undefined {
  if (
    format.audioTrackId &&
    format.audioTrack?.id &&
    format.audioTrackId.toLowerCase() !== format.audioTrack.id.toLowerCase()
  )
    return;
  const itag = Number(format.itag);
  const bitrate = Number(format.bitrate ?? format.averageBitrate);
  const approxDurationMs = Number(format.approxDurationMs);
  const lastModified = String(format.lastModified ?? "");
  if (
    !Number.isSafeInteger(itag) ||
    itag <= 0 ||
    !Number.isFinite(bitrate) ||
    bitrate <= 0 ||
    !Number.isFinite(approxDurationMs) ||
    approxDurationMs <= 0 ||
    !lastModified
  )
    return;
  const converted = buildSabrFormat({
    ...format,
    itag,
    bitrate,
    lastModified,
    approxDurationMs: String(approxDurationMs),
    contentLength:
      format.contentLength === undefined
        ? undefined
        : String(format.contentLength),
    averageBitrate: Number(format.averageBitrate) || undefined,
    audioTrack: {
      ...format.audioTrack,
      id: format.audioTrackId ?? format.audioTrack?.id,
    },
    language: getAudioFormatLanguage(format) || undefined,
    isDrc: isDrcAudioFormat(format),
  });
  converted.hasAudio = Boolean(format.mimeType?.includes("audio/"));
  const tags = format.xtags
    ? FormatXTags.decode(base64ToU8(decodeURIComponent(format.xtags))).xtags
    : [];
  const directLanguage = getAudioFormatLanguage(format);
  const taggedLanguage = normalizeAudioLanguage(
    tags.find((tag) => tag.key === "lang")?.value,
  );
  const known = (value: string | undefined) =>
    value && value !== "und" && value !== "auto";
  if (
    known(directLanguage) &&
    known(taggedLanguage) &&
    !audioLanguageMatches(directLanguage, taggedLanguage || "")
  )
    return;
  converted.language = known(directLanguage)
    ? directLanguage
    : taggedLanguage || directLanguage || converted.language;
  converted.isDrc ||= tags.some(
    (tag) => tag.key === "drc" && tag.value === "1",
  );
  return converted;
}

export function selectSabrAudioFormat(
  formats: SabrFormat[],
  selectedTrackId?: string,
  requestedLanguage?: string,
): SabrFormat | undefined {
  const trackId = selectedTrackId?.trim().toLowerCase();
  const language = normalizeAudioLanguage(
    trackId ? sabrTrackLanguage(trackId) : requestedLanguage,
  );
  const knownLanguage = (value: unknown) => {
    const normalized = normalizeAudioLanguage(value);
    return normalized && normalized !== "und" && normalized !== "auto"
      ? normalized
      : undefined;
  };
  const eligible = formats.filter((format) => {
    if (!format.mimeType?.includes("audio/") || format.hasVideo) return false;
    const candidateId = format.audioTrackId?.trim().toLowerCase();
    if (trackId && candidateId && candidateId !== trackId) return false;
    if (language && language !== "auto") {
      const languages = [
        knownLanguage(format.language),
        candidateId ? knownLanguage(sabrTrackLanguage(candidateId)) : undefined,
      ];
      if (
        languages.some(
          (value) => value && !audioLanguageMatches(value, language),
        )
      )
        return false;
    }
    return true;
  });
  const exact = trackId
    ? eligible.filter(
        (format) => format.audioTrackId?.trim().toLowerCase() === trackId,
      )
    : [];
  const matching =
    language && language !== "auto"
      ? eligible.filter((format) => {
          const candidateLanguage =
            knownLanguage(format.language) ||
            (format.audioTrackId ? sabrTrackLanguage(format.audioTrackId) : "");
          return audioLanguageMatches(candidateLanguage, language);
        })
      : [];
  // Unknown metadata is usable only after excluding explicit track/language
  // conflicts. Never relabel a concrete foreign representation as the UI track.
  const candidates = exact.length
    ? exact
    : matching.length
      ? matching
      : eligible;
  return selectYouTubeAudioFormat(candidates);
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
