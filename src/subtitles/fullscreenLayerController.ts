import { getHostElement } from "#utils/dom.ts";

type FullscreenLayerControllerOptions = {
  container: HTMLElement | ShadowRoot;
};

export class FullscreenLayerController {
  private container: HTMLElement | ShadowRoot;
  private patchedLayoutRoot: HTMLElement | null = null;
  private originalInlinePosition = "";

  constructor({ container }: FullscreenLayerControllerOptions) {
    this.container = container;
  }

  updateContainer(container: HTMLElement | ShadowRoot): void {
    this.container = container;
  }

  getLayoutRootElement(): HTMLElement {
    return getHostElement(this.container);
  }

  syncWidgetContainer(widgetContainer: HTMLElement | null): void {
    const containerEl = this.getLayoutRootElement();
    if (getComputedStyle(containerEl).position === "static") {
      if (this.patchedLayoutRoot !== containerEl) {
        this.restoreLayoutRootPosition();
        this.patchedLayoutRoot = containerEl;
        this.originalInlinePosition = containerEl.style.position;
      }
      containerEl.style.position = "relative";
    }

    if (widgetContainer && widgetContainer.parentNode !== this.container) {
      this.container.appendChild(widgetContainer);
    }
  }

  release(): void {
    this.restoreLayoutRootPosition();
  }

  private restoreLayoutRootPosition(): void {
    if (!this.patchedLayoutRoot) return;
    this.patchedLayoutRoot.style.position = this.originalInlinePosition;
    this.patchedLayoutRoot = null;
    this.originalInlinePosition = "";
  }
}
