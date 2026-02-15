import { closestCrossShadow, containsCrossShadow } from "../utils/dom";

export function findConnectedContainerBySelector(
  video: HTMLVideoElement,
  selector?: string,
): HTMLElement | null {
  if (!selector) {
    return null;
  }

  const matched = closestCrossShadow(video, selector);
  if (
    matched instanceof HTMLElement &&
    matched.isConnected &&
    containsCrossShadow(matched, video)
  ) {
    return matched;
  }

  return null;
}
