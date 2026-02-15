import { describe, expect, test } from "bun:test";
import {
  computeSmartDuckingStep,
  initSmartDuckingRuntime,
  SMART_DUCKING_DEFAULT_CONFIG,
  type SmartDuckingConfig,
  type SmartDuckingInput,
  type SmartDuckingRuntime,
} from "../src/videoHandler/modules/ducking.ts";

type TickState = {
  nowMs: number;
  currentVolume: number;
  runtime: SmartDuckingRuntime;
};

const INSTANT_CONFIG: SmartDuckingConfig = {
  ...SMART_DUCKING_DEFAULT_CONFIG,
  rmsAttackTauMs: 0,
  rmsReleaseTauMs: 0,
  attackTauMs: 0,
  releaseTauMs: 0,
  maxDownPerSec: 100,
  maxUpPerSec: 100,
};

function runTick(
  state: TickState,
  overrides: Partial<SmartDuckingInput> = {},
  config: SmartDuckingConfig = INSTANT_CONFIG,
) {
  const input: SmartDuckingInput = {
    nowMs: state.nowMs,
    translationActive: true,
    enabledAutoVolume: true,
    smartEnabled: true,
    audioIsPlaying: true,
    rms: 0,
    currentVideoVolume: state.currentVolume,
    hostVideoActive: true,
    duckingTarget01: 0.15,
    volumeOnStart: 0.8,
    ...overrides,
  };

  if (typeof input.currentVideoVolume === "number") {
    state.currentVolume = input.currentVideoVolume;
  }

  const decision = computeSmartDuckingStep(input, state.runtime, config);
  if (decision.kind === "apply") {
    state.currentVolume = decision.volume01;
    state.runtime = decision.runtime;
  } else if (decision.kind === "noop") {
    state.runtime = decision.runtime;
  }
  return decision;
}

describe("smart ducking engine", () => {
  test("hysteresis keeps gate open between ON and OFF thresholds", () => {
    const config: SmartDuckingConfig = {
      ...INSTANT_CONFIG,
      holdMs: 500,
    };
    const state: TickState = {
      nowMs: 0,
      currentVolume: 0.8,
      runtime: initSmartDuckingRuntime(0.8),
    };

    runTick(state, { rms: 0.02 }, config);
    expect(state.runtime.speechGateOpen).toBe(true);

    state.nowMs += 50;
    runTick(state, { rms: 0.01 }, config);
    expect(state.runtime.speechGateOpen).toBe(true);
  });

  test("hold keeps gate open during short inter-word gaps", () => {
    const config: SmartDuckingConfig = {
      ...INSTANT_CONFIG,
      holdMs: 120,
    };
    const state: TickState = {
      nowMs: 0,
      currentVolume: 0.8,
      runtime: initSmartDuckingRuntime(0.8),
    };

    runTick(state, { rms: 0.02 }, config);
    expect(state.runtime.speechGateOpen).toBe(true);

    state.nowMs += 50;
    runTick(state, { rms: 0.001 }, config);
    expect(state.runtime.speechGateOpen).toBe(true);

    state.nowMs += 130;
    runTick(state, { rms: 0.001 }, config);
    expect(state.runtime.speechGateOpen).toBe(false);
  });

  test("RMS missing grace does not open gate immediately", () => {
    const config: SmartDuckingConfig = {
      ...INSTANT_CONFIG,
      rmsMissingGraceMs: 200,
    };
    const state: TickState = {
      nowMs: 0,
      currentVolume: 0.7,
      runtime: initSmartDuckingRuntime(0.7),
    };

    runTick(state, { rms: undefined }, config);
    expect(state.runtime.speechGateOpen).toBe(false);
    expect(state.runtime.isDucked).toBe(false);

    state.nowMs += 150;
    runTick(state, { rms: undefined }, config);
    expect(state.runtime.speechGateOpen).toBe(false);
    expect(state.runtime.isDucked).toBe(false);
  });

  test("after grace, missing RMS falls back to playing-state ducking", () => {
    const config: SmartDuckingConfig = {
      ...INSTANT_CONFIG,
      rmsMissingGraceMs: 200,
    };
    const state: TickState = {
      nowMs: 0,
      currentVolume: 0.7,
      runtime: initSmartDuckingRuntime(0.7),
    };

    runTick(state, { rms: undefined }, config);
    expect(state.runtime.speechGateOpen).toBe(false);

    state.nowMs += 250;
    runTick(state, { rms: undefined }, config);
    expect(state.runtime.speechGateOpen).toBe(true);
    expect(state.runtime.isDucked).toBe(true);
    expect(state.currentVolume).toBe(0.15);
  });

  test("duck target never raises volume above baseline", () => {
    const state: TickState = {
      nowMs: 0,
      currentVolume: 0.2,
      runtime: initSmartDuckingRuntime(0.2),
    };

    runTick(
      state,
      {
        smartEnabled: false,
        duckingTarget01: 0.8,
      },
      INSTANT_CONFIG,
    );

    expect(state.currentVolume).toBe(0.2);
  });

  test("quantize + slew converges to exact desired step", () => {
    const state: TickState = {
      nowMs: 0,
      currentVolume: 0.8,
      runtime: initSmartDuckingRuntime(0.8),
    };

    for (let i = 0; i < 200; i++) {
      runTick(
        state,
        {
          smartEnabled: false,
          duckingTarget01: 0.15,
        },
        SMART_DUCKING_DEFAULT_CONFIG,
      );
      state.nowMs += 50;
    }

    expect(state.currentVolume).toBe(0.15);
  });

  test("autoVolume target change is applied on next tick", () => {
    const state: TickState = {
      nowMs: 0,
      currentVolume: 0.8,
      runtime: initSmartDuckingRuntime(0.8),
    };

    runTick(
      state,
      {
        smartEnabled: false,
        duckingTarget01: 0.2,
      },
      INSTANT_CONFIG,
    );
    expect(state.currentVolume).toBe(0.2);

    state.nowMs += 50;
    runTick(
      state,
      {
        smartEnabled: false,
        duckingTarget01: 0.1,
      },
      INSTANT_CONFIG,
    );
    expect(state.currentVolume).toBe(0.1);
  });

  test("stop decision returns restore volume from baseline or volumeOnStart", () => {
    const withBaseline = computeSmartDuckingStep(
      {
        nowMs: 0,
        translationActive: false,
        enabledAutoVolume: true,
        smartEnabled: true,
        audioIsPlaying: false,
        rms: 0,
        currentVideoVolume: 0.5,
        hostVideoActive: true,
        duckingTarget01: 0.15,
        volumeOnStart: 0.6,
      },
      initSmartDuckingRuntime(0.7),
      INSTANT_CONFIG,
    );
    expect(withBaseline.kind).toBe("stop");
    if (withBaseline.kind === "stop") {
      expect(withBaseline.restoreVolume).toBe(0.7);
    }

    const withoutBaseline = computeSmartDuckingStep(
      {
        nowMs: 0,
        translationActive: false,
        enabledAutoVolume: true,
        smartEnabled: true,
        audioIsPlaying: false,
        rms: 0,
        currentVideoVolume: 0.5,
        hostVideoActive: true,
        duckingTarget01: 0.15,
        volumeOnStart: 0.6,
      },
      initSmartDuckingRuntime(),
      INSTANT_CONFIG,
    );
    expect(withoutBaseline.kind).toBe("stop");
    if (withoutBaseline.kind === "stop") {
      expect(withoutBaseline.restoreVolume).toBe(0.6);
    }
  });
});

