import { INGEST_HOST } from "../../modules/telemetry/event";
import { BG_MSG_TELEMETRY_CONSENT } from "../shared/constants";
import { sendBridgeResponse } from "../shared/utils";
import { ext, permissionsGetAll } from "../shared/webext";

const TECHNICAL_AND_INTERACTION = "technicalAndInteraction";

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
    const { data_collection: granted } = await permissionsGetAll<{
      data_collection?: unknown;
    }>();
    return (
      Array.isArray(granted) && granted.includes(TECHNICAL_AND_INTERACTION)
    );
  } catch {
    return false;
  }
}

/** Firefox only: error reports need the user's built-in data collection consent. */
export async function isTelemetryBlocked(url: string): Promise<boolean> {
  if (typeof VOT_BUILD_VARIANT === "undefined") return false;
  if (VOT_BUILD_VARIANT !== "firefox" || !isIngestUrl(url)) return false;

  return !(await hasTelemetryConsent());
}

export function registerBackgroundTelemetryConsent(): void {
  ext?.runtime?.onMessage?.addListener?.(
    (
      msg: unknown,
      _sender: unknown,
      sendResponse: ((value: unknown) => void) | undefined,
    ) => {
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
    },
  );
}
