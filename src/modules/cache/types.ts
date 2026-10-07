import type { VideoDataSubtitle } from "@vot.js/core/types/client";
import type { ClientSession, SessionModule } from "@vot.js/shared/types/secure";

import type { votStorage } from "#utils/storage.ts";

export type CacheTranslationSuccess = {
  videoId: string;
  from: string;
  to: string;
  url: string;
  useLivelyVoice: boolean;
};

export type CacheSubtitle = VideoDataSubtitle;

export type TimedCacheEntry<T> = {
  expiresAt: number;
  value: T;
};

export type VOTSessions = Partial<Record<SessionModule, ClientSession>>;
export type VOTSessionStorage = Pick<
  typeof votStorage,
  "getRaw" | "setRaw" | "deleteRaw"
>;
