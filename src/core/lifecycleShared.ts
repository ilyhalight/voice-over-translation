import type { OverlayViewControls } from "../components/OverlayView/OverlayView";
import logger from "../utils/logger";

export type LifecycleTranslationResetHost = {
  videoData?: unknown;
  stopTranslation(): void | Promise<void>;
  resetSubtitlesWidget(): void;
};

function resetLifecycleTranslation(
  host: LifecycleTranslationResetHost,
  options: {
    requireVideoData?: boolean;
    clearVideoData?: boolean;
  } = {},
): void {
  const { requireVideoData = false, clearVideoData = false } = options;

  if (requireVideoData && !host.videoData) {
    return;
  }

  if (clearVideoData) {
    host.videoData = undefined;
  }

  const stopping = host.stopTranslation();
  if (stopping) {
    stopping.catch((exception) => {
      logger.error(exception);
    });
  }
  host.resetSubtitlesWidget();
}

export function hideLifecycleOverlay(
  overlayViewControls: OverlayViewControls | null | undefined,
  options: {
    hideMenu?: boolean;
  } = {},
): void {
  const { hideMenu = false } = options;

  overlayViewControls?.setButtonHidden(true);
  if (hideMenu) {
    overlayViewControls?.setMenuHidden(true);
  }
}

export function resetAndHideLifecycle(
  host: LifecycleTranslationResetHost,
  overlayViewControls: OverlayViewControls | null | undefined,
  options: {
    requireVideoData?: boolean;
    clearVideoData?: boolean;
    hideMenu?: boolean;
  } = {},
): void {
  const { requireVideoData, clearVideoData, hideMenu } = options;
  resetLifecycleTranslation(host, {
    requireVideoData,
    clearVideoData,
  });
  hideLifecycleOverlay(overlayViewControls, { hideMenu });
}
