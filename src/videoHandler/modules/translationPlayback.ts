import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";

import { isTranslationDownloadHost } from "../../core/hostPolicies";
import type { VideoHandler } from "../../index";
import { localizationProvider } from "../../localization/localizationProvider";
import debug from "../../utils/debug";
import { toErrorMessage } from "../../utils/errors";
import { GM_fetch } from "../../utils/gm";
import { applyTranslationPlaybackVolume } from "../../utils/translationVolume";
import VOTLocalizedError from "../../utils/VOTLocalizedError";
import type { VideoData } from "../shared";
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
  notifyTranslationFailureIfNeeded,
  requestAndApplyTranslation,
  setTranslationCacheValue,
  type TranslationAudioResult,
} from "./translationShared";
import type {
  ActionContext,
  ApplyTranslationSourceResult,
} from "./translationTypes";

const AUDIO_PROBE_TIMEOUT_MS = 5_000;
const AUDIO_PROBE_RETRY_DELAY_MS = 150;
const AUDIO_PROBE_MAX_ATTEMPTS = 2;

async function resumePlayerAudioContextIfNeeded(
  handler: VideoHandler,
): Promise<"not-needed" | "resumed" | "timeout" | "failed"> {
  const ctx = handler.audioPlayer?.audioContext;
  if (!ctx || ctx.state !== "suspended") return "not-needed";

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

async function rollbackStaleAppliedSourceIfStillCurrent(
  handler: VideoHandler,
  appliedSourceUrl: string | null,
): Promise<void> {
  if (!appliedSourceUrl || !handler.audioPlayer) return;

  const player = handler.audioPlayer.player;
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

function waitForProbeRetry(
  delayMs: number,
  signal: AbortSignal,
): Promise<void> {
  if (delayMs <= 0 || signal.aborted) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);

    const onAbort = () => {
      clearTimeout(timeoutId);
      signal.removeEventListener("abort", onAbort);
      resolve();
    };

    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function probeAudioUrl(
  handler: VideoHandler,
  audioUrl: string,
  actionContext?: ActionContext,
): Promise<boolean> {
  const signal = handler.actionsAbortController.signal;
  const fetchOpts = {
    headers: {
      range: "bytes=0-0",
    },
    signal,
    timeout: AUDIO_PROBE_TIMEOUT_MS,
  };

  for (let attempt = 1; attempt <= AUDIO_PROBE_MAX_ATTEMPTS; attempt++) {
    if (isProbeCancelled(handler, actionContext, signal)) return false;
    try {
      const response = await GM_fetch(audioUrl, fetchOpts);
      if (isProbeCancelled(handler, actionContext, signal)) return false;
      debug.log("[validateAudioUrl] probe response", {
        audioUrl,
        attempt,
        ok: response.ok,
        status: response.status,
      });
      if (response.ok) return true;
    } catch (err: unknown) {
      if (isProbeCancelled(handler, actionContext, signal)) return false;
      debug.log("[validateAudioUrl] probe error", { audioUrl, attempt, err });
    }

    if (
      !(await shouldRetryAudioProbe(attempt, handler, actionContext, signal))
    ) {
      return false;
    }
  }

  return false;
}

function isProbeCancelled(
  handler: VideoHandler,
  actionContext: ActionContext | undefined,
  signal: AbortSignal,
): boolean {
  return handler.isActionStale(actionContext) || signal.aborted;
}

async function shouldRetryAudioProbe(
  attempt: number,
  handler: VideoHandler,
  actionContext: ActionContext | undefined,
  signal: AbortSignal,
): Promise<boolean> {
  if (attempt >= AUDIO_PROBE_MAX_ATTEMPTS) {
    return true;
  }
  if (isProbeCancelled(handler, actionContext, signal)) {
    return false;
  }

  await waitForProbeRetry(AUDIO_PROBE_RETRY_DELAY_MS, signal);
  return !isProbeCancelled(handler, actionContext, signal);
}

export async function validateAudioUrl(
  this: VideoHandler,
  audioUrl: string,
  actionContext?: ActionContext,
): Promise<string> {
  if (this.isActionStale(actionContext)) return audioUrl;

  const isPrimaryUrlValid = await probeAudioUrl(this, audioUrl, actionContext);
  if (isPrimaryUrlValid) {
    return audioUrl;
  }

  const directUrl = this.unproxifyAudio(audioUrl);
  if (directUrl !== audioUrl) {
    const isDirectUrlValid = await probeAudioUrl(
      this,
      directUrl,
      actionContext,
    );
    if (isDirectUrlValid) {
      debug.log("[validateAudioUrl] switching to direct audio URL after probe");
      return directUrl;
    }
  }

  return audioUrl;
}

export function scheduleTranslationRefresh(this: VideoHandler): void {
  if (!this.videoData || this.videoData.isStream) {
    return;
  }
  if (!this.hasActiveSource()) return;
  void this.refreshTranslationAudio().catch((error) => {
    debug.log("[scheduleTranslationRefresh] refresh failed", error);
  });
}

export async function handlePlaybackResumedTranslationRefresh(
  this: VideoHandler,
): Promise<void> {
  if (!this.videoData || this.videoData.isStream) {
    return;
  }
  if (!this.hasActiveSource()) {
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
      "[scheduleTranslationRefresh] translation cache expired after resume, refreshing now",
    );
    await this.refreshTranslationAudio();
  }
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
  },
): Promise<TranslationAudioResult | null> {
  const translateRes = await requestAndApplyTranslation({
    requester: self.translationHandler,
    request: {
      videoData: options.videoData,
      requestLang: options.requestLang,
      responseLang: options.responseLang,
      translationHelp: options.translationHelp,
      useAudioDownload: Boolean(self.data?.useAudioDownload),
      signal: self.actionsAbortController.signal,
    },
    actionContext: options.actionContext,
    isActionStale: (ctx) => self.isActionStale(ctx),
    updateTranslation: (url, ctx) => self.updateTranslation(url, ctx),
  });
  if (!translateRes) return null;

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
    downloadTranslationUrl: self.downloadTranslationUrl,
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
    const translateRes = await requestApplyAndCacheTranslation(this, {
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
    if (!translateRes) return;
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
    debug.log(`[VOT] Audio proxied via ${proxiedAudioUrl}`);
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
  debug.log(`[VOT] ${reason}: clearing translation/subtitles cache`);
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
      await rollbackStaleAppliedSourceIfStillCurrent(handler, appliedSourceUrl);
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
      await rollbackStaleAppliedSourceIfStillCurrent(handler, appliedSourceUrl);
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

export async function updateTranslation(
  this: VideoHandler,
  audioUrl: string,
  actionContext?: ActionContext,
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
  const currentSource =
    this.audioPlayer.player.currentSrc || this.audioPlayer.player.src || "";
  const normalizedCurrentUrl = normalizeManagedAudioUrl(this, currentSource);

  const nextAudioUrl =
    normalizedTargetUrl !== normalizedCurrentUrl
      ? await this.validateAudioUrl(normalizedTargetUrl, actionContext)
      : normalizedTargetUrl;
  if (this.isActionStale(actionContext)) return;
  const resolvedSource = await applyTranslationWithDirectFallback(
    this,
    nextAudioUrl,
    actionContext,
  );
  const resolvedAudioUrl = resolvedSource.nextAudioUrl;
  const applyResult = resolvedSource.applyResult;
  const appliedSourceUrl = applyResult.appliedSourceUrl;

  if (applyResult.status === "stale") return;

  if (applyResult.status === "error") {
    debug.log("this.audioPlayer.init() error", applyResult.error);
    await rollbackStaleAppliedSourceIfStillCurrent(this, appliedSourceUrl);
    const msg = toErrorMessage(applyResult.error);
    this.transformBtn("error", msg);
    return;
  }

  this.clearVolumeLinkState();
  this.setupAudioSettings();
  this.transformBtn("success", localizationProvider.get("disableTranslate"));
  this.afterUpdateTranslation(resolvedAudioUrl);
}

export function syncTranslationPlaybackVolume(this: VideoHandler): void {
  const player = this.audioPlayer?.player;
  const overlayView = this.uiManager.votOverlayView;
  const nextVolume = overlayView?.translationVolumeSlider?.value;
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
    const validatedDirectUrl = await handler.validateAudioUrl(
      directUrl,
      actionContext,
    );
    if (handler.isActionStale(actionContext)) {
      await rollbackStaleAppliedSourceIfStillCurrent(handler, appliedSourceUrl);
      return {
        nextAudioUrl: validatedDirectUrl,
        applyResult: {
          status: "stale",
          didSetSource: true,
          appliedSourceUrl,
        },
      };
    }

    return {
      nextAudioUrl: validatedDirectUrl,
      applyResult: await applyTranslationSource(
        handler,
        validatedDirectUrl,
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
  if (!overlayView?.votButton) {
    debug.log("[translateFunc] Overlay view missing, skipping translation");
    return;
  }
  overlayView.votButton.loading = true;
  this.hadAsyncWait = false;
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

  const actionContext: ActionContext = {
    gen: this.actionsGeneration,
    videoId: VIDEO_ID,
  };

  const translationPromise = (async () => {
    if (this.isActionStale(actionContext)) {
      debug.log("[translateFunc] Stale translation task - skipping");
      return;
    }
    const reqLang = requestLang as RequestLang;
    const resLang = responseLang as ResponseLang;
    const applyTranslationUrl = async (url: string) =>
      await this.updateTranslation(url, actionContext);
    const cachedEntry = this.cacheManager.getTranslation(cacheKey);
    if (cachedEntry?.url) {
      await applyTranslationUrl(cachedEntry.url);
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
      onBeforeCache: async () => {
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
    const overlayBtn = this.uiManager.votOverlayView?.votButton;
    if (
      !this.activeTranslation &&
      overlayBtn?.loading &&
      !this.hasActiveSource()
    ) {
      debug.log("[translateFunc] clearing stale loading state");
      this.transformBtn("none", localizationProvider.get("translateVideo"));
    }
  }
}

export function isYouTubeHosts(this: VideoHandler) {
  return isTranslationDownloadHost(this.site.host);
}
