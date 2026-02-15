import type {
  VideoData as CoreVideoData,
  VideoDataSubtitle,
} from "@vot.js/core/types/client";
import type { TranslationHelp } from "@vot.js/core/types/yandex";
import type { VideoService } from "@vot.js/ext/types/service";
import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";

export type VideoData = Omit<
  CoreVideoData<VideoService>,
  "duration" | "detectedLanguage" | "translationHelp" | "isStream" | "subtitles"
> & {
  downloadTitle: string;
  duration: number;
  detectedLanguage: RequestLang;
  responseLanguage: ResponseLang;
  isStream: boolean;
  translationHelp: TranslationHelp[] | null;
  subtitles?: VideoDataSubtitle[];
};

/**
 * Country code used for proxy settings. Populated lazily during init.
 */
export let countryCode: string | undefined;

export function setCountryCode(next: string | undefined) {
  countryCode = next;
}
