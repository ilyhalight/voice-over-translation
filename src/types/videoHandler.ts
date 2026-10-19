import type {
  VideoData as CoreVideoData,
  VideoDataSubtitle,
} from "@vot.js/core/types/client";
import type { VideoTranslationHelp } from "@vot.js/core/types/providers/yandex";
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
  translationHelp: VideoTranslationHelp[] | null;
  subtitles?: VideoDataSubtitle[];
};
