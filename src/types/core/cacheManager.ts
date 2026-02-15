import type { VideoDataSubtitle } from "@vot.js/core/types/client";

export type CacheTranslationSuccess = {
  videoId: string;
  from: string;
  to: string;
  url: string;
  useLivelyVoice: boolean;
};

export type CacheSubtitle = VideoDataSubtitle;

export type CacheVideoById = {
  translation?: CacheTranslationSuccess;
  subtitles?: CacheSubtitle[];

  /** Internal: expiration timestamps (ms since epoch). */
  translationExpiresAt?: number;
  subtitlesExpiresAt?: number;
};
