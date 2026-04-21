type FullscreenLayerControllerOptions = {
  container: HTMLElement | ShadowRoot;
};

export class FullscreenLayerController {
  private container: HTMLElement | ShadowRoot;

  constructor({ container }: FullscreenLayerControllerOptions) {
    this.container = container;
  }

  updateContainer(container: HTMLElement | ShadowRoot): void {
    this.container = container;
  }

  getWidgetParentElement(): HTMLElement | ShadowRoot {
    return this.container;
  }

  getLayoutRootElement(): HTMLElement {
    return this.container instanceof ShadowRoot
      ? (this.container.host as HTMLElement)
      : this.container;
  }

  syncWidgetContainer(widgetContainer: HTMLElement | null): void {
    const containerEl =
      this.container instanceof ShadowRoot
        ? (this.container.host as HTMLElement)
        : this.container;
    if (getComputedStyle(containerEl).position === "static") {
      containerEl.style.position = "relative";
    }

    if (widgetContainer && widgetContainer.parentNode !== this.container) {
      this.container.appendChild(widgetContainer);
    }
  }
  release(): void {}
}
