import { describe, expect, test } from "bun:test";
import { formatTranslationEta } from "../src/utils/timeFormatting.ts";

const locales = {
  translationTakeMoreThanHour: "Перевод займёт больше часа",
  translationTakeAboutMinute: "Перевод займёт около минуты",
  translationTakeFewMinutes: "Перевод займёт несколько минут",
  translationTakeApproximatelyMinutes: "Перевод займёт примерно {0} минут",
  translationTakeApproximatelyMinute: "Перевод займёт примерно {0} минуты",
  translationTakeApproximatelyMinute2: "Перевод займёт примерно {0} минуту",
} as const;

describe("translation ETA", () => {
  test.each([
    [30, locales.translationTakeAboutMinute],
    [90, locales.translationTakeAboutMinute],
    [100, locales.translationTakeApproximatelyMinute.replace("{0}", "2")],
    [280, locales.translationTakeApproximatelyMinutes.replace("{0}", "5")],
    [3587, locales.translationTakeMoreThanHour],
    [1240, locales.translationTakeApproximatelyMinute2.replace("{0}", "21")],
  ])("%i seconds", (seconds, expected) => {
    expect(formatTranslationEta(seconds, (key) => locales[key])).toBe(expected);
  });
});
