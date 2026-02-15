// CONFIGURATION

export const workerHost = "api.browser.yandex.ru";

/**
 * used for streaming
 *
 * @see https://github.com/FOSWLY/media-proxy
 */
export const m3u8ProxyHost = "media-proxy.toil.cc/v1/proxy/m3u8";

/**
 * @see https://github.com/FOSWLY/vot-worker
 */
export const proxyWorkerHost = "vot-worker.toil.cc";

export const votBackendUrl = "https://vot.toil.cc/v1";

/**
 * @see https://github.com/FOSWLY/translate-backend
 */
export const foswlyTranslateUrl = "https://translate.toil.cc/v2";

export const detectRustServerUrl =
  "https://rust-server-531j.onrender.com/detect";
export const authServerUrl = "https://t2mc.toil.cc";
export const avatarServerUrl = "https://avatars.mds.yandex.net/get-yapic";

const repoPath = "ilyhalight/voice-over-translation";
export const contentUrl = `https://raw.githubusercontent.com/${repoPath}`;
export const repositoryUrl = `https://github.com/${repoPath}`;

/**
 * 0% - 100% - default volume of the video with the translation
 */
export const defaultAutoVolume = 15;

/**
 * Max audio volume percentage (if available)
 */
export const maxAudioVolume = 900;

/**
 * The number of repeated responses after which the message turns into
 * "translation is delayed, please wait"
 */
export const minLongWaitingCount = 5;

export const defaultTranslationService: "yandexbrowser" | "msedge" =
  "yandexbrowser";
export const defaultDetectService: "yandexbrowser" | "msedge" | "rust-server" =
  "rust-server";

export const nonProxyExtensions: string[] = ["Tampermonkey", "Violentmonkey"];
export const proxyOnlyCountries: string[] = ["UA", "LV", "LT"];

/**
 * 100 - 3000 ms - delay before hiding button
 */
export const defaultAutoHideDelay = 1000;

export const actualCompatVersion = "2025-05-09";
