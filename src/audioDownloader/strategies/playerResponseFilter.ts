/**
 * Forces the embedded player onto exactly one audio format.
 *
 * `web_mse_proxy` collects the bytes the player downloads anyway, so the
 * player alone decides what the download costs. Left untouched its adaptive
 * ladder opens the medium Opus stream (`itag 251`, ~128 kbps, ~17 MB for a
 * long video) and a multi-language upload may switch tracks mid-download.
 *
 * The `player` response is therefore rewritten before the player can read it:
 * the track is chosen by {@link selectAudioFormat} (English first, then the
 * original audio of the upload) and `streamingData` is trimmed to the
 * cheapest Opus stream of that track (`itag 249`, ~50 kbps), or to the
 * cheapest AAC stream (`itag 139`) when the upload carries no Opus. The
 * player keeps the smallest picture next to it, so it still has something to
 * play, and loses every other format: there is no ladder left to climb.
 *
 * The response reaches the player through whichever entry point the embed
 * uses, so all of them are hooked:
 *
 * - `ytInitialPlayerResponse` of the embed document,
 * - the `/youtubei/v1/player` answer, over `fetch` and `XMLHttpRequest`,
 * - `loadVideoByPlayerVars` / `cueVideoByPlayerVars` / `updateVideoData` of
 *   the player element (`raw_player_response`, `player_response`).
 *
 * Only our own hidden realm is patched (`pageAudioHandler` installs this when
 * the document is the audio realm iframe), so the player the user is watching
 * keeps every format it normally has.
 */
import debug from "../../utils/debug";
import { toErrorMessage } from "../../utils/errors";
import {
  hasAudioCodec,
  type MediaFormat,
  type SelectedFormat,
  selectAudioFormat,
  selectSmallestVideoStream,
} from "./formatSelection";

const STORE_KEY = "__VOT_PLAYER_FORMAT_FILTER__";
const PLAYER_ENDPOINT = "/youtubei/v1/player";
const PATCHED_FLAG = "__votFormatFilter";
/** The function a patch replaced, kept on the patch itself. */
const ORIGINAL_KEY = "__votFormatFilterOriginal";
/** Marks an `XMLHttpRequest` whose accessors this module already shadowed. */
const WATCHED_FLAG = "__votFormatFilterWatched";
/** Player API entry points that carry a `player` response of their own. */
const PLAYER_VARS_METHODS = [
  "loadVideoByPlayerVars",
  "cueVideoByPlayerVars",
  "updateVideoData",
] as const;
/** Serialized responses handed to the player through player vars. */
const PLAYER_VARS_KEYS = [
  "player_response",
  "embedded_player_response",
] as const;

/**
 * `audio` keeps one audio stream (the normal path), `video` is the emergency
 * fallback that keeps only the 144p picture.
 */
export type PlayerFilterMode = "audio" | "video";

/** Tried in this order: the audio capture first, the picture as last resort. */
export const PLAYER_FILTER_MODES: readonly PlayerFilterMode[] = [
  "audio",
  "video",
];

export type PlayerStreamingData = {
  formats?: MediaFormat[];
  adaptiveFormats?: MediaFormat[];
  hlsManifestUrl?: string;
  dashManifestUrl?: string;
};

export type PlayerResponseLike = {
  streamingData?: PlayerStreamingData;
};

/** What the player was left with. Logged, never parsed. */
export type PlayerFormatSelection = {
  mode: PlayerFilterMode;
  reason: string;
  audioItag?: number;
  videoItag?: number;
  mimeType?: string;
  /** `contentLength` of the kept audio stream: the size to expect in MSE. */
  expectedLength?: string;
  track?: string;
  language?: string;
  content?: string;
  /** How many formats the player lost, `itag 251` and the other tracks. */
  dropped: number;
};

type FilterWindow = Window & {
  [STORE_KEY]?: PlayerFormatFilter;
  ytInitialPlayerResponse?: unknown;
  Response?: typeof Response;
  XMLHttpRequest?: typeof XMLHttpRequest;
};

