import { AudioDownloadType } from "@vot.js/core/types/yandex";

/**
 * SABR is intentionally a distinct internal strategy. It is not folded into
 * WEB_ABR: this keeps selection and diagnostics honest while avoiding a hard
 * dependency on a core enum value that may not exist yet.
 */
export const SABR_STRATEGY = "sabr" as const;
export const WEB_ABR_STRATEGY = AudioDownloadType.WEB_ABR;
export const WEB_MSE_PROXY_STRATEGY = AudioDownloadType.WEB_MSE_PROXY;

export type AudioBridgeStrategy =
  | typeof SABR_STRATEGY
  | typeof WEB_ABR_STRATEGY
  | typeof WEB_MSE_PROXY_STRATEGY;

export function isAudioBridgeStrategy(
  value: unknown,
): value is AudioBridgeStrategy {
  return (
    value === SABR_STRATEGY ||
    value === WEB_ABR_STRATEGY ||
    value === WEB_MSE_PROXY_STRATEGY
  );
}
