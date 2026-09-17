import { describe, expect, test } from "bun:test";

import {
  buildActiveSubtitleRenderLine,
  findActiveSubtitleLineIndices,
} from "../src/subtitles/activeCues";
import {
  applyPassedState,
  clearPassedState,
  createHighlightState,
  type HighlightTokenElement,
  syncHighlightState,
} from "../src/subtitles/highlightState";
import {
  buildSubtitleInlineStyleCssText,
  normalizeCssColorValue,
  normalizeSubtitleInlineStyle,
  sanitizeSubtitleInlineStyle,
  subtitleInlineStylesEqual,
} from "../src/subtitles/inlineStyle";
import { buildSubtitleRenderPlan } from "../src/subtitles/renderPlan";
import type { SubtitleLine, SubtitleToken } from "../src/types/subtitles";

const word = (text: string, startMs = 0, durationMs = 100): SubtitleToken => ({
  text,
  startMs,
  durationMs,
  isWordLike: true,
});

const raw = (text: string, startMs = 0): SubtitleToken => ({
  text,
  startMs,
  durationMs: 0,
  isWordLike: false,
});

const line = (
  text: string,
  startMs: number,
  durationMs: number,
  speakerId = "0",
  tokens: SubtitleToken[] = [],
): SubtitleLine => ({ text, startMs, durationMs, speakerId, tokens });

class FakeClassList {
  writes = 0;
  private readonly set = new Set<string>();
  toggle(token: string, force?: boolean) {
    this.writes += 1;
    if (force) this.set.add(token);
    else this.set.delete(token);
  }
  remove(token: string) {
    this.writes += 1;
    this.set.delete(token);
  }
  contains(token: string) {
    return this.set.has(token);
  }
}

const makeSpans = (count: number, offset = 0) =>
  Array.from({ length: count }, (_, index) => ({
    dataset: { votHighlightIndex: String(index + offset) },
    classList: new FakeClassList(),
  })) as unknown as (HighlightTokenElement & { classList: FakeClassList })[];

describe("render plan (consolidated punctuation scanning)", () => {
  test("keeps leading punctuation attached to the following word highlight", () => {
    const plan = buildSubtitleRenderPlan([word('"hello"'), word(" world")], 1, null);
    expect(plan).toEqual([
      { kind: "text", text: '"', style: undefined, highlightIndex: 0 },
      { kind: "word", text: "hello", style: undefined, highlightIndex: 0 },
      { kind: "text", text: '"', style: undefined, highlightIndex: 0 },
      { kind: "text", text: " ", style: undefined, highlightIndex: undefined },
      { kind: "word", text: "world", style: undefined, highlightIndex: 1 },
    ]);
  });

  test("punctuation-only text token inherits the previous word index", () => {
    const plan = buildSubtitleRenderPlan([word("hi"), raw("...")], 1, null);
    expect(plan.at(-1)).toEqual({
      kind: "text",
      text: "...",
      style: undefined,
      highlightIndex: 0,
    });
  });

  test("punctuation-only leading text token borrows the NEXT word index", () => {
    const plan = buildSubtitleRenderPlan([raw("-"), word(" hi")], 1, null);
    expect(plan[0]).toEqual({
      kind: "text",
      text: "-",
      style: undefined,
      highlightIndex: 0,
    });
  });

  test("leading punctuation gets no index when no real word follows", () => {
    const plan = buildSubtitleRenderPlan([raw("-"), raw("!!")], 1, null);
    expect(plan.every((part) => part.kind !== "word")).toBe(true);
    expect(plan[0]).toEqual({
      kind: "text",
      text: "-",
      style: undefined,
      highlightIndex: undefined,
    });
  });

  test("explicit newline tokens and break sets both emit break parts", () => {
    const withNewline = buildSubtitleRenderPlan([word("a"), raw("\n"), word("b")], 2, null);
    expect(withNewline.filter((p) => p.kind === "break")).toHaveLength(1);

    const withBreakSet = buildSubtitleRenderPlan([word("a"), word(" b")], 1, new Set([0]));
    expect(withBreakSet.filter((p) => p.kind === "break")).toHaveLength(1);
  });

  test("empty and whitespace-only inputs never throw", () => {
    expect(buildSubtitleRenderPlan([], -1, null)).toEqual([]);
    expect(buildSubtitleRenderPlan([raw("")], 0, null)).toEqual([]);
    expect(buildSubtitleRenderPlan([word("  ")], 0, null)).toEqual([
      { kind: "text", text: "  ", style: undefined, highlightIndex: undefined },
    ]);
  });

  test("stress: 500 tokens keeps word indices dense and monotonic", () => {
    const tokens = Array.from({ length: 500 }, (_, i) => word(`${i === 0 ? "" : " "}w${i},`));
    const plan = buildSubtitleRenderPlan(tokens, 499, null);
    const indices = plan.filter((p) => p.kind === "word").map((p) => p.highlightIndex);
    expect(indices).toHaveLength(500);
    expect(indices[0]).toBe(0);
    expect(indices.at(-1)).toBe(499);
  });
});

