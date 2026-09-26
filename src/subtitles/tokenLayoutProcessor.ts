import type { SubtitleToken } from "../types/subtitles";
import {
  applyWrapWidthGuard,
  buildWordSlices,
  computeTwoLineSegments,
  type MeasuredWordSlice,
  measureWordSlices,
  type TimedTokenSegment,
  type WordSlice,
} from "./smartWrap";

export type TokenLayoutMeasurement = {
  fontKey: string;
  maxWidthPx: number;
  measureText: (text: string) => number;
};

export type TokenLayoutProcessInput = {
  tokens: SubtitleToken[];
  time: number;
  activeLineKey: string;
  maxLength: number;
  getMeasurement: () => TokenLayoutMeasurement | null;
};

type TokenPrecomputeMemo = {
  tokens: SubtitleToken[];
  wordSlices: WordSlice[];
  normalizedWordsKey: string;
};

type LineMeasureMemo = {
  key: string;
  metrics: MeasuredWordSlice[];
  maxWidthPx: number;
};

type TokenProcessingMemo = {
  key: string;
  segmentRanges: TimedTokenSegment[];
};

export class TokenLayoutProcessor {
  private tokenProcessingMemo: TokenProcessingMemo | null = null;
  private tokenPrecomputeMemo: TokenPrecomputeMemo | null = null;
  private lineMeasureMemo: LineMeasureMemo | null = null;
  private lastSegmentIndex = 0;

  reset(): void {
    this.tokenProcessingMemo = null;
    this.tokenPrecomputeMemo = null;
    this.lineMeasureMemo = null;
    this.lastSegmentIndex = 0;
  }

  process({
    tokens,
    time,
    activeLineKey,
    maxLength,
    getMeasurement,
  }: TokenLayoutProcessInput): SubtitleToken[] {
    if (!tokens.length) return tokens;
    const memo = this.buildTokenProcessingMemo(
      tokens,
      activeLineKey,
      maxLength,
      getMeasurement,
    );
    if (!memo) {
      return this.selectTokensByMaxLength(tokens, time, maxLength);
    }
    const { segmentRanges } = memo;
    if (!segmentRanges.length) {
      return this.trimEdgeWhitespaceTokens(tokens);
    }
    const segmentIndex = this.selectSegmentIndexFromRanges(segmentRanges, time);
    const segment = segmentRanges[segmentIndex];
    return this.trimEdgeWhitespaceTokens(
      tokens.slice(segment.startToken, segment.endToken),
    );
  }

  private trimEdgeWhitespaceTokens(tokens: SubtitleToken[]): SubtitleToken[] {
    if (!tokens.length) return tokens;
    let start = 0;
    let end = tokens.length;
    while (start < end && !tokens[start]?.text.trim()) start += 1;
    while (end > start && !tokens[end - 1]?.text.trim()) end -= 1;
    if (start === 0 && end === tokens.length) return tokens;
    return start >= end ? [] : tokens.slice(start, end);
  }

  private selectTokensByMaxLength(
    tokens: SubtitleToken[],
    time: number,
    maxLength: number,
  ): SubtitleToken[] {
    let start = 0;
    let length = 0;
    let overflowed = false;
    let chosenStart = 0;
    let chosenEnd = tokens.length;
    let hasChosenRange = false;
    let matchedByTime = false;
    const considerRange = (rangeStart: number, rangeEnd: number): void => {
      if (rangeEnd <= rangeStart) return;
      if (!hasChosenRange) {
        chosenStart = rangeStart;
        chosenEnd = rangeEnd;
        hasChosenRange = true;
      }
      if (matchedByTime) return;
      const first = tokens[rangeStart];
      const last = tokens[rangeEnd - 1];
      if (!first || !last) return;
      const nextStartMs =
        rangeEnd < tokens.length ? tokens[rangeEnd]?.startMs : undefined;
      const endMs = nextStartMs ?? last.startMs + (last.durationMs ?? 0);
      if (first.startMs <= time && time < endMs) {
        chosenStart = rangeStart;
        chosenEnd = rangeEnd;
        matchedByTime = true;
      }
    };
    for (const [index, token] of tokens.entries()) {
      const nextLength = length + token.text.length;
      if (nextLength > maxLength && index > start) {
        overflowed = true;
        considerRange(start, index);
        start = index;
        length = token.text.length;
        continue;
      }
      length = nextLength;
    }
    if (!overflowed) {
      return this.trimEdgeWhitespaceTokens(tokens);
    }
    considerRange(start, tokens.length);
    return this.trimEdgeWhitespaceTokens(tokens.slice(chosenStart, chosenEnd));
  }

