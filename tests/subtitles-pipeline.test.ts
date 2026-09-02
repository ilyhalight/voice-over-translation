import { describe, expect, test } from "bun:test";
import {
  parseSubtitleText,
  serializeProcessedSubtitles,
} from "../src/subtitles/standards";
import { findNextCueBoundaryMs } from "../src/subtitles/wakeSchedule";
import type {
  ProcessedSubtitles,
  SubtitleFormat,
  SubtitleLine,
} from "../src/types/subtitles";
import { subtitleFontFamilyCss } from "../src/types/subtitles";

Object.assign(globalThis, { DEBUG_MODE: false });
const { SubtitlesProcessor } = await import("../src/subtitles/processor");

const line = (
  startMs: number,
  durationMs: number,
  text = "cue",
): SubtitleLine => ({
  text,
  startMs,
  durationMs,
  speakerId: "0",
  tokens: [],
});

const comparableLines = (processed: ProcessedSubtitles) =>
  processed.subtitles.map(({ text, startMs, durationMs, speakerId }) => ({
    text,
    startMs,
    durationMs,
    speakerId,
  }));

describe("subtitle pipeline", () => {
  test("uses valid font stacks", () => {
    expect(subtitleFontFamilyCss["default-sans"]).toBe(
      '"Roboto", "Segoe UI", system-ui, sans-serif',
    );
  });

  test("schedules actual cue ends within the bounded scan", () => {
    expect(findNextCueBoundaryMs(990, [line(0, 1_000)], 1_000)).toBe(1_000);
    expect(
      findNextCueBoundaryMs(600, [line(0, 2_000), line(500, 200)], 2_000),
    ).toBe(700);
  });

  test("keeps YouTube token timings inside their cue", () => {
    const processed = SubtitlesProcessor.formatYoutubeSubtitles(
      {
        events: [
          {
            tStartMs: 1_000,
            dDurationMs: 2_000,
            segs: [
              { utf8: "Hello", tOffsetMs: 500 },
              { utf8: "world", tOffsetMs: 1_000 },
            ],
          },
        ],
      },
      true,
    );
    const tokens = processed.subtitles[0].tokens.filter(
      (token) => token.durationMs > 0,
    );

    expect(
      tokens.map(({ startMs, durationMs }) => ({ startMs, durationMs })),
    ).toEqual([
      { startMs: 1_500, durationMs: 500 },
      { startMs: 2_000, durationMs: 1_000 },
    ]);
  });
});

describe("subtitle standard round trips", () => {
  const cases: Array<{
    format: Exclude<SubtitleFormat, "json">;
    source: string;
    preservedText: string;
  }> = [
    {
      format: "srt",
      source: ["1", "00:00:01,000 --> 00:00:02,500", "<b>Hello</b>"].join("\n"),
      preservedText: "<b>Hello</b>",
    },
    {
      format: "vtt",
      source: [
        "WEBVTT Example",
        "",
        "STYLE",
        "::cue { color: lime; }",
        "",
        "cue-1",
        "00:01.000 --> 00:02.500 align:start",
        "<v Alice>Hello</v>",
      ].join("\n"),
      preservedText: "::cue { color: lime; }",
    },
    {
      format: "ass",
      source: [
        "[Script Info]",
        "Title: Example",
        "ScriptType: v4.00+",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize",
        "Style: Default,Arial,42",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
        String.raw`Dialogue: 0,0:00:01.00,0:00:02.50,Default,Alice,0,0,0,,{\b1}Hello`,
      ].join("\n"),
      preservedText: "Style: Default,Arial,42",
    },
  ];

  for (const { format, source, preservedText } of cases) {
    test(`${format} parse and serialize`, () => {
      const parsed = parseSubtitleText(source, format);
      const serialized = serializeProcessedSubtitles(parsed, format);

      expect(typeof serialized).toBe("string");
      expect(serialized).toContain(preservedText);
      expect(
        comparableLines(parseSubtitleText(String(serialized), format)),
      ).toEqual(comparableLines(parsed));
    });
  }
});
