import type { detectServices, translateServices } from "../utils/translateApis";

export type TranslateService = (typeof translateServices)[number];
export type DetectService = (typeof detectServices)[number];
