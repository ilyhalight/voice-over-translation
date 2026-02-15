import debug from "../utils/debug";
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

/**
 * Centralizes overlay visibility behavior: showing, hiding and deadline checks.
 */
export class OverlayVisibilityController {
  private readonly deps: OverlayVisibilityDependencies;
  private hideDeadlineMs = 0;
  private hideArmed = false;
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
    this.unsubscribeChecker();
  }

  /**
   * Schedules overlay auto-hide after configured delay.
   */
  queueAutoHide() {
    if (!this.show()) {
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

    if (type.startsWith("pointer")) {
      this.cancel();
      this.show();
      this.deps.checker.markActivity("overlay-interaction");
      event.stopPropagation?.();
      return;
    }

    this.handleHostInteraction(event);
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

    if (type.startsWith("pointer")) {
      const target = (event as PointerEvent).target;
      if (this.deps.isInteractiveNode(target)) {
        event.stopPropagation?.();
      }
      this.deps.checker.markActivity("overlay-host-pointer");
    }

    this.queueAutoHide();
  }

  /**
   * Schedules hide if focus leaves overlay tree entirely.
   */
  scheduleHide(event?: Event) {
    if (!this.getView()) {
      return;
    }

    const currentTarget = event?.currentTarget;
    let relatedTarget: EventTarget | null =
      (event as unknown as { relatedTarget?: EventTarget | null })
        ?.relatedTarget ?? null;

    if (!relatedTarget && typeof event?.composedPath === "function") {
      // Some ambient typings (e.g. Bun/Node) can describe composedPath as a
      // tuple, which makes destructuring brittle. Treat it as an array.
      const path = event.composedPath() as unknown as EventTarget[];
      relatedTarget = path[1] ?? null;
    }

    const relatedNode = relatedTarget instanceof Node ? relatedTarget : null;
    const currentNode = currentTarget instanceof Node ? currentTarget : null;

    if (
      relatedNode &&
      (currentNode?.contains(relatedNode) ||
        this.deps.isInteractiveNode(relatedNode))
    ) {
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

    this.hideArmed = false;

    let active: Element | null = null;
    const canCheckFocus =
      typeof document !== "undefined" &&
      typeof document.hasFocus === "function";
    if (canCheckFocus && document.hasFocus()) {
      active = document.activeElement;
    }
    if (active && this.deps.isInteractiveNode(active)) {
      debug.log("[OverlayVisibility] skip hide (focus inside overlay)");
      return;
    }

    const view = this.getView();
    view?.updateButtonOpacity(0);
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
