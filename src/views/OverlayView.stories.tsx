import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { setSettings, settings } from "../stores/settings";
import { OverlayView } from "./OverlayView";

const meta = {
  component: OverlayView,
  render: (args) => (
    <div style="display: flex;padding: 20px 200px 200px;height: 90vh;">
      <OverlayView {...args} baseOpacity={1} />
      <button
        type="button"
        style="height:32px;"
        onClick={() => {
          setSettings(
            "buttonPos",
            settings.buttonPos === "default" ? "left" : "default",
          );
        }}
      >
        change direction
      </button>
    </div>
  ),
} satisfies Meta<typeof OverlayView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OverlayViewDefault: Story = {
  args: {
    onTranslateClick: () => {
      console.log("Translate clicked");
    },
  },
};
