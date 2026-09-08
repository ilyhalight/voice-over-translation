import {
  createEffect,
  createSignal,
  createUniqueId,
  type JSX,
  mergeProps,
  onCleanup,
  Show,
  untrack,
} from "solid-js";

import "./Tooltip.scss";

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
import { render } from "../../ui/solid/renderer";
import { clamp } from "../../utils/utils";
import { createFloatingPosition } from "./createFloatingPosition";

type AnchorBox = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
};

type TooltipSize = {
  width: number;
  height: number;
};

type PositionBoundary = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type TooltipControls = {
  show: () => void;
  update: () => void;
  isOpen: () => boolean;
};

export type TooltipProps = TooltipOpts & {
  content?: JSX.Element;
  ref?: (element: HTMLElement) => void;
  controls?: (controls: TooltipControls) => void;
};

const DEFAULT_TOOLTIP_POS: Position = "top";
const DEFAULT_TOOLTIP_TRIGGER: Trigger = "hover";
const DEFAULT_TOOLTIP_MODE: TooltipMode = "default";
const DESTROY_FALLBACK_MS = 700;

function normalizePosition(position: Position | undefined): Position {
  return position && positions.includes(position)
    ? position
    : DEFAULT_TOOLTIP_POS;
}

function normalizeTrigger(trigger: Trigger | undefined): Trigger {
  return trigger && triggers.includes(trigger)
    ? trigger
    : DEFAULT_TOOLTIP_TRIGGER;
}

function normalizeMode(mode: TooltipMode | undefined): TooltipMode {
  return mode && tooltipModes.includes(mode) ? mode : DEFAULT_TOOLTIP_MODE;
}

function isEventInside(event: Event, element: Node): boolean {
  return event.composedPath().includes(element);
}

