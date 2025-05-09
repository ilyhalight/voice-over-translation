import {
  type TooltipOpts,
  type Position,
  positions,
  type Trigger,
  triggers,
  type PagePosition,
} from "../../types/components/tooltip";
import UI from "../../ui";
import { clamp } from "../../utils/utils";

export default class Tooltip {
  showed = false;

  target: HTMLElement;
  anchor: HTMLElement;
  content: string | HTMLElement;
  position: Position;
  trigger: Trigger;
  parentElement: HTMLElement;
  layoutRoot: HTMLElement;
  offsetX: number;
  offsetY: number;
  hidden: boolean;
  autoLayout: boolean;

  pageWidth!: number;
  pageHeight!: number;
  globalOffsetX!: number;
  globalOffsetY!: number;
  maxWidth?: number;
  backgroundColor?: string;
  borderRadius?: number;
  _bordered: boolean;

  container?: HTMLElement;
  onResizeObserver?: ResizeObserver;
  intersectionObserver?: IntersectionObserver;

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
      throw new Error("target must be a valid HTMLElement");
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
    this.hidden = hidden;
    this.autoLayout = autoLayout;
    this.trigger = Tooltip.validateTrigger(trigger) ? trigger : "hover";
    this.position = Tooltip.validatePos(position) ? position : "top";
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
    this.position = Tooltip.validatePos(position) ? position : "top";
    this.updatePos();
    return this;
  }

  setContent(content: string | HTMLElement) {
    this.content = content;
    this.destroy();
    return this;
  }

  onResize = () => {
    this.updatePageSize();
    this.updatePos();
  };

  onClick = () => {
    this.showed ? this.destroy() : this.create();
  };

  onScroll = () => {
    requestAnimationFrame(() => {
      this.updatePageSize();
      this.updatePos();
    });
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

  onMouseLeave = () => {
    this.destroy();
  };

  updatePageSize() {
    if (this.layoutRoot !== document.documentElement) {
      const { left, top } = this.parentElement.getBoundingClientRect();
      this.globalOffsetX = left;
      this.globalOffsetY = top;
    } else {
      this.globalOffsetX = 0;
      this.globalOffsetY = 0;
    }

    this.pageWidth =
      (this.layoutRoot.clientWidth || document.documentElement.clientWidth) +
      window.pageXOffset;
    this.pageHeight =
      (this.layoutRoot.clientHeight || document.documentElement.clientHeight) +
      window.pageYOffset;
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
    document.addEventListener("scroll", this.onScroll, {
      passive: true,
      capture: true,
    });
    if (this.trigger === "click") {
      this.target.addEventListener("pointerdown", this.onClick);
      return this;
    }

    this.target.addEventListener("mouseenter", this.onMouseEnter);
    this.target.addEventListener("mouseleave", this.onMouseLeave);
    this.target.addEventListener("pointerdown", this.onHoverPointerDown);
    this.target.addEventListener("pointerup", this.onHoverPointerUp);

    return this;
  }

  release() {
    this.destroy();
    document.removeEventListener("scroll", this.onScroll, {
      capture: true,
    });
    if (this.trigger === "click") {
      this.target.removeEventListener("pointerdown", this.onClick);
      return this;
    }

    this.target.removeEventListener("mouseenter", this.onMouseEnter);
    this.target.removeEventListener("mouseleave", this.onMouseLeave);
    this.target.removeEventListener("pointerdown", this.onHoverPointerDown);
    this.target.removeEventListener("pointerup", this.onHoverPointerUp);
    return this;
  }

  private create() {
    this.destroy(true);
    this.showed = true;
    this.container = UI.createEl("vot-block", ["vot-tooltip"], this.content);
    if (this.bordered) {
      this.container.classList.add("vot-tooltip-bordered");
    }

    this.container.setAttribute("role", "tooltip");
    this.container.dataset.trigger = this.trigger;
    this.container.dataset.position = this.position;
    this.parentElement.appendChild(this.container);

    this.updatePos();
    if (this.backgroundColor !== undefined) {
      this.container.style.backgroundColor = this.backgroundColor;
    }

    if (this.borderRadius !== undefined) {
      this.container.style.borderRadius = `${this.borderRadius}px`;
    }

    if (this.hidden) {
      this.container.hidden = true;
    }

    this.container.style.opacity = "1";
    this.onResizeObserver?.observe(this.layoutRoot);
    this.intersectionObserver?.observe(this.target);
    return this;
  }

  updatePos() {
    if (!this.container) {
      return this;
    }

    const { top, left } = this.calcPos(this.autoLayout);
    const availableWidth = this.pageWidth - this.offsetX * 2;
    const maxWidth =
      this.maxWidth ??
      Math.min(
        availableWidth,
        this.pageWidth - Math.min(left, this.pageWidth - availableWidth),
      );

    this.container.style.transform = `translate(${left}px, ${top}px)`;
    this.container.style.maxWidth = `${maxWidth}px`;
    return this;
  }

  calcPos(autoLayout = true): PagePosition {
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

    switch (this.position) {
      case "top": {
        const pTop = clamp(top - height - this.offsetY, 0, this.pageHeight);
        if (autoLayout && pTop + this.offsetY < height) {
          this.position = "bottom";
          return this.calcPos(false);
        }

        return {
          top: pTop,
          left: clamp(
            left - width / 2 + anchorWidth / 2,
            this.offsetX,
            this.pageWidth - width - this.offsetX,
          ),
        };
      }
      case "right": {
        const pLeft = clamp(right + this.offsetX, 0, this.pageWidth - width);
        if (autoLayout && pLeft + width > this.pageWidth - this.offsetX) {
          this.position = "left";
          return this.calcPos(false);
        }

        return {
          top: clamp(
            top + (anchorHeight - height) / 2,
            this.offsetY,
            this.pageHeight - height - this.offsetY,
          ),
          left: pLeft,
        };
      }
      case "bottom": {
        const pTop = clamp(bottom + this.offsetY, 0, this.pageHeight - height);
        if (autoLayout && pTop + height > this.pageHeight - this.offsetY) {
          this.position = "top";
          return this.calcPos(false);
        }

        return {
          top: pTop,
          left: clamp(
            left - width / 2 + anchorWidth / 2,
            this.offsetX,
            this.pageWidth - width - this.offsetX,
          ),
        };
      }
      case "left": {
        const pLeft = Math.max(0, left - width - this.offsetX);
        if (autoLayout && pLeft + width > left - this.offsetX) {
          this.position = "right";
          return this.calcPos(false);
        }

        return {
          top: clamp(
            top + (anchorHeight - height) / 2,
            this.offsetY,
            this.pageHeight - height - this.offsetY,
          ),
          left: pLeft,
        };
      }
      default:
        return { top: 0, left: 0 };
    }
  }

  private destroy(instant = false) {
    if (!this.container) {
      return this;
    }

    this.showed = false;
    this.onResizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    if (instant) {
      this.container.remove();
      return this;
    }

    const container = this.container;
    container.style.opacity = "0";
    container.addEventListener(
      "transitionend",
      () => {
        container?.remove();
      },
      {
        once: true,
      },
    );

    return this;
  }

  set bordered(isBordered: boolean) {
    this._bordered = isBordered;
    this.container?.classList.toggle("vot-tooltip-bordered");
  }

  get bordered() {
    return this._bordered;
  }
}
