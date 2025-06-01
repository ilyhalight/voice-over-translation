import { localizationProvider } from "../localization/localizationProvider";

const MAX_SECS_FRACTION = 0.66;

export const lang = navigator.language?.substring(0, 2).toLowerCase() || "en";
export function secsToStrTime(secs: number) {
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
