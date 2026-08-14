import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { SettingsContent } from "./SettingsContent";

const meta = {
  component: SettingsContent,
} satisfies Meta<typeof SettingsContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SettingsContentDefault: Story = {
  args: {},
};
