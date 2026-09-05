import { createSignal, type Setter } from "solid-js";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { getDeepActiveElement } from "../../utils/dom";
import { RawButton } from "../Button/RawButton";
import { Dialog } from "./Dialog";

const onClose = fn();
let setDialogOpen: Setter<boolean> | undefined;
const meta = {
  component: Dialog,
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Dialog title",
    children: (
      <RawButton
        class="dialog-escape-handler"
        buttonProps={{
          onKeyDown: (event) => {
            if (event.key === "Escape") event.preventDefault();
          },
        }}
      >
        Dialog content
      </RawButton>
    ),
    isOpen: false,
    onClose,
  },
  render: (args) => {
    const [isOpen, setIsOpen] = createSignal(args.isOpen);
    setDialogOpen = setIsOpen;
    return (
      <Dialog
        {...args}
        isOpen={isOpen()}
        onClose={() => {
          setIsOpen(false);
          args.onClose();
        }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const focusHost = document.createElement("vot-block");
    const trigger = document.createElement("button");
    focusHost.attachShadow({ mode: "open" }).append(trigger);
    canvasElement.append(focusHost);
    trigger.focus();

    const overlay = canvasElement.querySelector<HTMLElement>(
      ".vot-dialog-container",
    );
    const dialog = canvasElement.querySelector<HTMLElement>("[role='dialog']");
    const closeButton = canvasElement.querySelector<HTMLElement>(
      ".vot-dialog-header-container > .vot-icon-button",
    );
    const escapeHandler = canvasElement.querySelector<HTMLElement>(
      ".dialog-escape-handler",
    );

    await expect(dialog).not.toBeNull();
    await expect(closeButton).not.toBeNull();
    await expect(escapeHandler).not.toBeNull();
    await expect(
      canvasElement.querySelector(".vot-dialog-footer-container"),
    ).toBeNull();
    await expect(dialog?.getAttribute("aria-labelledby")).toBe(
      dialog?.querySelector(".vot-dialog-title")?.id,
    );
    await expect(closeButton).toHaveAccessibleName();

    setDialogOpen?.(true);
    await waitFor(() =>
      expect(getDeepActiveElement(document)).toBe(closeButton),
    );
    escapeHandler?.focus();
    await userEvent.keyboard("{Escape}");
    await expect(overlay).not.toHaveAttribute("aria-hidden");

    setDialogOpen?.(false);
    await waitFor(() => expect(getDeepActiveElement(document)).toBe(trigger));

    setDialogOpen?.(true);
    await waitFor(() =>
      expect(getDeepActiveElement(document)).toBe(closeButton),
    );
    if (closeButton) {
      await userEvent.click(closeButton);
      await expect(onClose).toHaveBeenCalledOnce();
      await expect(overlay).toHaveAttribute("aria-hidden", "true");
      await expect(getDeepActiveElement(document)).toBe(trigger);
    }
  },
};
