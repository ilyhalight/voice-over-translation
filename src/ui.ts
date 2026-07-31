import { localizationProvider } from "./localization/localizationProvider";
import type { UiTemplate } from "./types/components/shared";
import { addKeyboardActivationListener } from "./ui/components/componentShared";
import { render } from "./ui/solid/render";

declare global {
  interface Window {
    __votKeyboardNavInitialized?: boolean;
  }
}

function initKeyboardNavigationMode(): void {
  if (globalThis.__votKeyboardNavInitialized) return;
  globalThis.__votKeyboardNavInitialized = true;

  const root = document.documentElement;
  const CLASS = "vot-keyboard-nav";

  const enable = () => root.classList.add(CLASS);
  const disable = () => root.classList.remove(CLASS);

  // Only Tab indicates keyboard *navigation* intent.
  globalThis.addEventListener(
    "keydown",
    (e: KeyboardEvent) => {
      if (e.key === "Tab") enable();
    },
    true,
  );

  // Any pointer interaction switches back to pointer mode.
  for (const evt of ["pointerdown", "touchstart"] as const) {
    globalThis.addEventListener(evt, disable, {
      capture: true,
      passive: true,
    });
  }
}

// Initialize once at module load.
initKeyboardNavigationMode();

type HeaderLevel = 1 | 2 | 3 | 4 | 5 | 6;

type InformationElements = {
  container: HTMLElement;
  header: HTMLElement;
  value: HTMLElement;
};

type SubtitleInfoElements = {
  container: HTMLElement;
  translatedWith: HTMLElement;
  header: HTMLElement;
  context: HTMLElement;
};

type MakeButtonLikeOptions = {
  /** Accessible label for icon-only controls. */
  ariaLabel?: string;
};

/**
 * Shared `disabled` attribute observer for every button-like element.
 *
 * Owns a single `MutationObserver` for the whole document; per-element sync
 * callbacks are stored in a `WeakMap` so detached buttons are collected without
 * an explicit `disconnect()` call (the previous per-element observers were
 * never disconnected either, so lifetime semantics are unchanged).
 */
const disabledSyncHandlers = new WeakMap<Element, () => void>();
let disabledObserver: MutationObserver | undefined;

function observeDisabledAttribute(el: Element, sync: () => void) {
  disabledSyncHandlers.set(el, sync);
  if (typeof MutationObserver === "undefined") return;
  disabledObserver ??= new MutationObserver((records) => {
    for (const record of records) {
      disabledSyncHandlers.get(record.target as Element)?.();
    }
  });
  disabledObserver.observe(el, {
    attributes: true,
    attributeFilter: ["disabled"],
  });
}

const UI = {
  /**
   * Makes a non-native element behave like a button (keyboard + ARIA).
   *
   * We use custom tags (`vot-block`) for isolation, so we must re-add
   * basic semantics for accessibility.
   */
  makeButtonLike(el: HTMLElement, { ariaLabel }: MakeButtonLikeOptions = {}) {
    el.setAttribute("role", "button");
    if (!el.hasAttribute("tabindex")) {
      el.tabIndex = 0;
    }

    const enabledTabIndex = el.tabIndex;

    // Keep ARIA and tab order in sync with our custom `disabled="true"` flag.
    const syncDisabledState = () => {
      const isDisabled = el.getAttribute("disabled") === "true";
      if (isDisabled) {
        el.setAttribute("aria-disabled", "true");
        el.tabIndex = -1;
      } else {
        el.removeAttribute("aria-disabled");
        el.tabIndex = enabledTabIndex;
      }
    };

    syncDisabledState();

    // If a component toggles `disabled` later (e.g. download button),
    // keep semantics consistent without requiring manual updates.
    // Consolidated onto ONE process-wide MutationObserver instead of a new
    // observer per button: observers are per-element records on the same
    // microtask queue, so N observers cost N callbacks + N records; one shared
    // observer delivers a single batched record list per microtask.
    observeDisabledAttribute(el, syncDisabledState);

    if (ariaLabel) {
      el.setAttribute("aria-label", ariaLabel);
    }

    addKeyboardActivationListener(el, () => {
      const disabled =
        el.getAttribute("disabled") === "true" ||
        el.getAttribute("aria-disabled") === "true";
      if (disabled) return;
      el.click();
    });

    return el;
  },

  /**
   * Auxiliary method for creating HTML elements
   */
  createEl(
    tag: string,
    classes: string[] = [],
    content: Node | string | null = null,
  ): HTMLElement {
    const el = document.createElement(tag);
    if (classes.length) el.classList.add(...classes);
    if (content !== null) el.append(content);
    return el;
  },

  /**
   * Create header element
   */
  createHeader(html: Node | string, level: HeaderLevel = 4): HTMLElement {
    return UI.createEl(
      "vot-block",
      ["vot-header", `vot-header-level-${level}`],
      html,
    );
  },

  /**
   * Create information element
   */
  createInformation(
    labelHtml: UiTemplate,
    valueHtml: UiTemplate,
  ): InformationElements {
    const container = UI.createEl("vot-block", ["vot-info"]);
    const header = UI.createEl("vot-block");
    render(labelHtml, header);
    const value = UI.createEl("vot-block");
    render(valueHtml, value);
    container.append(header, value);
    return { container, header, value };
  },

  /**
   * Create button
   */
  createButton(html: Node | string): HTMLElement {
    const el = UI.createEl("vot-block", ["vot-button"], html);
    return UI.makeButtonLike(el);
  },

  /**
   * Create text button
   */
  createTextButton(html: Node | string): HTMLElement {
    const el = UI.createEl("vot-block", ["vot-text-button"], html);
    return UI.makeButtonLike(el);
  },

  /**
   * Create outlined button
   */
  createOutlinedButton(html: Node | string): HTMLElement {
    const el = UI.createEl("vot-block", ["vot-outlined-button"], html);
    return UI.makeButtonLike(el);
  },

  /**
   * Create icon button
   */
  createIconButton(
    templateHtml: UiTemplate,
    options: MakeButtonLikeOptions = {},
  ): HTMLElement {
    const button = UI.createEl("vot-block", ["vot-icon-button"]);
    render(templateHtml, button);
    return UI.makeButtonLike(button, options);
  },

  createInlineLoader(): HTMLElement {
    return UI.createEl("vot-block", ["vot-inline-loader"]);
  },

  createPortal(local: boolean = false): HTMLElement {
    return UI.createEl("vot-block", [`vot-portal${local ? "-local" : ""}`]);
  },

  createSubtitleInfo(
    word: string,
    desc: string,
    translationService: string,
  ): SubtitleInfoElements {
    const container = UI.createEl("vot-block", ["vot-subtitles-info"]);
    container.id = "vot-subtitles-info";
    const translatedWith = UI.createEl(
      "vot-block",
      ["vot-subtitles-info-service"],
      localizationProvider
        .get("VOTTranslatedBy")
        .replace("{0}", translationService),
    );
    translatedWith.hidden = true;

    const title = UI.createEl("vot-block", ["vot-subtitles-info-title"]);
    const source = UI.createEl("span", ["vot-subtitles-info-source"], word);
    const divider = UI.createEl("span", ["vot-subtitles-info-divider"], "—");
    const header = UI.createEl("span", ["vot-subtitles-info-header"], word);
    title.append(source, divider, header);

    const context = UI.createEl(
      "vot-block",
      ["vot-subtitles-info-context"],
      desc,
    );

    container.append(title, context);

    return {
      container,
      translatedWith,
      header,
      context,
    };
  },
} as const;

export default UI;
