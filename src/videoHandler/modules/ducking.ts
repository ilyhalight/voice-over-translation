import { clamp } from "../../utils/utils";
import { snapVolume01Towards, VIDEO_VOLUME_STEP_01 } from "../../utils/volume";

const VOLUME_MIN_01 = 0;
const VOLUME_MAX_01 = 1;

export type SmartDuckingConfig = {
  tickMs: number;
  thresholdOnRms: number;
  thresholdOffRms: number;
  rmsAttackTauMs: number;
  rmsReleaseTauMs: number;
  holdMs: number;
  attackTauMs: number;
  releaseTauMs: number;
  maxDownPerSec: number;
  maxUpPerSec: number;
  rmsMissingGraceMs: number;
  maxDtMs: number;
  externalBaselineDelta01: number;
  unduckTolerance01: number;
  volumeStep01: number;
  applyDeltaThreshold01: number;
};

export type SmartDuckingRuntime = {
  isDucked: boolean;
  speechGateOpen: boolean;
  rmsEnvelope: number;
  baseline?: number;
  lastApplied?: number;
  lastTickAt: number;
  lastSoundAt: number;
  rmsMissingSinceAt: number | null;
};

export type SmartDuckingInput = {
  nowMs: number;
  translationActive: boolean;
  enabledAutoVolume: boolean;
  smartEnabled: boolean;
  audioIsPlaying: boolean;
  rms?: number;
  currentVideoVolume?: number;
  hostVideoActive: boolean;
  duckingTarget01: number;
  volumeOnStart?: number;
};

type SmartDuckingDecisionBase = {
  runtime: SmartDuckingRuntime;
};

export type SmartDuckingStopDecision = SmartDuckingDecisionBase & {
  kind: "stop";
  restoreVolume?: number;
};

export type SmartDuckingApplyDecision = SmartDuckingDecisionBase & {
  kind: "apply";
  volume01: number;
};

export type SmartDuckingNoopDecision = SmartDuckingDecisionBase & {
  kind: "noop";
};

export type SmartDuckingDecision =
  | SmartDuckingStopDecision
  | SmartDuckingApplyDecision
  | SmartDuckingNoopDecision;

export const SMART_DUCKING_DEFAULT_CONFIG = Object.freeze({
  tickMs: 50,
  thresholdOnRms: 0.012,
  thresholdOffRms: 0.009,
  rmsAttackTauMs: 60,
  rmsReleaseTauMs: 240,
  holdMs: 520,
  attackTauMs: 110,
  releaseTauMs: 600,
  maxDownPerSec: 3.5,
  maxUpPerSec: 0.9,
  rmsMissingGraceMs: 200,
  maxDtMs: 250,
  externalBaselineDelta01: 0.02,
  unduckTolerance01: 0.01,
  volumeStep01: VIDEO_VOLUME_STEP_01,
  applyDeltaThreshold01: VIDEO_VOLUME_STEP_01 / 2,
} satisfies SmartDuckingConfig);

export function initSmartDuckingRuntime(
  baseline?: number,
): SmartDuckingRuntime {
  return {
    isDucked: false,
    speechGateOpen: false,
    rmsEnvelope: 0,
    baseline: normalizeVolume01(baseline),
    lastApplied: undefined,
    lastTickAt: 0,
    lastSoundAt: 0,
    rmsMissingSinceAt: null,
  };
}

export function resetSmartDuckingRuntime(): SmartDuckingRuntime {
  return initSmartDuckingRuntime();
}

