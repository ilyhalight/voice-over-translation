import { resolveScopedFullscreenElement } from "../utils/dom";

type DocumentWithFullscreenElement = Document & {
  webkitFullscreenElement?: Element | null;
};

type FullscreenLayerControllerOptions = {
  video?: HTMLVideoElement;
  container: HTMLElement;
};

export class FullscreenLayerController {
  private readonly video?: HTMLVideoElement;
  private container: HTMLElement;
  private fullscreenLayer: HTMLElement | null = null;

  constructor({ video, container }: FullscreenLayerControllerOptions) {
    this.video = video;
    this.container = container;
  }

  updateContainer(container: HTMLElement): void {
    this.container = container;
  }

  getWidgetParentElement(): HTMLElement {
    return this.shouldUseFullscreenViewportLayer()
      ? this.ensureFullscreenLayer()
      : this.container;
  }

  getLayoutRootElement(): HTMLElement {
    return this.fullscreenLayer?.isConnected
      ? this.fullscreenLayer
      : this.container;
  }

  syncWidgetContainer(widgetContainer: HTMLElement | null): void {
    const widgetParent = this.getWidgetParentElement();

    if (
      widgetParent === this.container &&
      getComputedStyle(this.container).position === "static"
    ) {
      this.container.style.position = "relative";
    }

    if (widgetContainer && widgetContainer.parentElement !== widgetParent) {
      widgetParent.appendChild(widgetContainer);
    }

    if (
      widgetParent === this.container &&
      this.fullscreenLayer?.parentElement
    ) {
      this.fullscreenLayer.remove();
      this.fullscreenLayer = null;
    }
  }

  release(): void {
    if (!this.fullscreenLayer) return;
    this.fullscreenLayer.remove();
    this.fullscreenLayer = null;
  }

  private getActiveFullscreenElement(): HTMLElement | null {
    const doc = document as DocumentWithFullscreenElement;
    const fullscreenEl = doc.fullscreenElement ?? doc.webkitFullscreenElement;
    return resolveScopedFullscreenElement(
      fullscreenEl,
      [this.container, this.video],
      {
        allowDocumentViewport: true,
      },
    );
  }

  private isCurrentVideoInFullscreenSession(): boolean {
    const fullscreenEl = this.getActiveFullscreenElement();
    if (!fullscreenEl) return false;

    if (
      fullscreenEl === this.container ||
      fullscreenEl.contains(this.container) ||
      this.container.contains(fullscreenEl)
    ) {
      return true;
    }

    return Boolean(
      this.video &&
        (fullscreenEl === this.video ||
          fullscreenEl.contains(this.video) ||
          this.video.contains(fullscreenEl)),
    );
  }

  private shouldUseFullscreenViewportLayer(): boolean {
    return this.isCurrentVideoInFullscreenSession();
  }

  private ensureFullscreenLayer(): HTMLElement {
    if (!this.fullscreenLayer) {
      const layer = document.createElement("vot-block");
      layer.classList.add("vot-subtitles-layer");
      this.fullscreenLayer = layer;
    }

    if (this.fullscreenLayer.parentElement !== this.container) {
      this.container.appendChild(this.fullscreenLayer);
    }

    return this.fullscreenLayer;
  }
}
