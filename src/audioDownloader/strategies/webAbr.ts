import { config } from "@vot.js/shared";
import { createAbortableDelay } from "../../utils/abort";
import debug from "../../utils/debug";
import { type AudioChunk, concatBuffers } from "./audioChunks";
import { preprocessYouTubePlayer } from "./ytPlayerSolver.js";

const MEDIA_RANGE_SIZES = [60_000, 80_000, 150_000, 330_000, 460_000];

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

type WebEmbeddedFormat = {
  itag?: number;
  url?: string;
  mimeType?: string;
  bitrate?: number;
  contentLength?: string;
  lastModified?: string;
  signatureCipher?: string;
};

type WebEmbeddedPlayerResponse = {
  responseContext?: {
    mainAppWebResponseContext?: { datasyncId?: string };
  };
  playabilityStatus?: {
    status?: string;
    reason?: string;
    messages?: string[];
  };
  streamingData?: {
    adaptiveFormats?: WebEmbeddedFormat[];
    formats?: WebEmbeddedFormat[];
  };
};

type FetchedClientConfig = {
  apiKey?: string;
  clientVersion?: string;
  visitorData?: string;
  playerUrl?: string;
  signatureTimestamp?: number;
  dataSyncId?: string;
  experimentFlags?: string[];
};

async function fetchTvConfig(
  targetWindow: Window,
  signal: AbortSignal,
  videoId: string,
): Promise<FetchedClientConfig | undefined> {
  try {
    const response = await targetWindow.fetch("https://www.youtube.com/tv", {
      credentials: "include",
      signal,
    });
    if (!response.ok) {
      throw new Error(
        `Audio downloader. tv config request failed (${response.status})`,
      );
    }
    const html = await response.text();
    const pick = (patterns: RegExp[]): string | undefined => {
      for (const pattern of patterns) {
        const match = pattern.exec(html);
        if (match?.[1]) return match[1];
      }
    };
    const playerPath = pick([/"PLAYER_JS_URL":"([^"]+)"/, /"jsUrl":"([^"]+)"/]);
    const sts = Number(pick([/"STS":(\d+)/, /"signatureTimestamp":(\d+)/]));
    const experimentFlags: string[] = [];
    for (const match of html.matchAll(
      /"serializedExperimentFlags"\s*:\s*("(?:\\.|[^"\\])*")/g,
    )) {
      try {
        experimentFlags.push(JSON.parse(match[1] ?? '""') as string);
      } catch {
        // Malformed optional flags must not discard the rest of the config.
      }
    }
    return {
      apiKey: pick([/"INNERTUBE_API_KEY":"([^"]+)"/]),
      clientVersion: pick([/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/]),
      visitorData: pick([/"VISITOR_DATA":"([^"]+)"/]),
      dataSyncId: pick([/"DATASYNC_ID":"([^"]+)"/]),
      experimentFlags,
      playerUrl: playerPath
        ? new URL(playerPath, "https://www.youtube.com").toString()
        : undefined,
      signatureTimestamp: Number.isFinite(sts) && sts > 0 ? sts : undefined,
    };
  } catch (error) {
    signal.throwIfAborted();
    debug.log("Audio downloader. client config unavailable", {
      videoId,
      client: "tv",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

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
  const realms = new Set<WebAbrWindow>([pageWindow]);
  try {
    realms.add(pageWindow.parent as WebAbrWindow);
    realms.add(pageWindow.top as WebAbrWindow);
  } catch {
    // Cross-origin access is denied.
  }
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
          if (typeof token === "string" && token) return token;
        } catch (error) {
          if (!String(error).includes("SDF:notready")) break;
        }
        await createAbortableDelay(500, signal);
      }
    }
  }
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
    return { kind: "video", value: videoId };
  }
  // Authenticated GVS uses the full datasync ID, including the || separator.
  const value = options.loggedIn ? options.dataSyncId : options.visitorData;
  if (typeof value !== "string" || !value) return;
  return { kind: options.loggedIn ? "datasync" : "visitor", value };
}

function getConfigValue(config: YouTubeConfig, key: string): unknown {
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
      debug.log("Audio downloader. web ABR config request failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  if (typeof data.INNERTUBE_API_KEY !== "string") {
    throw new Error("Audio downloader. web ABR config is unavailable");
  }
  debug.log("Audio downloader. web ABR config recovered", {
    source,
    hasContext: Boolean(data.INNERTUBE_CONTEXT),
    loggedIn: data.LOGGED_IN === true,
  });
  return { data_: data };
}

