// CONFIGURATION
const workerHost = "api.browser.yandex.ru";
/**
 * used for streaming
 *
 * @see https://github.com/FOSWLY/media-proxy
 */
const m3u8ProxyHost = "media-proxy.toil.cc/v1/proxy/m3u8";
/**
 * @see https://github.com/FOSWLY/vot-worker
 */
const proxyWorkerHost = "vot-worker.toil.cc";
const votBackendUrl = "https://vot.toil.cc/v1";
/**
 * @see https://github.com/FOSWLY/translate-backend
 */
const foswlyTranslateUrl = "https://translate.toil.cc/v2";
const detectRustServerUrl = "https://rust-server-531j.onrender.com/detect";

const repoPath = "ilyhalight/voice-over-translation";
const contentUrl = `https://raw.githubusercontent.com/${repoPath}`;
const repositoryUrl = `https://github.com/${repoPath}`;

/**
 * 0% - 100% - default volume of the video with the translation
 */
const defaultAutoVolume = 15;
/**
 * Max audio volume percentage (if available)
 */
const maxAudioVolume = 900;
/**
 * The number of repeated responses after which the message turns into "translation is delayed, please wait"
 */
const minLongWaitingCount = 5;
const defaultTranslationService = "yandexbrowser";
const defaultDetectService = "yandexbrowser";

const nonProxyExtensions = ["Tampermonkey", "Violentmonkey"];
const proxyOnlyCountries = ["UA", "LV", "LT"];

/**
 * 100 - 3000 ms - delay before hiding button
 */
const defaultAutoHideDelay = 1000;

const actualCompatVersion = "2025-05-09";

export {
  workerHost,
  m3u8ProxyHost,
  proxyWorkerHost,
  detectRustServerUrl,
  votBackendUrl,
  contentUrl,
  repoPath,
  repositoryUrl,
  foswlyTranslateUrl,
  defaultTranslationService,
  defaultDetectService,
  defaultAutoVolume,
  maxAudioVolume,
  minLongWaitingCount,
  nonProxyExtensions,
  proxyOnlyCountries,
  defaultAutoHideDelay,
  actualCompatVersion,
};
