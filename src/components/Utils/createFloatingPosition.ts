import { type Accessor, onCleanup, onMount } from "solid-js";
import { effect } from "solid-js/web";

const DEFAULT_GAP = 8;
const DEFAULT_VIEWPORT_MARGIN = 8;
const AVAILABLE_HEIGHT_PROPERTY = "--vot-floating-available-height";

export type FloatingPositionOptions = {
  anchor: () => HTMLElement;
  popup: () => HTMLElement;
  isOpen: Accessor<boolean>;
  gap?: number;
  onOutsideScroll?: () => void;
  stablePlacementWhileOpen?: boolean;
  viewportMargin?: number;
};

function getPopupMount(
  anchor: HTMLElement,
): HTMLElement | ShadowRoot | undefined {
  const dialogContainer = anchor.closest<HTMLElement>(".vot-dialog-container");
  if (dialogContainer) {
    return dialogContainer;
  }

  const rootNode = anchor.getRootNode();
  if (rootNode instanceof ShadowRoot) {
    return rootNode;
  }
  if (rootNode instanceof Document) {
    return rootNode.body;
  }

  return undefined;
}

function getScrollTargets(anchor: HTMLElement): EventTarget[] {
  const targets: EventTarget[] = [window];
  let rootNode = anchor.getRootNode();

  while (rootNode instanceof ShadowRoot) {
    targets.push(rootNode);
    rootNode = rootNode.host.getRootNode();
  }

  return targets;
}

export function createFloatingPosition(options: FloatingPositionOptions): void {
  const gap = options.gap ?? DEFAULT_GAP;
  const viewportMargin = options.viewportMargin ?? DEFAULT_VIEWPORT_MARGIN;
  let positionFrame: number | undefined;
  let stableOpensBelow: boolean | undefined;

  const mountPopup = () => {
    const popup = options.popup();
    const popupMount = getPopupMount(options.anchor());
    if (popupMount && popup.parentNode !== popupMount) {
      popupMount.append(popup);
    }
  };

  const cancelPositionUpdate = () => {
    if (positionFrame === undefined) {
      return;
    }

    cancelAnimationFrame(positionFrame);
    positionFrame = undefined;
  };

  const updatePosition = () => {
    mountPopup();

    const anchorRect = options.anchor().getBoundingClientRect();
    const popup = options.popup();
    if (!options.stablePlacementWhileOpen || stableOpensBelow === undefined) {
      popup.style.removeProperty(AVAILABLE_HEIGHT_PROPERTY);
    }

    const popupHeight = popup.getBoundingClientRect().height;
    if (popupHeight === 0) {
      schedulePositionUpdate();
      return;
    }

    const availableAbove = Math.max(0, anchorRect.top - gap - viewportMargin);
    const availableBelow = Math.max(
      0,
      window.innerHeight - anchorRect.bottom - gap - viewportMargin,
    );
    const calculatedOpensBelow =
      availableBelow >= popupHeight || availableBelow >= availableAbove;
    const opensBelow = options.stablePlacementWhileOpen
      ? (stableOpensBelow ?? calculatedOpensBelow)
      : calculatedOpensBelow;
    if (options.stablePlacementWhileOpen) {
      stableOpensBelow = opensBelow;
    }
    const availableHeight = opensBelow ? availableBelow : availableAbove;

    popup.style.setProperty(AVAILABLE_HEIGHT_PROPERTY, `${availableHeight}px`);

    const popupRect = popup.getBoundingClientRect();
    const minLeft = viewportMargin;
    const maxLeft = Math.max(
      minLeft,
      window.innerWidth - viewportMargin - popupRect.width,
    );
    const left = Math.min(
      Math.max(anchorRect.right - popupRect.width, minLeft),
      maxLeft,
    );
    const top = opensBelow
      ? anchorRect.bottom + gap
      : anchorRect.top - gap - popupRect.height;

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
  };

  const schedulePositionUpdate = () => {
    cancelPositionUpdate();
    positionFrame = requestAnimationFrame(() => {
      positionFrame = undefined;
      updatePosition();
    });
  };

  onMount(() => {
    const popup = options.popup();

    effect(() => {
      if (!options.isOpen()) {
        return;
      }

      const scrollTargets = getScrollTargets(options.anchor());
      const handleScroll = (event: Event) => {
        if (event.composedPath().includes(popup)) {
          return;
        }
        if (options.onOutsideScroll) {
          options.onOutsideScroll();
          return;
        }

        schedulePositionUpdate();
      };

      mountPopup();
      const resizeObserver = new ResizeObserver(schedulePositionUpdate);
      resizeObserver.observe(popup);
      schedulePositionUpdate();
      window.addEventListener("resize", schedulePositionUpdate);
      for (const target of scrollTargets) {
        target.addEventListener("scroll", handleScroll, true);
      }

      onCleanup(() => {
        cancelPositionUpdate();
        resizeObserver.disconnect();
        stableOpensBelow = undefined;
        popup.style.removeProperty(AVAILABLE_HEIGHT_PROPERTY);
        window.removeEventListener("resize", schedulePositionUpdate);
        for (const target of scrollTargets) {
          target.removeEventListener("scroll", handleScroll, true);
        }
      });
    });

    onCleanup(() => {
      cancelPositionUpdate();
      popup.remove();
    });
  });
}
