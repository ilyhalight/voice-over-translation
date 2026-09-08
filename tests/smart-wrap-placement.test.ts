import { describe, expect, test } from "bun:test";
import {
  buildWordSlices,
  computeTokenWrapPlan,
} from "../src/subtitles/smartWrap.ts";
import { segmentText } from "../src/subtitles/segmenter.ts";
import {
  getLinguisticBreakPenalty,
  isScriptioContinua,
} from "../src/subtitles/lineBreakRules.ts";
import type { SubtitleToken } from "../src/types/subtitles.ts";

const tokenize = (text: string, locale?: string): SubtitleToken[] =>
  segmentText(text, locale).map((s) => ({
    text: s.text,
    startMs: 0,
    durationMs: 0,
    isWordLike: Boolean(s.isWordLike && s.text.trim()),
  }));

// 10px per character keeps the expected widths easy to reason about.
const measure = (text: string): number => text.length * 10;

const applyPlan = (tokens: SubtitleToken[], breakAfter: number[]): string[] => {
  const breaks = new Set(breakAfter);
  const lines: string[] = [];
  let current = "";
  tokens.forEach((token, index) => {
    current += token.text;
    if (breaks.has(index)) {
      lines.push(current);
      current = "";
    }
  });
  if (current) lines.push(current);
  return lines.map((line) => line.trim()).filter(Boolean);
};

const wrap = (text: string, maxWidthPx: number, locale?: string): string[] => {
  const tokens = tokenize(text, locale);
  const plan = computeTokenWrapPlan(tokens, measure, maxWidthPx, locale);
  return applyPlan(tokens, plan.breakAfterTokenIndices);
};

describe("subtitle placement", () => {
  test("word slices tile the token stream without overlapping", () => {
    for (const text of [
      "Dr. Smith arrived at 3 p.m. on Tuesday.",
      "Wait - did you hear that?",
      "Hello,   world!  Again...",
    ]) {
      const tokens = tokenize(text);
      const { slices } = buildWordSlices(tokens);
      const wordSlices = slices.filter((s) => !s.forcesLineBreak);

      // Slices must be contiguous and non-overlapping.
      let cursor = 0;
      for (const slice of wordSlices) {
        expect(slice.startToken).toBe(cursor);
        cursor = slice.endToken;
      }

      // Concatenating the slices must reproduce the original text exactly,
      // with no character duplicated into two adjacent slices.
      expect(wordSlices.map((s) => s.text).join("")).toBe(text);
    }
  });

  test("does not duplicate punctuation between adjacent slices", () => {
    const tokens = tokenize("Dr. Smith arrived at 3 p.m. on Tuesday.");
    const { slices } = buildWordSlices(tokens);
    const texts = slices.filter((s) => !s.forcesLineBreak).map((s) => s.text);
    expect(texts).toEqual([
      "Dr. ",
      "Smith ",
      "arrived ",
      "at ",
      "3 ",
      "p.m. ",
      "on ",
      "Tuesday.",
    ]);
  });

  test("charLength reflects the slice text and never double counts", () => {
    const text = "Wait - did you hear that?";
    const tokens = tokenize(text);
    const { slices } = buildWordSlices(tokens);
    const wordSlices = slices.filter((s) => !s.forcesLineBreak);

    // charLength is measured on the normalized (edge-trimmed) slice text.
    for (const slice of wordSlices) {
      expect(slice.charLength).toBe(slice.text.trim().length);
    }

    // Before the overlap fix the inter-word runs were counted twice, which
    // inflated the total well beyond the real character count.
    const total = wordSlices.reduce((sum, s) => sum + s.charLength, 0);
    expect(total).toBeLessThanOrEqual(text.length);
    expect(total).toBe(21);
  });

  test("a line that exactly fits is not wrapped (trailing space is not rendered)", () => {
    // "aaa bbb" is 7 chars = 70px, which exactly fits a 70px line.
    expect(wrap("aaa bbb", 70)).toEqual(["aaa bbb"]);
  });

  test("prefers a break where both lines fit over an overflowing one", () => {
    const lines = wrap("The quick brown fox jumps over the lazy dog.", 300);
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      expect(measure(line)).toBeLessThanOrEqual(300);
    }
  });

  test("does not strand an article at the end of the first line", () => {
    const lines = wrap("He walked into the room and closed the door.", 260);
    expect(lines).toHaveLength(2);
    expect(lines[0].endsWith(" the")).toBe(false);
  });

  test("scriptio-continua languages are detected", () => {
    expect(isScriptioContinua("ja")).toBe(true);
    expect(isScriptioContinua("zh-CN")).toBe(true);
    expect(isScriptioContinua("th")).toBe(true);
    expect(isScriptioContinua("en")).toBe(false);
    expect(isScriptioContinua("ru")).toBe(false);
    expect(isScriptioContinua(undefined)).toBe(false);
  });

  test("linguistic penalty punishes splitting a bound phrase", () => {
    // "the" binds forward to its noun, so ending a line on it is penalised.
    expect(getLinguisticBreakPenalty("the ", "room ", "en")).toBeGreaterThan(0);
    // A conjunction starting line 2 is rewarded, not penalised.
    expect(getLinguisticBreakPenalty("room ", "and ", "en")).toBeLessThan(0);
    // The lexicon must not be applied to space-less scripts.
    expect(getLinguisticBreakPenalty("the ", "room ", "ja")).toBe(0);
  });

  test("wraps CJK text into two lines without whitespace words", () => {
    const lines = wrap(
      "\u4eca\u65e5\u306f\u5929\u6c17\u304c\u3068\u3066\u3082\u3044\u3044\u306e\u3067\u516c\u5712\u306b\u884c\u304d\u307e\u3057\u3087\u3046\u3002",
      120,
      "ja",
    );
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join("")).toBe(
      "\u4eca\u65e5\u306f\u5929\u6c17\u304c\u3068\u3066\u3082\u3044\u3044\u306e\u3067\u516c\u5712\u306b\u884c\u304d\u307e\u3057\u3087\u3046\u3002",
    );
  });

  test("empty and whitespace-only input produce no breaks", () => {
    expect(computeTokenWrapPlan([], measure, 300).breakAfterTokenIndices).toEqual([]);
    expect(wrap("   ", 300)).toEqual([]);
  });
});
