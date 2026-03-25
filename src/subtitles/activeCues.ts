import type { SubtitleLine, SubtitleToken } from "../types/subtitles";
import { isTimeInLine } from "./layoutController";

type IndexedSubtitleLine = {
  index: number;
  line: SubtitleLine;
};

export type ActiveSubtitleRenderLine = {
  line: SubtitleLine;
  lineKey: string;
};

const createFallbackTokens = (line: SubtitleLine): SubtitleToken[] => {
  if (line.tokens.length) {
    return line.tokens;
  }

  const text = line.text.trim();
  if (!text) {
    return [];
  }

  return [
    {
      text,
      startMs: line.startMs,
      durationMs: line.durationMs,
      isWordLike: Boolean(text),
    },
  ];
};

const toRenderableTextKey = (line: SubtitleLine): string => {
  const text =
    line.text ||
    createFallbackTokens(line)
      .map((token) => token.text)
      .join("");
  return text.replaceAll(/\s+/gu, " ").trim();
};

const linesOverlapInTime = (
  left: SubtitleLine,
  right: SubtitleLine,
): boolean => {
  const leftEnd = left.startMs + Math.max(0, left.durationMs);
  const rightEnd = right.startMs + Math.max(0, right.durationMs);
  return left.startMs < rightEnd && right.startMs < leftEnd;
};

const dedupeActiveLines = (
  lines: IndexedSubtitleLine[],
): IndexedSubtitleLine[] => {
  const deduped: IndexedSubtitleLine[] = [];

  for (const entry of lines) {
    const textKey = toRenderableTextKey(entry.line);
    if (!textKey) continue;

    const isDuplicate = deduped.some((existing) => {
      return (
        textKey === toRenderableTextKey(existing.line) &&
        existing.line.speakerId === entry.line.speakerId &&
        linesOverlapInTime(existing.line, entry.line)
      );
    });

    if (!isDuplicate) {
      deduped.push(entry);
    }
  }

  return deduped;
};

const findLastCueIndexStartingAtOrBefore = (
  time: number,
  subtitlesList: readonly SubtitleLine[],
): number => {
  let low = 0;
  let high = subtitlesList.length - 1;
  let candidate = -1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const line = subtitlesList[mid];

    if (line.startMs <= time) {
      candidate = mid;
      low = mid + 1;
      continue;
    }

    high = mid - 1;
  }

  return candidate;
};

export const findActiveSubtitleLineIndices = (
  time: number,
  subtitlesList: readonly SubtitleLine[],
  maxCueDurationMs = Number.POSITIVE_INFINITY,
): number[] => {
  const lastCueIndex = findLastCueIndexStartingAtOrBefore(time, subtitlesList);
  if (lastCueIndex < 0) return [];

  const minStartMs = Number.isFinite(maxCueDurationMs)
    ? Math.max(0, time - Math.max(0, maxCueDurationMs))
    : Number.NEGATIVE_INFINITY;
  const activeLineIndices: number[] = [];

  for (let index = lastCueIndex; index >= 0; index -= 1) {
    const line = subtitlesList[index];
    if (line.startMs < minStartMs) {
      break;
    }
    if (isTimeInLine(time, line)) {
      activeLineIndices.push(index);
    }
  }

  activeLineIndices.reverse();
  return activeLineIndices;
};

export const buildActiveSubtitleRenderLine = (
  time: number,
  subtitlesList: readonly SubtitleLine[],
  maxCueDurationMs = Number.POSITIVE_INFINITY,
): ActiveSubtitleRenderLine | null => {
  const activeLineIndices = findActiveSubtitleLineIndices(
    time,
    subtitlesList,
    maxCueDurationMs,
  );
  if (!activeLineIndices.length) {
    return null;
  }

  const activeEntries = dedupeActiveLines(
    activeLineIndices.map((index) => ({
      index,
      line: subtitlesList[index],
    })),
  );
  if (!activeEntries.length) {
    return null;
  }

  if (activeEntries.length === 1) {
    const [entry] = activeEntries;
    return {
      line: entry.line,
      lineKey: `${entry.index}`,
    };
  }

  const tokens: SubtitleToken[] = [];
  const textParts: string[] = [];
  const rawTextParts: string[] = [];
  const lineKeyParts: string[] = [];
  let earliestStartMs = Number.POSITIVE_INFINITY;
  let latestEndMs = 0;

  for (const entry of activeEntries) {
    const lineTokens = createFallbackTokens(entry.line);
    if (!lineTokens.length) continue;

    if (tokens.length > 0) {
      const breakStartMs = Math.max(earliestStartMs, entry.line.startMs);
      tokens.push({
        text: "\n",
        startMs: breakStartMs,
        durationMs: 0,
        isWordLike: false,
      });
    }

    tokens.push(...lineTokens);
    textParts.push(
      entry.line.text || lineTokens.map((token) => token.text).join(""),
    );
    rawTextParts.push(entry.line.metadata?.rawText ?? entry.line.text);
    lineKeyParts.push(`${entry.index}`);
    earliestStartMs = Math.min(earliestStartMs, entry.line.startMs);
    latestEndMs = Math.max(
      latestEndMs,
      entry.line.startMs + Math.max(0, entry.line.durationMs),
    );
  }

  if (!tokens.length || !lineKeyParts.length) {
    return null;
  }

  return {
    line: {
      text: textParts.join("\n"),
      startMs: earliestStartMs,
      durationMs: Math.max(0, latestEndMs - earliestStartMs),
      speakerId: activeEntries[0]?.line.speakerId ?? "0",
      tokens,
      metadata: rawTextParts.length
        ? {
            rawText: rawTextParts.join("\n"),
          }
        : undefined,
    },
    lineKey: lineKeyParts.join(","),
  };
};
