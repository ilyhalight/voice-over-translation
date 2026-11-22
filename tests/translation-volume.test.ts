import { describe, expect, test, vi } from "vitest";
import {
  applyTranslationPlaybackVolume,
  safeSetPlayerVolume,
} from "../src/videoHandler/translationVolume";
import {
  applyVolumeLinkDelta,
  type VolumeLinkState,
} from "../src/videoHandler/volumeLink";

describe("translationVolume", () => {
  test("updates gainNode, intrinsic value, storedVolume, and prevents double attenuation", () => {
    const cancelScheduledValues = vi.fn();
    const setValueAtTime = vi.fn();
    const gain = {
      value: 1,
      cancelScheduledValues,
      setValueAtTime,
    };
    const player = {
      volume: 1,
      storedVolume: 1,
      audio: { volume: 0.2, muted: true },
      gainNode: {
        context: { currentTime: 4.5 },
        gain,
      } as unknown as GainNode,
    };

    safeSetPlayerVolume(player, 0.85);

    expect(cancelScheduledValues).toHaveBeenCalledWith(0);
    expect(gain.value).toBe(0.85);
    expect(setValueAtTime).toHaveBeenCalledWith(0.85, 4.5);
    expect(player.storedVolume).toBe(0.85);
    expect(player.audio.volume).toBe(1);
    expect(player.audio.muted).toBe(false);
  });

  test("hard-mutes underlying media element at zero translation volume", () => {
    const gain = {
      value: 1,
      cancelScheduledValues: vi.fn(),
      setValueAtTime: vi.fn(),
    };
    const player = {
      volume: 1,
      storedVolume: 1,
      audio: { volume: 1, muted: false },
      gainNode: {
        context: { currentTime: 0 },
        gain,
      } as unknown as GainNode,
    };

    safeSetPlayerVolume(player, 0);

    expect(gain.value).toBe(0);
    expect(player.storedVolume).toBe(0);
    expect(player.audio.muted).toBe(true);
  });

  test("falls back to player.volume when gainNode is absent", () => {
    const player = { volume: 1 };

    applyTranslationPlaybackVolume(player, 40, 100);

    expect(player.volume).toBe(0.4);
  });

  test("applies linked translation delta to playback volume without leaving gain stale", () => {
    const state: VolumeLinkState = {
      initialized: true,
      lastVideoPercent: 0,
      lastTranslationPercent: 15,
    };
    const setValueAtTime = vi.fn();
    const gain = {
      value: 0.15,
      cancelScheduledValues: vi.fn(),
      setValueAtTime,
    };
    const player = {
      volume: 0.15,
      storedVolume: 0.15,
      gainNode: {
        context: { currentTime: 1 },
        gain,
      } as unknown as GainNode,
    };

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
});
