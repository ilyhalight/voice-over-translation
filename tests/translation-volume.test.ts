import { describe, expect, test, vi } from "vitest";
import {
  clampInt,
  clampPercentInt,
  percentToVolume01,
  snapVolume01,
  snapVolume01Towards,
  volume01ToPercent,
} from "../src/utils/volume";
import {
  computeSmartDuckingStep,
  initSmartDuckingRuntime,
  SMART_DUCKING_DEFAULT_CONFIG,
} from "../src/videoHandler/modules/ducking";
import {
  applyTranslationPlaybackVolume,
  safeSetPlayerVolume,
} from "../src/videoHandler/translationVolume";
import {
  applyVolumeLinkDelta,
  syncTranslationLinkSnapshot,
  syncVideoLinkSnapshot,
  type VolumeLinkState,
} from "../src/videoHandler/volumeLink";

function createMockGainPlayer(options?: {
  currentTime?: number;
  initialGain?: number;
  initialMediaVolume?: number;
  initialMuted?: boolean;
  mediaProp?: "audio" | "audioElement";
  cancelScheduledValues?: ReturnType<typeof vi.fn>;
  cancelAndHoldAtTime?: ReturnType<typeof vi.fn>;
  setValueAtTime?: ReturnType<typeof vi.fn>;
}) {
  const {
    currentTime = 4.5,
    initialGain = 1,
    initialMediaVolume = 1,
    initialMuted = false,
    mediaProp = "audio",
    cancelScheduledValues = vi.fn(),
    cancelAndHoldAtTime,
    setValueAtTime = vi.fn(),
  } = options ?? {};

  const gain: Record<string, unknown> = {
    value: initialGain,
    cancelScheduledValues,
    setValueAtTime,
  };
  if (cancelAndHoldAtTime) {
    gain.cancelAndHoldAtTime = cancelAndHoldAtTime;
  }

  const context = { currentTime };
  const media = { volume: initialMediaVolume, muted: initialMuted };
  const player: Record<string, unknown> = {
    volume: initialGain,
    storedVolume: initialGain,
    [mediaProp]: media,
    gainNode: {
      context,
      gain,
    } as unknown as GainNode,
  };

  return {
    player: player as {
      volume: number;
      storedVolume: number;
      audio?: { volume: number; muted: boolean };
      audioElement?: { volume: number; muted: boolean };
      gainNode: GainNode;
    },
    gain: gain as { value: number },
    context,
    media,
    cancelScheduledValues,
    setValueAtTime,
  };
}

