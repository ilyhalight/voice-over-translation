import { VOTJSError } from "@vot.js/core/client";
import { VideoDataSubtitle } from "@vot.js/core/types/client";

export type CacheTranslationSuccess = {
  videoId: string;
  from: string;
  to: string;
  url: string | undefined;
  useLivelyVoice: boolean;
};

export type CacheTranslationError = {
  // maybe something else?
  error: VOTJSError;
};

export type CacheTranslation = CacheTranslationSuccess | CacheTranslationError;

export type CacheSubtitle = VideoDataSubtitle;

export type CacheVideoById = {
  translation?: CacheTranslation;
  subtitles?: CacheSubtitle[];
};
