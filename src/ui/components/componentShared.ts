import { EventImpl } from "../../core/eventImpl";
import type Select from "./select";

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

export abstract class UIComponent {
  container: HTMLElement;

  set hidden(isHidden: boolean) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden === true;
  }

  protected abstract createElements(): Record<
    string,
    HTMLElement | SVGGeometryElement | Select
  >;
}

type EventDefinitions = Record<PropertyKey, unknown[]>;
type EventsFrom<T extends EventDefinitions> = {
  [K in keyof T]: EventImpl<T[K]>;
};
type EventTypes<T extends EventDefinitions> = readonly (keyof T)[];
type EventListener<
  TEvents extends EventDefinitions,
  K extends keyof TEvents,
> = Parameters<EventsFrom<TEvents>[K]["addListener"]>[0];
type EventArgs<
  TEvents extends EventDefinitions,
  K extends keyof TEvents,
> = Parameters<EventsFrom<TEvents>[K]["dispatch"]>;

export abstract class UIComponentWithEvents<
  TEvents extends EventDefinitions,
> extends UIComponent {
  protected readonly events: EventsFrom<TEvents>;

  constructor(types: EventTypes<TEvents>) {
    super();
    this.events = Object.fromEntries(
      types.map((typeItem) => [typeItem, new EventImpl()]),
    ) as EventsFrom<TEvents>;
  }

  addEventListener<K extends keyof TEvents>(
    type: K,
    listener: EventListener<TEvents, K>,
  ): this {
    this.events[type].addListener(listener);

    return this;
  }

  removeEventListener<K extends keyof TEvents>(
    type: K,
    listener: EventListener<TEvents, K>,
  ): this {
    this.events[type].removeListener(listener);

    return this;
  }

  dispatch<K extends keyof TEvents>(
    type: K,
    ...args: EventArgs<TEvents, K>
  ): this {
    this.events[type].dispatch(...args);

    return this;
  }
}
