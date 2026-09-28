import { createSignal, Show } from "solid-js";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { t } from "../../localization/localizationProvider";
import type { Status } from "../../types/components/votButton";
import { SegmentedButton } from "./SegmentedButton";
import { SegmentedButtonOverlay } from "./SegmentedButtonOverlay";

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

export const SegmentedButtonLongLabel: Story = {
  args: {
    labelText: t("translateVideo").repeat(15),
    showPipButton: true,
  },
  render: (args) => (
    <vot-block style="position: relative; width: 240px; max-width: 100%; height: 130px; background: gray;">
      <SegmentedButtonOverlay
        labelText={args.labelText}
        showPipButton={args.showPipButton}
        position="default"
      />
    </vot-block>
  ),
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLElement>(
      ".vot-overlay__segmented-button",
    )?.parentElement;
    const button = container?.querySelector<HTMLElement>(
      ".vot-segmented-button",
    );
    const label = container?.querySelector<HTMLElement>(".vot-segment-label");
    const menu = container?.querySelector<HTMLElement>(
      '.vot-segment-only-icon[aria-haspopup="dialog"]',
    );

    expect(container).toBeDefined();
    expect(button).toBeDefined();
    expect(label).toBeDefined();
    expect(menu).toBeDefined();
    if (!container || !button || !label || !menu) return;

    expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(
      container.getBoundingClientRect().right + 1,
    );
    expect(menu.getBoundingClientRect().right).toBeLessThanOrEqual(
      button.getBoundingClientRect().right + 1,
    );
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
  },
};

export const SegmentedButtonLongTooltip: Story = {
  args: {
    labelText: t("translateVideo").repeat(24),
    direction: "column",
    tooltipPos: "right",
    status: "error",
    onTranslateClick: fn(),
  },
  render: (args) => {
    const [root, setRoot] = createSignal<HTMLElement>();

    return (
      <vot-block
        ref={setRoot}
        style="position: relative; width: 180px; height: 180px; overflow: hidden;"
      >
        <Show when={root()}>
          {(element) => <SegmentedButton {...args} layoutRoot={element()} />}
        </Show>
      </vot-block>
    );
  },
  play: async ({ args, canvasElement }) => {
    const target = canvasElement.querySelector<HTMLElement>(
      ".vot-translate-button",
    );
    expect(target).not.toBeNull();
    if (!target) return;

    await userEvent.hover(target);
    await waitFor(() => {
      const tooltip = canvasElement.querySelector<HTMLElement>(".vot-tooltip");
      expect(tooltip?.style.opacity).toBe("1");
    });

    const tooltip = canvasElement.querySelector<HTMLElement>(".vot-tooltip");
    expect(tooltip).not.toBeNull();
    expect(tooltip && getComputedStyle(tooltip).pointerEvents).toBe("none");
    expect(tooltip?.getBoundingClientRect().right).toBeLessThanOrEqual(
      canvasElement.getBoundingClientRect().right + 1,
    );
    expect(tooltip?.scrollWidth).toBeLessThanOrEqual(tooltip?.clientWidth ?? 0);
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip?.getBoundingClientRect();
    expect(
      tooltipRect &&
        (tooltipRect.right <= targetRect.left ||
          tooltipRect.left >= targetRect.right),
    ).toBe(true);
    const hit = canvasElement.ownerDocument.elementFromPoint(
      targetRect.left + targetRect.width / 2,
      targetRect.top + targetRect.height / 2,
    );
    expect(target.contains(hit)).toBe(true);
    await userEvent.click(target);
    expect(args.onTranslateClick).toHaveBeenCalled();
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
    labelText: t("translateVideo"),
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

const playColumnTouchVoiceSelection = (canvasElement: HTMLElement) => {
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
  return {
    translateButton,
    popover,
  };
};

export const SegmentedButtonColumnTouchVoiceSelection: Story = {
  args: {
    direction: "column",
    labelText: t("translateVideo"),
    onTranslateClick: fn(),
  },
  play: ({ args, canvasElement }) => {
    const { popover } = playColumnTouchVoiceSelection(canvasElement);
    expect(args.onTranslateClick).not.toHaveBeenCalled();
    expect(popover?.hidden).toBe(false);
  },
};

export const SegmentedButtonColumnTouchError: Story = {
  args: {
    direction: "column",
    labelText: t("translateVideo"),
    onTranslateClick: fn(),
    status: "error",
  },
  play: ({ args, canvasElement }) => {
    const { popover } = playColumnTouchVoiceSelection(canvasElement);
    expect(args.onTranslateClick).toHaveBeenCalledTimes(1);
    expect(popover?.hidden).not.toBe(false);
  },
};
