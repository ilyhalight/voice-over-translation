import { authServerUrl } from "../config/config";
import { initAuth } from "../core/auth";
import {
  ensureLocalizationProviderReady,
  localizationProvider,
} from "../localization/localizationProvider";
import debug from "../utils/debug";
import { isIframe } from "../utils/iframeConnector";

type LogBootstrap = (
  message: string,
  details?: Record<string, unknown>,
) => void;

let runtimeActivated = false;
let runtimeActivationPromise: Promise<void> | null = null;

async function activateRuntime(
  reason: string,
  logBootstrap: LogBootstrap,
): Promise<void> {
  logBootstrap("Activating runtime", { reason });

  if (globalThis.location.origin === authServerUrl) {
    await initAuth();
    runtimeActivated = true;
    return;
  }

  await ensureLocalizationProviderReady();
  if (!isIframe()) {
    await localizationProvider.update();
  }
  debug.log(`Selected menu language: ${localizationProvider.lang}`);

  runtimeActivated = true;
}

export async function ensureRuntimeActivated(
  reason: string,
  logBootstrap: LogBootstrap,
): Promise<void> {
  if (runtimeActivated) return;
  runtimeActivationPromise ??= activateRuntime(reason, logBootstrap).finally(
    () => {
      runtimeActivationPromise = null;
    },
  );

  await runtimeActivationPromise;
}
