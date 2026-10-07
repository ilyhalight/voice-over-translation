import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { SegmentedButtonMenu } from "./SegmentedButtonMenu";

const meta = {
  component: SegmentedButtonMenu,
  render: (args) => (
    <vot-block style="display: flex;background: gray;padding: 20px 200px 200px;">
      <SegmentedButtonMenu {...args} />
    </vot-block>
  ),
} satisfies Meta<typeof SegmentedButtonMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SegmentedButtonMenuDefault: Story = {
  args: {},
};

export const SegmentedButtonMenuWithTranslationSlider: Story = {
  args: {
    videoVolume: 50,
    showTranslationVolume: true,
    translationVolume: 75,
  },
};
