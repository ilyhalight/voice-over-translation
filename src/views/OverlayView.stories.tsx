import { expect, fn, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { setSettings, settings } from "../stores/settings";
import { OverlayView, type OverlayViewControls } from "./OverlayView";

const onSettingsClick = fn();
let defaultControls: OverlayViewControls | undefined;
let smallLayoutControls: OverlayViewControls | undefined;

const meta = {
  component: OverlayView,
  render: (args) => (
    <div style="display: flex;padding: 20px 200px 200px;height: 90vh;">
      <OverlayView
        {...args}
        baseOpacity={1}
        controlsRef={(controls) => (defaultControls = controls)}
      />
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
    onSettingsClick,
  },
  play: async ({ canvasElement }) => {
    const menuButton = canvasElement.querySelector<HTMLElement>(
      "[aria-haspopup='dialog']",
    );
    const quickMenu = canvasElement.querySelector<HTMLElement>(
      ".vot-overlay__segmented-button-menu",
    );
    const settingsButton = canvasElement.querySelector<HTMLElement>(
      ".vot-segmented-button__menu-header .vot-icon-button",
    );

    defaultControls?.setContainerSize(800, 450);
    await expect(menuButton).not.toBeNull();
    if (menuButton) await userEvent.click(menuButton);
    await expect(quickMenu).not.toHaveAttribute("aria-hidden");
    await expect(
      quickMenu?.style.getPropertyValue("--vot-container-height"),
    ).toMatch(/px$/u);
    await expect(settingsButton).not.toBeNull();
    if (settingsButton) await userEvent.click(settingsButton);
    await expect(onSettingsClick).toHaveBeenCalledOnce();
    await expect(quickMenu).toHaveAttribute("aria-hidden", "true");
  },
};

export const SmallVideoLayout: Story = {
  render: (args) => (
    <vot-block style="position:relative;width:800px;height:450px;">
      <OverlayView
        {...args}
        baseOpacity={1}
        controlsRef={(controls) => (smallLayoutControls = controls)}
      />
    </vot-block>
  ),
  play: async ({ canvasElement }) => {
    const buttonOverlay = canvasElement.querySelector<HTMLElement>(
      ".vot-overlay__segmented-button",
    );

    setSettings("buttonPos", "left");
    smallLayoutControls?.setContainerSize(400, 300);
    expect(buttonOverlay).toHaveAttribute("data-position", "default");

    smallLayoutControls?.setContainerSize(700, 450);
    expect(buttonOverlay).toHaveAttribute("data-position", "left");
    setSettings("buttonPos", "default");
  },
};
