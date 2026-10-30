import { YANDEX_AUTH_ORIGIN } from "#modules/auth/consts.ts";
import {
  ensureLocalizationProviderReady,
  localizationProvider,
} from "../localization/localizationProvider";
import { handleAuthCallbackPage } from "../modules/auth/message";
import debug from "../utils/debug";
import { isIframe } from "../utils/iframeConnector";

type LogBootstrap = (
  message: string,
  details?: Record<string, unknown>,
) => void;

let runtimeActivationPromise: Promise<void> | null = null;

async function activateRuntime(
  reason: string,
  logBootstrap: LogBootstrap,
): Promise<void> {
  logBootstrap("Activating runtime", { reason });

  if (globalThis.location.origin === YANDEX_AUTH_ORIGIN) {
    await handleAuthCallbackPage();
    return;
  }

  await ensureLocalizationProviderReady();
  if (!isIframe() || !(await localizationProvider.hasUsableCache())) {
    await localizationProvider.update();
  }
  debug.log(`Selected menu language: ${localizationProvider.lang}`);
}

export function ensureRuntimeActivated(
  reason: string,
  logBootstrap: LogBootstrap,
): Promise<void> {
  runtimeActivationPromise ??= activateRuntime(reason, logBootstrap).catch(
    (error) => {
      runtimeActivationPromise = null;
      throw error;
    },
  );
  return runtimeActivationPromise;
}
