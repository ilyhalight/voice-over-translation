import { EventImpl } from "../../core/eventImpl";
import type { DialogProps } from "../../types/components/dialog";
import UI from "../../ui";
import { CLOSE_ICON } from "../icons";
import {
  addComponentEventListener,
  getHiddenState,
  removeComponentEventListener,
  setHiddenState,
} from "./componentShared";

export default class Dialog {
  container: HTMLElement;
  backdrop: HTMLElement;
  box: HTMLElement;
  contentWrapper: HTMLElement;
  headerContainer: HTMLElement;
  titleContainer: HTMLElement;
  title: HTMLElement;
  closeButton: HTMLElement;
  bodyContainer: HTMLElement;
  footerContainer: HTMLElement;

  private readonly onClose = new EventImpl();
  private readonly events = {
    close: this.onClose,
  };

  // Focus management for accessibility.
  private previouslyFocused: Element | null = null;
  private keydownListener?: (e: KeyboardEvent) => void;

  // Adaptive vertical alignment for long content.
  private adaptiveAlignObserver?: ResizeObserver;
  private adaptiveAlignRaf: number | null = null;
  private readonly handleViewportChange = () => {
    this.scheduleAdaptiveVerticalAlign();
  };

  private readonly titleId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `vot-dialog-title-${Math.random().toString(36).slice(2)}`;

  private readonly _titleHtml: HTMLElement | string;
  private readonly _isTemp: boolean;

  constructor({ titleHtml, isTemp = false }: DialogProps) {
    this._titleHtml = titleHtml;
    this._isTemp = isTemp;

    const elements = this.createElements();
    this.container = elements.container;
    this.backdrop = elements.backdrop;
    this.box = elements.box;

    this.contentWrapper = elements.contentWrapper;
    this.headerContainer = elements.headerContainer;
    this.titleContainer = elements.titleContainer;
    this.title = elements.title;
    this.closeButton = elements.closeButton;
    this.bodyContainer = elements.bodyContainer;
    this.footerContainer = elements.footerContainer;
  }

  private createElements() {
    const container = UI.createEl("vot-block", ["vot-dialog-container"]);
    if (this._isTemp) {
      container.classList.add("vot-dialog-temp");
    }

    container.hidden = !this._isTemp;
    // A11y: avoid focus/interaction on hidden dialogs.
    container.setAttribute("aria-hidden", container.hidden ? "true" : "false");
    container.toggleAttribute("inert", container.hidden);

    const backdrop = UI.createEl("vot-block", ["vot-dialog-backdrop"]);
    const box = UI.createEl("vot-block", ["vot-dialog"]);
    // Default mode: centered (CSS). JS can switch to `top` for long content.
    box.dataset.verticalAlign = "center";
    // A11y: follow the ARIA dialog pattern.
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.tabIndex = -1;
    const contentWrapper = UI.createEl("vot-block", [
      "vot-dialog-content-wrapper",
    ]);
    const headerContainer = UI.createEl("vot-block", [
      "vot-dialog-header-container",
    ]);
    const titleContainer = UI.createEl("vot-block", [
      "vot-dialog-title-container",
    ]);

    const title = UI.createEl("vot-block", ["vot-dialog-title"]);
    title.id = this.titleId;
    title.append(this._titleHtml);
    titleContainer.appendChild(title);

    box.setAttribute("aria-labelledby", this.titleId);

    const closeButton = UI.createIconButton(CLOSE_ICON, {
      ariaLabel: "Close",
    });
    closeButton.classList.add("vot-dialog-close-button");
    backdrop.addEventListener("click", () => {
      this.close();
    });
    closeButton.addEventListener("click", () => {
      this.close();
    });

    headerContainer.append(titleContainer, closeButton);

    const bodyContainer = UI.createEl("vot-block", [
      "vot-dialog-body-container",
    ]);
    const footerContainer = UI.createEl("vot-block", [
      "vot-dialog-footer-container",
    ]);

    contentWrapper.append(headerContainer, bodyContainer, footerContainer);
    box.appendChild(contentWrapper);
    container.append(backdrop, box);

    // Prevent backdrop click from bubbling via the dialog content.
    box.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    return {
      container,
      backdrop,
      box,
      contentWrapper,
      headerContainer,
      titleContainer,
      title,
      closeButton,
      bodyContainer,
      footerContainer,
    };
  }

  addEventListener(_type: "close", listener: () => void): this {
    addComponentEventListener(this.events, "close", listener);

    return this;
  }

  removeEventListener(_type: "close", listener: () => void): this {
    removeComponentEventListener(this.events, "close", listener);

    return this;
  }

  open() {
    // Temp dialogs are created visible; still run focus/keyboard setup.
    this.previouslyFocused ??= document.activeElement;

    this.hidden = false;
    this.attachKeydownTrap();
    this.attachAdaptiveVerticalAlign();
    // Focus after mount.
    queueMicrotask(() => this.focusFirst());
    return this;
  }

  remove() {
    this.detachAdaptiveVerticalAlign();
    this.detachKeydownTrap();
    this.container.remove();
    this.restoreFocus();
    this.onClose.dispatch();
    return this;
  }

  close() {
    if (this._isTemp) {
      return this.remove();
    }

    this.detachAdaptiveVerticalAlign();
    this.detachKeydownTrap();
    this.hidden = true;
    this.restoreFocus();
    this.onClose.dispatch();
    return this;
  }

