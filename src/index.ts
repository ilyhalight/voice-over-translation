import type { ServiceConf } from "@vot.js/ext/types/service";
import { getService } from "@vot.js/ext/utils/videoData";
import { getOrCreateBootState } from "./bootstrap/bootState";
import { initIframeInteractor } from "./bootstrap/iframeInteractor";
import { ensureRuntimeActivated } from "./bootstrap/runtimeActivation";
import { bindObserverListeners } from "./bootstrap/videoObserverBinding";
import { authServerUrl } from "./config/config";
import { resolveBootstrapMode } from "./core/bootstrapPolicy";
import { findConnectedContainerBySelector } from "./core/containerResolution";
import debug from "./utils/debug";
import { isIframe } from "./utils/iframeConnector";
import { createIntervalIdleChecker } from "./utils/intervalIdleChecker";
import { VideoObserver } from "./utils/VideoObserver";
import { VideoHandler } from "./VideoHandler";

const videoObserverChecker = createIntervalIdleChecker();
const videoObserver = new VideoObserver(videoObserverChecker);
const videosWrappers = new WeakMap<HTMLVideoElement, VideoHandler>();
let servicesCache: ServiceConf[] | null = null;
const bootState = getOrCreateBootState();

function getFrameContext() {
  return {
    frame: isIframe() ? "iframe" : "top",
    host: globalThis.location.hostname || "unknown",
    path: globalThis.location.pathname || "/",
  };
}

function logBootstrap(
  message: string,
  details?: Record<string, unknown>,
): void {
  const ctx = getFrameContext();
  const payload: Record<string, unknown> = {
    host: ctx.host,
    path: ctx.path,
    ...details,
  };

  debug.log(`[VOT][bootstrap][${ctx.frame}] ${message}`, payload);
}

function getServicesCached(): ServiceConf[] {
  servicesCache ??= getService();
  return servicesCache;
}

/**
 * Recursively finds the closest parent element matching a selector.
 * @param {SiteData} site The site data.
 * @param {HTMLElement} video The video element.
 * @returns {HTMLElement|null} The matching parent element.
 */
function findContainer(
  site: ServiceConf,
  video: HTMLVideoElement,
): HTMLElement | null {
  debug.log("findContainer", site, site.selector, video);
  if (!site.selector) {
    debug.log("findContainer without selector, using parentElement");
    return video.parentElement;
  }

  const matched = findConnectedContainerBySelector(video, site.selector);

  if (site.shadowRoot) {
    debug.log("findContainer with site.shadowRoot", matched);
  } else {
    debug.log("findContainer without shadowRoot", matched);
  }

  return matched;
}

/**
 * Main function to start the extension.
 */
async function main(): Promise<void> {
  const bootstrapMode = resolveBootstrapMode({
    isIframe: isIframe(),
    href: String(globalThis.location.href || ""),
    origin: globalThis.location.origin,
    authOrigin: authServerUrl,
  });

  // FIX: Drive video player UI from blocking pointer events
  if (globalThis.location.hostname === "drive.google.com") {
    GM_addStyle(`
        section[data-fullscreen-control-supported="true"] {
            pointer-events: none !important;
        }
        section[data-fullscreen-control-supported="true"] > div[data-volume-slider-control-supported="true"],
        section[data-fullscreen-control-supported="true"] > div[data-playback-rate-setting-supported="true"] {
            pointer-events: auto !important;
        }
    `);
  }

  if (bootstrapMode === "skip") {
    logBootstrap("Skipping bootstrap for non-runnable iframe");
    return;
  }

  // Some hosts exchange iframe video identifiers via postMessage before a
  // playable <video> is observed, so keep this bridge available eagerly.
  initIframeInteractor();

  logBootstrap("Loading extension", { mode: bootstrapMode });
  if (bootstrapMode === "auth-eager") {
    await ensureRuntimeActivated("auth-page", logBootstrap);
  } else {
    logBootstrap("Lazy bootstrap enabled; waiting for video detection");
  }

  bindObserverListeners({
    videoObserver,
    videosWrappers,
    ensureRuntimeActivated: (reason: string) =>
      ensureRuntimeActivated(reason, logBootstrap),
    getServicesCached,
    findContainer,
    createVideoHandler: (video, container, site) =>
      new VideoHandler(video, container, site),
  });
  videoObserver.enable();
}

export async function bootstrapContentScript(): Promise<void> {
  if (bootState.status === "booting" || bootState.status === "booted") {
    logBootstrap("bootstrap already initialized, skipping duplicate run", {
      status: bootState.status,
    });
    return;
  }

  bootState.status = "booting";
  try {
    await main();
    bootState.status = "booted";
  } catch (e) {
    bootState.status = "failed";
    bootState.error = e;
    console.error("[VOT]", e);
  }
}

// Auto-init: always bootstrap directly.
// In CRXJS (Chrome) builds the IIFE prelude runs synchronously at
// document_start (via prelude.iife.ts), so GM polyfills are guaranteed
// to exist by the time this MAIN-world content script evaluates at
// document_end.  In Firefox builds the bridge injects prelude.module.js
// before content.module.js.  No polling or readiness check needed.
void (async () => {
  await bootstrapContentScript();
})();