function updateSpeechGate(
  input: SmartDuckingInput,
  runtime: SmartDuckingRuntime,
  config: SmartDuckingConfig,
  now: number,
  hasRms: boolean,
): boolean {
  const gateOpen = runtime.speechGateOpen;

  if (!input.smartEnabled) {
    runtime.lastSoundAt = now;
    runtime.rmsMissingSinceAt = null;
    return true;
  }

  if (input.audioIsPlaying && !hasRms) {
    runtime.rmsMissingSinceAt ??= now;

    if (gateOpen) {
      runtime.lastSoundAt = now;
    }

    if (
      runtime.rmsMissingSinceAt !== null &&
      now - runtime.rmsMissingSinceAt >= config.rmsMissingGraceMs
    ) {
      runtime.lastSoundAt = now;
      return true;
    }

    return gateOpen;
  }

  runtime.rmsMissingSinceAt = null;

  if (!input.audioIsPlaying) {
    return gateOpen && now - runtime.lastSoundAt <= config.holdMs;
  }

  if (!gateOpen && runtime.rmsEnvelope >= config.thresholdOnRms) {
    runtime.lastSoundAt = now;
    return true;
  }

  if (gateOpen && runtime.rmsEnvelope >= config.thresholdOffRms) {
    runtime.lastSoundAt = now;
    return true;
  }

  return gateOpen && now - runtime.lastSoundAt <= config.holdMs;
}

function resolveBaseline(
  runtime: SmartDuckingRuntime,
  currentVideoVolume: number,
  volumeOnStart: number | null | undefined,
  config: SmartDuckingConfig,
): number {
  if (
    runtime.isDucked &&
    isFiniteNumber(runtime.lastApplied) &&
    Math.abs(currentVideoVolume - runtime.lastApplied) >
      config.externalBaselineDelta01
  ) {
    runtime.baseline = currentVideoVolume;
  }

  if (!runtime.isDucked) {
    runtime.baseline = currentVideoVolume;
  }

  const baseline = runtime.baseline ?? volumeOnStart ?? currentVideoVolume;
  runtime.baseline = baseline;
  return baseline;
}

function resolveDesiredVolume(
  runtime: SmartDuckingRuntime,
  gateOpen: boolean,
  currentVideoVolume: number,
  baseline: number,
  duckingTarget01: number,
  config: SmartDuckingConfig,
): number {
  const duckedTarget = Math.min(baseline, duckingTarget01);

  if (gateOpen) {
    runtime.isDucked = true;
    return duckedTarget;
  }

  if (
    runtime.isDucked &&
    Math.abs(baseline - currentVideoVolume) < config.unduckTolerance01
  ) {
    runtime.isDucked = false;
  }

  return baseline;
}

function smoothVolumeChange(
  desired: number,
  currentVideoVolume: number,
  dtMs: number,
  dtSec: number,
  config: SmartDuckingConfig,
): number {
  const smoothingTauMs =
    desired < currentVideoVolume ? config.attackTauMs : config.releaseTauMs;
  const smoothingAlpha =
    smoothingTauMs > 0 ? -Math.expm1(-dtMs / smoothingTauMs) : 1;
  let nextVolume =
    currentVideoVolume + (desired - currentVideoVolume) * smoothingAlpha;

  const maxDelta =
    (desired < currentVideoVolume ? config.maxDownPerSec : config.maxUpPerSec) *
    dtSec;
  if (maxDelta > 0) {
    nextVolume = clamp(
      nextVolume,
      currentVideoVolume - maxDelta,
      currentVideoVolume + maxDelta,
    );
  }

  return clamp(nextVolume, VOLUME_MIN_01, VOLUME_MAX_01);
}

function buildVolumeDecision(
  runtime: SmartDuckingRuntime,
  currentVideoVolume: number,
  quantized: number,
  applyDeltaThreshold01: number,
): SmartDuckingDecision {
  if (Math.abs(quantized - currentVideoVolume) < applyDeltaThreshold01) {
    runtime.lastApplied = quantized;
    return { kind: "noop", runtime };
  }

  if (
    !isFiniteNumber(runtime.lastApplied) ||
    Math.abs(quantized - runtime.lastApplied) >= applyDeltaThreshold01
  ) {
    runtime.lastApplied = quantized;
    return {
      kind: "apply",
      runtime,
      volume01: quantized,
    };
  }

  return { kind: "noop", runtime };
}

