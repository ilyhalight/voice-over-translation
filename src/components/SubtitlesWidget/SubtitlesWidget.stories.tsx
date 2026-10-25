import { expect, fn, waitFor } from "storybook/test";
import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { localizationProvider } from "../../localization/localizationProvider";
import { setSettings, settings } from "../../stores/settings";
import { TokenTooltipController } from "../../subtitles/tokenTooltipController";
import { SubtitlesWidget as SubtitlesController } from "../../subtitles/widget";
import type { ProcessedSubtitles } from "../../types/subtitles";
import { createIntervalIdleChecker } from "../../utils/intervalIdleChecker";
import {
  mountSolidSubtitlesWidget,
  SolidSubtitlesWidget,
} from "./SubtitlesWidget";

const meta = {
  component: SolidSubtitlesWidget,
} satisfies Meta<typeof SolidSubtitlesWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

const emptyArgs = {
  parts: [],
  lang: "",
  onClick: () => {},
  ref: () => {},
};

export const Lifecycle: Story = {
  args: emptyArgs,
  play: async ({ canvasElement }) => {
    const container = document.createElement("vot-block");
    canvasElement.append(container);
    let lang = "en";
    let clicks = 0;
    let disposed = false;
    const handle = mountSolidSubtitlesWidget(container, {
      lang: () => lang,
      onClick: () => {
        clicks += 1;
      },
    });

    try {
      handle.setParts([
        { kind: "word", text: "one", highlightIndex: 0 },
        { kind: "word", text: "two", highlightIndex: 1 },
      ]);

      const firstWord = handle.highlightEls()[0];
      await expect(handle.block()).toHaveAttribute("lang", "en");
      await expect(firstWord).toHaveAttribute("role", "button");
      await expect(firstWord).toHaveAttribute("tabindex", "0");
      await expect(
        handle.highlightEls().map((element) => element.textContent),
      ).toEqual(["one", "two"]);
      firstWord.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
      const spaceEvent = new KeyboardEvent("keydown", {
        key: " ",
        bubbles: true,
        cancelable: true,
      });
      firstWord.dispatchEvent(spaceEvent);
      await expect(clicks).toBe(2);
      await expect(spaceEvent.defaultPrevented).toBe(true);

      lang = "";
      handle.setParts([{ kind: "word", text: "three", highlightIndex: 0 }]);
      await expect(handle.block().hasAttribute("lang")).toBe(false);
      await expect(handle.highlightEls()[0]).toBe(firstWord);
      await expect(handle.highlightEls()[0]).toHaveTextContent("three");

      lang = "ar";
      handle.setParts([{ kind: "word", text: "four", highlightIndex: 0 }]);
      handle.block().click();
      await expect(handle.block()).toHaveAttribute("lang", "ar");
      await expect(clicks).toBe(3);

      handle.dispose();
      disposed = true;
      await expect(container.childElementCount).toBe(0);
      await expect(handle.highlightEls()).toEqual([]);
      await expect(() => handle.block()).toThrow();
    } finally {
      if (!disposed) handle.dispose();
      container.remove();
    }
  },
};

const subtitles = (color: string): ProcessedSubtitles => ({
  format: "vtt",
  subtitles: [
    {
      text: "same",
      startMs: 0,
      durationMs: 5_000,
      speakerId: "0",
      tokens: [
        {
          text: "same",
          startMs: 0,
          durationMs: 5_000,
          isWordLike: true,
          style: { color },
        },
      ],
    },
  ],
});

