/**
 * Small error helpers used across the project.
 */

function stringifyUnknownObject(value: object): string | null {
  const seen = new WeakSet<object>();
  try {
    const serialized = JSON.stringify(value, (_key, currentValue) => {
      if (typeof currentValue !== "object" || currentValue === null) {
        return currentValue;
      }
      if (seen.has(currentValue)) {
        return "[Circular]";
      }
      seen.add(currentValue);
      return currentValue;
    });
    return serialized ?? null;
  } catch {
    return null;
  }
}

function extractNestedMessage(error: Record<string, any>): string | null {
  const candidates = [
    error?.data?.message,
    error?.error?.message,
    error?.message,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate) {
      return candidate;
    }
  }

  return null;
}

function formatObjectError(error: object, fallback: string): string {
  const nestedMessage = extractNestedMessage(error as Record<string, any>);
  if (nestedMessage) {
    return nestedMessage;
  }

  const serialized = stringifyUnknownObject(error);
  if (serialized && serialized !== "{}") {
    return serialized;
  }

  const ctorName = (error as { constructor?: { name?: string } }).constructor
    ?.name;
  return ctorName ? `[${ctorName}]` : fallback;
}

function formatPrimitiveError(
  error: Exclude<unknown, object | string | null | undefined>,
  fallback: string,
): string {
  if (
    typeof error === "number" ||
    typeof error === "boolean" ||
    typeof error === "bigint"
  ) {
    return `${error}`;
  }
  if (typeof error === "symbol") {
    return error.description ? `Symbol(${error.description})` : "Symbol";
  }
  if (typeof error === "function") {
    return error.name ? `[Function ${error.name}]` : "[Function]";
  }

  return fallback;
}

export function toErrorMessage(
  error: unknown,
  fallback = "Unknown error",
): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === "string") {
    return error || fallback;
  }
  if (error === null || error === undefined) {
    return fallback;
  }

  if (typeof error === "object") {
    return formatObjectError(error, fallback);
  }

  return formatPrimitiveError(error, fallback);
}

/**
 * Extracts a human-readable error message from various error shapes.
 */
export function getErrorMessage(error: unknown): string {
  return toErrorMessage(error, "");
}

export function isAbortError(err: unknown): boolean {
  const anyErr = err as any;
  return (
    (typeof DOMException !== "undefined" &&
      anyErr instanceof DOMException &&
      anyErr.name === "AbortError") ||
    (anyErr instanceof Error && anyErr.name === "AbortError") ||
    anyErr?.message === "AbortError"
  );
}

/**
 * Creates a canonical AbortError instance. Prefer DOMException when available.
 *
 * Note: This is intentionally not coupled to AbortSignal.reason to avoid
 * surfacing string/opaque abort reasons as user-facing "errors".
 */
export function makeAbortError(message = "Aborted"): Error {
  try {
    return new DOMException(message, "AbortError");
  } catch {
    const err = new Error(message);
    (err as any).name = "AbortError";
    return err;
  }
}
