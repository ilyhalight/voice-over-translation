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
  let cleaned = false;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    external?.removeEventListener("abort", onExternalAbort);
  };

  const onExternalAbort = () => {
    cleanup();
    controller.abort(external?.reason);
  };

  if (external) {
    external.addEventListener("abort", onExternalAbort, { once: true });
    if (external.aborted) {
      onExternalAbort();
      return { signal: controller.signal, cleanup };
    }
  }

  timeoutId = setTimeout(() => {
    cleanup();
    controller.abort(makeAbortError("Timeout"));
  }, timeoutMs);

  return { signal: controller.signal, cleanup };
}

/**
 * Options for `createAbortableDelay`.
 */
export type AbortableDelayOptions = {
  /**
   * Called with the internal timeout ID once it is scheduled.
   * Useful for callers that need to clear the timeout externally
   * (e.g. storing it on a host for later cleanup).
   */
  onScheduled?: (timeoutId: ReturnType<typeof setTimeout>) => void;
};

/**
 * Returns a promise that resolves after `delayMs` and rejects if `signal`
 * is aborted before the delay elapses.
 *
 * Unlike `createAbortableWaiter`, the timeout here is a *delay* — the promise
 * resolves on expiry so the caller can proceed with the next action (e.g.
 * a retry). The promise only rejects when the external `signal` is aborted
 * (i.e. the operation was cancelled).
 */
export function createAbortableDelay(
  delayMs: number,
  signal: AbortSignal,
  options?: AbortableDelayOptions,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(makeAbortError());
      return;
    }

    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);
    options?.onScheduled?.(timeoutId);

    function onAbort() {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      reject(makeAbortError());
    }

    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export type AbortableWaiterOptions = {
  /**
   * Called with the internal timeout ID once it is scheduled.
   * Useful for callers that need to clear the timeout externally
   * (e.g. storing it on a handler for later cleanup).
   */
  onScheduled?: (timeoutId: ReturnType<typeof setTimeout> | undefined) => void;
  /**
   * Called when the waiter settles for any reason (timeout, abort,
   * or external `settle` call). Runs *before* the promise resolves/rejects.
   */
  onSettled?: () => void;
};

/**
 * Generic abortable waiter that unifies the "create a Promise that settles
 * on timeout, abort-signal, or external event" pattern.
 *
 * Previously duplicated between `waitForAbortableTimeout` (timeout-driven)
 * and `waitForAudioDownloadCompletion` (event-driven with external settle).
 *
 * Uses `AbortController` + `AbortSignal.any()` for modern runtimes,
 * falling back to manual `addEventListener` for older environments.
 *
 * @returns The promise and a `settle` handle for external resolve/reject.
 */
export function createAbortableWaiter(
  signal: AbortSignal,
  timeoutMs: number,
  options?: AbortableWaiterOptions,
): {
  promise: Promise<void>;
  settle: {
    resolve: () => void;
    reject: (error: Error) => void;
  };
} {
  let settled = false;

  let _resolve!: () => void;
  let _reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    _resolve = res;
    _reject = rej;
  });

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const cleanup = () => {
    if (settled) return;
    settled = true;
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    options?.onSettled?.();
  };

  // Prefer AbortSignal.any() to combine
  // the external signal with a timeout-created signal. This avoids manual
  // addEventListener wiring and gives downstream callers a single combined
  // signal to propagate.
  const canUseAbortSignalAny = typeof AbortSignal.any === "function";

  if (canUseAbortSignalAny) {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    options?.onScheduled?.(undefined);

    const combined = AbortSignal.any([signal, timeoutSignal].filter(Boolean));

    const onAbort = () => {
      cleanup();
      _reject(makeAbortError(timeoutSignal.aborted ? "Timeout" : "Aborted"));
    };

    if (combined.aborted) {
      onAbort();
    } else {
      combined.addEventListener("abort", onAbort, { once: true });
    }
  } else {
    // Fallback: manual timeout + addEventListener
    const onAbort = () => {
      cleanup();
      _reject(makeAbortError());
    };

    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) {
      onAbort();
    } else {
      timeoutId = setTimeout(() => {
        cleanup();
        _reject(makeAbortError("Timeout"));
      }, timeoutMs);
      options?.onScheduled?.(timeoutId);
    }
  }

  return {
    promise,
    settle: {
      resolve: () => {
        cleanup();
        _resolve();
      },
      reject: (error: Error) => {
        cleanup();
        _reject(error);
      },
    },
  };
}