export function Tooltip(props: TooltipProps): JSX.Element {
  const finalProps = mergeProps(
    {
      position: DEFAULT_TOOLTIP_POS,
      trigger: DEFAULT_TOOLTIP_TRIGGER,
      mode: DEFAULT_TOOLTIP_MODE,
      offset: 4,
      hidden: false,
      autoLayout: true,
      bordered: true,
      content: "",
    },
    props,
  );

  const tooltipId = `vot-tooltip-${createUniqueId()}`;
  const [container, setContainer] = createSignal<HTMLElement>();
  const [isMounted, setIsMounted] = createSignal(false);
  const [isVisible, setIsVisible] = createSignal(false);
  const [isPositioned, setIsPositioned] = createSignal(false);
  const [resolvedPosition, setResolvedPosition] = createSignal(
    normalizePosition(finalProps.position),
  );
  const portalHost = document.createElement("vot-block");
  portalHost.style.display = "contents";

  let showFrame: number | undefined;
  let destroyTimer: ReturnType<typeof setTimeout> | undefined;
  let describedTarget: HTMLElement | undefined;
  let previousAriaDescribedBy: string | null = null;

  const target = () => {
    if (!(finalProps.target instanceof HTMLElement)) {
      throw new TypeError("target must be a valid HTMLElement");
    }
    return finalProps.target;
  };
  const anchor = () =>
    finalProps.anchor instanceof HTMLElement ? finalProps.anchor : target();
  const edgeAnchor = () =>
    finalProps.edgeAnchor instanceof HTMLElement
      ? finalProps.edgeAnchor
      : anchor();
  const portal = () => finalProps.parentElement ?? document.body;
  const trigger = () => normalizeTrigger(finalProps.trigger);
  const mode = () => normalizeMode(finalProps.mode);
  const offset = () => {
    const value = finalProps.offset;
    return typeof value === "number"
      ? { x: value, y: value }
      : { x: value.x, y: value.y };
  };

  function usesPortalCoordinates(): boolean {
    const mount = portal();
    if (mount instanceof ShadowRoot) {
      return true;
    }
    if (mount === document.body || mount === document.documentElement) {
      return false;
    }
    if (mount.classList.contains("vot-portal")) {
      return false;
    }
    return true;
  }

  function getPortalViewportOffset(): PagePosition {
    if (!usesPortalCoordinates()) {
      return { top: 0, left: 0 };
    }

    const mount = portal();
    const element = mount instanceof ShadowRoot ? mount.host : mount;
    const rect = element.getBoundingClientRect();
    return { top: rect.top, left: rect.left };
  }

  function getAnchorBox(): AnchorBox {
    const anchorRect = anchor().getBoundingClientRect();
    const edgeRect = edgeAnchor().getBoundingClientRect();
    return {
      left: edgeRect.left,
      right: edgeRect.right,
      top: edgeRect.top,
      bottom: edgeRect.bottom,
      centerX: anchorRect.left + anchorRect.width / 2,
      centerY: anchorRect.top + anchorRect.height / 2,
    };
  }

  function getPositionBoundary(): PositionBoundary {
    const { x, y } = offset();
    const fallback = {
      left: x,
      right: window.innerWidth - x,
      top: y,
      bottom: window.innerHeight - y,
    };

    if (mode() !== "follow" || !usesPortalCoordinates()) {
      return fallback;
    }

    const mount = portal();
    const element = mount instanceof ShadowRoot ? mount.host : mount;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return fallback;
    }

    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
    };
  }

  function resolveFollowPosition(
    anchorBox: AnchorBox,
    tooltip: TooltipSize,
    boundary: PositionBoundary,
    preferred: Position,
  ): Position {
    const { x, y } = offset();
    if (preferred === "top" || preferred === "bottom") {
      const topWouldClamp = anchorBox.top - tooltip.height - y < boundary.top;
      const bottomWouldClamp =
        anchorBox.bottom + y + tooltip.height > boundary.bottom;

      if (preferred === "top") {
        return !topWouldClamp || bottomWouldClamp ? "top" : "bottom";
      }
      return !bottomWouldClamp || topWouldClamp ? "bottom" : "top";
    }

    const leftWouldClamp = anchorBox.left - tooltip.width - x < boundary.left;
    const rightWouldClamp =
      anchorBox.right + x + tooltip.width > boundary.right;
    if (preferred === "left") {
      return !leftWouldClamp || rightWouldClamp ? "left" : "right";
    }
    return !rightWouldClamp || leftWouldClamp ? "right" : "left";
  }

  function resolvePosition(
    anchorBox: AnchorBox,
    tooltip: TooltipSize,
    boundary: PositionBoundary,
    preferred: Position,
  ): Position {
    if (mode() === "follow") {
      return resolveFollowPosition(anchorBox, tooltip, boundary, preferred);
    }

    const { x, y } = offset();
    switch (preferred) {
      case "top":
        return anchorBox.top - boundary.top >= tooltip.height + y
          ? "top"
          : "bottom";
      case "bottom":
        return boundary.bottom - anchorBox.bottom >= tooltip.height + y
          ? "bottom"
          : "top";
      case "left":
        return anchorBox.left - boundary.left >= tooltip.width + x
          ? "left"
          : "right";
      case "right":
        return boundary.right - anchorBox.right >= tooltip.width + x
          ? "right"
          : "left";
    }
  }

  function getCoordinates(
    anchorBox: AnchorBox,
    tooltip: TooltipSize,
    position: Position,
  ): PagePosition {
    const { x, y } = offset();
    switch (position) {
      case "top":
        return {
          top: anchorBox.top - tooltip.height - y,
          left: anchorBox.centerX - tooltip.width / 2,
        };
      case "bottom":
        return {
          top: anchorBox.bottom + y,
          left: anchorBox.centerX - tooltip.width / 2,
        };
      case "left":
        return {
          top: anchorBox.centerY - tooltip.height / 2,
          left: anchorBox.left - tooltip.width - x,
        };
      case "right":
        return {
          top: anchorBox.centerY - tooltip.height / 2,
          left: anchorBox.right + x,
        };
    }
  }

  function updatePosition(element: HTMLElement): void {
    const { x } = offset();
    const availableWidth = Math.max(0, window.innerWidth - x * 2);
    const maxWidth = clamp(
      finalProps.maxWidth ?? availableWidth,
      0,
      availableWidth,
    );
    element.style.maxWidth = `${maxWidth}px`;

    const anchorBox = getAnchorBox();
    const tooltipRect = element.getBoundingClientRect();
    const tooltipSize = {
      width: tooltipRect.width || 100,
      height: tooltipRect.height || 40,
    };
    const boundary = getPositionBoundary();
    const preferred = normalizePosition(finalProps.position);
    const position = finalProps.autoLayout
      ? resolvePosition(anchorBox, tooltipSize, boundary, preferred)
      : preferred;
    const coordinates = getCoordinates(anchorBox, tooltipSize, position);
    const viewportOffset = getPortalViewportOffset();
    const top = clamp(
      coordinates.top,
      boundary.top,
      boundary.bottom - tooltipSize.height,
    );
    const left = clamp(
      coordinates.left,
      boundary.left,
      boundary.right - tooltipSize.width,
    );

    element.style.transform = `translate(${left - viewportOffset.left}px, ${
      top - viewportOffset.top
    }px)`;
    setResolvedPosition(position);
    setIsPositioned(true);
  }

  const floatingPosition = createFloatingPosition({
    anchor,
    popup: container,
    isOpen: isMounted,
    mount: portal,
    mountElement: () => portalHost,
    updatePosition: ({ popup }) => {
      popup.style.position = usesPortalCoordinates() ? "absolute" : "fixed";
      updatePosition(popup);
    },
    removeOnCleanup: false,
    resizeTargets: () => [anchor(), edgeAnchor()],
  });

  function syncAriaDescribedBy(showing: boolean): void {
    if (!showing) {
      if (!describedTarget) {
        return;
      }
      if (previousAriaDescribedBy === null) {
        describedTarget.removeAttribute("aria-describedby");
      } else {
        describedTarget.setAttribute(
          "aria-describedby",
          previousAriaDescribedBy,
        );
      }
      describedTarget = undefined;
      previousAriaDescribedBy = null;
      return;
    }

    const currentTarget = target();
    if (describedTarget === currentTarget) {
      return;
    }
    if (describedTarget) {
      syncAriaDescribedBy(false);
    }

    describedTarget = currentTarget;
    previousAriaDescribedBy = describedTarget.getAttribute("aria-describedby");
    const tokens = new Set(
      (previousAriaDescribedBy ?? "").split(/\s+/).filter(Boolean),
    );
    tokens.add(tooltipId);
    describedTarget.setAttribute(
      "aria-describedby",
      Array.from(tokens).join(" "),
    );
  }

  function clearDestroyTimer(): void {
    if (destroyTimer !== undefined) {
      clearTimeout(destroyTimer);
      destroyTimer = undefined;
    }
  }

  function finishClose(): void {
    clearDestroyTimer();
    if (!isVisible()) {
      setIsMounted(false);
    }
  }

  function hide(instant = false): void {
    if (!isMounted()) {
      return;
    }
    if (showFrame !== undefined) {
      cancelAnimationFrame(showFrame);
      showFrame = undefined;
    }
    setIsVisible(false);
    setIsPositioned(false);
    syncAriaDescribedBy(false);
    if (instant) {
      finishClose();
      return;
    }
    clearDestroyTimer();
    destroyTimer = setTimeout(finishClose, DESTROY_FALLBACK_MS);
  }

  function show(): void {
    if (finalProps.hidden) {
      return;
    }
    clearDestroyTimer();
    if (!isMounted()) {
      setIsMounted(true);
    }
    syncAriaDescribedBy(true);
    floatingPosition.update();
    if (showFrame !== undefined) {
      cancelAnimationFrame(showFrame);
    }
    showFrame = requestAnimationFrame(() => {
      showFrame = undefined;
      setIsVisible(true);
      floatingPosition.update();
    });
  }

  function isInTooltipContext(nextTarget: EventTarget | null): boolean {
    if (!(nextTarget instanceof Node)) {
      return false;
    }
    return (
      target().contains(nextTarget) ||
      Boolean(container()?.contains(nextTarget))
    );
  }

  createEffect(() => {
    const currentTarget = target();
    const currentTrigger = trigger();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hide();
        return;
      }
      if (
        currentTrigger === "click" &&
        !event.repeat &&
        (event.key === "Enter" || event.key === " ")
      ) {
        event.preventDefault();
        if (isVisible()) {
          hide();
        } else {
          show();
        }
      }
    };
    const handleClick = () => {
      if (isVisible()) {
        hide();
      } else {
        show();
      }
    };
    const handlePointerEnter = () => show();
    const handlePointerLeave = (event: PointerEvent) => {
      if (!isInTooltipContext(event.relatedTarget)) {
        hide();
      }
    };
    const handleFocusOut = (event: FocusEvent) => {
      if (!isInTooltipContext(event.relatedTarget)) {
        hide();
      }
    };
    const handleTouchPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        show();
      }
    };
    const handleTouchPointerUp = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        hide();
      }
    };

    currentTarget.addEventListener("keydown", handleKeyDown);
    if (currentTrigger === "click") {
      currentTarget.addEventListener("pointerdown", handleClick);
    } else {
      currentTarget.addEventListener("pointerenter", handlePointerEnter);
      currentTarget.addEventListener("pointerleave", handlePointerLeave);
      currentTarget.addEventListener("pointerdown", handleTouchPointerDown);
      currentTarget.addEventListener("pointerup", handleTouchPointerUp);
      currentTarget.addEventListener("focusin", handlePointerEnter);
      currentTarget.addEventListener("focusout", handleFocusOut);
    }

    onCleanup(() => {
      currentTarget.removeEventListener("keydown", handleKeyDown);
      currentTarget.removeEventListener("pointerdown", handleClick);
      currentTarget.removeEventListener("pointerenter", handlePointerEnter);
      currentTarget.removeEventListener("pointerleave", handlePointerLeave);
      currentTarget.removeEventListener("pointerdown", handleTouchPointerDown);
      currentTarget.removeEventListener("pointerup", handleTouchPointerUp);
      currentTarget.removeEventListener("focusin", handlePointerEnter);
      currentTarget.removeEventListener("focusout", handleFocusOut);
    });
  });

  createEffect(() => {
    const element = container();
    if (!isMounted() || !element) {
      return;
    }

    const currentTarget = target();
    const currentAnchor = anchor();
    const currentTrigger = trigger();

    const intersectionObserver = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) {
        hide(true);
      }
    });
    intersectionObserver.observe(currentTarget);

    const handleDocumentPointerDown = (event: PointerEvent) => {
      if (
        isEventInside(event, currentTarget) ||
        isEventInside(event, element) ||
        (mode() === "follow" && isEventInside(event, currentAnchor))
      ) {
        return;
      }
      hide();
    };

    if (currentTrigger === "click") {
      document.addEventListener("pointerdown", handleDocumentPointerDown, {
        capture: true,
        passive: true,
      });
    }
    floatingPosition.update();

    onCleanup(() => {
      intersectionObserver.disconnect();
      document.removeEventListener("pointerdown", handleDocumentPointerDown, {
        capture: true,
      });
    });
  });

  createEffect(() => {
    // Reading these props makes Solid rerun positioning when any of them changes.
    normalizePosition(finalProps.position);
    finalProps.content;
    finalProps.maxWidth;
    finalProps.autoLayout;
    finalProps.offset;
    finalProps.parentElement;
    finalProps.anchor;
    finalProps.edgeAnchor;
    finalProps.mode;
    if (isMounted()) {
      floatingPosition.update();
    }
  });

  createEffect(() => {
    if (isMounted()) {
      syncAriaDescribedBy(true);
    }
  });

  createEffect(() => {
    if (finalProps.hidden) {
      hide(true);
      return;
    }
    if (trigger() !== "hover") {
      return;
    }

    const currentTarget = target();
    try {
      if (
        currentTarget.matches(":hover") ||
        currentTarget.contains(document.activeElement)
      ) {
        untrack(show);
      }
    } catch {
      // Some embedded documents do not support the :hover selector.
    }
  });

  onCleanup(() => {
    if (showFrame !== undefined) {
      cancelAnimationFrame(showFrame);
    }
    clearDestroyTimer();
    syncAriaDescribedBy(false);
  });

  finalProps.controls?.({
    show,
    update: floatingPosition.update,
    isOpen: () => isMounted() && isVisible(),
  });

  const tooltipView = (): JSX.Element => (
    <Show when={isMounted()}>
      <vot-block
        ref={(element) => {
          setContainer(element);
          finalProps.ref?.(element);
        }}
        id={tooltipId}
        classList={{
          "vot-tooltip": true,
          "vot-tooltip-bordered": finalProps.bordered,
          "vot-tooltip--subtitles-info":
            finalProps.content instanceof HTMLElement &&
            finalProps.content.classList.contains("vot-subtitles-info"),
        }}
        role="tooltip"
        data-trigger={trigger()}
        data-mode={mode()}
        data-position={resolvedPosition()}
        style={{
          top: "0",
          left: "0",
          margin: "0",
          opacity: isVisible() && isPositioned() ? "1" : "0",
          "background-color": finalProps.backgroundColor,
          "border-radius":
            finalProps.borderRadius === undefined
              ? undefined
              : `${finalProps.borderRadius}px`,
        }}
        onPointerLeave={(event) => {
          if (
            trigger() === "hover" &&
            !isInTooltipContext(event.relatedTarget)
          ) {
            hide();
          }
        }}
        onTransitionEnd={(event) => {
          if (event.propertyName === "opacity" && !isVisible()) {
            finishClose();
          }
        }}
      >
        {finalProps.content}
      </vot-block>
    </Show>
  );

  const disposeTooltip = render(() => tooltipView() as Node, portalHost);
  onCleanup(() => {
    disposeTooltip();
    portalHost.remove();
  });

  return document.createTextNode("");
}
