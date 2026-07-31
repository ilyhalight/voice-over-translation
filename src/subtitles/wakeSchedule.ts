import type { SubtitleLine } from "../types/subtitles";

/**
 * Deadline scheduling for the subtitle pipeline.
 *
 * The widget is driven by `requestVideoFrameCallback`, i.e. it is woken once per
 * decoded video frame (50-60 Hz, more on high-refresh displays). Before this
 * module every wake ran the throttle bookkeeping and, four times a second, the
 * full `update()` -> active-cue search -> render-key -> position-refresh path,
 * even while no cue was on screen and nothing could possibly change.
 *
 * Nothing in the pipeline can change between two *boundaries*:
 *   - a cue start,
 *   - a cue end (plus the lookback window during which it still renders),
 *   - the next word-highlight threshold, when highlighting is on.
 *
 * Knowing the next boundary turns the per-frame callback into two numeric
 * comparisons and eliminates all idle work between cues.
 */

/** Lines are ordered by `startMs`; find the first index with `startMs > timeMs`. */
function upperBoundByStart(lines: SubtitleLine[], timeMs: number): number {
  let lo = 0;
  let hi = lines.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].startMs > timeMs) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/**
 * Earliest cue boundary strictly after `timeMs`.
 *
 * Cue ends are scanned from a bounded window before `timeMs` because a cue that
 * already ended can still be rendered for `lookbackMs`, and overlapping cues
 * mean an earlier entry can end later than a later one.
 */
export function findNextCueBoundaryMs(
  timeMs: number,
  lines: SubtitleLine[],
  lookbackMs = 0,
): number | null {
  const count = lines.length;
  if (count === 0) return null;

  let next: number | null = null;
  const consider = (value: number): void => {
    if (value > timeMs && (next === null || value < next)) next = value;
  };

  const firstFuture = upperBoundByStart(lines, timeMs);
  if (firstFuture < count) consider(lines[firstFuture].startMs);

  // Walk back over cues that may still be on screen, plus overlapping ones.
  for (let i = firstFuture - 1; i >= 0; i -= 1) {
    const line = lines[i];
    const endMs = line.startMs + Math.max(0, line.durationMs) + lookbackMs;
    consider(endMs);
    // Once a cue starts before the earliest known boundary minus the maximum
    // possible on-screen span, no earlier cue can produce a closer boundary.
    if (endMs <= timeMs && line.startMs < timeMs - lookbackMs) {
      const settled = next !== null;
      if (settled) break;
    }
  }

  return next;
}

/** Earliest word-highlight threshold strictly after `timeMs`. */
export function findNextThresholdMs(
  timeMs: number,
  thresholds: readonly number[],
): number | null {
  let next: number | null = null;
  for (let i = 0; i < thresholds.length; i += 1) {
    const value = thresholds[i];
    if (value > timeMs && (next === null || value < next)) next = value;
  }
  return next;
}

export type WakeScheduleInput = {
  timeMs: number;
  lines: SubtitleLine[];
  lookbackMs?: number;
  /** Word-highlight thresholds of the active cue; empty when highlighting is off. */
  thresholds?: readonly number[];
  /** Upper bound so periodic layout refreshes still happen. */
  maxSleepMs?: number;
};

/**
 * Media time at which the widget must next do work.
 *
 * Always bounded by `maxSleepMs` so position/layout refreshes keep running on
 * long cues and during silence.
 */
export function computeNextWakeMs({
  timeMs,
  lines,
  lookbackMs = 0,
  thresholds,
  maxSleepMs = 250,
}: WakeScheduleInput): number {
  const cap = timeMs + Math.max(1, maxSleepMs);
  let next = findNextCueBoundaryMs(timeMs, lines, lookbackMs);

  if (thresholds && thresholds.length > 0) {
    const threshold = findNextThresholdMs(timeMs, thresholds);
    if (threshold !== null && (next === null || threshold < next)) {
      next = threshold;
    }
  }

  if (next === null || next > cap) return cap;
  return next;
}
