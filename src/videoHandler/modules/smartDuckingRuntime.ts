import { defaultAutoVolume } from "../../config/config";
import type { VideoHandler } from "../../index";
import debug from "../../utils/debug";
import { clamp } from "../../utils/utils";
import { snapVolume01 } from "../../utils/volume";
import {
  computeSmartDuckingStep,
  initSmartDuckingRuntime,
  resetSmartDuckingRuntime,
  SMART_DUCKING_DEFAULT_CONFIG,
  type SmartDuckingRuntime,
} from "./ducking";
import type { StopSmartVolumeDuckingOptions } from "./translationTypes";

type AutoVolumeMode = "off" | "classic" | "smart";

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

const SMART_DUCKING_TICK_MS = SMART_DUCKING_DEFAULT_CONFIG.tickMs;

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

function getNowMs(): number {
  return typeof performance !== "undefined" &&
    typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function getAutoVolumeMode(handler: VideoHandler): AutoVolumeMode {
  if (!handler.data?.enabledAutoVolume) {
    return "off";
  }
  if (handler.data?.syncVolume) {
    return "classic";
  }
  return (handler.data?.enabledSmartDucking ?? true) ? "smart" : "classic";
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

export function stopSmartVolumeDucking(
  handler: VideoHandler,
  options: StopSmartVolumeDuckingOptions = {},
): void {
  const { restoreVolume } = options;

  if (handler.smartVolumeDuckingInterval !== undefined) {
    clearTimeout(handler.smartVolumeDuckingInterval);
    handler.smartVolumeDuckingInterval = undefined;
  }

  const baseline =
    typeof restoreVolume === "number"
      ? restoreVolume
      : (handler.smartVolumeDuckingBaseline ?? handler.volumeOnStart);

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

function scheduleNextSmartDuckingTick(handler: VideoHandler): void {
  if (typeof globalThis === "undefined") return;
  if (handler.smartVolumeDuckingInterval === undefined) return;

  handler.smartVolumeDuckingInterval = globalThis.setTimeout(() => {
    if (handler.smartVolumeDuckingInterval === undefined) return;

    try {
      smartDuckingTick(handler);
    } catch (err) {
      debug.log("[SmartDucking] tick failed, stopping smart ducking", err);
      stopSmartVolumeDucking(handler);
      return;
    }

    if (handler.smartVolumeDuckingInterval === undefined) return;
    scheduleNextSmartDuckingTick(handler);
  }, SMART_DUCKING_TICK_MS);
}

function startSmartVolumeDucking(handler: VideoHandler): void {
  if (typeof globalThis === "undefined") return;
  if (handler.smartVolumeDuckingInterval !== undefined) return;
  if (getAutoVolumeMode(handler) !== "smart") return;

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
    const now = getNowMs();
    runtime.isDucked = true;
    runtime.speechGateOpen = true;
    runtime.lastApplied = currentVideoVolume;
    runtime.lastSoundAt = now;
  }

  writeSmartDuckingRuntime(handler, runtime);

  handler.smartVolumeDuckingInterval = globalThis.setTimeout(() => {}, 0);
  clearTimeout(handler.smartVolumeDuckingInterval);
  scheduleNextSmartDuckingTick(handler);
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
  if (getAutoVolumeMode(handler) !== "smart") {
    setupAudioSettings.call(handler);
    return;
  }

  const player = handler.audioPlayer?.player as unknown as
    | AudioPlayerLike
    | undefined;
  const media = getPlayerMediaElement(player);

  const audioIsPlaying =
    !!media && !media.paused && !media.muted && (media.volume ?? 1) > 0.001;

  const now = getNowMs();
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
      enabledAutoVolume: true,
      smartEnabled: true,
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
    default:
      throw new TypeError("Unhandled smart ducking decision");
  }
}

export function setupAudioSettings(this: VideoHandler) {
  if (typeof this.data?.defaultVolume === "number") {
    this.audioPlayer.player.volume = this.data.defaultVolume / 100;
  }

  const autoVolumeMode = getAutoVolumeMode(this);

  if (autoVolumeMode === "off") {
    stopSmartVolumeDucking(this, {
      restoreVolume: this.smartVolumeDuckingBaseline ?? this.volumeOnStart,
    });
    return;
  }

  const targetVolume =
    clamp(this.data.autoVolume ?? defaultAutoVolume, 0, 100) / 100;
  this.smartVolumeDuckingTarget = targetVolume;

  if (!this.hasActiveSource()) {
    return;
  }

  if (autoVolumeMode === "smart") {
    startSmartVolumeDucking(this);
    return;
  }

  if (this.smartVolumeDuckingInterval !== undefined) {
    clearTimeout(this.smartVolumeDuckingInterval);
    this.smartVolumeDuckingInterval = undefined;
  }

  if (typeof this.smartVolumeDuckingBaseline !== "number") {
    this.smartVolumeDuckingBaseline = this.getVideoVolume();
  }

  const baseline = this.smartVolumeDuckingBaseline ?? this.getVideoVolume();
  this.setVideoVolume(Math.min(baseline, targetVolume));

  writeSmartDuckingRuntime(
    this,
    initSmartDuckingRuntime(this.smartVolumeDuckingBaseline),
  );
  this.smartVolumeIsDucked = true;
}

export function applyManualVideoVolumeOverride(
  this: VideoHandler,
  volume01: number,
): void {
  if (!this.data?.enabledAutoVolume || !this.hasActiveSource()) {
    return;
  }

  const nextVolume = snapVolume01(volume01);
  this.smartVolumeDuckingTarget = nextVolume;
  this.smartVolumeDuckingBaseline = nextVolume;
  this.smartVolumeLastApplied = nextVolume;
}
