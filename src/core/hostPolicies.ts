export const EXTERNAL_VOLUME_HOSTS = new Set(["youtube", "googledrive"]);

export const YOUTUBE_LIKE_HOSTS = EXTERNAL_VOLUME_HOSTS;

export const MUTE_SYNC_DISABLED_HOSTS = new Set(["rutube", "ok"]);
export const TRANSLATION_DOWNLOAD_HOSTS = new Set([
  "youtube",
  "invidious",
  "piped",
]);

export function isExternalVolumeHost(host: string): boolean {
  return EXTERNAL_VOLUME_HOSTS.has(host);
}

export function isYouTubeLikeHost(host: string): boolean {
  return YOUTUBE_LIKE_HOSTS.has(host);
}

export function isMuteSyncDisabledHost(host: string): boolean {
  return MUTE_SYNC_DISABLED_HOSTS.has(host);
}

export function isDesktopYouTubeLikeSite(site: {
  host: string;
  additionalData?: string | null;
}): boolean {
  return isYouTubeLikeHost(site.host) && site.additionalData !== "mobile";
}

export function isTranslationDownloadHost(host: string): boolean {
  return TRANSLATION_DOWNLOAD_HOSTS.has(host);
}
