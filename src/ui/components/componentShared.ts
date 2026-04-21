import type { EventImpl } from "../../core/eventImpl";

type EventHandler<Args extends unknown[]> = (...args: Args) => void;
type HiddenElement = { hidden: boolean };

export function addComponentEventListener<
  T extends string,
  Args extends unknown[],
>(
  events: Record<T, EventImpl<Args>>,
  type: T,
  listener: EventHandler<Args>,
): void {
  events[type].addListener(listener);
}

export function removeComponentEventListener<
  T extends string,
  Args extends unknown[],
>(
  events: Record<T, EventImpl<Args>>,
  type: T,
  listener: EventHandler<Args>,
): void {
  events[type].removeListener(listener);
}

export function setHiddenState(
  element: HiddenElement,
  isHidden: boolean,
): void {
  element.hidden = isHidden;
}

export function getHiddenState(element: HiddenElement): boolean {
  return element.hidden;
}

export function setInteractiveHiddenState(
  element: HTMLElement,
  isHidden: boolean,
): void {
  setHiddenState(element, isHidden);
  element.setAttribute("aria-hidden", isHidden ? "true" : "false");
  element.toggleAttribute("inert", isHidden);
}

export function setDisabledState(
  element: HTMLElement,
  isDisabled: boolean,
): void {
  if (isDisabled) {
    element.setAttribute("disabled", "true");
    return;
  }

  element.removeAttribute("disabled");
}

export function isPrimaryPointerAction(event: PointerEvent): boolean {
  return event.isPrimary && event.button === 0;
}

export function isKeyboardActivation(event: KeyboardEvent): boolean {
  return event.key === "Enter" || event.key === " ";
}

export function addKeyboardActivationListener(
  element: HTMLElement,
  handler: () => void,
  options?: AddEventListenerOptions,
): void {
  element.addEventListener(
    "keydown",
    (event) => {
      if (!isKeyboardActivation(event)) {
        return;
      }

      event.preventDefault();
      handler();
    },
    options,
  );
}
