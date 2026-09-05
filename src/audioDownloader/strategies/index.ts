import { AudioDownloadType } from "@vot.js/core/types/yandex";

import { getAudioFromWebMseProxy } from "./webMseProxy";

export const WEB_MSE_PROXY_STRATEGY = AudioDownloadType.WEB_MSE_PROXY;

export const strategies = {
  [WEB_MSE_PROXY_STRATEGY]: getAudioFromWebMseProxy,
} as const;

export type AvailableAudioDownloadType = keyof typeof strategies;