export function computeSmartDuckingStep(
  input: SmartDuckingInput,
  runtime: SmartDuckingRuntime,
  config: SmartDuckingConfig = SMART_DUCKING_DEFAULT_CONFIG,
): SmartDuckingDecision {
  const nextRuntime = normalizeRuntime(runtime);
  const volumeOnStart = normalizeVolume01(input.volumeOnStart);

  if (!input.translationActive || !input.enabledAutoVolume) {
    return {
      kind: "stop",
      runtime: nextRuntime,
      restoreVolume: nextRuntime.baseline ?? volumeOnStart,
    };
  }

  const now = Number.isFinite(input.nowMs) ? input.nowMs : Date.now();
  const prevTickAt = nextRuntime.lastTickAt || now;
  const dtMs = clamp(now - prevTickAt, 0, config.maxDtMs);
  const dtSec = dtMs / 1000;
  nextRuntime.lastTickAt = now;

  const hasRms = isFiniteNumber(input.rms);
  const rmsValue = hasRms ? clamp(input.rms, VOLUME_MIN_01, VOLUME_MAX_01) : 0;
  const prevEnv = nextRuntime.rmsEnvelope;
  const envTauMs =
    rmsValue > prevEnv ? config.rmsAttackTauMs : config.rmsReleaseTauMs;
  const envAlpha = envTauMs > 0 ? -Math.expm1(-dtMs / envTauMs) : 1;
  nextRuntime.rmsEnvelope = clamp(
    prevEnv + (rmsValue - prevEnv) * envAlpha,
    VOLUME_MIN_01,
    VOLUME_MAX_01,
  );

  const gateOpen = updateSpeechGate(input, nextRuntime, config, now, hasRms);
  nextRuntime.speechGateOpen = gateOpen;

  const currentVideoVolume = normalizeVolume01(input.currentVideoVolume);
  if (!isFiniteNumber(currentVideoVolume)) {
    return { kind: "noop", runtime: nextRuntime };
  }

  const baseline = resolveBaseline(
    nextRuntime,
    currentVideoVolume,
    volumeOnStart,
    config,
  );

  if (!input.hostVideoActive) {
    nextRuntime.lastApplied = currentVideoVolume;
    return { kind: "noop", runtime: nextRuntime };
  }

  const duckingTarget01 = normalizeVolume01(input.duckingTarget01) ?? baseline;
  const desired = resolveDesiredVolume(
    nextRuntime,
    gateOpen,
    currentVideoVolume,
    baseline,
    duckingTarget01,
    config,
  );
  const nextVolume = smoothVolumeChange(
    desired,
    currentVideoVolume,
    dtMs,
    dtSec,
    config,
  );

  const quantized = snapVolume01Towards(
    nextVolume,
    currentVideoVolume,
    desired,
    config.volumeStep01,
  );

  const applyDeltaThreshold01 = config.applyDeltaThreshold01;
  return buildVolumeDecision(
    nextRuntime,
    currentVideoVolume,
    quantized,
    applyDeltaThreshold01,
  );
}

function normalizeRuntime(runtime: SmartDuckingRuntime): SmartDuckingRuntime {
  return {
    isDucked: Boolean(runtime.isDucked),
    speechGateOpen: Boolean(runtime.speechGateOpen),
    rmsEnvelope: normalizeVolume01(runtime.rmsEnvelope) ?? 0,
    baseline: normalizeVolume01(runtime.baseline),
    lastApplied: normalizeVolume01(runtime.lastApplied),
    lastTickAt: isFiniteNumber(runtime.lastTickAt) ? runtime.lastTickAt : 0,
    lastSoundAt: isFiniteNumber(runtime.lastSoundAt) ? runtime.lastSoundAt : 0,
    rmsMissingSinceAt: isFiniteNumber(runtime.rmsMissingSinceAt)
      ? runtime.rmsMissingSinceAt
      : null,
  };
}

function normalizeVolume01(value?: number): number | undefined {
  if (!isFiniteNumber(value)) return undefined;
  return clamp(value, VOLUME_MIN_01, VOLUME_MAX_01);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
