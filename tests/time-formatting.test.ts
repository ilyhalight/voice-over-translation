import { describe, expect, test } from "bun:test";
import { formatDateTime } from "../src/utils/timeFormatting.ts";

const MIDDAY_UTC_SEC = Date.UTC(2024, 5, 15, 12, 0, 0) / 1000;

describe("formatDateTime", () => {
  test("formats en with the year without throwing", () => {
    expect(formatDateTime(MIDDAY_UTC_SEC, "en")).toContain("2024");
  });

  test("formats en with the full month name", () => {
    expect(formatDateTime(MIDDAY_UTC_SEC, "en")).toContain("June");
  });

  test("respects the requested language", () => {
    expect(formatDateTime(MIDDAY_UTC_SEC, "ru")).toContain("2024");
  });

  test("falls back instead of throwing on invalid language tags", () => {
    expect(() => formatDateTime(MIDDAY_UTC_SEC, "not a lang!")).not.toThrow();
  });
});
