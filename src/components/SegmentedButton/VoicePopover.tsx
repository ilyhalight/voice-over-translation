import {
  createEffect,
  createSignal,
  createUniqueId,
  type JSX,
  mergeProps,
  onCleanup,
} from "solid-js";

import "./VoicePopover.scss";

import { localizationProvider } from "../../localization/localizationProvider";
import { render } from "../../ui/solid/renderer";
import { LiveVoiceIcon } from "../Icons/LiveVoiceIcon";
import { StandardVoiceIcon } from "../Icons/StandartVoiceIcon";
import { createFloatingPosition } from "../Utils/createFloatingPosition";

export type VoiceType = "standard" | "live";

export type VoicePopoverControls = {
  isOpen: () => boolean;
  scheduleShow: () => void;
  scheduleHide: () => void;
  showNow: () => void;
  hideNow: () => void;
  toggle: () => void;
  cancelShow: () => void;
  cancelHide: () => void;
};

export type VoicePopoverProps = {
  activeVoice: VoiceType;
  anchor: HTMLElement;
  /** Overlay root used as the popover's mount and coordinate space. */
  layoutRoot: HTMLElement;
  isOpen?: boolean;
  showDelay?: number;
  hideDelay?: number;
  onVoiceChange?: (voice: VoiceType) => void;
  onOpenChange?: (isOpen: boolean) => void;
  onTranslate?: () => void;
  ref?: (element: HTMLElement) => void;
  controlsRef?: (controls: VoicePopoverControls) => void;
};

type Placement = "top" | "bottom" | "left" | "right";

const DEFAULT_SHOW_DELAY_MS = 80;
const DEFAULT_HIDE_DELAY_MS = 80;
const POPOVER_GAP = 8;
const MIN_POPOVER_WIDTH = 160;
const MAX_POPOVER_WIDTH = 310;
const MIN_POPOVER_HEIGHT = 96;

