import { containsCrossShadow } from "#utils/dom.ts";
import logger from "#utils/logger.ts";
import type {
  DocumentWithFullscreen,
  FullscreenElementInfo,
  FullscreenHelperOptions,
} from "./types";

export class FullscreenHelper {
  private container: HTMLElement;
  private video?: HTMLVideoElement;
  private readonly fullscreenChangeListeners: Set<() => void> = new Set();
  private readonly handleFullscreenChange = () => {
    this.notifyFullscreenChange();
  };
  private nativeFullscreenListenersActive = false;

  constructor({ container, video }: FullscreenHelperOptions) {
    this.container = container;
    this.video = video;
  }

  /**
   * Gets the current fullscreen element with proper ShadowDOM support
   */
  static getFullscreenElement(): Element | null {
    const doc = document as DocumentWithFullscreen;
    return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
  }

  /**
   * Gets comprehensive fullscreen information including ShadowDOM details
   */
  getFullscreenInfo(): FullscreenElementInfo {
    const fullscreenEl = FullscreenHelper.getFullscreenElement();
    const element = fullscreenEl instanceof HTMLElement ? fullscreenEl : null;
    if (!element) {
      return {
        element: null,
        shadowRoot: null,
        isFullscreen: false,
        belongsToCurrentVideo: false,
      };
    }

    const shadowRoot = element.shadowRoot ?? null;
    const belongsToCurrentVideo = this.isElementBelongsToCurrentVideo(element);

    return {
      element,
      shadowRoot,
      isFullscreen: true,
      belongsToCurrentVideo,
    };
  }

  /**
   * Checks if the given element belongs to the current video/container
   */
  private isElementBelongsToCurrentVideo(element: HTMLElement): boolean {
    return (
      element === this.container ||
      containsCrossShadow(element, this.container) ||
      containsCrossShadow(this.container, element) ||
      (this.video &&
        (element === this.video ||
          containsCrossShadow(element, this.video) ||
          containsCrossShadow(this.video, element)))
    );
  }

  /**
   * Gets the appropriate root element for overlay mounting in fullscreen mode
   * For Shadow DOM players (e.g., Reddit's shreddit-player), returns shadowRoot
   * to ensure UI is mounted inside the shadow tree, not in the light DOM.
   */
  getOverlayRoot(): HTMLElement | ShadowRoot | null {
    const { element, belongsToCurrentVideo, shadowRoot } =
      this.getFullscreenInfo();

    if (!element || !belongsToCurrentVideo) {
      return null;
    }

    // For Shadow DOM players, prefer shadowRoot for proper encapsulation
    return shadowRoot ?? element;
  }

  /**
   * Gets the appropriate element for ResizeObserver to watch for size changes
   * Handles both regular DOM and ShadowDOM scenarios
   */
  getResizeObserverTarget(): HTMLElement {
    const { element, belongsToCurrentVideo, shadowRoot } =
      this.getFullscreenInfo();

    if (element && belongsToCurrentVideo) {
      // In fullscreen mode, watch the fullscreen element or its host
      return (shadowRoot?.host as HTMLElement) ?? element;
    }

    // Not in fullscreen or doesn't belong to current video - watch container
    return this.container;
  }

  addFullscreenChangeListener(listener: () => void): void {
    this.fullscreenChangeListeners.add(listener);

    if (this.fullscreenChangeListeners.size === 1) {
      this.setNativeFullscreenListeners(true);
    }
  }

  removeFullscreenChangeListener(listener: () => void): void {
    this.fullscreenChangeListeners.delete(listener);

    if (this.fullscreenChangeListeners.size === 0) {
      this.setNativeFullscreenListeners(false);
    }
  }

  private setNativeFullscreenListeners(active: boolean): void {
    if (this.nativeFullscreenListenersActive === active) {
      return;
    }

    const method = active ? "addEventListener" : "removeEventListener";
    for (const event of ["fullscreenchange", "webkitfullscreenchange"]) {
      document[method](event, this.handleFullscreenChange);
    }
    for (const event of ["webkitbeginfullscreen", "webkitendfullscreen"]) {
      this.video?.[method](event, this.handleFullscreenChange);
    }

    this.nativeFullscreenListenersActive = active;
  }

  private notifyFullscreenChange(): void {
    for (const listener of this.fullscreenChangeListeners) {
      try {
        listener();
      } catch (error) {
        logger.warn(
          "[FullscreenHelper] Error in fullscreen change listener:",
          error,
        );
      }
    }
  }

  updateContainer(container: HTMLElement): void {
    this.container = container;
  }

  updateVideo(video: HTMLVideoElement | undefined): void {
    const shouldRebind =
      this.nativeFullscreenListenersActive && this.video !== video;
    if (shouldRebind) {
      this.setNativeFullscreenListeners(false);
    }
    this.video = video;
    if (shouldRebind && this.fullscreenChangeListeners.size > 0) {
      this.setNativeFullscreenListeners(true);
    }
  }

  destroy(): void {
    this.setNativeFullscreenListeners(false);
    this.fullscreenChangeListeners.clear();
  }
}
