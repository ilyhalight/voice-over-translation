import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";
import { defaultAutoVolume } from "../../config/config";
import { YANDEX_TTL_MS } from "../../core/cacheManager";
import { isTranslationDownloadHost } from "../../core/hostPolicies";
import type { VideoHandler } from "../../index";
import { localizationProvider } from "../../localization/localizationProvider";
import debug from "../../utils/debug";
import { GM_fetch } from "../../utils/gm";
import { clamp } from "../../utils/utils";
import VOTLocalizedError from "../../utils/VOTLocalizedError";
import type { VideoData } from "../shared";
import {
  computeSmartDuckingStep,
  initSmartDuckingRuntime,
  resetSmartDuckingRuntime,
  SMART_DUCKING_DEFAULT_CONFIG,
  type SmartDuckingRuntime,
} from "./ducking";
import {
  isYandexAudioUrlOrProxy,
  proxifyYandexAudioUrl,
  unproxifyYandexAudioUrl,
} from "./proxyShared";
import {
  normalizeTranslationHelp,
  notifyTranslationFailureIfNeeded,
  requestAndApplyTranslation,
  requestTranslationAudio,
  setTranslationCacheValue,
  type TranslationAudioResult,
  updateTranslationAndSchedule,
} from "./translationShared";

type StopSmartVolumeDuckingOptions = {
  /**
   * Restores the video volume to this value (0..1) before resetting state.
   *
   * When omitted, we restore to the last known baseline (but only if we were
   * actively ducked).
   */
  restoreVolume?: number;
};

type AudioPlayerLike = {
  getAudioRms?: () => number | undefined;
  analyser?: AnalyserNode;
  analyserFloatData?: Float32Array<ArrayBuffer>;
  analyserData?: Uint8Array<ArrayBuffer>;
  getMediaElement?: () => HTMLMediaElement | undefined;
  audio?: HTMLMediaElement;
  audioElement?: HTMLMediaElement;
};

function readSmartDuckingRuntime(handler: VideoHandler): SmartDuckingRuntime {
  return {
    isDucked: handler.smartVolumeIsDucked,
    speechGateOpen: handler.smartVolumeSpeechGateOpen,
    rmsEnvelope: handler.smartVolumeRmsEnvelope,
    baseline: handler.smartVolumeDuckingBaseline,
    lastApplied: handler.smartVolumeLastApplied,
    lastTickAt: handler.smartVolumeLastTickAt,
    lastSoundAt: handler.smartVolumeLastSoundAt,
    rmsMissingSinceAt: handler.smartVolumeRmsMissingSinceAt,
  };
}

function writeSmartDuckingRuntime(
  handler: VideoHandler,
  runtime: SmartDuckingRuntime,
): void {
  handler.smartVolumeIsDucked = runtime.isDucked;
  handler.smartVolumeSpeechGateOpen = runtime.speechGateOpen;
  handler.smartVolumeRmsEnvelope = runtime.rmsEnvelope;
  handler.smartVolumeDuckingBaseline = runtime.baseline;
  handler.smartVolumeLastApplied = runtime.lastApplied;
  handler.smartVolumeLastTickAt = runtime.lastTickAt;
  handler.smartVolumeLastSoundAt = runtime.lastSoundAt;
  handler.smartVolumeRmsMissingSinceAt = runtime.rmsMissingSinceAt;
}

/**
 * Stops Smart Auto-Volume ducking (if running), optionally restores volume,
 * and resets all ducking-related state.
 */
export function stopSmartVolumeDucking(
  handler: VideoHandler,
  options: StopSmartVolumeDuckingOptions = {},
): void {
  const { restoreVolume } = options;

  if (typeof handler.smartVolumeDuckingInterval === "number") {
    clearInterval(handler.smartVolumeDuckingInterval);
    handler.smartVolumeDuckingInterval = undefined;
  }

  const baseline =
    typeof restoreVolume === "number"
      ? restoreVolume
      : (handler.smartVolumeDuckingBaseline ?? handler.volumeOnStart);

  // Restore only when:
  // - an explicit restoreVolume was requested, OR
  // - we were ducked and have a remembered baseline.
  if (
    typeof baseline === "number" &&
    (typeof restoreVolume === "number" || handler.smartVolumeIsDucked)
  ) {
    try {
      handler.setVideoVolume(baseline);
    } catch {
      // ignore
    }
  }
  writeSmartDuckingRuntime(handler, resetSmartDuckingRuntime());
}

