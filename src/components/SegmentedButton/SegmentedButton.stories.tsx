import { createSignal } from "solid-js";
import { expect, fn, userEvent } from "storybook/test";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { localizationProvider } from "../../localization/localizationProvider";
import type { Status } from "../../types/components/votButton";
import { SegmentedButton } from "./SegmentedButton";

function dispatchPrimaryPointerUp(
  target: HTMLElement,
  pointerType: string,
): void {
  target.dispatchEvent(
    new PointerEvent("pointerup", {
      bubbles: true,
      button: 0,
      composed: true,
      isPrimary: true,
      pointerId: 1,
      pointerType,
    }),
  );
}

const meta = {
  component: SegmentedButton,
  render: (args) => (
    <vot-block style="display: flex;background: gray;padding: 20px 200px 200px;">
      <SegmentedButton {...args} />
    </vot-block>
  ),
} satisfies Meta<typeof SegmentedButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SegmentedButtonDefault: Story = {
  args: {
    labelText: "Translate",
  },
};

export const SegmentedButtonActiveVoiceTooltipDismissal: Story = {
  args: {
    labelText: "Translate",
  },
  play: async ({ canvasElement }) => {
    const document = canvasElement.ownerDocument;
    const trigger = canvasElement.querySelector<HTMLElement>(
      ".vot-dropdown-arrow",
    );
    expect(trigger).not.toBeNull();
    if (!trigger) {
      return;
    }

    await userEvent.click(trigger);
    const activeVoice = document.querySelector<HTMLElement>(
      ".vot-voice-popover__item--active",
    );
    expect(activeVoice).not.toBeNull();
    if (!activeVoice) {
      return;
    }

    let appearedBeforePositioning = false;
    const observer = new MutationObserver(() => {
      for (const tooltip of document.querySelectorAll<HTMLElement>(
        ".vot-tooltip",
      )) {
        if (tooltip.style.opacity === "1" && !tooltip.style.transform) {
          appearedBeforePositioning = true;
        }
      }
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
      childList: true,
      subtree: true,
    });

    try {
      await userEvent.click(activeVoice);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const popover = document.querySelector<HTMLElement>(".vot-voice-popover");
      const hasVisibleTooltip = Array.from(
        document.querySelectorAll<HTMLElement>(".vot-tooltip"),
      ).some((tooltip) => tooltip.style.opacity === "1");

      expect(popover?.hidden).toBe(true);
      expect(hasVisibleTooltip).toBe(false);
      expect(appearedBeforePositioning).toBe(false);
    } finally {
      observer.disconnect();
    }
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

export const SegmentedButtonAsColumn: Story = (() => {
  const [labelText, setLabelText] = createSignal("Translate");
  const [status, setStatus] = createSignal<Status>("none");

  return {
    args: {
      labelText: labelText(),
      status: status(),
      direction: "column",
      tooltipPos: "right",
      onTranslateClick: () => {
        console.log("test");
        if (status() === "none") {
          setStatus("error");
          setLabelText("Failed to translate");
        } else {
          setStatus("none");
          setLabelText("Translate");
        }
      },
    },
    render: (args) => (
      <vot-block style="display: flex;background: gray;padding: 200px;padding-left: 20px;">
        <SegmentedButton {...args} status={status()} labelText={labelText()} />
      </vot-block>
    ),
  };
})();

export const SegmentedButtonPrimaryAction: Story = {
  args: {
    labelText: localizationProvider.get("translateVideo"),
    onTranslateClick: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const translateButton = canvasElement.querySelector<HTMLElement>(
      ".vot-translate-button",
    );
    expect(translateButton).not.toBeNull();
    if (!translateButton) {
      return;
    }

    let bubbledClicks = 0;
    const handleClick = () => {
      bubbledClicks += 1;
    };
    canvasElement.addEventListener("click", handleClick);

    try {
      dispatchPrimaryPointerUp(translateButton, "mouse");
      translateButton.dispatchEvent(
        new MouseEvent("click", { bubbles: true, composed: true }),
      );
      expect(args.onTranslateClick).toHaveBeenCalledTimes(1);
      expect(bubbledClicks).toBe(0);

      translateButton.focus();
      await userEvent.keyboard("{Enter}");
      expect(args.onTranslateClick).toHaveBeenCalledTimes(2);
    } finally {
      canvasElement.removeEventListener("click", handleClick);
    }
  },
};

export const SegmentedButtonColumnTouchVoiceSelection: Story = {
  args: {
    direction: "column",
    labelText: localizationProvider.get("translateVideo"),
    onTranslateClick: fn(),
  },
  play: ({ args, canvasElement }) => {
    const translateButton = canvasElement.querySelector<HTMLElement>(
      ".vot-translate-button",
    );
    expect(translateButton).not.toBeNull();
    if (!translateButton) {
      return;
    }

    dispatchPrimaryPointerUp(translateButton, "touch");
    const popover =
      canvasElement.ownerDocument.querySelector<HTMLElement>(
        ".vot-voice-popover",
      );

    expect(args.onTranslateClick).not.toHaveBeenCalled();
    expect(popover?.hidden).toBe(false);
  },
};

export const SegmentedButtonColumnTouchError: Story = {
  args: {
    direction: "column",
    labelText: localizationProvider.get("translateVideo"),
    onTranslateClick: fn(),
    status: "error",
  },
  play: ({ args, canvasElement }) => {
    const translateButton = canvasElement.querySelector<HTMLElement>(
      ".vot-translate-button",
    );
    expect(translateButton).not.toBeNull();
    if (!translateButton) {
      return;
    }

    dispatchPrimaryPointerUp(translateButton, "touch");
    const popover =
      canvasElement.ownerDocument.querySelector<HTMLElement>(
        ".vot-voice-popover",
      );

    expect(args.onTranslateClick).toHaveBeenCalledTimes(1);
    expect(popover?.hidden).not.toBe(false);
  },
};
