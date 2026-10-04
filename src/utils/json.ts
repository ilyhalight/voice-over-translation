type PlainRecord = Record<string, unknown>;

export type StringifyCircularSafeOptions = {
  sortKeys?: boolean;
};

/**
 * Throws like `JSON.stringify` (e.g. on bigint) and can return `undefined`.
 * Objects referenced more than once are also marked as "[Circular]".
 */
export function stringifyCircularSafe(
  value: unknown,
  { sortKeys = false }: StringifyCircularSafeOptions = {},
): string | undefined {
  const seen = new WeakSet<object>();

  return JSON.stringify(value, (_key, val) => {
    if (typeof val !== "object" || val === null) {
      return val;
    }
    if (seen.has(val)) {
      return "[Circular]";
    }

    seen.add(val);
    if (!sortKeys || Array.isArray(val)) {
      return val;
    }

    const sorted: PlainRecord = {};
    const keys = Object.keys(val as PlainRecord).sort((a, b) =>
      a.localeCompare(b),
    );
    for (const key of keys) {
      sorted[key] = (val as PlainRecord)[key];
    }

    return sorted;
  });
}
