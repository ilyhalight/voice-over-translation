/**
 * CONSOLIDATION — unified "settle once on value, timeout, or abort" waiter.
 *
 * The same shape existed three times with three different bug profiles:
 *   - `mseProxy.waitFor(read, subscribe, timeoutMs, label, signal)` — complete
 *   - `poToken.mintPageWorldPoToken` — inline listener + timer that resolves
 *     `undefined` instead of rejecting
 *   - `pageAudioHandler.relayThroughAudioRealm` — inline listener + timer whose
 *     handle was cleared on READY and never re-armed (DEFECT F-3)
 *
 * `waitForValue` keeps the strictest version of each rule:
 *  - `read()` runs once up front, so an already-satisfied condition never waits;
 *  - subscription happens *before* the first read, so no event can slip through;
 *  - exactly one settle wins and every listener/timer is torn down on all paths;
 *  - the timeout message and the abort reason are injectable, so each caller
 *    keeps its existing externally-visible error text byte for byte.
 */
import { makeAbortError } from "../../utils/errors";

export type WaitForValueOptions<T> = {
  /** Returns the value once available, else `undefined`. */
  read: () => T | undefined;
  /** Wires up notification; must return its own teardown. */
  subscribe: (notify: () => void) => () => void;
  /** Milliseconds before rejecting. Non-finite or <= 0 disables the timeout. */
  timeoutMs: number;
  /** Human label; used for the default timeout message. */
  label: string;
  /**
   * Exact timeout rejection message. Defaults to `` `${label} timed out` ``.
   * Callers migrating off a hand-rolled waiter pass their original text here
   * so no log or assertion downstream changes.
   */
  timeoutMessage?: string;
  signal?: AbortSignal;
  /**
   * What to reject with on abort. Defaults to the project's canonical
   * `AbortError`, which keeps `isAbortError()` working downstream. A caller
   * that previously rethrew `signal.reason` verbatim passes that instead.
   */
  abortReason?: () => unknown;
};

export function waitForValue<T>({
  read,
  subscribe,
  timeoutMs,
  label,
  timeoutMessage,
  signal,
  abortReason,
}: WaitForValueOptions<T>): Promise<T> {
  // MODERNIZATION (R-1): explicit resolvers instead of assigning them out of a
  // `new Promise` executor, which is what all three originals did.
  const gate = Promise.withResolvers<T>();
  const rejectWithAbort = () =>
    abortReason ? abortReason() : makeAbortError();

  let done = false;
  let unsubscribe: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const teardown = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    signal?.removeEventListener("abort", onAbort);
    unsubscribe?.();
    unsubscribe = undefined;
  };

  const settle = (apply: () => void) => {
    if (done) return;
    done = true;
    teardown();
    apply();
  };

  function onAbort() {
    settle(() => gate.reject(rejectWithAbort()));
  }

  const poll = () => {
    if (done) return;
    try {
      const value = read();
      if (value !== undefined) settle(() => gate.resolve(value));
    } catch (error) {
      // A throwing predicate is terminal, exactly as in `mseProxy.waitFor`.
      settle(() => gate.reject(error));
    }
  };

  if (signal?.aborted) {
    // Nothing is wired yet, so reject without a teardown pass.
    return Promise.reject(rejectWithAbort());
  }
  signal?.addEventListener("abort", onAbort, { once: true });

  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    timer = setTimeout(() => {
      settle(() =>
        gate.reject(new Error(timeoutMessage ?? `${label} timed out`)),
      );
    }, timeoutMs);
  }

  // Subscribe before the first read so no event can slip through the gap.
  unsubscribe = subscribe(poll);
  poll();

  return gate.promise;
}
