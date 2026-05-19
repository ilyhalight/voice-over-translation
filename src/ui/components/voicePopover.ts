import { render } from "lit-html";
import { localizationProvider } from "../../localization/localizationProvider";
import UI from "../../ui";
import { LIVE_VOICE_ICON, STANDARD_VOICE_ICON } from "../icons";
import { createDomId, setInteractiveHiddenState } from "./componentShared";

export type VoiceType = "standard" | "live";

export interface VoicePopoverProps {
  activeVoice: VoiceType;
  /** Overlay root — popover positions in this element's coordinate space. */
  layoutRoot: HTMLElement;
  onTranslate?: () => void;
}

export default class VoicePopover {
  container: HTMLElement;

  private readonly id = createDomId("vot-voice-popover");
  private readonly layoutRoot: HTMLElement;
  private _activeVoice: VoiceType;
  private onTranslate?: () => void;
  private listeners: Array<(voice: VoiceType) => void> = [];

  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly SHOW_DELAY_MS = 120;
  private static readonly HIDE_DELAY_MS = 150;

  private positionRafId: number | null = null;
  private anchorEl: HTMLElement | null = null;
  private outsideTapHandler: ((e: PointerEvent) => void) | null = null;
  private layoutListening = false;

  private readonly onLayoutChangeBound = (): void => {
    if (this.isOpen && this.anchorEl) {
      this.schedulePositionUpdate(this.anchorEl);
    }
  };

  constructor({ activeVoice, layoutRoot, onTranslate }: VoicePopoverProps) {
    this._activeVoice = activeVoice;
    this.layoutRoot = layoutRoot;
    this.onTranslate = onTranslate;
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

  addEventListener(listener: (voice: VoiceType) => void): this {
    this.listeners.push(listener);
    return this;
  }

  removeEventListener(listener: (voice: VoiceType) => void): this {
    this.listeners = this.listeners.filter((l) => l !== listener);
    return this;
  }

  scheduleShow(anchor: HTMLElement): void {
    this.cancelHide();
    if (this.isOpen) return;
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

  toggleForTouch(anchor: HTMLElement): void {
    if (this.isOpen) {
      this.hideNow();
    } else {
      this.cancelHide();
      this.open(anchor);
    }
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
    if (this.isOpen) return;
    this.anchorEl = anchor;
    setInteractiveHiddenState(this.container, false);
    this.updateActiveState();
    this.schedulePositionUpdate(anchor);
    this.attachLayoutListeners();
    this.attachOutsideTapListener();
  }

  private close(): void {
    if (this.hidden) return;
    setInteractiveHiddenState(this.container, true);
    this.detachLayoutListeners();
    this.detachOutsideTapListener();
    this.anchorEl = null;
    if (this.positionRafId !== null) {
      cancelAnimationFrame(this.positionRafId);
      this.positionRafId = null;
    }
  }

  private handleSelect(voice: VoiceType): void {
    this._activeVoice = voice;
    this.updateActiveState();
    this.cancelHide();
    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;
      this.close();
    }, 400);
    for (const listener of this.listeners) {
      listener(voice);
    }
    if (this.onTranslate) {
      this.onTranslate();
    }
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
      this.positionRafId = requestAnimationFrame(() => {
        this.positionRafId = null;
        this.updatePosition(anchor);
      });
    });
  }

  private updatePosition(anchor: HTMLElement): void {
    if (!this.isOpen) return;

    const rootRect = this.layoutRoot.getBoundingClientRect();
    const popoverRect = this.container.getBoundingClientRect();
    const gap = 8;

    const buttonContainer = anchor.closest("[data-direction]") ?? anchor;
    const containerRect = buttonContainer.getBoundingClientRect();
    const direction =
      (buttonContainer as HTMLElement).dataset?.direction ?? "row";
    const position =
      (buttonContainer as HTMLElement).dataset?.position ?? "default";

    let left: number;
    let top: number;

    if (direction === "column") {
      top =
        containerRect.top + containerRect.height / 2 - popoverRect.height / 2;

      if (position === "right") {
        left = containerRect.left - popoverRect.width - gap;
      } else {
        left = containerRect.right + gap;
      }
    } else {
      left =
        containerRect.left + containerRect.width / 2 - popoverRect.width / 2;

      const spaceAbove = containerRect.top - gap;
      const spaceBelow = rootRect.bottom - containerRect.bottom - gap;
      if (spaceAbove >= popoverRect.height || spaceAbove >= spaceBelow) {
        top = containerRect.top - popoverRect.height - gap;
      } else {
        top = containerRect.bottom + gap;
      }
    }

    left = Math.max(
      gap,
      Math.min(left, rootRect.right - popoverRect.width - gap),
    );
    top = Math.max(
      gap,
      Math.min(top, rootRect.bottom - popoverRect.height - gap),
    );

    left -= rootRect.left;
    top -= rootRect.top;

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
      if (e.pointerType !== "touch") return;
      if (this.container.contains(e.target as Node)) return;
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
