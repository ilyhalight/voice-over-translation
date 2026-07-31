// URL allowlist for GM_xmlhttpRequest / fetch bridge.
//
// SECURITY: The extension's `GM_xmlhttpRequest` polyfill runs in the page's
// MAIN world. Any page script (including third-party ads) can call it to make
// cross-origin requests with cookies and CORS bypass via the background
// `fetch`. Without an allowlist, a malicious page could read authenticated
// data from any host in `host_permissions` (yandex.ru, youtube.com, etc.).
//
// This module validates that the requested URL targets a host that VOT
// actually needs to talk to.

/**
 * Allowed hostname suffixes. A request is allowed iff the URL's hostname ends
 * with one of these suffixes (with a leading dot or exact match).
 *
 * Note: this list must cover every host legitimately contacted via
 * `GM_xmlhttpRequest` — Yandex translation APIs, the auth/translate backends,
 * YouTube data endpoints used by `@vot.js/ext`, GitHub raw content, and the
 * media-proxy for HLS streams.
 */
const ALLOWED_HOST_SUFFIXES: readonly string[] = [
  // Yandex translation backend (video translation API).
  "browser.yandex.ru",
  "yandex.ru",
  "yandex.net",
  "avatars.mds.yandex.net",

  // VOT backend / proxy workers (owned by the maintainer).
  "vot.toil.cc",
  "vot-worker.vtrans.eu.cc",
  "vot-worker.eu.cc",
  "media-proxy.toil.cc",

  // Translate backend (language detection + text translation).
  "translate-backend.transly.eu.cc",
  "translate.toil.cc",

  // Auth server.
  "rust-server-531j.onrender.com",

  // GitHub raw content (used for self-update checks / locale fetches).
  "raw.githubusercontent.com",

  // YouTube data endpoints — `@vot.js/ext/helpers/youtube` fetches the
  // player response and subtitle metadata from these hosts.
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtubei.googleapis.com",
  "i.ytimg.com",

  // youtube video CDN — `@vot.js/ext` may resolve audio streams from here.
  "googlevideo.com",
  "*.googlevideo.com",

  // Other supported video hosts that `@vot.js/ext` may contact directly.
  "rutube.ru",
  "vk.com",
  "vk.ru",
  "ok.ru",
  "mail.ru",
  "dzen.ru",
  "bilibili.com",
  "youku.com",
  "weibo.com",
  "weverse.io",
  "nicovideo.jp",
  "dailymotion.com",
  "twitch.tv",
  "vimeo.com",
  "soundcloud.com",
  "patreon.com",
  "drive.google.com",
  "docs.google.com",
  "googleusercontent.com",
  "banned.video",
  "rumble.com",
  "bitchute.com",
  "trovo.live",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "piped.video",
  "invidious.snopyta.org",
];

const compiledSuffixes: readonly string[] = Object.freeze(
  ALLOWED_HOST_SUFFIXES.map((s) => s.toLowerCase()),
);

/**
 * Returns `true` if the given URL is allowed for the GM_xmlhttpRequest bridge.
 *
 * Rules:
 * - URL must be parseable.
 * - Protocol must be `http:` or `https:`.
 * - Hostname must match one of the allowlist suffixes (exact or wildcard
 *   `*.suffix`).
 * - `file:` URLs are rejected (we never need local files).
 */
export function isAllowedXhrUrl(rawUrl: unknown): boolean {
  if (typeof rawUrl !== "string" || rawUrl.length === 0) return false;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl, globalThis.location?.href);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  if (!host) return false;

  for (const suffix of compiledSuffixes) {
    if (suffix.startsWith("*.")) {
      const tail = suffix.slice(1); // keep leading dot
      if (host.endsWith(tail)) return true;
    } else if (host === suffix || host.endsWith(`.${suffix}`)) {
      return true;
    }
  }
  return false;
}
