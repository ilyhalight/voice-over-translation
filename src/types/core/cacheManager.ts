import type { VideoDataSubtitle } from "@vot.js/core/types/client";

export type CacheTranslationSuccess = {
  videoId: string;
  from: string;
  to: string;
  url: string;
  useLivelyVoice: boolean;
};

export type CacheSubtitle = VideoDataSubtitle;
