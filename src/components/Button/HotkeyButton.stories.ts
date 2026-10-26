import { createComponent } from "solid-js";
import { expect, fn } from "storybook/test";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { render } from "../../ui/solid/renderer";

import { HotkeyButton } from "./HotkeyButton";

const meta = {
  component: HotkeyButton,
} satisfies Meta<typeof HotkeyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HotkeyButtonDefault: Story = {
  args: {
    key: null,
  },
};
export const HotkeyButtonDisabled: Story = {
  args: {
    disabled: true,
    key: null,
  },
};
export const HotkeyButtonWithChildren: Story = {
  args: {
    key: null,
    children: "Hotkey Label",
  },
};

export const RecordingCleanup: Story = {
  play: async ({ canvasElement }) => {
    const host = document.createElement("vot-block");
    canvasElement.append(host);
    const onChange = fn();
    const dispose = render(
      () => createComponent(HotkeyButton, { onChange }) as Node,
      host,
    );
    try {
      host.querySelector<HTMLElement>(".vot-hotkey-button")?.click();
      const pressed = new KeyboardEvent("keydown", {
        code: "KeyK",
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(pressed);
      await expect(pressed.defaultPrevented).toBe(true);
      dispose();

      const released = new KeyboardEvent("keyup", {
        code: "KeyK",
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(released);
      globalThis.dispatchEvent(new Event("blur"));
      await expect(released.defaultPrevented).toBe(false);
      await expect(onChange).not.toHaveBeenCalled();
    } finally {
      dispose();
      host.remove();
    }
  },
};
