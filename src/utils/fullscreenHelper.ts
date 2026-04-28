import { containsCrossShadow } from "./dom";

export interface DocumentWithFullscreen extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
}

export interface FullscreenElementInfo {
  element: HTMLElement | null;
  shadowRoot: ShadowRoot | null;
  isFullscreen: boolean;
  belongsToCurrentVideo: boolean;
}

export interface FullscreenHelperOptions {
  container: HTMLElement;
  video?: HTMLVideoElement;
}

export class FullscreenHelper {
  private container: HTMLElement;
  private video?: HTMLVideoElement;
  private fullscreenChangeListeners: Set<() => void> = new Set();
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
  getFullscreenElement(): HTMLElement | null {
    const doc = document as DocumentWithFullscreen;
    const fullscreenEl = doc.fullscreenElement ?? doc.webkitFullscreenElement;

    if (!(fullscreenEl instanceof HTMLElement)) {
      return null;
    }

    return fullscreenEl;
  }

  /**
   * Gets comprehensive fullscreen information including ShadowDOM details
   */
  getFullscreenInfo(): FullscreenElementInfo {
    const element = this.getFullscreenElement();
    const isFullscreen = Boolean(element);

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
      isFullscreen,
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

  /**
   * Checks if the current container should be considered "big" for button positioning
   * Takes into account fullscreen state and ShadowDOM
   */
  isBigContainer(threshold: number = 550): boolean {
    const target = this.getResizeObserverTarget();
    const rect = target.getBoundingClientRect();

    // Try width from rect first (most reliable)
    if (rect.width > 0) {
      return rect.width > threshold;
    }

    // Fallback to clientWidth
    return target.clientWidth > threshold;
  }

  /**
   * Adds a listener for fullscreen changes
   */
  addFullscreenChangeListener(listener: () => void): void {
    this.fullscreenChangeListeners.add(listener);

    if (this.fullscreenChangeListeners.size === 1) {
      this.setupFullscreenListeners();
    }
  }

  /**
   * Removes a fullscreen change listener
   */
  removeFullscreenChangeListener(listener: () => void): void {
    this.fullscreenChangeListeners.delete(listener);

    if (this.fullscreenChangeListeners.size === 0) {
      this.cleanupFullscreenListeners();
    }
  }

  /**
   * Sets up native fullscreen event listeners
   */
  private setupFullscreenListeners(): void {
    if (this.nativeFullscreenListenersActive) {
      return;
    }

    document.addEventListener("fullscreenchange", this.handleFullscreenChange);
    document.addEventListener(
      "webkitfullscreenchange",
      this.handleFullscreenChange,
    );

    if (this.video) {
      this.video.addEventListener(
        "webkitbeginfullscreen",
        this.handleFullscreenChange,
      );
      this.video.addEventListener(
        "webkitendfullscreen",
        this.handleFullscreenChange,
      );
    }

    this.nativeFullscreenListenersActive = true;
  }

  /**
   * Cleans up fullscreen event listeners
   */
  private cleanupFullscreenListeners(): void {
    if (!this.nativeFullscreenListenersActive) {
      return;
    }

    document.removeEventListener(
      "fullscreenchange",
      this.handleFullscreenChange,
    );
    document.removeEventListener(
      "webkitfullscreenchange",
      this.handleFullscreenChange,
    );

    if (this.video) {
      this.video.removeEventListener(
        "webkitbeginfullscreen",
        this.handleFullscreenChange,
      );
      this.video.removeEventListener(
        "webkitendfullscreen",
        this.handleFullscreenChange,
      );
    }

    this.nativeFullscreenListenersActive = false;
  }

  /**
   * Notifies all listeners about fullscreen state changes
   */
  private notifyFullscreenChange(): void {
    for (const listener of this.fullscreenChangeListeners) {
      try {
        listener();
      } catch (error) {
        console.warn(
          "[FullscreenHelper] Error in fullscreen change listener:",
          error,
        );
      }
    }
  }

  /**
   * Updates the container reference (useful when video container changes)
   */
  updateContainer(container: HTMLElement): void {
    this.container = container;
  }

  /**
   * Updates the video reference
   */
  updateVideo(video: HTMLVideoElement | undefined): void {
    const shouldRebind =
      this.nativeFullscreenListenersActive && this.video !== video;
    if (shouldRebind) {
      this.cleanupFullscreenListeners();
    }
    this.video = video;
    if (shouldRebind && this.fullscreenChangeListeners.size > 0) {
      this.setupFullscreenListeners();
    }
  }

  /**
   * Cleans up all resources
   */
  destroy(): void {
    this.cleanupFullscreenListeners();
    this.fullscreenChangeListeners.clear();
  }
}
