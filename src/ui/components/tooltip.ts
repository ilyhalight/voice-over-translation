import {
  type PagePosition,
  type Position,
  positions,
  type TooltipMode,
  type TooltipOpts,
  type Trigger,
  tooltipModes,
  triggers,
} from "../../types/components/tooltip";
import UI from "../../ui";
import { clamp } from "../../utils/utils";
import { createDomId, isEventInside } from "./componentShared";

export default class Tooltip {
  showed = false;
  target: HTMLElement;
  anchor: HTMLElement;
  content: string | HTMLElement;
  position: Position;
  preferredPosition: Position;
  trigger: Trigger;
  offsetX: number;
  offsetY: number;
  private _hidden: boolean;
  autoLayout: boolean;
  maxWidth?: number;
  mode: TooltipMode;
  backgroundColor?: string;
  borderRadius?: number;
  private _bordered: boolean;
  portal: HTMLElement | ShadowRoot;
  container?: HTMLElement;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private scrollListening = false;
  private positionRafId: number | null = null;
  private destroyFallbackTimerId: ReturnType<typeof setTimeout> | undefined;
  private static readonly DESTROY_FALLBACK_MS = 700;
  private readonly tooltipId = createDomId("vot-tooltip");
  private prevAriaDescribedBy: string | null = null;

  constructor(opts: TooltipOpts) {
    const target = opts.target;
    if (!(target instanceof HTMLElement)) {
      throw new TypeError("target must be a valid HTMLElement");
    }
    this.target = target;
    this.anchor = opts.anchor instanceof HTMLElement ? opts.anchor : target;
    this.content = opts.content ?? "";
    const offset = opts.offset ?? 4;
    if (typeof offset === "number") {
      this.offsetY = this.offsetX = offset;
    } else {
      this.offsetX = offset.x;
      this.offsetY = offset.y;
    }
    this._hidden = opts.hidden ?? false;
    this.autoLayout = opts.autoLayout ?? true;
    this.trigger = triggers.includes(opts.trigger as Trigger)
      ? (opts.trigger as Trigger)
      : "hover";
    this.position = positions.includes(opts.position as Position)
      ? (opts.position as Position)
      : "top";
    this.preferredPosition = this.position;
    this.portal = opts.parentElement ?? document.body;
    this.borderRadius = opts.borderRadius;
    this._bordered = opts.bordered ?? true;
    this.maxWidth = opts.maxWidth;
    this.mode = tooltipModes.includes(opts.mode as TooltipMode)
      ? (opts.mode as TooltipMode)
      : "default";
    this.backgroundColor = opts.backgroundColor;
    this.init();
  }

  static validatePos(position: Position): boolean {
    return positions.includes(position);
  }

  static validateTrigger(trigger: Trigger): boolean {
    return triggers.includes(trigger);
  }

  setPosition(position: Position): this {
    this.preferredPosition = Tooltip.validatePos(position) ? position : "top";
    this.position = this.preferredPosition;
    this.schedulePositionUpdate();
    return this;
  }

  setContent(content: string | HTMLElement): this {
    this.content = content;
    if (this.container) {
      this.container.replaceChildren();
      if (typeof content === "string") {
        this.container.textContent = content;
      } else {
        this.container.append(content);
      }
      this.schedulePositionUpdate();
    }
    return this;
  }

  /** Remove tooltip DOM immediately (no fade). Use when switching UI modes. */
  dismissImmediate(): this {
    return this.destroy(true);
  }

  /**
   * After enabling the tooltip while the pointer never left the target,
   * `pointerenter` does not fire again — call this to show immediately.
   */
  revealIfHovered(): this {
    if (this._hidden || this.trigger !== "hover") return this;
    try {
      if (!this.target.matches(":hover")) return this;
    } catch {
      return this;
    }
    this.create();
    return this;
  }

  /**
   * Update tooltip mount dependencies.
   * If the tooltip is currently rendered, it will be moved to the new parent.
   */
  updateMount({
    parentElement,
  }: {
    parentElement?: HTMLElement | ShadowRoot;
    layoutRoot?: HTMLElement;
  }): this {
    if (parentElement && this.portal !== parentElement) {
      this.portal = parentElement;
      if (this.container?.isConnected) {
        parentElement.appendChild(this.container);
        this.schedulePositionUpdate();
      }
    }
    return this;
  }

  private onResize = (): void => {
    this.schedulePositionUpdate();
  };

  private onScroll = (): void => {
    this.schedulePositionUpdate();
  };

  private onClick = (): void => {
    this.showed ? this.destroy() : this.create();
  };

