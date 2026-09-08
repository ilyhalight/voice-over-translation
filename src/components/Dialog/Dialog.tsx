import {
  createEffect,
  createUniqueId,
  type JSX,
  onCleanup,
  Show,
} from "solid-js";
import { localizationProvider } from "../../localization/localizationProvider";
import { getDeepActiveElement } from "../../utils/dom";
import { IconButton } from "../Button/IconButton";
import { Overlay } from "../Utils/Overlay";
import "./Dialog.scss";
import { CloseIcon } from "../Icons/CloseIcon";

export type DialogProps = {
  title: JSX.Element;
  children: JSX.Element;
  footer?: JSX.Element;
  isOpen: boolean;
  ref?: (element: HTMLElement) => void;
  onClose: () => void;
};

const MARGIN_PX = 16;

export function Dialog(props: DialogProps): JSX.Element {
  const titleId = `vot-dialog-title-${createUniqueId()}`;
  let container: HTMLElement | undefined;
  let box: HTMLElement | undefined;
  let contentWrapper: HTMLElement | undefined;
  let closeButton: HTMLElement | undefined;
  let previouslyFocused: Element | null = null;
  let adaptiveAlignObserver: ResizeObserver | undefined;
  let adaptiveAlignRaf: number | undefined;

  const getFocusableElements = (): HTMLElement[] => {
    if (!container) return [];
    const selectors = [
      "button:not([disabled])",
      "[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
      "[role='button']:not([aria-disabled='true'])",
    ];
    return Array.from(
      container.querySelectorAll<HTMLElement>(selectors.join(",")),
    ).filter((element) => !element.hidden && element.getClientRects().length);
  };

  const restoreFocus = () => {
    const element = previouslyFocused;
    previouslyFocused = null;
    if (element instanceof HTMLElement && element.isConnected) {
      element.focus();
    }
  };

  const detachAdaptiveVerticalAlign = () => {
    adaptiveAlignObserver?.disconnect();
    adaptiveAlignObserver = undefined;
    globalThis.removeEventListener("resize", scheduleAdaptiveVerticalAlign);
    globalThis.visualViewport?.removeEventListener(
      "resize",
      scheduleAdaptiveVerticalAlign,
    );
    globalThis.visualViewport?.removeEventListener(
      "scroll",
      scheduleAdaptiveVerticalAlign,
    );
    if (adaptiveAlignRaf !== undefined) {
      cancelAnimationFrame(adaptiveAlignRaf);
      adaptiveAlignRaf = undefined;
    }
  };

  function updateAdaptiveVerticalAlign() {
    if (!box || !contentWrapper) return;
    const viewportHeight =
      globalThis.visualViewport?.height ?? globalThis.innerHeight;
    if (!viewportHeight || viewportHeight <= 0) return;

    const centerMaxPx = Math.max(160, Math.round(viewportHeight * 0.75));
    const topMaxPx = Math.max(160, Math.round(viewportHeight - MARGIN_PX * 2));
    const currentlyTop = box.dataset.verticalAlign === "top";
    const shouldTop = currentlyTop
      ? contentWrapper.scrollHeight > Math.round(viewportHeight * 0.6)
      : contentWrapper.scrollHeight >= centerMaxPx - 8;

    box.dataset.verticalAlign = shouldTop ? "top" : "center";
    box.style.setProperty(
      "--vot-dialog-max-height",
      `${shouldTop ? topMaxPx : centerMaxPx}px`,
    );
  }

  function scheduleAdaptiveVerticalAlign() {
    if (adaptiveAlignRaf !== undefined) {
      cancelAnimationFrame(adaptiveAlignRaf);
    }
    adaptiveAlignRaf = requestAnimationFrame(() => {
      adaptiveAlignRaf = undefined;
      updateAdaptiveVerticalAlign();
    });
  }

  const close = () => {
    if (!props.isOpen) return;
    props.onClose();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && !event.defaultPrevented) {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;

    const focusableElements = getFocusableElements();
    if (!focusableElements.length) {
      event.preventDefault();
      box?.focus();
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements.at(-1) ?? first;
    const active = container
      ? getDeepActiveElement(container.getRootNode() as Document | ShadowRoot)
      : null;
    if (event.shiftKey && (active === first || active === box)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  createEffect(() => {
    if (!props.isOpen) return;
    previouslyFocused ??= getDeepActiveElement(document);
    if (typeof ResizeObserver !== "undefined" && contentWrapper) {
      adaptiveAlignObserver = new ResizeObserver(scheduleAdaptiveVerticalAlign);
      adaptiveAlignObserver.observe(contentWrapper);
    }
    globalThis.addEventListener("resize", scheduleAdaptiveVerticalAlign, {
      passive: true,
    });
    globalThis.visualViewport?.addEventListener(
      "resize",
      scheduleAdaptiveVerticalAlign,
      { passive: true },
    );
    globalThis.visualViewport?.addEventListener(
      "scroll",
      scheduleAdaptiveVerticalAlign,
      { passive: true },
    );
    scheduleAdaptiveVerticalAlign();
    queueMicrotask(() => {
      if (props.isOpen) {
        (getFocusableElements()[0] ?? closeButton ?? box)?.focus();
      }
    });
    onCleanup(() => {
      detachAdaptiveVerticalAlign();
      restoreFocus();
    });
  });

  return (
    <Overlay
      ref={(element) => {
        container = element;
        props.ref?.(element);
      }}
      hidden={!props.isOpen}
      classList={{ "vot-dialog-container": true }}
      blockProps={{
        inert: props.isOpen ? undefined : true,
        onKeyDown: handleKeyDown,
      }}
    >
      <vot-block
        class="vot-dialog-backdrop"
        onClick={(event) => {
          event.stopPropagation();
          close();
        }}
      />
      <vot-block
        ref={(element) => (box = element)}
        class="vot-dialog"
        data-vertical-align="center"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <vot-block
          ref={(element) => (contentWrapper = element)}
          class="vot-dialog-content-wrapper"
        >
          <vot-block class="vot-dialog-header-container">
            <vot-block class="vot-dialog-title-container">
              <vot-block class="vot-dialog-title" id={titleId}>
                {props.title}
              </vot-block>
            </vot-block>
            <IconButton
              ref={(element) => (closeButton = element)}
              ariaLabel={localizationProvider.get("VOTClose")}
              onClick={close}
            >
              <CloseIcon />
            </IconButton>
          </vot-block>
          <vot-block class="vot-dialog-body-container">
            {props.children}
          </vot-block>
          <Show when={props.footer}>
            <vot-block class="vot-dialog-footer-container">
              {props.footer}
            </vot-block>
          </Show>
        </vot-block>
      </vot-block>
    </Overlay>
  );
}
