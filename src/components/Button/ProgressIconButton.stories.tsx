import { createSignal, onCleanup } from "solid-js";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { DownloadIcon } from "../Icons/DownloadIcon";
import { ProgressIconButton } from "./ProgressIconButton";

const meta = {
  component: ProgressIconButton,
  render: (args) => (
    <vot-block style="display: flex;color:#fff;font-size: 40px">
      <ProgressIconButton {...args} />
    </vot-block>
  ),
} satisfies Meta<typeof ProgressIconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProgressIconButtonDefault: Story = {
  args: {
    children: <DownloadIcon />,
    ariaLabel: "Download",
  },
};

export const ProgressIconButtonChanging: Story = {
  args: {
    children: <DownloadIcon />,
    ariaLabel: "Download",
  },
  render: (args) => {
    const [showProgress, setShowProgress] = createSignal(false);
    const [progress, setProgress] = createSignal(0);

    return (
      <vot-block style="display: flex; color: #fff; font-size: 40px">
        <ProgressIconButton
          {...args}
          showProgress={showProgress()}
          progress={progress()}
          onClick={() => {
            setShowProgress(true);

            const intervalId = window.setInterval(() => {
              const nextProgress = Math.min(progress() + 0.1, 100);

              setProgress(nextProgress);

              if (nextProgress === 100) {
                window.clearInterval(intervalId);
                setShowProgress(false);
              }
            }, 10);

            onCleanup(() => window.clearInterval(intervalId));
          }}
        >
          <DownloadIcon />
        </ProgressIconButton>
      </vot-block>
    );
  },
};
