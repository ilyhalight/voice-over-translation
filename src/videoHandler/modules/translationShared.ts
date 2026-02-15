import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";

import type { CacheTranslationSuccess } from "../../types/core/cacheManager";
import type { VideoData } from "../shared";

export type TranslationAudioResult = {
  url: string;
  usedLivelyVoice: boolean;
};

type TranslationRequester = {
  translateVideoImpl(
    videoData: VideoData,
    requestLang: RequestLang,
    responseLang: ResponseLang,
    translationHelp: VideoData["translationHelp"],
    shouldSendFailedAudio: boolean,
    signal: AbortSignal,
  ): Promise<(TranslationAudioResult & { url: string }) | null>;
};

export type TranslationActionContext = {
  gen: number;
  videoId: string;
};

export function normalizeTranslationHelp(
  translationHelp: VideoData["translationHelp"] | undefined,
): VideoData["translationHelp"] {
  return translationHelp ?? null;
}

export async function requestTranslationAudio(
  requester: TranslationRequester,
  options: {
    videoData: VideoData;
    requestLang: RequestLang;
    responseLang: ResponseLang;
    translationHelp: VideoData["translationHelp"] | undefined;
    useAudioDownload?: boolean;
    signal: AbortSignal;
  },
): Promise<TranslationAudioResult | null> {
  const response = await requester.translateVideoImpl(
    options.videoData,
    options.requestLang,
    options.responseLang,
    normalizeTranslationHelp(options.translationHelp),
    !options.useAudioDownload,
    options.signal,
  );

  if (!response?.url) {
    return null;
  }

  return {
    url: response.url,
    usedLivelyVoice: Boolean(response.usedLivelyVoice),
  };
}

export function buildTranslationCacheValue(options: {
  videoId: string;
  requestLang: string;
  responseLang: string;
  fallbackUrl: string;
  downloadTranslationUrl?: string | null;
  usedLivelyVoice: boolean;
}): CacheTranslationSuccess {
  return {
    videoId: options.videoId,
    from: options.requestLang,
    to: options.responseLang,
    url: options.downloadTranslationUrl ?? options.fallbackUrl,
    useLivelyVoice: options.usedLivelyVoice,
  };
}

export async function updateTranslationAndSchedule(options: {
  url: string;
  actionContext?: TranslationActionContext;
  isActionStale(actionContext?: TranslationActionContext): boolean;
  updateTranslation(
    url: string,
    actionContext?: TranslationActionContext,
  ): Promise<void>;
  scheduleTranslationRefresh(): void;
}): Promise<boolean> {
  if (options.isActionStale(options.actionContext)) {
    return false;
  }

  await options.updateTranslation(options.url, options.actionContext);

  if (options.isActionStale(options.actionContext)) {
    return false;
  }

  options.scheduleTranslationRefresh();
  return true;
}

export async function requestAndApplyTranslation(options: {
  requester: TranslationRequester;
  request: {
    videoData: VideoData;
    requestLang: RequestLang;
    responseLang: ResponseLang;
    translationHelp: VideoData["translationHelp"] | undefined;
    useAudioDownload?: boolean;
    signal: AbortSignal;
  };
  actionContext?: TranslationActionContext;
  isActionStale(actionContext?: TranslationActionContext): boolean;
  updateTranslation(
    url: string,
    actionContext?: TranslationActionContext,
  ): Promise<void>;
  scheduleTranslationRefresh(): void;
}): Promise<TranslationAudioResult | null> {
  const translateRes = await requestTranslationAudio(options.requester, {
    videoData: options.request.videoData,
    requestLang: options.request.requestLang,
    responseLang: options.request.responseLang,
    translationHelp: options.request.translationHelp,
    useAudioDownload: options.request.useAudioDownload,
    signal: options.request.signal,
  });
  if (!translateRes) {
    return null;
  }

  const updated = await updateTranslationAndSchedule({
    url: translateRes.url,
    actionContext: options.actionContext,
    isActionStale: options.isActionStale,
    updateTranslation: options.updateTranslation,
    scheduleTranslationRefresh: options.scheduleTranslationRefresh,
  });
  if (!updated || options.isActionStale(options.actionContext)) {
    return null;
  }

  return translateRes;
}

export function setTranslationCacheValue(options: {
  cacheKey: string;
  setTranslation(key: string, value: CacheTranslationSuccess): void;
  videoId: string;
  requestLang: string;
  responseLang: string;
  fallbackUrl: string;
  downloadTranslationUrl?: string | null;
  usedLivelyVoice: boolean;
}): void {
  options.setTranslation(
    options.cacheKey,
    buildTranslationCacheValue({
      videoId: options.videoId,
      requestLang: options.requestLang,
      responseLang: options.responseLang,
      fallbackUrl: options.fallbackUrl,
      downloadTranslationUrl: options.downloadTranslationUrl,
      usedLivelyVoice: options.usedLivelyVoice,
    }),
  );
}

export function notifyTranslationFailureIfNeeded(options: {
  aborted: boolean;
  translateApiErrorsEnabled: boolean;
  hadAsyncWait: boolean;
  videoId?: string;
  error: unknown;
  notify(params: { videoId?: string; message?: unknown }): void;
}): boolean {
  if (
    options.aborted ||
    !options.translateApiErrorsEnabled ||
    !options.hadAsyncWait
  ) {
    return options.hadAsyncWait;
  }

  options.notify({
    videoId: options.videoId,
    message: options.error,
  });
  return false;
}