type PatchedMethod = ((...args: unknown[]) => unknown) & {
  [PATCHED_FLAG]?: boolean;
  [ORIGINAL_KEY]?: unknown;
};

// CONSOLIDATION: `utils/errors.toErrorMessage` is the project-wide version
// of this coercion. The local alias is kept so the eight debug-log call
// sites in this file are untouched.
const toMessage = toErrorMessage;

function isPlayerEndpoint(url: string): boolean {
  return url.includes(PLAYER_ENDPOINT);
}

/**
 * `hookXhr` and `hookFetch` used to wrap whatever function they found, and the
 * only install guard was a key on the *window* (`STORE_KEY`). A userscript
 * realm and the page realm are two different `globalThis` objects that share
 * one `XMLHttpRequest.prototype` (and this build also grants `unsafeWindow`),
 * so the same prototype could be wrapped again by a second install that
 * captured the *first wrapper* as its "native" function. Re-entering that
 * chain on the first `/youtubei/v1/player` request of the hidden realm blew
 * the stack, the exception surfaced through the filter as
 * `player formats untouched { source: "xhr", error: "Maximum call stack size
 * exceeded" }`, and it took the whole `web_mse_proxy` fallback down with it.
 *
 * Every patch now carries {@link PATCHED_FLAG} plus the function it replaced,
 * so a hook can recognise its own kind, refuse to wrap it a second time, and
 * always resolve down to the real native implementation — no matter how many
 * realms or injections of the script share the prototype.
 */
function markPatched<T>(patched: T, original: unknown): T {
  for (const [key, value] of [
    [PATCHED_FLAG, true],
    [ORIGINAL_KEY, original],
  ] as const) {
    try {
      Object.defineProperty(patched as object, key, {
        value,
        configurable: true,
      });
    } catch {
      // A frozen function cannot be marked. It is still a fresh wrapper, so
      // the worst case is the pre-existing behavior.
    }
  }
  return patched;
}

function isPatched(value: unknown): boolean {
  return (
    typeof value === "function" &&
    (value as PatchedMethod)[PATCHED_FLAG] === true
  );
}

/** Walks a chain of our own wrappers down to the function underneath it. */
function unwrapPatched<T>(value: T): T {
  let current: unknown = value;
  const seen = new Set<unknown>();
  while (isPatched(current) && !seen.has(current)) {
    seen.add(current);
    current = (current as PatchedMethod)[ORIGINAL_KEY];
  }
  return current as T;
}

function readRequestUrl(input: unknown): string {
  if (typeof input === "string") return input;
  const candidate = input as { url?: unknown; href?: unknown } | null;
  if (typeof candidate?.url === "string") return candidate.url;
  if (typeof candidate?.href === "string") return candidate.href;
  return "";
}

function trySelect(
  select: () => SelectedFormat | undefined,
): SelectedFormat | undefined {
  try {
    return select();
  } catch {
    // A response without any audio-only stream is left to the muxed path.
    return undefined;
  }
}

/** Keeps the array identity the player may already hold a reference to. */
function replaceFormats(
  streaming: PlayerStreamingData,
  key: "formats" | "adaptiveFormats",
  formats: MediaFormat[],
): void {
  const current = streaming[key];
  if (Array.isArray(current)) {
    try {
      current.splice(0, current.length, ...formats);
      return;
    } catch {
      // Frozen array: fall through to a plain assignment.
    }
  }
  try {
    streaming[key] = formats;
  } catch (error) {
    debug.log("Audio downloader. player formats not writable", {
      key,
      error: toMessage(error),
    });
  }
}

