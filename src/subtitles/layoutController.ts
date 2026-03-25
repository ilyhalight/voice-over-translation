import type { SubtitleLine } from "../types/subtitles";

export function isTimeInLine(time: number, line: SubtitleLine): boolean {
  return time >= line.startMs && time < line.startMs + line.durationMs;
}
