import { requestTelemetryConsent } from "../../extension/telemetry-consent";

export async function getDefaultSendErrorReports(): Promise<boolean> {
  if (
    typeof VOT_BUILD_VARIANT === "undefined" ||
    VOT_BUILD_VARIANT !== "firefox"
  ) {
    return true;
  }

  try {
    return await requestTelemetryConsent();
  } catch {
    return false;
  }
}
