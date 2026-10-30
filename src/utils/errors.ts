/**
 * Small error helpers used across the project.
 */

import { stringifyCircularSafe } from "./json";

function stringifyUnknownObject(value: object): string | null {
  try {
    return stringifyCircularSafe(value) ?? null;
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
 * Coarse, content-free failure class (safe to send in telemetry). Raw errors
 * may carry response data, so only fixed labels are ever derived from them.
 */
export function categorizeFailure(error: unknown): string {
  if (!error) return "unknown";

  const err = error as any;
  const status =
    err.status ?? err.statusCode ?? err.response?.status ?? err.data?.status;
  if (
    typeof status === "number" &&
    Number.isInteger(status) &&
    status >= 400 &&
    status <= 599
  ) {
    return `status:${status}`;
  }

  const text = [
    typeof error === "string" ? error : "",
    err.message,
    typeof err.error === "string" ? err.error : err.error?.message,
    err.cause?.message,
    typeof err.data?.data === "string" ? err.data.data : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Bare parenthesized numbers only match error codes (4xx/5xx): "(140)" is
  // often an audio format id, not an HTTP status.
  const statusMatch =
    /(?:\b(?:HTTP\s*|status\s*:?\s*)([1-5]\d{2})\b|\(([45]\d{2})\))/i.exec(
      text,
    );
  if (statusMatch) return `status:${statusMatch[1] ?? statusMatch[2]}`;

  if (
    /time[-_\s]?out|timed\s*out|\bstall(?:s|ed|ing)?\b/i.test(text) ||
    err.name === "TimeoutError"
  ) {
    return "timeout";
  }
  if (
    /abort/i.test(text) ||
    err.name === "AbortError" ||
    (err.code === 1 &&
      (err.constructor?.name === "MediaError" || err.name === "MediaError"))
  ) {
    return "abort";
  }
  if (
    /network|failed to fetch|connect|refused|offline|dns|load failed|terminated/i.test(
      text,
    ) ||
    err.name === "NetworkError"
  ) {
    return "network";
  }
  if (
    /decode|no audio context|no blob url|audio element is missing/i.test(
      text,
    ) ||
    err.name === "EncodingError"
  ) {
    return "decode";
  }
  if (
    /no\s+(?:[\w-]+\s+){0,3}audio\s+track|could\s+not\s+resolve\s+[\w-]+\s+audio\s+language|no\s+compatible\s+[\w-]+\s+format/i.test(
      text,
    )
  ) {
    return "no_audio_track";
  }
  if (
    /config is unavailable|metadata is unavailable|client context is unavailable/i.test(
      text,
    )
  ) {
    return "config_unavailable";
  }
  if (/empty (?:audio|mse stream)|without audio chunks/i.test(text))
    return "empty_audio";

  if (
    typeof err.name === "string" &&
    err.name !== "Error" &&
    err.name !== "Object" &&
    /^[A-Za-z0-9_$]{1,40}$/.test(err.name)
  ) {
    return err.name;
  }

  return "unknown";
}

/**
 * Creates a canonical AbortError instance. Prefer DOMException when available.
 *
 * Note: This is intentionally not coupled to AbortSignal.reason to avoid
 * surfacing string/opaque abort reasons as user-facing "errors".
 */
export function makeAbortError(reason: unknown = "Aborted"): Error {
  if (reason instanceof Error && isAbortError(reason)) return reason;
  let message: string;
  if (reason instanceof Error) {
    message = reason.message;
  } else if (typeof reason === "object" && reason !== null) {
    message = toErrorMessage(reason, "Aborted");
  } else {
    message = String(reason ?? "Aborted");
  }
  try {
    return new DOMException(message, "AbortError");
  } catch {
    const err = new Error(message);
    (err as any).name = "AbortError";
    return err;
  }
}

/**
 * Safely reads a nested field from an unknown value.
 *
 * Returns `undefined` when any intermediate property is missing or not an
 * object, eliminating the repetitive null-check > cast > access pattern
 * that was scattered across error-handling code.
 *
 * @example
 * safeNestedGet(err, ["data", "message"])  // err?.data?.message
 * safeNestedGet(err, ["status"])           // err?.status
 */
export function safeNestedGet(
  value: unknown,
  path: [string, ...string[]],
): unknown {
  let current: unknown = value;
  for (const key of path) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}
