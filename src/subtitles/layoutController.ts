import type { SubtitleLine } from "./types";

export function isTimeInLine(time: number, line: SubtitleLine): boolean {
  return time >= line.startMs && time < line.startMs + line.durationMs;
}

export function findActiveSubtitleLineIndex(
  time: number,
  subtitlesList: SubtitleLine[],
): number {
  let low = 0;
  let high = subtitlesList.length - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const line = subtitlesList[mid];

    if (time < line.startMs) {
      high = mid - 1;
    } else if (time >= line.startMs + line.durationMs) {
      low = mid + 1;
    } else {
      return mid;
    }
  }

  return -1;
}

export function getLayoutAffectingKey(
  subtitleTokensKey: string,
  wrapKey: string,
  variantKey = 0,
): string {
  return `${subtitleTokensKey}:${wrapKey}:${variantKey}`;
}
