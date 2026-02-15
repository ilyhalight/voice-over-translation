import { initAudioDownloaderIframe } from "../audioDownloader/iframe";
import { IFRAME_HASH, isIframe } from "../utils/iframeConnector";

/**
 * Runs inside the hidden YouTube "service iframe" used by the audio-downloader.
 *
 * In the extension build for Chromium we inject this content script into the
 * page's MAIN world (via the manifest "world": "MAIN" property) so that the
 * existing audio-downloader code can patch the page's fetch() implementation.
 */

try {
  if (isIframe() && globalThis.location.hash.includes(IFRAME_HASH)) {
    initAudioDownloaderIframe();
  }
} catch (err) {
  // eslint-disable-next-line no-console
  console.error("[VOT Extension] Failed to boot iframe helper", err);
}
