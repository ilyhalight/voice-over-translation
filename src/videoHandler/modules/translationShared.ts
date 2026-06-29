import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";

import type { CacheTranslationSuccess } from "../../types/core/cacheManager";
import type { VideoData } from "../shared";
import type { ActionContext } from "./translationTypes";

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
  ): Promise<TranslationAudioResult | null>;
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

/**
 * Executes an async action with staleness guards before and after.
 * Returns true if the action completed without becoming stale.
 *
 * Centralizes the "check stale -> act -> re-check stale" pattern that was
 * previously duplicated across updateTranslationIfFresh and
 * requestAndApplyTranslation.
 */
export async function withStaleGuard(
  actionContext: ActionContext | undefined,
  isActionStale: (ctx?: ActionContext) => boolean,
  action: () => Promise<void>,
): Promise<boolean> {
  if (isActionStale(actionContext)) return false;
  await action();
  return !isActionStale(actionContext);
}

export async function updateTranslationIfFresh(options: {
  url: string;
  actionContext?: ActionContext;
  usedLivelyVoice?: boolean;
  isActionStale(actionContext?: ActionContext): boolean;
  updateTranslation(
    url: string,
    actionContext?: ActionContext,
    usedLivelyVoice?: boolean,
  ): Promise<void>;
}): Promise<boolean> {
  return withStaleGuard(options.actionContext, options.isActionStale, () =>
    options.updateTranslation(
      options.url,
      options.actionContext,
      options.usedLivelyVoice,
    ),
  );
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
  if (options.aborted) {
    return false;
  }

  if (!options.translateApiErrorsEnabled || !options.hadAsyncWait) {
    return options.hadAsyncWait;
  }

  options.notify({
    videoId: options.videoId,
    message: options.error,
  });
  return false;
}
