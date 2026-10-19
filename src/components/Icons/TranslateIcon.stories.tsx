import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { TranslateIcon } from "./TranslateIcon";

const meta = {
  component: TranslateIcon,
  render: (args) => (
    <vot-block style="color: white">
      <TranslateIcon {...args} />
    </vot-block>
  ),
} satisfies Meta<typeof TranslateIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TranslateIconDefault: Story = {
  args: {},
};

export const TranslateIconLoading: Story = {
  args: {
    loading: true,
  },
};
