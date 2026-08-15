import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { Select, type SelectOption } from "./Select";

const meta = {
  component: Select,
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const selectOptions: SelectOption[] = [
  {
    label: "Option 1",
    value: true,
  },
  {
    label: "Option 2",
    value: "two",
  },
  {
    label: "Option 3",
    value: 3,
  },
];

export const SelectDefault: Story = {
  args: {
    title: "Select something",
    options: selectOptions,
  },
};

export const SelectDisabled: Story = {
  args: {
    title: "Select something",
    disabled: true,
    options: selectOptions,
  },
};
