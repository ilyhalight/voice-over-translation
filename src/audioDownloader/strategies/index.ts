import { AudioDownloadType } from "@vot.js/core/types/yandex";

import { getAudioFromWebAbr } from "./webAbr";
import { getAudioFromWebMseProxy } from "./webMseProxy";

export const WEB_ABR_STRATEGY = AudioDownloadType.WEB_ABR;
export const WEB_MSE_PROXY_STRATEGY = AudioDownloadType.WEB_MSE_PROXY;

export const strategies = {
  [WEB_ABR_STRATEGY]: getAudioFromWebAbr,
  [WEB_MSE_PROXY_STRATEGY]: getAudioFromWebMseProxy,
} as const;

export type AvailableAudioDownloadType = keyof typeof strategies;
