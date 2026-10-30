import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";

import { isTranslationDownloadHost } from "../../core/hostPolicies";
import { notifyTranslationFailureIfNeeded } from "../../core/translationErrors";
import { t } from "../../localization/localizationProvider";
import { captureException } from "../../modules/telemetry/client";
import {
  getAudioFailureTags,
  getTranslationTags,
} from "../../modules/telemetry/context";
import type { VideoData } from "../../types/videoHandler";
import debug from "../../utils/debug";
import { toErrorMessage } from "../../utils/errors";
import type { VideoHandler } from "../../VideoHandler";
import VOTLocalizedError from "../../VOTLocalizedError";
import { applyTranslationPlaybackVolume } from "../translationVolume";
import {
  isYandexAudioUrlOrProxy,
  proxifyYandexAudioUrl,
  unproxifyYandexAudioUrl,
} from "./proxyShared";
import {
  getIndexedSubtitleDescriptors,
  pickBestSubtitlesIndex,
} from "./subtitlesShared";
import {
  normalizeTranslationHelp,
  requestTranslationAudio,
  setTranslationCacheValue,
  type TranslationAudioResult,
  updateTranslationIfFresh,
  withStaleGuard,
} from "./translationShared";
import type {
  ActionContext,
  ApplyTranslationSourceResult,
} from "./translationTypes";

async function resumePlayerAudioContextIfNeeded(
  handler: VideoHandler,
): Promise<"not-needed" | "resumed" | "timeout" | "failed"> {
  const ctx = handler.audioPlayer?.audioContext;
  if (ctx?.state !== "suspended") return "not-needed";

  const RESUME_TIMEOUT_MS = 1500;

  const resumePromise = (async (): Promise<"resumed" | "failed"> => {
    try {
      await ctx.resume();
      return "resumed";
    } catch (err) {
      debug.log("[updateTranslation] Failed to resume AudioContext", err);
      return "failed";
    }
  })();

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<"timeout">((resolve) => {
    timeoutId = setTimeout(() => resolve("timeout"), RESUME_TIMEOUT_MS);
  });

  const result = await Promise.race([resumePromise, timeoutPromise]);
  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
  }

  if (result === "resumed") {
    debug.log("[updateTranslation] AudioContext resumed");
  } else if (result === "timeout") {
    debug.log("[updateTranslation] AudioContext resume timeout");
  }

  return result;
}

const translationSourceOwners = new WeakMap<object, ActionContext | undefined>();

async function rollbackStaleAppliedSourceIfStillCurrent(
  handler: VideoHandler,
  appliedSourceUrl: string | null,
  actionContext?: ActionContext,
): Promise<void> {
  if (!appliedSourceUrl || !handler.audioPlayer) return;

  const player = handler.audioPlayer.player;
  if (translationSourceOwners.get(player) !== actionContext) return;
  const currentSource = String(player.currentSrc || player.src || "");
  const normalizedCurrentUrl = handler.proxifyAudio(
    handler.unproxifyAudio(currentSource),
  );
  const normalizedAppliedUrl = handler.proxifyAudio(
    handler.unproxifyAudio(appliedSourceUrl),
  );
  if (normalizedCurrentUrl !== normalizedAppliedUrl) return;

  try {
    await player.clear();
    player.src = "";
    debug.log("[updateTranslation] cleared stale partially-applied source");
  } catch (err) {
    debug.log("[updateTranslation] failed to clear stale source", err);
  }
}

export async function handlePlaybackResumedTranslationRefresh(
  this: VideoHandler,
): Promise<void> {
  if (!this.videoData || this.videoData.isStream) {
    return;
  }
  if (
    !this.hasActiveSource() ||
    this.activeTranslation ||
    this.isRefreshingTranslation
  ) {
    return;
  }

  const videoId = this.videoData.videoId;
  if (!videoId) {
    return;
  }

  const normalizedTranslationHelp = normalizeTranslationHelp(
    this.videoData.translationHelp,
  );
  const cacheKey = this.getTranslationCacheKey(
    videoId,
    this.translateFromLang,
    this.translateToLang,
    normalizedTranslationHelp,
  );
  const cachedEntry = this.cacheManager.getTranslation(cacheKey);

  if (!cachedEntry?.url) {
    debug.log(
      "[handlePlaybackResumedTranslationRefresh] translation cache expired after resume, refreshing now",
    );
    await this.refreshTranslationAudio();
  }
}

