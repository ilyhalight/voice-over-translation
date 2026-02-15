import { authServerUrl } from "../config/config";
import { initAuth } from "../core/auth";
import {
  ensureLocalizationProviderReady,
  localizationProvider,
} from "../localization/localizationProvider";
import debug from "../utils/debug";
import { isIframe } from "../utils/iframeConnector";
import { initIframeInteractor } from "./iframeInteractor";

type LogBootstrap = (
  message: string,
  details?: Record<string, unknown>,
) => void;

let runtimeActivated = false;
let runtimeActivationPromise: Promise<void> | null = null;
let iframeInteractorBound = false;

export async function ensureRuntimeActivated(
  reason: string,
  logBootstrap: LogBootstrap,
): Promise<void> {
  if (runtimeActivated) return;
  if (runtimeActivationPromise !== null) {
    await runtimeActivationPromise;
    return;
  }

  runtimeActivationPromise = (async () => {
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

    if (!iframeInteractorBound) {
      iframeInteractorBound = true;
      initIframeInteractor();
    }

    runtimeActivated = true;
  })();

  try {
    await runtimeActivationPromise;
  } finally {
    runtimeActivationPromise = null;
  }
}
