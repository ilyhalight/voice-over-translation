import logger from "#utils/logger.ts";
import { browserInfo } from "../../utils/browserInfo";
import { GM_fetch, getGMInfo, setGmFetchFailureHandler } from "../../utils/gm";
import { isIframe } from "../../utils/iframeConnector";
import { votStorage } from "../../utils/storage";
import { getDefaultSendErrorReports } from "./consent";
import type { EnvironmentInfo } from "./context";
import {
  buildAuthHeader,
  buildEnvelope,
  ENVELOPE_URL,
  type SentryEvent,
} from "./event";
import {
  type CaptureOptions,
  createGmFetchFailureHandler,
  createReporter,
  type RuntimeInfo,
} from "./reporter";

export type { CaptureOptions };

function isInIframe(): boolean {
  try {
    return isIframe();
  } catch {
    return true;
  }
}

function getEnvironmentInfo(): EnvironmentInfo {
  const gmInfo = getGMInfo();
  const isExtensionBuild =
    VOT_BUILD_VARIANT === "chrome" || VOT_BUILD_VARIANT === "firefox";

  return {
    build: VOT_BUILD_VARIANT,
    host: globalThis.location.hostname,
    inIframe: isInIframe(),
    browser: browserInfo.browser,
    os: browserInfo.os,
    scriptHandler: gmInfo?.scriptHandler,
    scriptHandlerVersion: isExtensionBuild ? undefined : gmInfo?.version,
  };
}

function getRuntimeInfo(): RuntimeInfo {
  return {
    version: VOT_VERSION,
    environment: REPO_BRANCH,
    env: getEnvironmentInfo(),
  };
}

async function sendEvent(event: SentryEvent): Promise<void> {
  await GM_fetch(ENVELOPE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-sentry-envelope",
      "X-Sentry-Auth": buildAuthHeader(VOT_VERSION),
    },
    body: buildEnvelope(event),
    forceGmXhr: true,
    timeout: 10_000,
  });
}

const report = createReporter({
  isEnabled: async () =>
    votStorage.get("sendErrorReports", await getDefaultSendErrorReports()),
  getRuntimeInfo,
  send: sendEvent,
});

/** Fire-and-forget: never throws and never reports its own failures. */
export function captureException(
  error: unknown,
  options: CaptureOptions,
): void {
  report(error, options).catch((err) => {
    logger.info("[telemetry] failed to report error", err);
  });
}

setGmFetchFailureHandler(createGmFetchFailureHandler(captureException));