export const TrackReplacement: Story = {
  args: emptyArgs,
  play: async ({ canvasElement }) => {
    const container = document.createElement("vot-block");
    const nextContainer = document.createElement("vot-block");
    container.style.width = "640px";
    container.style.height = "360px";
    nextContainer.style.width = "800px";
    nextContainer.style.height = "450px";
    canvasElement.append(container, nextContainer);
    const video = document.createElement("video");
    const checker = createIntervalIdleChecker();
    const NativeResizeObserver = globalThis.ResizeObserver;
    const observed: Element[] = [];
    const unobserved: Element[] = [];
    class TrackingResizeObserver implements ResizeObserver {
      private readonly targets = new Set<Element>();

      disconnect(): void {
        this.targets.clear();
      }
      observe(target: Element): void {
        this.targets.add(target);
        observed.push(target);
      }
      unobserve(target: Element): void {
        this.targets.delete(target);
        unobserved.push(target);
      }
    }
    globalThis.ResizeObserver = TrackingResizeObserver;
    const widget = new SubtitlesController(video, container, checker);

    try {
      widget.setContent(subtitles("#ff0000"), "en");
      const firstWord = container.querySelector<HTMLSpanElement>(
        'span[data-vot-token="1"]',
      );
      await expect(firstWord).toBeInstanceOf(HTMLSpanElement);
      await expect(firstWord).toHaveStyle(
        "--vot-subtitles-inline-color: #ff0000",
      );

      widget.setContent(subtitles("#00ff00"), "fr");
      const replacedWord = container.querySelector<HTMLSpanElement>(
        'span[data-vot-token="1"]',
      );
      await expect(replacedWord).toBe(firstWord);
      await expect(replacedWord).toHaveStyle(
        "--vot-subtitles-inline-color: #00ff00",
      );
      await expect(replacedWord?.closest(".vot-subtitles")).toHaveAttribute(
        "lang",
        "fr",
      );

      widget.updateMount({ container: nextContainer });
      await expect(unobserved).toContain(container);
      await expect(observed).toContain(nextContainer);
      await expect(nextContainer.contains(replacedWord)).toBe(true);
    } finally {
      widget.release();
      checker.destroy();
      globalThis.ResizeObserver = NativeResizeObserver;
      container.remove();
      nextContainer.remove();
    }
  },
};

export const TokenTooltipLifecycle: Story = {
  args: emptyArgs,
  play: async ({ canvasElement }) => {
    const container = document.createElement("vot-block");
    const nextContainer = document.createElement("vot-block");
    const subtitlesContainer = document.createElement("vot-block");
    const subtitlesBlock = document.createElement("vot-block");
    const target = document.createElement("span");
    const outside = document.createElement("vot-block");
    target.dataset.votToken = "1";
    target.textContent = "hello";
    subtitlesBlock.append(target);
    subtitlesContainer.append(subtitlesBlock);
    container.append(subtitlesContainer);
    canvasElement.append(container, nextContainer, outside);
    let mountContainer = container;
    const controller = new TokenTooltipController({
      getContext: () => ({
        container: mountContainer,
        subtitlesContainer,
        subtitlesBlock,
        subtitleLang: "en",
        subtitleMaxWidthPx: 640,
        tokenText: "hello world",
        suppressClicksUntil: 0,
      }),
      getTranslationService: () => Promise.resolve("test"),
      translateText: async (text) => {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        return Array.isArray(text)
          ? ["translated context", "translated word"]
          : "translated word";
      },
    });
    subtitlesBlock.addEventListener("click", controller.onActivate);
    subtitlesBlock.addEventListener("keydown", controller.onActivate);
    globalThis.addEventListener("pointerdown", controller.onGlobalPointerDown);

    try {
      target.click();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const tooltipHost = container.querySelector("vot-shadow-host");
      await expect(target).toHaveClass("selected");
      await expect(tooltipHost).toBeInstanceOf(HTMLElement);
      await expect(tooltipHost?.shadowRoot?.textContent).toContain(
        "translated word",
      );

      const activateWithKey = async (key: "Enter" | " ") => {
        target.dispatchEvent(
          new KeyboardEvent("keydown", {
            key,
            bubbles: true,
            cancelable: true,
          }),
        );
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => requestAnimationFrame(resolve));
      };
      await activateWithKey("Enter");
      await expect(target).not.toHaveClass("selected");
      await activateWithKey("Enter");
      await expect(target).toHaveClass("selected");
      await activateWithKey(" ");
      await expect(target).not.toHaveClass("selected");
      await activateWithKey(" ");
      await expect(target).toHaveClass("selected");

      mountContainer = nextContainer;
      controller.updateMount();
      await expect(nextContainer.contains(tooltipHost)).toBe(true);

      outside.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, composed: true }),
      );
      await expect(target).not.toHaveClass("selected");
      await expect(tooltipHost?.isConnected).toBe(false);
    } finally {
      subtitlesBlock.removeEventListener("click", controller.onActivate);
      subtitlesBlock.removeEventListener("keydown", controller.onActivate);
      globalThis.removeEventListener(
        "pointerdown",
        controller.onGlobalPointerDown,
      );
      controller.release();
      container.remove();
      nextContainer.remove();
      outside.remove();
    }
  },
};