/** Pauses playback until the translation is ready; returns a listener cleanup. */
export function pauseVideoForTranslation(
  handler: VideoHandler,
): (() => void) | undefined {
  if (!handler.data?.autoPauseOnTranslate) return;
  if (handler.pausedByTranslation) return;
  if (handler.video.paused || handler.video.ended) return;

  debug.log("[translateFunc] Pausing video until translation is ready");
  handler.pausedByTranslation = true;
  const onPlay = () => {
    handler.pausedByTranslation = false;
  };
  handler.video.addEventListener("play", onPlay, { once: true });
  handler.video.pause();
  return () => handler.video.removeEventListener("play", onPlay);
}

function isPageHidden(): boolean {
  return (
    typeof document !== "undefined" && document.visibilityState === "hidden"
  );
}

// `pictureInPictureElement` is undefined in Firefox, so this is always false there.
function isVideoInPictureInPicture(handler: VideoHandler): boolean {
  return (
    typeof document !== "undefined" &&
    document.pictureInPictureElement === handler.video
  );
}

function playVideoAfterTranslation(handler: VideoHandler): void {
  handler.pausedByTranslation = false;
  if (!handler.hasActiveSource()) return;
  debug.log("[translateFunc] Resuming video after translation is ready");
  handler.video.play().catch((playErr) => {
    debug.log("[translateFunc] Failed to resume video", playErr);
  });
}

function deferResumeUntilPageVisible(handler: VideoHandler): void {
  const controller = new AbortController();
  const { signal } = controller;
  const cancel = () => {
    controller.abort();
    if (handler.cancelDeferredTranslationResume === cancel) {
      handler.cancelDeferredTranslationResume = null;
    }
  };
  handler.cancelDeferredTranslationResume = cancel;

  debug.log("[translateFunc] Page is hidden, deferring video resume");
  handler.video.addEventListener(
    "play",
    () => {
      handler.pausedByTranslation = false;
      cancel();
    },
    { signal },
  );
  document.addEventListener(
    "visibilitychange",
    () => {
      if (isPageHidden()) return;
      cancel();
      playVideoAfterTranslation(handler);
    },
    { signal },
  );
}

/** Drops a resume deferred by a hidden page, leaving the video paused. */
export function cancelDeferredTranslationResume(handler: VideoHandler): void {
  if (!handler.cancelDeferredTranslationResume) return;
  handler.cancelDeferredTranslationResume();
  handler.pausedByTranslation = false;
}

/**
 * Resumes playback only if this extension was the one that paused it. A hidden
 * page keeps the video paused until it becomes visible, so translations that
 * finish in background tabs do not start playing on their own.
 */
export function resumeVideoAfterTranslation(handler: VideoHandler): void {
  if (!handler.pausedByTranslation) return;
  handler.cancelDeferredTranslationResume?.();
  if (
    handler.hasActiveSource() &&
    isPageHidden() &&
    !isVideoInPictureInPicture(handler)
  ) {
    deferResumeUntilPageVisible(handler);
    return;
  }
  playVideoAfterTranslation(handler);
}

async function requestApplyAndCacheTranslation(
  self: VideoHandler,
  options: {
    videoData: VideoData;
    requestLang: RequestLang;
    responseLang: ResponseLang;
    translationHelp: VideoData["translationHelp"] | undefined;
    actionContext: ActionContext;
    cacheKey: string;
    cacheVideoId: string;
    cacheRequestLang: string;
    cacheResponseLang: string;
    onBeforeCache?: (result: TranslationAudioResult) => Promise<void> | void;
    onTranslationWaiting?: () => void;
  },
): Promise<TranslationAudioResult | null> {
  const translateRes = await requestTranslationAudio(self.translationHandler, {
    videoData: options.videoData,
    requestLang: options.requestLang,
    responseLang: options.responseLang,
    translationHelp: options.translationHelp,
    useAudioDownload: Boolean(self.data?.useAudioDownload),
    signal: self.actionsAbortController.signal,
    onTranslationWaiting: options.onTranslationWaiting,
  });
  if (!translateRes) return null;

  const updated = await updateTranslationIfFresh({
    url: translateRes.url,
    actionContext: options.actionContext,
    usedLivelyVoice: translateRes.usedLivelyVoice,
    isActionStale: (ctx) => self.isActionStale(ctx),
    updateTranslation: (url, ctx, usedLivelyVoice) =>
      self.updateTranslation(url, ctx, usedLivelyVoice),
  });
  if (!updated) return null;

  if (options.onBeforeCache) {
    await options.onBeforeCache(translateRes);
  }

  setTranslationCacheValue({
    cacheKey: options.cacheKey,
    setTranslation: (key, value) =>
      self.cacheManager.setTranslation(key, value),
    videoId: options.cacheVideoId,
    requestLang: options.cacheRequestLang,
    responseLang: options.cacheResponseLang,
    fallbackUrl: translateRes.url,
    downloadTranslationUrl: self.downloadTranslation?.url,
    usedLivelyVoice: translateRes.usedLivelyVoice,
  });

  return translateRes;
}

