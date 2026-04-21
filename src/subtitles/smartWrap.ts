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
const DISCOURAGED_LINE_START_RE = /^\s*[\p{Pe}\p{Pf},.;:!?%‰…]/u;
const DISCOURAGED_LINE_END_RE = /\s*[\p{Ps}\p{Pi}¿¡([{«“"'`-]\s*$/u;

const normalizeTokenText = (text: string): string =>
  text.replaceAll(/\s+/gu, " ").trim();

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

const startsWithDiscouragedLineStart = (text: string): boolean =>
  DISCOURAGED_LINE_START_RE.test(text);

const endsWithDiscouragedLineEnd = (text: string): boolean =>
  DISCOURAGED_LINE_END_RE.test(text);

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
    charLength: normalizeTokenText(text).length,
    startMs: getRangeStartMs(tokens, startToken, endToken),
    endMs: getRangeEndMs(tokens, startToken, endToken),
    boundary: resolveBoundary(text),
    forcesLineBreak: false,
  };
};

export function buildWordSlices(tokens: SubtitleToken[]): {
  slices: WordSlice[];
  key: string;
} {
  const textBuffer = buildTokenTextBuffer(tokens);
  const slices: WordSlice[] = [];
  const keyParts: string[] = [];

  let index = 0;
  while (index < tokens.length) {
    const token = tokens[index];
    if (!token?.text) {
      index += 1;
      continue;
    }

    if (token.text === "\n") {
      const slice = createForcedBreakSlice(tokens, index);
      slices.push(slice);
      keyParts.push("\n");
      index += 1;
      continue;
    }

    if (!isWordToken(token)) {
      index += 1;
      continue;
    }

    const slice = buildSliceFromWord(tokens, index, textBuffer);
    slices.push(slice);
    keyParts.push(normalizeTokenText(slice.text));
    index = slice.breakAfterTokenIndex + 1;
  }

  if (!slices.length && tokens.length) {
    const text = textBuffer.fullText;
    slices.push({
      text,
      tokenIndex: 0,
      breakAfterTokenIndex: tokens.length - 1,
      startToken: 0,
      endToken: tokens.length,
      charLength: normalizeTokenText(text).length,
      startMs: getRangeStartMs(tokens, 0, tokens.length),
      endMs: getRangeEndMs(tokens, 0, tokens.length),
      boundary: resolveBoundary(text),
      forcesLineBreak: false,
    });
    keyParts.push(normalizeTokenText(text));
  }

  return {
    slices,
    key: keyParts.join("|"),
  };
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

  let segmentStartToken = metrics[0].startToken;
  let segmentCharLength = 0;
  let currentLineWidth = 0;
  let currentLineCount = 1;
  let lastTokenInSegment = segmentStartToken;

  for (const metric of metrics) {
    if (metric.forcesLineBreak) {
      currentLineCount += 1;
      currentLineWidth = 0;
      lastTokenInSegment = metric.endToken;

      if (currentLineCount > 2) {
        const splitToken = Math.max(metric.startToken, metric.tokenIndex);
        finalizeSegment(segments, tokens, segmentStartToken, splitToken);
        segmentStartToken = splitToken;
        segmentCharLength = 0;
        lastTokenInSegment = segmentStartToken;
      }
      continue;
    }

    const nextCharLength = segmentCharLength + metric.charLength;
    const fitsCurrentLine =
      currentLineWidth === 0 || currentLineWidth + metric.width <= maxWidth;

    if (fitsCurrentLine && nextCharLength <= charBudget) {
      currentLineWidth += metric.width;
      segmentCharLength = nextCharLength;
      lastTokenInSegment = metric.endToken;
      continue;
    }

    if (currentLineCount === 1) {
      currentLineCount = 2;
      currentLineWidth = metric.width;
      segmentCharLength = nextCharLength;
      lastTokenInSegment = metric.endToken;
      continue;
    }

    const splitToken = Math.max(metric.startToken, metric.tokenIndex);
    finalizeSegment(segments, tokens, segmentStartToken, splitToken);
    segmentStartToken = splitToken;
    segmentCharLength = metric.charLength;
    currentLineWidth = metric.width;
    currentLineCount = 1;
    lastTokenInSegment = metric.endToken;
  }

  finalizeSegment(segments, tokens, segmentStartToken, lastTokenInSegment);

  if (!segments.length) {
    return [
      {
        startToken: 0,
        endToken: tokens.length,
        startMs: getRangeStartMs(tokens, 0, tokens.length),
        endMs: getRangeEndMs(tokens, 0, tokens.length),
      },
    ];
  }

  for (let index = 0; index < segments.length - 1; index += 1) {
    const current = segments[index];
    const next = segments[index + 1];
    if (next.startMs > current.startMs) {
      current.endMs = next.startMs;
    }
  }

  const last = segments.at(-1);
  if (last) {
    last.endMs = Math.max(
      last.endMs,
      getRangeEndMs(tokens, last.startToken, last.endToken),
    );
  }

  return segments.filter((segment) => segment.endToken > segment.startToken);
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

const resolveSafeBreakAfterTokenIndex = (
  tokens: SubtitleToken[],
  breakAfterTokenIndex: number,
): number => {
  let safeBreakIndex = breakAfterTokenIndex;

  while (
    safeBreakIndex + 1 < tokens.length &&
    tokens[safeBreakIndex + 1]?.text !== "\n" &&
    !tokens[safeBreakIndex + 1]?.isWordLike
  ) {
    safeBreakIndex += 1;
  }

  return safeBreakIndex;
};

const findFallbackBreakAfterTokenIndex = (
  tokens: SubtitleToken[],
  textBuffer: TokenTextBuffer,
  measureText: MeasureText,
  maxWidthPx: number,
): number | null => {
  let bestBreakAfterTokenIndex: number | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let index = 0; index < tokens.length - 1; index += 1) {
    const token = tokens[index];
    const nextToken = tokens[index + 1];
    if (!token?.text || !nextToken?.text || nextToken.text === "\n") {
      continue;
    }

    const candidateBreakAfterTokenIndex = resolveSafeBreakAfterTokenIndex(
      tokens,
      index,
    );
    if (candidateBreakAfterTokenIndex >= tokens.length - 1) {
      continue;
    }

    const firstEndToken = candidateBreakAfterTokenIndex + 1;
    const secondStartToken = firstEndToken;
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
    const firstText = getBufferedTokenText(textBuffer, 0, firstEndToken);
    const secondText = getBufferedTokenText(
      textBuffer,
      secondStartToken,
      tokens.length,
    );
    const score =
      Math.max(0, firstWidth - maxWidthPx) * 12 +
      Math.max(0, secondWidth - maxWidthPx) * 12 +
      Math.abs(secondWidth - firstWidth) * 0.4 +
      (startsWithDiscouragedLineStart(secondText) ? 260 : 0) +
      (endsWithDiscouragedLineEnd(firstText) ? 70 : 0);

    if (score < bestScore) {
      bestScore = score;
      bestBreakAfterTokenIndex = candidateBreakAfterTokenIndex;
    }
  }

  return bestBreakAfterTokenIndex;
};

const scoreBreakCandidate = ({
  firstWidth,
  secondWidth,
  firstText,
  secondText,
  firstWordCount,
  secondWordCount,
  maxWidthPx,
  boundary,
}: {
  firstWidth: number;
  secondWidth: number;
  firstText: string;
  secondText: string;
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
  const lineStartPenalty = startsWithDiscouragedLineStart(secondText) ? 260 : 0;
  const lineEndPenalty = endsWithDiscouragedLineEnd(firstText) ? 70 : 0;
  const boundaryBonus =
    boundary === "strong" ? -28 : boundary === "soft" ? -14 : 0;

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

export function computeTokenWrapPlan(
  tokens: SubtitleToken[],
  measureText: MeasureText,
  maxWidthPx: number,
): TokenWrapPlan {
  if (!tokens.length) {
    return {
      breakAfterTokenIndices: [],
    };
  }

  for (const token of tokens) {
    if (token.text === "\n") {
      return {
        breakAfterTokenIndices: [],
      };
    }
  }

  const textBuffer = buildTokenTextBuffer(tokens);
  const safeMaxWidthPx = Number.isFinite(maxWidthPx) ? maxWidthPx : 0;
  if (safeMaxWidthPx <= 0) {
    return {
      breakAfterTokenIndices: [],
    };
  }

  const { slices } = buildWordSlices(tokens);
  const measurableSlices = slices.filter((slice) => !slice.forcesLineBreak);
  if (!measurableSlices.length) {
    return {
      breakAfterTokenIndices: [],
    };
  }

  const singleLineWidth = measureTokenRange(
    textBuffer,
    0,
    tokens.length,
    measureText,
  );
  if (singleLineWidth <= safeMaxWidthPx) {
    return {
      breakAfterTokenIndices: [],
    };
  }

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
    const firstText = getBufferedTokenText(textBuffer, 0, firstEndToken);
    const secondText = getBufferedTokenText(
      textBuffer,
      secondStartToken,
      tokens.length,
    );
    const score = scoreBreakCandidate({
      firstWidth,
      secondWidth,
      firstText,
      secondText,
      firstWordCount: index + 1,
      secondWordCount: measurableSlices.length - (index + 1),
      maxWidthPx: safeMaxWidthPx,
      boundary: slice.boundary,
    });

    if (score < bestScore) {
      bestScore = score;
      bestBreakAfterTokenIndex = candidateBreakAfterTokenIndex;
    }
  }

  if (bestBreakAfterTokenIndex !== null) {
    return {
      breakAfterTokenIndices: [bestBreakAfterTokenIndex],
    };
  }

  const fallbackBreakAfterTokenIndex = findFallbackBreakAfterTokenIndex(
    tokens,
    textBuffer,
    measureText,
    safeMaxWidthPx,
  );
  if (fallbackBreakAfterTokenIndex !== null) {
    return {
      breakAfterTokenIndices: [fallbackBreakAfterTokenIndex],
    };
  }

  return {
    breakAfterTokenIndices: [],
  };
}
