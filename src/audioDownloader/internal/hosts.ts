/**
 * CONSOLIDATION — one source of truth for the hosts the audio downloader
 * keys behavior off.
 *
 * Before: `webAudioBridge.YOUTUBE_ORIGIN` (an origin regexp),
 * `pageAudioHandler.YOUTUBE_HOSTS` (a hostname regexp that listed a *different*
 * host set), and two byte-identical `/(?:^|\.)googlevideo\.com$/` literals at
 * `poToken.ts:189` and `webAbr.ts:1268`. Three facts, four declarations, two of
 * them already divergent.
 *
 * PARITY NOTE: every pattern below is copied verbatim from the unit it came
 * from, flags included, so consolidation cannot change which strings match.
 * `youtubekids.com` is intentionally present in both host sets because both
 * originals listed it.
 */

/** Origin used as the base when resolving a relative YouTube URL. */
export const YOUTUBE_ORIGIN = "https://www.youtube.com";

/**
 * Origins whose bridge answers are accepted (from `webAudioBridge.ts:31`).
 *
 * Deliberately wide: the answer comes from the page realm itself (the site the
 * video is embedded on), from the hidden youtube.com realm, or from a realm
 * that reports no origin at all.
 */
const TRUSTED_ORIGIN_PATTERN =
  /^https:\/\/(?:[a-z0-9-]+\.)*(?:youtube(?:-nocookie)?\.com|youtubekids\.com)$/i;

/** Hostnames that carry a usable YouTube session (from `pageAudioHandler.ts:40`). */
const YOUTUBE_HOST_PATTERN =
  /(?:^|\.)(?:youtube\.com|youtube-nocookie\.com|youtubekids\.com)$/;

/** GVS media hosts (from `poToken.ts:189` and `webAbr.ts:1268`). */
const GOOGLEVIDEO_HOST_PATTERN = /(?:^|\.)googlevideo\.com$/;

/** True for a `https://…youtube(-nocookie|kids)?.com` origin string. */
export function isTrustedYouTubeOrigin(origin: string): boolean {
  return TRUSTED_ORIGIN_PATTERN.test(origin);
}

/** True for youtube.com / youtube-nocookie.com / youtubekids.com and subdomains. */
export function isYouTubeHost(host: string | undefined | null): boolean {
  return !!host && YOUTUBE_HOST_PATTERN.test(host);
}

/** True for the GVS media hosts (`*.googlevideo.com`). */
export function isGooglevideoHost(host: string | undefined | null): boolean {
  return !!host && GOOGLEVIDEO_HOST_PATTERN.test(host);
}

/**
 * True when `url` is parseable and points at a GVS media host.
 *
 * MODERNIZATION (R-5): `URL.canParse` replaces the `try { new URL(x) } catch {}`
 * guard both former copies used.
 */
export function isGooglevideoUrl(url: string | undefined | null): boolean {
  if (!url || !URL.canParse(url)) return false;
  return isGooglevideoHost(new URL(url).hostname);
}
