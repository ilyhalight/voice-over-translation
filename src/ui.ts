import { localizationProvider } from "./localization/localizationProvider";

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

type SubtitleInfoElements = {
  container: HTMLElement;
  translatedWith: HTMLElement;
  header: HTMLElement;
  context: HTMLElement;
};

const UI = {
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
