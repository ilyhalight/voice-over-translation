import mainScss from "../styles/main.scss?inline";

type InlineStyleMap = Partial<Record<string, string>>;

export type ShadowMount = {
  host: HTMLElement;
  root: HTMLElement;
  shadowRoot: ShadowRoot;
};

type CreateShadowMountOptions = {
  parent: HTMLElement;
  hostTag?: string;
  rootTag?: string;
  hostClasses?: string[];
  rootClasses?: string[];
  hostStyles?: InlineStyleMap;
  rootStyles?: InlineStyleMap;
  delegatesFocus?: boolean;
};

const shadowScopedCssText = scopeCssForShadowRoots(mainScss);
let sharedShadowStyleSheet: CSSStyleSheet | null | undefined;

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

function getSharedShadowStyleSheet(): CSSStyleSheet | null {
  if (sharedShadowStyleSheet !== undefined) {
    return sharedShadowStyleSheet;
  }

  const canUseConstructableSheets =
    typeof CSSStyleSheet !== "undefined" &&
    typeof CSSStyleSheet.prototype.replaceSync === "function";

  if (!canUseConstructableSheets) {
    sharedShadowStyleSheet = null;
    return sharedShadowStyleSheet;
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
  const host = document.createElement(hostTag);
  if (hostClasses.length > 0) {
    host.classList.add(...hostClasses);
  }
  applyInlineStyles(host, hostStyles);

  const shadowRoot = host.attachShadow({
    mode: "open",
    delegatesFocus,
  });
  adoptScopedStyles(shadowRoot);

  const root = document.createElement(rootTag);
  if (rootClasses.length > 0) {
    root.classList.add(...rootClasses);
  }
  applyInlineStyles(root, rootStyles);
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
  parent: HTMLElement,
): void {
  if (!mount) {
    return;
  }

  if (mount.host.parentElement !== parent) {
    parent.append(mount.host);
  }
}

export function destroyShadowMount(mount: ShadowMount | undefined): void {
  mount?.host.remove();
}
