export type LifecycleTranslationResetHost = {
  videoData?: unknown;
  stopTranslation(): void | Promise<void>;
  resetSubtitlesWidget(): void;
};

export type LifecycleOverlayViewLike = {
  votButton?: {
    container?: {
      hidden: boolean;
    };
  };
  votMenu?: {
    hidden: boolean;
  };
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
  overlayView: LifecycleOverlayViewLike | null | undefined,
  options: {
    hideMenu?: boolean;
  } = {},
): void {
  const { hideMenu = false } = options;

  if (overlayView?.votButton?.container) {
    overlayView.votButton.container.hidden = true;
  }

  if (hideMenu && overlayView?.votMenu) {
    overlayView.votMenu.hidden = true;
  }
}

export function resetAndHideLifecycle(
  host: LifecycleTranslationResetHost,
  overlayView: LifecycleOverlayViewLike | null | undefined,
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
  hideLifecycleOverlay(overlayView, { hideMenu });
}
