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
  const keyParts: string[] = [];

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
    let trailingGapAfterBreakText = "";
    for (let cursor = tokenIndex; cursor < nextWordTokenIndex; cursor += 1) {
      const tokenText = tokens[cursor]?.text ?? "";
      textToNextWord += tokenText;
      if (cursor > breakAfterTokenIndex) {
        trailingGapAfterBreakText += tokenText;
      }
    }

    slices.push({
      tokenIndex,
      breakAfterTokenIndex,
      textToNextWord,
      trailingGapAfterBreakText,
    });
    keyParts.push(
      `${textToNextWord}\u0002${trailingGapAfterBreakText}\u0002${breakAfterTokenIndex}`,
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
  const wordsCount = slices.length;
  const widths = new Array<number>(wordsCount);
  const chars = new Array<number>(wordsCount);
  const trailingGapWidths = new Array<number>(wordsCount);
  const trailingGapChars = new Array<number>(wordsCount);
  const prefixWidths = new Array<number>(wordsCount + 1);
  const prefixChars = new Array<number>(wordsCount + 1);
  prefixWidths[0] = 0;
  prefixChars[0] = 0;

  for (let i = 0; i < wordsCount; i += 1) {
    const textToNextWord = slices[i].textToNextWord;
    const trailingGapAfterBreakText = slices[i].trailingGapAfterBreakText;

    const width = measure(textToNextWord);
    const charCount = textToNextWord.length;
    const trailingWidth = measure(trailingGapAfterBreakText);
    const trailingCharCount = trailingGapAfterBreakText.length;

    widths[i] = width;
    chars[i] = charCount;
    trailingGapWidths[i] = trailingWidth;
    trailingGapChars[i] = trailingCharCount;
    prefixWidths[i + 1] = prefixWidths[i] + width;
    prefixChars[i + 1] = prefixChars[i] + charCount;
  }

  return {
    widths,
    chars,
    trailingGapWidths,
    trailingGapChars,
    prefixWidths,
    prefixChars,
  };
}

const getWordRangeWidthUnsafe = (
  metrics: WordMetrics,
  startWord: number,
  endWord: number,
): number => {
  const total = rangeSum(metrics.prefixWidths, startWord, endWord);
  return total - (metrics.trailingGapWidths[endWord] ?? 0);
};

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

  return getWordRangeWidthUnsafe(metrics, start, end);
}

const getWordRangeCharsUnsafe = (
  metrics: WordMetrics,
  startWord: number,
  endWord: number,
): number => {
  const total = rangeSum(metrics.prefixChars, startWord, endWord);
  return total - (metrics.trailingGapChars[endWord] ?? 0);
};

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

  return getWordRangeCharsUnsafe(metrics, start, end);
}

export function fitsInTwoLines(
  metrics: WordMetrics,
  startWord: number,
  endWord: number,
  maxWidth: number,
): boolean {
  if (endWord < startWord) return true;
  if (maxWidth <= 0) return false;
  if (!metrics.widths.length) return true;

  const start = clamp(startWord, 0, metrics.widths.length - 1);
  const end = clamp(endWord, 0, metrics.widths.length - 1);
  if (end < start) return true;

  if (getWordRangeWidthUnsafe(metrics, start, end) <= maxWidth) {
    return true;
  }

  for (let k = start; k < end; k += 1) {
    const top = getWordRangeWidthUnsafe(metrics, start, k);
    const bottom = getWordRangeWidthUnsafe(metrics, k + 1, end);
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
  const mean = (w1 + w2) / 2;

  // Callers filter out overflowing line candidates, so only residual slack
  // balancing is needed here.
  const slack1 = maxWidth - w1;
  const slack2 = maxWidth - w2;
  const slackCost = slack1 * slack1 + slack2 * slack2;

  const delta1 = w1 - mean;
  const delta2 = w2 - mean;
  const variance = delta1 * delta1 + delta2 * delta2;

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
  if (!metrics.widths.length) return null;

  const start = clamp(startWord, 0, metrics.widths.length - 1);
  const end = clamp(endWord, 0, metrics.widths.length - 1);
  if (end <= start) return null;

  let bestBreak: number | null = null;
  let bestCost = Number.POSITIVE_INFINITY;
  const wordsInRange = end - start + 1;

  for (let k = start; k < end; k += 1) {
    const w1 = getWordRangeWidthUnsafe(metrics, start, k);
    const w2 = getWordRangeWidthUnsafe(metrics, k + 1, end);
    if (w1 > maxWidth || w2 > maxWidth) continue;

    const count1 = k - start + 1;
    const count2 = end - k;
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
  if (n <= 1 || maxWidth <= 0) return [];

  if (getWordRangeWidthUnsafe(metrics, 0, n - 1) <= maxWidth) {
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
  if (n <= 0 || maxWidth <= 0) return null;

  let low = 0;
  let high = n - 1;
  let best: number | null = null;

  // Prefix fit is monotonic: if [0..k] fits, every shorter prefix fits too.
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (fitsInTwoLines(metrics, 0, middle, maxWidth)) {
      best = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return best;
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

  const fullLineFits = getWordRangeWidthUnsafe(metrics, 0, n - 1) <= maxWidth;
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
      getWordRangeCharsUnsafe(metrics, startWord, endWord) > charLimit
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
