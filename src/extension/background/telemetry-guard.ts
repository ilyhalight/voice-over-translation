import { browser } from "wxt/browser";
import { INGEST_HOST } from "../../modules/telemetry/event";
import { BG_MSG_TELEMETRY_CONSENT } from "../shared/constants";
import { sendBridgeResponse } from "../shared/utils";

const TECHNICAL_AND_INTERACTION = "technicalAndInteraction";

/**
 * Runtime build detection. `VOT_BUILD_VARIANT` is the single source of truth
 * shared with telemetry/client.ts and telemetry/consent.ts; the WXT compile-time
 * flag is only a fallback for builds that do not inject the variant.
 */
function isFirefoxBuild(): boolean {
  if (typeof VOT_BUILD_VARIANT !== "undefined") {
    return VOT_BUILD_VARIANT === "firefox";
  }
  return Boolean(import.meta.env?.FIREFOX);
}

function isIngestUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === INGEST_HOST || hostname.endsWith(`.${INGEST_HOST}`);
  } catch {
    return false;
  }
}

export async function hasTelemetryConsent(): Promise<boolean> {
  try {
    // `data_collection` is Firefox-only and missing from the Chrome typings.
    const { data_collection: granted } = (await browser.permissions.getAll()) as {
      data_collection?: unknown;
    };
    return (
      Array.isArray(granted) && granted.includes(TECHNICAL_AND_INTERACTION)
    );
  } catch {
    return false;
  }
}

/** Firefox only: error reports need the user's built-in data collection consent. */
export async function isTelemetryBlocked(url: string): Promise<boolean> {
  if (!isFirefoxBuild() || !isIngestUrl(url)) return false;
  return !(await hasTelemetryConsent());
}

export function registerBackgroundTelemetryConsent(): void {
  browser.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (
      !msg ||
      typeof msg !== "object" ||
      (msg as { type?: unknown }).type !== BG_MSG_TELEMETRY_CONSENT
    ) {
      return;
    }

    void hasTelemetryConsent().then((result) => {
      sendBridgeResponse(sendResponse, { ok: true, result });
    });
    return true;
  });
}
