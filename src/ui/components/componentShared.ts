export function setInteractiveHiddenState(
  element: HTMLElement,
  isHidden: boolean,
): void {
  element.hidden = isHidden;
  element.setAttribute("aria-hidden", isHidden ? "true" : "false");
  element.toggleAttribute("inert", isHidden);
}

export function createDomId(prefix: string): string {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}-${suffix}`;
}

export function isEventInside(event: Event, element: HTMLElement): boolean {
  const target = event.target;
  if (target instanceof Node && element.contains(target)) {
    return true;
  }

  return (
    typeof event.composedPath === "function" &&
    event.composedPath().includes(element)
  );
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
