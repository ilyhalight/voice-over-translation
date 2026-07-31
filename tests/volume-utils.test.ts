import { describe, expect, test } from "bun:test";
import {
  clampPercentInt,
  percentToVolume01,
  snapVolume01,
  volume01ToPercent,
} from "../src/utils/volume";

describe("volume01ToPercent (with epsilon fix)", () => {
  test("converts 0 to 0", () => {
    expect(volume01ToPercent(0)).toBe(0);
  });

  test("converts 1 to 100", () => {
    expect(volume01ToPercent(1)).toBe(100);
  });

  test("converts 0.5 to 50", () => {
    expect(volume01ToPercent(0.5)).toBe(50);
  });

  test("converts 0.25 to 25", () => {
    expect(volume01ToPercent(0.25)).toBe(25);
  });

  test("converts 0.75 to 75", () => {
    expect(volume01ToPercent(0.75)).toBe(75);
  });

  test("rounds 0.333... to 33", () => {
    expect(volume01ToPercent(1 / 3)).toBe(33);
  });

  test("rounds 0.666... to 67", () => {
    expect(volume01ToPercent(2 / 3)).toBe(67);
  });

  test("does NOT produce off-by-one for 0.99 (should be 99, not 98)", () => {
    // 0.99 * 100 = 99.00000000000001 → round(99.00000000000001) = 99 ✓
    expect(volume01ToPercent(0.99)).toBe(99);
  });

  test("does NOT produce off-by-one for 0.01 (should be 1, not 0)", () => {
    // 0.01 * 100 = 1.0000000000000002 → round(...) = 1 ✓
    expect(volume01ToPercent(0.01)).toBe(1);
  });

  test("clamps values above 1 to 100", () => {
    expect(volume01ToPercent(1.5)).toBe(100);
    expect(volume01ToPercent(2)).toBe(100);
  });

  test("clamps values below 0 to 0", () => {
    expect(volume01ToPercent(-0.5)).toBe(0);
    expect(volume01ToPercent(-1)).toBe(0);
  });

  test("handles NaN gracefully", () => {
    expect(volume01ToPercent(Number.NaN)).toBe(0);
  });

  test("handles Infinity gracefully (clamps to 0 by clampNumber)", () => {
    // Note: `clampNumber` returns `min` (0) for non-finite values, so
    // Infinity → 0 (not 100). This is intentional defensive behavior.
    expect(volume01ToPercent(Number.POSITIVE_INFINITY)).toBe(0);
    expect(volume01ToPercent(Number.NEGATIVE_INFINITY)).toBe(0);
  });
});

describe("round-trip: percent → volume01 → percent", () => {
  test("common percentages survive round-trip", () => {
    for (const p of [0, 1, 5, 10, 15, 25, 33, 50, 67, 75, 90, 95, 99, 100]) {
      const v = percentToVolume01(p);
      const back = volume01ToPercent(v);
      // Allow ±1 tolerance for floating-point edge cases, but most should
      // be exact.
      expect(Math.abs(back - p)).toBeLessThanOrEqual(1);
    }
  });
});

describe("clampPercentInt", () => {
  test("clamps to [0, 100]", () => {
    expect(clampPercentInt(-5)).toBe(0);
    expect(clampPercentInt(0)).toBe(0);
    expect(clampPercentInt(50)).toBe(50);
    expect(clampPercentInt(100)).toBe(100);
    expect(clampPercentInt(150)).toBe(100);
  });

  test("rounds non-integer values", () => {
    expect(clampPercentInt(33.4)).toBe(33);
    expect(clampPercentInt(33.5)).toBe(34);
    expect(clampPercentInt(33.6)).toBe(34);
  });

  test("handles NaN by returning min", () => {
    expect(clampPercentInt(Number.NaN)).toBe(0);
  });
});

describe("snapVolume01", () => {
  test("snaps to nearest 0.01 step", () => {
    expect(snapVolume01(0.345)).toBeCloseTo(0.35, 10);
    expect(snapVolume01(0.344)).toBeCloseTo(0.34, 10);
  });

  test("clamps to [0, 1]", () => {
    expect(snapVolume01(1.5)).toBe(1);
    expect(snapVolume01(-0.5)).toBe(0);
  });
});