export const TokenTranslationLanguage: Story = {
  args: emptyArgs,
  play: async ({ canvasElement }) => {
    const previousLanguage = settings.subtitlesTranslationLanguage;
    const previousMenuLanguage = localizationProvider.lang;
    const container = document.createElement("vot-block");
    const subtitlesBlock = document.createElement("vot-block");
    const words = ["hello", "world"].map((text) => {
      const word = document.createElement("span");
      word.dataset.votToken = "1";
      word.textContent = text;
      subtitlesBlock.append(word);
      return word;
    });
    container.append(subtitlesBlock);
    canvasElement.append(container);
    let resolveOldTranslation: ((value: string[]) => void) | undefined;
    const translateText = fn(
      async (text: string | string[], _from?: string, to?: string) => {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        if (to === "de") {
          return new Promise<string[]>((resolve) => {
            resolveOldTranslation = resolve;
          });
        }
        return Array.isArray(text)
          ? text.map((part) => `${to}: ${part}`)
          : `${to}: ${text}`;
      },
    );
    const controller = new TokenTooltipController({
      getContext: () => ({
        container,
        subtitlesContainer: subtitlesBlock,
        subtitlesBlock,
        subtitleLang: "en",
        subtitleMaxWidthPx: 640,
        tokenText: "hello world",
        suppressClicksUntil: 0,
      }),
      getTranslationService: () => Promise.resolve("test"),
      translateText,
    });
    let activation = Promise.resolve();
    const onClick = (event: MouseEvent) => {
      activation = controller.onActivate(event);
    };
    subtitlesBlock.addEventListener("click", onClick);
    const tooltipText = () =>
      container.querySelector("vot-shadow-host")?.shadowRoot?.textContent;

    try {
      localizationProvider.lang = "en";
      setSettings("subtitlesTranslationLanguage", "auto");
      words[0].click();
      await activation;
      await expect(translateText).toHaveBeenLastCalledWith(
        ["hello world", "hello"],
        "en",
        "en",
      );
      words[1].click();
      await activation;
      await expect(translateText).toHaveBeenLastCalledWith("world", "en", "en");

      setSettings("subtitlesTranslationLanguage", "ru");
      words[1].click();
      await activation;
      await expect(translateText).toHaveBeenLastCalledWith(
        ["hello world", "world"],
        "en",
        "ru",
      );
      await expect(tooltipText()).toContain("ru: hello world");
      await expect(tooltipText()).toContain("ru: world");
      await expect(localizationProvider.lang).toBe("en");
      words[0].click();
      await activation;
      await expect(translateText).toHaveBeenLastCalledWith("hello", "en", "ru");

      setSettings("subtitlesTranslationLanguage", "auto");
      localizationProvider.lang = "fr";
      words[0].click();
      await activation;
      await expect(translateText).toHaveBeenLastCalledWith(
        ["hello world", "hello"],
        "en",
        "fr",
      );

      localizationProvider.lang = "de";
      words[0].click();
      await waitFor(() => expect(resolveOldTranslation).toBeDefined());
      await expect(tooltipText()).not.toContain("fr: hello world");
      setSettings("subtitlesTranslationLanguage", "ru");
      resolveOldTranslation?.(["de: hello world", "de: hello"]);
      await activation;
      await expect(tooltipText()).not.toContain("de: hello");

      words[0].click();
      await activation;
      await expect(translateText).toHaveBeenLastCalledWith(
        ["hello world", "hello"],
        "en",
        "ru",
      );
      await expect(tooltipText()).toContain("ru: hello world");
    } finally {
      subtitlesBlock.removeEventListener("click", onClick);
      controller.release();
      container.remove();
      setSettings("subtitlesTranslationLanguage", previousLanguage);
      localizationProvider.lang = previousMenuLanguage;
    }
  },
};
