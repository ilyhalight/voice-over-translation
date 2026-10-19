export function clamp(value: number, min = 0, max = 100): number {
  if (Number.isNaN(value) || max < min) return min;
  return Math.min(Math.max(value, min), max);
}
