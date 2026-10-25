import { AudioDownloadType } from "@vot.js/core/types/providers/yandex";

/**
 * Bridge strategies map 1:1 to the stock vot.js `AudioDownloadType` values
 * (`web_sabr`, `web_abr`, `web_mse_proxy`, all present in @vot.js/core 3.2.0).
 * SABR stays a distinct strategy (not folded into WEB_ABR) so selection and
 * diagnostics report the real download path.
 */
export const SABR_STRATEGY = AudioDownloadType.WEB_SABR;
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
