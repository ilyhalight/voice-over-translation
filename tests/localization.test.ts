import { describe, test, expect } from "bun:test";

const locales = {
  translationTakeMoreThanHour: "Перевод займёт больше часа",
  translationTakeAboutMinute: "Перевод займёт около минуты",
  translationTakeFewMinutes: "Перевод займёт несколько минут",
  translationTakeApproximatelyMinutes: "Перевод займёт примерно {0} минут",
  translationTakeApproximatelyMinute: "Перевод займёт примерно {0} минуты",
  translationTakeApproximatelyMinute2: "Перевод займёт примерно {0} минуту",
} as const;

const localizationProvider = {
  get: (message: keyof typeof locales) => locales[message] ?? message,
};

const MAX_SECS_FRACTION = 0.66;

// TODO: remove logic duplication
function secsToStrTime(secs: number) {
  let minutes = Math.floor(secs / 60);
  let seconds = Math.floor(secs % 60);
  const fraction = seconds / 60;
  if (fraction >= MAX_SECS_FRACTION) {
    // rounding to the next minute if it has already been more than N%
    // e.g. 100 -> 2 minutes
    minutes += 1;
    seconds = 0;
  }

  if (minutes >= 60) {
    return localizationProvider.get("translationTakeMoreThanHour");
  }

  if (minutes <= 1) {
    return localizationProvider.get("translationTakeAboutMinute");
  }

  const minutesStr = String(minutes);
  if (minutes !== 11 && minutes % 10 === 1) {
    return localizationProvider
      .get("translationTakeApproximatelyMinute2")
      .replace("{0}", minutesStr);
  }

  if (![12, 13, 14].includes(minutes) && [2, 3, 4].includes(minutes % 10)) {
    return localizationProvider
      .get("translationTakeApproximatelyMinute")
      .replace("{0}", minutesStr);
  }

  return localizationProvider
    .get("translationTakeApproximatelyMinutes")
    .replace("{0}", minutesStr);
}

describe("secs to str time", () => {
  test("30 sec", () => {
    const result = secsToStrTime(30);
    const expected = localizationProvider.get("translationTakeAboutMinute");
    expect(result).toBe(expected);
  });
  test("60 sec", () => {
    const result = secsToStrTime(60);
    const expected = localizationProvider.get("translationTakeAboutMinute");
    expect(result).toBe(expected);
  });
  test("90 sec", () => {
    const result = secsToStrTime(90);
    const expected = localizationProvider.get("translationTakeAboutMinute");
    expect(result).toBe(expected);
  });
  test("100 sec", () => {
    const result = secsToStrTime(100);
    const expected = localizationProvider
      .get("translationTakeApproximatelyMinute")
      .replace("{0}", "2");
    expect(result).toBe(expected);
  });
  test("120 sec", () => {
    const result = secsToStrTime(120);
    const expected = localizationProvider
      .get("translationTakeApproximatelyMinute")
      .replace("{0}", "2");
    expect(result).toBe(expected);
  });
  test("280 sec", () => {
    const result = secsToStrTime(280);
    const expected = localizationProvider
      .get("translationTakeApproximatelyMinutes")
      .replace("{0}", "5");
    expect(result).toBe(expected);
  });
  test("300 sec", () => {
    const result = secsToStrTime(300);
    const expected = localizationProvider
      .get("translationTakeApproximatelyMinutes")
      .replace("{0}", "5");
    expect(result).toBe(expected);
  });
  test("3587 sec", () => {
    const result = secsToStrTime(3587);
    const expected = localizationProvider.get("translationTakeMoreThanHour");
    expect(result).toBe(expected);
  });
  test("1240 sec", () => {
    const result = secsToStrTime(1240);
    const expected = localizationProvider
      .get("translationTakeApproximatelyMinute2")
      .replace("{0}", "21");
    expect(result).toBe(expected);
  });
});
