import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { SegmentedButton } from "./SegmentedButton";

const meta = {
  component: SegmentedButton,
  render: (args) => (
    <div style="display: flex;background: gray;padding: 20px 200px 200px;">
      <SegmentedButton {...args} />
    </div>
  ),
} satisfies Meta<typeof SegmentedButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SegmentedButtonDefault: Story = {
  args: {
    labelText: "Translate",
  },
};

export const SegmentedButtonError: Story = {
  args: {
    labelText: "Failed to translate",
    status: "error",
  },
};

export const SegmentedButtonSuccess: Story = {
  args: {
    labelText: "Live voices",
    status: "success",
  },
};

export const SegmentedButtonWithPip: Story = {
  args: {
    labelText: "Translate",
    showPipButton: true,
  },
};

export const SegmentedButtonWithActiveSubs: Story = {
  args: {
    labelText: "Translate",
    isSubtitlesActive: true,
  },
};

export const SegmentedButtonLoading: Story = {
  args: {
    labelText: "Translate",
    isLoading: true,
  },
};

export const SegmentedButtonAsColumn: Story = {
  args: {
    labelText: "Translate",
    direction: "column",
    tooltipPos: "right",
  },
  render: (args) => (
    <div style="display: flex;background: gray;padding: 200px;padding-left: 20px;">
      <SegmentedButton {...args} />
    </div>
  ),
};
