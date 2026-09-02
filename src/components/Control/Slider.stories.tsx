import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { Slider } from "./Slider";

const meta = {
  component: Slider,
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SliderDefault: Story = {
  args: {},
};

export const SliderDiffStep: Story = {
  args: {
    step: 10,
  },
};

export const SliderDisabled: Story = {
  args: {
    disabled: true,
  },
};
