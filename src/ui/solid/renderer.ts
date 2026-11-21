import { createRenderer } from "@solidjs/universal";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
// The universal JSX transform passes static props to createElement, so
// namespace detection still relies on the tag name alone.
const SVG_ELEMENT_NAMES = new Set([
  "altGlyph",
  "altGlyphDef",
  "altGlyphItem",
  "animate",
  "animateColor",
  "animateMotion",
  "animateTransform",
  "circle",
  "clipPath",
  "color-profile",
  "cursor",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "font",
  "font-face",
  "font-face-format",
  "font-face-name",
  "font-face-src",
  "font-face-uri",
  "foreignObject",
  "g",
  "glyph",
  "glyphRef",
  "hkern",
  "image",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "metadata",
  "missing-glyph",
  "mpath",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "set",
  "stop",
  "svg",
  "switch",
  "symbol",
  "text",
  "textPath",
  "tref",
  "tspan",
  "use",
  "view",
  "vkern",
]);

const propertyAliases: Record<string, string> = {
  formnovalidate: "formNoValidate",
  readonly: "readOnly",
};

// Solid 1 special-cases only real HTML boolean attributes: `true` means
// present and empty, `false` means absent. Every other attribute, including
// ARIA and data-*, stringifies booleans so `aria-hidden` becomes "true"
// rather than a present-but-empty attribute.
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
  "inert",
]);

// Mirrors @solidjs/web: DOM properties are opt-in. Plain names are content
// attributes; only these stateful form/media props are written as properties.
const statefulProperties: Record<string, ReadonlySet<string>> = {
  INPUT: new Set(["value", "defaultValue", "checked", "defaultChecked"]),
  SELECT: new Set(["value"]),
  OPTION: new Set(["value", "selected", "defaultSelected"]),
  TEXTAREA: new Set(["value", "defaultValue"]),
  VIDEO: new Set(["muted", "defaultMuted"]),
  AUDIO: new Set(["muted", "defaultMuted"]),
};

const eventListeners = new WeakMap<
  Element,
  Map<string, EventListenerOrEventListenerObject>
>();

// Applies the enabled keys of an object class value, diffing against the
// previous object to remove stale classes.
function applyObjectClass(
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

// Mirrors Solid 1 attribute handling: null/undefined always remove the
// attribute, but `true`/`false` only collapse to presence/absence for the
// boolean attribute whitelist above. Everything else, including ARIA and
// data-*, is stringified.
function setAttributeValue(node: Element, name: string, value: unknown): void {
  if (value == null || (value === false && booleanAttributes.has(name))) {
    node.removeAttribute(name);
  } else if (value === true && booleanAttributes.has(name)) {
    node.setAttribute(name, "");
  } else {
    node.setAttribute(name, String(value));
  }
}

// Mirrors @solidjs/web className: accepts a string, a number or an object
// of enabled classes; object writes diff against the previous value.
function setClassValue(
  element: Element,
  value: string | number | Record<string, boolean> | null | undefined,
  previous: string | number | Record<string, boolean> | null | undefined,
): void {
  if (value == null || typeof value !== "object") {
    if (value != null && typeof previous === "object" && previous) {
      // Replacing an object value with a plain string wipes stale classes.
      element.removeAttribute("class");
    }
    setAttributeValue(element, "class", value);
    return;
  }
  if (previous != null && typeof previous !== "object") {
    element.removeAttribute("class");
  }
  applyObjectClass(
    element,
    value,
    typeof previous === "object" ? previous : {},
  );
}

function setSpecialProperty<T>(
  node: Element,
  name: string,
  value: T,
  previous?: T,
): boolean {
  if (
    name === "style" &&
    (node instanceof HTMLElement || node instanceof SVGElement)
  ) {
    setStyle(node, value as never, previous as never);
    return true;
  }
  if (name.startsWith("on")) {
    setEvent(node, name, value);
    return true;
  }
  return false;
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
  if (setSpecialProperty(node, name, value, previous)) return;
  if (name.startsWith("prop:")) {
    const propertyName = name.slice(5);
    Reflect.set(node, propertyAliases[propertyName] ?? propertyName, value);
    return;
  }
  if (name === "class" || name === "className") {
    setClassValue(node, value as never, previous as never);
    return;
  }
  if (name === "textContent") {
    node.textContent = value == null ? "" : String(value);
    return;
  }
  // Stateful form/media props (upstream DOMWithState): always write the
  // property, otherwise form state (checked, current value) never updates.
  if (statefulProperties[node.tagName]?.has(name)) {
    // Mirrors @solidjs/web: nullish value/defaultValue is written as "".
    const isValue = name === "value" || name === "defaultValue";
    Reflect.set(node, name, isValue && value == null ? "" : value);
    return;
  }
  // Default in Solid 2: everything else is a content attribute. SVG element
  // names keep their case, setAttribute handles both namespaces alike.
  setAttributeValue(node, name, value);
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
  ref,
  applyRef,
} = createRenderer<Node>({
  createElement(tag, staticProps) {
    const node = SVG_ELEMENT_NAMES.has(tag)
      ? document.createElementNS(SVG_NAMESPACE, tag)
      : document.createElement(tag);

    if (staticProps) {
      for (const [name, value] of Object.entries(staticProps)) {
        setProperty(node, name, value);
      }
    }

    return node;
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
  removeNode(_parent, node) {
    (node as ChildNode).remove();
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

export { For, Match, Show, Switch } from "solid-js";