export function buildWebEmbeddedPlayerRequest(
  config: YouTubeConfig,
  videoId: string,
  extractedSignatureTimestamp?: number,
): Record<string, unknown> {
  const rawContext = getConfigValue(config, "INNERTUBE_CONTEXT");
  if (!rawContext || typeof rawContext !== "object") {
    throw new Error("Audio downloader. web_embedded context is unavailable");
  }

  const context = JSON.parse(JSON.stringify(rawContext)) as {
    client?: Record<string, unknown>;
    thirdParty?: Record<string, unknown>;
  };
  context.client ??= {};
  const client = context.client;
  client.clientName = "WEB_EMBEDDED_PLAYER";
  client.clientVersion =
    getConfigValue(config, "INNERTUBE_CLIENT_VERSION") ?? client.clientVersion;
  client.originalUrl = `https://www.youtube.com/embed/${videoId}?html5=1`;
  context.thirdParty ??= {};
  context.thirdParty.embedUrl = "https://www.reddit.com/";

  const contentPlaybackContext = buildContentPlaybackContext(
    extractedSignatureTimestamp ?? getConfigValue(config, "STS"),
  );
  const playerContexts = getConfigValue(config, "WEB_PLAYER_CONTEXT_CONFIGS") as
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

  return {
    context,
    videoId,
    playbackContext: { contentPlaybackContext },
    contentCheckOk: true,
    racyCheckOk: true,
  };
}

