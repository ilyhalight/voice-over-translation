import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { TextButton } from "./TextButton";

const meta = {
  component: TextButton,
} satisfies Meta<typeof TextButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextButtonDefault: Story = {
  args: {
    children: "Settings",
  },
};

export const IconButtonWithOnClick: Story = {
  args: {
    children: "Settings",
    onClick: () => {
      alert("hi");
    },
  },
};

export const IconButtonDisabled: Story = {
  args: {
    children: "Settings",
    disabled: true,
    onClick: () => {
      alert("you shouldn't see this");
    },
  },
};

export const IconButtonHidden: Story = {
  args: {
    children: "Settings",
    hidden: true,
  },
};
