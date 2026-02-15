import type { TemplateResult } from "lit-html";
import { render } from "lit-html";

import "./styles/main.scss";
import { localizationProvider } from "./localization/localizationProvider";
import type { LitHtml } from "./types/components/shared";

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
    (e) => {
      if (e.key === "Tab") enable();
    },
    true,
  );

  // Any pointer interaction switches back to pointer mode.
  for (const evt of ["pointerdown", "mousedown", "touchstart"] as const) {
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
    new MutationObserver(() => syncDisabledState()).observe(el, {
      attributes: true,
      attributeFilter: ["disabled"],
    });

    if (ariaLabel) {
      el.setAttribute("aria-label", ariaLabel);
    }

    // Keyboard activation (Enter/Space).
    el.addEventListener("keydown", (e: KeyboardEvent) => {
      const disabled =
        el.getAttribute("disabled") === "true" ||
        el.getAttribute("aria-disabled") === "true";
      if (disabled) return;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        el.click();
      }
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
    labelHtml: LitHtml,
    valueHtml: LitHtml,
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
    templateHtml: TemplateResult,
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
    const header = UI.createEl(
      "vot-block",
      ["vot-subtitles-info-header"],
      word,
    );
    const context = UI.createEl(
      "vot-block",
      ["vot-subtitles-info-context"],
      desc,
    );

    container.append(translatedWith, header, context);

    return {
      container,
      translatedWith,
      header,
      context,
    };
  },
} as const;

export default UI;
