import { expect } from "storybook/test";
import type { Meta, StoryObj } from "storybook-solidjs-vite";

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

export const Lifecycle: Story = {
  args: {
    parts: [],
    lang: "",
    onClick: () => {},
    ref: () => {},
  },
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
  args: {
    parts: [],
    lang: "",
    onClick: () => {},
    ref: () => {},
  },
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
      disconnect(): void {}
      observe(target: Element): void {
        observed.push(target);
      }
      unobserve(target: Element): void {
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