function startSmartVolumeDucking(handler: VideoHandler): void {
  if (typeof globalThis === "undefined") return;
  if (typeof handler.smartVolumeDuckingInterval === "number") return;

  writeSmartDuckingRuntime(
    handler,
    initSmartDuckingRuntime(handler.getVideoVolume()),
  );

  handler.smartVolumeDuckingInterval = globalThis.setInterval(() => {
    smartDuckingTick(handler);
  }, SMART_DUCKING_DEFAULT_CONFIG.tickMs);
}

function getTranslatedAudioRms(this: VideoHandler): number | undefined {
  const player = this.audioPlayer?.player as unknown as
    | AudioPlayerLike
    | undefined;

  // Preferred: use the helper implemented in chaimu (if available).
  const rms = player?.getAudioRms?.();
  if (typeof rms === "number" && Number.isFinite(rms)) return rms;

  // Fallback: if the analyser is present (older builds might still expose it),
  // compute RMS here.
  const analyser: AnalyserNode | undefined = player?.analyser;
  if (!analyser) return undefined;

  try {
    // Use float time-domain data when available (avoids 8-bit quantization).
    if (typeof analyser.getFloatTimeDomainData === "function") {
      let floatData = player?.analyserFloatData;

      if (floatData?.length !== analyser.fftSize) {
        floatData = new Float32Array(analyser.fftSize);
        player.analyserFloatData = floatData;
      }

      analyser.getFloatTimeDomainData(floatData);

      let sum = 0;
      for (const value of floatData) {
        sum += value * value;
      }
      return Math.sqrt(sum / floatData.length);
    }

    // Byte fallback.
    // TS 5.9+ types `Uint8Array` with a generic ArrayBuffer type parameter. WebAudio's
    // `getByteTimeDomainData` expects a Uint8Array; the underlying buffer type does not
    // matter for our usage, so we cast for compatibility.
    let data = player?.analyserData;

    if (data?.length !== analyser.fftSize) {
      data = new Uint8Array(analyser.fftSize);
      player.analyserData = data;
    }

    analyser.getByteTimeDomainData(data);

    let sum = 0;
    for (const rawValue of data) {
      const normalizedValue = (rawValue - 128) / 128;
      sum += normalizedValue * normalizedValue;
    }
    return Math.sqrt(sum / data.length);
  } catch {
    return undefined;
  }
}

function smartDuckingTick(handler: VideoHandler): void {
  const player = handler.audioPlayer?.player as unknown as
    | AudioPlayerLike
    | undefined;
  const media: HTMLMediaElement | undefined =
    player?.getMediaElement?.() ??
    // Legacy fallbacks
    player?.audio ??
    player?.audioElement;

  const audioIsPlaying =
    !!media &&
    !media.paused &&
    !media.muted &&
    // Treat near-zero volume as inactive.
    (media.volume ?? 1) > 0.001;

  const now =
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
  const currentVideoVolume = handler.getVideoVolume();

  const hostVideo = handler.video;
  const hostVideoActive = !(hostVideo && (hostVideo.paused || hostVideo.ended));
  const dynamicDuckingTarget =
    clamp(handler.data?.autoVolume ?? defaultAutoVolume, 0, 100) / 100;
  handler.smartVolumeDuckingTarget = dynamicDuckingTarget;

  const decision = computeSmartDuckingStep(
    {
      nowMs: now,
      translationActive: handler.hasActiveSource(),
      enabledAutoVolume: Boolean(handler.data?.enabledAutoVolume),
      smartEnabled: handler.data?.enabledSmartDucking ?? true,
      audioIsPlaying,
      rms: audioIsPlaying ? getTranslatedAudioRms.call(handler) : 0,
      currentVideoVolume,
      hostVideoActive,
      duckingTarget01: dynamicDuckingTarget,
      volumeOnStart: handler.volumeOnStart,
    },
    readSmartDuckingRuntime(handler),
    SMART_DUCKING_DEFAULT_CONFIG,
  );

  switch (decision.kind) {
    case "stop":
      stopSmartVolumeDucking(handler, {
        restoreVolume: decision.restoreVolume,
      });
      return;
    case "apply":
      handler.setVideoVolume(decision.volume01);
      writeSmartDuckingRuntime(handler, decision.runtime);
      return;
    case "noop":
      writeSmartDuckingRuntime(handler, decision.runtime);
      return;
    default: {
      const exhaustiveCheck: never = decision;
      void exhaustiveCheck;
      throw new TypeError("Unhandled smart ducking decision");
    }
  }
}

