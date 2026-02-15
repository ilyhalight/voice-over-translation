/**
 * Volume utilities.
 *
 * UI volume mostly uses integer percentages.
 * - Video volume: 0..100 (maps to HTMLMediaElement.volume in 0..1)
 * - Translation volume: 0..100 by default, can be >100 with booster mode
 */

type QuantizeDirection = "nearest" | "down" | "up";

const VIDEO_VOLUME_MIN_PERCENT = 0;
const VIDEO_VOLUME_MAX_PERCENT = 100;
export const VIDEO_VOLUME_STEP_01 = 0.01;

const EPS = 1e-6;

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  if (max < min) return min;
  return Math.max(min, Math.min(max, value));
}

export function clampInt(value: number, min: number, max: number): number {
  return Math.trunc(clampNumber(value, min, max));
}

export function clampPercentInt(
  value: number,
  min = VIDEO_VOLUME_MIN_PERCENT,
  max = VIDEO_VOLUME_MAX_PERCENT,
): number {
  if (!Number.isFinite(value)) return min;
  return clampInt(Math.round(value), min, max);
}

export function volume01ToPercent(volume01: number): number {
  const v = clampNumber(volume01, 0, 1);
  return clampPercentInt(v * 100);
}

export function percentToVolume01(percent: number): number {
  return clampPercentInt(percent) / 100;
}

function quantizeToStep(
  value: number,
  step: number,
  direction: QuantizeDirection,
): number {
  if (!Number.isFinite(value)) return value;
  if (!Number.isFinite(step) || step <= 0) return value;

  const inv = 1 / step;
  const scaled = value * inv;

  switch (direction) {
    case "down":
      return Math.floor(scaled + EPS) / inv;
    case "up":
      return Math.ceil(scaled - EPS) / inv;
    default:
      return Math.round(scaled) / inv;
  }
}

export function snapVolume01(
  volume01: number,
  direction: QuantizeDirection = "nearest",
  step = VIDEO_VOLUME_STEP_01,
): number {
  const clamped = clampNumber(volume01, 0, 1);
  const quantized = quantizeToStep(clamped, step, direction);
  return clampNumber(quantized, 0, 1);
}

export function snapVolume01Towards(
  next: number,
  current: number,
  desired: number,
  step = VIDEO_VOLUME_STEP_01,
): number {
  const cur = clampNumber(current, 0, 1);
  const des = clampNumber(desired, 0, 1);

  if (des < cur) {
    const q = snapVolume01(next, "down", step);
    return Math.max(des, q);
  }

  if (des > cur) {
    const q = snapVolume01(next, "up", step);
    return Math.min(des, q);
  }

  return snapVolume01(next, "nearest", step);
}
