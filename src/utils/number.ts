export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  if (max < min) return min;
  return Math.max(min, Math.min(max, value));
}

export function clampNumberWithSortedBounds(
  value: number,
  min: number,
  max: number,
): number {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  return Math.min(Math.max(value, lower), upper);
}
