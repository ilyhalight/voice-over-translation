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
