import {
  type PagePosition,
  type Position,
  positions,
  type TooltipOpts,
  type Trigger,
  triggers,
} from "../../types/components/tooltip";
import UI from "../../ui";
import { clamp } from "../../utils/utils";
import { createDomId, isEventInside } from "./componentShared";

export default class Tooltip {
  /** Whether tooltip element is currently mounted. */
  showed = false;

  target: HTMLElement;
  anchor: HTMLElement;
  content: string | HTMLElement;
  position: Position;
  preferredPosition: Position;
  trigger: Trigger;
  parentElement: HTMLElement | ShadowRoot;
  layoutRoot: HTMLElement;
  offsetX: number;
  offsetY: number;
  private _hidden: boolean;
  autoLayout: boolean;

  pageWidth!: number;
  pageHeight!: number;
  globalOffsetX!: number;
  globalOffsetY!: number;
  renderOffsetX!: number;
  renderOffsetY!: number;
  maxWidth?: number;
  backgroundColor?: string;
  borderRadius?: number;
  private _bordered: boolean;

  container?: HTMLElement;
  onResizeObserver?: ResizeObserver;
  intersectionObserver?: IntersectionObserver;

  private scrollListening = false;
  private positionRafId: number | null = null;
  private destroyFallbackTimerId: ReturnType<typeof setTimeout> | undefined;
  private static readonly DESTROY_FALLBACK_MS = 700;

  // Accessibility: link trigger -> tooltip via aria-describedby.
  private readonly tooltipId = createDomId("vot-tooltip");
  private prevAriaDescribedBy: string | null = null;

  constructor({
    target,
    anchor = undefined,
    content = "",
    position = "top",
    trigger = "hover",
    offset = 4,
    maxWidth = undefined,
    hidden = false,
    autoLayout = true,
    backgroundColor = undefined,
    borderRadius = undefined,
    bordered = true,
    parentElement = document.body,
    layoutRoot = document.documentElement,
  }: TooltipOpts) {
    if (!(target instanceof HTMLElement)) {
      throw new TypeError("target must be a valid HTMLElement");
    }

    this.target = target;
    this.anchor = anchor instanceof HTMLElement ? anchor : target;
    this.content = content;
    if (typeof offset === "number") {
      this.offsetY = this.offsetX = offset;
    } else {
      this.offsetX = offset.x;
      this.offsetY = offset.y;
    }
    this._hidden = hidden;
    this.autoLayout = autoLayout;
    this.trigger = Tooltip.validateTrigger(trigger) ? trigger : "hover";
    this.position = Tooltip.validatePos(position) ? position : "top";
    this.preferredPosition = this.position;
    this.parentElement = parentElement;
    this.layoutRoot = layoutRoot;
    this.borderRadius = borderRadius;
    this._bordered = bordered;
    this.maxWidth = maxWidth;
    this.backgroundColor = backgroundColor;
    this.updatePageSize();
    this.init();
  }

  static validatePos(position: Position) {
    return positions.includes(position);
  }

  static validateTrigger(trigger: Trigger) {
    return triggers.includes(trigger);
  }

  setPosition(position: Position) {
    this.preferredPosition = Tooltip.validatePos(position) ? position : "top";
    this.position = this.preferredPosition;
    this.schedulePositionUpdate();
    return this;
  }

  setContent(content: string | HTMLElement) {
    this.content = content;
    // If mounted, update in place to avoid flicker (important for dynamic status updates).
    if (this.container) {
      this.container.replaceChildren();
      if (typeof content === "string") {
        this.container.textContent = content;
      } else {
        this.container.append(content);
      }
      this.schedulePositionUpdate();
      return this;
    }

    return this;
  }

  /**
   * Update tooltip mount dependencies.
   * If the tooltip is currently rendered, it will be moved to the new parent.
   */
  updateMount({
    parentElement,
    layoutRoot,
  }: {
    parentElement?: HTMLElement | ShadowRoot;
    layoutRoot?: HTMLElement;
  }) {
    if (parentElement && this.parentElement !== parentElement) {
      this.parentElement = parentElement;
      if (this.container?.isConnected) {
        parentElement.appendChild(this.container);
      }
    }

    if (layoutRoot && this.layoutRoot !== layoutRoot) {
      this.layoutRoot = layoutRoot;
    }

    // Recompute positions with updated roots.
    this.schedulePositionUpdate();
    return this;
  }

  onResize = () => {
    this.schedulePositionUpdate();
  };

  onClick = () => {
    this.showed ? this.destroy() : this.create();
  };

