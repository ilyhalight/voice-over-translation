import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { Switch } from "./Switch";

const meta = {
  component: Switch,
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SwitchDefault: Story = {};
export const SwitchChecked: Story = {
  args: {
    checked: true,
  },
};

export const SwitchDisabled: Story = {
  args: {
    disabled: true,
  },
};
export const SwitchCheckedDisabled: Story = {
  args: {
    disabled: true,
    checked: true,
  },
};

export const SwitchWithHeading: Story = {
  args: {
    heading: "Translate videos automatically",
  },
};

export const SwitchWithDescription: Story = {
  args: {
    heading: "Translate videos automatically",
    description: "Start translation when a supported video begins playing",
  },
};

export const SwitchOnlyWithDescription: Story = {
  args: {
    description: "Start translation when a supported video begins playing",
  },
};

export const SwitchWithDescriptionDisabled: Story = {
  args: {
    heading: "Translate videos automatically",
    description: "Start translation when a supported video begins playing",
    disabled: true,
  },
};