export async function validateAudioUrl(
  this: VideoHandler,
  audioUrl: string,
  actionContext?: { gen: number; videoId: string },
): Promise<string> {
  if (this.isActionStale(actionContext)) return audioUrl;
  try {
    const fetchOpts = this.isMultiMethodS3(audioUrl)
      ? {
          method: "HEAD",
        }
      : {
          // some s3 don't support the same signature for different methods
          headers: {
            range: "bytes=0-0",
          },
        };
    const response = await GM_fetch(audioUrl, fetchOpts);
    if (this.isActionStale(actionContext)) return audioUrl;
    debug.log("Test audio response", response);
    if (response.ok) {
      debug.log("Valid audioUrl", audioUrl);
      return audioUrl;
    }
    debug.log("Yandex returned not valid audio, trying to fix...");
    if (!this.videoData) {
      debug.log("Skip audio fix - videoData is not available");
      return audioUrl;
    }
    if (this.isActionStale(actionContext)) return audioUrl;
    const fromLang = this.videoData.detectedLanguage || this.translateFromLang;
    const translateRes = await requestTranslationAudio(
      this.translationHandler,
      {
        videoData: this.videoData,
        requestLang: fromLang as RequestLang,
        responseLang: this.translateToLang,
        translationHelp: this.videoData.translationHelp,
        useAudioDownload: Boolean(this.data?.useAudioDownload),
        signal: this.actionsAbortController.signal,
      },
    );
    if (!translateRes) {
      debug.log("Failed to retranslate audio - using original url");
      return audioUrl;
    }
    this.setSelectMenuValues(
      this.videoData.detectedLanguage,
      this.videoData.responseLanguage,
    );
    this.scheduleTranslationRefresh();
    audioUrl = translateRes.url;
    debug.log("Fixed audio audioUrl", audioUrl);
  } catch (err: unknown) {
    debug.log("Test audio error:", err);
  }
  return audioUrl;
}

export function scheduleTranslationRefresh(this: VideoHandler): void {
  if (!this.videoData || this.videoData.isStream) {
    return;
  }
  if (!this.hasActiveSource()) return;
  clearTimeout(this.translationRefreshTimeout);
  const refreshDelayMs = Math.max(30_000, YANDEX_TTL_MS - 5 * 60 * 1000);
  this.translationRefreshTimeout = setTimeout(() => {
    this.refreshTranslationAudio().catch((error) => {
      debug.log("[scheduleTranslationRefresh] refresh failed", error);
    });
  }, refreshDelayMs);
}

