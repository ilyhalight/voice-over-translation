import { isAbortError, makeAbortError } from "./errors";

export const NEVER_ABORTED_SIGNAL = new AbortController().signal;

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
  const hasEffectiveTimeout = Number.isFinite(timeoutMs) && timeoutMs > 0;

  // If timeout is disabled (0/negative/NaN), just mirror the external signal.
  if (!hasEffectiveTimeout) {
    return {
      signal: external ?? NEVER_ABORTED_SIGNAL,
      cleanup: () => {},
    };
  }

  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const onExternalAbort = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    controller.abort(external?.reason);
  };

  if (external) {
    external.addEventListener("abort", onExternalAbort, { once: true });
    if (external.aborted) {
      onExternalAbort();
    }
  }

  if (!controller.signal.aborted) {
    timeoutId = setTimeout(() => {
      controller.abort(makeAbortError("Timeout"));
      timeoutId = undefined;
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      external?.removeEventListener("abort", onExternalAbort);
    },
  };
}
