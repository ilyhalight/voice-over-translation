import { describe, expect, test } from "bun:test";
import {
  buildWordSlices,
  computeTokenWrapPlan,
} from "../src/subtitles/smartWrap.ts";
import type { SubtitleToken } from "../src/types/subtitles.ts";

const token = (text: string, isWordLike: boolean): SubtitleToken => ({
  text,
  startMs: 0,
  durationMs: 100,
  isWordLike,
});

const measureText = (text: string): number => text.length * 10;

describe("subtitle smart wrap", () => {
  test("returns no wrap for empty, forced-break, and invalid-width input", () => {
    expect(computeTokenWrapPlan([], measureText, 100)).toEqual({
      breakAfterTokenIndices: [],
    });

    expect(
      computeTokenWrapPlan(
        [token("hello", true), token("\n", false), token("world", true)],
        measureText,
        100,
      ),
    ).toEqual({
      breakAfterTokenIndices: [],
    });

    expect(
      computeTokenWrapPlan([token("hello", true)], measureText, Number.NaN),
    ).toEqual({
      breakAfterTokenIndices: [],
    });
  });

  test("keeps normalized keys and char lengths stable", () => {
    const { key, slices } = buildWordSlices([
      token("  hello", true),
      token("   ", false),
      token("world  ", true),
    ]);

    expect(key).toBe("hello|world");
    expect(slices.map((slice) => slice.charLength)).toEqual([5, 5]);
  });

  test("avoids breaking after dangling opening punctuation", () => {
    const tokens = [
      token("Intro", true),
      token(" ", false),
      token('"', false),
      token(" ", false),
      token("quoted", true),
      token(" ", false),
      token("text", true),
      token(" ", false),
      token("continues.", true),
    ];

    expect(computeTokenWrapPlan(tokens, measureText, 55)).toEqual({
      breakAfterTokenIndices: [5],
    });
  });
});