async function requestApplyAndCacheTranslation(
  self: VideoHandler,
  options: {
    videoData: VideoData;
    requestLang: RequestLang;
    responseLang: ResponseLang;
    translationHelp: VideoData["translationHelp"] | undefined;
    actionContext: { gen: number; videoId: string };
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
    scheduleTranslationRefresh: () => self.scheduleTranslationRefresh(),
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
  const actionContext = { gen: this.actionsGeneration, videoId };
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
  try {
    debug.log(`[VOT] ${reason}: clearing translation cache`);
    this.cacheManager.clear();
    this.activeTranslation = null;
  } catch {
    // ignore
  }

  // Cancel any in-flight requests so a new attempt can start cleanly.
  try {
    this.resetActionsAbortController(reason);
  } catch {
    // ignore
  }

  // If we're currently playing a translated audio track (non-stream),
  // re-apply the proxy mapping and re-validate the URL.
  try {
    if (this.videoData?.isStream) {
      return;
    }

    const current =
      this.downloadTranslationUrl ||
      this.audioPlayer?.player?.currentSrc ||
      this.audioPlayer?.player?.src;

    if (!current) return;

    await this.updateTranslation(this.unproxifyAudio(current));
  } catch (err) {
    debug.log(`[VOT] ${reason}: failed to refresh active audio`, err);
  }
}

export function isMultiMethodS3(this: VideoHandler, url: string): boolean {
  return isYandexAudioUrlOrProxy(url, {
    proxyWorkerHost: this.data?.proxyWorkerHost,
  });
}

export async function updateTranslation(
  this: VideoHandler,
  audioUrl: string,
  actionContext?: { gen: number; videoId: string },
): Promise<void> {
  if (this.isActionStale(actionContext)) return;
  if (!this.audioPlayer) {
    this.createPlayer();
  }
  const normalizedTargetUrl = this.proxifyAudio(this.unproxifyAudio(audioUrl));
  const currentSource =
    this.audioPlayer.player.currentSrc || this.audioPlayer.player.src || "";
  const normalizedCurrentUrl = this.proxifyAudio(
    this.unproxifyAudio(currentSource),
  );

  let nextAudioUrl = normalizedTargetUrl;
  if (normalizedTargetUrl !== normalizedCurrentUrl) {
    nextAudioUrl = await this.validateAudioUrl(
      normalizedTargetUrl,
      actionContext,
    );
  }
  if (this.isActionStale(actionContext)) return;
  const shouldInitPlayer = this.audioPlayer.player.src !== nextAudioUrl;
  if (shouldInitPlayer) {
    this.audioPlayer.player.src = nextAudioUrl;
  }
  try {
    if (shouldInitPlayer) {
      this.audioPlayer.init();
    }
  } catch (err: unknown) {
    debug.log("this.audioPlayer.init() error", err);
    const msg = err instanceof Error ? err.message : String(err);
    this.transformBtn("error", msg);
  }
  this.setupAudioSettings();
  this.transformBtn("success", localizationProvider.get("disableTranslate"));
  this.afterUpdateTranslation(nextAudioUrl);
}

export async function translateFunc(
  this: VideoHandler,
  VIDEO_ID: string,
  _isStream: boolean,
  requestLang: string,
  responseLang: string,
  translationHelp?: VideoData["translationHelp"],
): Promise<void> {
  debug.log("Run videoValidator");
  this.videoValidator();
  // Stream translation is currently disabled; keep this parameter for API compatibility.

  // Ensure we don't start requests with a stale/aborted signal.
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
  // Stream translations are disabled; keep the cache namespace stable.
  const activeKey = `video_${cacheKey}`;

  if (this.activeTranslation?.key === activeKey) {
    debug.log("[translateFunc] Reusing in-flight translation");
    await this.activeTranslation.promise;
    return;
  }

  const actionContext = { gen: this.actionsGeneration, videoId: VIDEO_ID };

  const translationPromise = (async () => {
    if (this.isActionStale(actionContext)) {
      debug.log("[translateFunc] Stale translation task - skipping");
      return;
    }
    const reqLang = requestLang as RequestLang;
    const resLang = responseLang as ResponseLang;
    const applyTranslationUrl = async (url: string) =>
      await updateTranslationAndSchedule({
        url,
        actionContext,
        isActionStale: (ctx) => this.isActionStale(ctx),
        updateTranslation: (nextUrl, ctx) =>
          this.updateTranslation(nextUrl, ctx),
        scheduleTranslationRefresh: () => this.scheduleTranslationRefresh(),
      });
    const cachedEntry = this.cacheManager.getTranslation(cacheKey);
    if (cachedEntry?.url) {
      const updated = await applyTranslationUrl(cachedEntry.url);
      if (!updated) return;
      debug.log("[translateFunc] Cached translation was received");
      return;
    }
    // Do not short-circuit on cached failures.
    // Users must be able to retry immediately (especially after changing
    // proxy settings or recovering from transient backend issues).

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
        // Invalidate subtitles cache if there is no matching subtitle.
        const subsCacheKey = this.videoData
          ? this.getSubtitlesCacheKey(
              VIDEO_ID,
              this.videoData.detectedLanguage,
              this.videoData.responseLanguage,
            )
          : null;
        const cachedSubs = subsCacheKey
          ? this.cacheManager.getSubtitles(subsCacheKey)
          : null;
        if (
          !cachedSubs?.some(
            (item) =>
              item.source === "yandex" &&
              item.translatedFromLanguage === videoData.detectedLanguage &&
              item.language === videoData.responseLanguage,
          )
        ) {
          if (subsCacheKey) this.cacheManager.deleteSubtitles(subsCacheKey);
          this.subtitles = [];
        }
      },
    });

    debug.log("[translateRes]", translateRes);

    if (!translateRes) {
      debug.log("Skip translation");
      return;
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
  }
}

export function isYouTubeHosts(this: VideoHandler) {
  return isTranslationDownloadHost(this.site.host);
}

export function setupAudioSettings(this: VideoHandler) {
  if (typeof this.data?.defaultVolume === "number") {
    this.audioPlayer.player.volume = this.data.defaultVolume / 100;
  }

  // Smart Auto-Volume ducking: lower the original video volume only when
  // translated audio is actually playing sound, and restore it during silence.
  if (this.data?.enabledAutoVolume) {
    this.smartVolumeDuckingTarget =
      clamp(this.data.autoVolume ?? defaultAutoVolume, 0, 100) / 100;

    // Start the ducking loop once per translation session.
    startSmartVolumeDucking(this);
  } else {
    // Auto-volume toggled off -> stop ducking and restore baseline.
    stopSmartVolumeDucking(this, {
      restoreVolume: this.smartVolumeDuckingBaseline ?? this.volumeOnStart,
    });
  }
}
