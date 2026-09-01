import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { PreviewSegmentedButton } from "./PreviewSegmentedButton";

const meta = {
  component: PreviewSegmentedButton,
  render: (args) => (
    <vot-block style="display: flex;background: gray;padding: 20px 200px 200px;">
      <PreviewSegmentedButton {...args} />
    </vot-block>
  ),
} satisfies Meta<typeof PreviewSegmentedButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PreviewSegmentedButtonDefault: Story = {
  args: {
    labelText: "Translate",
  },
};

export const PreviewSegmentedButtonError: Story = {
  args: {
    labelText: "Failed to translate",
    status: "error",
  },
};

export const PreviewSegmentedButtonSuccess: Story = {
  args: {
    labelText: "Live voices",
    status: "success",
  },
};

export const PreviewSegmentedButtonWithPip: Story = {
  args: {
    labelText: "Translate",
    showPipButton: true,
  },
};

export const PreviewSegmentedButtonWithActiveSubs: Story = {
  args: {
    labelText: "Translate",
    isSubtitlesActive: true,
  },
};

export const PreviewSegmentedButtonLoading: Story = {
  args: {
    labelText: "Translate",
    isLoading: true,
  },
};

export const PreviewSegmentedButtonAsColumn: Story = {
  args: {
    labelText: "Translate",
    direction: "column",
  },
  render: (args) => (
    <vot-block style="display: flex;background: gray;padding: 200px;padding-left: 20px;">
      <PreviewSegmentedButton {...args} />
    </vot-block>
  ),
};
