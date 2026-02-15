import type { SubtitleToken } from "./types";

export type WordSlice = {
  tokenIndex: number;
  breakAfterTokenIndex: number;
  textToNextWord: string;
  trailingGapAfterBreakText: string;
};

export type WordMetrics = {
  widths: number[];
  chars: number[];
  trailingGapWidths: number[];
  trailingGapChars: number[];
  prefixWidths: number[];
  prefixChars: number[];
};

export type StrictTwoLineLayout = {
  breakAfterWordIndices: number[];
  truncateAfterWordIndex: number | null;
};

export type SegmentWord = {
  tokenIndex: number;
  breakAfterTokenIndex: number;
};

export type TimedTokenSegment = {
  startToken: number;
  endToken: number;
  startMs: number;
  endMs: number;
};

type WordRange = { startWord: number; endWord: number };

const isWordToken = (token: SubtitleToken | undefined): boolean =>
  Boolean(token?.isWordLike && token.text?.trim());

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const buildPrefixSums = (values: number[]): number[] => {
  const prefix = new Array(values.length + 1).fill(0);
  for (let i = 0; i < values.length; i += 1) {
    prefix[i + 1] = prefix[i] + values[i];
  }
  return prefix;
};

const rangeSum = (prefix: number[], start: number, end: number): number => {
  if (end < start) return 0;
  return prefix[end + 1] - prefix[start];
};

