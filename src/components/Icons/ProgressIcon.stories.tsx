import { createSignal, onCleanup } from "solid-js";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { ProgressIcon } from "./ProgressIcon";

const meta = {
  component: ProgressIcon,
  render: (args) => (
    <vot-block style="display: flex;color:#fff;font-size: 40px">
      <ProgressIcon {...args} />
    </vot-block>
  ),
} satisfies Meta<typeof ProgressIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProgressIconDefault: Story = {
  args: {},
};

export const ProgressIconQuater: Story = {
  args: {
    progress: 25,
  },
};

export const ProgressIconHalf: Story = {
  args: {
    progress: 50,
  },
};

export const ProgressIconThreeQuater: Story = {
  args: {
    progress: 75,
  },
};

export const ProgressIconChanging: Story = {
  render: () => {
    const [progress, setProgress] = createSignal(0);

    const intervalId = window.setInterval(() => {
      const nextProgress = Math.min(progress() + 0.1, 100);

      setProgress(nextProgress);

      if (nextProgress === 100) {
        window.clearInterval(intervalId);
      }
    }, 10);

    onCleanup(() => window.clearInterval(intervalId));

    return (
      <vot-block style="display: flex; color: #fff; font-size: 40px">
        <ProgressIcon progress={progress()} />
      </vot-block>
    );
  },
};
