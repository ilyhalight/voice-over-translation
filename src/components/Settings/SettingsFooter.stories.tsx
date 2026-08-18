import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { SettingsFooter } from "./SettingsFooter";

const meta = {
  component: SettingsFooter,
} satisfies Meta<typeof SettingsFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SettingsFooterDefault: Story = {
  args: {},
};