  private onDocumentPointerDown = (event: PointerEvent): void => {
    if (!this.showed) return;
    if (
      isEventInside(event, this.target) ||
      (this.container && isEventInside(event, this.container)) ||
      (this.mode === "follow" && isEventInside(event, this.anchor))
    ) {
      return;
    }
    this.destroy();
  };

  private onTargetKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && this.showed) {
      this.destroy();
    }
  };

  private onPointerEnter = (_e: PointerEvent): void => {
    this.create();
  };

  private onPointerLeave = (e: PointerEvent): void => {
    if (!this.isInTooltipContext(e.relatedTarget)) {
      this.destroy();
    }
  };

  private onTooltipPointerLeave = (e: PointerEvent): void => {
    if (!this.isInTooltipContext(e.relatedTarget)) {
      this.destroy();
    }
  };

  private onTouchPointerDown = (e: PointerEvent): void => {
    if (e.pointerType === "touch") {
      this.create();
    }
  };

  private onTouchPointerUp = (e: PointerEvent): void => {
    if (e.pointerType === "touch") {
      this.destroy();
    }
  };

  private isInTooltipContext(nextTarget: EventTarget | null): boolean {
    if (!(nextTarget instanceof Node)) return false;
    return (
      this.target.contains(nextTarget) || this.container?.contains(nextTarget)
    );
  }

  private init(): void {
    this.resizeObserver = new ResizeObserver(this.onResize);
    this.intersectionObserver = new IntersectionObserver(
      this.onIntersect.bind(this),
    );
    this.target.addEventListener("keydown", this.onTargetKeyDown);

    if (this.trigger === "click") {
      this.target.addEventListener("pointerdown", this.onClick);
      return;
    }

    this.target.addEventListener("pointerenter", this.onPointerEnter);
    this.target.addEventListener("pointerleave", this.onPointerLeave);
    this.target.addEventListener("pointerdown", this.onTouchPointerDown);
    this.target.addEventListener("pointerup", this.onTouchPointerUp);
  }

  private onIntersect(entries: IntersectionObserverEntry[]): void {
    const entry = entries[0];
    if (!entry?.isIntersecting) {
      this.destroy(true);
    }
  }

  release(): this {
    this.destroy(true);
    this.detachScrollListener();
    this.target.removeEventListener("keydown", this.onTargetKeyDown);

    if (this.trigger === "click") {
      this.target.removeEventListener("pointerdown", this.onClick);
    } else {
      this.target.removeEventListener("pointerenter", this.onPointerEnter);
      this.target.removeEventListener("pointerleave", this.onPointerLeave);
      this.target.removeEventListener("pointerdown", this.onTouchPointerDown);
      this.target.removeEventListener("pointerup", this.onTouchPointerUp);
    }

    return this;
  }

  private schedulePositionUpdate(): void {
    if (!this.container || this.positionRafId !== null) return;
    this.positionRafId = requestAnimationFrame(() => {
      this.positionRafId = null;
      this.updatePos();
    });
  }

  private cancelPositionUpdate(): void {
    if (this.positionRafId !== null) {
      cancelAnimationFrame(this.positionRafId);
      this.positionRafId = null;
    }
  }

  private clearDestroyFallbackTimer(): void {
    if (this.destroyFallbackTimerId !== undefined) {
      globalThis.clearTimeout(this.destroyFallbackTimerId);
      this.destroyFallbackTimerId = undefined;
    }
  }

  create(): this {
    this.destroy(true);
    this.showed = true;
    this.container = UI.createEl("vot-block", ["vot-tooltip"], this.content);
    if (this._bordered) {
      this.container.classList.add("vot-tooltip-bordered");
    }
    this.container.setAttribute("role", "tooltip");
    this.container.id = this.tooltipId;
    this.container.dataset.trigger = this.trigger;
    this.container.dataset.mode = this.mode;
    this.container.dataset.position = this.position;
    this.container.style.position = this.usesPortalCoordinates()
      ? "absolute"
      : "fixed";
    this.container.style.top = "0";
    this.container.style.left = "0";
    this.container.style.margin = "0";
    this.portal.appendChild(this.container);
    if (this.backgroundColor) {
      this.container.style.backgroundColor = this.backgroundColor;
    }
    if (this.borderRadius !== undefined) {
      this.container.style.borderRadius = `${this.borderRadius}px`;
    }
    if (this._hidden) {
      this.container.hidden = true;
    } else {
      this.syncAriaDescribedBy(true);
    }
    this.container.style.opacity = "1";
    if (this.trigger === "hover") {
      this.container.addEventListener(
        "pointerleave",
        this.onTooltipPointerLeave,
      );
    } else {
      document.addEventListener("pointerdown", this.onDocumentPointerDown, {
        capture: true,
        passive: true,
      });
    }
    this.attachScrollListener();
    this.resizeObserver?.observe(this.anchor);
    this.intersectionObserver?.observe(this.target);
    this.updatePos();
    return this;
  }

  updatePos(): this {
    if (!this.container) return this;
    const viewportWidth = window.innerWidth;
    const availableWidth = Math.max(0, viewportWidth - this.offsetX * 2);
    const maxWidth = clamp(this.maxWidth ?? availableWidth, 0, availableWidth);
    this.container.style.maxWidth = `${maxWidth}px`;
    const { top, left } = this.computePosition(
      this.autoLayout,
      this.preferredPosition,
    );
    const offset = this.getPortalViewportOffset();
    this.container.style.transform = `translate(${left - offset.left}px, ${
      top - offset.top
    }px)`;
    this.container.dataset.position = this.position;
    return this;
  }

  private usesPortalCoordinates(): boolean {
    if (this.portal instanceof ShadowRoot) return true;
    if (
      this.portal === document.body ||
      this.portal === document.documentElement
    ) {
      return false;
    }
    if (this.portal.classList.contains("vot-portal")) return false;
    return true;
  }

  private getPortalViewportOffset(): PagePosition {
    if (!this.usesPortalCoordinates()) {
      return { top: 0, left: 0 };
    }

    const element =
      this.portal instanceof ShadowRoot ? this.portal.host : this.portal;
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
    };
  }

  private computePosition(
    autoLayout: boolean,
    preferred: Position,
  ): PagePosition {
    const anchorRect = this.anchor.getBoundingClientRect();
    const tooltipRect = this.container?.getBoundingClientRect();
    const anchor = {
      left: anchorRect.left,
      right: anchorRect.right,
      top: anchorRect.top,
      bottom: anchorRect.bottom,
      width: anchorRect.width,
      height: anchorRect.height,
    };
    const tooltip = {
      width: tooltipRect.width || 100,
      height: tooltipRect.height || 40,
    };
    const viewport = this.getPositionBoundary();
    const position = autoLayout
      ? this.resolvePosition(anchor, tooltip, viewport, preferred)
      : preferred;
    const coords = this.getCoordinates(anchor, tooltip, position);
    this.position = position;
    return {
      top: clamp(coords.top, viewport.top, viewport.bottom - tooltip.height),
      left: clamp(coords.left, viewport.left, viewport.right - tooltip.width),
    };
  }

  private getPositionBoundary(): {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
  } {
    const fallback = {
      left: this.offsetX,
      right: window.innerWidth - this.offsetX,
      top: this.offsetX,
      bottom: window.innerHeight - this.offsetX,
      width: window.innerWidth,
      height: window.innerHeight,
    };

    if (this.mode !== "follow" || !this.usesPortalCoordinates()) {
      return fallback;
    }

    const element =
      this.portal instanceof ShadowRoot ? this.portal.host : this.portal;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return fallback;
    }

    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  }

  private resolvePosition(
    anchor: {
      left: number;
      right: number;
      top: number;
      bottom: number;
      width: number;
      height: number;
    },
    tooltip: { width: number; height: number },
    viewport: {
      left: number;
      right: number;
      top: number;
      bottom: number;
      width: number;
      height: number;
    },
    preferred: Position,
  ): Position {
    if (this.mode === "follow") {
      return this.resolveFollowPosition(anchor, tooltip, viewport, preferred);
    }

    switch (preferred) {
      case "top": {
        const spaceAbove = anchor.top - viewport.top;
        const fitsAbove = spaceAbove >= tooltip.height + this.offsetY;
        return fitsAbove ? "top" : "bottom";
      }
      case "bottom": {
        const spaceBelow = viewport.bottom - anchor.bottom;
        const fitsBelow = spaceBelow >= tooltip.height + this.offsetY;
        return fitsBelow ? "bottom" : "top";
      }
      case "left": {
        const spaceLeft = anchor.left - viewport.left;
        const fitsLeft = spaceLeft >= tooltip.width + this.offsetX;
        return fitsLeft ? "left" : "right";
      }
      case "right": {
        const spaceRight = viewport.right - anchor.right;
        const fitsRight = spaceRight >= tooltip.width + this.offsetX;
        return fitsRight ? "right" : "left";
      }
    }
  }

  private resolveFollowPosition(
    anchor: {
      left: number;
      right: number;
      top: number;
      bottom: number;
      width: number;
      height: number;
    },
    tooltip: { width: number; height: number },
    viewport: {
      left: number;
      right: number;
      top: number;
      bottom: number;
      width: number;
      height: number;
    },
    preferred: Position,
  ): Position {
    if (preferred === "top" || preferred === "bottom") {
      const topWouldClamp =
        anchor.top - tooltip.height - this.offsetY < viewport.top;
      const bottomWouldClamp =
        anchor.bottom + this.offsetY + tooltip.height > viewport.bottom;

      if (preferred === "top") {
        if (!topWouldClamp || bottomWouldClamp) return "top";
        return "bottom";
      }

      if (!bottomWouldClamp || topWouldClamp) return "bottom";
      return "top";
    }

    const leftWouldClamp =
      anchor.left - tooltip.width - this.offsetX < viewport.left;
    const rightWouldClamp =
      anchor.right + this.offsetX + tooltip.width > viewport.right;

    if (preferred === "left") {
      if (!leftWouldClamp || rightWouldClamp) return "left";
      return "right";
    }

    if (!rightWouldClamp || leftWouldClamp) return "right";
    return "left";
  }

  private getCoordinates(
    anchor: {
      left: number;
      right: number;
      top: number;
      bottom: number;
      width: number;
      height: number;
    },
    tooltip: { width: number; height: number },
    position: Position,
  ): PagePosition {
    const centerX = anchor.left + anchor.width / 2;
    const centerY = anchor.top + anchor.height / 2;
    switch (position) {
      case "top":
        return {
          top: anchor.top - tooltip.height - this.offsetY,
          left: centerX - tooltip.width / 2,
        };
      case "bottom":
        return {
          top: anchor.bottom + this.offsetY,
          left: centerX - tooltip.width / 2,
        };
      case "left":
        return {
          top: centerY - tooltip.height / 2,
          left: anchor.left - tooltip.width - this.offsetX,
        };
      case "right":
        return {
          top: centerY - tooltip.height / 2,
          left: anchor.right + this.offsetX,
        };
    }
  }

  private destroy(instant = false): this {
    if (!this.container) return this;
    const container = this.container;
    this.cancelPositionUpdate();
    this.clearDestroyFallbackTimer();
    this.showed = false;
    this.syncAriaDescribedBy(false);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.detachScrollListener();
    this.detachOutsidePointerListener();
    if (instant) {
      container.remove();
      this.container = undefined;
      return this;
    }
    container.removeEventListener("pointerleave", this.onTooltipPointerLeave);
    container.style.pointerEvents = "none";
    container.style.opacity = "0";
    const handleTransitionDone = (): void => {
      this.clearDestroyFallbackTimer();
      container?.remove();
      if (this.container === container) {
        this.container = undefined;
      }
    };
    container.addEventListener("transitionend", handleTransitionDone, {
      once: true,
    });
    container.addEventListener("transitioncancel", handleTransitionDone, {
      once: true,
    });
    this.destroyFallbackTimerId = globalThis.setTimeout(
      handleTransitionDone,
      Tooltip.DESTROY_FALLBACK_MS,
    );
    return this;
  }

  private detachOutsidePointerListener(): void {
    document.removeEventListener("pointerdown", this.onDocumentPointerDown, {
      capture: true,
    });
  }

  private syncAriaDescribedBy(isShowing: boolean): void {
    const existing = this.target.getAttribute("aria-describedby");
    this.prevAriaDescribedBy ??= existing;
    if (!isShowing) {
      if (this.prevAriaDescribedBy === null) {
        this.target.removeAttribute("aria-describedby");
      } else {
        this.target.setAttribute("aria-describedby", this.prevAriaDescribedBy);
      }
      this.prevAriaDescribedBy = null;
      return;
    }
    const tokens = new Set((existing ?? "").split(/\s+/).filter(Boolean));
    tokens.add(this.tooltipId);
    this.target.setAttribute("aria-describedby", Array.from(tokens).join(" "));
  }

  set bordered(value: boolean) {
    this._bordered = value;
    this.container?.classList.toggle("vot-tooltip-bordered", value);
  }

  get bordered(): boolean {
    return this._bordered;
  }

  set hidden(value: boolean) {
    this._hidden = value;
    if (this.container) {
      this.container.hidden = value;
    }

    // Keep aria-describedby in sync: if tooltip is effectively disabled,
    // do not leave a describedby reference hanging.
    if (this.showed) {
      this.syncAriaDescribedBy(!value);
    }
  }

  get hidden(): boolean {
    return this._hidden;
  }

  private attachScrollListener(): void {
    if (this.scrollListening) return;
    this.scrollListening = true;
    document.addEventListener("scroll", this.onScroll, {
      passive: true,
      capture: true,
    });
  }

  private detachScrollListener(): void {
    if (!this.scrollListening) return;
    this.scrollListening = false;
    document.removeEventListener("scroll", this.onScroll, {
      capture: true,
    });
  }
}
