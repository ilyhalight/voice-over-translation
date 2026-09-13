import { AudioDownloadType } from "@vot.js/core/types/yandex";
import type { GetAudioFromAPIOptions } from "../../types/audioDownloader";
import { getAudioFromBridge } from "./webAudioBridge";

import "./mseProxyHandler";

export const WEB_ABR_STRATEGY = AudioDownloadType.WEB_ABR;
export const WEB_MSE_PROXY_STRATEGY = AudioDownloadType.WEB_MSE_PROXY;

export const strategies = {
  [WEB_ABR_STRATEGY]: (options: GetAudioFromAPIOptions) =>
    getAudioFromBridge(options, WEB_ABR_STRATEGY),
  [WEB_MSE_PROXY_STRATEGY]: (options: GetAudioFromAPIOptions) =>
    getAudioFromBridge(options, WEB_MSE_PROXY_STRATEGY),
} as const;

export type AvailableAudioDownloadType = keyof typeof strategies;