function pickKeptFormats(
  streaming: PlayerStreamingData,
  mode: PlayerFilterMode,
):
  | { kept: MediaFormat[]; audio?: SelectedFormat; video?: SelectedFormat; reason: string }
  | undefined {
  const adaptiveFormats = streaming.adaptiveFormats ?? [];
  // The formats of an embed carry no `url` (SABR), so a URL is not required
  // here: the player requests them itself.
  const options = { requireUrl: false } as const;

  if (mode === "audio") {
    const audio = trySelect(() => selectAudioFormat(adaptiveFormats, options));
    // Without an audio-only stream the player has to open a muxed buffer,
    // which the capture mirrors as its own last resort. Leave that response
    // alone instead of guessing.
    if (!audio) return undefined;
    const video = selectSmallestVideoStream(adaptiveFormats, options);
    return {
      kept: video ? [audio.format, video.format] : [audio.format],
      audio,
      video,
      reason: audio.reason,
    };
  }

  // Emergency fallback: the cheapest picture available, which is 144p
  // whenever YouTube offers it. A muxed stream carries its audio with it; a
  // video-only one needs the cheapest audio stream next to it, otherwise
  // there is nothing left to capture at all.
  const video = selectSmallestVideoStream(adaptiveFormats, options);
  if (!video) return undefined;
  const muxed = hasAudioCodec(video.format.mimeType);
  const audio = muxed
    ? undefined
    : trySelect(() => selectAudioFormat(adaptiveFormats, options));
  const kept = audio ? [video.format, audio.format] : [video.format];
  return {
    kept,
    audio,
    video,
    reason: muxed ? "lowest-quality muxed video" : video.reason,
  };
}

/**
 * Trims `streamingData` in place to the formats the player is allowed to use.
 *
 * @returns what was kept, or `undefined` when the response was left untouched.
 */
export function filterPlayerResponse(
  response: PlayerResponseLike | undefined,
  mode: PlayerFilterMode,
): PlayerFormatSelection | undefined {
  const streaming = response?.streamingData;
  if (!streaming || !Array.isArray(streaming.adaptiveFormats)) return undefined;
  const before =
    streaming.adaptiveFormats.length + (streaming.formats?.length ?? 0);
  const picked = pickKeptFormats(streaming, mode);
  if (!picked) return undefined;
  const { kept, audio, video } = picked;

  // The player starts with the track InnerTube marks as default; the kept one
  // is now the only track, so it is the default too.
  const audioTrack = audio?.format.audioTrack;
  if (audioTrack) {
    try {
      audioTrack.audioIsDefault = true;
    } catch {
      // Read-only track descriptor: the format list is already unambiguous.
    }
  }

  replaceFormats(streaming, "adaptiveFormats", kept);
  // A progressive format carries its own URL and would be played outside
  // MediaSource, where there is nothing to mirror.
  if (streaming.formats?.length) replaceFormats(streaming, "formats", []);
  // A manifest would hand the player the full ladder back.
  for (const key of ["hlsManifestUrl", "dashManifestUrl"] as const) {
    if (!streaming[key]) continue;
    try {
      delete streaming[key];
    } catch {
      // Non-configurable manifest URL: the trimmed formats still win, since
      // the player prefers them on desktop web.
    }
  }

  return {
    mode,
    reason: picked.reason,
    audioItag: audio?.format.itag,
    videoItag: video?.format.itag,
    mimeType: audio?.format.mimeType ?? video?.format.mimeType,
    expectedLength: audio?.format.contentLength ?? video?.format.contentLength,
    track: audio?.track?.key,
    language: audio?.track?.language,
    content: audio?.track?.content,
    dropped: Math.max(before - kept.length, 0),
  };
}

/** Rewrites every `player` response of one realm before the player reads it. */
export class PlayerFormatFilter {
  private mode: PlayerFilterMode = "audio";
  private selection?: PlayerFormatSelection;
  /** Responses the player re-reads must not be filtered a second time. */
  private handled = new WeakSet<object>();

  getMode(): PlayerFilterMode {
    return this.mode;
  }

  getSelection(): PlayerFormatSelection | undefined {
    return this.selection;
  }

  setMode(mode: PlayerFilterMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.selection = undefined;
    // The reload answers with fresh objects, but a cached one has to be
    // filtered again for the new mode.
    this.handled = new WeakSet();
  }

