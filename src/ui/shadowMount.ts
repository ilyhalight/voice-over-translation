import mainScss from "../styles/main.scss?inline";

type InlineStyleMap = Partial<Record<string, string>>;
type ElementConfig = {
  tag: string;
  classes?: string[];
  styles?: InlineStyleMap;
};

export type ShadowMount = {
  host: HTMLElement;
  root: HTMLElement;
  shadowRoot: ShadowRoot;
};

type CreateShadowMountOptions = {
  parent: HTMLElement | ShadowRoot;
  hostTag?: string;
  rootTag?: string;
  hostClasses?: string[];
  rootClasses?: string[];
  hostStyles?: InlineStyleMap;
  rootStyles?: InlineStyleMap;
  delegatesFocus?: boolean;
};

const shadowScopedCssText = scopeCssForShadowRoots(mainScss);
let sharedShadowStyleSheet: CSSStyleSheet | null = null;
let sharedShadowStyleSheetReady = false;

function scopeCssForShadowRoots(cssText: string): string {
  return cssText
    .replace(/:root\b/g, ":host")
    .replace(/html\.vot-keyboard-nav/g, ":host-context(.vot-keyboard-nav)")
    .replace(/:fullscreen(?=\s|,)/g, ":host-context(:fullscreen)")
    .replace(
      /:-webkit-full-screen(?=\s|,)/g,
      ":host-context(:-webkit-full-screen)",
    );
}

function applyClasses(
  element: HTMLElement,
  classes: string[] | undefined,
): void {
  if (classes?.length) {
    element.classList.add(...classes);
  }
}

function applyInlineStyles(
  element: HTMLElement,
  styles: InlineStyleMap | undefined,
): void {
  if (!styles) {
    return;
  }

  for (const [name, value] of Object.entries(styles)) {
    if (typeof value !== "string") {
      continue;
    }
    element.style.setProperty(name, value);
  }
}

function createMountElement({
  tag,
  classes = [],
  styles,
}: ElementConfig): HTMLElement {
  const element = document.createElement(tag);
  applyClasses(element, classes);
  applyInlineStyles(element, styles);
  return element;
}

function getSharedShadowStyleSheet(): CSSStyleSheet | null {
  if (sharedShadowStyleSheetReady) {
    return sharedShadowStyleSheet;
  }

  sharedShadowStyleSheetReady = true;

  const canUseConstructableSheets =
    typeof CSSStyleSheet !== "undefined" &&
    typeof CSSStyleSheet.prototype.replaceSync === "function";

  if (!canUseConstructableSheets) {
    return null;
  }

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(shadowScopedCssText);
  sharedShadowStyleSheet = sheet;
  return sharedShadowStyleSheet;
}

function adoptScopedStyles(shadowRoot: ShadowRoot): void {
  const sharedSheet = getSharedShadowStyleSheet();
  if (sharedSheet) {
    if (!shadowRoot.adoptedStyleSheets.includes(sharedSheet)) {
      shadowRoot.adoptedStyleSheets = [
        ...shadowRoot.adoptedStyleSheets,
        sharedSheet,
      ];
    }
    return;
  }

  const style = document.createElement("style");
  style.textContent = shadowScopedCssText;
  shadowRoot.append(style);
}

export function createShadowMount({
  parent,
  hostTag = "vot-shadow-host",
  rootTag = "vot-block",
  hostClasses = [],
  rootClasses = [],
  hostStyles,
  rootStyles,
  delegatesFocus = false,
}: CreateShadowMountOptions): ShadowMount {
  const host = createMountElement({
    tag: hostTag,
    classes: hostClasses,
    styles: hostStyles,
  });

  const shadowRoot = host.attachShadow({
    mode: "open",
    delegatesFocus,
  });
  adoptScopedStyles(shadowRoot);

  const root = createMountElement({
    tag: rootTag,
    classes: rootClasses,
    styles: rootStyles,
  });
  shadowRoot.append(root);

  parent.append(host);

  return {
    host,
    root,
    shadowRoot,
  };
}

export function reparentShadowMount(
  mount: ShadowMount | undefined,
  parent: HTMLElement | ShadowRoot,
): void {
  if (!mount) {
    return;
  }

  if (mount.host.parentNode !== parent) {
    parent.append(mount.host);
  }
}

export function destroyShadowMount(mount: ShadowMount | undefined): void {
  mount?.host.remove();
}
