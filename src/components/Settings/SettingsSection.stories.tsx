import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { SettingsSection } from "./SettingsSection";

const meta = {
  component: SettingsSection,
} satisfies Meta<typeof SettingsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const SectionChildren = () => (
  <vot-block>
    Hello <b>World</b>!
  </vot-block>
);

export const SettingsSectionDefault: Story = {
  args: {
    title: "Settings Section",
    children: SectionChildren(),
  },
};

export const SettingsSectionDefaultOpened: Story = {
  args: {
    title: "Settings Section",
    children: SectionChildren(),
    isOpen: true,
  },
};
