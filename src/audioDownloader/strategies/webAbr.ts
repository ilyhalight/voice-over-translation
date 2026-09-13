import { config } from "@vot.js/shared";
import { createAbortableDelay } from "../../utils/abort";
import debug from "../../utils/debug";
import { toErrorMessage } from "../../utils/errors";
import { createChunkAccumulator } from "../internal/chunkAccumulator";
import { isGooglevideoHost, YOUTUBE_ORIGIN } from "../internal/hosts";
import {
  createTrustedScript,
  enumerateRealms,
  getYtcfgValue,
  type RealmWindow,
} from "../internal/realms";
import { type AudioChunk, concatBuffers } from "./audioChunks";
import {
  describeFormat,
  findRefreshedFormat,
  type MediaFormat,
  selectAudioFormat,
  type SelectedFormat,
  selectVideoFallbackFormat,
} from "./formatSelection";
import {
  buildMediaRequestUrl,
  fetchMediaRange,
  getMediaTransport,
  type MediaTransport,
} from "./mediaTransport";
import { mintGvsPoToken, selectGvsPoTokenBinding } from "./poToken";
import {
  createMediaRangePlanner,
  type MediaRangeSample,
} from "./rangePlanner";
import { preprocessYouTubePlayer } from "./ytPlayerSolver.js";

/**
 * Every way of getting a GVS PO token lives in `poToken.ts`. Both helpers are
 * re-exported because they are part of this strategy's tested surface.
 */
export { mintPagePoToken, selectGvsPoTokenBinding } from "./poToken";

type YouTubeConfig = {
  data_?: Record<string, unknown>;
  get?: (key: string) => unknown;
};

type WebAbrWindow = Window & {
  ytcfg?: YouTubeConfig;
  _yt_player?: Record<string, unknown>;
};

type PageUrlInstance = {
  set?: (key: string, value: string) => void;
  get?: (key: string) => string | null;
  [key: string]: unknown;
};

type PageUrlClass = new (...args: unknown[]) => PageUrlInstance;

/**
 * `WEB_EMBEDDED_PLAYER` is answered as a third-party embed. Naming
 * youtube.com as the host makes YouTube apply the playability verdict of its
 * own surfaces instead of the embed verdict, which is answered as
 * `ERROR: Video unavailable`.
 */
const THIRD_PARTY_EMBED_URL = "https://www.reddit.com/";

type PlayabilityStatus = {
  status?: string;
  reason?: string;
  messages?: string[];
};

type MediaStreamingData = {
  /** Audio-only and video-only streams. */
  adaptiveFormats?: MediaFormat[];
  /** Streams with the video and the audio muxed into one file. */
  formats?: MediaFormat[];
};

type WebEmbeddedPlayerResponse = {
  playabilityStatus?: PlayabilityStatus;
  streamingData?: MediaStreamingData;
};

/**
 * Raised when this JS realm cannot reach the YouTube session at all: no
 * `ytcfg`, no player JS, or a CSP that blocks the challenge solver.
 *
 * Only these failures are worth retrying in another realm. A playability
 * answer (`UNPLAYABLE`, `LOGIN_REQUIRED`, "Video unavailable") comes from
 * YouTube itself and is the same in every realm, so retrying it in a hidden
 * iframe only doubles the request count and the wait before the server-side
 * fallback takes over.
 */
export class AudioRealmError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AudioRealmError";
  }
}

/** InnerTube refused to play the video for the requested client. */
class PlayerStatusError extends Error {
  readonly status: string;

  constructor(client: string, playabilityStatus?: PlayabilityStatus) {
    const status = playabilityStatus?.status ?? "failed";
    const reason =
      playabilityStatus?.reason ??
      playabilityStatus?.messages?.join(" ") ??
      "no streaming data";
    super(`Audio downloader. ${client} ${status}: ${reason}`);
    this.name = "PlayerStatusError";
    this.status = playabilityStatus?.status ?? "";
  }
}

/** GVS rejected the signed URL itself, so resuming that URL cannot help. */
class MediaAuthError extends Error {}

