import { render } from "lit-html";
import { localizationProvider } from "../../localization/localizationProvider";
import UI from "../../ui";
import { LIVE_VOICE_ICON, STANDARD_VOICE_ICON } from "../icons";
import {
  createDomId,
  isEventInside,
  setInteractiveHiddenState,
} from "./componentShared";

export type VoiceType = "standard" | "live";

export interface VoicePopoverProps {
  activeVoice: VoiceType;
  /** Overlay root — popover positions in this element's coordinate space. */
  layoutRoot: HTMLElement;
  onTranslate?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
}

type VoiceChangeListener = (voice: VoiceType) => boolean | undefined;

export default class VoicePopover {
  container: HTMLElement;

  private readonly id = createDomId("vot-voice-popover");
  private readonly layoutRoot: HTMLElement;
  private _activeVoice: VoiceType;
  private readonly onTranslate?: () => void;
  private listeners: Array<VoiceChangeListener> = [];
  private visibilityListeners: Array<(isOpen: boolean) => void> = [];
  private lastVisibilityState = false;

  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly SHOW_DELAY_MS = 80;
  private static readonly HIDE_DELAY_MS = 80;

  private positionRafId: number | null = null;
  private anchorEl: HTMLElement | null = null;
  private outsideTapHandler: ((e: PointerEvent) => void) | null = null;
  private layoutListening = false;

  private readonly onLayoutChangeBound = (): void => {
    if (this.isOpen && this.anchorEl) {
      this.schedulePositionUpdate(this.anchorEl);
    }
  };

  constructor({
    activeVoice,
    layoutRoot,
    onTranslate,
    onOpenChange,
  }: VoicePopoverProps) {
    this._activeVoice = activeVoice;
    this.layoutRoot = layoutRoot;
    this.onTranslate = onTranslate;
    if (onOpenChange) {
      this.visibilityListeners.push(onOpenChange);
    }
    this.container = this.createContainer();
  }

  get activeVoice(): VoiceType {
    return this._activeVoice;
  }

  set activeVoice(value: VoiceType) {
    this._activeVoice = value;
    this.updateActiveState();
  }

  get hidden(): boolean {
    return this.container.hidden;
  }

  get isOpen(): boolean {
    return !this.hidden;
  }

  addEventListener(listener: VoiceChangeListener): this {
    this.listeners.push(listener);
    return this;
  }

  removeEventListener(listener: VoiceChangeListener): this {
    this.listeners = this.listeners.filter((l) => l !== listener);
    return this;
  }

  addVisibilityListener(listener: (isOpen: boolean) => void): this {
    this.visibilityListeners.push(listener);
    return this;
  }

  removeVisibilityListener(listener: (isOpen: boolean) => void): this {
    this.visibilityListeners = this.visibilityListeners.filter(
      (l) => l !== listener,
    );
    return this;
  }

  scheduleShow(anchor: HTMLElement): void {
    this.cancelHide();
    this.cancelShow();
    if (this.isOpen) {
      this.anchorEl = anchor;
      this.updatePosition(anchor);
      this.emitVisibilityChange(true);
      return;
    }
    this.showTimer = setTimeout(() => {
      this.showTimer = null;
      this.open(anchor);
    }, VoicePopover.SHOW_DELAY_MS);
  }