export async function refreshTranslationAudio(
  this: VideoHandler,
): Promise<void> {
  if (!this.videoData || this.videoData.isStream) {
    return;
  }
  if (!this.hasActiveSource()) return;
  if (this.isRefreshingTranslation) return;
  const videoId = this.videoData.videoId;
  if (!videoId) return;
  if (this.actionsAbortController?.signal?.aborted) {
    this.resetActionsAbortController("refreshTranslationAudio");
  }
  this.isRefreshingTranslation = true;
  const actionContext: ActionContext = { gen: this.actionsGeneration, videoId };
  const normalizedTranslationHelp = normalizeTranslationHelp(
    this.videoData.translationHelp,
  );
  try {
    await requestApplyAndCacheTranslation(this, {
      videoData: this.videoData,
      requestLang: this.translateFromLang,
      responseLang: this.translateToLang,
      translationHelp: normalizedTranslationHelp,
      actionContext,
      cacheKey: this.getTranslationCacheKey(
        videoId,
        this.translateFromLang,
        this.translateToLang,
        normalizedTranslationHelp,
      ),
      cacheVideoId: videoId,
      cacheRequestLang: this.translateFromLang,
      cacheResponseLang: this.translateToLang,
    });
  } finally {
    this.isRefreshingTranslation = false;
  }
}

export function proxifyAudio(this: VideoHandler, audioUrl: string): string {
  const proxiedAudioUrl = proxifyYandexAudioUrl(audioUrl, {
    translateProxyEnabled: this.data?.translateProxyEnabled,
    proxyWorkerHost: this.data?.proxyWorkerHost,
  });
  if (proxiedAudioUrl !== audioUrl) {
    debug.log(`Audio proxied via ${proxiedAudioUrl}`);
  }
  return proxiedAudioUrl;
}

export function unproxifyAudio(this: VideoHandler, audioUrl: string): string {
  return unproxifyYandexAudioUrl(audioUrl);
}

export async function handleProxySettingsChanged(
  this: VideoHandler,
  reason = "proxySettingsChanged",
) {
  debug.log(`${reason}: clearing translation/subtitles cache`);
  try {
    this.cacheManager.clear();
    this.activeTranslation = null;
  } catch {
    // ignore
  }

  try {
    await this.stopTranslation();
  } catch {
    // ignore
  }

  await this.initVOTClient();
}

export function isMultiMethodS3(this: VideoHandler, url: string): boolean {
  return isYandexAudioUrlOrProxy(url, {
    proxyWorkerHost: this.data?.proxyWorkerHost,
  });
}

function normalizeManagedAudioUrl(handler: VideoHandler, url: string): string {
  return handler.proxifyAudio(handler.unproxifyAudio(url));
}

