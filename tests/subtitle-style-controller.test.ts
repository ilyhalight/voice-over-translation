import { expect, test } from "bun:test";

Object.assign(globalThis, { DEBUG_MODE: false });
const { SubtitleStyleController } = await import(
  "../src/subtitles/subtitleStyleController"
);

test("subtitle style settings survive attachment and avoid duplicate writes", () => {
  const values = new Map<string, string>();
  const style = {
    setProperty: (name: string, value: string) => values.set(name, value),
    removeProperty: (name: string) => values.delete(name),
  } as unknown as CSSStyleDeclaration;
  let changes = 0;
  const controller = new SubtitleStyleController({
    onStyleChange: () => {
      changes += 1;
    },
    onFontLoaded: () => {},
  });

  controller.setOpacity(25);
  controller.setFontSize(28);
  controller.setSmartLayout(false);
  controller.attach({ style } as unknown as HTMLElement);

  expect(values.get("--vot-subtitles-opacity")).toBe("0.75");
  expect(values.get("--vot-subtitles-font-size")).toBe("28px");
  const changesAfterAttach = changes;
  controller.setOpacity(25);
  expect(changes).toBe(changesAfterAttach);

  controller.applyScaleCompensation(0.5);
  expect(values.get("--vot-subtitles-scale-compensation")).toBe("2.000");
  controller.applyScaleCompensation(1);
  expect(values.has("--vot-subtitles-scale-compensation")).toBe(false);
});
