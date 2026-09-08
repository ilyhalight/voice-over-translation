import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { Textfield } from "./Textfield";

const meta = {
  component: Textfield,
} satisfies Meta<typeof Textfield>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextfieldDefault: Story = {
  args: {
    labelText: "Message",
  },
};

export const TextfieldWithOnInput: Story = {
  args: {
    labelText: "Message",
    onInput: (value) => {
      alert(value);
    },
  },
};

export const TextfieldDisabled: Story = {
  args: {
    labelText: "Message",
    disabled: true,
    onInput: () => {
      alert("you shouldn't see this");
    },
  },
};

export const TextfieldWithPlaceholder: Story = {
  args: {
    labelText: "Message",
    placeholder: "Enter your text here",
  },
};

export const TextfieldMultiline: Story = {
  args: {
    labelText: "Message",
    multiline: true,
  },
};

export const TextfieldMultilineDisabled: Story = {
  args: {
    labelText: "Message",
    multiline: true,
    disabled: true,
  },
};