export function selectWebEmbeddedAudioFormat(
  formats: WebEmbeddedFormat[],
): WebEmbeddedFormat {
  const withUrl = formats.filter(
    ({ url, signatureCipher }) =>
      typeof url === "string" || typeof signatureCipher === "string",
  );
  const audioOnly = withUrl.filter(
    ({ mimeType }) =>
      mimeType?.includes("audio/") && !mimeType?.includes("video/"),
  );
  // Preferred itag order from Yandex media-scripts (MAPPINGS.md, WEB_ABR).
  const preferredItags = [
    251, 140, 141, 250, 249, 139, 256, 258, 325, 327, 328, 338, 171, 172,
  ];
  const byPreference = (a: WebEmbeddedFormat, b: WebEmbeddedFormat) => {
    const rank = (itag?: number) => {
      const index = itag === undefined ? -1 : preferredItags.indexOf(itag);
      return index < 0 ? Number.MAX_SAFE_INTEGER : index;
    };
    return rank(a.itag) - rank(b.itag) || (b.bitrate ?? 0) - (a.bitrate ?? 0);
  };
  const selected =
    audioOnly.sort(byPreference)[0] ??
    withUrl.find(({ itag }) => itag === 18) ??
    withUrl
      .filter(({ mimeType }) => /mp4a\.|opus/i.test(mimeType ?? ""))
      .sort((a, b) => (a.bitrate ?? 0) - (b.bitrate ?? 0))[0];
  if (!selected) {
    debug.log(
      "Audio downloader. no direct audio formats",
      JSON.stringify(
        formats.map((format) => ({
          itag: format.itag,
          mimeType: format.mimeType,
          hasUrl: typeof format.url === "string",
          hasCipher: typeof format.signatureCipher === "string",
          contentLength: format.contentLength ?? "none",
        })),
      ),
    );
    throw new Error(
      "Audio downloader. web ABR returned no direct audio formats",
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

function getPlayerUrl(config: YouTubeConfig): string | undefined {
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
    { createScript: (value) => value },
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

export async function* resolveWebEmbeddedFormatUrl(
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

export function buildTvDowngradedPlayerRequest(
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
        clientName: "TVHTML5",
        clientVersion:
          typeof options.clientVersion === "string" && options.clientVersion
            ? options.clientVersion
            : "5.20260707",
        hl: "en",
        gl: "US",
        timeZone: "UTC",
        utcOffsetMinutes: 0,
        userAgent: "Mozilla/5.0 (ChromiumStylePlatform) Cobalt/Version",
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

export function buildWebPlayerRequest(
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

async function probeContentLength(
  targetWindow: Window,
  streamUrl: string,
  signal: AbortSignal,
): Promise<number> {
  const url = new URL(streamUrl);
  url.searchParams.set("range", "0-0");
  url.searchParams.delete("ump");
  const response = await targetWindow.fetch(url, { signal });
  if (!response.ok) {
    throw new Error(
      `Audio downloader. web ABR media probe failed (${response.status})`,
    );
  }
  const total = Number(
    /\/(\d+)\s*$/.exec(response.headers.get("content-range") ?? "")?.[1],
  );
  if (!(total > 0)) {
    throw new Error("Audio downloader. web ABR content length unknown");
  }
  return total;
}

export async function* downloadMediaRanges(
  targetWindow: Window,
  streamUrl: string,
  contentLength: number,
  signal: AbortSignal,
  refreshUrl: () => Promise<string>,
): AsyncGenerator<AudioChunk> {
  if (!Number.isSafeInteger(contentLength) || contentLength < 1) {
    throw new Error("Audio downloader. Invalid media content length");
  }
  let requestNumber = 0;
  let pending: Uint8Array[] = [];
  let pendingSize = 0;
  for (const { start, end } of buildMediaRanges(contentLength)) {
    let buffer: Uint8Array | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      signal.throwIfAborted();
      try {
        const url = new URL(streamUrl);
        url.searchParams.set("range", `${start}-${end}`);
        url.searchParams.set("rn", String(++requestNumber));
        url.searchParams.delete("ump");
        const response = await targetWindow.fetch(url, { signal });
        if (!response.ok) {
          throw new Error(
            `Audio downloader. Media request failed (${response.status}, range ${start}-${end})`,
          );
        }
        const bytes = new Uint8Array(await response.arrayBuffer());
        signal.throwIfAborted();
        if (bytes.byteLength === end - start + 1) {
          buffer = bytes;
          break;
        }
        const redirect = new TextDecoder("ascii")
          .decode(bytes)
          .match(/^\s*(https:\/\/\S+)\s*$/)?.[1];
        if (redirect) {
          const next = new URL(redirect);
          if (!/(?:^|\.)googlevideo\.com$/.test(next.hostname)) {
            throw new Error("Audio downloader. Invalid media redirect");
          }
          streamUrl = next.toString();
          if (attempt < 2) continue;
        }
        throw new Error("Audio downloader. Incomplete web ABR chunk");
      } catch (error) {
        signal.throwIfAborted();
        if (attempt === 2) throw error;
        await createAbortableDelay(250 * (attempt + 1), signal);
        // Retry transient failures first; refresh an expired URL before the last try.
        if (attempt === 1) streamUrl = await refreshUrl();
      }
    }
    if (!buffer) throw new Error("Audio downloader. Incomplete web ABR chunk");
    pending.push(buffer);
    pendingSize += buffer.byteLength;
    const isLastChunk = end === contentLength - 1;
    if (pendingSize >= config.minChunkSize || isLastChunk) {
      yield { buffer: concatBuffers(pending), isLastChunk };
      pending = [];
      pendingSize = 0;
    }
  }
}

export async function* getWebAbrAudioChunks(
  targetWindow: WebAbrWindow,
  videoId: string,
  signal: AbortSignal,
): AsyncGenerator<AudioChunk> {
  const config = await resolveYtcfg(targetWindow, signal);
  const apiKey = getConfigValue(config, "INNERTUBE_API_KEY");
  if (typeof apiKey !== "string") {
    throw new Error("Audio downloader. web ABR config is unavailable");
  }

  const playerCodes = new Map<string, Promise<string>>();
  const fetchPlayerCode = (url = getPlayerUrl(config)) => {
    if (!url) return Promise.resolve(undefined);
    let code = playerCodes.get(url);
    if (!code) {
      code = targetWindow.fetch(url, { signal }).then((response) => {
        if (!response.ok) {
          throw new Error(
            `Audio downloader. YouTube player request failed (${response.status})`,
          );
        }
        return response.text();
      });
      playerCodes.set(url, code);
    }
    return code;
  };
  let sts = Number(getConfigValue(config, "STS"));
  if (!(sts > 0)) {
    sts = Number(
      (await fetchPlayerCode())?.match(
        /(?:signatureTimestamp|sts)\s*:\s*([0-9]{5})/,
      )?.[1],
    );
  }
  const body = buildWebEmbeddedPlayerRequest(config, videoId, sts);
  const context = body.context as { client: Record<string, unknown> };
  const clientVersion = String(context.client.clientVersion ?? "");
  const visitorData =
    context.client.visitorData ?? getConfigValue(config, "VISITOR_DATA");
  if (typeof visitorData === "string") context.client.visitorData = visitorData;
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
  const loggedIn = getConfigValue(config, "LOGGED_IN") === true;
  const playerContexts = getConfigValue(config, "WEB_PLAYER_CONTEXT_CONFIGS");
  const pageExperimentFlags = Object.values(
    playerContexts && typeof playerContexts === "object" ? playerContexts : {},
  ).flatMap((entry: { serializedExperimentFlags?: unknown } | null) =>
    typeof entry?.serializedExperimentFlags === "string"
      ? [entry.serializedExperimentFlags]
      : [],
  );
  const sessionIndex = getConfigValue(config, "SESSION_INDEX");
  debug.log("Audio downloader. player auth state", {
    videoId,
    host: targetWindow.location.hostname,
    hasAuthorization: Boolean(authorization),
    sessionIndex: sessionIndex ?? "none",
    hasDelegatedSession: Boolean(delegatedSessionId),
    loggedIn,
  });
  const auth = {
    authorization,
    sessionIndex,
    delegatedSessionId,
  };
  let lastError: unknown;
  let emitted = false;
  for (const name of ["web_embedded", "tv_downgraded", "web", "web_creator"]) {
    signal.throwIfAborted();
    debug.log("Audio downloader. trying player client", {
      videoId,
      client: name,
    });
    const fetchedConfig =
      name === "tv_downgraded"
        ? await fetchTvConfig(targetWindow, signal, videoId)
        : undefined;
    const options = {
      visitorData: fetchedConfig?.visitorData ?? visitorData,
      signatureTimestamp: fetchedConfig?.signatureTimestamp ?? sts,
      clientVersion: fetchedConfig?.clientVersion,
    };
    // Studio cannot be fetched from the embed realm without CORS permission.
    const candidateBody =
      name === "web_embedded"
        ? body
        : name === "tv_downgraded"
          ? buildTvDowngradedPlayerRequest(videoId, options)
          : name === "web"
            ? buildWebPlayerRequest(config, videoId, sts)
            : buildWebCreatorPlayerRequest(videoId, options);
    const candidateContext = candidateBody.context as {
      client: Record<string, unknown>;
    };
    if (typeof options.visitorData === "string") {
      candidateContext.client.visitorData = options.visitorData;
    }
    const requestPlayer = () =>
      postInnertubePlayer(
        targetWindow,
        signal,
        fetchedConfig?.apiKey ?? apiKey,
        candidateBody,
        name === "web_embedded"
          ? "56"
          : name === "tv_downgraded"
            ? "7"
            : name === "web"
              ? "1"
              : "62",
        String(candidateContext.client.clientVersion ?? clientVersion),
        auth,
      );
    const getCode = () => fetchPlayerCode(fetchedConfig?.playerUrl);
    try {
      const playerResponse = await requestPlayer();
      const formats = [
        ...(playerResponse.streamingData?.adaptiveFormats ?? []),
        ...(playerResponse.streamingData?.formats ?? []),
      ];
      if (!formats.length) {
        const status = playerResponse.playabilityStatus;
        throw new Error(
          `Audio downloader. ${name} ${status?.status ?? "failed"}: ${
            status?.reason ?? status?.messages?.join(" ") ?? "no streaming data"
          }`,
        );
      }
      const format = selectWebEmbeddedAudioFormat(formats);
      const fetchedFlags = fetchedConfig?.experimentFlags;
      const poTokenBinding = selectGvsPoTokenBinding(videoId, {
        loggedIn,
        dataSyncId:
          playerResponse.responseContext?.mainAppWebResponseContext
            ?.datasyncId ||
          dataSyncId ||
          fetchedConfig?.dataSyncId,
        visitorData: candidateContext.client.visitorData ?? visitorData,
        experimentFlags: fetchedFlags?.length
          ? fetchedFlags
          : pageExperimentFlags,
      });
      let poToken: Promise<string | undefined> | undefined;
      const authorizeUrl = async (streamUrl: string) => {
        const url = new URL(streamUrl);
        if (!url.searchParams.has("pot") && poTokenBinding) {
          poToken ??= mintPagePoToken(
            targetWindow,
            poTokenBinding.value,
            signal,
          );
          const token = await poToken;
          if (token) url.searchParams.set("pot", token);
        }
        return url.toString();
      };
      for await (const solvedUrl of resolveWebEmbeddedFormatUrl(
        targetWindow,
        format,
        getCode,
        signal,
      )) {
        try {
          const streamUrl = await authorizeUrl(solvedUrl);
          const contentLength =
            Number(format.contentLength) ||
            (await probeContentLength(targetWindow, streamUrl, signal));
          const refreshUrl = async () => {
            const response = await requestPlayer();
            const refreshed = response.streamingData?.adaptiveFormats?.find(
              (entry) =>
                entry.itag === format.itag &&
                entry.mimeType === format.mimeType &&
                Number(entry.contentLength) === contentLength &&
                entry.lastModified === format.lastModified,
            );
            if (!refreshed)
              throw new Error(
                "Audio downloader. Refreshed audio format changed",
              );
            for await (const url of resolveWebEmbeddedFormatUrl(
              targetWindow,
              refreshed,
              getCode,
              signal,
            )) {
              return await authorizeUrl(url);
            }
            throw new Error(
              "Audio downloader. Refreshed audio URL unavailable",
            );
          };
          for await (const chunk of downloadMediaRanges(
            targetWindow,
            streamUrl,
            contentLength,
            signal,
            refreshUrl,
          )) {
            emitted = true;
            yield chunk;
          }
          return;
        } catch (error) {
          signal.throwIfAborted();
          if (emitted) throw error;
          lastError = error;
          // Nothing escaped this candidate: try another solve or client from byte zero.
        }
      }
    } catch (error) {
      signal.throwIfAborted();
      if (emitted) throw error;
      debug.log("Audio downloader. player client format failed", {
        videoId,
        client: name,
        error: error instanceof Error ? error.message : String(error),
      });
      lastError = error;
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
