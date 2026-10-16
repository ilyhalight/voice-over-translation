import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { OutlinedButton } from "./OutlinedButton";

const meta = {
  component: OutlinedButton,
} satisfies Meta<typeof OutlinedButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OutlinedButtonDefault: Story = {
  args: {
    children: "Settings",
  },
};

export const OutlinedButtonWithOnClick: Story = {
  args: {
    children: "Settings",
    onClick: () => {
      alert("hi");
    },
  },
};

export const OutlinedButtonDisabled: Story = {
  args: {
    children: "Settings",
    disabled: true,
    onClick: () => {
      alert("you shouldn't see this");
    },
  },
};

export const OutlinedButtonHidden: Story = {
  args: {
    children: "Settings",
    hidden: true,
  },
};
