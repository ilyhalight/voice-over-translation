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
  audio?: HTMLMediaElement;
  audioElement?: HTMLMediaElement;
  gainNode?: AudioNode;
  audioSource?: AudioNode;
  mediaElementSource?: AudioNode;
};

type SmartDuckingAnalyserState = {
  analyser?: AnalyserNode;
  analyserFloatData?: Float32Array<ArrayBuffer>;
  analyserData?: Uint8Array<ArrayBuffer>;
  connectedInputNode?: AudioNode;
  mediaElement?: HTMLMediaElement;
  audioContext?: AudioContext;
  createdMediaSource?: MediaElementAudioSourceNode;
  mediaSourceCreationFailed?: boolean;
};

const smartDuckingAnalyserState = new WeakMap<
  VideoHandler,
  SmartDuckingAnalyserState
>();

function isAudioNode(node: unknown): node is AudioNode {
  if (!node || typeof node !== "object") return false;
  const candidate = node as { connect?: unknown; disconnect?: unknown };
  return (
    typeof candidate.connect === "function" &&
    typeof candidate.disconnect === "function"
  );
}

function getPlayerMediaElement(
  player?: AudioPlayerLike,
): HTMLMediaElement | undefined {
  return player?.audio ?? player?.audioElement;
}

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

function getSmartDuckingAudioContext(
  handler: VideoHandler,
): AudioContext | undefined {
  return handler.audioPlayer?.audioContext ?? handler.audioContext;
}

function disconnectSmartDuckingAnalyser(
  state: SmartDuckingAnalyserState,
): void {
  if (state.connectedInputNode && state.analyser) {
    try {
      state.connectedInputNode.disconnect(state.analyser);
    } catch {
      // ignore
    }
  }
  state.connectedInputNode = undefined;

  if (state.createdMediaSource) {
    try {
      state.createdMediaSource.disconnect();
    } catch {
      // ignore
    }
  }
  state.createdMediaSource = undefined;

  if (state.analyser) {
    try {
      state.analyser.disconnect();
    } catch {
      // ignore
    }
  }

  state.analyser = undefined;
  state.analyserFloatData = undefined;
  state.analyserData = undefined;
  state.mediaElement = undefined;
  state.audioContext = undefined;
  state.mediaSourceCreationFailed = false;
}

function releaseSmartDuckingAnalyser(handler: VideoHandler): void {
  const state = smartDuckingAnalyserState.get(handler);
  if (!state) return;

  disconnectSmartDuckingAnalyser(state);
  smartDuckingAnalyserState.delete(handler);
}

function resolveSmartDuckingInputNode(
  player: AudioPlayerLike | undefined,
  media: HTMLMediaElement,
  audioContext: AudioContext,
  state: SmartDuckingAnalyserState,
): AudioNode | undefined {
  if (isAudioNode(player?.gainNode)) return player.gainNode;
  if (isAudioNode(player?.audioSource)) return player.audioSource;
  if (isAudioNode(player?.mediaElementSource)) return player.mediaElementSource;

  if (
    state.mediaSourceCreationFailed &&
    state.mediaElement === media &&
    state.audioContext === audioContext
  ) {
    return undefined;
  }

  if (
    state.createdMediaSource &&
    state.mediaElement === media &&
    state.audioContext === audioContext
  ) {
    return state.createdMediaSource;
  }

  try {
    const source = audioContext.createMediaElementSource(media);
    state.createdMediaSource = source;
    state.mediaSourceCreationFailed = false;
    return source;
  } catch (err) {
    state.mediaSourceCreationFailed = true;
    debug.log("[SmartDucking] failed to create media source", err);
    return undefined;
  }
}

function ensureSmartDuckingAnalyser(
  handler: VideoHandler,
  player: AudioPlayerLike | undefined,
  media: HTMLMediaElement,
): { analyser: AnalyserNode; state: SmartDuckingAnalyserState } | undefined {
  const audioContext = getSmartDuckingAudioContext(handler);
  if (!audioContext) return undefined;

  let state = smartDuckingAnalyserState.get(handler);
  if (!state) {
    state = {};
    smartDuckingAnalyserState.set(handler, state);
  }

  if (
    (state.mediaElement && state.mediaElement !== media) ||
    (state.audioContext && state.audioContext !== audioContext)
  ) {
    disconnectSmartDuckingAnalyser(state);
  }

  state.mediaElement = media;
  state.audioContext = audioContext;

  if (!state.analyser) {
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    state.analyser = analyser;
  }

  const inputNode = resolveSmartDuckingInputNode(
    player,
    media,
    audioContext,
    state,
  );
  const analyser = state.analyser;
  if (!inputNode || !analyser) return undefined;

  if (state.connectedInputNode !== inputNode) {
    if (state.connectedInputNode) {
      try {
        state.connectedInputNode.disconnect(analyser);
      } catch {
        // ignore
      }
    }

    try {
      inputNode.connect(analyser);
      state.connectedInputNode = inputNode;
    } catch (err) {
      debug.log("[SmartDucking] failed to connect analyser", err);
      return undefined;
    }
  }

  return { analyser, state };
}

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

  releaseSmartDuckingAnalyser(handler);
  writeSmartDuckingRuntime(handler, resetSmartDuckingRuntime());
}

