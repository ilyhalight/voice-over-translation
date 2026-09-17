/**
 * Word-highlight state application for the subtitles widget.
 *
 * Consolidated here (instead of inline in `SubtitlesWidget`) so the hot loop is
 * independently testable and benchmarkable, and so the widget keeps a single
 * owner for "which token spans carry the `passed` class".
 *
 * Observable behavior is identical to the previous implementation: a span has
 * the `passed` class if and only if its highlight index is a valid index into
 * `passedFlags` and that flag is true.
 */

/** Minimal structural type so the logic is testable without a real DOM. */
export type HighlightTokenElement = {
  readonly dataset: { votHighlightIndex?: string };
  readonly classList: {
    toggle(token: string, force?: boolean): unknown;
    remove(token: string): unknown;
    contains(token: string): boolean;
  };
};

export type HighlightState = {
  /** Parsed highlight index per element; `-1` marks "never highlighted". */
  indices: Int32Array;
  /** Last applied class state per element (`0` absent, `1` present). */
  applied: Uint8Array;
};

export const NO_HIGHLIGHT_INDEX = -1;
const PASSED_CLASS = "passed";

export function createHighlightState(): HighlightState {
  return { indices: new Int32Array(0), applied: new Uint8Array(0) };
}

/**
 * Rebuilds the index map after a render pass.
 *
 * The state is therefore seeded from the **actual** DOM class. `classList.contains`
 * is a cheap attribute read (no style resolution, no layout) and runs once per
 * span per render, not per tick.
 */
export function syncHighlightState(
  state: HighlightState,
  elements: ArrayLike<HighlightTokenElement>,
): HighlightState {
  const count = elements.length;
  if (state.indices.length !== count) {
    state.indices = new Int32Array(count);
    state.applied = new Uint8Array(count);
  }

  const { indices, applied } = state;
  for (let i = 0; i < count; i += 1) {
    const element = elements[i];
    const raw = element.dataset.votHighlightIndex;
    const parsed = raw === undefined ? Number.NaN : Number.parseInt(raw, 10);
    indices[i] =
      Number.isInteger(parsed) && parsed >= 0 ? parsed : NO_HIGHLIGHT_INDEX;
    applied[i] = element.classList.contains(PASSED_CLASS) ? 1 : 0;
  }
  return state;
}

/**
 * Applies `passedFlags` to the rendered spans, touching only changed nodes.
 *
 * @returns the number of DOM writes performed (used by tests/benchmarks to
 * assert that redundant mutations are eliminated).
 */
export function applyPassedState(
  state: HighlightState,
  elements: ArrayLike<HighlightTokenElement>,
  passedFlags: readonly boolean[],
): number {
  const { indices, applied } = state;
  const count = Math.min(elements.length, indices.length);
  const flagCount = passedFlags.length;
  let writes = 0;

  for (let i = 0; i < count; i += 1) {
    const highlightIndex = indices[i];
    const isPassed =
      highlightIndex >= 0 && highlightIndex < flagCount
        ? passedFlags[highlightIndex]
        : false;
    const nextState = isPassed ? 1 : 0;
    if (applied[i] === nextState) continue;
    applied[i] = nextState;
    elements[i].classList.toggle(PASSED_CLASS, isPassed);
    writes += 1;
  }
  return writes;
}

/** Removes the `passed` class from every span and resets the diff state. */
export function clearPassedState(
  state: HighlightState,
  elements: ArrayLike<HighlightTokenElement>,
): void {
  state.applied.fill(0);
  for (let i = 0; i < elements.length; i += 1) {
    elements[i].classList.remove(PASSED_CLASS);
  }
}