  private attachAdaptiveVerticalAlign() {
    // Avoid duplicate listeners.
    if (this.adaptiveAlignObserver) {
      this.scheduleAdaptiveVerticalAlign();
      return;
    }

    if (typeof ResizeObserver !== "undefined") {
      this.adaptiveAlignObserver = new ResizeObserver(() => {
        this.scheduleAdaptiveVerticalAlign();
      });
      this.adaptiveAlignObserver.observe(this.contentWrapper);
    }

    globalThis.addEventListener("resize", this.handleViewportChange, {
      passive: true,
    });
    if (globalThis.visualViewport) {
      globalThis.visualViewport.addEventListener(
        "resize",
        this.handleViewportChange,
        { passive: true },
      );
      // Mobile URL bar changes can shift the visual viewport without a resize.
      globalThis.visualViewport.addEventListener(
        "scroll",
        this.handleViewportChange,
        { passive: true },
      );
    }

    this.scheduleAdaptiveVerticalAlign();
  }

  private detachAdaptiveVerticalAlign() {
    if (this.adaptiveAlignObserver) {
      this.adaptiveAlignObserver.disconnect();
      this.adaptiveAlignObserver = undefined;
    }

    globalThis.removeEventListener("resize", this.handleViewportChange);
    globalThis.visualViewport?.removeEventListener(
      "resize",
      this.handleViewportChange,
    );
    globalThis.visualViewport?.removeEventListener(
      "scroll",
      this.handleViewportChange,
    );

    if (this.adaptiveAlignRaf !== null) {
      cancelAnimationFrame(this.adaptiveAlignRaf);
      this.adaptiveAlignRaf = null;
    }
  }

  private scheduleAdaptiveVerticalAlign() {
    if (this.adaptiveAlignRaf !== null) {
      cancelAnimationFrame(this.adaptiveAlignRaf);
    }

    this.adaptiveAlignRaf = requestAnimationFrame(() => {
      this.adaptiveAlignRaf = null;
      this.updateAdaptiveVerticalAlign();
    });
  }

  private updateAdaptiveVerticalAlign() {
    const viewportHeight =
      globalThis.visualViewport?.height ?? globalThis.innerHeight;
    if (!viewportHeight || viewportHeight <= 0) {
      return;
    }

    // Keep a small margin so the dialog never hugs the viewport edges.
    const marginPx = 16;
    const centerMaxPx = Math.max(160, Math.round(viewportHeight * 0.75));
    const topMaxPx = Math.max(160, Math.round(viewportHeight - marginPx * 2));

    // Use scrollHeight so we react to *content size*, not the already-clamped size.
    const contentHeightPx = this.contentWrapper.scrollHeight;

    const currentlyTop = this.box.dataset.verticalAlign === "top";

    // Hysteresis prevents "flicker" around the threshold when content changes.
    const enterTopThresholdPx = centerMaxPx - 8;
    const exitTopThresholdPx = Math.round(viewportHeight * 0.6);

    const shouldTop = currentlyTop
      ? contentHeightPx > exitTopThresholdPx
      : contentHeightPx >= enterTopThresholdPx;

    if (shouldTop) {
      this.box.dataset.verticalAlign = "top";
      this.box.style.setProperty("--vot-dialog-max-height", `${topMaxPx}px`);
    } else {
      this.box.dataset.verticalAlign = "center";
      this.box.style.setProperty("--vot-dialog-max-height", `${centerMaxPx}px`);
    }
  }

  private restoreFocus() {
    const el = this.previouslyFocused;
    this.previouslyFocused = null;
    if (el && el instanceof HTMLElement && document.contains(el)) {
      el.focus();
    }
  }

  private getFocusableElements(): HTMLElement[] {
    // Keep this simple and DOM-only (no dependencies).
    const selectors = [
      "button:not([disabled])",
      "[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
      "[role='button']:not([aria-disabled='true'])",
    ];
    return Array.from(
      this.container.querySelectorAll<HTMLElement>(selectors.join(",")),
    ).filter((el) => !el.hidden && el.getClientRects().length > 0);
  }

  private focusFirst() {
    const focusables = this.getFocusableElements();
    (focusables[0] ?? this.closeButton ?? this.box).focus?.();
  }

  private attachKeydownTrap() {
    if (this.keydownListener) return;
    this.keydownListener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        this.close();
        return;
      }

      if (e.key !== "Tab") {
        return;
      }

      const focusables = this.getFocusableElements();
      if (!focusables.length) {
        e.preventDefault();
        this.box.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables.at(-1) ?? first;
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || active === this.box) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Use bubbling so focused inputs inside the dialog can intercept keys
    // (e.g. settings search field can clear on Escape) and so detach works
    // reliably with a plain removeEventListener call.
    this.container.addEventListener("keydown", this.keydownListener);
  }

  private detachKeydownTrap() {
    if (!this.keydownListener) return;
    this.container.removeEventListener("keydown", this.keydownListener);
    this.keydownListener = undefined;
  }

  set hidden(isHidden: boolean) {
    setHiddenState(this.container, isHidden);
    this.container.setAttribute("aria-hidden", isHidden ? "true" : "false");
    this.container.toggleAttribute("inert", isHidden);
  }

  get hidden() {
    return getHiddenState(this.container);
  }

  get isDialogOpen() {
    return !this.container.hidden;
  }
}