function startSmartVolumeDucking(handler: VideoHandler): void {
  if (typeof globalThis === "undefined") return;
  if (typeof handler.smartVolumeDuckingInterval === "number") return;

  const currentVideoVolume = handler.getVideoVolume();
  const baseline =
    typeof handler.smartVolumeDuckingBaseline === "number"
      ? handler.smartVolumeDuckingBaseline
      : currentVideoVolume;

  const runtime = initSmartDuckingRuntime(baseline);
  if (
    Number.isFinite(currentVideoVolume) &&
    Number.isFinite(baseline) &&
    currentVideoVolume <
      baseline - SMART_DUCKING_DEFAULT_CONFIG.externalBaselineDelta01
  ) {
    // Resuming Smart mode from constant ducking: keep baseline untouched and
    // continue from the already ducked state.
    const now =
      typeof performance !== "undefined" &&
      typeof performance.now === "function"
        ? performance.now()
        : Date.now();
    runtime.isDucked = true;
    runtime.speechGateOpen = true;
    runtime.lastApplied = currentVideoVolume;
    runtime.lastSoundAt = now;
  }

  writeSmartDuckingRuntime(handler, runtime);

  handler.smartVolumeDuckingInterval = globalThis.setInterval(() => {
    smartDuckingTick(handler);
  }, SMART_DUCKING_DEFAULT_CONFIG.tickMs);
}

function getTranslatedAudioRms(
  handler: VideoHandler,
  media: HTMLMediaElement,
): number | undefined {
  const player = handler.audioPlayer?.player as unknown as
    | AudioPlayerLike
    | undefined;
  const analyserBundle = ensureSmartDuckingAnalyser(handler, player, media);
  if (!analyserBundle) return undefined;

  const { analyser, state } = analyserBundle;

  try {
    // Use float time-domain data when available (avoids 8-bit quantization).
    if (typeof analyser.getFloatTimeDomainData === "function") {
      let floatData = state.analyserFloatData;

      if (floatData?.length !== analyser.fftSize) {
        floatData = new Float32Array(analyser.fftSize);
        state.analyserFloatData = floatData;
      }

      analyser.getFloatTimeDomainData(floatData);

      let sum = 0;
      for (const value of floatData) {
        sum += value * value;
      }
      return clamp(Math.sqrt(sum / floatData.length), 0, 1);
    }

    let data = state.analyserData;
    if (data?.length !== analyser.fftSize) {
      data = new Uint8Array(analyser.fftSize);
      state.analyserData = data;
    }

    analyser.getByteTimeDomainData(data);

    let sum = 0;
    for (const rawValue of data) {
      const normalizedValue = (rawValue - 128) / 128;
      sum += normalizedValue * normalizedValue;
    }
    return clamp(Math.sqrt(sum / data.length), 0, 1);
  } catch {
    return undefined;
  }
}

