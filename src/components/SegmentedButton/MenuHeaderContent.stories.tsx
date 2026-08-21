import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { MenuHeaderContent } from "./SegmentedButtonMenu";

const meta = {
  component: MenuHeaderContent,
  render: (args) => (
    <div style="display: flex;padding: 20px 200px 200px;">
      <MenuHeaderContent {...args} />
    </div>
  ),
} satisfies Meta<typeof MenuHeaderContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MenuHeaderContentDefault: Story = {
  args: {},
};

export const MenuHeaderContentWithShowAll: Story = {
  args: {
    showDownloadSubtitles: true,
    showDownloadTranslation: true,
  },
};