describe("translationVolume (GainNode & HTMLMediaElement)", () => {
  test("updates gainNode, intrinsic value, storedVolume, and prevents double attenuation", () => {
    const { player, gain, media, cancelScheduledValues, setValueAtTime } =
      createMockGainPlayer({
        currentTime: 4.5,
        initialMediaVolume: 0.2,
        initialMuted: true,
      });

    safeSetPlayerVolume(player, 0.85);

    expect(cancelScheduledValues).toHaveBeenCalledWith(0);
    expect(gain.value).toBe(0.85);
    expect(setValueAtTime).toHaveBeenCalledWith(0.85, 4.5);
    expect(player.storedVolume).toBe(0.85);
    expect(media.volume).toBe(1);
    expect(media.muted).toBe(false);
  });

  test("hard-mutes underlying media element at zero translation volume and unmutes above zero", () => {
    const { player, gain, media } = createMockGainPlayer({
      currentTime: 0,
      initialMediaVolume: 1,
      initialMuted: false,
    });

    safeSetPlayerVolume(player, 0);
    expect(gain.value).toBe(0);
    expect(player.storedVolume).toBe(0);
    expect(media.muted).toBe(true);

    safeSetPlayerVolume(player, 0.5);
    expect(gain.value).toBe(0.5);
    expect(player.storedVolume).toBe(0.5);
    expect(media.muted).toBe(false);
    expect(media.volume).toBe(1);
  });

  test("handles ChaimuPlayer audioElement the same as AudioPlayer audio", () => {
    const { player, gain, media } = createMockGainPlayer({
      mediaProp: "audioElement",
      initialMediaVolume: 0.3,
      initialMuted: false,
    });

    safeSetPlayerVolume(player, 0);
    expect(media.muted).toBe(true);
    expect(media.volume).toBe(1);

    safeSetPlayerVolume(player, 1);
    expect(gain.value).toBe(1);
    expect(media.muted).toBe(false);
    expect(media.volume).toBe(1);
  });

  test("stays accurate across rapid drags when currentTime is frozen/quantized (Firefox RFP)", () => {
    const { player, gain, media, cancelScheduledValues, setValueAtTime } =
      createMockGainPlayer({ currentTime: 0.1 });

    for (const step of [1, 0.75, 0.4, 0.1, 0, 0.25, 1]) {
      safeSetPlayerVolume(player, step);
      expect(gain.value).toBe(step);
      expect(player.storedVolume).toBe(step);
      expect(media.muted).toBe(step === 0);
    }

    expect(cancelScheduledValues).toHaveBeenCalledTimes(7);
    expect(cancelScheduledValues).toHaveBeenLastCalledWith(0);
    expect(setValueAtTime).toHaveBeenLastCalledWith(1, 0.1);
  });

  test("still updates intrinsic param.value when cancelScheduledValues or setValueAtTime throws", () => {
    const { player, gain, media } = createMockGainPlayer({
      currentTime: 2,
      cancelScheduledValues: vi.fn(() => {
        throw new Error("cancel failed");
      }),
      setValueAtTime: vi.fn(() => {
        throw new Error("schedule failed");
      }),
    });

    safeSetPlayerVolume(player, 0.6);

    expect(gain.value).toBe(0.6);
    expect(player.storedVolume).toBe(0.6);
    expect(media.muted).toBe(false);
  });

  test("falls back to cancelAndHoldAtTime when cancelScheduledValues is unavailable", () => {
    const cancelAndHoldAtTime = vi.fn();
    const setValueAtTime = vi.fn();
    const gain = {
      value: 1,
      cancelAndHoldAtTime,
      setValueAtTime,
    };
    const player = {
      volume: 1,
      gainNode: {
        context: { currentTime: 3.25 },
        gain,
      } as unknown as GainNode,
    };

    safeSetPlayerVolume(player, 0.3);

    expect(cancelAndHoldAtTime).toHaveBeenCalledWith(3.25);
    expect(gain.value).toBe(0.3);
    expect(setValueAtTime).toHaveBeenCalledWith(0.3, 3.25);
  });

  test("supports audio booster gain above 100% with gainNode and clamps without gainNode", () => {
    const { player, gain } = createMockGainPlayer();
    applyTranslationPlaybackVolume(player, 450, 100);
    expect(gain.value).toBe(4.5);
    expect(player.storedVolume).toBe(4.5);

    const plainPlayer = { volume: 1, audio: { volume: 1, muted: false } };
    applyTranslationPlaybackVolume(plainPlayer, 450, 100);
    expect(plainPlayer.volume).toBe(1);
    expect(plainPlayer.audio.muted).toBe(false);
  });

  test("sanitizes NaN, Infinity, and negative values to 0 without throwing", () => {
    for (const invalid of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
      const { player, gain, media } = createMockGainPlayer();
      safeSetPlayerVolume(player, invalid);
      expect(gain.value).toBe(0);
      expect(player.storedVolume).toBe(0);
      expect(media.muted).toBe(true);
    }
  });

  test("falls back to player.volume and mutes media at 0 when gainNode is absent", () => {
    const player = { volume: 1, audio: { volume: 1, muted: false } };

    applyTranslationPlaybackVolume(player, 40, 100);
    expect(player.volume).toBe(0.4);
    expect(player.audio.muted).toBe(false);

    applyTranslationPlaybackVolume(player, 0, 100);
    expect(player.volume).toBe(0);
    expect(player.audio.muted).toBe(true);
  });

  test("restores media.volume to 1 on external volumechange while gainNode is active", () => {
    const listeners: Array<() => void> = [];
    const { player, media } = createMockGainPlayer({ initialMediaVolume: 1 });
    (
      media as typeof media & {
        addEventListener: (type: string, listener: () => void) => void;
      }
    ).addEventListener = (type, listener) => {
      if (type === "volumechange") listeners.push(listener);
    };

    safeSetPlayerVolume(player, 0.7);
    safeSetPlayerVolume(player, 0.8);
    expect(listeners).toHaveLength(1);

    // Simulate third-party volume extension copying video volume onto <audio>.
    media.volume = 0.09;
    listeners[0]();
    expect(media.volume).toBe(1);
  });

  test("caps rapid volumechange restores to prevent infinite loops with hostile hooks", () => {
    const listeners: Array<() => void> = [];
    const { player, media } = createMockGainPlayer({ initialMediaVolume: 1 });
    (
      media as typeof media & {
        addEventListener: (type: string, listener: () => void) => void;
      }
    ).addEventListener = (type, listener) => {
      if (type === "volumechange") listeners.push(listener);
    };

    safeSetPlayerVolume(player, 1);

    for (let i = 0; i < 65; i++) {
      media.volume = 0.1;
      listeners[0]();
    }

    // After burst cap (60 restores in 100ms), guard backs off instead of spinning.
    expect(media.volume).toBe(0.1);
  });

  test("uses fallbackVolumePercent when primary volumePercent is undefined or NaN", () => {
    const player = { volume: 1 };

    applyTranslationPlaybackVolume(player, undefined, 75);
    expect(player.volume).toBe(0.75);

    applyTranslationPlaybackVolume(player, Number.NaN, 30);
    expect(player.volume).toBe(0.3);

    applyTranslationPlaybackVolume(player, Number.NaN, undefined);
    expect(player.volume).toBe(0.3);

    expect(() =>
      applyTranslationPlaybackVolume(undefined, 50, 100),
    ).not.toThrow();
  });
});

