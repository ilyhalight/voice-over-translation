import { isAbortError, makeAbortError } from "./errors";

/**
 * Throws a canonical AbortError if the provided signal is aborted.
 *
 * Runtimes that implement `AbortSignal.throwIfAborted()` throw `signal.reason`,
 * which can be *any* value. We normalize cancellation to a standard
 * `AbortError` so callers can reliably use `isAbortError()`.
 */
export function throwIfAborted(signal: AbortSignal): void {
  const maybeThrow = (signal as any).throwIfAborted as undefined | (() => void);

  if (typeof maybeThrow === "function") {
    try {
      maybeThrow.call(signal);
      return;
    } catch (e) {
      if (signal.aborted || isAbortError(e)) {
        throw makeAbortError();
      }

      throw e instanceof Error ? e : new Error(String(e));
    }
  }

  if (signal.aborted) {
    throw makeAbortError();
  }
}

export type TimeoutSignalResult = {
  signal: AbortSignal;
  didTimeout: () => boolean;
  cleanup: () => void;
};

/**
 * Creates an AbortSignal that auto-aborts after `timeoutMs`.
 *
 * If an `external` signal is provided, the returned signal is aborted when
 * *either* external aborts or the timeout elapses.
 */
export function createTimeoutSignal(
  timeoutMs: number,
  external?: AbortSignal | null,
): TimeoutSignalResult {
  const hasTimeout =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal;
  const hasAny = typeof AbortSignal !== "undefined" && "any" in AbortSignal;

  let timedOut = false;
  const hasEffectiveTimeout = Number.isFinite(timeoutMs) && timeoutMs > 0;

  // If timeout is disabled (0/negative/NaN), just mirror the external signal.
  if (!hasEffectiveTimeout) {
    if (external) {
      return { signal: external, didTimeout: () => false, cleanup: () => {} };
    }

    const controller = new AbortController();
    return {
      signal: controller.signal,
      didTimeout: () => false,
      cleanup: () => {},
    };
  }

  // Modern path (Chromium/Firefox/Node runtimes): AbortSignal.timeout + AbortSignal.any.
  if (hasTimeout && hasAny) {
    const timeoutSignal = (AbortSignal as any).timeout(
      timeoutMs,
    ) as AbortSignal;
    const signal = (AbortSignal as any).any(
      external ? [external, timeoutSignal] : [timeoutSignal],
    ) as AbortSignal;

    // AbortSignal.timeout doesn't expose a "did timeout" indicator, so track it.
    const id = setTimeout(() => {
      timedOut = true;
    }, timeoutMs);

    return {
      signal,
      didTimeout: () => timedOut,
      cleanup: () => clearTimeout(id),
    };
  }

  // Compatibility path.
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort(external?.reason);

  if (external) {
    if (external.aborted) {
      controller.abort(external.reason);
    } else {
      external.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  const id = setTimeout(() => {
    timedOut = true;
    controller.abort(makeAbortError("Timeout"));
  }, timeoutMs);

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(id);
      external?.removeEventListener("abort", onExternalAbort);
    },
  };
}