async function applyTranslationSource(
  handler: VideoHandler,
  sourceUrl: string,
  actionContext?: ActionContext,
): Promise<ApplyTranslationSourceResult> {
  const currentSrc = handler.audioPlayer.player.src;
  const didSetSource = currentSrc !== sourceUrl;
  translationSourceOwners.set(handler.audioPlayer.player, actionContext);
  let appliedSourceUrl: string | null = null;

  if (didSetSource) {
    handler.audioPlayer.player.src = sourceUrl;
    appliedSourceUrl = sourceUrl;
  }

  try {
    if (didSetSource) {
      await handler.audioPlayer.init();
    }
    if (handler.isActionStale(actionContext)) {
      await rollbackStaleAppliedSourceIfStillCurrent(
        handler,
        appliedSourceUrl,
        actionContext,
      );
      return {
        status: "stale",
        didSetSource,
        appliedSourceUrl,
      };
    }

    const resumeResult = await resumePlayerAudioContextIfNeeded(handler);
    if (resumeResult === "timeout") {
      debug.log(
        "[updateTranslation] continuing after AudioContext resume timeout",
      );
    } else if (resumeResult === "failed") {
      debug.log(
        "[updateTranslation] AudioContext resume failed, continue without deferred resume",
      );
    }

    if (handler.isActionStale(actionContext)) {
      await rollbackStaleAppliedSourceIfStillCurrent(
        handler,
        appliedSourceUrl,
        actionContext,
      );
      return {
        status: "stale",
        didSetSource,
        appliedSourceUrl,
      };
    }

    if (!handler.video.paused && handler.audioPlayer.player.src) {
      handler.audioPlayer.player.lipSync("play");
    }

    return {
      status: "success",
      didSetSource,
      appliedSourceUrl,
    };
  } catch (error: unknown) {
    return {
      status: "error",
      didSetSource,
      appliedSourceUrl,
      error,
    };
  }
}

function getTranslationActiveVoiceLabel(usedLivelyVoice?: boolean): string {
  return t(usedLivelyVoice ? "VOTLiveVoicesTitle" : "VOTStandardVoicesTitle");
}

export async function updateTranslation(
  this: VideoHandler,
  audioUrl: string,
  actionContext?: ActionContext,
  usedLivelyVoice = this.data?.useLivelyVoice !== false,
): Promise<void> {
  await this.waitForPendingStopTranslate();
  if (this.isActionStale(actionContext)) return;
  if (!this.audioPlayer) {
    this.createPlayer();
  }
  if (this.audioPlayer.audioContext?.state === "closed") {
    debug.log("[updateTranslation] AudioContext is closed, recreating player");
    this.createPlayer();
  }

  const normalizedTargetUrl = normalizeManagedAudioUrl(this, audioUrl);
  if (this.isActionStale(actionContext)) return;
  const resolvedSource = await applyTranslationWithDirectFallback(
    this,
    normalizedTargetUrl,
    actionContext,
  );
  const resolvedAudioUrl = resolvedSource.nextAudioUrl;
  const applyResult = resolvedSource.applyResult;
  const appliedSourceUrl = applyResult.appliedSourceUrl;

  if (applyResult.status === "stale") return;

  if (applyResult.status === "error") {
    debug.log("this.audioPlayer.init() error", applyResult.error);
    await rollbackStaleAppliedSourceIfStillCurrent(
      this,
      appliedSourceUrl,
      actionContext,
    );
    captureException(applyResult.error, {
      source: "audio",
      operation: "loadTranslationAudio",
      dedupeKey: this.videoData?.videoId,
      // The message can embed the (proxied) audio url.
      redactedMessage: "Translation audio failed to load",
      tags: {
        ...getTranslationTags(this),
        ...getAudioFailureTags(applyResult.error, "playback"),
      },
    });
    const msg = toErrorMessage(applyResult.error);
    this.transformBtn("error", msg);
    return;
  }

  this.clearVolumeLinkState();
  this.setupAudioSettings();
  this.transformBtn("success", getTranslationActiveVoiceLabel(usedLivelyVoice));
  this.afterUpdateTranslation(resolvedAudioUrl);
}

export function syncTranslationPlaybackVolume(this: VideoHandler): void {
  const player = this.audioPlayer?.player;
  const overlayViewControls =
    this.uiManager.votOverlayView?.overlayViewControls;
  const nextVolume = overlayViewControls?.getTranslationVolume();
  applyTranslationPlaybackVolume(player, nextVolume, this.data?.defaultVolume);
}