  scheduleHide(): void {
    this.cancelShow();
    if (this.hidden) return;
    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;
      this.close();
    }, VoicePopover.HIDE_DELAY_MS);
  }

  showNow(anchor: HTMLElement): void {
    this.cancelShow();
    this.cancelHide();
    this.open(anchor);
  }

  toggle(anchor: HTMLElement): void {
    if (this.isOpen) {
      this.hideNow();
    } else {
      this.showNow(anchor);
    }
  }

  toggleForTouch(anchor: HTMLElement): void {
    this.toggle(anchor);
  }

  cancelShow(): void {
    if (this.showTimer !== null) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
  }

  cancelHide(): void {
    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  hideNow(): void {
    this.cancelShow();
    this.cancelHide();
    this.close();
  }

  release(): void {
    this.cancelShow();
    this.cancelHide();
    this.close();
    this.container.remove();
    this.listeners = [];
    this.visibilityListeners = [];
  }

  private createContainer(): HTMLElement {
    const el = UI.createEl("vot-block", ["vot-voice-popover"]);
    el.id = this.id;
    el.setAttribute("role", "menu");
    el.setAttribute("aria-label", "Voice type selection");
    setInteractiveHiddenState(el, true);

    el.append(
      this.createItem(
        "standard",
        STANDARD_VOICE_ICON,
        localizationProvider.get("VOTStandardVoicesTitle" as any),
        localizationProvider.get("VOTStandardVoicesSubtitle" as any),
      ),
      UI.createEl("vot-block", ["vot-voice-popover__divider"]),
      this.createItem(
        "live",
        LIVE_VOICE_ICON,
        localizationProvider.get("VOTLiveVoicesTitle" as any),
        localizationProvider.get("VOTLiveVoicesSubtitle" as any),
      ),
    );

    el.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch") return;
      this.cancelHide();
    });
    el.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "touch") return;
      this.scheduleHide();
    });

    return el;
  }

  private createItem(
    voice: VoiceType,
    iconTemplate: unknown,
    title: string,
    subtitle: string,
  ): HTMLElement {
    const item = UI.createEl("vot-block", ["vot-voice-popover__item"]);
    item.setAttribute("role", "menuitemradio");
    item.setAttribute("tabindex", "0");
    item.dataset.voice = voice;

    const iconWrap = UI.createEl("vot-block", [
      "vot-voice-popover__item-icon",
      `vot-voice-popover__item-icon--${voice}`,
    ]);
    render(iconTemplate, iconWrap);

    const textWrap = UI.createEl("vot-block", ["vot-voice-popover__item-text"]);
    const titleEl = UI.createEl("span", ["vot-voice-popover__item-title"]);
    titleEl.textContent = title;
    const subtitleEl = UI.createEl("span", [
      "vot-voice-popover__item-subtitle",
    ]);
    subtitleEl.textContent = subtitle;
    textWrap.append(titleEl, subtitleEl);

    item.append(iconWrap, textWrap);

    const select = () => this.handleSelect(voice);
    item.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 && e.pointerType !== "touch") return;
      e.preventDefault();
      e.stopPropagation();
      select();
    });
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        select();
      }
    });

    return item;
  }

  private open(anchor: HTMLElement): void {
    if (this.isOpen) {
      this.anchorEl = anchor;
      this.updatePosition(anchor);
      this.emitVisibilityChange(true);
      return;
    }
    this.anchorEl = anchor;
    setInteractiveHiddenState(this.container, false);
    this.updateActiveState();
    this.updatePosition(anchor);
    this.attachLayoutListeners();
    this.attachOutsideTapListener();
    this.emitVisibilityChange(true);
  }

  private close(): void {
    if (this.hidden) {
      this.emitVisibilityChange(false);
      return;
    }
    setInteractiveHiddenState(this.container, true);
    this.detachLayoutListeners();
    this.detachOutsideTapListener();
    this.anchorEl = null;
    if (this.positionRafId !== null) {
      cancelAnimationFrame(this.positionRafId);
      this.positionRafId = null;
    }
    this.emitVisibilityChange(false);
  }

  private emitVisibilityChange(isOpen: boolean): void {
    if (this.lastVisibilityState === isOpen) return;
    this.lastVisibilityState = isOpen;
    for (const listener of this.visibilityListeners) {
      listener(isOpen);
    }
  }

  private handleSelect(voice: VoiceType): void {
    this._activeVoice = voice;
    this.updateActiveState();
    this.cancelHide();
    let shouldTranslate = true;
    for (const listener of this.listeners) {
      if (listener(voice) === false) {
        shouldTranslate = false;
      }
    }
    if (shouldTranslate && this.onTranslate) {
      this.onTranslate();
    }
    this.hideNow();
  }

  private updateActiveState(): void {
    for (const item of this.container.querySelectorAll<HTMLElement>(
      ".vot-voice-popover__item",
    )) {
      const isActive = item.dataset.voice === this._activeVoice;
      item.classList.toggle("vot-voice-popover__item--active", isActive);
      item.setAttribute("aria-checked", isActive.toString());
    }
  }

  private schedulePositionUpdate(anchor: HTMLElement): void {
    if (this.positionRafId !== null) return;
    this.positionRafId = requestAnimationFrame(() => {
      this.positionRafId = null;
      this.updatePosition(anchor);
    });
  }

  private positionColumn(
    containerRect: DOMRect,
    rootRect: DOMRect,
    gap: number,
    position: string,
  ): { left: number; top: number; placement: "left" | "right" } {
    const spaceLeft = containerRect.left - rootRect.left - gap;
    const spaceRight = rootRect.right - containerRect.right - gap;
    const preferLeft = position === "right" || position === "rightCenter";
    const placement: "left" | "right" =
      (preferLeft && spaceLeft >= 160) || spaceLeft >= spaceRight
        ? "left"
        : "right";

    this.container.style.setProperty(
      "--vot-voice-popover-max-width",
      `${Math.max(160, Math.min(310, placement === "left" ? spaceLeft : spaceRight))}px`,
    );
    const popoverRect = this.container.getBoundingClientRect();
    const top =
      containerRect.top + containerRect.height / 2 - popoverRect.height / 2;
    const left =
      placement === "left"
        ? containerRect.left - popoverRect.width - gap
        : containerRect.right + gap;

    return { left, top, placement };
  }

  private positionRow(
    containerRect: DOMRect,
    rootRect: DOMRect,
    gap: number,
  ): { left: number; top: number; placement: "top" | "bottom" } {
    const spaceAbove = containerRect.top - rootRect.top - gap;
    const spaceBelow = rootRect.bottom - containerRect.bottom - gap;
    const placement: "top" | "bottom" =
      spaceAbove >= spaceBelow ? "top" : "bottom";
    this.container.style.setProperty(
      "--vot-voice-popover-max-height",
      `${Math.max(96, placement === "top" ? spaceAbove : spaceBelow)}px`,
    );
    const popoverRect = this.container.getBoundingClientRect();
    const left =
      containerRect.left + containerRect.width / 2 - popoverRect.width / 2;
    const top =
      placement === "top"
        ? containerRect.top - popoverRect.height - gap
        : containerRect.bottom + gap;

    return { left, top, placement };
  }

  private updatePosition(anchor: HTMLElement): void {
    if (!this.isOpen) return;

    const rootRect = this.layoutRoot.getBoundingClientRect();
    const gap = 8;
    const maxRootWidth = Math.max(160, rootRect.width - gap * 2);
    const maxRootHeight = Math.max(96, rootRect.height - gap * 2);

    this.container.style.setProperty(
      "--vot-voice-popover-max-width",
      `${Math.min(310, maxRootWidth)}px`,
    );
    this.container.style.setProperty(
      "--vot-voice-popover-max-height",
      `${maxRootHeight}px`,
    );

    const buttonContainer = anchor.closest("[data-direction]") ?? anchor;
    const containerRect = buttonContainer.getBoundingClientRect();
    const direction =
      (buttonContainer as HTMLElement).dataset?.direction ?? "row";
    const position =
      (buttonContainer as HTMLElement).dataset?.position ?? "default";

    const result =
      direction === "column"
        ? this.positionColumn(containerRect, rootRect, gap, position)
        : this.positionRow(containerRect, rootRect, gap);

    const popoverRect = this.container.getBoundingClientRect();
    let left = Math.max(
      gap,
      Math.min(result.left, rootRect.right - popoverRect.width - gap),
    );
    let top = Math.max(
      gap,
      Math.min(result.top, rootRect.bottom - popoverRect.height - gap),
    );

    left -= rootRect.left;
    top -= rootRect.top;

    this.container.dataset.placement = result.placement;
    this.container.style.left = `${left}px`;
    this.container.style.top = `${top}px`;
  }

  private attachLayoutListeners(): void {
    if (this.layoutListening) return;
    this.layoutListening = true;
    window.addEventListener("scroll", this.onLayoutChangeBound, true);
    window.addEventListener("resize", this.onLayoutChangeBound);
    window.visualViewport?.addEventListener("scroll", this.onLayoutChangeBound);
    window.visualViewport?.addEventListener("resize", this.onLayoutChangeBound);
  }

  private detachLayoutListeners(): void {
    if (!this.layoutListening) return;
    this.layoutListening = false;
    window.removeEventListener("scroll", this.onLayoutChangeBound, true);
    window.removeEventListener("resize", this.onLayoutChangeBound);
    window.visualViewport?.removeEventListener(
      "scroll",
      this.onLayoutChangeBound,
    );
    window.visualViewport?.removeEventListener(
      "resize",
      this.onLayoutChangeBound,
    );
  }

  private attachOutsideTapListener(): void {
    this.detachOutsideTapListener();
    this.outsideTapHandler = (e: PointerEvent) => {
      if (isEventInside(e, this.container)) return;
      if (this.anchorEl && isEventInside(e, this.anchorEl)) return;
      this.hideNow();
    };
    document.addEventListener("pointerdown", this.outsideTapHandler, {
      capture: true,
      passive: true,
    });
  }

  private detachOutsideTapListener(): void {
    if (!this.outsideTapHandler) return;
    document.removeEventListener("pointerdown", this.outsideTapHandler, {
      capture: true,
    });
    this.outsideTapHandler = null;
  }
}
