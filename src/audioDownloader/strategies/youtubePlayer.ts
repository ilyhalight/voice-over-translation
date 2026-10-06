import { config } from "@vot.js/shared";
import type { SabrFormat } from "googlevideo/shared-types";
import { createAbortableDelay } from "../../utils/abort";
import debug from "../../utils/debug";
import {
  getYoutubeAudioFormatLanguage as getAudioFormatLanguage,
  normalizeAudioLanguageTag as normalizeAudioLanguage,
} from "../utils";
import { requestSafariPagePoToken } from "./safariPageBridge";

export { getAudioFormatLanguage, normalizeAudioLanguage };

import type { AudioChunk } from "./audioChunks";
import { preprocessYouTubePlayer } from "./ytPlayerSolver";

const MEDIA_RANGE_SIZES = [60_000, 80_000, 150_000, 330_000, 460_000];

type YouTubeConfig = {
  data_?: Record<string, unknown>;
  get?: (key: string) => unknown;
};

export type WebAbrWindow = Window & {
  ytcfg?: YouTubeConfig;
  _yt_player?: Record<string, unknown>;
  ytInitialPlayerResponse?: WebEmbeddedPlayerResponse;
};

type PageUrlInstance = {
  set?: (key: string, value: string) => void;
  get?: (key: string) => string | null;
  [key: string]: unknown;
};

type PageUrlClass = new (...args: unknown[]) => PageUrlInstance;

export type WebEmbeddedFormat = {
  itag?: number;
  url?: string;
  mimeType?: string;
  bitrate?: number;
  averageBitrate?: number;
  contentLength?: string | number;
  lastModified?: string;
  signatureCipher?: string;
  audioQuality?: string;
  language?: string;
  languageCode?: string;
  audioTrackId?: string;
  audioSampleRate?: string;
  audioChannels?: number;
  displayName?: string;
  xtags?: string;
  approxDurationMs?: string | number;
  quality?: string;
  qualityLabel?: string;
  width?: number;
  height?: number;
  audioTrack?: {
    id?: string;
    languageCode?: string;
    language?: string;
    displayName?: string;
    audioIsDefault?: boolean;
  };
};

type WebEmbeddedPlayerResponse = {
  responseContext?: {
    mainAppWebResponseContext?: { datasyncId?: string };
  };
  videoDetails?: { videoId?: string };
  playabilityStatus?: {
    status?: string;
    reason?: string;
    messages?: string[];
  };
  streamingData?: {
    adaptiveFormats?: WebEmbeddedFormat[];
    formats?: WebEmbeddedFormat[];
    serverAbrStreamingUrl?: string;
  };
  playerConfig?: {
    mediaCommonConfig?: {
      mediaUstreamerRequestConfig?: {
        videoPlaybackUstreamerConfig?: string;
      };
    };
  };
};

export function buildMediaRanges(
  contentLength: number,
): { start: number; end: number }[] {
  if (!Number.isInteger(contentLength) || contentLength < 1) return [];
  const ranges: { start: number; end: number }[] = [];
  let start = 0;
  let sizeIndex = 0;
  while (start < contentLength) {
    const size = MEDIA_RANGE_SIZES[sizeIndex] ?? MEDIA_RANGE_SIZES.at(-1) ?? 1;
    const end = Math.min(contentLength - 1, start + size - 1);
    ranges.push({ start, end });
    start = end + 1;
    if (sizeIndex < MEDIA_RANGE_SIZES.length - 1) sizeIndex++;
  }
  return ranges;
}

