import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { SliderLabel } from "./SliderLabel";

const meta = {
  component: SliderLabel,
} satisfies Meta<typeof SliderLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SliderLabelDefault: Story = {
  args: {
    children: "Auto Hide Button Delay",
    value: "50",
  },
};

export const SliderLabelDisabled: Story = {
  args: {
    children: "Auto Hide Button Delay",
    value: "50",
    disabled: true,
  },
};

export const SliderLabelWithSuperLongTitle: Story = {
  args: {
    children:
      "lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    value: "50",
  },
};
