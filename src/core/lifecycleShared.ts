import type { OverlayViewControls } from "../views/OverlayView";

export type LifecycleTranslationResetHost = {
  videoData?: unknown;
  stopTranslation(): void | Promise<void>;
  resetSubtitlesWidget(): void;
};

export type LifecycleOverlayViewLike = {
  votButton?: {
    container?: {
      hidden: boolean | string;
    };
  };
  votMenu?: {
    hidden: boolean | string;
  };
  overlayViewControls?: OverlayViewControls | null;
};

export function resetLifecycleTranslation(
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

  host.stopTranslation();
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
