import { createRenderer } from "solid-js/universal";

const propertyAliases: Record<string, string> = {
  formnovalidate: "formNoValidate",
  readonly: "readOnly",
};

const booleanAttributes = new Set([
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "disabled",
  "formnovalidate",
  "hidden",
  "loop",
  "multiple",
  "open",
  "readonly",
  "required",
  "selected",
]);

const eventListeners = new WeakMap<
  Element,
  Map<string, EventListenerOrEventListenerObject>
>();

function setClassList(
  element: Element,
  value: Record<string, boolean> | null | undefined,
  previous: Record<string, boolean> | null | undefined,
): void {
  for (const name of Object.keys(previous ?? {})) {
    const classes = name.trim().split(/\s+/).filter(Boolean);
    if (classes.length && !value?.[name]) element.classList.remove(...classes);
  }
  for (const [name, enabled] of Object.entries(value ?? {})) {
    const classes = name.trim().split(/\s+/).filter(Boolean);
    if (classes.length && enabled) element.classList.add(...classes);
  }
}

function setStyle(
  element: HTMLElement | SVGElement,
  value: string | Record<string, string | null | undefined> | null | undefined,
  previous:
    | string
    | Record<string, string | null | undefined>
    | null
    | undefined,
): void {
  if (typeof value === "string") {
    element.style.cssText = value;
    return;
  }
  if (typeof previous === "string") element.style.cssText = "";
  for (const name of Object.keys(
    typeof previous === "object" && previous ? previous : {},
  )) {
    if (value?.[name] == null) element.style.removeProperty(name);
  }
  for (const [name, styleValue] of Object.entries(value ?? {})) {
    if (styleValue == null) element.style.removeProperty(name);
    else element.style.setProperty(name, styleValue);
  }
}

function setEvent(element: Element, property: string, value: unknown): void {
  const capture = property.startsWith("oncapture:");
  const eventName = property.includes(":")
    ? property.slice(property.indexOf(":") + 1)
    : property.slice(2).toLowerCase();
  const key = `${capture ? "capture:" : "event:"}${eventName}`;
  let listeners = eventListeners.get(element);
  const previous = listeners?.get(key);
  if (previous) element.removeEventListener(eventName, previous, capture);
  if (!value) {
    listeners?.delete(key);
    return;
  }

  const listener: EventListenerOrEventListenerObject = Array.isArray(value)
    ? (event: Event) => value[0](value[1], event)
    : (value as EventListenerOrEventListenerObject);
  listeners ??= new Map();
  eventListeners.set(element, listeners);
  listeners.set(key, listener);
  element.addEventListener(eventName, listener, capture);
}

function setProperty<T>(
  node: Node,
  name: string,
  value: T,
  previous?: T,
): void {
  if (!(node instanceof Element)) return;
  if (name === "innerHTML") {
    throw new TypeError(
      "[VOT] innerHTML is not supported by the CSP-safe renderer",
    );
  }
  if (
    name === "style" &&
    (node instanceof HTMLElement || node instanceof SVGElement)
  ) {
    setStyle(node, value as never, previous as never);
    return;
  }
  if (name === "classList") {
    setClassList(node, value as never, previous as never);
    return;
  }
  if (name.startsWith("on")) {
    setEvent(node, name, value);
    return;
  }
  if (name.startsWith("attr:")) name = name.slice(5);
  if (name === "class" || name === "className") {
    if (value == null) node.removeAttribute("class");
    else node.setAttribute("class", String(value));
    return;
  }

  const propertyName = propertyAliases[name] ?? name;
  if (
    propertyName in node &&
    !name.startsWith("aria-") &&
    !name.startsWith("data-")
  ) {
    Reflect.set(node, propertyName, value);
    return;
  }
  if (value == null || (value === false && booleanAttributes.has(name))) {
    node.removeAttribute(name);
  } else if (value === true && booleanAttributes.has(name)) {
    node.setAttribute(name, "");
  } else {
    node.setAttribute(name, String(value));
  }
}

export const {
  render,
  effect,
  memo,
  createComponent,
  createElement,
  createTextNode,
  insertNode,
  insert,
  spread,
  setProp,
  mergeProps,
  use,
} = createRenderer<Node>({
  createElement(tag) {
    return document.createElement(tag);
  },
  createTextNode(value) {
    return document.createTextNode(value);
  },
  replaceText(textNode, value) {
    textNode.nodeValue = value;
  },
  isTextNode(node) {
    return node.nodeType === Node.TEXT_NODE;
  },
  setProperty,
  insertNode(parent, node, anchor) {
    parent.insertBefore(node, anchor ?? null);
  },
  removeNode(parent, node) {
    parent.removeChild(node);
  },
  getParentNode(node) {
    return node.parentNode ?? undefined;
  },
  getFirstChild(node) {
    return node.firstChild ?? undefined;
  },
  getNextSibling(node) {
    return node.nextSibling ?? undefined;
  },
});

export { For, Index, Match, Show, Switch } from "solid-js";
