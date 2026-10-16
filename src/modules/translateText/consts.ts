import type { DetectService, TranslateTextService } from "./types";

// Services supported by our FOSWLY Translate API wrapper
export const TRANSLATE_TEXT_SERVICES = ["yandexbrowser", "msedge"] as const;

export const DEFAULT_TRANSLATION_SERVICE: TranslateTextService =
  "yandexbrowser";

export const DETECT_SERVICES = [
  ...TRANSLATE_TEXT_SERVICES,
  "rust-server",
] as const;
export const DEFAULT_DETECT_SERVICE: DetectService = "yandexbrowser";

/**
 * @see https://github.com/FOSWLY/translate-backend
 */
export const FOSWLY_TRANSLATE_URL =
  "https://translate-backend.transly.eu.cc/v2";

export const DETECT_RUST_SERVER_URL =
  "https://rust-server-531j.onrender.com/detect";
