import { describe, expect, test } from "bun:test";
import { clamp } from "../src/utils/number.ts";
import { safeSetPlayerVolume } from "../src/videoHandler/translationVolume.ts";

describe("clamp", () => {
  test("clamps finite and infinite values into bounds", () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
    expect(clamp(-3, 0, 1)).toBe(0);
    expect(clamp(3, 0, 1)).toBe(1);
    expect(clamp(Number.NEGATIVE_INFINITY, 0, 1)).toBe(0);
    expect(clamp(Number.POSITIVE_INFINITY, 0, 1)).toBe(1);
  });

  test("returns min for NaN and reversed bounds", () => {
    expect(clamp(Number.NaN, 0, 1)).toBe(0);
    expect(clamp(5, 10, 2)).toBe(10);
  });

  test("uses 0..100 defaults", () => {
    expect(clamp(150)).toBe(100);
    expect(clamp(-1)).toBe(0);
  });
});

describe("safeSetPlayerVolume", () => {
  test("maps non-finite volume to 0 for media element players", () => {
    for (const value of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ]) {
      const player = { volume: 0.5 };
      safeSetPlayerVolume(player, value);
      expect(player.volume).toBe(0);
    }
  });

  test("clamps finite volume for media element players", () => {
    const player = { volume: 0.5 };
    safeSetPlayerVolume(player, 2);
    expect(player.volume).toBe(1);
    safeSetPlayerVolume(player, -1);
    expect(player.volume).toBe(0);
    safeSetPlayerVolume(player, 0.3);
    expect(player.volume).toBe(0.3);
  });

  test("maps non-finite volume to 0 for gain-backed players", () => {
    for (const value of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ]) {
      const gain = { value: 1 };
      const player = {
        volume: 1,
        gainNode: { gain, context: undefined },
      } as unknown as Parameters<typeof safeSetPlayerVolume>[0];
      safeSetPlayerVolume(player, value);
      expect(gain.value).toBe(0);
    }
  });

  test("allows booster gain above 1", () => {
    const gain = { value: 1 };
    const player = {
      volume: 1,
      gainNode: { gain, context: undefined },
    } as unknown as Parameters<typeof safeSetPlayerVolume>[0];
    safeSetPlayerVolume(player, 3);
    expect(gain.value).toBe(3);
    safeSetPlayerVolume(player, -1);
    expect(gain.value).toBe(0);
  });
});
