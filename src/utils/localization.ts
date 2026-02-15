import { availableTTS } from "@vot.js/shared/consts";
import type { ResponseLang } from "@vot.js/shared/types/data";

function getNavigatorLang() {
  return navigator.language?.substring(0, 2).toLowerCase() || "en";
}

const slavicLangs = new Set([
  "uk",
  "be",
  "bg",
  "mk",
  "sr",
  "bs",
  "hr",
  "sl",
  "pl",
  "sk",
  "cs",
]);

function resolveCalculatedResLang(baseLang: string): ResponseLang {
  if (availableTTS.includes(baseLang as ResponseLang)) {
    return baseLang as ResponseLang;
  }

  if (slavicLangs.has(baseLang)) {
    return "ru";
  }

  return "en";
}

export const lang = getNavigatorLang();
export const calculatedResLang: ResponseLang = resolveCalculatedResLang(lang);