describe("active cue dedupe (grouped, single key computation)", () => {
  test("drops whitespace-equivalent duplicates from the same speaker", () => {
    const list = [
      line("hello world", 0, 2000, "0", [word("hello world")]),
      line("hello   world", 100, 2000, "0", [word("hello   world")]),
    ];
    const active = buildActiveSubtitleRenderLine(500, list, 30000);
    expect(active?.lineKey).toBe("0");
  });

  test("keeps same text from a different speaker", () => {
    const list = [
      line("same", 0, 2000, "0", [word("same")]),
      line("same", 100, 2000, "1", [word("same")]),
    ];
    expect(buildActiveSubtitleRenderLine(500, list, 30000)?.lineKey).toBe("0,1");
  });

  test("collapses identical overlapping cues but keeps disjoint repeats", () => {
    const overlapping = [
      line("same", 0, 100, "0", [word("same")]),
      line("same", 0, 5000, "0", [word("same")]),
      line("same", 200, 5000, "0", [word("same")]),
    ];
    // cues 1 and 2 overlap and read the same => a single rendered cue
    expect(buildActiveSubtitleRenderLine(300, overlapping, 30000)?.lineKey).toBe("1");

    // a repeat that does NOT overlap the kept cue must survive dedupe
    const disjoint = [
      line("same", 0, 100, "0", [word("same")]),
      line("other", 50, 5000, "0", [word("other")]),
      line("same", 150, 5000, "0", [word("same")]),
    ];
    expect(buildActiveSubtitleRenderLine(200, disjoint, 30000)?.lineKey).toBe("1,2");
  });

  test("returns null when nothing is active and honors maxCueDurationMs", () => {
    const list = [line("a", 0, 100, "0", [word("a")])];
    expect(buildActiveSubtitleRenderLine(9999, list, 30000)).toBeNull();
    expect(findActiveSubtitleLineIndices(50, list, 0)).toEqual([]);
  });

  test("stress: 200 identical overlapping cues collapse to one", () => {
    const list = Array.from({ length: 200 }, () =>
      line("dup", 0, 10000, "0", [word("dup")]),
    );
    expect(buildActiveSubtitleRenderLine(500, list, Number.POSITIVE_INFINITY)?.lineKey).toBe("0");
  });
});