  /** Filters a parsed response in place and returns the same value. */
  apply<T>(response: T, source: string): T {
    if (!response || typeof response !== "object") return response;
    if (this.handled.has(response)) return response;
    this.handled.add(response);
    try {
      const selection = filterPlayerResponse(
        response as PlayerResponseLike,
        this.mode,
      );
      if (!selection) return response;
      this.selection = selection;
      debug.log("Audio downloader. player formats trimmed", {
        source,
        ...selection,
      });
    } catch (error) {
      debug.log("Audio downloader. player formats untouched", {
        source,
        error: toMessage(error),
      });
    }
    return response;
  }

  /** Filters a JSON body. `undefined` when the body stays as it is. */
  applyToJson(body: string, source: string): string | undefined {
    if (!body || !body.includes("adaptiveFormats")) return undefined;
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      return undefined;
    }
    const previous = this.selection;
    this.apply(parsed, source);
    if (this.selection === previous) return undefined;
    try {
      return JSON.stringify(parsed);
    } catch (error) {
      debug.log("Audio downloader. player response not serializable", {
        source,
        error: toMessage(error),
      });
      return undefined;
    }
  }

  /** Filters the response the player API is handed directly. */
  applyToPlayerVars(args: unknown, source: string): void {
    if (!args || typeof args !== "object") return;
    const vars = args as Record<string, unknown>;
    const raw = vars.raw_player_response;
    if (raw && typeof raw === "object") this.apply(raw, source);
    for (const key of PLAYER_VARS_KEYS) {
      const value = vars[key];
      if (typeof value !== "string") continue;
      const patched = this.applyToJson(value, source);
      if (!patched) continue;
      try {
        vars[key] = patched;
      } catch (error) {
        debug.log("Audio downloader. player vars not writable", {
          key,
          error: toMessage(error),
        });
      }
    }
  }
}

function hookInitialPlayerResponse(
  targetWindow: FilterWindow,
  filter: PlayerFormatFilter,
): void {
  const key = "ytInitialPlayerResponse";
  // The document may have set it already when this runs.
  let current = filter.apply(targetWindow[key], key);
  try {
    Object.defineProperty(targetWindow, key, {
      configurable: true,
      enumerable: true,
      get: () => current,
      set: (next: unknown) => {
        current = filter.apply(next, key);
      },
    });
  } catch (error) {
    debug.log("Audio downloader. player response hook refused", {
      hook: key,
      error: toMessage(error),
    });
  }
}

