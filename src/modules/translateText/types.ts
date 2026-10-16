import type { DETECT_SERVICES, TRANSLATE_TEXT_SERVICES } from "./consts";

export type TranslateTextService = (typeof TRANSLATE_TEXT_SERVICES)[number];
export type DetectService = (typeof DETECT_SERVICES)[number];

export type FOSWLYErrorResponse = {
  error: string;
};
