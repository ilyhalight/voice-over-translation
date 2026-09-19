// @ts-nocheck
import { config } from "@vot.js/shared";

import debug from "../../utils/debug";
import { preprocessYouTubePlayer as prepareYouTubePlayer } from "./ytPlayerSolver";

function concatBuffers(buffers: Uint8Array[]): Uint8Array {
  const total = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const buffer of buffers) {
    result.set(buffer, offset);
    offset += buffer.byteLength;
  }
  return result;
}

function createAbortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const timeout = setTimeout(done, ms);
    const onAbort = () => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", onAbort);
      reject(signal.reason);
    };
    function done() {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

var MEDIA_RANGE_SIZES = [6e4, 8e4, 15e4, 33e4, 46e4];
async function fetchTvConfig(targetWindow, signal, videoId) {
  try {
    const response = await targetWindow.fetch("https://www.youtube.com/tv", {
      credentials: "include",
      signal,
    });
    if (!response.ok)
      throw new Error(
        `Audio downloader. tv config request failed (${response.status})`,
      );
    const html = await response.text();
    const pick = (patterns) => {
      for (const pattern of patterns) {
        const match = pattern.exec(html);
        if (match?.[1]) return match[1];
      }
    };
    const playerPath = pick([/"PLAYER_JS_URL":"([^"]+)"/, /"jsUrl":"([^"]+)"/]);
    const sts = Number(pick([/"STS":(\d+)/, /"signatureTimestamp":(\d+)/]));
    const experimentFlags = [];
    for (const match of html.matchAll(
      /"serializedExperimentFlags"\s*:\s*("(?:\\.|[^"\\])*")/g,
    ))
      try {
        experimentFlags.push(JSON.parse(match[1] ?? '""'));
      } catch {}
    return {
      apiKey: pick([/"INNERTUBE_API_KEY":"([^"]+)"/]),
      clientVersion: pick([/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/]),
      visitorData: pick([/"VISITOR_DATA":"([^"]+)"/]),
      dataSyncId: pick([/"DATASYNC_ID":"([^"]+)"/]),
      experimentFlags,
      playerUrl: playerPath
        ? new URL(playerPath, "https://www.youtube.com").toString()
        : void 0,
      signatureTimestamp: Number.isFinite(sts) && sts > 0 ? sts : void 0,
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
function buildMediaRanges(contentLength) {
  if (!Number.isInteger(contentLength) || contentLength < 1) return [];
  const ranges = [];
  let start = 0;
  let sizeIndex = 0;
  while (start < contentLength) {
    const size = MEDIA_RANGE_SIZES[sizeIndex] ?? MEDIA_RANGE_SIZES.at(-1) ?? 1;
    const end = Math.min(contentLength - 1, start + size - 1);
    ranges.push({
      start,
      end,
    });
    start = end + 1;
    if (sizeIndex < MEDIA_RANGE_SIZES.length - 1) sizeIndex++;
  }
  return ranges;
}
async function mintPagePoToken(pageWindow, binding, signal) {
  const realms = /* @__PURE__ */ new Set([pageWindow]);
  try {
    realms.add(pageWindow.parent);
    realms.add(pageWindow.top);
  } catch {}
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
      let bevasrs: any;
      try {
        bevasrs = realm[key]?.bevasrs;
      } catch {
        continue;
      }
      const wpc = bevasrs?.wpc;
      if (typeof wpc !== "function") continue;
      for (let attempt = 0; attempt < 10; attempt++) {
        if (signal.aborted) throw signal.reason;
        try {
          const token = await (await wpc.call(bevasrs))?.mws?.({
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
function selectGvsPoTokenBinding(videoId, options) {
  if (
    options.experimentFlags.some(
      (flags) =>
        new URLSearchParams(flags)
          .getAll("html5_generate_content_po_token")
          .at(-1) === "true",
    )
  )
    return {
      kind: "video",
      value: videoId,
    };
  const value = options.loggedIn ? options.dataSyncId : options.visitorData;
  if (typeof value !== "string" || !value) return;
  return {
    kind: options.loggedIn ? "datasync" : "visitor",
    value,
  };
}
function getConfigValue(config, key) {
  return config.get?.(key) ?? config.data_?.[key];
}
function buildContentPlaybackContext(signatureTimestamp) {
  const context = { html5Preference: "HTML5_PREF_WANTS" };
  const timestamp = Number(signatureTimestamp);
  if (Number.isFinite(timestamp) && timestamp > 0)
    context.signatureTimestamp = timestamp;
  return context;
}
function findJsonValueEnd(source, start) {
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
function parseYtcfgData(source) {
  const data = {};
  const pattern = /ytcfg\s*\.\s*set\s*\(/g;
  const skipSpaces = (index) => {
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
      const argument = JSON.parse(source.slice(start, end));
      if (argument && typeof argument === "object") {
        if (Array.isArray(argument)) continue;
        Object.assign(data, argument);
        cursor = end;
        continue;
      }
      if (typeof argument !== "string") continue;
      const separator = skipSpaces(end);
      if (source[separator] !== ",") continue;
      const valueStart = skipSpaces(separator + 1);
      const jsonEnd = findJsonValueEnd(source, valueStart);
      const valueEnd = jsonEnd < 0 ? source.indexOf(")", valueStart) : jsonEnd;
      if (valueEnd < 0) continue;
      data[argument] = JSON.parse(source.slice(valueStart, valueEnd).trim());
      cursor = valueEnd;
    } catch {}
  }
  return data;
}
function readYtcfgFromDocument(targetWindow) {
  const data = {};
  let scripts = [];
  try {
    scripts = [...targetWindow.document.querySelectorAll("script:not([src])")];
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
async function resolveYtcfg(targetWindow, signal) {
  const pageConfig = targetWindow.ytcfg;
  if (
    pageConfig &&
    typeof getConfigValue(pageConfig, "INNERTUBE_API_KEY") === "string"
  )
    return pageConfig;
  let data = readYtcfgFromDocument(targetWindow);
  let source = "document";
  if (typeof data.INNERTUBE_API_KEY !== "string")
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
  if (typeof data.INNERTUBE_API_KEY !== "string")
    throw new Error("Audio downloader. web ABR config is unavailable");
  debug.log("Audio downloader. web ABR config recovered", {
    source,
    hasContext: Boolean(data.INNERTUBE_CONTEXT),
    loggedIn: data.LOGGED_IN === true,
  });
  return { data_: data };
}
function buildWebEmbeddedPlayerRequest(
  config,
  videoId,
  extractedSignatureTimestamp,
) {
  const rawContext = getConfigValue(config, "INNERTUBE_CONTEXT");
  if (!rawContext || typeof rawContext !== "object")
    throw new Error("Audio downloader. web_embedded context is unavailable");
  const context = JSON.parse(JSON.stringify(rawContext));
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
  const encryptedHostFlags = getConfigValue(
    config,
    "WEB_PLAYER_CONTEXT_CONFIGS",
  )?.WEB_PLAYER_CONTEXT_CONFIG_ID_EMBEDDED_PLAYER?.encryptedHostFlags;
  if (typeof encryptedHostFlags === "string" && encryptedHostFlags)
    contentPlaybackContext.encryptedHostFlags = encryptedHostFlags;
  return {
    context,
    videoId,
    playbackContext: { contentPlaybackContext },
    contentCheckOk: true,
    racyCheckOk: true,
  };
}
function normalizeAudioLanguage(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replaceAll("_", "-");
}

function getAudioFormatLanguage(format) {
  const direct =
    format.languageCode ??
    format.language ??
    format.audioTrack?.languageCode ??
    format.audioTrack?.language;
  if (typeof direct === "string" && direct)
    return normalizeAudioLanguage(direct);

  const trackId = format.audioTrack?.id ?? format.audioTrackId;
  if (typeof trackId === "string" && trackId) {
    // YouTube track ids look like "de-DE.10" / "en-US.4".
    const idLanguage = trackId.split(".")[0];
    if (idLanguage) return normalizeAudioLanguage(idLanguage);
  }

  try {
    const cipher =
      typeof format.signatureCipher === "string"
        ? new URLSearchParams(format.signatureCipher)
        : void 0;
    const rawUrl = format.url ?? cipher?.get("url");
    if (rawUrl) {
      const xtags = new URL(rawUrl).searchParams.get("xtags") ?? "";
      const match = /(?:^|:)lang=([^:]+)/i.exec(xtags);
      if (match?.[1]) return normalizeAudioLanguage(match[1]);
    }
  } catch {}

  return "";
}

function audioLanguageMatches(trackLanguage, requestedLanguage) {
  const track = normalizeAudioLanguage(trackLanguage);
  const requested = normalizeAudioLanguage(requestedLanguage);
  if (!track || !requested || requested === "auto") return false;
  if (track === requested) return true;
  return track.split("-")[0] === requested.split("-")[0];
}

function isDrcAudioFormat(format) {
  if (typeof format.xtags === "string" && format.xtags.includes("drc=1")) {
    return true;
  }
  try {
    const cipher =
      typeof format.signatureCipher === "string"
        ? new URLSearchParams(format.signatureCipher)
        : void 0;
    const rawUrl = format.url ?? cipher?.get("url");
    const xtags = rawUrl ? new URL(rawUrl).searchParams.get("xtags") : null;
    return xtags?.includes("drc=1") === true;
  } catch {
    return false;
  }
}

function selectWebEmbeddedAudioFormat(formats, requestedLanguage) {
  const withUrl = formats.filter(
    ({ url, signatureCipher }) =>
      typeof url === "string" || typeof signatureCipher === "string",
  );

  const audioOnly = withUrl.filter(
    ({ mimeType }) =>
      mimeType?.includes("audio/") && !mimeType?.includes("video/"),
  );

  const preferredItags = [
    251, 140, 141, 250, 249, 139, 256, 258, 325, 327, 328, 338, 171, 172,
  ];

  const byPreference = (a, b) => {
    const rank = (itag) => {
      const index = itag === void 0 ? -1 : preferredItags.indexOf(itag);
      return index < 0 ? Number.MAX_SAFE_INTEGER : index;
    };
    return rank(a.itag) - rank(b.itag) || (b.bitrate ?? 0) - (a.bitrate ?? 0);
  };

  // If VOT explicitly selected a source language, prefer that YouTube audio
  // track. BCP-47 variants are matched by exact tag first, then base language
  // (for example "de" -> "de-DE", "en" -> "en-US").
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

  const selectionMode =
    requestedLanguageCandidates.length > 0
      ? "requested-language"
      : defaultAudioOnly.length > 0
        ? "audioIsDefault"
        : "legacy-fallback";

  const nonDrcCandidates = trackCandidates.filter(
    (format) => !isDrcAudioFormat(format),
  );

  const selected = (
    nonDrcCandidates.length > 0 ? nonDrcCandidates : trackCandidates
  ).sort(byPreference)[0];

  if (!selected) {
    throw new Error(
      "Audio downloader. web ABR returned no direct audio-only formats",
    );
  }

  const describeAudioFormat = (format) => {
    let urlInfo = {};
    try {
      const cipher =
        typeof format.signatureCipher === "string"
          ? new URLSearchParams(format.signatureCipher)
          : void 0;
      const rawUrl = format.url ?? cipher?.get("url");
      if (rawUrl) {
        const parsed = new URL(rawUrl);
        urlInfo = {
          urlHost: parsed.hostname,
          urlItag: parsed.searchParams.get("itag"),
          urlXtags: parsed.searchParams.get("xtags"),
          urlLmt: parsed.searchParams.get("lmt"),
        };
      }
    } catch {}

    return {
      itag: format.itag,
      mimeType: format.mimeType,
      bitrate: format.bitrate,
      averageBitrate: format.averageBitrate,
      audioQuality: format.audioQuality,
      audioSampleRate: format.audioSampleRate,
      audioChannels: format.audioChannels,
      audioTrack: format.audioTrack,
      audioTrackId: format.audioTrackId,
      language: format.language,
      languageCode: format.languageCode,
      resolvedLanguage: getAudioFormatLanguage(format),
      displayName: format.displayName,
      xtags: format.xtags,
      isDrc: isDrcAudioFormat(format),
      contentLength: format.contentLength,
      hasUrl: typeof format.url === "string",
      hasCipher: typeof format.signatureCipher === "string",
      ...urlInfo,
    };
  };

  debug.log(
    "Audio downloader. AUDIO TRACK TEST",
    JSON.stringify(
      {
        requestedLanguage: normalizedRequestedLanguage || null,
        selectionMode,
        selectedLanguage: getAudioFormatLanguage(selected) || null,
        selectedTrack:
          selected.audioTrack?.displayName ?? selected.displayName ?? null,
        selectedTrackId:
          selected.audioTrack?.id ?? selected.audioTrackId ?? null,
        selectedIsDefault: selected.audioTrack?.audioIsDefault === true,
        selectedItag: selected.itag ?? null,
        selectedBitrate: selected.bitrate ?? null,
        selectedContentLength: selected.contentLength ?? null,
        selectedIsDrc: isDrcAudioFormat(selected),
        selected: describeAudioFormat(selected),
        audioOnlyCount: audioOnly.length,
        requestedLanguageCandidates: requestedLanguageCandidates.length,
        defaultAudioOnlyCount: defaultAudioOnly.length,
        candidates: audioOnly.map(describeAudioFormat),
      },
      null,
      2,
    ),
  );

  return selected;
}

async function sha1(value) {
  const digest = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
async function buildSidAuthorization(
  scheme,
  sid,
  origin,
  timestamp,
  userSessionId,
) {
  return `${scheme} ${timestamp}_${await sha1(userSessionId ? `${userSessionId} ${timestamp} ${sid} ${origin}` : `${timestamp} ${sid} ${origin}`)}${userSessionId ? "_u" : ""}`;
}
async function getYouTubeAuthorization(targetWindow, userSessionId) {
  const cookies = new Map(
    targetWindow.document.cookie.split("; ").map((cookie) => {
      const separator = cookie.indexOf("=");
      return separator < 0
        ? [cookie, ""]
        : [cookie.slice(0, separator), cookie.slice(separator + 1)];
    }),
  );
  const timestamp = String(Math.round(Date.now() / 1e3));
  const origin = "https://www.youtube.com";
  return (
    (
      await Promise.all(
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
                userSessionId || void 0,
              )
            : "",
        ),
      )
    )
      .filter(Boolean)
      .join(" ") || void 0
  );
}
function getPlayerUrl(config) {
  const playerContexts = getConfigValue(config, "WEB_PLAYER_CONTEXT_CONFIGS");
  const value =
    getConfigValue(config, "PLAYER_JS_URL") ??
    getConfigValue(config, "JS_URL") ??
    playerContexts?.WEB_PLAYER_CONTEXT_CONFIG_ID_EMBEDDED_PLAYER?.jsUrl;
  return typeof value === "string"
    ? new URL(value, "https://www.youtube.com").toString()
    : void 0;
}
function resolveTrustedRealm(realm) {
  const candidates = [realm];
  const add = (candidate) => {
    if (candidate && candidate !== realm) candidates.push(candidate);
  };
  try {
    add(realm.parent);
  } catch {}
  try {
    add(realm.top);
  } catch {}
  for (const candidate of candidates)
    try {
      if (candidate.trustedTypes?.createPolicy) return candidate;
    } catch {}
  return realm;
}
function runChallengeSolver(realm, preparedPlayer, signature, n) {
  const nativeRealm = resolveTrustedRealm(realm);
  const policy = nativeRealm.trustedTypes?.createPolicy(
    `vot-youtube-solver-${crypto.randomUUID()}`,
    { createScript: (value) => value },
  );
  const source = `(function(){\nconst _result={sig:null,n:null};\n${preparedPlayer}\nreturn _result;\n})()`;
  const script = policy?.createScript(source) ?? source;
  const result = nativeRealm.eval(script);
  if (!result)
    throw new Error("Audio downloader. YouTube challenge solver returned none");
  const solved = {
    signature: signature && result.sig ? result.sig(signature) : void 0,
    n: n && result.n ? result.n(n) : void 0,
  };
  if ((signature && !solved.signature) || (n && !solved.n))
    throw new Error("Audio downloader. YouTube challenge solve incomplete");
  return solved;
}
var SIG_PATTERN = /^[A-Za-z0-9_-]{20,}={0,2}$/;
var N_PATTERN = /^[A-Za-z0-9_-]{4,}$/;
function listPageFunctions(pageWindow) {
  const found = [];
  const seen = /* @__PURE__ */ new Set();
  let visited = 0;
  const visit = (value, path, depth) => {
    if (!value || seen.has(value) || depth > 3 || visited++ >= 5e3) return;
    seen.add(value);
    if (typeof value === "function")
      found.push({
        fn: value,
        path,
      });
    else if (typeof value === "object")
      try {
        for (const [key, descriptor] of Object.entries(
          Object.getOwnPropertyDescriptors(value),
        ))
          if ("value" in descriptor)
            visit(descriptor.value, `${path}.${key}`, depth + 1);
      } catch {}
  };
  try {
    const descriptors = Object.getOwnPropertyDescriptors(pageWindow);
    visit(descriptors._yt_player?.value, "_yt_player", 0);
    for (const [key, descriptor] of Object.entries(descriptors))
      if (typeof descriptor.value === "function")
        visit(descriptor.value, key, 0);
  } catch {}
  return found;
}
var SIG_FACTORY_NEW_PATTERN =
  /([A-Za-z_$][\w$]*)\s*=\s*new\s+[A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*\s*\(\s*\1\s*,\s*(?:!\s*0|true)\s*\)\s*;\s*\1\.set\(\s*["']alr["']\s*,\s*["']yes["']\s*\)/;
var EJS_MOCK_URL = "https://youtube.com/watch?v=yt-dlp-wins";
function isSigFactory({ fn }) {
  try {
    return SIG_FACTORY_NEW_PATTERN.test(Function.prototype.toString.call(fn));
  } catch {
    return false;
  }
}
function pageUrlMethods(proto) {
  if (!proto) return;
  const descriptors = /* @__PURE__ */ new Map();
  for (let current = proto; current; current = Object.getPrototypeOf(current))
    for (const [key, descriptor] of Object.entries(
      Object.getOwnPropertyDescriptors(current),
    ))
      if (!descriptors.has(key)) descriptors.set(key, descriptor);
  const get = descriptors.get("get")?.value;
  const set = descriptors.get("set")?.value;
  if (
    typeof get !== "function" ||
    typeof set !== "function" ||
    typeof descriptors.get("clone")?.value !== "function"
  )
    return;
  return {
    get,
    set,
    transforms: [...descriptors].flatMap(([key, descriptor]) => {
      if (["constructor", "set", "get", "clone"].includes(key)) return [];
      const method = descriptor.value;
      if (typeof method !== "function") return [];
      const source = Function.prototype.toString.call(method);
      return /\.set\(\s*["']n["']\s*,/.test(source) ||
        (/for\s*\([^)]*\bof\b[^)]*\.params\b/.test(source) &&
          /\.params\.set\(/.test(source))
        ? [method]
        : [];
    }),
  };
}
function validPageValue(value, input, pattern) {
  if (!input || typeof value !== "string") return;
  let decoded = value;
  for (let index = 0; index < 3 && decoded.includes("%"); index++)
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      return;
    }
  return decoded !== input && pattern.test(decoded) ? decoded : void 0;
}
function collectPageSolutions(pageWindow, challenge) {
  const realms = /* @__PURE__ */ new Set([pageWindow]);
  for (const relation of ["parent", "top"])
    try {
      const other = pageWindow[relation];
      if (other) realms.add(other);
    } catch {}
  const solutions = [];
  const seen = /* @__PURE__ */ new Set();
  const collect = (instance, methods, transform, factory) => {
    const solution = {};
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
    if (challenge.signature)
      try {
        solution.signature = readSignature();
      } catch {}
    if (challenge.n && transform)
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
      } catch {}
    if (solution.signature || solution.n) solutions.push(solution);
  };
  for (const realm of realms)
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
          if (challenge.n)
            for (const transform of methods.transforms.slice(1))
              collect(make(), methods, transform, true);
        } else if (challenge.n && path.startsWith("_yt_player.")) {
          const proto = Object.getOwnPropertyDescriptor(fn, "prototype")?.value;
          const methods = pageUrlMethods(proto);
          if (!methods?.transforms.length) continue;
          const UrlCtor = fn;
          for (const transform of methods.transforms)
            try {
              collect(
                new UrlCtor(challenge.url, true),
                methods,
                transform,
                false,
              );
            } catch {}
        }
      } catch {}
    }
  const consensus = {};
  for (const field of ["signature", "n"]) {
    const values = new Set(
      solutions.map((solution) => solution[field]).filter(Boolean),
    );
    if (values.size === 1) consensus[field] = values.values().next().value;
  }
  const merged = /* @__PURE__ */ new Map();
  for (const solution of solutions) {
    const candidate = {
      signature: solution.signature ?? consensus.signature,
      n: solution.n ?? consensus.n,
    };
    merged.set(JSON.stringify(candidate), candidate);
  }
  return [...merged.values()];
}
function solveYouTubeChallenges(targetWindow, playerCode, signature, n) {
  const preparedPlayer = prepareYouTubePlayer(playerCode);
  const errors = [];
  try {
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
function buildSolvedUrl(rawUrl, sp, solved) {
  const url = new URL(rawUrl);
  if (solved.signature)
    url.searchParams.set(sp ?? "signature", solved.signature);
  if (solved.n) url.searchParams.set("n", solved.n);
  return url.toString();
}
async function* resolveWebEmbeddedFormatUrl(
  targetWindow,
  format,
  playerCode,
  signal,
) {
  signal.throwIfAborted();
  const cipher = format.signatureCipher
    ? new URLSearchParams(format.signatureCipher)
    : void 0;
  const rawUrl = format.url ?? cipher?.get("url");
  if (!rawUrl)
    throw new Error("Audio downloader. web ABR format URL is unavailable");
  const url = new URL(rawUrl);
  const signature = cipher?.get("s") ?? void 0;
  const n = url.searchParams.get("n") ?? void 0;
  if (!signature && !n) {
    yield url.toString();
    signal.throwIfAborted();
    return;
  }
  const challenge = {
    url: rawUrl,
    sp: cipher?.get("sp") ?? void 0,
    signature,
    n,
  };
  const candidates = collectPageSolutions(targetWindow, challenge);
  signal.throwIfAborted();
  const complete = (solution) =>
    (!signature || !!solution.signature) && (!n || !!solution.n);
  candidates.sort((a, b) => Number(complete(b)) - Number(complete(a)));
  let source: any;
  const astSolutions = /* @__PURE__ */ new Map();
  const solve = async (signature, n) => {
    signal.throwIfAborted();
    const key = JSON.stringify([signature, n]);
    const cached = astSolutions.get(key);
    if (cached) return cached;
    source ??= playerCode();
    const code = await source;
    signal.throwIfAborted();
    if (!code)
      throw new Error("Audio downloader. YouTube player code is unavailable");
    const raw = solveYouTubeChallenges(targetWindow, code, signature, n);
    signal.throwIfAborted();
    const solved = {
      signature: validPageValue(raw.signature, signature, SIG_PATTERN),
      n: validPageValue(raw.n, n, N_PATTERN),
    };
    if ((signature && !solved.signature) || (n && !solved.n))
      throw new Error("Audio downloader. YouTube challenge solve invalid");
    astSolutions.set(key, solved);
    return solved;
  };
  const yielded = /* @__PURE__ */ new Set();
  const errors = [];
  for (const candidate of candidates) {
    signal.throwIfAborted();
    let solved = candidate;
    try {
      if (!complete(candidate)) {
        const missing = await solve(
          candidate.signature ? void 0 : signature,
          candidate.n ? void 0 : n,
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
  signal.throwIfAborted();
  let solved: any;
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
function buildTvDowngradedPlayerRequest(videoId, options = {}) {
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
function buildWebPlayerRequest(config, videoId, extractedSignatureTimestamp) {
  const rawContext = getConfigValue(config, "INNERTUBE_CONTEXT");
  if (!rawContext || typeof rawContext !== "object")
    throw new Error("Audio downloader. web client context is unavailable");
  const context = JSON.parse(JSON.stringify(rawContext));
  context.client ??= {};
  const client = context.client;
  client.clientName = "WEB";
  client.clientVersion =
    getConfigValue(config, "INNERTUBE_CLIENT_VERSION") ?? client.clientVersion;
  client.originalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  delete context.thirdParty;
  return {
    context,
    videoId,
    playbackContext: {
      contentPlaybackContext: buildContentPlaybackContext(
        extractedSignatureTimestamp ?? getConfigValue(config, "STS"),
      ),
    },
    contentCheckOk: true,
    racyCheckOk: true,
  };
}
function buildWebCreatorPlayerRequest(videoId, options = {}) {
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
  targetWindow,
  signal,
  apiKey,
  body,
  clientName,
  clientVersion,
  extra,
) {
  const visitorData = body.context?.client?.visitorData;
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
  if (!response.ok)
    throw new Error(
      `Audio downloader. player request failed (${response.status})`,
    );
  return await response.json();
}
async function probeContentLength(targetWindow, streamUrl, signal) {
  const url = new URL(streamUrl);
  url.searchParams.set("range", "0-0");
  url.searchParams.delete("ump");
  const response = await targetWindow.fetch(url, { signal });
  if (!response.ok)
    throw new Error(
      `Audio downloader. web ABR media probe failed (${response.status})`,
    );
  const total = Number(
    /\/(\d+)\s*$/.exec(response.headers.get("content-range") ?? "")?.[1],
  );
  if (!(total > 0))
    throw new Error("Audio downloader. web ABR content length unknown");
  return total;
}
const WEB_ABR_TRANSPORTS = [
  "parallel_4",
  "4mb",
  "parallel_8",
  "8mb",
  "parallel_2",
  "2mb",
  "stream",
  "original",
];

function makeFixedRanges(contentLength, chunkSize) {
  const ranges = [];
  for (let start = 0; start < contentLength; start += chunkSize) {
    ranges.push({
      start,
      end: Math.min(contentLength - 1, start + chunkSize - 1),
    });
  }
  return ranges;
}

const WEB_ABR_RANGE_MAX_ATTEMPTS = 10;
const WEB_ABR_RANGE_REFRESH_EVERY_FAILURES = 2;
const WEB_ABR_RANGE_RETRY_BASE_DELAY_MS = 250;
const WEB_ABR_RANGE_RETRY_MAX_DELAY_MS = 1500;

async function refreshMediaUrl(urlState, refreshUrl, reason = null) {
  if (!urlState.refreshPromise) {
    const previousUrl = urlState.value;
    const previousVersion = urlState.version ?? 0;
    urlState.refreshPromise = Promise.resolve()
      .then(() => refreshUrl())
      .then((nextUrl) => {
        if (typeof nextUrl !== "string" || !nextUrl) {
          throw new Error("Audio downloader. Failed to refresh media URL");
        }
        urlState.value = nextUrl;
        urlState.version = previousVersion + 1;
        debug.log("Audio downloader. web ABR media URL refresh applied", {
          reason,
          version: urlState.version,
          urlChanged: nextUrl !== previousUrl,
        });
        return nextUrl;
      })
      .finally(() => {
        urlState.refreshPromise = null;
      });
  }
  return await urlState.refreshPromise;
}

async function fetchMediaRange(
  targetWindow,
  urlState,
  start,
  end,
  signal,
  refreshUrl,
  requestNumberRef,
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < WEB_ABR_RANGE_MAX_ATTEMPTS; attempt++) {
    signal.throwIfAborted();
    // If another failed range is already refreshing the signed media URL,
    // wait for that refresh before starting this retry. This keeps every retry
    // on the newest URL without restarting ranges that already succeeded.
    if (attempt > 0 && urlState.refreshPromise) {
      await urlState.refreshPromise;
    }
    try {
      const urlVersion = urlState.version ?? 0;
      const url = new URL(urlState.value);
      url.searchParams.set("range", `${start}-${end}`);
      url.searchParams.set("rn", String(++requestNumberRef.value));
      url.searchParams.delete("ump");
      const response = await targetWindow.fetch(url, {
        signal,
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(
          `Audio downloader. Media request failed (${response.status}, range ${start}-${end})`,
        );
      const bytes = new Uint8Array(await response.arrayBuffer());
      signal.throwIfAborted();
      if (bytes.byteLength === end - start + 1) {
        if (attempt > 0) {
          debug.log("Audio downloader. web ABR range recovered", {
            range: `${start}-${end}`,
            attempt: attempt + 1,
            maxAttempts: WEB_ABR_RANGE_MAX_ATTEMPTS,
            urlVersion,
          });
        }
        return bytes;
      }
      const redirect = new TextDecoder("ascii")
        .decode(bytes)
        .match(/^\s*(https:\/\/\S+)\s*$/)?.[1];
      if (redirect) {
        const next = new URL(redirect);
        if (!/(?:^|\.)googlevideo\.com$/.test(next.hostname))
          throw new Error("Audio downloader. Invalid media redirect");
        urlState.value = next.toString();
        if (attempt + 1 < WEB_ABR_RANGE_MAX_ATTEMPTS) continue;
      }
      throw new Error(
        `Audio downloader. Incomplete web ABR chunk (${bytes.byteLength}/${end - start + 1}, range ${start}-${end})`,
      );
    } catch (error) {
      signal.throwIfAborted();
      lastError = error;
      const failedAttempt = attempt + 1;
      const hasMoreAttempts = failedAttempt < WEB_ABR_RANGE_MAX_ATTEMPTS;
      const shouldRefreshUrl =
        hasMoreAttempts &&
        failedAttempt % WEB_ABR_RANGE_REFRESH_EVERY_FAILURES === 0;

      debug.log("Audio downloader. web ABR range request failed", {
        range: `${start}-${end}`,
        attempt: failedAttempt,
        maxAttempts: WEB_ABR_RANGE_MAX_ATTEMPTS,
        refreshUrl: shouldRefreshUrl,
        error: error instanceof Error ? error.message : String(error),
      });

      if (!hasMoreAttempts) break;

      await createAbortableDelay(
        Math.min(
          WEB_ABR_RANGE_RETRY_BASE_DELAY_MS * failedAttempt,
          WEB_ABR_RANGE_RETRY_MAX_DELAY_MS,
        ),
        signal,
      );

      if (shouldRefreshUrl) {
        try {
          await refreshMediaUrl(urlState, refreshUrl, {
            range: `${start}-${end}`,
            failedAttempt,
          });
          debug.log(
            "Audio downloader. web ABR media URL refreshed for range retry",
            {
              range: `${start}-${end}`,
              nextAttempt: failedAttempt + 1,
              urlVersion: urlState.version ?? 0,
            },
          );
        } catch (refreshError) {
          signal.throwIfAborted();
          lastError = refreshError;
          debug.log("Audio downloader. web ABR media URL refresh failed", {
            range: `${start}-${end}`,
            nextAttempt: failedAttempt + 1,
            error:
              refreshError instanceof Error
                ? refreshError.message
                : String(refreshError),
          });
        }
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Audio downloader. Media range failed");
}

async function* emitOrderedBuffers(buffers, isLastBatch, pendingState) {
  for (let bufferIndex = 0; bufferIndex < buffers.length; bufferIndex++) {
    const buffer = buffers[bufferIndex];
    pendingState.buffers.push(buffer);
    pendingState.size += buffer.byteLength;

    const isFinalBuffer = isLastBatch && bufferIndex === buffers.length - 1;
    if (pendingState.size >= config.minChunkSize && !isFinalBuffer) {
      yield {
        buffer: concatBuffers(pendingState.buffers),
        isLastChunk: false,
      };
      pendingState.buffers = [];
      pendingState.size = 0;
    }
  }

  if (isLastBatch) {
    if (pendingState.size < 1) {
      throw new Error("Audio downloader. Final web ABR chunk is empty");
    }
    yield {
      buffer: concatBuffers(pendingState.buffers),
      isLastChunk: true,
    };
    pendingState.buffers = [];
    pendingState.size = 0;
  }
}

async function* downloadRangesSequential(
  targetWindow,
  streamUrl,
  _contentLength,
  signal,
  refreshUrl,
  ranges,
) {
  const urlState = { value: streamUrl, refreshPromise: null, version: 0 };
  const requestNumberRef = { value: 0 };
  const pendingState = { buffers: [], size: 0 };
  for (let index = 0; index < ranges.length; index++) {
    const { start, end } = ranges[index];
    const buffer = await fetchMediaRange(
      targetWindow,
      urlState,
      start,
      end,
      signal,
      refreshUrl,
      requestNumberRef,
    );
    for await (const chunk of emitOrderedBuffers(
      [buffer],
      index === ranges.length - 1,
      pendingState,
    ))
      yield chunk;
  }
}

async function* downloadRangesParallel(
  targetWindow,
  streamUrl,
  contentLength,
  signal,
  refreshUrl,
  concurrency,
) {
  const ranges = makeFixedRanges(contentLength, 4 * 1024 * 1024);
  const urlState = { value: streamUrl, refreshPromise: null, version: 0 };
  const requestNumberRef = { value: 0 };
  const pendingState = { buffers: [], size: 0 };

  for (let index = 0; index < ranges.length; index += concurrency) {
    signal.throwIfAborted();
    const batch = ranges.slice(index, index + concurrency);
    const buffers = await Promise.all(
      batch.map(({ start, end }) =>
        fetchMediaRange(
          targetWindow,
          urlState,
          start,
          end,
          signal,
          refreshUrl,
          requestNumberRef,
        ),
      ),
    );
    for await (const chunk of emitOrderedBuffers(
      buffers,
      index + batch.length >= ranges.length,
      pendingState,
    ))
      yield chunk;
  }
}

async function* downloadStream(targetWindow, streamUrl, signal) {
  const url = new URL(streamUrl);
  url.searchParams.delete("range");
  url.searchParams.delete("rn");
  url.searchParams.delete("ump");
  const response = await targetWindow.fetch(url, { signal });
  if (!response.ok)
    throw new Error(
      `Audio downloader. Stream request failed (${response.status})`,
    );
  if (!response.body)
    throw new Error("Audio downloader. Stream body is unavailable");

  const reader = response.body.getReader();
  const pending = [];
  let pendingSize = 0;
  let readyChunk = null;
  try {
    for (;;) {
      signal.throwIfAborted();
      const { value, done } = await reader.read();
      if (done) break;
      if (!value?.byteLength) continue;
      const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
      pending.push(bytes);
      pendingSize += bytes.byteLength;
      if (pendingSize >= config.minChunkSize) {
        const nextChunk = concatBuffers(pending);
        pending.length = 0;
        pendingSize = 0;

        if (readyChunk) {
          yield {
            buffer: readyChunk,
            isLastChunk: false,
          };
        }
        readyChunk = nextChunk;
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }

  if (pendingSize > 0) {
    if (readyChunk) {
      yield {
        buffer: readyChunk,
        isLastChunk: false,
      };
    }
    yield {
      buffer: concatBuffers(pending),
      isLastChunk: true,
    };
    return;
  }

  if (!readyChunk?.byteLength) {
    throw new Error("Audio downloader. Stream ended without audio data");
  }
  yield {
    buffer: readyChunk,
    isLastChunk: true,
  };
}

async function* downloadWithTransport(
  targetWindow,
  transport,
  streamUrl,
  contentLength,
  signal,
  refreshUrl,
) {
  switch (transport) {
    case "parallel_4":
      yield* downloadRangesParallel(
        targetWindow,
        streamUrl,
        contentLength,
        signal,
        refreshUrl,
        4,
      );
      return;
    case "parallel_2":
      yield* downloadRangesParallel(
        targetWindow,
        streamUrl,
        contentLength,
        signal,
        refreshUrl,
        2,
      );
      return;
    case "parallel_8":
      yield* downloadRangesParallel(
        targetWindow,
        streamUrl,
        contentLength,
        signal,
        refreshUrl,
        8,
      );
      return;
    case "stream":
      yield* downloadStream(targetWindow, streamUrl, signal);
      return;
    case "8mb":
      yield* downloadRangesSequential(
        targetWindow,
        streamUrl,
        contentLength,
        signal,
        refreshUrl,
        makeFixedRanges(contentLength, 8 * 1024 * 1024),
      );
      return;
    case "4mb":
      yield* downloadRangesSequential(
        targetWindow,
        streamUrl,
        contentLength,
        signal,
        refreshUrl,
        makeFixedRanges(contentLength, 4 * 1024 * 1024),
      );
      return;
    case "2mb":
      yield* downloadRangesSequential(
        targetWindow,
        streamUrl,
        contentLength,
        signal,
        refreshUrl,
        makeFixedRanges(contentLength, 2 * 1024 * 1024),
      );
      return;
    case "original":
      yield* downloadRangesSequential(
        targetWindow,
        streamUrl,
        contentLength,
        signal,
        refreshUrl,
        buildMediaRanges(contentLength),
      );
      return;
    default:
      throw new Error(
        `Audio downloader. Unknown web ABR transport: ${transport}`,
      );
  }
}

async function* downloadMediaRanges(
  targetWindow,
  streamUrl,
  contentLength,
  signal,
  refreshUrl,
  transportStartIndex = 0,
) {
  if (!Number.isSafeInteger(contentLength) || contentLength < 1)
    throw new Error("Audio downloader. Invalid media content length");

  // Always start with parallel_4 and only move forward through the fallback list.
  // transportStartIndex is intentionally kept in the signature for compatibility
  // with existing callers, but it no longer rotates the transport order.
  const transports = [...WEB_ABR_TRANSPORTS];
  debug.log("Audio downloader. web ABR transport order", {
    transportStartIndex: 0,
    requestedTransportStartIndex: transportStartIndex,
    transports,
    bufferBeforeEmit: true,
  });

  let lastError: unknown;
  for (const transport of transports) {
    signal.throwIfAborted();
    const startedAt = performance.now();
    try {
      debug.log("Audio downloader. web ABR transport started", {
        transport,
        contentLength,
        bufferBeforeEmit: true,
      });

      // Do not expose any audio to the outer uploader until the selected
      // transport has downloaded the complete source audio successfully.
      // This makes fallback safe even if a transport fails near the end.
      const bufferedChunks = [];
      let downloadedBytes = 0;
      for await (const chunk of downloadWithTransport(
        targetWindow,
        transport,
        streamUrl,
        contentLength,
        signal,
        refreshUrl,
      )) {
        if (!chunk?.buffer?.byteLength) {
          throw new Error(
            "Audio downloader. Web ABR transport produced an empty chunk",
          );
        }
        bufferedChunks.push(chunk);
        downloadedBytes += chunk.buffer.byteLength;
      }

      if (downloadedBytes !== contentLength) {
        throw new Error(
          `Audio downloader. Incomplete web ABR download (${downloadedBytes}/${contentLength} bytes)`,
        );
      }
      if (bufferedChunks.length < 1) {
        throw new Error(
          "Audio downloader. Web ABR transport returned no audio chunks",
        );
      }

      // Normalize finalization after the full download is verified.
      for (let index = 0; index < bufferedChunks.length; index++) {
        bufferedChunks[index] = {
          ...bufferedChunks[index],
          isLastChunk: index === bufferedChunks.length - 1,
        };
      }

      debug.log("Audio downloader. web ABR transport fully buffered", {
        transport,
        chunks: bufferedChunks.length,
        downloadedBytes,
        elapsedMs: Math.round(performance.now() - startedAt),
      });

      // Only now make the chunks visible to AudioDownloader/Yandex upload.
      for (const chunk of bufferedChunks) yield chunk;

      debug.log("Audio downloader. web ABR transport finished", {
        transport,
        elapsedMs: Math.round(performance.now() - startedAt),
        bufferBeforeEmit: true,
      });
      return;
    } catch (error) {
      signal.throwIfAborted();
      lastError = error;
      debug.log("Audio downloader. web ABR transport failed", {
        transport,
        emitted: false,
        bufferBeforeEmit: true,
        elapsedMs: Math.round(performance.now() - startedAt),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Audio downloader. All web ABR transports failed");
}

const WEB_ABR_DOWNLOAD_QUEUE = new Map();

async function* getWebAbrAudioChunksImpl(
  targetWindow,
  videoId,
  signal,
  transportStartIndex = 0,
  sourceLanguage,
) {
  const config = await resolveYtcfg(targetWindow, signal);
  const apiKey = getConfigValue(config, "INNERTUBE_API_KEY");
  if (typeof apiKey !== "string")
    throw new Error("Audio downloader. web ABR config is unavailable");
  const playerCodes = /* @__PURE__ */ new Map();
  const fetchPlayerCode = (url = getPlayerUrl(config)) => {
    if (!url) return Promise.resolve(void 0);
    let code = playerCodes.get(url);
    if (!code) {
      code = targetWindow.fetch(url, { signal }).then((response) => {
        if (!response.ok)
          throw new Error(
            `Audio downloader. YouTube player request failed (${response.status})`,
          );
        return response.text();
      });
      playerCodes.set(url, code);
    }
    return code;
  };
  let sts = Number(getConfigValue(config, "STS"));
  if (!(sts > 0))
    sts = Number(
      (await fetchPlayerCode())?.match(
        /(?:signatureTimestamp|sts)\s*:\s*([0-9]{5})/,
      )?.[1],
    );
  const body = buildWebEmbeddedPlayerRequest(config, videoId, sts);
  const context = body.context;
  const clientVersion = String(context.client.clientVersion ?? "");
  const visitorData =
    context.client.visitorData ?? getConfigValue(config, "VISITOR_DATA");
  if (typeof visitorData === "string") context.client.visitorData = visitorData;
  const dataSyncId = getConfigValue(config, "DATASYNC_ID");
  const [firstSyncId, secondSyncId] =
    typeof dataSyncId === "string" ? dataSyncId.split("||") : [];
  const delegatedSessionId =
    getConfigValue(config, "DELEGATED_SESSION_ID") ??
    (secondSyncId ? firstSyncId : void 0);
  const authorization = await getYouTubeAuthorization(
    targetWindow,
    String(
      getConfigValue(config, "USER_SESSION_ID") ??
        (secondSyncId || firstSyncId) ??
        "",
    ) || void 0,
  );
  const loggedIn = getConfigValue(config, "LOGGED_IN") === true;
  const playerContexts = getConfigValue(config, "WEB_PLAYER_CONTEXT_CONFIGS");
  const pageExperimentFlags = Object.values(
    playerContexts && typeof playerContexts === "object" ? playerContexts : {},
  ).flatMap((entry) =>
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
        : void 0;
    const options = {
      visitorData: fetchedConfig?.visitorData ?? visitorData,
      signatureTimestamp: fetchedConfig?.signatureTimestamp ?? sts,
      clientVersion: fetchedConfig?.clientVersion,
    };
    const candidateBody =
      name === "web_embedded"
        ? body
        : name === "tv_downgraded"
          ? buildTvDowngradedPlayerRequest(videoId, options)
          : name === "web"
            ? buildWebPlayerRequest(config, videoId, sts)
            : buildWebCreatorPlayerRequest(videoId, options);
    const candidateContext = candidateBody.context;
    if (typeof options.visitorData === "string")
      candidateContext.client.visitorData = options.visitorData;
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
          `Audio downloader. ${name} ${status?.status ?? "failed"}: ${status?.reason ?? status?.messages?.join(" ") ?? "no streaming data"}`,
        );
      }
      const format = selectWebEmbeddedAudioFormat(formats, sourceLanguage);
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
      let poToken: any;
      const authorizeUrl = async (streamUrl) => {
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
      ))
        try {
          const streamUrl = await authorizeUrl(solvedUrl);
          const contentLength =
            Number(format.contentLength) ||
            (await probeContentLength(targetWindow, streamUrl, signal));
          const refreshUrl = async () => {
            const refreshed = (
              await requestPlayer()
            ).streamingData?.adaptiveFormats?.find(
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
            ))
              return await authorizeUrl(url);
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
            transportStartIndex,
          )) {
            emitted = true;
            yield chunk;
          }
          return;
        } catch (error) {
          signal.throwIfAborted();
          if (emitted) throw error;
          lastError = error;
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
      : /* @__PURE__ */ new Error(
          "Audio downloader. no playable audio formats",
        );
  if (/LOGIN_REQUIRED|UNPLAYABLE/.test(fallbackError.message))
    throw new Error(
      `${fallbackError.message}. Sign in to YouTube with an age-verified account and retry from the youtube.com watch page`,
      { cause: fallbackError },
    );
  throw fallbackError;
}

/**
 * Serialize concurrent web_abr downloads for the same video.
 *
 * If VOT accidentally calls web_abr twice for one video, the second call waits
 * until the first generator is completely finished before it starts resolving
 * clients/media URLs or issuing media requests. This prevents two downloaders
 * from racing on signed googlevideo URLs at the same time.
 *
 * Calls for different video IDs are still allowed to run independently.
 */
export async function* getWebAbrAudioChunks(
  targetWindow,
  videoId,
  signal,
  transportStartIndex = 0,
  sourceLanguage,
) {
  const queueKey = String(videoId);
  const previousEntry = WEB_ABR_DOWNLOAD_QUEUE.get(queueKey);
  const hadPrevious = Boolean(previousEntry);
  const previous = previousEntry ?? Promise.resolve();

  let releaseCurrent: (() => void) | undefined;
  const current = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });

  // Every later call waits for this ticket. A ticket is released only after
  // the previous ticket has completed and this invocation has either finished
  // or noticed that it was aborted.
  WEB_ABR_DOWNLOAD_QUEUE.set(queueKey, current);

  debug.log("Audio downloader. web ABR queued", {
    videoId,
    hasPrevious: hadPrevious,
    transportStartIndex,
  });

  try {
    await previous;
    signal.throwIfAborted();

    debug.log("Audio downloader. web ABR queue entered", {
      videoId,
      transportStartIndex,
    });

    yield* getWebAbrAudioChunksImpl(
      targetWindow,
      videoId,
      signal,
      transportStartIndex,
      sourceLanguage,
    );
  } finally {
    releaseCurrent?.();

    if (WEB_ABR_DOWNLOAD_QUEUE.get(queueKey) === current) {
      WEB_ABR_DOWNLOAD_QUEUE.delete(queueKey);
    }

    debug.log("Audio downloader. web ABR queue released", {
      videoId,
      transportStartIndex,
    });
  }
}
