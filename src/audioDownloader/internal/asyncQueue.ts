/**
 * CONSOLIDATION — unified producer/consumer pump.
 *
 * Three units implemented the same "push from an event callback, pull from an
 * async generator" bridge by hand:
 *   - `webAudioBridge.getAudioBridgeChunks` (`chunks` + `wake` + `finish`)
 *   - `mseProxy.captureMseStream`          (`events` + `wake` + `notify`)
 *   - `webAbr.streamMediaFormat`           (in-flight range completion loop)
 *
 * Each copy re-derived the same four rules, and each copy got them slightly
 * differently (one cleared its timeout only in `finally`, one dropped items
 * when a second consumer attached). The shared queue states them once:
 *
 *  1. `push` never blocks and never drops: items buffer until a consumer pulls.
 *  2. `close`/`fail` are terminal and idempotent; the first one wins.
 *  3. Buffered items are always drained *before* a terminal state surfaces, so
 *     a stream that failed mid-flight still delivers the bytes it did receive.
 *  4. Exactly one waiter is parked at a time; waking is edge-triggered.
 */

export type AsyncQueue<T> = {
  /** Buffers an item and wakes a parked consumer. No-op once terminal. */
  push: (item: T) => void;
  /** Marks the producer finished. Buffered items still drain. */
  close: () => void;
  /** Marks the producer failed. Buffered items still drain, then it throws. */
  fail: (error: unknown) => void;
  /** True once `close`/`fail` ran (buffer may still hold items). */
  readonly settled: boolean;
  /** Number of buffered, not-yet-consumed items. */
  readonly size: number;
  /** Drains the queue in FIFO order, rethrowing a `fail` reason at the end. */
  drain: () => AsyncGenerator<T, void, undefined>;
};

export function createAsyncQueue<T>(): AsyncQueue<T> {
  const buffer: T[] = [];
  let settled = false;
  let failure: { error: unknown } | undefined;
  // Edge-triggered wake-up handle for the single parked consumer.
  let wake: (() => void) | undefined;

  const signal = () => {
    const resume = wake;
    wake = undefined;
    resume?.();
  };

  return {
    push(item: T) {
      if (settled) return;
      buffer.push(item);
      signal();
    },
    close() {
      if (settled) return;
      settled = true;
      signal();
    },
    fail(error: unknown) {
      if (settled) return;
      settled = true;
      failure = { error };
      signal();
    },
    get settled() {
      return settled;
    },
    get size() {
      return buffer.length;
    },
    async *drain() {
      // Rule 3: keep going while items remain even after a terminal state.
      while (!settled || buffer.length > 0) {
        if (buffer.length === 0) {
          // MODERNIZATION (R-1): `Promise.withResolvers()` replaces the
          // `let resolve; new Promise(r => resolve = r)` dance the three
          // hand-rolled pumps used.
          const gate = Promise.withResolvers<void>();
          wake = gate.resolve;
          await gate.promise;
          continue;
        }
        // `shift()` keeps FIFO order; the buffers here are short (bounded by
        // how fast the consumer pulls), so the O(n) move is irrelevant next
        // to the megabyte-sized payloads being carried.
        yield buffer.shift() as T;
      }
      if (failure) throw failure.error;
    },
  };
}
