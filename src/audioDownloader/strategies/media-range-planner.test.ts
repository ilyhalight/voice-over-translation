import { expect, test } from "bun:test";

const {
  createMediaRangePlanner,
  mediaRangeParallelism,
  MEDIA_RANGE_MAX_BYTES,
  MEDIA_RANGE_MIN_BYTES,
  MEDIA_RANGE_SLOW_MAX_BYTES,
  MEDIA_RANGE_START_BYTES,
  nextMediaRangeSize,
} = await import("./rangePlanner");

const MB = 1024 * 1024;

test("starts with the proven probe size and overlaps three ranges", () => {
  const planner = createMediaRangePlanner();
  expect(planner.rangeSize).toBe(MEDIA_RANGE_START_BYTES);
  expect(planner.rangeSize).toBe(4 * MB);
  expect(planner.parallelism).toBe(3);
});

test("grows up to the throttle limit on a fast connection", () => {
  const planner = createMediaRangePlanner();
  const sizes: number[] = [];
  for (let index = 0; index < 4; index++) {
    const bytes = planner.rangeSize;
    planner.complete({ bytes, durationMs: 500, latencyMs: 80 });
    sizes.push(planner.rangeSize / MB);
  }
  // 4 -> 8 and then held: above ~10 MiB YouTube paces the answer again.
  expect(sizes).toEqual([8, 8, 8, 8]);
  expect(planner.rangeSize).toBe(MEDIA_RANGE_MAX_BYTES);
  // Bigger ranges overlap less, so the bytes in flight stay comparable.
  expect(planner.parallelism).toBe(2);
});

test("shrinks on a slow, laggy or flaky connection", () => {
  // 0.2 MiB/s: keep the ranges small so a dropped answer costs little.
  expect(
    nextMediaRangeSize(8 * MB, { bytes: 2 * MB, durationMs: 10_000 }),
  ).toBe(4 * MB);
  // Fast but laggy: the round trip is what the request pays for.
  expect(
    nextMediaRangeSize(8 * MB, {
      bytes: 8 * MB,
      durationMs: 500,
      latencyMs: 1_500,
    }),
  ).toBe(4 * MB);
  // A retry, a redirect or a re-signed URL caps the size whatever it measured.
  expect(
    nextMediaRangeSize(8 * MB, {
      bytes: 8 * MB,
      durationMs: 100,
      latencyMs: 10,
      unstable: true,
    }),
  ).toBe(MEDIA_RANGE_SLOW_MAX_BYTES);
  // Never below the floor: more requests than bytes helps nobody.
  expect(
    nextMediaRangeSize(MEDIA_RANGE_MIN_BYTES, {
      bytes: 1,
      durationMs: 10_000,
      unstable: true,
    }),
  ).toBe(MEDIA_RANGE_MIN_BYTES);
  // In between: what works is kept.
  expect(
    nextMediaRangeSize(4 * MB, {
      bytes: 4 * MB,
      durationMs: 2_000,
      latencyMs: 600,
    }),
  ).toBe(4 * MB);
});

test("keeps every size inside the corridor and away from the throttle", () => {
  const planner = createMediaRangePlanner();
  for (const sample of [
    { bytes: 4 * MB, durationMs: 100, latencyMs: 5 },
    { bytes: 8 * MB, durationMs: 100, latencyMs: 5 },
    { bytes: 8 * MB, durationMs: 100, latencyMs: 5 },
    { bytes: 1, durationMs: 30_000, latencyMs: 4_000 },
    { bytes: 1, durationMs: 30_000, unstable: true },
  ]) {
    planner.complete(sample);
    expect(planner.rangeSize).toBeGreaterThanOrEqual(MEDIA_RANGE_MIN_BYTES);
    expect(planner.rangeSize).toBeLessThanOrEqual(MEDIA_RANGE_MAX_BYTES);
    expect(planner.rangeSize).toBeLessThan(10 * MB);
    expect(planner.parallelism).toBe(mediaRangeParallelism(planner.rangeSize));
  }
});
