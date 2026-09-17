import type { Meta, StoryObj } from "storybook-solidjs-vite";

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