function hookFetch(
  targetWindow: FilterWindow,
  filter: PlayerFormatFilter,
): void {
  const ResponseConstructor = targetWindow.Response;
  if (isPatched(targetWindow.fetch)) return;
  const original = unwrapPatched(targetWindow.fetch);
  if (typeof original !== "function" || !ResponseConstructor) return;
  const patchedFetch = async function patchedFetch(
    this: unknown,
    input: RequestInfo | URL,
    init?: RequestInit,
  ) {
    const response = await original.call(this ?? targetWindow, input, init);
    try {
      if (!response.ok) return response;
      const url = readRequestUrl(input) || response.url;
      if (!isPlayerEndpoint(url)) return response;
      const body = filter.applyToJson(await response.clone().text(), "fetch");
      if (!body) return response;
      return new ResponseConstructor(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (error) {
      debug.log("Audio downloader. player response passed through", {
        hook: "fetch",
        error: toMessage(error),
      });
      return response;
    }
  };
  try {
    targetWindow.fetch = markPatched(
      patchedFetch,
      original,
    ) as unknown as typeof fetch;
  } catch (error) {
    debug.log("Audio downloader. player response hook refused", {
      hook: "fetch",
      error: toMessage(error),
    });
  }
}

/**
 * `responseText` is read-only, so the instance shadows it with a getter that
 * filters lazily. Reading it on demand keeps the hook independent of when the
 * player attaches its own `readystatechange` handler.
 */
function watchXhrResponse(
  xhr: XMLHttpRequest,
  filter: PlayerFormatFilter,
  textGetter: () => unknown,
  responseGetter: () => unknown,
): void {
  const watched = xhr as XMLHttpRequest & { [WATCHED_FLAG]?: boolean };
  if (watched[WATCHED_FLAG]) return;
  Object.defineProperty(watched, WATCHED_FLAG, {
    value: true,
    configurable: true,
  });

  let cache: { raw: string; patched: string } | undefined;
  let filtering = false;
  const readText = (): unknown => {
    const raw = textGetter.call(xhr);
    if (typeof raw !== "string" || !raw) return raw;
    if (cache?.raw === raw) return cache.patched;
    if (filtering) return raw;
    filtering = true;
    try {
      cache = { raw, patched: filter.applyToJson(raw, "xhr") ?? raw };
    } finally {
      filtering = false;
    }
    return cache.patched;
  };
  Object.defineProperty(xhr, "responseText", {
    configurable: true,
    get: () => {
      try {
        return readText();
      } catch {
        return textGetter.call(xhr);
      }
    },
  });
  Object.defineProperty(xhr, "response", {
    configurable: true,
    get: () => {
      try {
        const type = xhr.responseType;
        if (type === "" || type === "text") return readText();
        const value = responseGetter.call(xhr);
        // A `json` response is parsed by the browser itself, so the object is
        // rewritten instead of the text.
        if (type !== "json" || filtering) return value;
        filtering = true;
        try {
          return filter.apply(value, "xhr");
        } finally {
          filtering = false;
        }
      } catch {
        return responseGetter.call(xhr);
      }
    },
  });
}

function hookXhr(targetWindow: FilterWindow, filter: PlayerFormatFilter): void {
  const prototype = targetWindow.XMLHttpRequest?.prototype;
  if (!prototype) return;
  if (isPatched(prototype.open)) return;
  const nativeOpen = unwrapPatched(prototype.open);
  const textGetter = Object.getOwnPropertyDescriptor(
    prototype,
    "responseText",
  )?.get;
  const responseGetter = Object.getOwnPropertyDescriptor(
    prototype,
    "response",
  )?.get;
  if (typeof nativeOpen !== "function") return;
  if (!textGetter || !responseGetter) return;
  const patchedOpen = function patchedOpen(
    this: XMLHttpRequest,
    ...args: unknown[]
  ) {
    try {
      if (isPlayerEndpoint(String(args[1] ?? ""))) {
        watchXhrResponse(this, filter, textGetter, responseGetter);
      }
    } catch (error) {
      debug.log("Audio downloader. player response hook refused", {
        hook: "xhr",
        error: toMessage(error),
      });
    }
    return (nativeOpen as (...open: unknown[]) => void).apply(this, args);
  };
  try {
    prototype.open = markPatched(
      patchedOpen,
      nativeOpen,
    ) as typeof prototype.open;
  } catch (error) {
    debug.log("Audio downloader. player response hook refused", {
      hook: "xhr",
      error: toMessage(error),
    });
  }
}

/**
 * Installs the filter of a realm, once. Must run before the player boots, so
 * the very first response is already trimmed.
 */
export function installPlayerResponseFilter(
  targetWindow: FilterWindow,
): PlayerFormatFilter {
  const installed = targetWindow[STORE_KEY];
  if (installed) return installed;
  const filter = new PlayerFormatFilter();
  targetWindow[STORE_KEY] = filter;
  hookInitialPlayerResponse(targetWindow, filter);
  hookFetch(targetWindow, filter);
  hookXhr(targetWindow, filter);
  return filter;
}

/**
 * Covers the last entry point: a player that is handed its response directly
 * instead of fetching it. Called once the player element exists.
 */
export function patchPlayerVarsMethods(
  player: object,
  filter: PlayerFormatFilter,
): void {
  const target = player as Record<string, unknown>;
  for (const name of PLAYER_VARS_METHODS) {
    const original = target[name] as PatchedMethod | undefined;
    if (typeof original !== "function" || original[PATCHED_FLAG]) continue;
    const patched: PatchedMethod = function patchedPlayerVars(
      this: unknown,
      ...args: unknown[]
    ) {
      filter.applyToPlayerVars(args[0], name);
      return original.apply(this, args);
    };
    patched[PATCHED_FLAG] = true;
    try {
      target[name] = patched;
    } catch (error) {
      debug.log("Audio downloader. player method not writable", {
        hook: name,
        error: toMessage(error),
      });
    }
  }
}