describe("volumeLink (delta-based linked sliders)", () => {
  test("seeds state on first call and preserves relative offset between sliders", () => {
    const state: VolumeLinkState = {
      initialized: false,
      lastVideoPercent: 0,
      lastTranslationPercent: 0,
    };

    const down = applyVolumeLinkDelta({
      state,
      fromType: "video",
      newVolume: 10,
      currentVideo: 20,
      currentTranslation: 80,
      translationMin: 0,
      translationMax: 100,
    });
    expect(down).toEqual({ nextTranslation: 70 });
    expect(state).toEqual({
      initialized: true,
      lastVideoPercent: 10,
      lastTranslationPercent: 70,
    });

    const up = applyVolumeLinkDelta({
      state,
      fromType: "translation",
      newVolume: 90,
      currentVideo: 10,
      currentTranslation: 70,
      translationMin: 0,
      translationMax: 100,
    });
    expect(up).toEqual({ nextVideo: 30 });
    expect(state).toEqual({
      initialized: true,
      lastVideoPercent: 30,
      lastTranslationPercent: 90,
    });
  });

  test("caps linked translation range at 100% even when audio booster max is 900%", () => {
    const state: VolumeLinkState = {
      initialized: true,
      lastVideoPercent: 50,
      lastTranslationPercent: 95,
    };

    const result = applyVolumeLinkDelta({
      state,
      fromType: "video",
      newVolume: 80,
      currentVideo: 50,
      currentTranslation: 95,
      translationMin: 0,
      translationMax: 900,
    });

    expect(result).toEqual({ nextTranslation: 100 });
    expect(state.lastTranslationPercent).toBe(100);
  });

  test("applies linked translation delta to playback volume without leaving gain stale", () => {
    const state: VolumeLinkState = {
      initialized: true,
      lastVideoPercent: 0,
      lastTranslationPercent: 15,
    };
    const { player, gain, setValueAtTime } = createMockGainPlayer({
      currentTime: 1,
      initialGain: 0.15,
    });

    const result = applyVolumeLinkDelta({
      state,
      fromType: "video",
      newVolume: 85,
      currentVideo: 0,
      currentTranslation: 15,
      translationMin: 0,
      translationMax: 100,
    });

    expect(result).toEqual({ nextTranslation: 100 });
    applyTranslationPlaybackVolume(player, result.nextTranslation, 15);
    expect(gain.value).toBe(1);
    expect(setValueAtTime).toHaveBeenCalledWith(1, 1);
    expect(player.storedVolume).toBe(1);
  });

  test("sync snapshot helpers prevent stale deltas after syncVolume was paused", () => {
    const state: VolumeLinkState = {
      initialized: true,
      lastVideoPercent: 10,
      lastTranslationPercent: 20,
    };

    syncVideoLinkSnapshot(state, 50);
    syncTranslationLinkSnapshot(state, 90);

    const result = applyVolumeLinkDelta({
      state,
      fromType: "video",
      newVolume: 55,
      currentVideo: 50,
      currentTranslation: 90,
      translationMin: 0,
      translationMax: 100,
    });

    expect(result).toEqual({ nextTranslation: 95 });
  });
});

describe("utils/volume math", () => {
  test("clamps and converts volume percentages and 0..1 values accurately", () => {
    expect(clampInt(42.9, 0, 100)).toBe(42);
    expect(clampPercentInt(Number.NaN)).toBe(0);
    expect(clampPercentInt(150)).toBe(100);
    expect(clampPercentInt(-5)).toBe(0);
    expect(volume01ToPercent(0.15)).toBe(15);
    expect(percentToVolume01(15)).toBe(0.15);
  });

  test("snaps volume steps and converges without overshooting desired target", () => {
    expect(snapVolume01(0.154, "nearest")).toBe(0.15);
    expect(snapVolume01(0.154, "down")).toBe(0.15);
    expect(snapVolume01(0.154, "up")).toBe(0.16);

    expect(snapVolume01Towards(0.141, 0.2, 0.15)).toBe(0.15);
    expect(snapVolume01Towards(0.259, 0.2, 0.25)).toBe(0.25);
  });
});

