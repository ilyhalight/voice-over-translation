import { LOCAL_FILE_STRATEGY } from "../../core/localFile";
import type { GetAudioFromAPIOptions } from "../../types/audioDownloader";
import {
  SABR_STRATEGY,
  WEB_ABR_STRATEGY,
  WEB_MSE_PROXY_STRATEGY,
} from "./audioStrategy";
import { getAudioFromLocalFile } from "./localFile";
import { getAudioFromBridge } from "./webAudioBridge";

import "./mseProxyHandler";

export {
  LOCAL_FILE_STRATEGY,
  SABR_STRATEGY,
  WEB_ABR_STRATEGY,
  WEB_MSE_PROXY_STRATEGY,
};

export const strategies = {
  [SABR_STRATEGY]: (options: GetAudioFromAPIOptions) =>
    getAudioFromBridge(options, SABR_STRATEGY),
  [WEB_ABR_STRATEGY]: (options: GetAudioFromAPIOptions) =>
    getAudioFromBridge(options, WEB_ABR_STRATEGY),
  [WEB_MSE_PROXY_STRATEGY]: (options: GetAudioFromAPIOptions) =>
    getAudioFromBridge(options, WEB_MSE_PROXY_STRATEGY),
  [LOCAL_FILE_STRATEGY]: (options: GetAudioFromAPIOptions) =>
    getAudioFromLocalFile(options),
} as const;

export type AvailableAudioDownloadType = keyof typeof strategies | "auto";