export async function mintPagePoToken(
  pageWindow: WebAbrWindow,
  binding: string,
  signal: AbortSignal,
): Promise<string | undefined> {
  // GVS PO-token minting lives in YouTube's page realm. Userscript sandboxes
  // (especially Firefox) may hide bevasrsg/wpc even though the native player
  // can mint the token. Resolve the same main/top realm used by SABR capture.
  const mainWindow = getTopPageWindow(pageWindow);
  const realms = new Set<WebAbrWindow>([mainWindow]);
  if (mainWindow !== pageWindow) realms.add(pageWindow);
  try {
    realms.add(mainWindow.parent as WebAbrWindow);
    realms.add(mainWindow.top as WebAbrWindow);
  } catch {
    // Cross-origin access is denied.
  }
  debug.log("[VOT][PO_TOKEN] mint started", {
    bindingLength: binding.length,
    realmCount: realms.size,
  });

  for (const realm of realms) {
    let keys: string[];
    try {
      keys = Object.getOwnPropertyNames(realm).filter(
        (key) => key === "bevasrsg" || key.startsWith("havuokmhhs-"),
      );
    } catch {
      continue;
    }
    for (const key of keys) {
      let bevasrs: { wpc?: unknown } | undefined;
      try {
        bevasrs = (
          (realm as unknown as Record<string, unknown>)[key] as {
            bevasrs?: { wpc?: unknown };
          }
        )?.bevasrs;
      } catch {
        continue;
      }
      const wpc = bevasrs?.wpc;
      if (typeof wpc !== "function") continue;
      for (let attempt = 0; attempt < 10; attempt++) {
        if (signal.aborted) throw signal.reason;
        try {
          const minter = await wpc.call(bevasrs);
          const token = await minter?.mws?.({
            c: binding,
            mc: false,
            me: false,
          });
          if (typeof token === "string" && token) {
            debug.log("[VOT][PO_TOKEN] mint success", {
              tokenLength: token.length,
              provider: key,
              attempt,
            });
            return token;
          }

          debug.log("[VOT][PO_TOKEN] mint returned no token", {
            provider: key,
            attempt,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          debug.log("[VOT][PO_TOKEN] mint attempt failed", {
            provider: key,
            attempt,
            message,
          });
          if (!message.includes("SDF:notready")) break;
        }
        await createAbortableDelay(500, signal);
      }
    }
  }

  debug.error("[VOT][PO_TOKEN] direct mint failed", {
    bindingLength: binding.length,
    realmCount: realms.size,
  });

  // Safari Userscripts runs granted scripts in an isolated/content realm.
  // YouTube's PO-token provider lives in the real page realm, so use the
  // embedded page bridge only on Safari. Other browsers keep the old path.
  const safariToken = await requestSafariPagePoToken(binding, signal);
  if (safariToken) {
    debug.log("[VOT][PO_TOKEN] Safari page-realm mint success", {
      tokenLength: safariToken.length,
    });
    return safariToken;
  }

  debug.error("[VOT][PO_TOKEN] mint failed", {
    bindingLength: binding.length,
    realmCount: realms.size,
  });
  return undefined;
}

export function selectGvsPoTokenBinding(
  videoId: string,
  options: {
    loggedIn: boolean;
    dataSyncId: unknown;
    visitorData: unknown;
    experimentFlags: string[];
  },
): { kind: "video" | "datasync" | "visitor"; value: string } | undefined {
  if (
    options.experimentFlags.some(
      (flags) =>
        new URLSearchParams(flags)
          .getAll("html5_generate_content_po_token")
          .at(-1) === "true",
    )
  ) {
    debug.log("[VOT][WEB_CREATOR] selecting GVS PO binding", {
      kind: "video",
      loggedIn: options.loggedIn,
      hasDataSyncId:
        typeof options.dataSyncId === "string" && Boolean(options.dataSyncId),
      reason: "html5_generate_content_po_token",
    });
    return { kind: "video", value: videoId };
  }

  if (
    options.loggedIn &&
    typeof options.dataSyncId === "string" &&
    options.dataSyncId
  ) {
    debug.log("[VOT][WEB_CREATOR] selecting GVS PO binding", {
      kind: "datasync",
      loggedIn: true,
      hasDataSyncId: true,
    });
    return { kind: "datasync", value: options.dataSyncId };
  }

  if (typeof options.visitorData === "string" && options.visitorData) {
    debug.log("[VOT][WEB_CREATOR] selecting GVS PO binding", {
      kind: "visitor",
      loggedIn: options.loggedIn,
      hasDataSyncId:
        typeof options.dataSyncId === "string" && Boolean(options.dataSyncId),
    });
    return { kind: "visitor", value: options.visitorData };
  }

  debug.error("[VOT][WEB_CREATOR] no GVS PO binding available", {
    loggedIn: options.loggedIn,
    hasDataSyncId:
      typeof options.dataSyncId === "string" && Boolean(options.dataSyncId),
    hasVisitorData:
      typeof options.visitorData === "string" && Boolean(options.visitorData),
  });
  return undefined;
}

export function getConfigValue(config: YouTubeConfig, key: string): unknown {
  return config.get?.(key) ?? config.data_?.[key];
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

function findJsonValueEnd(source: string, start: number): number {
  const first = source[start];
  if (first !== "{" && first !== "[" && first !== '"') return -1;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index++) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') {
        inString = false;
        if (depth === 0) return index + 1;
      }
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{" || char === "[") depth++;
    else if ((char === "}" || char === "]") && --depth === 0) return index + 1;
  }
  return -1;
}

// The page keeps its config in the ytcfg global, which a sandboxed userscript
// realm cannot read. Both calling forms carry plain JSON, so the same inline
// script that builds ytcfg can be replayed from its source text instead.
export function parseYtcfgData(source: string): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const pattern = /ytcfg\s*\.\s*set\s*\(/g;
  const skipSpaces = (index: number) => {
    while (index < source.length && /\s/.test(source[index] ?? "")) index++;
    return index;
  };
  for (let cursor = 0; cursor <= source.length; ) {
    pattern.lastIndex = cursor;
    const match = pattern.exec(source);
    if (!match) break;
    cursor = match.index + match[0].length;
    const start = skipSpaces(cursor);
    const end = findJsonValueEnd(source, start);
    if (end < 0) continue;
    try {
      const argument = JSON.parse(source.slice(start, end)) as unknown;
      if (argument && typeof argument === "object") {
        if (Array.isArray(argument)) continue;
        Object.assign(data, argument);
        cursor = end;
        continue;
      }
      if (typeof argument !== "string") continue;
      // ytcfg.set("KEY", value) assigns a single entry.
      const separator = skipSpaces(end);
      if (source[separator] !== ",") continue;
      const valueStart = skipSpaces(separator + 1);
      const jsonEnd = findJsonValueEnd(source, valueStart);
      const valueEnd = jsonEnd < 0 ? source.indexOf(")", valueStart) : jsonEnd;
      if (valueEnd < 0) continue;
      data[argument] = JSON.parse(source.slice(valueStart, valueEnd).trim());
      cursor = valueEnd;
    } catch {
      // Calls with non-JSON arguments are page code we cannot replay.
    }
  }
  return data;
}

function readInitialPlayerResponseFromDocument(
  targetWindow: Window,
): WebEmbeddedPlayerResponse | undefined {
  let scripts: HTMLScriptElement[] = [];
  try {
    scripts = [
      ...targetWindow.document.querySelectorAll<HTMLScriptElement>(
        "script:not([src])",
      ),
    ];
  } catch {
    return;
  }
  const markers = [
    "ytInitialPlayerResponse =",
    "ytInitialPlayerResponse=",
    "var ytInitialPlayerResponse =",
    "var ytInitialPlayerResponse=",
  ];
  for (const script of scripts) {
    const source = script.textContent;
    if (!source?.includes("ytInitialPlayerResponse")) continue;
    for (const marker of markers) {
      const markerIndex = source.indexOf(marker);
      if (markerIndex < 0) continue;
      const start = source.indexOf("{", markerIndex + marker.length);
      if (start < 0) continue;
      const end = findJsonValueEnd(source, start);
      if (end < 0) continue;
      try {
        return JSON.parse(
          source.slice(start, end),
        ) as WebEmbeddedPlayerResponse;
      } catch {
        // Keep scanning other inline scripts/assignment forms.
      }
    }
  }
}

function getMainWorldWindow(targetWindow: WebAbrWindow): WebAbrWindow {
  // Tampermonkey/Violentmonkey can expose the real page global as unsafeWindow.
  // Firefox userscript sandboxes can expose the underlying page object through
  // wrappedJSObject. Prefer those objects so Request/fetch are patched in the
  // same realm as YouTube's native MWEB player.
  try {
    // Firefox userscript managers expose the real page global as the lexical
    // `unsafeWindow`; it is not guaranteed to be a property of globalThis.
    if (typeof unsafeWindow !== "undefined" && unsafeWindow) {
      const unsafe = unsafeWindow as WebAbrWindow;
      if (
        unsafe.document &&
        unsafe.location?.hostname.endsWith("youtube.com")
      ) {
        return unsafe;
      }
    }
  } catch {}

  try {
    const unsafe = (
      globalThis as typeof globalThis & {
        unsafeWindow?: WebAbrWindow;
      }
    ).unsafeWindow;
    if (unsafe?.document && unsafe.location?.hostname.endsWith("youtube.com")) {
      return unsafe;
    }
  } catch {}

  try {
    const wrapped = (
      targetWindow as WebAbrWindow & {
        wrappedJSObject?: WebAbrWindow;
      }
    ).wrappedJSObject;
    if (
      wrapped?.document &&
      wrapped.location?.hostname.endsWith("youtube.com")
    ) {
      return wrapped;
    }
  } catch {}

  return targetWindow;
}

export function getTopPageWindow(targetWindow: WebAbrWindow): WebAbrWindow {
  const pageWindow = getMainWorldWindow(targetWindow);
  try {
    const top = pageWindow.top as
      | (WebAbrWindow & {
          wrappedJSObject?: WebAbrWindow;
        })
      | null;
    if (top?.document && top.location?.hostname.endsWith("youtube.com")) {
      try {
        return top.wrappedJSObject ?? top;
      } catch {
        return top;
      }
    }
  } catch {
    // Cross-origin frames cannot expose the top page. Fall back to page realm.
  }
  return pageWindow;
}

export function getNativePlayerResponse(
  targetWindow: WebAbrWindow,
  videoId: string,
): WebEmbeddedPlayerResponse | undefined {
  const candidates: Array<{
    source: string;
    value?: WebEmbeddedPlayerResponse;
  }> = [];

  // YouTube is an SPA. After opening another video ytInitialPlayerResponse and
  // the inline document JSON can still describe the page that was loaded with
  // F5. The live player is the authoritative source for the current watch video.
  try {
    const pageWindow = getTopPageWindow(targetWindow);
    const moviePlayer = pageWindow.document.querySelector("#movie_player") as
      | (HTMLElement & { getPlayerResponse?: () => unknown })
      | null;
    if (moviePlayer && typeof moviePlayer.getPlayerResponse === "function") {
      candidates.push({
        source: "movie_player",
        value: moviePlayer.getPlayerResponse() as WebEmbeddedPlayerResponse,
      });
    }
  } catch {
    // Private player API is best-effort; keep the old fallbacks below.
  }

  try {
    candidates.push({
      source: "window",
      value: targetWindow.ytInitialPlayerResponse,
    });
  } catch {
    // Sandboxed userscript globals may hide the page property.
  }
  candidates.push({
    source: "document",
    value: readInitialPlayerResponseFromDocument(targetWindow),
  });
  for (const candidate of candidates) {
    const value = candidate.value;
    if (!value) continue;
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

function readYtcfgFromDocument(targetWindow: Window): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  let scripts: HTMLScriptElement[] = [];
  try {
    scripts = [
      ...targetWindow.document.querySelectorAll<HTMLScriptElement>(
        "script:not([src])",
      ),
    ];
  } catch {
    return data;
  }
  for (const script of scripts) {
    const source = script.textContent;
    if (!source?.includes("ytcfg")) continue;
    Object.assign(data, parseYtcfgData(source));
  }
  return data;
}

export async function resolveYtcfg(
  targetWindow: WebAbrWindow,
  signal: AbortSignal,
): Promise<YouTubeConfig> {
  const pageConfig = targetWindow.ytcfg;
  if (
    pageConfig &&
    typeof getConfigValue(pageConfig, "INNERTUBE_API_KEY") === "string"
  ) {
    return pageConfig;
  }
  // A sandboxed userscript realm (Tampermonkey with any @grant) sees its own
  // globals, so recover the config from the page markup instead.
  let data = readYtcfgFromDocument(targetWindow);
  let source = "document";
  if (typeof data.INNERTUBE_API_KEY !== "string") {
    try {
      const response = await targetWindow.fetch(targetWindow.location.href, {
        credentials: "include",
        signal,
      });
      if (response.ok) {
        data = parseYtcfgData(await response.text());
        source = "page";
      }
    } catch (error) {
      signal.throwIfAborted();
    }
  }
  if (typeof data.INNERTUBE_API_KEY !== "string") {
    throw new Error("Audio downloader. web ABR config is unavailable");
  }
  return { data_: data };
}

export function audioLanguageMatches(
  trackLanguage: string,
  requestedLanguage: string,
): boolean {
  const track = normalizeAudioLanguage(trackLanguage);
  const requested = normalizeAudioLanguage(requestedLanguage);
  if (!track || !requested || requested === "auto") return false;
  if (track === requested) return true;
  return track.split("-")[0] === requested.split("-")[0];
}

export function isDrcAudioFormat(format: WebEmbeddedFormat): boolean {
  if (typeof format.xtags === "string" && format.xtags.includes("drc=1")) {
    return true;
  }
  try {
    const cipher =
      typeof format.signatureCipher === "string"
        ? new URLSearchParams(format.signatureCipher)
        : undefined;
    const rawUrl = format.url ?? cipher?.get("url");
    const xtags = rawUrl ? new URL(rawUrl).searchParams.get("xtags") : null;
    return xtags?.includes("drc=1") === true;
  } catch {
    return false;
  }
}

/**
 * Shared economy audio quality choice.
 *
 * Language/track selection happens before this function. This function only
 * chooses the lightest representation: prefer non-DRC, then the smallest
 * contentLength, then the lowest bitrate.
 */
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

  const numericContentLength = (format: WebEmbeddedFormat): number => {
    const value = Number(format.contentLength);
    return Number.isFinite(value) && value > 0
      ? value
      : Number.POSITIVE_INFINITY;
  };
  const numericBitrate = (format: WebEmbeddedFormat): number => {
    const value = Number(format.averageBitrate ?? format.bitrate);
    return Number.isFinite(value) && value > 0
      ? value
      : Number.POSITIVE_INFINITY;
  };

  return [...candidates].sort((a, b) => {
    // contentLength is the most direct traffic estimate when YouTube supplies it.
    const sizeDiff = numericContentLength(a) - numericContentLength(b);
    if (Number.isFinite(sizeDiff) && sizeDiff !== 0) return sizeDiff;

    // Otherwise prefer the lowest audio bitrate.
    const bitrateDiff = numericBitrate(a) - numericBitrate(b);
    if (Number.isFinite(bitrateDiff) && bitrateDiff !== 0) return bitrateDiff;

    // Stable deterministic fallback; for the usual Opus/AAC set this tends to
    // keep the low-bitrate WebM formats ahead of the larger AAC alternative.
    return (
      (a.itag ?? Number.MAX_SAFE_INTEGER) - (b.itag ?? Number.MAX_SAFE_INTEGER)
    );
  })[0];
}

export function selectAudioFormat(
  formats: WebEmbeddedFormat[],
  requestedLanguage?: string,
): WebEmbeddedFormat {
  const withUrl = formats.filter(
    ({ url, signatureCipher }) =>
      typeof url === "string" || typeof signatureCipher === "string",
  );
  const audioOnly = withUrl.filter(
    ({ mimeType }) =>
      mimeType?.includes("audio/") && !mimeType?.includes("video/"),
  );

  // If VOT explicitly selected a source language, prefer that YouTube audio
  // track. BCP-47 variants are matched by exact tag first, then base language.
  const normalizedRequestedLanguage = normalizeAudioLanguage(requestedLanguage);
  const exactLanguageCandidates =
    normalizedRequestedLanguage && normalizedRequestedLanguage !== "auto"
      ? audioOnly.filter(
          (format) =>
            getAudioFormatLanguage(format) === normalizedRequestedLanguage,
        )
      : [];
  const requestedLanguageCandidates =
    exactLanguageCandidates.length > 0
      ? exactLanguageCandidates
      : normalizedRequestedLanguage && normalizedRequestedLanguage !== "auto"
        ? audioOnly.filter((format) =>
            audioLanguageMatches(
              getAudioFormatLanguage(format),
              normalizedRequestedLanguage,
            ),
          )
        : [];

  const defaultAudioOnly = audioOnly.filter(
    ({ audioTrack }) => audioTrack?.audioIsDefault === true,
  );
  const trackCandidates =
    requestedLanguageCandidates.length > 0
      ? requestedLanguageCandidates
      : defaultAudioOnly.length > 0
        ? defaultAudioOnly
        : audioOnly;
  // Keep the existing WebABR language/track selection above unchanged.
  // Only the quality choice is shared with SABR: lowest traffic cost.
  const selected = selectEconomyAudioFormat(trackCandidates);

  if (!selected) {
    throw new Error(
      "Audio downloader. web ABR returned no direct audio-only formats",
    );
  }

  return selected;
}

async function sha1(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function buildSidAuthorization(
  scheme: string,
  sid: string,
  origin: string,
  timestamp: string,
  userSessionId?: string,
): Promise<string> {
  const hash = await sha1(
    userSessionId
      ? `${userSessionId} ${timestamp} ${sid} ${origin}`
      : `${timestamp} ${sid} ${origin}`,
  );
  return `${scheme} ${timestamp}_${hash}${userSessionId ? "_u" : ""}`;
}

export async function getYouTubeAuthorization(
  targetWindow: Window,
  userSessionId?: string,
): Promise<string | undefined> {
  const cookies = new Map(
    targetWindow.document.cookie.split("; ").map((cookie) => {
      const separator = cookie.indexOf("=");
      return separator < 0
        ? [cookie, ""]
        : [cookie.slice(0, separator), cookie.slice(separator + 1)];
    }),
  );
  const timestamp = String(Math.round(Date.now() / 1000));
  const origin = "https://www.youtube.com";
  const authorizations = await Promise.all(
    [
      [
        "SAPISIDHASH",
        cookies.get("SAPISID") ?? cookies.get("__Secure-3PAPISID"),
      ],
      ["SAPISID1PHASH", cookies.get("__Secure-1PAPISID")],
      ["SAPISID3PHASH", cookies.get("__Secure-3PAPISID")],
    ].map(async ([scheme, sid]) =>
      sid
        ? buildSidAuthorization(
            scheme,
            sid,
            origin,
            timestamp,
            userSessionId || undefined,
          )
        : "",
    ),
  );
  return authorizations.filter(Boolean).join(" ") || undefined;
}

export function getPlayerUrl(config: YouTubeConfig): string | undefined {
  const playerContexts = getConfigValue(config, "WEB_PLAYER_CONTEXT_CONFIGS") as
    | {
        WEB_PLAYER_CONTEXT_CONFIG_ID_EMBEDDED_PLAYER?: { jsUrl?: unknown };
      }
    | undefined;
  const value =
    getConfigValue(config, "PLAYER_JS_URL") ??
    getConfigValue(config, "JS_URL") ??
    playerContexts?.WEB_PLAYER_CONTEXT_CONFIG_ID_EMBEDDED_PLAYER?.jsUrl;
  return typeof value === "string"
    ? new URL(value, "https://www.youtube.com").toString()
    : undefined;
}

type TrustedTypePolicyFactory = {
  createPolicy: (
    name: string,
    rules: { createScript: (value: string) => string },
  ) => { createScript: (value: string) => unknown };
};

// A sandboxed or proxied global can lack trustedTypes while its Function is
// still Trusted Types-checked. The policy and the Function sink must live in
// the same realm, so probe same-origin ancestors for the policy factory.
function resolveTrustedRealm(realm: Window): Window {
  const candidates: Window[] = [realm];
  const add = (candidate: Window | null | undefined): void => {
    if (candidate && candidate !== realm) candidates.push(candidate);
  };
  try {
    add(realm.parent as Window | null);
  } catch {
    // Cross-origin access is denied.
  }
  try {
    add(realm.top as Window | null);
  } catch {
    // Cross-origin access is denied.
  }
  for (const candidate of candidates) {
    try {
      if (
        (candidate as unknown as { trustedTypes?: TrustedTypePolicyFactory })
          .trustedTypes?.createPolicy
      ) {
        return candidate;
      }
    } catch {
      // Cross-origin access is denied.
    }
  }
  return realm;
}

function runChallengeSolver(
  realm: Window,
  preparedPlayer: string,
  signature?: string,
  n?: string,
): { signature?: string; n?: string } {
  const nativeRealm = resolveTrustedRealm(realm);
  const trustedTypes = (
    nativeRealm as unknown as { trustedTypes?: TrustedTypePolicyFactory }
  ).trustedTypes;
  const policy = trustedTypes?.createPolicy(
    `vot-youtube-solver-${crypto.randomUUID()}`,
    {
      createScript: (value) => value,
    },
  );
  // Chrome's Function constructor rejects TrustedScript arguments
  // (crbug.com/1087743), so evaluate through eval, which accepts
  // TrustedScript. The IIFE keeps the player locals out of the page too, and
  // handing its result back as the completion value keeps the solver working
  // when eval runs in another realm than the caller (a sandboxed userscript).
  const source = `(function(){\nconst _result={sig:null,n:null};\n${preparedPlayer}\nreturn _result;\n})()`;
  const script = policy?.createScript(source) ?? source;
  const result = (
    nativeRealm as unknown as { eval: (value: unknown) => unknown }
  ).eval(script) as {
    sig?: ((value: string) => string) | null;
    n?: ((value: string) => string) | null;
  } | null;
  if (!result) {
    throw new Error("Audio downloader. YouTube challenge solver returned none");
  }
  const solved = {
    signature: signature && result.sig ? result.sig(signature) : undefined,
    n: n && result.n ? result.n(n) : undefined,
  };
  if ((signature && !solved.signature) || (n && !solved.n)) {
    throw new Error("Audio downloader. YouTube challenge solve incomplete");
  }
  return solved;
}

const SIG_PATTERN = /^[A-Za-z0-9_-]{20,}={0,2}$/;
const N_PATTERN = /^[A-Za-z0-9_-]{4,}$/;

// Only reachable functions can be reused. IIFE-local factories need the AST solver.
function listPageFunctions(pageWindow: WebAbrWindow): SigFactory[] {
  const found: SigFactory[] = [];
  const seen = new Set<unknown>();
  let visited = 0;
  const visit = (value: unknown, path: string, depth: number): void => {
    if (!value || seen.has(value) || depth > 3 || visited++ >= 5000) return;
    seen.add(value);
    if (typeof value === "function") {
      found.push({ fn: value as SigFactory["fn"], path });
    } else if (typeof value === "object") {
      try {
        for (const [key, descriptor] of Object.entries(
          Object.getOwnPropertyDescriptors(value),
        )) {
          if ("value" in descriptor) {
            visit(descriptor.value, `${path}.${key}`, depth + 1);
          }
        }
      } catch {
        // Inaccessible objects are not candidates.
      }
    }
  };
  try {
    const descriptors = Object.getOwnPropertyDescriptors(pageWindow);
    visit(descriptors._yt_player?.value, "_yt_player", 0);
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (typeof descriptor.value === "function")
        visit(descriptor.value, key, 0);
    }
  } catch {
    // Cross-origin access is denied.
  }
  return found;
}

// Media URL builders may set alr too; require the decipher factory's URL wiring.
const SIG_FACTORY_NEW_PATTERN =
  /([A-Za-z_$][\w$]*)\s*=\s*new\s+[A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*\s*\(\s*\1\s*,\s*(?:!\s*0|true)\s*\)\s*;\s*\1\.set\(\s*["']alr["']\s*,\s*["']yes["']\s*\)/;
const EJS_MOCK_URL = "https://youtube.com/watch?v=yt-dlp-wins";

type SigFactory = {
  fn: (url: string, sp: string, s: string) => PageUrlInstance;
  path: string;
};

function isSigFactory({ fn }: SigFactory): boolean {
  try {
    return SIG_FACTORY_NEW_PATTERN.test(Function.prototype.toString.call(fn));
  } catch {
    return false;
  }
}

function pageUrlMethods(proto: object | null) {
  if (!proto) return;
  const descriptors = new Map<string, PropertyDescriptor>();
  for (let current = proto; current; current = Object.getPrototypeOf(current)) {
    for (const [key, descriptor] of Object.entries(
      Object.getOwnPropertyDescriptors(current),
    )) {
      if (!descriptors.has(key)) descriptors.set(key, descriptor);
    }
  }
  const get = descriptors.get("get")?.value;
  const set = descriptors.get("set")?.value;
  if (
    typeof get !== "function" ||
    typeof set !== "function" ||
    typeof descriptors.get("clone")?.value !== "function"
  ) {
    return;
  }
  const transforms = [...descriptors].flatMap(([key, descriptor]) => {
    if (["constructor", "set", "get", "clone"].includes(key)) return [];
    const method = descriptor.value;
    if (typeof method !== "function") return [];
    const source = Function.prototype.toString.call(method);
    return /\.set\(\s*["']n["']\s*,/.test(source) ||
      (/for\s*\([^)]*\bof\b[^)]*\.params\b/.test(source) &&
        /\.params\.set\(/.test(source))
      ? [method as (this: PageUrlInstance) => void]
      : [];
  });
  return { get, set, transforms };
}

type PageSolution = { signature?: string; n?: string };
type PageChallenge = PageSolution & { url: string; sp?: string };

function validPageValue(
  value: unknown,
  input: string | undefined,
  pattern: RegExp,
): string | undefined {
  if (!input || typeof value !== "string") return;
  let decoded = value;
  for (let index = 0; index < 3 && decoded.includes("%"); index++) {
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      return;
    }
  }
  return decoded !== input && pattern.test(decoded) ? decoded : undefined;
}

export function collectPageSolutions(
  pageWindow: WebAbrWindow,
  challenge: PageChallenge,
): PageSolution[] {
  const realms = new Set<WebAbrWindow>([pageWindow]);
  for (const relation of ["parent", "top"] as const) {
    try {
      const other = pageWindow[relation] as WebAbrWindow | null;
      if (other) realms.add(other);
    } catch {
      // Cross-origin access is denied.
    }
  }
  const solutions: PageSolution[] = [];
  const seen = new Set<SigFactory["fn"]>();
  const collect = (
    instance: PageUrlInstance,
    methods: NonNullable<ReturnType<typeof pageUrlMethods>>,
    transform: ((this: PageUrlInstance) => void) | undefined,
    factory: boolean,
  ): void => {
    const solution: PageSolution = {};
    const readSignature = () => {
      if (!challenge.signature) return;
      const keys = factory ? ["s"] : ["s", challenge.sp];
      for (const key of keys) {
        if (!key) continue;
        const value = validPageValue(
          methods.get.call(instance, key),
          challenge.signature,
          SIG_PATTERN,
        );
        if (value) return value;
      }
    };
    if (challenge.signature) {
      try {
        solution.signature = readSignature();
      } catch {
        // A bad signature must not discard an independently valid n.
      }
    }
    if (challenge.n && transform) {
      try {
        if (factory) methods.set.call(instance, "n", challenge.n);
        solution.n = validPageValue(
          methods.get.call(instance, "n"),
          challenge.n,
          N_PATTERN,
        );
        if (!solution.n) {
          transform.call(instance);
          solution.n = validPageValue(
            methods.get.call(instance, "n"),
            challenge.n,
            N_PATTERN,
          );
          if (!solution.signature) solution.signature = readSignature();
        }
      } catch {
        // Keep the signature even if the n transform fails.
      }
    }
    if (solution.signature || solution.n) solutions.push(solution);
  };
  for (const realm of realms) {
    for (const entry of listPageFunctions(realm)) {
      const { fn, path } = entry;
      if (seen.has(fn)) continue;
      seen.add(fn);
      try {
        if (isSigFactory(entry)) {
          const make = () =>
            fn(
              EJS_MOCK_URL,
              "s",
              encodeURIComponent(challenge.signature ?? ""),
            );
          const instance = make();
          if (!instance || typeof instance !== "object") continue;
          const methods = pageUrlMethods(Object.getPrototypeOf(instance));
          if (!methods) continue;
          collect(instance, methods, methods.transforms[0], true);
          if (challenge.n) {
            for (const transform of methods.transforms.slice(1)) {
              collect(make(), methods, transform, true);
            }
          }
        } else if (challenge.n && path.startsWith("_yt_player.")) {
          const proto = Object.getOwnPropertyDescriptor(fn, "prototype")?.value;
          const methods = pageUrlMethods(proto);
          if (!methods?.transforms.length) continue;
          // Vet the interface and n fingerprint before constructing anything.
          const UrlCtor = fn as unknown as PageUrlClass;
          for (const transform of methods.transforms) {
            try {
              collect(
                new UrlCtor(challenge.url, true),
                methods,
                transform,
                false,
              );
            } catch {
              // One failed construction does not invalidate other candidates.
            }
          }
        }
      } catch {
        // Inaccessible or incompatible page functions are not solutions.
      }
    }
  }
  const consensus: PageSolution = {};
  for (const field of ["signature", "n"] as const) {
    const values = new Set(
      solutions.map((solution) => solution[field]).filter(Boolean),
    );
    if (values.size === 1) consensus[field] = values.values().next().value;
  }
  const merged = new Map<string, PageSolution>();
  for (const solution of solutions) {
    const candidate = {
      signature: solution.signature ?? consensus.signature,
      n: solution.n ?? consensus.n,
    };
    merged.set(JSON.stringify(candidate), candidate);
  }
  return [...merged.values()];
}

function solveYouTubeChallenges(
  targetWindow: Window,
  playerCode: string,
  signature?: string,
  n?: string,
): { signature?: string; n?: string } {
  const preparedPlayer = preprocessYouTubePlayer(playerCode);
  const errors: string[] = [];
  try {
    // The embed page CSP allows unsafe-eval; its globals are all defined,
    // so the solver setup is a no-op there and Function scope keeps the
    // player code from leaking into the page.
    return runChallengeSolver(targetWindow, preparedPlayer, signature, n);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  const sandbox = targetWindow.document.createElement("iframe");
  sandbox.style.display = "none";
  sandbox.setAttribute("aria-hidden", "true");
  sandbox.setAttribute("sandbox", "allow-scripts allow-same-origin");
  (targetWindow.document.body ?? targetWindow.document.documentElement).append(
    sandbox,
  );
  try {
    const realm = sandbox.contentWindow;
    if (!realm) throw new Error("Challenge solver sandbox is unavailable");
    return runChallengeSolver(realm, preparedPlayer, signature, n);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    sandbox.remove();
  }
  throw new Error(
    `Audio downloader. YouTube challenge solve failed (${errors.join(" | ")})`,
  );
}

function buildSolvedUrl(
  rawUrl: string,
  sp: string | undefined,
  solved: { signature?: string; n?: string },
): string {
  const url = new URL(rawUrl);
  if (solved.signature)
    url.searchParams.set(sp ?? "signature", solved.signature);
  if (solved.n) url.searchParams.set("n", solved.n);
  return url.toString();
}

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

  // serverAbrStreamingUrl is a normal signed googlevideo transport.  Unlike the
  // old native-capture bootstrap, SELF_BUILT must make the /player URL usable
  // without waiting for YouTube to issue its own SABR POST.
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

export async function* resolveFormatUrl(
  targetWindow: WebAbrWindow,
  format: WebEmbeddedFormat,
  playerCode: () => Promise<string | undefined>,
  signal: AbortSignal,
): AsyncGenerator<string> {
  signal.throwIfAborted();
  const cipher = format.signatureCipher
    ? new URLSearchParams(format.signatureCipher)
    : undefined;
  const rawUrl = format.url ?? cipher?.get("url");
  if (!rawUrl) {
    throw new Error("Audio downloader. web ABR format URL is unavailable");
  }
  const url = new URL(rawUrl);
  const signature = cipher?.get("s") ?? undefined;
  const n = url.searchParams.get("n") ?? undefined;
  if (!signature && !n) {
    yield url.toString();
    signal.throwIfAborted();
    return;
  }
  const challenge = {
    url: rawUrl,
    sp: cipher?.get("sp") ?? undefined,
    signature,
    n,
  };
  const candidates = collectPageSolutions(targetWindow, challenge);
  signal.throwIfAborted();
  const complete = (solution: PageSolution) =>
    (!signature || !!solution.signature) && (!n || !!solution.n);
  candidates.sort((a, b) => Number(complete(b)) - Number(complete(a)));
  let source: Promise<string | undefined> | undefined;
  const astSolutions = new Map<string, PageSolution>();
  const solve = async (
    signature?: string,
    n?: string,
  ): Promise<PageSolution> => {
    signal.throwIfAborted();
    const key = JSON.stringify([signature, n]);
    const cached = astSolutions.get(key);
    if (cached) return cached;
    source ??= playerCode();
    const code = await source;
    signal.throwIfAborted();
    if (!code) {
      throw new Error("Audio downloader. YouTube player code is unavailable");
    }
    const raw = solveYouTubeChallenges(targetWindow, code, signature, n);
    signal.throwIfAborted();
    const solved = {
      signature: validPageValue(raw.signature, signature, SIG_PATTERN),
      n: validPageValue(raw.n, n, N_PATTERN),
    };
    if ((signature && !solved.signature) || (n && !solved.n)) {
      throw new Error("Audio downloader. YouTube challenge solve invalid");
    }
    astSolutions.set(key, solved);
    return solved;
  };
  const yielded = new Set<string>();
  const errors: string[] = [];
  for (const candidate of candidates) {
    signal.throwIfAborted();
    let solved = candidate;
    try {
      if (!complete(candidate)) {
        const missing = await solve(
          candidate.signature ? undefined : signature,
          candidate.n ? undefined : n,
        );
        solved = {
          signature: candidate.signature ?? missing.signature,
          n: candidate.n ?? missing.n,
        };
      }
    } catch (error) {
      signal.throwIfAborted();
      errors.push(error instanceof Error ? error.message : String(error));
      continue;
    }
    signal.throwIfAborted();
    const candidateUrl = buildSolvedUrl(rawUrl, challenge.sp, solved);
    if (!yielded.has(candidateUrl)) {
      yielded.add(candidateUrl);
      yield candidateUrl;
    }
  }
  // Resume only after the consumer has tried downloading the page candidates.
  signal.throwIfAborted();
  let solved: PageSolution;
  try {
    solved = await solve(signature, n);
  } catch (error) {
    signal.throwIfAborted();
    errors.push(error instanceof Error ? error.message : String(error));
    throw new Error(
      `Audio downloader. challenge solve failed (${errors.join(" | ")})`,
    );
  }
  signal.throwIfAborted();
  const fallbackUrl = buildSolvedUrl(rawUrl, challenge.sp, solved);
  if (!yielded.has(fallbackUrl)) yield fallbackUrl;
  signal.throwIfAborted();
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

  const contentPlaybackContext = buildContentPlaybackContext(
    extractedSignatureTimestamp ?? getConfigValue(config, "STS"),
  );

  return {
    context,
    videoId,
    playbackContext: { contentPlaybackContext },
    contentCheckOk: true,
    racyCheckOk: true,
  };
}

export function buildWebCreatorPlayerRequest(
  videoId: string,
  options: {
    visitorData?: unknown;
    signatureTimestamp?: number;
    clientVersion?: unknown;
  } = {},
): Record<string, unknown> {
  const contentPlaybackContext = buildContentPlaybackContext(
    options.signatureTimestamp,
  );
  return {
    context: {
      client: {
        clientName: "WEB_CREATOR",
        clientVersion:
          typeof options.clientVersion === "string" && options.clientVersion
            ? options.clientVersion
            : "1.20260708.06.00",
        hl: "en",
        gl: "US",
        timeZone: "UTC",
        utcOffsetMinutes: 0,
        ...(typeof options.visitorData === "string"
          ? { visitorData: options.visitorData }
          : {}),
      },
    },
    videoId,
    playbackContext: { contentPlaybackContext },
    contentCheckOk: true,
    racyCheckOk: true,
  };
}

export async function postInnertubePlayer(
  targetWindow: Window,
  signal: AbortSignal,
  apiKey: string,
  body: Record<string, unknown>,
  clientName: string,
  clientVersion: string,
  extra: {
    authorization?: string;
    sessionIndex?: unknown;
    delegatedSessionId?: unknown;
  },
): Promise<WebEmbeddedPlayerResponse> {
  const visitorData = (body.context as { client?: { visitorData?: unknown } })
    ?.client?.visitorData;
  const authenticated = Boolean(extra.authorization);
  const response = await targetWindow.fetch(
    `https://www.youtube.com/youtubei/v1/player?prettyPrint=false&key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      credentials: authenticated ? "include" : "omit",
      signal,
      headers: {
        "content-type": "application/json",
        "x-youtube-client-name": clientName,
        "x-youtube-client-version": clientVersion,
        ...(typeof visitorData === "string"
          ? { "x-goog-visitor-id": visitorData }
          : {}),
        ...(authenticated
          ? {
              authorization: extra.authorization,
              "x-origin": "https://www.youtube.com",
              "x-youtube-bootstrap-logged-in": "true",
              ...(typeof extra.sessionIndex === "number" ||
              typeof extra.sessionIndex === "string"
                ? { "x-goog-authuser": String(extra.sessionIndex) }
                : {}),
              ...(typeof extra.delegatedSessionId === "string" &&
              extra.delegatedSessionId
                ? { "x-goog-pageid": extra.delegatedSessionId }
                : {}),
            }
          : {}),
      },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Audio downloader. player request failed (${response.status})`,
    );
  }
  return (await response.json()) as WebEmbeddedPlayerResponse;
}
