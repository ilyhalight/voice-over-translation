type FullscreenLayerControllerOptions = {
  container: HTMLElement;
};

export class FullscreenLayerController {
  private container: HTMLElement;

  constructor({ container }: FullscreenLayerControllerOptions) {
    this.container = container;
  }

  updateContainer(container: HTMLElement): void {
    this.container = container;
  }

  getWidgetParentElement(): HTMLElement {
    return this.container;
  }

  getLayoutRootElement(): HTMLElement {
    return this.container;
  }

  syncWidgetContainer(widgetContainer: HTMLElement | null): void {
    if (getComputedStyle(this.container).position === "static") {
      this.container.style.position = "relative";
    }

    if (widgetContainer && widgetContainer.parentElement !== this.container) {
      this.container.appendChild(widgetContainer);
    }
  }
  release(): void {}
}
