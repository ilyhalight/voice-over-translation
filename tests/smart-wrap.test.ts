import { describe, expect, test } from "bun:test";
import {
  buildWordSlices,
  computeTokenWrapPlan,
} from "../src/subtitles/smartWrap.ts";
import { TokenLayoutProcessor } from "../src/subtitles/tokenLayoutProcessor.ts";
import type { SubtitleToken } from "../src/types/subtitles.ts";

const token = (text: string, isWordLike: boolean): SubtitleToken => ({
  text,
  startMs: 0,
  durationMs: 100,
  isWordLike,
});

const measureText = (text: string): number => text.length * 10;

const timedToken = (text: string, startMs: number): SubtitleToken => ({
  text,
  startMs,
  durationMs: 100,
  isWordLike: true,
});

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

  test("selects timed two-line segments across boundaries and seeks", () => {
    const processor = new TokenLayoutProcessor();
    const tokens = [
      timedToken("one", 0),
      timedToken("two", 100),
      timedToken("three", 200),
      timedToken("four", 300),
    ];
    let measureCalls = 0;
    const processAt = (time: number) =>
      processor.process({
        tokens,
        time,
        activeLineKey: "line",
        maxLength: 300,
        getMeasurement: () => ({
          fontKey: "test",
          maxWidthPx: 50,
          measureText: (text) => {
            measureCalls += 1;
            return measureText(text);
          },
        }),
      });

    expect(processAt(199).map(({ text }) => text)).toEqual(["one", "two"]);
    expect(processAt(200).map(({ text }) => text)).toEqual(["three", "four"]);
    expect(processAt(50).map(({ text }) => text)).toEqual(["one", "two"]);
    expect(measureCalls).toBe(4);

    processor.reset();
    processAt(50);
    expect(measureCalls).toBe(8);
  });

  test("keeps measurement lazy and falls back to max-length segments", () => {
    const processor = new TokenLayoutProcessor();
    let measurementReads = 0;
    const getMeasurement = () => {
      measurementReads += 1;
      return null;
    };

    expect(
      processor.process({
        tokens: [],
        time: 0,
        activeLineKey: "empty",
        maxLength: 5,
        getMeasurement,
      }),
    ).toEqual([]);
    expect(
      processor.process({
        tokens: [token(" ", false)],
        time: 0,
        activeLineKey: "whitespace",
        maxLength: 5,
        getMeasurement,
      }),
    ).toEqual([]);
    expect(measurementReads).toBe(0);

    const tokens = [timedToken("one", 0), timedToken(" second", 100)];
    expect(
      processor.process({
        tokens,
        time: 150,
        activeLineKey: "fallback",
        maxLength: 5,
        getMeasurement,
      }),
    ).toEqual([tokens[1]]);
    expect(measurementReads).toBe(1);
  });
});