  onDocumentPointerDown = (event: PointerEvent) => {
    if (!this.showed) {
      return;
    }

    if (
      isEventInside(event, this.target) ||
      (this.container && isEventInside(event, this.container))
    ) {
      return;
    }

    this.destroy();
  };

  onTargetKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !this.showed) {
      return;
    }

    this.destroy();
  };

  onScroll = () => {
    this.schedulePositionUpdate();
  };

  onHoverPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse") {
      return;
    }

    this.create();
  };

  onHoverPointerUp = (e: PointerEvent) => {
    if (e.pointerType === "mouse") {
      return;
    }

    this.destroy();
  };

  onMouseEnter = () => {
    this.create();
  };

  onMouseLeave = (event: MouseEvent | FocusEvent) => {
    if (this.isInTooltipContext(event.relatedTarget)) {
      return;
    }

    this.destroy();
  };

  onTooltipMouseLeave = (event: MouseEvent) => {
    if (this.isInTooltipContext(event.relatedTarget)) {
      return;
    }

    this.destroy();
  };

  private isInTooltipContext(nextTarget: EventTarget | null): boolean {
    if (!(nextTarget instanceof Node)) {
      return false;
    }

    return (
      this.target.contains(nextTarget) || this.container?.contains(nextTarget)
    );
  }

  updatePageSize() {
    // Layout bounds may be computed against a player container while the
    // tooltip itself is mounted into a portal attached elsewhere in the DOM.
    // We therefore calculate in layout-root coordinates and later convert
    // back into the tooltip parent's coordinate space before rendering.
    if (this.layoutRoot === document.documentElement) {
      this.globalOffsetX = 0;
      this.globalOffsetY = 0;
    } else {
      const { left, top } = this.layoutRoot.getBoundingClientRect();
      this.globalOffsetX = left;
      this.globalOffsetY = top;
    }

    const parentEl =
      this.parentElement instanceof ShadowRoot
        ? this.parentElement.host
        : this.parentElement;
    const { left: parentLeft, top: parentTop } =
      parentEl.getBoundingClientRect();
    this.renderOffsetX = parentLeft;
    this.renderOffsetY = parentTop;

    this.pageWidth =
      this.layoutRoot.clientWidth || document.documentElement.clientWidth;
    this.pageHeight =
      this.layoutRoot.clientHeight || document.documentElement.clientHeight;

    return this;
  }

  onIntersect = ([entry]: IntersectionObserverEntry[]) => {
    if (!entry.isIntersecting) {
      return this.destroy(true);
    }
  };

  init() {
    this.onResizeObserver = new ResizeObserver(this.onResize);
    this.intersectionObserver = new IntersectionObserver(this.onIntersect);
    this.target.addEventListener("keydown", this.onTargetKeyDown);

    if (this.trigger === "click") {
      this.target.addEventListener("pointerdown", this.onClick);
      return this;
    }

    this.target.addEventListener("mouseenter", this.onMouseEnter);
    this.target.addEventListener("mouseleave", this.onMouseLeave);
    // Keyboard access: show on focus, hide on blur.
    this.target.addEventListener("focusin", this.onMouseEnter);
    this.target.addEventListener("focusout", this.onMouseLeave);
    this.target.addEventListener("pointerdown", this.onHoverPointerDown);
    this.target.addEventListener("pointerup", this.onHoverPointerUp);

    return this;
  }

  release() {
    this.destroy(true);

    // In case tooltip was mounted while releasing.
    this.detachScrollListener();
    this.target.removeEventListener("keydown", this.onTargetKeyDown);
    if (this.trigger === "click") {
      this.target.removeEventListener("pointerdown", this.onClick);
      return this;
    }

    this.target.removeEventListener("mouseenter", this.onMouseEnter);
    this.target.removeEventListener("mouseleave", this.onMouseLeave);
    this.target.removeEventListener("focusin", this.onMouseEnter);
    this.target.removeEventListener("focusout", this.onMouseLeave);
    this.target.removeEventListener("pointerdown", this.onHoverPointerDown);
    this.target.removeEventListener("pointerup", this.onHoverPointerUp);
    return this;
  }

  private schedulePositionUpdate() {
    if (!this.container) {
      return;
    }

    if (this.positionRafId !== null) {
      return;
    }

    this.positionRafId = requestAnimationFrame(() => {
      this.positionRafId = null;
      this.updatePageSize();
      this.updatePos();
    });
  }

  private cancelPositionUpdate() {
    if (this.positionRafId === null) {
      return;
    }

    cancelAnimationFrame(this.positionRafId);
    this.positionRafId = null;
  }

  private clearDestroyFallbackTimer() {
    if (this.destroyFallbackTimerId === undefined) {
      return;
    }

    globalThis.clearTimeout(this.destroyFallbackTimerId);
    this.destroyFallbackTimerId = undefined;
  }

  private create() {
    this.destroy(true);
    this.showed = true;
    this.container = UI.createEl("vot-block", ["vot-tooltip"], this.content);
    if (this.bordered) {
      this.container.classList.add("vot-tooltip-bordered");
    }

    this.container.setAttribute("role", "tooltip");
    this.container.id = this.tooltipId;
    this.container.dataset.trigger = this.trigger;
    this.container.dataset.position = this.position;
    this.parentElement.appendChild(this.container);

    this.schedulePositionUpdate();
    if (this.backgroundColor !== undefined) {
      this.container.style.backgroundColor = this.backgroundColor;
    }

    if (this.borderRadius !== undefined) {
      this.container.style.borderRadius = `${this.borderRadius}px`;
    }

    if (this.hidden) {
      this.container.hidden = true;
    } else {
      this.syncAriaDescribedBy(true);
    }

    this.container.style.opacity = "1";
    if (this.trigger === "hover") {
      this.container.addEventListener("mouseleave", this.onTooltipMouseLeave);
    } else {
      document.addEventListener("pointerdown", this.onDocumentPointerDown, {
        capture: true,
        passive: true,
      });
    }
    this.attachScrollListener();
    this.onResizeObserver?.observe(this.layoutRoot);
    if (this.anchor !== this.layoutRoot) {
      this.onResizeObserver?.observe(this.anchor);
    }
    this.intersectionObserver?.observe(this.target);
    return this;
  }

  updatePos() {
    if (!this.container) {
      return this;
    }

    const { top, left } = this.calcPos(this.autoLayout, this.preferredPosition);
    const availableWidth = Math.max(0, this.pageWidth - this.offsetX * 2);
    const maxWidth = clamp(this.maxWidth ?? availableWidth, 0, availableWidth);

    this.container.style.transform = `translate(${left}px, ${top}px)`;
    this.container.dataset.position = this.position;
    this.container.style.maxWidth = `${maxWidth}px`;

    return this;
  }

  calcPos(
    autoLayout = true,
    position: Position = this.preferredPosition,
  ): PagePosition {
    if (!this.container) {
      return { top: 0, left: 0 };
    }

    const {
      left: anchorLeft,
      right: anchorRight,
      top: anchorTop,
      bottom: anchorBottom,
      width: anchorWidth,
      height: anchorHeight,
    } = this.anchor.getBoundingClientRect();
    const { width: containerWidth, height: containerHeight } =
      this.container.getBoundingClientRect();

    const width = clamp(containerWidth, 0, this.pageWidth);
    const height = clamp(containerHeight, 0, this.pageHeight);
    const left = anchorLeft - this.globalOffsetX;
    const right = anchorRight - this.globalOffsetX;
    const top = anchorTop - this.globalOffsetY;
    const bottom = anchorBottom - this.globalOffsetY;

    const anchorBox = { left, right, top, bottom, anchorWidth, anchorHeight };
    const size = { width, height };
    const resolvedPosition = this.resolveTooltipPosition(
      anchorBox,
      size,
      position,
      autoLayout,
    );
    const coords = this.getTooltipCoordinates(
      anchorBox,
      size,
      resolvedPosition,
    );

    this.position = resolvedPosition;
    return {
      top: coords.top + this.globalOffsetY - this.renderOffsetY,
      left: coords.left + this.globalOffsetX - this.renderOffsetX,
    };
  }

  private resolveTooltipPosition(
    anchorBox: {
      left: number;
      right: number;
      top: number;
      bottom: number;
      anchorWidth: number;
      anchorHeight: number;
    },
    size: { width: number; height: number },
    position: Position,
    autoLayout: boolean,
  ): Position {
    if (!autoLayout) {
      return position;
    }

    switch (position) {
      case "top": {
        const pTop = clamp(
          anchorBox.top - size.height - this.offsetY,
          0,
          this.pageHeight,
        );
        return pTop + this.offsetY < size.height ? "bottom" : "top";
      }
      case "right": {
        const pLeft = clamp(
          anchorBox.right + this.offsetX,
          0,
          this.pageWidth - size.width,
        );
        return pLeft + size.width > this.pageWidth - this.offsetX
          ? "left"
          : "right";
      }
      case "bottom": {
        const pTop = clamp(
          anchorBox.bottom + this.offsetY,
          0,
          this.pageHeight - size.height,
        );
        return pTop + size.height > this.pageHeight - this.offsetY
          ? "top"
          : "bottom";
      }
      case "left": {
        const pLeft = Math.max(0, anchorBox.left - size.width - this.offsetX);
        return pLeft + size.width > anchorBox.left - this.offsetX
          ? "right"
          : "left";
      }
      default:
        return position;
    }
  }

  private getTooltipCoordinates(
    anchorBox: {
      left: number;
      right: number;
      top: number;
      bottom: number;
      anchorWidth: number;
      anchorHeight: number;
    },
    size: { width: number; height: number },
    position: Position,
  ): PagePosition {
    switch (position) {
      case "top":
        return {
          top: clamp(
            anchorBox.top - size.height - this.offsetY,
            0,
            this.pageHeight,
          ),
          left: clamp(
            anchorBox.left - size.width / 2 + anchorBox.anchorWidth / 2,
            this.offsetX,
            this.pageWidth - size.width - this.offsetX,
          ),
        };
      case "right":
        return {
          top: clamp(
            anchorBox.top + (anchorBox.anchorHeight - size.height) / 2,
            this.offsetY,
            this.pageHeight - size.height - this.offsetY,
          ),
          left: clamp(
            anchorBox.right + this.offsetX,
            0,
            this.pageWidth - size.width,
          ),
        };
      case "bottom":
        return {
          top: clamp(
            anchorBox.bottom + this.offsetY,
            0,
            this.pageHeight - size.height,
          ),
          left: clamp(
            anchorBox.left - size.width / 2 + anchorBox.anchorWidth / 2,
            this.offsetX,
            this.pageWidth - size.width - this.offsetX,
          ),
        };
      case "left":
        return {
          top: clamp(
            anchorBox.top + (anchorBox.anchorHeight - size.height) / 2,
            this.offsetY,
            this.pageHeight - size.height - this.offsetY,
          ),
          left: Math.max(0, anchorBox.left - size.width - this.offsetX),
        };
      default:
        return { top: 0, left: 0 };
    }
  }

  private destroy(instant = false) {
    if (!this.container) {
      return this;
    }

    const container = this.container;

    this.cancelPositionUpdate();
    this.clearDestroyFallbackTimer();

    this.showed = false;
    this.syncAriaDescribedBy(false);
    this.onResizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.detachScrollListener();
    this.detachOutsidePointerListener();
    if (instant) {
      container.remove();
      this.container = undefined;
      return this;
    }

    container.removeEventListener("mouseleave", this.onTooltipMouseLeave);
    container.style.pointerEvents = "none";
    container.style.opacity = "0";

    const handleTransitionDone = () => {
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

  private detachOutsidePointerListener() {
    document.removeEventListener("pointerdown", this.onDocumentPointerDown, {
      capture: true,
    });
  }

  private syncAriaDescribedBy(isShowing: boolean) {
    // Follow ARIA tooltip pattern: trigger references tooltip via aria-describedby.
    const existing = this.target.getAttribute("aria-describedby");
    this.prevAriaDescribedBy ??= existing;

    if (!isShowing) {
      if (this.prevAriaDescribedBy === null) {
        this.target.removeAttribute("aria-describedby");
      } else {
        this.target.setAttribute("aria-describedby", this.prevAriaDescribedBy);
      }
      // Allow subsequent show/hide cycles to preserve whatever is current.
      this.prevAriaDescribedBy = null;
      return;
    }

    const tokens = new Set((existing ?? "").split(/\s+/).filter(Boolean));
    tokens.add(this.tooltipId);
    this.target.setAttribute("aria-describedby", Array.from(tokens).join(" "));
  }

  set bordered(isBordered: boolean) {
    this._bordered = isBordered;
    this.container?.classList.toggle("vot-tooltip-bordered", isBordered);
  }

  get bordered() {
    return this._bordered;
  }

  set hidden(isHidden: boolean) {
    this._hidden = isHidden;
    if (this.container) {
      this.container.hidden = isHidden;
    }

    // Keep aria-describedby in sync: if tooltip is effectively disabled,
    // do not leave a describedby reference hanging.
    if (this.showed) {
      this.syncAriaDescribedBy(!isHidden);
    }
  }

  get hidden() {
    return this._hidden;
  }

  private attachScrollListener() {
    if (this.scrollListening) return;
    this.scrollListening = true;
    document.addEventListener("scroll", this.onScroll, {
      passive: true,
      capture: true,
    });
  }

  private detachScrollListener() {
    if (!this.scrollListening) return;
    this.scrollListening = false;
    document.removeEventListener("scroll", this.onScroll, {
      capture: true,
    });
  }
}
