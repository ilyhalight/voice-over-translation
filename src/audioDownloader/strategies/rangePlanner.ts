/**
 * Sizing of the ranged media requests.
 *
 * YouTube paces a single continuous `videoplayback` body down to playback
 * speed, while every separate `Range` request is answered at the full speed of
 * the connection — the reason yt-dlp downloads in HTTP chunks. The catch is
 * that the trick only holds inside a corridor: ranges above ~10 MiB are paced
 * again, and ranges that are too small pay a round trip per megabyte, which is
 * what makes a slow link crawl.
 *
 * So the size is not a constant. The download starts at a size that is safe
 * everywhere and then follows what the previous range actually measured: a
 * fast link reads fewer and bigger ranges, a slow or flaky one keeps them
 * small, so a dropped answer costs one small retry instead of a large one.
 */

const MB = 1024 * 1024;

/** Below this a range costs more in round trips than it carries. */
export const MEDIA_RANGE_MIN_BYTES = 2 * MB;
/** Where every download starts: fast enough to measure, safe on any link. */
export const MEDIA_RANGE_START_BYTES = 4 * MB;
/** The ceiling while the link looks slow, laggy or unstable. */
export const MEDIA_RANGE_SLOW_MAX_BYTES = 4 * MB;
/** The ceiling overall, kept well under the ~10 MiB pacing threshold. */
export const MEDIA_RANGE_MAX_BYTES = 8 * MB;

/** Above this throughput the link can carry a bigger range. */
const FAST_BYTES_PER_SECOND = 3 * MB;
/** ...as long as the round trip is short enough to be worth it. */
const FAST_LATENCY_MS = 400;
/** Below this throughput the ranges are halved. */
const SLOW_BYTES_PER_SECOND = 768 * 1024;
/** A round trip this long means the answer, not the bytes, is the cost. */
const SLOW_LATENCY_MS = 1_200;

/** What one finished ranged request reported about the link it used. */
export type MediaRangeSample = {
  /** Bytes the request actually returned. */
  bytes: number;
  /** Time from sending the request to the last byte of its body. */
  durationMs: number;
  /** Time to the response head, when it was measured. */
  latencyMs?: number;
  /** The request needed a retry, a redirect or a re-signed URL. */
  unstable?: boolean;
};

export type MediaRangePlanner = {
  /** Size to ask for in the next range. */
  readonly rangeSize: number;
  /** Ranged requests worth keeping in flight at that size. */
  readonly parallelism: number;
  /** Feeds back what a finished range measured. */
  complete: (sample: MediaRangeSample) => void;
};

/** Keeps a size inside the corridor both ends of which are load-bearing. */
export function clampRangeSize(
  size: number,
  max: number = MEDIA_RANGE_MAX_BYTES,
): number {
  if (!Number.isFinite(size) || size <= 0) return MEDIA_RANGE_START_BYTES;
  return Math.min(Math.max(Math.round(size), MEDIA_RANGE_MIN_BYTES), max);
}

/**
 * The size of the next range, from the size and the measurement of the last.
 *
 * Doubling and halving (instead of a computed "ideal" size) is deliberate: the
 * numbers a browser reports for a request that was answered from a CDN edge
 * are noisy enough that a precise formula mostly measures the noise.
 */
export function nextMediaRangeSize(
  size: number,
  sample: MediaRangeSample,
): number {
  const current = clampRangeSize(size);
  // A retry, a cross-host redirect or a re-signed URL: the answer that did
  // arrive says nothing about the next one, so stay in the safe half.
  if (sample.unstable) {
    return clampRangeSize(current / 2, MEDIA_RANGE_SLOW_MAX_BYTES);
  }
  const seconds = sample.durationMs / 1_000;
  if (!(seconds > 0) || !(sample.bytes > 0)) return current;
  const throughput = sample.bytes / seconds;
  const latency = sample.latencyMs ?? 0;
  if (throughput <= SLOW_BYTES_PER_SECOND || latency >= SLOW_LATENCY_MS) {
    return clampRangeSize(current / 2, MEDIA_RANGE_SLOW_MAX_BYTES);
  }
  if (throughput >= FAST_BYTES_PER_SECOND && latency <= FAST_LATENCY_MS) {
    return clampRangeSize(current * 2);
  }
  return current;
}

/**
 * How many ranges to keep in flight at a given size.
 *
 * The point of overlapping is to keep GVS busy while the consumer uploads the
 * previous chunk to the translation backend, not to download in parallel — so
 * the bigger the range, the fewer of them, and the bytes in flight stay
 * roughly the same and well away from the pacing threshold.
 */
export function mediaRangeParallelism(size: number): number {
  return size <= MEDIA_RANGE_SLOW_MAX_BYTES ? 3 : 2;
}

/** One planner per download: the link is measured per download too. */
export function createMediaRangePlanner(
  startSize: number = MEDIA_RANGE_START_BYTES,
): MediaRangePlanner {
  let size = clampRangeSize(startSize);
  return {
    get rangeSize() {
      return size;
    },
    get parallelism() {
      return mediaRangeParallelism(size);
    },
    complete(sample) {
      size = nextMediaRangeSize(size, sample);
    },
  };
}
