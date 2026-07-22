import { VideoTranslationStatus } from "@vot.js/core/types/yandex";

import { safeNestedGet } from "../utils/errors";

export type TranslationAuthErrorKind = "account-required" | "session-expired";

export type TranslationAuthErrorContext = {
  hasAccountToken?: boolean;
};

function isSessionRequired(value: unknown): boolean {
  return (
    safeNestedGet(value, ["status"]) ===
      VideoTranslationStatus.SESSION_REQUIRED ||
    safeNestedGet(value, ["data", "status"]) ===
      VideoTranslationStatus.SESSION_REQUIRED
  );
}

export function getTranslationServerErrorMessage(
  value: unknown,
): string | undefined {
  const msg = safeNestedGet(value, ["data", "message"]);
  return typeof msg === "string" && msg.length > 0 ? msg : undefined;
}

export function getTranslationAuthErrorKind(
  value: unknown,
  context: TranslationAuthErrorContext = {},
): TranslationAuthErrorKind | null {
  if (!isSessionRequired(value)) {
    return null;
  }

  return context.hasAccountToken ? "session-expired" : "account-required";
}

export function isTranslationAuthError(
  value: unknown,
  context: TranslationAuthErrorContext = {},
): boolean {
  return getTranslationAuthErrorKind(value, context) !== null;
}