function smartDuckingTick(handler: VideoHandler): void {
  const player = handler.audioPlayer?.player as unknown as
    | AudioPlayerLike
    | undefined;
  const media = getPlayerMediaElement(player);
  const syncVolumeEnabled = Boolean(handler.data?.syncVolume);
  const autoVolumeEnabled =
    Boolean(handler.data?.enabledAutoVolume) && !syncVolumeEnabled;
  const smartEnabled =
    (handler.data?.enabledSmartDucking ?? true) && !syncVolumeEnabled;

  // Smart ducking may be disabled while interval is still active (e.g. runtime
  // settings toggle). Switch to one-shot classic ducking immediately and stop
  // periodic corrections so user volume changes are not overridden.
  if (autoVolumeEnabled && !smartEnabled) {
    setupAudioSettings.call(handler);
    return;
  }

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
  const rms =
    audioIsPlaying && media ? getTranslatedAudioRms(handler, media) : 0;

  const decision = computeSmartDuckingStep(
    {
      nowMs: now,
      translationActive: handler.hasActiveSource(),
      enabledAutoVolume: autoVolumeEnabled,
      smartEnabled,
      audioIsPlaying,
      rms,
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
  debug.log(`[VOT] ${reason}: clearing translation/subtitles cache`);
  try {
    this.cacheManager.clear();
    this.activeTranslation = null;
  } catch {
    // ignore
  }

  // Switching proxy settings should cancel any ongoing translation and leave
  // playback in a clean, disabled state.
  try {
    await this.stopTranslation();
  } catch {
    // ignore
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
  await this.waitForPendingStopTranslate();
  if (this.isActionStale(actionContext)) return;
  if (!this.audioPlayer) {
    this.createPlayer();
  }
  if (this.audioPlayer.audioContext?.state === "closed") {
    debug.log("[updateTranslation] AudioContext is closed, recreating player");
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
  let appliedSourceUrl: string | null = null;
  if (shouldInitPlayer) {
    this.audioPlayer.player.src = nextAudioUrl;
    appliedSourceUrl = nextAudioUrl;
  }
  let initError: unknown;
  try {
    if (shouldInitPlayer) {
      await this.audioPlayer.init();
    }
    if (this.isActionStale(actionContext)) {
      await rollbackStaleAppliedSourceIfStillCurrent(this, appliedSourceUrl);
      return;
    }
    const resumeResult = await resumePlayerAudioContextIfNeeded(this);
    if (resumeResult === "timeout") {
      debug.log(
        "[updateTranslation] continuing after AudioContext resume timeout",
      );
    } else if (resumeResult === "failed") {
      debug.log(
        "[updateTranslation] AudioContext resume failed, continue without deferred resume",
      );
    }
    if (this.isActionStale(actionContext)) {
      await rollbackStaleAppliedSourceIfStillCurrent(this, appliedSourceUrl);
      return;
    }
    if (!this.video.paused && this.audioPlayer.player.src) {
      this.audioPlayer.player.lipSync("play");
    }
  } catch (err: unknown) {
    initError = err;
  }

  // Network/proxy hiccup fallback: if proxied URL failed to fetch audio data,
  // retry once with the original direct S3 URL.
  if (initError && shouldInitPlayer && !this.isActionStale(actionContext)) {
    const directUrl = this.unproxifyAudio(nextAudioUrl);
    if (directUrl !== nextAudioUrl) {
      try {
        debug.log(
          "[updateTranslation] proxied audio init failed, retrying direct URL",
        );
        const validatedDirectUrl = await this.validateAudioUrl(
          directUrl,
          actionContext,
        );
        if (this.isActionStale(actionContext)) {
          await rollbackStaleAppliedSourceIfStillCurrent(
            this,
            appliedSourceUrl,
          );
          return;
        }
        this.audioPlayer.player.src = validatedDirectUrl;
        appliedSourceUrl = validatedDirectUrl;
        nextAudioUrl = validatedDirectUrl;
        await this.audioPlayer.init();

        const resumeResult = await resumePlayerAudioContextIfNeeded(this);
        if (resumeResult === "timeout" || resumeResult === "failed") {
          debug.log(
            "[updateTranslation] AudioContext not resumed after direct URL fallback",
            resumeResult,
          );
        }
        if (!this.video.paused && this.audioPlayer.player.src) {
          this.audioPlayer.player.lipSync("play");
        }
        initError = undefined;
      } catch (fallbackErr) {
        initError = fallbackErr;
      }
    }
  }

  if (initError) {
    debug.log("this.audioPlayer.init() error", initError);
    await rollbackStaleAppliedSourceIfStillCurrent(this, appliedSourceUrl);
    const msg =
      initError instanceof Error ? initError.message : String(initError);
    this.transformBtn("error", msg);
    return;
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
  await this.waitForPendingStopTranslate();
  debug.log("Run videoValidator");
  await this.videoValidator();
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

export function setupAudioSettings(this: VideoHandler) {
  if (typeof this.data?.defaultVolume === "number") {
    this.audioPlayer.player.volume = this.data.defaultVolume / 100;
  }

  const autoVolumeEnabled =
    Boolean(this.data?.enabledAutoVolume) && !this.data?.syncVolume;
  const smartDuckingEnabled = this.data?.enabledSmartDucking ?? true;

  if (!autoVolumeEnabled) {
    // Auto-volume toggled off -> restore baseline and fully reset smart ducking.
    stopSmartVolumeDucking(this, {
      restoreVolume: this.smartVolumeDuckingBaseline ?? this.volumeOnStart,
    });
    return;
  }

  const targetVolume =
    clamp(this.data.autoVolume ?? defaultAutoVolume, 0, 100) / 100;
  this.smartVolumeDuckingTarget = targetVolume;

  if (!this.hasActiveSource()) {
    // No active translation source yet: keep target cached for next setup call.
    return;
  }

  if (smartDuckingEnabled) {
    startSmartVolumeDucking(this);
    return;
  }

  // Smart ducking disabled -> fall back to classic constant ducking.
  if (typeof this.smartVolumeDuckingInterval === "number") {
    clearInterval(this.smartVolumeDuckingInterval);
    this.smartVolumeDuckingInterval = undefined;
  }

  if (typeof this.smartVolumeDuckingBaseline !== "number") {
    this.smartVolumeDuckingBaseline = this.getVideoVolume();
  }

  const baseline = this.smartVolumeDuckingBaseline ?? this.getVideoVolume();
  this.setVideoVolume(Math.min(baseline, targetVolume));

  // Keep runtime in a neutral state in constant mode.
  writeSmartDuckingRuntime(
    this,
    initSmartDuckingRuntime(this.smartVolumeDuckingBaseline),
  );
  this.smartVolumeIsDucked = true;
}
