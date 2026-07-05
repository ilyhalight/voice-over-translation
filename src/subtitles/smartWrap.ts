import type { SubtitleToken } from "../types/subtitles";

type MeasureText = (text: string) => number;

type BoundaryKind = "neutral" | "soft" | "strong";

type TokenRange = {
  startToken: number;
  endToken: number;
};

export type WordSlice = TokenRange & {
  text: string;
  tokenIndex: number;
  breakAfterTokenIndex: number;
  charLength: number;
  startMs: number;
  endMs: number;
  boundary: BoundaryKind;
  forcesLineBreak: boolean;
};

export type MeasuredWordSlice = WordSlice & {
  width: number;
};

export type TokenPrecomputeInput = {
  wordSlices: WordSlice[];
  normalizedWordsKey: string;
};

export type TokenPrecomputeMemo = {
  tokens: SubtitleToken[];
  value: TokenPrecomputeInput;
};

export type LineMeasureMemo = {
  key: string;
  metrics: MeasuredWordSlice[];
  maxWidthPx: number;
};

export type TimedTokenSegment = {
  startToken: number;
  endToken: number;
  startMs: number;
  endMs: number;
};

export type TokenProcessingMemo = {
  key: string;
  segmentRanges: TimedTokenSegment[];
};

export type TokenWrapPlan = {
  breakAfterTokenIndices: number[];
};

type TokenTextBuffer = {
  fullText: string;
  offsets: number[];
};

