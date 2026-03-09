import type { ServiceConf } from "@vot.js/ext/types/service";

export type OverlayMountTargets = {
  base: HTMLElement;
  root: HTMLElement;
  portalContainer: HTMLElement;
  subtitlesMountContainer: HTMLElement;
};

export function resolveOverlayBaseContainer(
  container: HTMLElement,
  site: ServiceConf,
): HTMLElement {
  return site.host === "youtube" && site.additionalData !== "mobile"
    ? (container.parentElement ?? container)
    : container;
}

export function resolveOverlayMountTargets(input: {
  container: HTMLElement;
  site: ServiceConf;
  fullscreenRoot: HTMLElement | null;
}): OverlayMountTargets {
  const base = resolveOverlayBaseContainer(input.container, input.site);
  const root = input.fullscreenRoot ?? base;

  return {
    base,
    root,
    portalContainer: base,
    subtitlesMountContainer: root,
  };
}