describe("smartDuckingRuntime + translation volume integration", () => {
  test("setupAudioSettings applies defaultVolume to gainNode and forces classic mode when syncVolume is enabled", async () => {
    (globalThis as unknown as { DEBUG_MODE: boolean }).DEBUG_MODE = false;
    const { setupAudioSettings } = await import(
      "../src/videoHandler/modules/smartDuckingRuntime.ts"
    );
    const { player, gain, media } = createMockGainPlayer({
      initialGain: 1,
      initialMediaVolume: 0.5,
    });

    let videoVolume = 0.8;
    const handler = {
      data: {
        defaultVolume: 65,
        enabledAutoVolume: true,
        enabledSmartDucking: true,
        syncVolume: true,
        autoVolume: 15,
      },
      audioPlayer: { player },
      hasActiveSource: () => true,
      getVideoVolume: () => videoVolume,
      isMuted: () => false,
      setVideoVolume: (v: number) => {
        videoVolume = v;
      },
      setVideoMuted: vi.fn(),
    } as any;

    setupAudioSettings.call(handler);

    expect(gain.value).toBe(0.65);
    expect(player.storedVolume).toBe(0.65);
    expect(media.volume).toBe(1);
    expect(media.muted).toBe(false);
    // syncVolume disables smart ducking and uses classic autoVolume (15%).
    expect(handler.smartVolumeDuckingInterval).toBeUndefined();
    expect(videoVolume).toBe(0.15);
    expect(handler.smartVolumeDuckingBaseline).toBe(0.8);
  });

  test("applyManualVideoVolumeOverride updates baseline (including 0%) only while autoVolume is active", async () => {
    (globalThis as unknown as { DEBUG_MODE: boolean }).DEBUG_MODE = false;
    const { applyManualVideoVolumeOverride } = await import(
      "../src/videoHandler/modules/smartDuckingRuntime.ts"
    );

    const handler = {
      data: { enabledAutoVolume: true },
      hasActiveSource: () => true,
      smartVolumeDuckingBaseline: 0.8,
      smartVolumeLastApplied: 0.16,
    } as any;

    applyManualVideoVolumeOverride.call(handler, 0);
    expect(handler.smartVolumeDuckingBaseline).toBe(0);
    expect(handler.smartVolumeLastApplied).toBe(0);

    applyManualVideoVolumeOverride.call(handler, 0.45);
    expect(handler.smartVolumeDuckingBaseline).toBe(0.45);
    expect(handler.smartVolumeLastApplied).toBe(0.45);

    handler.data.enabledAutoVolume = false;
    applyManualVideoVolumeOverride.call(handler, 0.9);
    expect(handler.smartVolumeDuckingBaseline).toBe(0.45);
  });

  test("muting translation to 0% releases smart ducking so original video restores to baseline", () => {
    const { player, media } = createMockGainPlayer();
    const config = {
      ...SMART_DUCKING_DEFAULT_CONFIG,
      rmsAttackTauMs: 0,
      rmsReleaseTauMs: 0,
      attackTauMs: 0,
      releaseTauMs: 0,
      maxDownPerSec: 100,
      maxUpPerSec: 100,
      holdMs: 100,
    };

    let runtime = initSmartDuckingRuntime(1.0);
    let videoVol = 1.0;

    // Translation speaking at 100% -> video ducks to 20%.
    safeSetPlayerVolume(player, 1);
    const ducked = computeSmartDuckingStep(
      {
        nowMs: 0,
        translationActive: true,
        enabledAutoVolume: true,
        smartEnabled: true,
        audioIsPlaying: !media.muted,
        rms: 0.05,
        currentVideoVolume: videoVol,
        hostVideoActive: true,
        duckingStrength01: 0.8,
        volumeOnStart: 1.0,
      },
      runtime,
      config,
    );
    expect(ducked.kind).toBe("apply");
    if (ducked.kind === "apply") {
      videoVol = ducked.volume01;
      runtime = ducked.runtime;
    }
    expect(videoVol).toBe(0.2);

    // User sets translation volume to 0% -> media.muted becomes true -> after holdMs video restores to 100%.
    safeSetPlayerVolume(player, 0);
    expect(media.muted).toBe(true);

    const restored = computeSmartDuckingStep(
      {
        nowMs: 250,
        translationActive: true,
        enabledAutoVolume: true,
        smartEnabled: true,
        audioIsPlaying: !media.muted,
        rms: 0,
        currentVideoVolume: videoVol,
        hostVideoActive: true,
        duckingStrength01: 0.8,
        volumeOnStart: 1.0,
      },
      runtime,
      config,
    );
    expect(restored.kind).toBe("apply");
    if (restored.kind === "apply") {
      expect(restored.volume01).toBe(1);
    }
  });
});
