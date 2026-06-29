import debug from "../utils/debug";
import { containsCrossShadow, getDeepActiveElement } from "../utils/dom";
import type { IntervalIdleChecker } from "../utils/intervalIdleChecker";
import type { OverlayView } from "./views/overlay";

export interface OverlayVisibilityDependencies {
  checker: IntervalIdleChecker;
  getOverlayView(): OverlayView | null | undefined;
  getAutoHideDelay(): number;
  isInteractiveNode(node: unknown): boolean;
  nowMs?: () => number;
}

type OverlayEvent = FocusEvent | PointerEvent | Event | undefined;

function isDomNode(value: unknown): value is Node {
  return typeof Node !== "undefined" && value instanceof Node;
}

function isPointerEventType(type: string): boolean {
  return type.startsWith("pointer");
}

function isHoverPointerEvent(event: OverlayEvent): boolean {
  return (event as PointerEvent | undefined)?.pointerType !== "touch";
}

/**
 * Centralizes overlay visibility behavior: showing, hiding and deadline checks.
 */
export class OverlayVisibilityController {
  private readonly deps: OverlayVisibilityDependencies;
  private hideDeadlineMs = 0;
  private hideArmed = false;
  private pointerInsideOverlay = false;
  private readonly unsubscribeChecker: () => void;

  constructor(deps: OverlayVisibilityDependencies) {
    this.deps = deps;
    this.unsubscribeChecker = this.deps.checker.subscribe(() => {
      this.onCheckerTick();
    });
  }

  /**
   * Ensures overlay is visible immediately and returns current view.
   */
  show(): OverlayView | null {
    const view = this.getView();
    if (!view) {
      return null;
    }
    view.updateButtonOpacity(1);
    return view;
  }

  /**
   * Cancels scheduled auto-hide.
   */
  cancel() {
    this.hideDeadlineMs = 0;
    this.hideArmed = false;
  }

  release() {
    this.cancel();
    this.pointerInsideOverlay = false;
    this.unsubscribeChecker();
  }

  /**
   * Schedules overlay auto-hide after configured delay.
   */
  queueAutoHide() {
    const view = this.show();
    if (!view) {
      return;
    }

    if (this.isOverlayHoverActive(view)) {
      this.cancel();
      return;
    }

    const delay = this.deps.getAutoHideDelay();
    this.hideDeadlineMs = this.nowMs() + Math.max(0, delay);
    this.hideArmed = true;

    this.deps.checker.markActivity("overlay-queue-hide");
    this.deps.checker.requestImmediateTick();
  }

  /**
   * Handles pointer/focus interactions originating from overlay elements.
   */
  handleOverlayInteraction(event: OverlayEvent) {
    const type = event?.type;
    if (!type) return;

    if (type === "focusin") {
      this.handleFocusIn();
      return;
    }

    if (isPointerEventType(type)) {
      this.pointerInsideOverlay = isHoverPointerEvent(event);
      this.cancel();
      this.show();
      event.stopPropagation?.();
    }
  }

  /**
   * Handles interactions from the broader host container (video, document etc.).
   */
  handleHostInteraction(event: OverlayEvent) {
    const type = event?.type;
    if (!type) return;

    if (type === "focusin") {
      this.handleFocusIn();
      return;
    }

    if (isPointerEventType(type)) {
      const target =
        event.composedPath?.()[0] ?? (event as PointerEvent).target;
      if (this.deps.isInteractiveNode(target)) {
        this.pointerInsideOverlay = isHoverPointerEvent(event);
        event.stopPropagation?.();
        this.cancel();
        this.show();
        return;
      }
      this.pointerInsideOverlay = false;
      this.deps.checker.markActivity("overlay-host-pointer");
    }

    this.queueAutoHide();
  }

  /**
   * Hides overlay immediately without delay.
   */
  hide(): void {
    this.hideArmed = false;
    this.hideDeadlineMs = 0;
    this.pointerInsideOverlay = false;
    const view = this.getView();
    view?.updateButtonOpacity(0);
  }

  /**
   * Schedules hide if focus/pointer leaves overlay tree entirely.
   */
  scheduleHide(event?: OverlayEvent) {
    if (!this.getView()) {
      return;
    }

    const type = event?.type;
    if (type === "pointerleave") {
      if (this.isLeaveInsideOverlay(event)) {
        return;
      }
      this.pointerInsideOverlay = false;
    }

    if (type === "focusout" && this.isFocusMovingInsideOverlay(event)) {
      return;
    }

    this.queueAutoHide();
  }

  private onCheckerTick() {
    if (!this.hideArmed || this.hideDeadlineMs <= 0) return;

    const now = this.nowMs();
    if (now + 2 < this.hideDeadlineMs) {
      return;
    }

    const view = this.getView();
    if (!view) {
      this.hideArmed = false;
      return;
    }

    if (this.isOverlayHoverActive(view)) {
      debug.log("[OverlayVisibility] skip hide (pointer inside overlay)");
      this.cancel();
      view.updateButtonOpacity(1);
      return;
    }

    this.hideArmed = false;

    let active: Element | null = null;
    const canCheckFocus =
      typeof document !== "undefined" &&
      typeof document.hasFocus === "function";
    if (canCheckFocus && document.hasFocus()) {
      active = getDeepActiveElement(document);
    }
    if (active && this.deps.isInteractiveNode(active)) {
      const keyboardNav =
        document.documentElement.classList.contains("vot-keyboard-nav");

      if (keyboardNav) {
        debug.log(
          "[OverlayVisibility] skip hide (keyboard focus inside overlay)",
        );
        return;
      }

      // Pointer/touch activation leaves focus on custom toolbar buttons in some
      // browsers. Do not let that focus permanently disarm auto-hide after the
      // pointer has already left the overlay.
      if (active instanceof HTMLElement) {
        active.blur();
      }
    }

    view.updateButtonOpacity(0);
  }

  private handleFocusIn() {
    this.cancel();
    this.show();
    this.deps.checker.markActivity("overlay-focus-in");
  }

  private getView(): OverlayView | null {
    const view = this.deps.getOverlayView();
    return view?.isInitialized() ? view : null;
  }

  private isOverlayHoverActive(view: OverlayView | null = this.getView()) {
    return Boolean(
      view &&
        (this.pointerInsideOverlay || view.shouldKeepVisibleForInteraction()),
    );
  }

  private getRelatedNode(event: OverlayEvent): Node | null {
    const relatedTarget =
      (event as unknown as { relatedTarget?: EventTarget | null })
        ?.relatedTarget ?? null;
    return isDomNode(relatedTarget) ? relatedTarget : null;
  }

  private isLeaveInsideOverlay(event: OverlayEvent): boolean {
    const relatedNode = this.getRelatedNode(event);
    if (!relatedNode) {
      return false;
    }

    if (this.deps.isInteractiveNode(relatedNode)) {
      return true;
    }

    const currentTarget = event?.currentTarget;
    const currentNode = isDomNode(currentTarget) ? currentTarget : null;
    return Boolean(
      currentNode && containsCrossShadow(currentNode, relatedNode),
    );
  }

  private isFocusMovingInsideOverlay(event: OverlayEvent): boolean {
    const relatedNode = this.getRelatedNode(event);
    return Boolean(relatedNode && this.deps.isInteractiveNode(relatedNode));
  }

  private nowMs(): number {
    if (this.deps.nowMs) {
      return this.deps.nowMs();
    }
    return typeof performance !== "undefined" &&
      typeof performance.now === "function"
      ? performance.now()
      : Date.now();
  }
}