describe("inline style memoization", () => {
  test("normalization results are stable and value-identical across calls", () => {
    const style = { color: "#FFCC00", classes: ["b", "a", "a"], italic: true };
    const first = normalizeSubtitleInlineStyle(style);
    const second = normalizeSubtitleInlineStyle(style);
    expect(first).toEqual({ italic: true, color: "#ffcc00", classes: ["a", "b"] });
    expect(second).toBe(first);
  });

  test("css text is cached but identical to a fresh computation", () => {
    const style = { color: "rgb(1, 2, 3)" };
    expect(buildSubtitleInlineStyleCssText(style)).toBe(
      "--vot-subtitles-inline-color:rgb(1, 2, 3);",
    );
    expect(buildSubtitleInlineStyleCssText({ ...style })).toBe(
      buildSubtitleInlineStyleCssText(style),
    );
    expect(buildSubtitleInlineStyleCssText(undefined)).toBe("");
    expect(buildSubtitleInlineStyleCssText({ bold: true })).toBe("");
  });

  test("unsafe colors are rejected (cache must not weaken sanitization)", () => {
    for (const bad of ["url(x)", "red;background:url(x)", "#12", "expression(1)", ""]) {
      expect(normalizeCssColorValue(bad)).toBeUndefined();
      expect(buildSubtitleInlineStyleCssText({ color: bad })).toBe("");
    }
    expect(normalizeCssColorValue("red")).toBe("red");
    expect(normalizeCssColorValue("  #ABC ")).toBe("#abc");
  });

  test("sanitize rejects non-objects and filters non-string classes", () => {
    expect(sanitizeSubtitleInlineStyle(null)).toBeUndefined();
    expect(sanitizeSubtitleInlineStyle("red")).toBeUndefined();
    expect(
      sanitizeSubtitleInlineStyle({ classes: ["ok", 5, "bad class"], bold: true }),
    ).toEqual({ bold: true, classes: ["ok"] });
  });

  test("equality is unchanged by memoization", () => {
    expect(subtitleInlineStylesEqual(undefined, undefined)).toBe(true);
    expect(subtitleInlineStylesEqual({ bold: true }, { bold: true })).toBe(true);
    expect(subtitleInlineStylesEqual({ bold: true }, { italic: true })).toBe(false);
    expect(
      subtitleInlineStylesEqual({ classes: ["a", "b"] }, { classes: ["b", "a"] }),
    ).toBe(true);
  });
});

describe("highlight state diffing", () => {
  test("writes only on transitions", () => {
    const spans = makeSpans(4);
    const state = syncHighlightState(createHighlightState(), spans);
    expect(applyPassedState(state, spans, [true, false, false, false])).toBe(1);
    expect(applyPassedState(state, spans, [true, false, false, false])).toBe(0);
    expect(applyPassedState(state, spans, [true, true, false, false])).toBe(1);
    expect(applyPassedState(state, spans, [false, false, false, false])).toBe(2);
  });

  test("tolerates short flag arrays, missing and invalid indices", () => {
    const spans = makeSpans(3);
    (spans[1] as unknown as { dataset: { votHighlightIndex?: string } }).dataset.votHighlightIndex =
      undefined;
    (spans[2] as unknown as { dataset: { votHighlightIndex?: string } }).dataset.votHighlightIndex =
      "not-a-number";
    const state = syncHighlightState(createHighlightState(), spans);
    expect(state.indices[1]).toBe(-1);
    expect(state.indices[2]).toBe(-1);
    expect(applyPassedState(state, spans, [true])).toBe(1);
    expect(applyPassedState(state, spans, [])).toBe(1);
  });

  test("resync reseeds from the live DOM class and clear resets", () => {
    const spans = makeSpans(2);
    const state = syncHighlightState(createHighlightState(), spans);
    applyPassedState(state, spans, [true, true]);
    syncHighlightState(state, spans);
    expect(applyPassedState(state, spans, [true, true])).toBe(0);
    clearPassedState(state, spans);
    expect(spans[0].classList.contains("passed")).toBe(false);
    expect(applyPassedState(state, spans, [true, true])).toBe(2);
  });

  test("stress: 1000 spans, one word advance per tick => 1 write per tick", () => {
    const spans = makeSpans(1000);
    const state = syncHighlightState(createHighlightState(), spans);
    const flags = new Array(1000).fill(false);
    let total = 0;
    for (let i = 0; i < 1000; i += 1) {
      flags[i] = true;
      total += applyPassedState(state, spans, flags);
    }
    expect(total).toBe(1000);
    expect(spans.reduce((sum, span) => sum + span.classList.writes, 0)).toBe(1000);
  });
});
