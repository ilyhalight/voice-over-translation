import type { detectServices, translateServices } from "../core/translateApis";

export type TranslateService = (typeof translateServices)[number];
export type DetectService = (typeof detectServices)[number];
