import { authLoginUrl } from "../config/config";

const AUTH_WINDOW_NAME = "votAuthWindow";
const AUTH_WINDOW_WIDTH = 520;
const AUTH_WINDOW_HEIGHT = 720;

function getViewportMetric(name: "outerWidth" | "outerHeight"): number | null {
  const value = globalThis[name];
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function getScreenOffset(name: "screenX" | "screenY"): number {
  const value = globalThis[name];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getAuthWindowFeatures(): string {
  const viewportWidth =
    getViewportMetric("outerWidth") ??
    globalThis.screen?.availWidth ??
    AUTH_WINDOW_WIDTH;
  const viewportHeight =
    getViewportMetric("outerHeight") ??
    globalThis.screen?.availHeight ??
    AUTH_WINDOW_HEIGHT;
  const left = Math.max(
    0,
    Math.round(
      getScreenOffset("screenX") + (viewportWidth - AUTH_WINDOW_WIDTH) / 2,
    ),
  );
  const top = Math.max(
    0,
    Math.round(
      getScreenOffset("screenY") + (viewportHeight - AUTH_WINDOW_HEIGHT) / 2,
    ),
  );

  return [
    "popup=yes",
    "resizable=yes",
    "scrollbars=yes",
    `width=${AUTH_WINDOW_WIDTH}`,
    `height=${AUTH_WINDOW_HEIGHT}`,
    `left=${left}`,
    `top=${top}`,
  ].join(",");
}

export function openAuthWindow(): void {
  globalThis
    .open(authLoginUrl, AUTH_WINDOW_NAME, getAuthWindowFeatures())
    ?.focus?.();
}
