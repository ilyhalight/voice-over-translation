import { AudioDownloadType } from "@vot.js/core/types/yandex";
import { getAudioFromWebApiWithReplacedFetch } from "./webApiGetAllGeneratingUrlsData";

export const strategies = {
  [AudioDownloadType.WEB_API_GET_ALL_GENERATING_URLS_DATA_FROM_IFRAME]:
    getAudioFromWebApiWithReplacedFetch,
} as const;

export type AvailableAudioDownloadType = keyof typeof strategies;
