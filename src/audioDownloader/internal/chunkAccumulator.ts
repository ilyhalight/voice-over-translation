/**
 * CONSOLIDATION — unified "buffer until `minChunkSize`, then emit" rule.
 *
 * `mseProxy.captureMseStream` and `webAbr.streamMediaFormat` both carried:
 *
 *     pending.push(bytes);
 *     pendingSize += bytes.byteLength;
 *     if (pendingSize >= config.minChunkSize) {
 *       yield concatBuffers(pending);
 *       pending = [];
 *       pendingSize = 0;
 *     }
 *     // ...and, at the end, a separate flush with its own emptiness rule
 *
 * Two copies of a size threshold, two copies of the reset, and two *different*
 * tail rules (one could emit a zero-length final chunk, the other could not).
 * The accumulator owns the rule; callers only say "take these bytes" and
 * "flush".
 */
import { concatBuffers } from "../strategies/audioChunks";

export type ChunkAccumulator = {
  /**
   * Adds bytes and returns a chunk once the threshold is reached, otherwise
   * `undefined`. Empty inputs are ignored so a zero-length network answer
   * cannot inflate the chunk count.
   */
  add: (bytes: Uint8Array) => Uint8Array | undefined;
  /**
   * Returns whatever is still buffered and resets. Returns `undefined` when
   * nothing is pending, which is what lets a caller avoid emitting an empty
   * trailing chunk.
   */
  flush: () => Uint8Array | undefined;
  /** Bytes currently buffered. */
  readonly pending: number;
  /** Total bytes ever accepted (used for progress/`isLastChunk` accounting). */
  readonly received: number;
};

export function createChunkAccumulator(minChunkSize: number): ChunkAccumulator {
  // A non-positive or non-finite threshold would either emit per-append or
  // never emit; clamp to "emit immediately" which is the safer failure mode
  // for a streaming upload.
  const threshold =
    Number.isFinite(minChunkSize) && minChunkSize > 0 ? minChunkSize : 1;

  let buffered: Uint8Array[] = [];
  let bufferedSize = 0;
  let received = 0;

  const take = (): Uint8Array | undefined => {
    if (bufferedSize === 0) return undefined;
    const chunk = concatBuffers(buffered);
    buffered = [];
    bufferedSize = 0;
    return chunk;
  };

  return {
    add(bytes: Uint8Array) {
      if (bytes.byteLength === 0) return undefined;
      buffered.push(bytes);
      bufferedSize += bytes.byteLength;
      received += bytes.byteLength;
      return bufferedSize >= threshold ? take() : undefined;
    },
    flush: take,
    get pending() {
      return bufferedSize;
    },
    get received() {
      return received;
    },
  };
}
