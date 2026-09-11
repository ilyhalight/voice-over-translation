import { AudioDownloadType } from "@vot.js/core/types/yandex";

import type { GetAudioFromAPIOptions } from "../../types/audioDownloader";
import { getAudioFromBridge } from "./webAudioBridge";

import "./mseProxyHandler";

export type { AudioChunk as MseProxyChunk } from "./audioChunks";
export {
  parseAudioBridgeChunk,
  parseAudioBridgeChunk as parseMseProxyChunk,
  STREAM_TIMEOUT_MS,
} from "./webAudioBridge";

export async function getAudioFromWebMseProxy(options: GetAudioFromAPIOptions) {
  return getAudioFromBridge(options, AudioDownloadType.WEB_MSE_PROXY);
}