async function applyTranslationWithDirectFallback(
  handler: VideoHandler,
  audioUrl: string,
  actionContext?: ActionContext,
): Promise<{
  nextAudioUrl: string;
  applyResult: Awaited<ReturnType<typeof applyTranslationSource>>;
}> {
  const nextAudioUrl = audioUrl;
  const applyResult = await applyTranslationSource(
    handler,
    nextAudioUrl,
    actionContext,
  );

  if (
    !shouldRetryTranslationSource(
      handler,
      applyResult,
      actionContext,
      nextAudioUrl,
    )
  ) {
    return { nextAudioUrl, applyResult };
  }

  const retried = await retryTranslationWithDirectSource(
    handler,
    nextAudioUrl,
    applyResult.appliedSourceUrl,
    actionContext,
  );

  if (retried) {
    return retried;
  }

  return { nextAudioUrl, applyResult };
}

function shouldRetryTranslationSource(
  handler: VideoHandler,
  applyResult: Awaited<ReturnType<typeof applyTranslationSource>>,
  actionContext: ActionContext | undefined,
  audioUrl: string,
): boolean {
  return (
    applyResult.status === "error" &&
    applyResult.didSetSource &&
    !handler.isActionStale(actionContext) &&
    handler.unproxifyAudio(audioUrl) !== audioUrl
  );
}

async function retryTranslationWithDirectSource(
  handler: VideoHandler,
  audioUrl: string,
  appliedSourceUrl: string,
  actionContext?: ActionContext,
): Promise<
  | {
      nextAudioUrl: string;
      applyResult: Awaited<ReturnType<typeof applyTranslationSource>>;
    }
  | undefined
> {
  const directUrl = handler.unproxifyAudio(audioUrl);
  debug.log(
    "[updateTranslation] proxied audio init failed, retrying direct URL",
  );

  try {
    if (handler.isActionStale(actionContext)) {
      await rollbackStaleAppliedSourceIfStillCurrent(
        handler,
        appliedSourceUrl,
        actionContext,
      );
      return {
        nextAudioUrl: directUrl,
        applyResult: {
          status: "stale",
          didSetSource: true,
          appliedSourceUrl,
        },
      };
    }

    return {
      nextAudioUrl: directUrl,
      applyResult: await applyTranslationSource(
        handler,
        directUrl,
        actionContext,
      ),
    };
  } catch (fallbackErr) {
    return {
      nextAudioUrl: audioUrl,
      applyResult: {
        status: "error",
        didSetSource: true,
        appliedSourceUrl,
        error: fallbackErr,
      },
    };
  }
}