const sentenceEndingWordRegexp =
  /[.!?\u2026]+(?:["'`)\]}\u00BB\u201D\u2019]+)?$/u;

function resolveBreakAfterTokenIndex(
  tokens: SubtitleToken[],
  wordTokenIndex: number,
): number {
  let breakTokenIndex = wordTokenIndex;
  let cursor = wordTokenIndex + 1;
  let seenTrailingPunctuation = false;

  while (cursor < tokens.length) {
    const token = tokens[cursor];
    if (!token || isWordToken(token)) break;

    if (!token.text.trim()) {
      // Some subtitle providers emit punctuation with a leading space:
      // "word , next". Keep scanning so punctuation still stays with the
      // preceding word, then stop once punctuation was already attached.
      if (seenTrailingPunctuation) break;
      cursor += 1;
      continue;
    }

    breakTokenIndex = cursor;
    seenTrailingPunctuation = true;
    cursor += 1;
  }

  return breakTokenIndex;
}

export function buildWordSlices(tokens: SubtitleToken[]): {
  slices: WordSlice[];
  key: string;
} {
  const wordTokenIndices: number[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    if (isWordToken(tokens[i])) {
      wordTokenIndices.push(i);
    }
  }

  const slices: WordSlice[] = [];

  for (let i = 0; i < wordTokenIndices.length; i += 1) {
    const tokenIndex = wordTokenIndices[i];
    const nextWordTokenIndex =
      i + 1 < wordTokenIndices.length ? wordTokenIndices[i + 1] : tokens.length;

    const rawBreakAfterTokenIndex = resolveBreakAfterTokenIndex(
      tokens,
      tokenIndex,
    );
    const breakAfterTokenIndex = clamp(
      rawBreakAfterTokenIndex,
      tokenIndex,
      nextWordTokenIndex - 1,
    );

    let textToNextWord = "";
    for (let cursor = tokenIndex; cursor < nextWordTokenIndex; cursor += 1) {
      textToNextWord += tokens[cursor]?.text ?? "";
    }

    let trailingGapAfterBreakText = "";
    for (
      let cursor = breakAfterTokenIndex + 1;
      cursor < nextWordTokenIndex;
      cursor += 1
    ) {
      trailingGapAfterBreakText += tokens[cursor]?.text ?? "";
    }

    slices.push({
      tokenIndex,
      breakAfterTokenIndex,
      textToNextWord,
      trailingGapAfterBreakText,
    });
  }

  const keyParts: string[] = [];
  for (const slice of slices) {
    keyParts.push(
      `${slice.textToNextWord}\u0002${slice.trailingGapAfterBreakText}\u0002${slice.breakAfterTokenIndex}`,
    );
  }
  const key = keyParts.join("\u0001");

  return {
    slices,
    key,
  };
}

export function measureWordSlices(
  slices: WordSlice[],
  measure: (text: string) => number,
): WordMetrics {
  const widths = slices.map((slice) => measure(slice.textToNextWord));
  const chars = slices.map((slice) => slice.textToNextWord.length);
  const trailingGapWidths = slices.map((slice) =>
    measure(slice.trailingGapAfterBreakText),
  );
  const trailingGapChars = slices.map(
    (slice) => slice.trailingGapAfterBreakText.length,
  );

  return {
    widths,
    chars,
    trailingGapWidths,
    trailingGapChars,
    prefixWidths: buildPrefixSums(widths),
    prefixChars: buildPrefixSums(chars),
  };
}

export function getWordRangeWidth(
  metrics: WordMetrics,
  startWord: number,
  endWord: number,
): number {
  if (endWord < startWord) return 0;
  if (!metrics.widths.length) return 0;

  const start = clamp(startWord, 0, metrics.widths.length - 1);
  const end = clamp(endWord, 0, metrics.widths.length - 1);
  if (end < start) return 0;

  const total = rangeSum(metrics.prefixWidths, start, end);
  return total - (metrics.trailingGapWidths[end] ?? 0);
}

export function getWordRangeChars(
  metrics: WordMetrics,
  startWord: number,
  endWord: number,
): number {
  if (endWord < startWord) return 0;
  if (!metrics.chars.length) return 0;

  const start = clamp(startWord, 0, metrics.chars.length - 1);
  const end = clamp(endWord, 0, metrics.chars.length - 1);
  if (end < start) return 0;

  const total = rangeSum(metrics.prefixChars, start, end);
  return total - (metrics.trailingGapChars[end] ?? 0);
}

export function fitsInTwoLines(
  metrics: WordMetrics,
  startWord: number,
  endWord: number,
  maxWidth: number,
): boolean {
  if (endWord < startWord) return true;
  if (maxWidth <= 0) return false;

  if (getWordRangeWidth(metrics, startWord, endWord) <= maxWidth) {
    return true;
  }

  for (let k = startWord; k < endWord; k += 1) {
    const top = getWordRangeWidth(metrics, startWord, k);
    const bottom = getWordRangeWidth(metrics, k + 1, endWord);
    if (top <= maxWidth && bottom <= maxWidth) {
      return true;
    }
  }

  return false;
}

const scoreTwoLineCandidate = (
  w1: number,
  w2: number,
  maxWidth: number,
  count1: number,
  count2: number,
  wordsInRange: number,
): number => {
  const overflowPenaltyMul = 10_000;
  const widths = [w1, w2];
  const mean = (w1 + w2) / 2;

  let slackCost = 0;
  for (const width of widths) {
    const slack = maxWidth - width;
    if (slack >= 0) {
      slackCost += slack * slack;
    } else {
      const over = -slack;
      slackCost += over * over * overflowPenaltyMul;
    }
  }

  let variance = 0;
  for (const width of widths) {
    const delta = width - mean;
    variance += delta * delta;
  }

  const canAvoidSingleton = wordsInRange >= 4;
  const singletonPenalty =
    canAvoidSingleton && (count1 <= 1 || count2 <= 1) ? 1e9 : 0;

  // Subtitle line-treatment guides commonly recommend avoiding very short
  // "orphan" lines when multiple alternatives exist. For longer phrases,
  // penalize 2-word lines to reduce awkward wraps like:
  // "very long line ..."
  // "of two words"
  const canAvoidTwoWordOrphans = wordsInRange >= 6;
  const twoWordOrphanPenalty =
    canAvoidTwoWordOrphans && (count1 <= 2 || count2 <= 2) ? 2e7 : 0;

  let cost = slackCost + variance + singletonPenalty + twoWordOrphanPenalty;
  if (w1 > w2) {
    cost += ((w1 - w2) / Math.max(1, maxWidth)) * 0.15;
  }

  return cost;
};

function computeBestTwoLineBreak(
  metrics: WordMetrics,
  startWord: number,
  endWord: number,
  maxWidth: number,
): number | null {
  if (maxWidth <= 0) return null;
  if (endWord <= startWord) return null;

  let bestBreak: number | null = null;
  let bestCost = Number.POSITIVE_INFINITY;
  const wordsInRange = endWord - startWord + 1;

  for (let k = startWord; k < endWord; k += 1) {
    const w1 = getWordRangeWidth(metrics, startWord, k);
    const w2 = getWordRangeWidth(metrics, k + 1, endWord);
    if (w1 > maxWidth || w2 > maxWidth) continue;

    const count1 = k - startWord + 1;
    const count2 = endWord - k;
    const cost = scoreTwoLineCandidate(
      w1,
      w2,
      maxWidth,
      count1,
      count2,
      wordsInRange,
    );

    if (cost < bestCost) {
      bestCost = cost;
      bestBreak = k;
    }
  }

  return bestBreak;
}

export function computeBalancedBreaks(
  metrics: WordMetrics,
  maxWidth: number,
): number[] {
  const n = metrics.widths.length;
  if (n <= 1) return [];

  if (getWordRangeWidth(metrics, 0, n - 1) <= maxWidth) {
    return [];
  }

  const breakIndex = computeBestTwoLineBreak(metrics, 0, n - 1, maxWidth);
  return breakIndex === null ? [] : [breakIndex];
}

function findLongestPrefixFittingTwoLines(
  metrics: WordMetrics,
  maxWidth: number,
): number | null {
  const n = metrics.widths.length;
  if (n <= 0) return null;

  for (let endWord = n - 1; endWord >= 0; endWord -= 1) {
    if (fitsInTwoLines(metrics, 0, endWord, maxWidth)) {
      return endWord;
    }
  }

  return null;
}

export function resolveStrictTwoLineLayout(
  metrics: WordMetrics,
  maxWidth: number,
): StrictTwoLineLayout {
  if (maxWidth <= 0) {
    return {
      breakAfterWordIndices: [],
      truncateAfterWordIndex: null,
    };
  }

  const n = metrics.widths.length;
  if (n <= 1) {
    return {
      breakAfterWordIndices: [],
      truncateAfterWordIndex: null,
    };
  }

  const fullLineFits = getWordRangeWidth(metrics, 0, n - 1) <= maxWidth;
  if (fullLineFits) {
    return {
      breakAfterWordIndices: [],
      truncateAfterWordIndex: null,
    };
  }

  const balancedBreaks = computeBalancedBreaks(metrics, maxWidth);
  if (balancedBreaks.length) {
    return {
      breakAfterWordIndices: balancedBreaks,
      truncateAfterWordIndex: null,
    };
  }

  const prefixEndWordRaw = findLongestPrefixFittingTwoLines(metrics, maxWidth);
  const prefixEndWord = prefixEndWordRaw ?? 0;

  if (prefixEndWord >= n - 1) {
    return {
      breakAfterWordIndices: [],
      truncateAfterWordIndex: null,
    };
  }

  const prefixBreak = computeBestTwoLineBreak(
    metrics,
    0,
    prefixEndWord,
    maxWidth,
  );

  return {
    breakAfterWordIndices: prefixBreak === null ? [] : [prefixBreak],
    truncateAfterWordIndex: prefixEndWord,
  };
}

const getRangeWordCount = (range: WordRange): number =>
  range.endWord - range.startWord + 1;

const buildInitialWordRanges = (
  wordsCount: number,
  isRangeAllowed: (startWord: number, endWord: number) => boolean,
): WordRange[] => {
  const wordRanges: WordRange[] = [];
  let startWord = 0;
  while (startWord < wordsCount) {
    let endWord = startWord;
    while (endWord + 1 < wordsCount && isRangeAllowed(startWord, endWord + 1)) {
      endWord += 1;
    }
    wordRanges.push({ startWord, endWord });
    startWord = endWord + 1;
  }
  return wordRanges;
};

const tryBorrowFromPrevious = (
  wordRanges: WordRange[],
  index: number,
  isRangeAllowed: (startWord: number, endWord: number) => boolean,
): boolean => {
  if (index <= 0) return false;
  const current = wordRanges[index];
  const previous = wordRanges[index - 1];
  if (!current || !previous) return false;
  if (getRangeWordCount(previous) < 3) return false;

  const movedWord = previous.endWord;
  const nextPrevious = {
    startWord: previous.startWord,
    endWord: movedWord - 1,
  };
  const nextCurrent = {
    startWord: movedWord,
    endWord: current.endWord,
  };
  if (
    !isRangeAllowed(nextPrevious.startWord, nextPrevious.endWord) ||
    !isRangeAllowed(nextCurrent.startWord, nextCurrent.endWord)
  ) {
    return false;
  }
  previous.endWord = nextPrevious.endWord;
  current.startWord = nextCurrent.startWord;
  return true;
};

const tryBorrowFromNext = (
  wordRanges: WordRange[],
  index: number,
  isRangeAllowed: (startWord: number, endWord: number) => boolean,
): boolean => {
  if (index >= wordRanges.length - 1) return false;
  const current = wordRanges[index];
  const next = wordRanges[index + 1];
  if (!current || !next) return false;
  if (getRangeWordCount(next) < 3) return false;

  const movedWord = next.startWord;
  const nextCurrent = {
    startWord: current.startWord,
    endWord: movedWord,
  };
  const nextNext = {
    startWord: movedWord + 1,
    endWord: next.endWord,
  };
  if (
    !isRangeAllowed(nextCurrent.startWord, nextCurrent.endWord) ||
    !isRangeAllowed(nextNext.startWord, nextNext.endWord)
  ) {
    return false;
  }
  current.endWord = nextCurrent.endWord;
  next.startWord = nextNext.startWord;
  return true;
};

const rebalanceSingletonRanges = (
  wordRanges: WordRange[],
  isRangeAllowed: (startWord: number, endWord: number) => boolean,
): void => {
  for (let i = wordRanges.length - 1; i >= 0; i -= 1) {
    if (getRangeWordCount(wordRanges[i]) !== 1) continue;
    if (!tryBorrowFromPrevious(wordRanges, i, isRangeAllowed)) {
      tryBorrowFromNext(wordRanges, i, isRangeAllowed);
    }
  }
};

const getWordPayload = (
  tokens: SubtitleToken[],
  words: SegmentWord[],
  wordIndex: number,
): string => {
  const word = words[wordIndex];
  if (!word) return "";
  let text = "";
  for (
    let tokenIndex = word.tokenIndex;
    tokenIndex <= word.breakAfterTokenIndex;
    tokenIndex += 1
  ) {
    text += tokens[tokenIndex]?.text ?? "";
  }
  return text.trimEnd();
};

const applySentenceBoundarySplits = (
  wordRanges: WordRange[],
  tokens: SubtitleToken[],
  words: SegmentWord[],
  isRangeAllowed: (startWord: number, endWord: number) => boolean,
): void => {
  for (let i = 0; i < wordRanges.length - 1; i += 1) {
    const previous = wordRanges[i];
    const next = wordRanges[i + 1];
    if (!previous || !next) continue;

    let sentenceBoundaryWord = -1;
    const minCandidate = Math.max(previous.startWord, previous.endWord - 2);
    for (
      let candidate = previous.endWord - 1;
      candidate >= minCandidate;
      candidate -= 1
    ) {
      if (
        sentenceEndingWordRegexp.test(getWordPayload(tokens, words, candidate))
      ) {
        sentenceBoundaryWord = candidate;
        break;
      }
    }
    if (sentenceBoundaryWord < previous.startWord) continue;

    const nextPreviousStartWord = previous.startWord;
    const nextPreviousEndWord = sentenceBoundaryWord;
    const nextPreviousWordCount =
      nextPreviousEndWord - nextPreviousStartWord + 1;
    if (nextPreviousWordCount < 3) continue;

    const nextStartWord = sentenceBoundaryWord + 1;
    const nextEndWord = next.endWord;
    if (
      !isRangeAllowed(nextPreviousStartWord, nextPreviousEndWord) ||
      !isRangeAllowed(nextStartWord, nextEndWord)
    ) {
      continue;
    }

    previous.endWord = nextPreviousEndWord;
    next.startWord = nextStartWord;
  }
};

const mapWordRangesToTimedSegments = (
  wordRanges: WordRange[],
  words: SegmentWord[],
  tokens: SubtitleToken[],
): TimedTokenSegment[] => {
  const segments: TimedTokenSegment[] = [];

  for (const range of wordRanges) {
    const startWord = words[range.startWord];
    const endWord = words[range.endWord];
    if (!startWord || !endWord) continue;

    const startToken = startWord.tokenIndex;
    const endToken = endWord.breakAfterTokenIndex + 1;
    const startMs = tokens[startToken]?.startMs ?? 0;
    const endTokenStartMs = tokens[endWord.tokenIndex]?.startMs ?? startMs;
    const endTokenDurationMs = tokens[endWord.tokenIndex]?.durationMs ?? 0;
    const nextWord = words[range.endWord + 1];
    const nextWordStartMs = nextWord
      ? tokens[nextWord.tokenIndex]?.startMs
      : undefined;
    const endMs = nextWordStartMs ?? endTokenStartMs + endTokenDurationMs;

    segments.push({
      startToken,
      endToken,
      startMs,
      endMs,
    });
  }

  return segments;
};

export function computeTwoLineSegments(
  tokens: SubtitleToken[],
  words: SegmentWord[],
  metrics: WordMetrics,
  maxWidthPx: number,
  maxChars: number,
): TimedTokenSegment[] {
  const wordsCount = words.length;
  if (wordsCount === 0) return [];

  const charLimit = Number.isFinite(maxChars) && maxChars > 0 ? maxChars : null;
  const isRangeAllowed = (startWord: number, endWord: number): boolean => {
    if (endWord < startWord) return false;
    if (
      charLimit !== null &&
      getWordRangeChars(metrics, startWord, endWord) > charLimit
    ) {
      return false;
    }
    return fitsInTwoLines(metrics, startWord, endWord, maxWidthPx);
  };

  const wordRanges = buildInitialWordRanges(wordsCount, isRangeAllowed);
  rebalanceSingletonRanges(wordRanges, isRangeAllowed);
  applySentenceBoundarySplits(wordRanges, tokens, words, isRangeAllowed);
  return mapWordRangesToTimedSegments(wordRanges, words, tokens);
}

export function shouldShowSmartEllipsis(
  smartLayoutEnabled: boolean,
  truncateAfterTokenIndex: number | null,
  tokensLength: number,
): boolean {
  if (!smartLayoutEnabled) return false;
  if (typeof truncateAfterTokenIndex !== "number") return false;
  return (
    truncateAfterTokenIndex >= 0 && truncateAfterTokenIndex < tokensLength - 1
  );
}
