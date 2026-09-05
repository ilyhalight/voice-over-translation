import { fn } from "storybook/test";
import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { SettingsDialog } from "./SettingsDialog";

const meta = {
  component: SettingsDialog,
} satisfies Meta<typeof SettingsDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { isOpen: true, onClose: fn() },
};