export async function translateFunc(
  this: VideoHandler,
  VIDEO_ID: string,
  _isStream: boolean,
  requestLang: string,
  responseLang: string,
  translationHelp?: VideoData["translationHelp"],
): Promise<void> {
  await this.waitForPendingStopTranslate();
  debug.log("Run videoValidator");
  await this.videoValidator();

  if (this.actionsAbortController?.signal?.aborted) {
    this.resetActionsAbortController("translateFunc");
  }
  const overlayView = this.uiManager.votOverlayView;
  if (!overlayView?.overlayViewControls) {
    debug.log("[translateFunc] Overlay view missing, skipping translation");
    return;
  }
  overlayView.overlayViewControls.setIsLoading(true);
  this.volumeOnStart = this.getVideoVolume();
  if (!VIDEO_ID) {
    debug.log("Skip translation - no VIDEO_ID resolved yet");
    await this.updateTranslationErrorMsg(
      new VOTLocalizedError("VOTNoVideoIDFound"),
      this.actionsAbortController.signal,
    );
    return;
  }
  const videoData = this.videoData;
  if (!videoData) {
    await this.updateTranslationErrorMsg(
      new VOTLocalizedError("VOTNoVideoIDFound"),
      this.actionsAbortController.signal,
    );
    return;
  }
  const normalizedTranslationHelp = normalizeTranslationHelp(translationHelp);
  const cacheKey = this.getTranslationCacheKey(
    VIDEO_ID,
    requestLang,
    responseLang,
    normalizedTranslationHelp,
  );
  const activeKey = `video_${cacheKey}`;

  if (this.activeTranslation?.key === activeKey) {
    debug.log("[translateFunc] Reusing in-flight translation");
    await this.activeTranslation.promise;
    return;
  }

  // Reset only for a new request: a re-entry that joins the in-flight one
  // (e.g. after returning to the tab) must keep its wait state for the notification.
  this.hadAsyncWait = false;

  const actionContext: ActionContext = {
    gen: this.actionsGeneration,
    videoId: VIDEO_ID,
  };

  // Set when auto-pause actually attached a "play" listener; cleaned up in
  // `finally` so a rejected programmatic resume cannot leave it dangling.
  let cleanupPauseListener: (() => void) | undefined;

  const translationPromise = (async () => {
    if (this.isActionStale(actionContext)) {
      debug.log("[translateFunc] Stale translation task - skipping");
      return;
    }
    const reqLang = requestLang as RequestLang;
    const resLang = responseLang as ResponseLang;
    const applyTranslationUrl = async (
      url: string,
      usedLivelyVoice?: boolean,
    ) => await this.updateTranslation(url, actionContext, usedLivelyVoice);
    const cachedEntry = this.cacheManager.getTranslation(cacheKey);
    if (cachedEntry?.url) {
      const applied = await withStaleGuard(
        actionContext,
        (ctx) => this.isActionStale(ctx),
        () => applyTranslationUrl(cachedEntry.url, cachedEntry.useLivelyVoice),
      );
      if (!applied) return;
      debug.log("[translateFunc] Cached translation was received");
      return;
    }

    const translateRes = await requestApplyAndCacheTranslation(this, {
      videoData,
      requestLang: reqLang,
      responseLang: resLang,
      translationHelp: normalizedTranslationHelp,
      actionContext,
      cacheKey,
      cacheVideoId: VIDEO_ID,
      cacheRequestLang: requestLang,
      cacheResponseLang: responseLang,
      onTranslationWaiting: () => {
        cleanupPauseListener = pauseVideoForTranslation(this);
      },
      onBeforeCache: () => {
        const preferredSubtitleLanguage = this.getPreferredSubtitlesLanguage(
          videoData.detectedLanguage,
          videoData.responseLanguage,
        );
        if (!preferredSubtitleLanguage) {
          return;
        }
        const subsCacheKey = this.videoData
          ? this.getSubtitlesCacheKey(
              VIDEO_ID,
              this.videoData.detectedLanguage,
              preferredSubtitleLanguage,
            )
          : null;
        const cachedSubs = subsCacheKey
          ? this.cacheManager.getSubtitles(subsCacheKey)
          : null;
        const hasMatchingSubtitle =
          Array.isArray(cachedSubs) &&
          pickBestSubtitlesIndex(
            getIndexedSubtitleDescriptors(cachedSubs),
            videoData.detectedLanguage,
            preferredSubtitleLanguage,
          ) != null;
        if (!hasMatchingSubtitle) {
          if (subsCacheKey) this.cacheManager.deleteSubtitles(subsCacheKey);
          this.subtitles = [];
          this.subtitlesCacheKey = null;
        }
      },
    });

    debug.log("[translateRes]", translateRes);

    if (!translateRes) {
      debug.log("Skip translation");
    }
  })();

  this.activeTranslation = {
    key: activeKey,
    promise: translationPromise,
  };

  try {
    return await translationPromise;
  } catch (err) {
    captureException(err, {
      source: "playback",
      operation: "translateFunc",
      dedupeKey: VIDEO_ID,
      tags: getTranslationTags(this, { from: requestLang, to: responseLang }),
    });
    this.hadAsyncWait = notifyTranslationFailureIfNeeded({
      aborted: this.actionsAbortController.signal.aborted,
      translateApiErrorsEnabled: Boolean(this.data?.translateAPIErrors),
      hadAsyncWait: this.hadAsyncWait,
      videoId: VIDEO_ID,
      error: err,
      notify: (params) => this.notifier.translationFailed(params),
    });
    throw err;
  } finally {
    if (this.activeTranslation?.promise === translationPromise) {
      this.activeTranslation = null;
    }
    if (!this.activeTranslation) {
      cleanupPauseListener?.();
      resumeVideoAfterTranslation(this);
    }

    const isLoading =
      this.uiManager.votOverlayView.overlayViewControls?.getIsLoading();
    if (!this.activeTranslation && isLoading && !this.hasActiveSource()) {
      debug.log("[translateFunc] clearing stale loading state");
      this.transformBtn("none", t("translateVideo"));
    }
  }
}

export function isYouTubeHosts(this: VideoHandler) {
  return isTranslationDownloadHost(this.site.host);
}