function getConfigValue(config: YouTubeConfig, key: string): unknown {
  // CONSOLIDATION: identical to the lookup `mseProxy` inlined; the shared
  // helper additionally survives a throwing `get` accessor.
  return getYtcfgValue(
    { ytcfg: config } as unknown as RealmWindow,
    key,
  );
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
function parseYtcfgData(source: string): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const pattern = /ytcfg\s*\.\s*set\s*\(/g;
  const skipSpaces = (index: number) => {
    while (index < source.length && /\s/.test(source[index] ?? "")) index++;
    return index;
  };
  for (let cursor = 0; cursor <= source.length;) {
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

async function resolveYtcfg(
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
      debug.log("Audio downloader. web ABR config request failed", {
        error: toErrorMessage(error),
      });
    }
  }
  if (typeof data.INNERTUBE_API_KEY !== "string") {
    throw new AudioRealmError(
      "Audio downloader. web ABR config is unavailable",
    );
  }
  debug.log("Audio downloader. web ABR config recovered", {
    source,
    hasContext: Boolean(data.INNERTUBE_CONTEXT),
    loggedIn: data.LOGGED_IN === true,
  });
  return { data_: data };
}

type PlayerRequestOptions = {
  /** `context.client` overrides that select the InnerTube client. */
  client: Record<string, unknown>;
  /** Timestamp of the player JS the sig/n solutions are built with. */
  signatureTimestamp?: unknown;
  /** Embedded clients have to declare the page that hosts the player. */
  embedUrl?: string;
};

/**
 * Clones the page InnerTube context and swaps in another client, so every
 * request keeps the session fields YouTube expects from this browser
 * (visitorData, hl/gl, screen, user agent) instead of a synthetic context.
 */
function buildPlayerRequest(
  config: YouTubeConfig,
  videoId: string,
  { client, signatureTimestamp, embedUrl }: PlayerRequestOptions,
): Record<string, unknown> {
  const rawContext = getConfigValue(config, "INNERTUBE_CONTEXT");
  if (!rawContext || typeof rawContext !== "object") {
    throw new AudioRealmError(
      "Audio downloader. InnerTube context is unavailable",
    );
  }

  const context = structuredClone(rawContext) as {
    client?: Record<string, unknown>;
    thirdParty?: Record<string, unknown>;
  };
  context.client = { ...context.client, ...client };

  const request: Record<string, unknown> = {
    context,
    videoId,
    playbackContext: {
      contentPlaybackContext: buildContentPlaybackContext(signatureTimestamp),
    },
    contentCheckOk: true,
    racyCheckOk: true,
  };
  if (embedUrl) {
    // The `player` endpoint reads the embed host from the context. A
    // top-level `thirdParty` field is not part of the request schema.
    context.thirdParty = { ...context.thirdParty, embedUrl };
  }
  return request;
}

function getPageClientVersion(config: YouTubeConfig): string | undefined {
  const version = getConfigValue(config, "INNERTUBE_CLIENT_VERSION");
  return typeof version === "string" && version ? version : undefined;
}

// WEB, WEB_EMBEDDED_PLAYER and MWEB share the page release version, so it is
// always current. Keep the cloned context value when the page has none.
function withPageClientVersion(
  config: YouTubeConfig,
  client: Record<string, unknown>,
): Record<string, unknown> {
  const clientVersion = getPageClientVersion(config);
  return clientVersion ? { clientVersion, ...client } : client;
}

/**
 * `WEB_EMBEDDED_PLAYER`: the only client that needs no GVS PO token, so it is
 * the cheapest way to reach a direct audio URL.
 */
export function buildWebEmbeddedPlayerRequest(
  config: YouTubeConfig,
  videoId: string,
  extractedSignatureTimestamp?: number,
): Record<string, unknown> {
  const request = buildPlayerRequest(config, videoId, {
    client: withPageClientVersion(config, {
      clientName: "WEB_EMBEDDED_PLAYER",
      clientScreen: "EMBED",
      originalUrl: `https://www.youtube.com/embed/${videoId}?html5=1`,
    }),
    signatureTimestamp:
      extractedSignatureTimestamp ?? getConfigValue(config, "STS"),
    embedUrl: THIRD_PARTY_EMBED_URL,
  });

  // Embedded player requests may have to carry encryptedHostFlags, and
  // sending it unconditionally does no harm (yt-dlp does the same).
  const { contentPlaybackContext } = request.playbackContext as {
    contentPlaybackContext: Record<string, unknown>;
  };
  const playerContexts = getConfigValue(
    config,
    "WEB_PLAYER_CONTEXT_CONFIGS",
  ) as
    | {
        WEB_PLAYER_CONTEXT_CONFIG_ID_EMBEDDED_PLAYER?: {
          encryptedHostFlags?: unknown;
        };
      }
    | undefined;
  const encryptedHostFlags =
    playerContexts?.WEB_PLAYER_CONTEXT_CONFIG_ID_EMBEDDED_PLAYER
      ?.encryptedHostFlags;
  if (typeof encryptedHostFlags === "string" && encryptedHostFlags) {
    contentPlaybackContext.encryptedHostFlags = encryptedHostFlags;
  }

  return request;
}

/**
 * `MWEB`: shares the cookies and the version scheme of the page and is not
 * SABR-only. Its stream URLs need a GVS PO token, which the page BotGuard
 * instance mints for free.
 */
export function buildMwebPlayerRequest(
  config: YouTubeConfig,
  videoId: string,
  signatureTimestamp?: number,
): Record<string, unknown> {
  return buildPlayerRequest(config, videoId, {
    client: withPageClientVersion(config, {
      clientName: "MWEB",
      clientScreen: "WATCH",
      originalUrl: `https://m.youtube.com/watch?v=${videoId}`,
    }),
    signatureTimestamp: signatureTimestamp ?? getConfigValue(config, "STS"),
  });
}

/**
 * `WEB_CREATOR`: answers with direct URLs for a signed-in session, including
 * videos the embedded player refuses to play. It is useless without account
 * cookies, so the ladder skips it for anonymous sessions.
 */
export function buildWebCreatorPlayerRequest(
  config: YouTubeConfig,
  videoId: string,
  signatureTimestamp?: number,
): Record<string, unknown> {
  const pageVersion = getPageClientVersion(config);
  return buildPlayerRequest(config, videoId, {
    client: {
      clientName: "WEB_CREATOR",
      // The creator app ships the page release date under a `1.x` major.
      clientVersion: pageVersion
        ? pageVersion.replace(/^\d+\./, "1.")
        : "1.20260101.00.00",
      clientScreen: "WATCH",
    },
    signatureTimestamp: signatureTimestamp ?? getConfigValue(config, "STS"),
  });
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

async function getYouTubeAuthorization(
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
  const schemes: Array<[string, string | undefined]> = [
    ["SAPISIDHASH", cookies.get("SAPISID") ?? cookies.get("__Secure-3PAPISID")],
    ["SAPISID1PHASH", cookies.get("__Secure-1PAPISID")],
    ["SAPISID3PHASH", cookies.get("__Secure-3PAPISID")],
  ];
  const authorizations = await Promise.all(
    schemes.map(async ([scheme, sid]) =>
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

function getPlayerUrl(config: YouTubeConfig): string | undefined {
  const playerContexts = getConfigValue(
    config,
    "WEB_PLAYER_CONTEXT_CONFIGS",
  ) as
    | {
        WEB_PLAYER_CONTEXT_CONFIG_ID_EMBEDDED_PLAYER?: { jsUrl?: unknown };
      }
    | undefined;
  const value =
    getConfigValue(config, "PLAYER_JS_URL") ??
    getConfigValue(config, "JS_URL") ??
    playerContexts?.WEB_PLAYER_CONTEXT_CONFIG_ID_EMBEDDED_PLAYER?.jsUrl;
  return typeof value === "string"
    ? new URL(value, YOUTUBE_ORIGIN).toString()
    : undefined;
}


// A sandboxed or proxied global can lack trustedTypes while its Function is
// still Trusted Types-checked. The policy and the Function sink must live in
// the same realm, so probe same-origin ancestors for the policy factory.
/**
 * Finds a realm that exposes `trustedTypes.createPolicy`.
 *
 * A sandboxed or proxied global can lack `trustedTypes` while its `Function`
 * is still Trusted Types-checked, and the policy plus the eval sink must live
 * in the same realm, so same-origin ancestors are probed too.
 *
 * CONSOLIDATION: the self/parent/top walk is `internal/realms.enumerateRealms`
 * (shared with `poToken.collectRealms`).
 */
function resolveTrustedRealm(realm: Window): Window {
  for (const candidate of enumerateRealms(realm as RealmWindow)) {
    try {
      if (candidate.trustedTypes?.createPolicy) return candidate as Window;
    } catch {
      // Cross-origin access is denied.
    }
  }
  return realm;
}

// Chrome's Function constructor rejects TrustedScript arguments
// (crbug.com/1087743), so evaluate through eval, which accepts TrustedScript.
/**
 * Evaluates `source` in `realm`.
 *
 * Chrome's `Function` constructor rejects a TrustedScript argument
 * (crbug.com/1087743), so `eval`, which accepts one, is used instead.
 *
 * CONSOLIDATION + DEFECT FIX (F-5): the policy comes from the per-realm cache
 * in `internal/realms.createTrustedScript` instead of a freshly named policy
 * per call.
 */
function evalInRealm(realm: Window, source: string): unknown {
  const nativeRealm = resolveTrustedRealm(realm);
  const script = createTrustedScript(
    nativeRealm as RealmWindow,
    source,
    "vot-youtube-solver",
  );
  return (nativeRealm as unknown as { eval: (value: unknown) => unknown }).eval(
    script,
  );
}

// A CSP without unsafe-eval blocks the AST solver, which is the only way to
// solve sig/n when the page player keeps its factories IIFE-local. Probing it
// costs nothing and lets the caller pick a realm that can finish the job.
export function canSolveChallengesInRealm(realm: Window): boolean {
  try {
    return evalInRealm(realm, "1+1") === 2;
  } catch {
    return false;
  }
}

function runChallengeSolver(
  realm: Window,
  preparedPlayer: string,
  signature?: string,
  n?: string,
): { signature?: string; n?: string } {
  // The IIFE keeps the player locals out of the page, and handing its result
  // back as the completion value keeps the solver working when eval runs in
  // another realm than the caller (a sandboxed userscript).
  const source = `(function(){\nconst _result={sig:null,n:null};\n${preparedPlayer}\nreturn _result;\n})()`;
  const result = evalInRealm(realm, source) as {
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

async function* resolveFormatUrls(
  targetWindow: WebAbrWindow,
  format: MediaFormat,
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

async function postInnertubePlayer(
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
  const response = await targetWindow.fetch(
    `https://www.youtube.com/youtubei/v1/player?prettyPrint=false&key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      credentials: "include",
      signal,
      headers: {
        "content-type": "application/json",
        "x-youtube-client-name": clientName,
        "x-youtube-client-version": clientVersion,
        ...(typeof visitorData === "string"
          ? { "x-goog-visitor-id": visitorData }
          : {}),
        ...(extra.authorization
          ? {
              authorization: extra.authorization,
              "x-origin": "https://www.youtube.com",
              "x-youtube-bootstrap-logged-in": "true",
            }
          : {}),
        ...(typeof extra.sessionIndex === "number" ||
        typeof extra.sessionIndex === "string"
          ? { "x-goog-authuser": String(extra.sessionIndex) }
          : {}),
        ...(typeof extra.delegatedSessionId === "string" &&
        extra.delegatedSessionId
          ? { "x-goog-pageid": extra.delegatedSessionId }
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

const MEDIA_RETRY_DELAY_MS = 250;
/**
 * Retries of one ranged request: the first covers a transport hiccup, the
 * second re-signs the URL in case the signature expired mid-download. A GVS
 * verdict (403) is not retried at all, so no time is spent on an answer that
 * never changes.
 */
const MEDIA_RANGE_RETRIES = 2;
/**
 * YouTube paces a single continuous `videoplayback` body down to playback
 * speed (~30-50 kbps), which is what made a 6.5 MB Opus track take ~15
 * minutes to read. Every separate `Range` request is answered at the full
 * speed of the connection instead — the trick yt-dlp uses with
 * `--http-chunk-size` — but YouTube throttles any range above ~10 MiB.
 *
 * How big a range is and how many of them overlap is decided per download by
 * `rangePlanner`, from what the previous range measured: a fast link reads
 * fewer and bigger ranges, a slow or flaky one keeps them small so a dropped
 * answer costs little. The consumer uploads each chunk to the translation
 * backend while the next range is already on its way.
 */

/**
 * GVS refuses the signed URLs of a client in bursts — `mweb` most of all,
 * because its PO token is minted by the web client of the page and because
 * `Origin`, `Referer` and `User-Agent` are forbidden header names a page
 * cannot set. Asking a refused client again in the same session costs a
 * `player` request plus a media request for the very same 403, so the verdict
 * is remembered for a few minutes and the ladder moves on to `web_mse_proxy`.
 */
const REFUSED_CLIENT_TTL_MS = 5 * 60_000;
const refusedClients = new Map<string, number>();

function isClientRefusedRecently(name: string): boolean {
  const refusedAt = refusedClients.get(name);
  if (refusedAt === undefined) return false;
  if (Date.now() - refusedAt < REFUSED_CLIENT_TTL_MS) return true;
  refusedClients.delete(name);
  return false;
}
const STS_PATTERN = /(?:signatureTimestamp|sts)\s*:\s*([0-9]{5})/;

/** Session facts every player request is built from. */
type PlayerSession = {
  readonly config: YouTubeConfig;
  readonly videoId: string;
  readonly signatureTimestamp?: number;
};

type PlayerClient = {
  /** yt-dlp client name, used in the logs. */
  readonly name: string;
  /** `x-youtube-client-name` value. */
  readonly id: string;
  readonly build: (session: PlayerSession) => Record<string, unknown>;
  /** YouTube only answers this client for a signed-in session. */
  readonly requiresLogin?: boolean;
  /** GVS answers 403 for this client's URLs without a GVS PO token. */
  readonly requiresPoToken?: boolean;
};

/**
 * Ordered ladder of InnerTube clients that still answer a browser session with
 * direct (non-SABR) media URLs, cheapest first: `web_embedded` needs no PO
 * token at all, `mweb` needs one but works for an anonymous session too, and
 * `web_creator` needs both a signed-in session and a token.
 *
 * `WEB` was removed: since April 2025 it is answered SABR-only, so its
 * `adaptiveFormats` never carry a URL and its `player` request is always
 * wasted. That case is covered by the MediaSource strategy instead.
 * TVHTML5 (`tv_downgraded`) answers `UNPLAYABLE: The page needs to be
 * reloaded` and moved its `sig`/`n` code into a separate
 * `tv-player-ias-tcl.js` variant, so it can no longer succeed from a browser.
 * The headset clients (`ANDROID_VR`, `VISIONOS`) are not usable from a page
 * either: they cannot send the page cookies, they are not covered by the PO
 * token the page BotGuard mints for the web clients, and GVS answers their
 * formats with 403, so every request spent on them is lost.
 */
const PLAYER_CLIENTS: readonly PlayerClient[] = [
  {
    name: "web_embedded",
    id: "56",
    build: ({ config, videoId, signatureTimestamp }) =>
      buildWebEmbeddedPlayerRequest(config, videoId, signatureTimestamp),
  },
  {
    name: "mweb",
    id: "2",
    requiresPoToken: true,
    build: ({ config, videoId, signatureTimestamp }) =>
      buildMwebPlayerRequest(config, videoId, signatureTimestamp),
  },
  {
    name: "web_creator",
    id: "62",
    requiresLogin: true,
    // Every `web*` client but `web_embedded` is answered with URLs GVS only
    // serves with a `pot`, so without a token this client can do nothing but
    // collect a 403.
    requiresPoToken: true,
    build: ({ config, videoId, signatureTimestamp }) =>
      buildWebCreatorPlayerRequest(config, videoId, signatureTimestamp),
  },
];

function readTotalLength(response: Response, offset: number): number {
  const ranged = Number(
    /\/(\d+)\s*$/.exec(response.headers.get("content-range") ?? "")?.[1],
  );
  if (ranged > 0) return ranged;
  const length = Number(response.headers.get("content-length"));
  if (!(length > 0)) return 0;
  return response.status === 206 ? length + offset : length;
}

/** What one ranged request reported about the link it was answered over. */
type RangeMeasurement = Partial<MediaRangeSample>;

/**
 * Downloads the selected format with explicit ranged requests.
 *
 * A single continuous body is paced by YouTube down to playback speed, while
 * every separate `Range: bytes=start-end` request is answered at the full
 * speed of the connection — the same reason yt-dlp downloads in fixed-size
 * HTTP chunks. A few ranges are kept in flight, so uploading one chunk
 * overlaps downloading the next. `Range` is a CORS-safelisted header, so none
 * of this costs a preflight request.
 */
async function* streamMediaFormat(
  targetWindow: Window,
  streamUrl: string,
  signal: AbortSignal,
  refreshUrl: () => Promise<string>,
  expectedLength?: number,
): AsyncGenerator<AudioChunk> {
  /**
   * The privileged transport is preferred: GVS omits the CORS headers on its
   * cross-host redirect, so a page request can never read that answer.
   */
  let transport: MediaTransport = getMediaTransport();
  let url = buildMediaRequestUrl(streamUrl, transport);
  /** The size the format announced, or what the first answer reports. */
  let total = expectedLength && expectedLength > 0 ? expectedLength : 0;
  let received = 0;
  /** Only a `206` proves ranges are honored and may be asked in parallel. */
  let rangesHonored = false;
  /** Nothing is left to ask for: the whole announced size was requested. */
  let exhausted = false;
  let nextStart = 0;
  /**
   * One re-signing per download, for a URL that expired mid-download.
   * Overlapping ranges share that one request instead of spending one each.
   */
  let resigning: Promise<void> | undefined;
  const resign = () => {
    // A refresh that fails does not end the download: the URL in hand is
    // usually still readable (the refresh exists for a signature that expired
    // mid-download), while a rejection here used to abort a download that had
    // already moved megabytes. A second 403 is answered as a verdict anyway,
    // because `resigning` stays set.
    resigning ??= refreshUrl()
      .then((refreshed) => {
        url = buildMediaRequestUrl(refreshed, transport);
      })
      .catch((error) => {
        debug.log("Audio downloader. media URL refresh failed", {
          error: toErrorMessage(error),
        });
      });
    return resigning;
  };
  /**
   * Falls back to the page transport once. A failure of the privileged one is
   * about this realm, not about the range, so it must not eat a retry — and
   * the URL has to be rebuilt, because only `alr=yes` keeps a GVS redirect
   * readable from a page.
   */
  let downgraded = false;
  const downgradeTransport = (error: unknown): boolean => {
    if (transport !== "gm" || downgraded) return false;
    downgraded = true;
    transport = "page";
    url = buildMediaRequestUrl(url, transport);
    debug.log("Audio downloader. media transport downgraded", {
      transport,
      error: toErrorMessage(error),
    });
    return true;
  };

  /** One ranged request, retried while it can still succeed. */
  const fetchRange = async (
    start: number,
    size: number,
    measured: RangeMeasurement,
  ): Promise<Uint8Array> => {
    let retries = 0;
    for (;;) {
      signal.throwIfAborted();
      const requestedAt = performance.now();
      try {
        const response = await fetchMediaRange({
          transport,
          targetWindow,
          url,
          range: `bytes=${start}-${start + size - 1}`,
          signal,
        });
        // Time to the answer, which is the RTT estimate the planner reads.
        measured.latencyMs = performance.now() - requestedAt;
        if (!response.ok) {
          const message = `Audio downloader. Media request failed (${response.status})`;
          // A range that starts past the end: the format is already complete.
          if (response.status === 416 && start > 0) return new Uint8Array(0);
          if (response.status === 403) {
            // Before the first byte this is a verdict on the whole URL: GVS
            // refused the PO token binding, and every retry is answered the
            // same way. Mid-download it means the signed URL expired instead,
            // which exactly one refresh fixes.
            if (received === 0 || resigning) throw new MediaAuthError(message);
            measured.unstable = true;
            await resign();
            continue;
          }
          throw new Error(message);
        }
        if ((response.headers.get("content-type") ?? "").startsWith("text/")) {
          // Some hosts answer with the next host as plain text instead of a 302.
          const redirect = new URL((await response.text()).trim());
          if (!isGooglevideoHost(redirect.hostname)) {
            throw new Error("Audio downloader. Invalid media redirect");
          }
          url = buildMediaRequestUrl(redirect.toString(), transport);
          measured.unstable = true;
          continue;
        }
        total ||= readTotalLength(response, start);
        const body = new Uint8Array(await response.arrayBuffer());
        measured.durationMs = performance.now() - requestedAt;
        if (response.status === 206) {
          rangesHonored = true;
          return body;
        }
        // A host that ignores the header answers the whole format from byte
        // zero instead, so the asked range is cut out of that answer and the
        // ranges stay sequential.
        return start > 0 ? body.subarray(start) : body;
      } catch (error) {
        signal.throwIfAborted();
        // GVS rejected the signed URL itself. Asking for the same bytes again
        // is answered the same way, so it is reported at once.
        if (error instanceof MediaAuthError) throw error;
        // A privileged transport that is not usable in this realm (no GM API,
        // or a manager that refuses the host): the same range is asked again
        // through the page instead of spending a retry on it.
        if (downgradeTransport(error)) {
          measured.unstable = true;
          continue;
        }
        retries += 1;
        measured.unstable = true;
        if (retries > MEDIA_RANGE_RETRIES) throw error;
        debug.log("Audio downloader. retrying media range", {
          start,
          size,
          retries,
          transport,
          error: toErrorMessage(error),
        });
        await createAbortableDelay(MEDIA_RETRY_DELAY_MS * retries, signal);
        // Asking for the same range again is cheapest, so the URL is
        // re-signed only after that failed as well.
        if (retries === MEDIA_RANGE_RETRIES) await resign();
      }
    }
  };

  const planner = createMediaRangePlanner();
  /** Ranges already requested, in the order their bytes are needed. */
  const inFlight: Array<{
    size: number;
    bytes: Promise<Uint8Array>;
    startedAt: number;
    measured: RangeMeasurement;
  }> = [];
  const schedule = () => {
    // Ranges are only overlapped once an answer proved they are honored, and
    // the bigger the range the fewer of them, so the bytes in flight stay
    // away from the throttle.
    const limit = rangesHonored ? planner.parallelism : 1;
    while (!exhausted && inFlight.length < limit) {
      const planned = planner.rangeSize;
      const size = total ? Math.min(planned, total - nextStart) : planned;
      if (size <= 0) {
        exhausted = true;
        break;
      }
      const start = nextStart;
      nextStart += size;
      const measured: RangeMeasurement = {};
      inFlight.push({
        size,
        measured,
        startedAt: performance.now(),
        bytes: fetchRange(start, size, measured),
      });
      exhausted = total > 0 && nextStart >= total;
    }
  };

  // CONSOLIDATION: shared with `mseProxy.captureMseStream`.
  const accumulator = createChunkAccumulator(config.minChunkSize);
  let ranges = 0;
  const startedAt = Date.now();
  try {
    for (;;) {
      schedule();
      const range = inFlight.shift();
      if (!range) break;
      const bytes = await range.bytes;
      ranges += 1;
      // The next ranges are sized from what this one measured. The duration
      // is the one the request itself reported: measuring it here would also
      // count the time the consumer spent uploading the previous chunk.
      planner.complete({
        bytes: bytes.byteLength,
        durationMs:
          range.measured.durationMs ?? performance.now() - range.startedAt,
        latencyMs: range.measured.latencyMs,
        unstable: range.measured.unstable,
      });
      let chunk: Uint8Array | undefined;
      if (bytes.byteLength) {
        received += bytes.byteLength;
        chunk = accumulator.add(bytes);
      }
      // A short answer is the end of the format, which is also how a stream
      // of unannounced size ends.
      if (bytes.byteLength < range.size) exhausted = true;
      const ended = exhausted && inFlight.length === 0;
      if (ended) {
        if (!received) throw new Error("Audio downloader. Empty audio");
        if (total > 0 && received < total) {
          throw new Error(
            `Audio downloader. Media stream ended early (${received}/${total})`,
          );
        }
      }
      const isLastChunk = ended || (total > 0 && received >= total);
      if (!chunk && !isLastChunk) continue;
      yield {
        buffer: chunk ?? accumulator.flush() ?? concatBuffers([]),
        isLastChunk,
      };
      if (isLastChunk) {
        debug.log("Audio downloader. media download finished", {
          received,
          ranges,
          rangeSize: planner.rangeSize,
          transport,
          seconds: Math.round((Date.now() - startedAt) / 100) / 10,
        });
        return;
      }
    }
  } finally {
    // A consumer that stops early (an aborted download) leaves the
    // overlapping requests behind, and their rejection is nobody's error.
    for (const range of inFlight) void range.bytes.catch(() => undefined);
  }

  if (!received) throw new Error("Audio downloader. Empty audio");
  yield { buffer: concatBuffers(pending), isLastChunk: true };
}

/** Everything a download needs that does not depend on the chosen format. */
type MediaSession = {
  readonly targetWindow: WebAbrWindow;
  readonly signal: AbortSignal;
  readonly fetchPlayerCode: () => Promise<string | undefined>;
  readonly authorizeUrl: (streamUrl: string) => Promise<string>;
};

/**
 * Streams one selected format.
 *
 * `sig`/`n` can have more than one candidate solution, so the candidates are
 * tried in order until one of them is answered with media bytes. A refused
 * signature ends the format immediately: GVS answers every candidate of the
 * same format the same way, so trying the rest only spends refused requests.
 */
async function* streamSelectedFormat(
  media: MediaSession,
  format: MediaFormat,
  refreshFormat: () => Promise<MediaFormat>,
): AsyncGenerator<AudioChunk> {
  const { targetWindow, signal, fetchPlayerCode, authorizeUrl } = media;
  // The format reports its own size, so probing it costs no request.
  const contentLength = Number(format.contentLength) || undefined;
  // Signed URLs expire mid-download on slow connections; one extra player
  // request then resumes the same format by byte offset.
  const refreshUrl = async () => {
    const refreshed = await refreshFormat();
    for await (const url of resolveFormatUrls(
      targetWindow,
      refreshed,
      fetchPlayerCode,
      signal,
    )) {
      return await authorizeUrl(url);
    }
    throw new Error("Audio downloader. Refreshed media URL unavailable");
  };

  let lastError: unknown;
  for await (const solvedUrl of resolveFormatUrls(
    targetWindow,
    format,
    fetchPlayerCode,
    signal,
  )) {
    let emitted = false;
    try {
      const streamUrl = await authorizeUrl(solvedUrl);
      for await (const chunk of streamMediaFormat(
        targetWindow,
        streamUrl,
        signal,
        refreshUrl,
        contentLength,
      )) {
        emitted = true;
        yield chunk;
      }
      return;
    } catch (error) {
      signal.throwIfAborted();
      if (emitted || error instanceof MediaAuthError) throw error;
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Audio downloader. media format URL is unavailable");
}

/**
 * Matches the re-issued copy of a format in a fresh `player` answer.
 *
 * The stream is identified by its itag and its audio track only, the rule
 * `formatSelection` owns. Comparing `contentLength`, `lastModified` and the
 * exact `mimeType` string as well is what turned a URL refresh into
 * "Refreshed format changed": a second answer for the same video reports
 * those differently often enough that the refresh failed more often than it
 * worked, in the middle of a download that was fine.
 */
function findRefreshedStreamingFormat(
  streaming: MediaStreamingData | undefined,
  format: MediaFormat,
): MediaFormat | undefined {
  return findRefreshedFormat(
    [...(streaming?.adaptiveFormats ?? []), ...(streaming?.formats ?? [])],
    format,
  );
}

type DownloadStage = {
  readonly kind: "audio" | "video";
  readonly select: (streaming: MediaStreamingData) => SelectedFormat;
};

/**
 * The audio pass is the only normal one: the translation needs the audio
 * track, and a low-bitrate Opus stream is the cheapest way to move it.
 *
 * The video pass is the last resort of this strategy, for uploads that answer
 * no usable audio-only stream at all. It reuses the `player` answers of the
 * audio pass, so it costs no extra InnerTube request, and it picks the
 * smallest picture YouTube offers (144p, or the cheapest muxed format when a
 * video-only stream would arrive without any audio).
 */
const DOWNLOAD_STAGES: readonly DownloadStage[] = [
  {
    kind: "audio",
    // Only adaptive formats are audio-only: `formats` are muxed with video.
    select: ({ adaptiveFormats }) => selectAudioFormat(adaptiveFormats ?? []),
  },
  {
    kind: "video",
    select: ({ formats, adaptiveFormats }) =>
      selectVideoFallbackFormat([
        ...(formats ?? []),
        ...(adaptiveFormats ?? []),
      ]),
  },
];

/**
 * Streams the audio track of a YouTube video from the current realm.
 *
 * Request budget on the happy path: one InnerTube player request plus one
 * media request for the whole track. The player JS, the PO token, the
 * fallback clients and the video fallback are only paid for when the cheap
 * path cannot answer, and every result is cached for the rest of the download.
 */
export async function* getWebAbrAudioChunks(
  targetWindow: WebAbrWindow,
  videoId: string,
  signal: AbortSignal,
): AsyncGenerator<AudioChunk> {
  const config = await resolveYtcfg(targetWindow, signal);
  const apiKey = getConfigValue(config, "INNERTUBE_API_KEY");
  if (typeof apiKey !== "string") {
    throw new AudioRealmError(
      "Audio downloader. web ABR config is unavailable",
    );
  }

  // The player JS is only needed to solve sig/n or to recover the signature
  // timestamp, so it stays lazy and is downloaded at most once.
  let playerCode: Promise<string | undefined> | undefined;
  const fetchPlayerCode = () => {
    const url = getPlayerUrl(config);
    if (!url) return Promise.resolve(undefined);
    playerCode ??= targetWindow.fetch(url, { signal }).then((response) => {
      if (!response.ok) {
        throw new AudioRealmError(
          `Audio downloader. YouTube player request failed (${response.status})`,
        );
      }
      return response.text();
    });
    return playerCode;
  };

  let sts = Number(getConfigValue(config, "STS"));
  if (!(sts > 0)) {
    const code = await fetchPlayerCode();
    sts = Number(code ? STS_PATTERN.exec(code)?.[1] : undefined);
  }

  const loggedIn = getConfigValue(config, "LOGGED_IN") === true;
  const session: PlayerSession = {
    config,
    videoId,
    signatureTimestamp: sts > 0 ? sts : undefined,
  };

  const visitorData = getConfigValue(config, "VISITOR_DATA");
  const dataSyncId = getConfigValue(config, "DATASYNC_ID");
  const [firstSyncId, secondSyncId] =
    typeof dataSyncId === "string" ? dataSyncId.split("||") : [];
  const delegatedSessionId =
    getConfigValue(config, "DELEGATED_SESSION_ID") ??
    (secondSyncId ? firstSyncId : undefined);
  const authorization = await getYouTubeAuthorization(
    targetWindow,
    String(
      getConfigValue(config, "USER_SESSION_ID") ??
        (secondSyncId || firstSyncId) ??
        "",
    ) || undefined,
  );
  const sessionIndex = getConfigValue(config, "SESSION_INDEX");
  const auth = { authorization, sessionIndex, delegatedSessionId };
  const playerContexts = getConfigValue(config, "WEB_PLAYER_CONTEXT_CONFIGS");
  const experimentFlags = Object.values(
    playerContexts && typeof playerContexts === "object" ? playerContexts : {},
  ).flatMap((entry: { serializedExperimentFlags?: unknown } | null) =>
    typeof entry?.serializedExperimentFlags === "string"
      ? [entry.serializedExperimentFlags]
      : [],
  );
  debug.log("Audio downloader. player auth state", {
    videoId,
    host: targetWindow.location.hostname,
    hasAuthorization: Boolean(authorization),
    sessionIndex: sessionIndex ?? "none",
    hasDelegatedSession: Boolean(delegatedSessionId),
    loggedIn,
  });

  // One binding, one token, no network request: it is minted by the BotGuard
  // instance of the page (or read off the media URLs the page player already
  // signed) and reused for every URL of this download.
  let poTokenBinding = selectGvsPoTokenBinding(videoId, {
    loggedIn,
    dataSyncId,
    visitorData,
    experimentFlags,
  });
  let poToken: Promise<string | undefined> | undefined;
  let replacePoToken = false;
  const mintPoToken = () => {
    poToken ??= mintGvsPoToken(targetWindow, poTokenBinding.value, signal);
    return poToken;
  };
  /**
   * GVS refused a session-bound token: the video-id binding is the documented
   * alternative and YouTube rolls it out per session, so it is worth one more
   * media request before the client is given up on.
   */
  const rotatePoTokenBinding = async (): Promise<boolean> => {
    if (poTokenBinding.kind === "video") return false;
    poTokenBinding = { kind: "video", value: videoId };
    poToken = undefined;
    replacePoToken = true;
    const token = await mintPoToken();
    debug.log("Audio downloader. rotated GVS PO token binding", {
      videoId,
      binding: poTokenBinding.kind,
      hasPoToken: Boolean(token),
    });
    return Boolean(token);
  };
  const authorizeUrl = async (streamUrl: string): Promise<string> => {
    const url = new URL(streamUrl);
    if (url.searchParams.has("pot") && !replacePoToken) return url.toString();
    const token = await mintPoToken();
    if (token) url.searchParams.set("pot", token);
    return url.toString();
  };
  const media: MediaSession = {
    targetWindow,
    signal,
    fetchPlayerCode,
    authorizeUrl,
  };

  /**
   * One `player` request per client for the whole download: its answer is
   * shared by the audio pass, by the video fallback and by a URL refresh, and
   * a client that already answered a verdict is never asked again.
   */
  const answers = new Map<string, WebEmbeddedPlayerResponse | Error>();
  const requestPlayer = async (
    client: PlayerClient,
    refresh = false,
  ): Promise<WebEmbeddedPlayerResponse> => {
    const cached = answers.get(client.name);
    if (cached && !refresh) {
      if (cached instanceof Error) throw cached;
      return cached;
    }
    const body = client.build(session);
    const clientContext = (body.context as { client: Record<string, unknown> })
      .client;
    if (typeof visitorData === "string" && !clientContext.visitorData) {
      clientContext.visitorData = visitorData;
    }
    try {
      const response = await postInnertubePlayer(
        targetWindow,
        signal,
        apiKey,
        body,
        client.id,
        String(clientContext.clientVersion ?? ""),
        auth,
      );
      const streaming = response.streamingData;
      if (!streaming?.adaptiveFormats?.length && !streaming?.formats?.length) {
        throw new PlayerStatusError(client.name, response.playabilityStatus);
      }
      answers.set(client.name, response);
      return response;
    } catch (error) {
      signal.throwIfAborted();
      // The verdict is remembered so the next pass skips this client instead
      // of spending another request on the same answer.
      if (error instanceof Error && !answers.has(client.name)) {
        answers.set(client.name, error);
      }
      throw error;
    }
  };

  const clients: PlayerClient[] = [];
  for (const client of PLAYER_CLIENTS) {
    // A request that can only be refused is never sent.
    const skipped = isClientRefusedRecently(client.name)
      ? "GVS refused it in this session"
      : client.requiresLogin && !loggedIn
        ? "anonymous session"
        : client.requiresPoToken && !(await mintPoToken())
          ? "no GVS PO token"
          : undefined;
    if (!skipped) {
      clients.push(client);
      continue;
    }
    debug.log("Audio downloader. skipping player client", {
      videoId,
      client: client.name,
      reason: skipped,
    });
  }

  /** Clients whose signed URLs GVS refused: their video formats are too. */
  const refused = new Set<string>();
  let lastError: unknown;
  let emitted = false;
  for (const stage of DOWNLOAD_STAGES) {
    const usable = clients.filter(
      (client) =>
        !refused.has(client.name) &&
        !(answers.get(client.name) instanceof Error),
    );
    // Every client already answered a verdict or had its signature refused:
    // another pass would only collect the same answers a second time.
    if (!usable.length) break;
    clientLoop: for (const client of usable) {
      signal.throwIfAborted();
      if (refused.has(client.name)) continue;
      // Two attempts per client: a session-bound token GVS refused is retried
      // once with the video-id binding, which costs one media request and no
      // player request, because the client's answer is already cached.
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const { streamingData } = await requestPlayer(client);
          const selected = stage.select(streamingData ?? {});
          debug.log("Audio downloader. selected media format", {
            videoId,
            client: client.name,
            stage: stage.kind,
            reason: selected.reason,
            track: selected.track?.key ?? "single",
            language: selected.track?.language ?? "unknown",
            content: selected.track?.content ?? "unknown",
            ...describeFormat(selected.format),
          });
          for await (const chunk of streamSelectedFormat(
            media,
            selected.format,
            async () => {
              const refreshed = findRefreshedStreamingFormat(
                (await requestPlayer(client, true)).streamingData,
                selected.format,
              );
              // The itag is gone from the fresh answer: the format in hand is
              // re-signed with the current player code instead, which is
              // still better than ending a download that is under way.
              return refreshed ?? selected.format;
            },
          )) {
            emitted = true;
            yield chunk;
          }
          return;
        } catch (error) {
          signal.throwIfAborted();
          if (emitted) throw error;
          lastError = error;
          const authRefused = error instanceof MediaAuthError;
          debug.log("Audio downloader. player client failed", {
            videoId,
            client: client.name,
            stage: stage.kind,
            attempt,
            error: toErrorMessage(error),
            ...(authRefused
              ? {
                  refused: true,
                  binding: poTokenBinding.kind,
                  hasPoToken: Boolean(await poToken),
                }
              : {}),
          });
          if (authRefused && attempt === 0 && (await rotatePoTokenBinding())) {
            continue;
          }
          if (authRefused) {
            // GVS refused this client's signature, not the format, so its
            // video formats are answered the same way — and so is the next
            // download of this session.
            refused.add(client.name);
            refusedClients.set(client.name, Date.now());
          }
          // Without cookies no other client can pass a sign-in check, so stop
          // instead of spending a request per remaining client.
          if (
            !loggedIn &&
            error instanceof PlayerStatusError &&
            error.status === "LOGIN_REQUIRED"
          ) {
            break clientLoop;
          }
          break;
        }
      }
    }
  }

  const fallbackError =
    lastError instanceof Error
      ? lastError
      : new Error("Audio downloader. no playable audio formats");
  if (/LOGIN_REQUIRED|UNPLAYABLE/.test(fallbackError.message)) {
    throw new Error(
      `${fallbackError.message}. Sign in to YouTube with an age-verified account and retry from the youtube.com watch page`,
      { cause: fallbackError },
    );
  }
  throw fallbackError;
}
