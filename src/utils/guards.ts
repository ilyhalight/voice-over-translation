export function isObjectLike(value: unknown): value is object {
  return value !== null && typeof value === "object";
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return isObjectLike(value) && !Array.isArray(value);
}