const STRONG_BREAK_RE = /[.!?…:;][)"'\]»”]*\s*$/u;
const SOFT_BREAK_RE = /[,،、][)"'\]»”]*\s*$/u;
const WHITESPACE_CHAR_RE = /\s/u;
const DISCOURAGED_LINE_START_CHAR_RE = /^[\p{Pe}\p{Pf},.;:!?%\u2030\u2026]$/u;
const DISCOURAGED_LINE_END_CHAR_RE =
  /^[\p{Ps}\p{Pi}\u00BF\u00A1([{\u00AB\u201C"'`-]$/u;

const normalizeTokenText = (text: string): string =>
  text.replaceAll(/\s+/gu, " ").trim();

const getNextChar = (
  text: string,
  index: number,
): {
  char: string;
  nextIndex: number;
} | null => {
  if (index >= text.length) return null;

  const codePoint = text.codePointAt(index);
  if (codePoint === undefined) return null;

  const char = String.fromCodePoint(codePoint);
  return {
    char,
    nextIndex: index + char.length,
  };
};

const getPreviousChar = (
  text: string,
  index: number,
): {
  char: string;
  previousIndex: number;
} | null => {
  if (index <= 0) return null;

  let start = index - 1;
  const lastCodeUnit = text.charCodeAt(start);
  if (lastCodeUnit >= 0xdc00 && lastCodeUnit <= 0xdfff && start > 0) {
    start -= 1;
  }

  return {
    char: text.slice(start, index),
    previousIndex: start,
  };
};

const isWhitespaceChar = (char: string): boolean =>
  WHITESPACE_CHAR_RE.test(char);

const buildTokenTextBuffer = (tokens: SubtitleToken[]): TokenTextBuffer => {
  const offsets = new Array(tokens.length + 1);
  offsets[0] = 0;

  let fullText = "";
  for (let index = 0; index < tokens.length; index += 1) {
    fullText += tokens[index]?.text ?? "";
    offsets[index + 1] = fullText.length;
  }

  return { fullText, offsets };
};

const getBufferedTokenText = (
  buffer: TokenTextBuffer,
  startToken: number,
  endToken: number,
): string => {
  if (endToken <= startToken) return "";
  return buffer.fullText.slice(
    buffer.offsets[startToken],
    buffer.offsets[endToken],
  );
};

const resolveBoundary = (text: string): BoundaryKind => {
  if (STRONG_BREAK_RE.test(text)) return "strong";
  if (SOFT_BREAK_RE.test(text)) return "soft";
  return "neutral";
};

const rangeStartsWithDiscouragedLineStart = (
  buffer: TokenTextBuffer,
  startToken: number,
  endToken: number,
): boolean => {
  let index = buffer.offsets[startToken];
  const end = buffer.offsets[endToken];

  while (index < end) {
    const next = getNextChar(buffer.fullText, index);
    if (!next) return false;
    if (!isWhitespaceChar(next.char)) {
      return DISCOURAGED_LINE_START_CHAR_RE.test(next.char);
    }
    index = next.nextIndex;
  }

  return false;
};

const rangeEndsWithDiscouragedLineEnd = (
  buffer: TokenTextBuffer,
  startToken: number,
  endToken: number,
): boolean => {
  const start = buffer.offsets[startToken];
  let index = buffer.offsets[endToken];

  while (index > start) {
    const previous = getPreviousChar(buffer.fullText, index);
    if (!previous) return false;
    if (!isWhitespaceChar(previous.char)) {
      return DISCOURAGED_LINE_END_CHAR_RE.test(previous.char);
    }
    index = previous.previousIndex;
  }

  return false;
};

const isWordToken = (token: SubtitleToken | undefined): boolean =>
  Boolean(token?.isWordLike && token.text.trim());

const getTokenStartMs = (token: SubtitleToken | undefined): number =>
  token && Number.isFinite(token.startMs) ? token.startMs : 0;

const getTokenEndMs = (token: SubtitleToken | undefined): number =>
  token ? getTokenStartMs(token) + Math.max(0, token.durationMs) : 0;

const getRangeStartMs = (
  tokens: SubtitleToken[],
  start: number,
  end: number,
): number => {
  for (let index = start; index < end; index += 1) {
    const token = tokens[index];
    if (isWordToken(token)) {
      return getTokenStartMs(token);
    }
  }

  return getTokenStartMs(tokens[start]);
};

const getRangeEndMs = (
  tokens: SubtitleToken[],
  start: number,
  end: number,
): number => {
  for (let index = end - 1; index >= start; index -= 1) {
    const token = tokens[index];
    if (isWordToken(token)) {
      return getTokenEndMs(token);
    }
  }

  return getTokenEndMs(tokens[end - 1]);
};

const createForcedBreakSlice = (
  tokens: SubtitleToken[],
  tokenIndex: number,
): WordSlice => {
  const token = tokens[tokenIndex];
  const startMs = getTokenStartMs(token);

  return {
    text: "\n",
    tokenIndex,
    breakAfterTokenIndex: tokenIndex,
    startToken: tokenIndex,
    endToken: tokenIndex + 1,
    charLength: 0,
    startMs,
    endMs: startMs,
    boundary: "strong",
    forcesLineBreak: true,
  };
};

const buildSliceFromWord = (
  tokens: SubtitleToken[],
  wordTokenIndex: number,
  textBuffer: TokenTextBuffer,
  includeMetrics: boolean,
): WordSlice => {
  let startToken = wordTokenIndex;
  while (
    startToken > 0 &&
    tokens[startToken - 1]?.text !== "\n" &&
    !isWordToken(tokens[startToken - 1])
  ) {
    startToken -= 1;
  }

  let endToken = wordTokenIndex + 1;
  while (
    endToken < tokens.length &&
    tokens[endToken]?.text !== "\n" &&
    !isWordToken(tokens[endToken])
  ) {
    endToken += 1;
  }

  const text = getBufferedTokenText(textBuffer, startToken, endToken);

  return {
    text,
    tokenIndex: wordTokenIndex,
    breakAfterTokenIndex: endToken - 1,
    startToken,
    endToken,
    charLength: includeMetrics ? normalizeTokenText(text).length : 0,
    startMs: includeMetrics ? getRangeStartMs(tokens, startToken, endToken) : 0,
    endMs: includeMetrics ? getRangeEndMs(tokens, startToken, endToken) : 0,
    boundary: resolveBoundary(text),
    forcesLineBreak: false,
  };
};

const appendNextWordSlice = (
  slices: WordSlice[],
  keyParts: string[] | null,
  tokens: SubtitleToken[],
  textBuffer: TokenTextBuffer,
  collectKey: boolean,
  index: number,
): number => {
  const token = tokens[index];
  if (!token?.text) return index + 1;

  if (token.text === "\n") {
    const slice = createForcedBreakSlice(tokens, index);
    slices.push(slice);
    keyParts?.push("\n");
    return index + 1;
  }

  if (!isWordToken(token)) return index + 1;

  const slice = buildSliceFromWord(tokens, index, textBuffer, collectKey);
  slices.push(slice);
  keyParts?.push(normalizeTokenText(slice.text));
  return slice.breakAfterTokenIndex + 1;
};

function buildWordSlicesFromBuffer(
  tokens: SubtitleToken[],
  textBuffer: TokenTextBuffer,
  collectKey: boolean,
): {
  slices: WordSlice[];
  key: string;
} {
  const slices: WordSlice[] = [];
  const keyParts: string[] | null = collectKey ? [] : null;

  let index = 0;
  while (index < tokens.length) {
    index = appendNextWordSlice(
      slices,
      keyParts,
      tokens,
      textBuffer,
      collectKey,
      index,
    );
  }

  return {
    slices,
    key: keyParts?.join("|") ?? "",
  };
}

export function buildWordSlices(tokens: SubtitleToken[]): {
  slices: WordSlice[];
  key: string;
} {
  return buildWordSlicesFromBuffer(tokens, buildTokenTextBuffer(tokens), true);
}

export function measureWordSlices(
  wordSlices: WordSlice[],
  measureText: MeasureText,
): MeasuredWordSlice[] {
  return wordSlices.map((slice) => ({
    ...slice,
    width: slice.forcesLineBreak ? 0 : measureText(slice.text),
  }));
}

const getSegmentEndMs = (
  tokens: SubtitleToken[],
  endTokenExclusive: number,
): number => {
  if (endTokenExclusive <= 0) return 0;
  return getTokenEndMs(tokens[endTokenExclusive - 1]);
};

const finalizeSegment = (
  out: TimedTokenSegment[],
  tokens: SubtitleToken[],
  startToken: number,
  endToken: number,
): void => {
  if (endToken <= startToken) return;

  const startMs = getRangeStartMs(tokens, startToken, endToken);
  const endMs = getSegmentEndMs(tokens, endToken);

  out.push({
    startToken,
    endToken,
    startMs,
    endMs: Math.max(startMs, endMs),
  });
};

type SegmentBuildState = {
  segmentStartToken: number;
  segmentCharLength: number;
  currentLineWidth: number;
  currentLineCount: number;
  lastTokenInSegment: number;
};

const createSegmentBuildState = (
  metrics: MeasuredWordSlice[],
): SegmentBuildState => ({
  segmentStartToken: metrics[0].startToken,
  segmentCharLength: 0,
  currentLineWidth: 0,
  currentLineCount: 1,
  lastTokenInSegment: metrics[0].startToken,
});

const handleForcedBreakMetric = (
  state: SegmentBuildState,
  segments: TimedTokenSegment[],
  tokens: SubtitleToken[],
  metric: MeasuredWordSlice,
): void => {
  state.currentLineCount += 1;
  state.currentLineWidth = 0;
  state.lastTokenInSegment = metric.endToken;

  if (state.currentLineCount > 2) {
    const splitToken = Math.max(metric.startToken, metric.tokenIndex);
    finalizeSegment(segments, tokens, state.segmentStartToken, splitToken);
    state.segmentStartToken = splitToken;
    state.segmentCharLength = 0;
    state.lastTokenInSegment = state.segmentStartToken;
  }
};

const appendMetricToCurrentLine = (
  state: SegmentBuildState,
  metric: MeasuredWordSlice,
  nextCharLength: number,
): void => {
  state.currentLineWidth += metric.width;
  state.segmentCharLength = nextCharLength;
  state.lastTokenInSegment = metric.endToken;
};

const startSecondLineWithMetric = (
  state: SegmentBuildState,
  metric: MeasuredWordSlice,
  nextCharLength: number,
): void => {
  state.currentLineCount = 2;
  state.currentLineWidth = metric.width;
  state.segmentCharLength = nextCharLength;
  state.lastTokenInSegment = metric.endToken;
};

const startNewSegmentWithMetric = (
  state: SegmentBuildState,
  segments: TimedTokenSegment[],
  tokens: SubtitleToken[],
  metric: MeasuredWordSlice,
): void => {
  const splitToken = Math.max(metric.startToken, metric.tokenIndex);
  finalizeSegment(segments, tokens, state.segmentStartToken, splitToken);
  state.segmentStartToken = splitToken;
  state.segmentCharLength = metric.charLength;
  state.currentLineWidth = metric.width;
  state.currentLineCount = 1;
  state.lastTokenInSegment = metric.endToken;
};

const handleMeasuredWordMetric = (
  state: SegmentBuildState,
  segments: TimedTokenSegment[],
  tokens: SubtitleToken[],
  metric: MeasuredWordSlice,
  maxWidth: number,
  charBudget: number,
): void => {
  const nextCharLength = state.segmentCharLength + metric.charLength;
  const fitsCurrentLine =
    state.currentLineWidth === 0 ||
    state.currentLineWidth + metric.width <= maxWidth;

  if (fitsCurrentLine && nextCharLength <= charBudget) {
    appendMetricToCurrentLine(state, metric, nextCharLength);
    return;
  }

  if (state.currentLineCount === 1) {
    startSecondLineWithMetric(state, metric, nextCharLength);
    return;
  }

  startNewSegmentWithMetric(state, segments, tokens, metric);
};

const alignSegmentEndTimes = (segments: TimedTokenSegment[]): void => {
  for (let index = 0; index < segments.length - 1; index += 1) {
    const current = segments[index];
    const next = segments[index + 1];
    if (next.startMs > current.startMs) {
      current.endMs = next.startMs;
    }
  }
};

const extendLastSegmentEndTime = (
  tokens: SubtitleToken[],
  segments: TimedTokenSegment[],
): void => {
  const last = segments.at(-1);
  if (!last) return;

  last.endMs = Math.max(
    last.endMs,
    getRangeEndMs(tokens, last.startToken, last.endToken),
  );
};

const finalizeComputedSegments = (
  tokens: SubtitleToken[],
  segments: TimedTokenSegment[],
): TimedTokenSegment[] => {
  alignSegmentEndTimes(segments);
  extendLastSegmentEndTime(tokens, segments);
  return segments.filter((segment) => segment.endToken > segment.startToken);
};

export function computeTwoLineSegments(
  tokens: SubtitleToken[],
  metrics: MeasuredWordSlice[],
  maxWidthPx: number,
  maxLength: number,
): TimedTokenSegment[] {
  if (!metrics.length || !tokens.length) {
    return [];
  }

  const maxWidth = Math.max(1, Number.isFinite(maxWidthPx) ? maxWidthPx : 0);
  const charBudget = Math.max(1, Number.isFinite(maxLength) ? maxLength : 0);
  const segments: TimedTokenSegment[] = [];
  const state = createSegmentBuildState(metrics);

  for (const metric of metrics) {
    if (metric.forcesLineBreak) {
      handleForcedBreakMetric(state, segments, tokens, metric);
      continue;
    }

    handleMeasuredWordMetric(
      state,
      segments,
      tokens,
      metric,
      maxWidth,
      charBudget,
    );
  }

  finalizeSegment(
    segments,
    tokens,
    state.segmentStartToken,
    state.lastTokenInSegment,
  );
  return finalizeComputedSegments(tokens, segments);
}

const measureTokenRange = (
  textBuffer: TokenTextBuffer,
  startToken: number,
  endToken: number,
  measureText: MeasureText,
): number => {
  if (endToken <= startToken) return 0;

  return measureText(getBufferedTokenText(textBuffer, startToken, endToken));
};

const scoreBreakCandidate = ({
  firstWidth,
  secondWidth,
  lineStartPenalty,
  lineEndPenalty,
  firstWordCount,
  secondWordCount,
  maxWidthPx,
  boundary,
}: {
  firstWidth: number;
  secondWidth: number;
  lineStartPenalty: number;
  lineEndPenalty: number;
  firstWordCount: number;
  secondWordCount: number;
  maxWidthPx: number;
  boundary: BoundaryKind;
}): number => {
  const overflowPenalty =
    Math.max(0, firstWidth - maxWidthPx) * 12 +
    Math.max(0, secondWidth - maxWidthPx) * 12;
  const balanceTarget = 1.08;
  const balancePenalty =
    Math.abs(secondWidth / Math.max(firstWidth, 1) - balanceTarget) * 120;
  const shortTopPenalty = firstWordCount < 2 ? 80 : 0;
  const orphanPenalty = secondWordCount < 2 ? 80 : 0;
  let boundaryBonus = 0;
  if (boundary === "strong") {
    boundaryBonus = -28;
  } else if (boundary === "soft") {
    boundaryBonus = -14;
  }

  return (
    overflowPenalty +
    balancePenalty +
    shortTopPenalty +
    orphanPenalty +
    lineStartPenalty +
    lineEndPenalty +
    boundaryBonus
  );
};

const emptyTokenWrapPlan = (): TokenWrapPlan => ({
  breakAfterTokenIndices: [],
});

const singleBreakTokenWrapPlan = (
  breakAfterTokenIndex: number,
): TokenWrapPlan => ({
  breakAfterTokenIndices: [breakAfterTokenIndex],
});

const hasForcedLineBreakToken = (tokens: SubtitleToken[]): boolean =>
  tokens.some((token) => token.text === "\n");

const findBestWordBreakAfterTokenIndex = (
  tokens: SubtitleToken[],
  textBuffer: TokenTextBuffer,
  measurableSlices: WordSlice[],
  measureText: MeasureText,
  maxWidthPx: number,
): number | null => {
  let bestBreakAfterTokenIndex: number | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let index = 0; index < measurableSlices.length - 1; index += 1) {
    const slice = measurableSlices[index];
    const nextSlice = measurableSlices[index + 1];
    const candidateBreakAfterTokenIndex = Math.max(
      slice.breakAfterTokenIndex,
      nextSlice.tokenIndex - 1,
    );
    const firstEndToken = candidateBreakAfterTokenIndex + 1;
    const secondStartToken = nextSlice.tokenIndex;
    const firstWidth = measureTokenRange(
      textBuffer,
      0,
      firstEndToken,
      measureText,
    );
    const secondWidth = measureTokenRange(
      textBuffer,
      secondStartToken,
      tokens.length,
      measureText,
    );
    const score = scoreBreakCandidate({
      firstWidth,
      secondWidth,
      lineStartPenalty: rangeStartsWithDiscouragedLineStart(
        textBuffer,
        secondStartToken,
        tokens.length,
      )
        ? 260
        : 0,
      lineEndPenalty: rangeEndsWithDiscouragedLineEnd(
        textBuffer,
        0,
        firstEndToken,
      )
        ? 70
        : 0,
      firstWordCount: index + 1,
      secondWordCount: measurableSlices.length - (index + 1),
      maxWidthPx,
      boundary: slice.boundary,
    });

    if (score < bestScore) {
      bestScore = score;
      bestBreakAfterTokenIndex = candidateBreakAfterTokenIndex;
    }
  }

  return bestBreakAfterTokenIndex;
};

export function computeTokenWrapPlan(
  tokens: SubtitleToken[],
  measureText: MeasureText,
  maxWidthPx: number,
): TokenWrapPlan {
  if (!tokens.length || hasForcedLineBreakToken(tokens)) {
    return emptyTokenWrapPlan();
  }

  const safeMaxWidthPx = Number.isFinite(maxWidthPx) ? maxWidthPx : 0;
  if (safeMaxWidthPx <= 0) {
    return emptyTokenWrapPlan();
  }

  const textBuffer = buildTokenTextBuffer(tokens);
  const { slices } = buildWordSlicesFromBuffer(tokens, textBuffer, false);
  const measurableSlices = slices.filter((slice) => !slice.forcesLineBreak);
  if (!measurableSlices.length) {
    return emptyTokenWrapPlan();
  }

  const singleLineWidth = measureTokenRange(
    textBuffer,
    0,
    tokens.length,
    measureText,
  );
  if (singleLineWidth <= safeMaxWidthPx) {
    return emptyTokenWrapPlan();
  }

  const bestBreakAfterTokenIndex = findBestWordBreakAfterTokenIndex(
    tokens,
    textBuffer,
    measurableSlices,
    measureText,
    safeMaxWidthPx,
  );
  if (bestBreakAfterTokenIndex !== null) {
    return singleBreakTokenWrapPlan(bestBreakAfterTokenIndex);
  }

  return emptyTokenWrapPlan();
}
