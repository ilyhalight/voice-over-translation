import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { DetailsButton } from "./DetailsButton";

const meta = {
  component: DetailsButton,
} satisfies Meta<typeof DetailsButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DetailsButtonDefault: Story = {
  args: {
    children: "Details",
  },
};
export const DetailsButtonDisabled: Story = {
  args: {
    disabled: true,
    children: "Details",
  },
};
