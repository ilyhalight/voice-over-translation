import { AudioDownloadType } from "@vot.js/core/types/yandex";

export { AudioDownloadType };

/**
 * Ways the page realm can hand the audio track over to the userscript realm:
 *
 * - `WEB_ABR` downloads a direct GVS audio URL in ranges. One InnerTube
 *   `player` call plus one media request per 4 MiB of the track, but YouTube
 *   only answers direct URLs for a part of its clients.
 * - `WEB_MSE_PROXY` copies the audio segments the YouTube player is already
 *   streaming through MediaSource. It costs no request of its own and works
 *   even when every client answers SABR-only, so it is the last resort.
 */
export const AUDIO_DOWNLOAD_TYPES = [
  AudioDownloadType.WEB_ABR,
  AudioDownloadType.WEB_MSE_PROXY,
] as const;

export type AvailableAudioDownloadType = (typeof AUDIO_DOWNLOAD_TYPES)[number];

export function isAudioDownloadType(
  value: unknown,
): value is AvailableAudioDownloadType {
  return AUDIO_DOWNLOAD_TYPES.includes(value as AvailableAudioDownloadType);
}

/** postMessage contract between the userscript realm and the page realm. */
export const MESSAGE_TYPE = "vot-get-audio-chunks-in-main-world";
export const READY_MESSAGE_TYPE = "vot-audio-realm-ready";

/**
 * Marks the hidden youtube.com iframe that is used as a realm when the current
 * page cannot talk to youtube.com itself.
 */
export const IFRAME_HASH = "vot_audio_realm";

export function getAudioRealmIframeId(messageId: string): string {
  return `vot-audio-realm-${messageId}`;
}
