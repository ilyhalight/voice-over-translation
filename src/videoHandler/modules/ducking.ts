import { clamp } from "../../utils/utils";
import { snapVolume01Towards, VIDEO_VOLUME_STEP_01 } from "../../utils/volume";

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

export const SMART_DUCKING_DEFAULT_CONFIG: Readonly<SmartDuckingConfig> = {
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
};

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
  const rmsValue =
    hasRms && typeof input.rms === "number" ? clamp(input.rms, 0, 1) : 0;
  const prevEnv = clamp(nextRuntime.rmsEnvelope, 0, 1);
  const envTauMs =
    rmsValue > prevEnv ? config.rmsAttackTauMs : config.rmsReleaseTauMs;
  const envAlpha = envTauMs > 0 ? 1 - Math.exp(-dtMs / envTauMs) : 1;
  nextRuntime.rmsEnvelope = clamp(
    prevEnv + (rmsValue - prevEnv) * envAlpha,
    0,
    1,
  );

  let gateOpen = nextRuntime.speechGateOpen;
  if (!input.smartEnabled) {
    gateOpen = true;
    nextRuntime.lastSoundAt = now;
    nextRuntime.rmsMissingSinceAt = null;
  } else if (input.audioIsPlaying && !hasRms) {
    nextRuntime.rmsMissingSinceAt ??= now;

    if (gateOpen) {
      // Preserve an already-open gate during short analyser gaps.
      nextRuntime.lastSoundAt = now;
    }

    if (
      nextRuntime.rmsMissingSinceAt !== null &&
      now - nextRuntime.rmsMissingSinceAt >= config.rmsMissingGraceMs
    ) {
      gateOpen = true;
      nextRuntime.lastSoundAt = now;
    }
  } else {
    nextRuntime.rmsMissingSinceAt = null;

    if (!gateOpen) {
      if (
        input.audioIsPlaying &&
        nextRuntime.rmsEnvelope >= config.thresholdOnRms
      ) {
        gateOpen = true;
        nextRuntime.lastSoundAt = now;
      }
    } else if (
      input.audioIsPlaying &&
      nextRuntime.rmsEnvelope >= config.thresholdOffRms
    ) {
      nextRuntime.lastSoundAt = now;
    } else if (now - nextRuntime.lastSoundAt > config.holdMs) {
      gateOpen = false;
    }
  }
  nextRuntime.speechGateOpen = gateOpen;

  const currentVideoVolume = normalizeVolume01(input.currentVideoVolume);
  if (!isFiniteNumber(currentVideoVolume)) {
    return { kind: "noop", runtime: nextRuntime };
  }

  if (
    nextRuntime.isDucked &&
    isFiniteNumber(nextRuntime.lastApplied) &&
    Math.abs(currentVideoVolume - nextRuntime.lastApplied) >
      config.externalBaselineDelta01
  ) {
    nextRuntime.baseline = currentVideoVolume;
  }

  if (!nextRuntime.isDucked) {
    nextRuntime.baseline = currentVideoVolume;
  }

  const baseline = nextRuntime.baseline ?? volumeOnStart ?? currentVideoVolume;
  nextRuntime.baseline = baseline;

  if (!input.hostVideoActive) {
    nextRuntime.lastApplied = currentVideoVolume;
    return { kind: "noop", runtime: nextRuntime };
  }

  const duckingTarget01 = normalizeVolume01(input.duckingTarget01) ?? baseline;
  const duckedTarget = Math.min(baseline, duckingTarget01);
  let desired = baseline;

  if (gateOpen) {
    if (!nextRuntime.isDucked) {
      nextRuntime.baseline = baseline;
      nextRuntime.isDucked = true;
    }
    desired = duckedTarget;
  } else if (
    nextRuntime.isDucked &&
    Math.abs(baseline - currentVideoVolume) < config.unduckTolerance01
  ) {
    nextRuntime.isDucked = false;
  }

  const tauMs =
    desired < currentVideoVolume ? config.attackTauMs : config.releaseTauMs;
  const alpha = tauMs > 0 ? 1 - Math.exp(-dtMs / tauMs) : 1;
  let nextVolume = currentVideoVolume + (desired - currentVideoVolume) * alpha;

  const maxDelta =
    (desired < currentVideoVolume ? config.maxDownPerSec : config.maxUpPerSec) *
    dtSec;
  if (Number.isFinite(maxDelta) && maxDelta > 0) {
    nextVolume = clamp(
      nextVolume,
      currentVideoVolume - maxDelta,
      currentVideoVolume + maxDelta,
    );
  }
  nextVolume = clamp(nextVolume, 0, 1);

  const quantized = snapVolume01Towards(
    nextVolume,
    currentVideoVolume,
    desired,
    config.volumeStep01,
  );

  if (
    !isFiniteNumber(nextRuntime.lastApplied) ||
    Math.abs(quantized - nextRuntime.lastApplied) >=
      config.applyDeltaThreshold01
  ) {
    nextRuntime.lastApplied = quantized;
    return {
      kind: "apply",
      runtime: nextRuntime,
      volume01: quantized,
    };
  }

  return { kind: "noop", runtime: nextRuntime };
}

function normalizeRuntime(runtime: SmartDuckingRuntime): SmartDuckingRuntime {
  return {
    isDucked: Boolean(runtime.isDucked),
    speechGateOpen: Boolean(runtime.speechGateOpen),
    rmsEnvelope: clamp(runtime.rmsEnvelope ?? 0, 0, 1),
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
  return clamp(value, 0, 1);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