  private buildTokenPrecomputeInput(
    tokens: SubtitleToken[],
  ): TokenPrecomputeMemo {
    const cached = this.tokenPrecomputeMemo;
    if (cached?.tokens === tokens) return cached;
    const { slices, key } = buildWordSlices(tokens);
    const value = {
      tokens,
      wordSlices: slices,
      normalizedWordsKey: key,
    };
    this.tokenPrecomputeMemo = value;
    return value;
  }

  private getLineMeasureMemo(
    tokens: SubtitleToken[],
    activeLineKey: string,
    getMeasurement: () => TokenLayoutMeasurement | null,
  ): LineMeasureMemo | null {
    const { wordSlices, normalizedWordsKey } =
      this.buildTokenPrecomputeInput(tokens);
    if (!wordSlices.length) return null;
    const measurement = getMeasurement();
    if (
      !measurement ||
      !Number.isFinite(measurement.maxWidthPx) ||
      measurement.maxWidthPx < 24
    ) {
      return null;
    }
    const key = `${activeLineKey}|${measurement.fontKey}|${Math.round(
      measurement.maxWidthPx,
    )}|${normalizedWordsKey}`;
    if (this.lineMeasureMemo?.key === key) {
      return this.lineMeasureMemo;
    }
    const memo = {
      key,
      metrics: measureWordSlices(wordSlices, measurement.measureText),
      maxWidthPx: measurement.maxWidthPx,
    };
    this.lineMeasureMemo = memo;
    return memo;
  }

  private buildTokenProcessingMemo(
    tokens: SubtitleToken[],
    activeLineKey: string,
    maxLength: number,
    getMeasurement: () => TokenLayoutMeasurement | null,
  ): TokenProcessingMemo | null {
    const lineMeasure = this.getLineMeasureMemo(
      tokens,
      activeLineKey,
      getMeasurement,
    );
    if (!lineMeasure) return null;
    const memoKey = `${lineMeasure.key}|${maxLength}`;
    if (this.tokenProcessingMemo?.key === memoKey) {
      return this.tokenProcessingMemo;
    }
    const memo = {
      key: memoKey,
      segmentRanges: computeTwoLineSegments(
        tokens,
        lineMeasure.metrics,
        applyWrapWidthGuard(lineMeasure.maxWidthPx),
        maxLength,
      ),
    };
    this.tokenProcessingMemo = memo;
    this.lastSegmentIndex = 0;
    return memo;
  }

  private selectSegmentIndexFromRanges(
    segmentRanges: TimedTokenSegment[],
    time: number,
  ): number {
    let index = this.lastSegmentIndex;
    const length = segmentRanges.length;
    if (index >= length) index = 0;
    while (index < length - 1 && time >= segmentRanges[index].endMs) {
      index += 1;
    }
    while (index > 0 && time < segmentRanges[index].startMs) {
      index -= 1;
    }
    if (
      time >= segmentRanges[index].startMs &&
      time < segmentRanges[index].endMs
    ) {
      this.lastSegmentIndex = index;
      return index;
    }
    const found = segmentRanges.findIndex(
      (segment) => time >= segment.startMs && time < segment.endMs,
    );
    const resolved =
      found >= 0 ? found : time < segmentRanges[0].startMs ? 0 : length - 1;
    this.lastSegmentIndex = resolved;
    return resolved;
  }
}
