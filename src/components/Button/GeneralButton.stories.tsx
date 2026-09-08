import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { GeneralButton } from "./GeneralButton";

const meta = {
  component: GeneralButton,
} satisfies Meta<typeof GeneralButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GeneralButtonDefault: Story = {
  args: {
    children: "Settings",
  },
};

export const GeneralButtonWithOnClick: Story = {
  args: {
    children: "Settings",
    onClick: () => {
      alert("hi");
    },
  },
};

export const GeneralButtonDisabled: Story = {
  args: {
    children: "Settings",
    disabled: true,
    onClick: () => {
      alert("you shouldn't see this");
    },
  },
};

export const GeneralButtonHidden: Story = {
  args: {
    children: "Settings",
    hidden: true,
  },
};
