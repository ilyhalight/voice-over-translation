type TranslationEtaMessageKey =
  | "translationTakeMoreThanHour"
  | "translationTakeAboutMinute"
  | "translationTakeApproximatelyMinute2"
  | "translationTakeApproximatelyMinute"
  | "translationTakeApproximatelyMinutes";

type TranslationEtaMessageGetter = (key: TranslationEtaMessageKey) => string;

const MAX_SECS_FRACTION = 0.66;

function createDateTimeFormat(lang: string) {
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: "long",
    timeStyle: "short",
  };
  try {
    return new Intl.DateTimeFormat(lang, options);
  } catch {
    // Intl throws RangeError on structurally invalid language tags
    return new Intl.DateTimeFormat(undefined, options);
  }
}

export function formatDateTime(timestampSec: number, lang: string): string {
  return createDateTimeFormat(lang).format(timestampSec * 1000);
}

export function formatTranslationEta(
  secs: number,
  getMessage: TranslationEtaMessageGetter,
) {
  let minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  const fraction = seconds / 60;
  if (fraction >= MAX_SECS_FRACTION) {
    minutes += 1;
  }

  if (minutes >= 60) {
    return getMessage("translationTakeMoreThanHour");
  }

  if (minutes <= 1) {
    return getMessage("translationTakeAboutMinute");
  }

  const minutesStr = String(minutes);
  if (minutes !== 11 && minutes % 10 === 1) {
    return getMessage("translationTakeApproximatelyMinute2").replace(
      "{0}",
      minutesStr,
    );
  }

  if (![12, 13, 14].includes(minutes) && [2, 3, 4].includes(minutes % 10)) {
    return getMessage("translationTakeApproximatelyMinute").replace(
      "{0}",
      minutesStr,
    );
  }

  return getMessage("translationTakeApproximatelyMinutes").replace(
    "{0}",
    minutesStr,
  );
}