export function VoicePopover(props: VoicePopoverProps): JSX.Element {
  const finalProps = mergeProps(
    {
      isOpen: false,
      showDelay: DEFAULT_SHOW_DELAY_MS,
      hideDelay: DEFAULT_HIDE_DELAY_MS,
    },
    props,
  );

  const popoverId = `vot-voice-popover-${createUniqueId()}`;
  const portalHost = document.createElement("vot-block");
  portalHost.style.display = "contents";

  const [popover, setPopover] = createSignal<HTMLElement>();
  const [isOpen, setIsOpen] = createSignal(finalProps.isOpen);
  const [activeVoice, setActiveVoice] = createSignal(finalProps.activeVoice);

  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const anchor = () => {
    if (!(finalProps.anchor instanceof HTMLElement)) {
      throw new TypeError("anchor must be a valid HTMLElement");
    }
    return finalProps.anchor;
  };
  const layoutRoot = () => {
    if (!(finalProps.layoutRoot instanceof HTMLElement)) {
      throw new TypeError("layoutRoot must be a valid HTMLElement");
    }
    return finalProps.layoutRoot;
  };
  const buttonContainer = () =>
    anchor().closest<HTMLElement>("[data-direction]") ?? anchor();

  function clearShowTimer(): void {
    if (showTimer !== undefined) {
      clearTimeout(showTimer);
      showTimer = undefined;
    }
  }

  function clearHideTimer(): void {
    if (hideTimer !== undefined) {
      clearTimeout(hideTimer);
      hideTimer = undefined;
    }
  }

  function updateOpen(nextIsOpen: boolean): void {
    if (isOpen() === nextIsOpen) {
      if (nextIsOpen) {
        floatingPosition.update();
      }
      return;
    }
    setIsOpen(nextIsOpen);
    finalProps.onOpenChange?.(nextIsOpen);
  }

  function showNow(): void {
    clearShowTimer();
    clearHideTimer();
    updateOpen(true);
  }

  function hideNow(): void {
    clearShowTimer();
    clearHideTimer();
    updateOpen(false);
  }

  function scheduleShow(): void {
    clearShowTimer();
    clearHideTimer();
    if (isOpen()) {
      floatingPosition.update();
      return;
    }
    showTimer = setTimeout(() => {
      showTimer = undefined;
      updateOpen(true);
    }, finalProps.showDelay);
  }

  function scheduleHide(): void {
    clearShowTimer();
    if (!isOpen()) {
      return;
    }
    clearHideTimer();
    hideTimer = setTimeout(() => {
      hideTimer = undefined;
      updateOpen(false);
    }, finalProps.hideDelay);
  }

  function toggle(): void {
    if (isOpen()) {
      hideNow();
    } else {
      showNow();
    }
  }

  const controls: VoicePopoverControls = {
    isOpen,
    scheduleShow,
    scheduleHide,
    showNow,
    hideNow,
    toggle,
    cancelShow: clearShowTimer,
    cancelHide: clearHideTimer,
  };

  function positionPopover(element: HTMLElement): void {
    if (!isOpen()) {
      return;
    }

    const rootRect = layoutRoot().getBoundingClientRect();
    const container = buttonContainer();
    const containerRect = container.getBoundingClientRect();
    const maxRootWidth = Math.max(
      MIN_POPOVER_WIDTH,
      rootRect.width - POPOVER_GAP * 2,
    );
    const maxRootHeight = Math.max(
      MIN_POPOVER_HEIGHT,
      rootRect.height - POPOVER_GAP * 2,
    );
    element.style.setProperty(
      "--vot-voice-popover-max-width",
      `${Math.min(MAX_POPOVER_WIDTH, maxRootWidth)}px`,
    );
    element.style.setProperty(
      "--vot-voice-popover-max-height",
      `${maxRootHeight}px`,
    );

    const direction = container.dataset.direction ?? "row";
    const position = container.dataset.position ?? "default";
    let placement: Placement;
    let left: number;
    let top: number;

    if (direction === "column") {
      const spaceLeft = containerRect.left - rootRect.left - POPOVER_GAP;
      const spaceRight = rootRect.right - containerRect.right - POPOVER_GAP;
      const preferLeft = position === "right" || position === "rightCenter";
      placement =
        (preferLeft && spaceLeft >= MIN_POPOVER_WIDTH) ||
        spaceLeft >= spaceRight
          ? "left"
          : "right";
      const availableWidth = placement === "left" ? spaceLeft : spaceRight;
      element.style.setProperty(
        "--vot-voice-popover-max-width",
        `${Math.max(
          MIN_POPOVER_WIDTH,
          Math.min(MAX_POPOVER_WIDTH, availableWidth),
        )}px`,
      );
      const popoverRect = element.getBoundingClientRect();
      top =
        containerRect.top + containerRect.height / 2 - popoverRect.height / 2;
      left =
        placement === "left"
          ? containerRect.left - popoverRect.width - POPOVER_GAP
          : containerRect.right + POPOVER_GAP;
    } else {
      const spaceAbove = containerRect.top - rootRect.top - POPOVER_GAP;
      const spaceBelow = rootRect.bottom - containerRect.bottom - POPOVER_GAP;
      const popoverHeight = element.getBoundingClientRect().height;
      placement =
        spaceBelow >= popoverHeight || spaceBelow >= spaceAbove
          ? "bottom"
          : "top";
      element.style.setProperty(
        "--vot-voice-popover-max-height",
        `${Math.max(
          MIN_POPOVER_HEIGHT,
          placement === "top" ? spaceAbove : spaceBelow,
        )}px`,
      );
      const popoverRect = element.getBoundingClientRect();
      left =
        containerRect.left + containerRect.width / 2 - popoverRect.width / 2;
      top =
        placement === "top"
          ? containerRect.top - popoverRect.height - POPOVER_GAP
          : containerRect.bottom + POPOVER_GAP;
    }

    const popoverRect = element.getBoundingClientRect();
    const minLeft = rootRect.left + POPOVER_GAP;
    const maxLeft = Math.max(
      minLeft,
      rootRect.right - popoverRect.width - POPOVER_GAP,
    );
    const minTop = rootRect.top + POPOVER_GAP;
    const maxTop = Math.max(
      minTop,
      rootRect.bottom - popoverRect.height - POPOVER_GAP,
    );
    left = Math.min(Math.max(left, minLeft), maxLeft) - rootRect.left;
    top = Math.min(Math.max(top, minTop), maxTop) - rootRect.top;

    element.dataset.placement = placement;
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
  }

  const floatingPosition = createFloatingPosition({
    anchor,
    popup: popover,
    isOpen,
    mount: layoutRoot,
    mountElement: () => portalHost,
    removeOnCleanup: false,
    resizeTargets: () => [layoutRoot(), buttonContainer()],
    updatePosition: ({ popup }) => positionPopover(popup),
  });
  finalProps.controlsRef?.(controls);

  function selectVoice(voice: VoiceType): void {
    setActiveVoice(voice);
    clearHideTimer();
    finalProps.onVoiceChange?.(voice);
    finalProps.onTranslate?.();
    hideNow();
  }

  createEffect(() => {
    setActiveVoice(finalProps.activeVoice);
  });

  createEffect(() => {
    setIsOpen(finalProps.isOpen);
  });

  createEffect(() => {
    const currentAnchor = anchor();
    const previousControls = currentAnchor.getAttribute("aria-controls");
    const previousHasPopup = currentAnchor.getAttribute("aria-haspopup");
    const previousExpanded = currentAnchor.getAttribute("aria-expanded");
    const handleAnchorKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen()) {
        event.preventDefault();
        hideNow();
      }
    };
    currentAnchor.setAttribute("aria-controls", popoverId);
    currentAnchor.setAttribute("aria-haspopup", "menu");
    currentAnchor.addEventListener("keydown", handleAnchorKeyDown);

    onCleanup(() => {
      currentAnchor.removeEventListener("keydown", handleAnchorKeyDown);
      if (previousControls === null) {
        currentAnchor.removeAttribute("aria-controls");
      } else {
        currentAnchor.setAttribute("aria-controls", previousControls);
      }
      if (previousHasPopup === null) {
        currentAnchor.removeAttribute("aria-haspopup");
      } else {
        currentAnchor.setAttribute("aria-haspopup", previousHasPopup);
      }
      if (previousExpanded === null) {
        currentAnchor.removeAttribute("aria-expanded");
      } else {
        currentAnchor.setAttribute("aria-expanded", previousExpanded);
      }
    });
  });

  createEffect(() => {
    anchor().setAttribute("aria-expanded", isOpen().toString());
  });

  createEffect(() => {
    const element = popover();
    if (!isOpen() || !element) {
      return;
    }
    const currentAnchor = anchor();

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const path = event.composedPath();
      if (path.includes(element) || path.includes(currentAnchor)) {
        return;
      }
      hideNow();
    };
    const updatePosition = () => floatingPosition.update();

    document.addEventListener("pointerdown", handleOutsidePointerDown, {
      capture: true,
      passive: true,
    });
    window.visualViewport?.addEventListener("scroll", updatePosition);
    window.visualViewport?.addEventListener("resize", updatePosition);

    onCleanup(() => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown, {
        capture: true,
      });
      window.visualViewport?.removeEventListener("scroll", updatePosition);
      window.visualViewport?.removeEventListener("resize", updatePosition);
    });
  });

  createEffect(() => {
    // Reading layout props keeps the floating position in sync with prop changes.
    finalProps.activeVoice;
    finalProps.anchor;
    finalProps.layoutRoot;
    if (isOpen()) {
      floatingPosition.update();
    }
  });

  onCleanup(() => {
    clearShowTimer();
    clearHideTimer();
  });

  const voiceItem = (
    voice: VoiceType,
    title: string,
    subtitle: string,
    icon: JSX.Element,
  ): JSX.Element => {
    const isActive = () => activeVoice() === voice;
    return (
      <vot-block
        classList={{
          "vot-voice-popover__item": true,
          "vot-voice-popover__item--active": isActive(),
        }}
        role="menuitemradio"
        tabIndex={isActive() ? 0 : -1}
        aria-checked={isActive()}
        data-voice={voice}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          selectVoice(voice);
          queueMicrotask(() => anchor().focus());
        }}
      >
        <vot-block
          class={`vot-voice-popover__item-icon vot-voice-popover__item-icon--${voice}`}
        >
          {icon}
        </vot-block>
        <vot-block class="vot-voice-popover__item-text">
          <vot-block class="vot-voice-popover__item-title">{title}</vot-block>
          <vot-block class="vot-voice-popover__item-subtitle">
            {subtitle}
          </vot-block>
        </vot-block>
      </vot-block>
    );
  };

  const popoverView = (): JSX.Element => (
    <vot-block
      ref={(element) => {
        setPopover(element);
        finalProps.ref?.(element);
      }}
      id={popoverId}
      class="vot-voice-popover"
      role="menu"
      aria-label={localizationProvider.get("VOTVoiceSelection")}
      aria-hidden={!isOpen()}
      hidden={!isOpen()}
      inert={!isOpen()}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") {
          clearHideTimer();
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "touch") {
          scheduleHide();
        }
      }}
      onFocusOut={(event) => {
        const nextTarget = event.relatedTarget;
        if (
          nextTarget instanceof Node &&
          (event.currentTarget.contains(nextTarget) ||
            anchor().contains(nextTarget))
        ) {
          return;
        }
        hideNow();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          hideNow();
          queueMicrotask(() => anchor().focus());
        }
      }}
    >
      {voiceItem(
        "standard",
        localizationProvider.get("VOTStandardVoicesTitle"),
        localizationProvider.get("VOTStandardVoicesSubtitle"),
        <StandardVoiceIcon />,
      )}
      <vot-block class="vot-voice-popover__divider" />
      {voiceItem(
        "live",
        localizationProvider.get("VOTLiveVoicesTitle"),
        localizationProvider.get("VOTLiveVoicesSubtitle"),
        <LiveVoiceIcon />,
      )}
    </vot-block>
  );

  const disposePopover = render(() => popoverView() as Node, portalHost);
  onCleanup(() => {
    disposePopover();
    portalHost.remove();
  });

  return document.createTextNode("");
}
