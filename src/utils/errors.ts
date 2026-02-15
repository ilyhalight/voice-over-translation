/**
 * Small error helpers used across the project.
 */

/**
 * Extracts a human-readable error message from various error shapes.
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;

  const anyErr = error as any;

  // Common shapes: {data:{message}}, {error:{message}}, Error
  return (
    anyErr?.data?.message ||
    anyErr?.error?.message ||
    anyErr?.message ||
    (typeof anyErr?.toString === "function" ? anyErr.toString() : "") ||
    String(anyErr)
  );
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
