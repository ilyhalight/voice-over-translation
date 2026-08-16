import { expect, userEvent, waitFor } from "storybook/test";
import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { Select, type SelectOption } from "./Select";

const meta = {
  component: Select,
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const selectOptions: SelectOption[] = [
  {
    label: "Option 1",
    value: true,
  },
  {
    label: "Option 2",
    value: "two",
  },
  {
    label: "Option 3",
    value: 3,
  },
];

const positioningOptions: SelectOption[] = Array.from(
  { length: 12 },
  (_, index) => ({
    label: `Option ${index + 1}`,
    value: index + 1,
  }),
);

export const SelectDefault: Story = {
  args: {
    title: "Select something",
    options: selectOptions,
  },
};

export const SelectWithSelected: Story = {
  args: {
    title: "Select something",
    options: selectOptions,
    selectedValue: "two",
  },
};

export const SelectDisabled: Story = {
  args: {
    title: "Select something",
    disabled: true,
    options: selectOptions,
  },
};

export const SelectNearViewportBottom: Story = {
  args: {
    title: "Select something",
    isOpen: true,
    options: positioningOptions,
  },
  render: (args) => (
    <vot-block
      style={{
        position: "fixed",
        "inset-block-end": "16px",
        "inset-inline-end": "16px",
      }}
    >
      <Select {...args} />
    </vot-block>
  ),
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector<HTMLElement>(
      ".vot-select_new-outer",
    );
    const popup = canvasElement.ownerDocument.querySelector<HTMLElement>(
      ".vot-select_new-inner",
    );

    await expect(trigger).not.toBeNull();
    await expect(popup).not.toBeNull();
    if (!trigger || !popup) {
      return;
    }

    await waitFor(() => {
      expect(popup.style.maxHeight).not.toBe("0px");
    });

    await userEvent.click(trigger);
    await waitFor(() => {
      expect(popup.hidden).toBe(true);
    });
    await userEvent.click(trigger);

    await waitFor(() => {
      const popupRect = popup.getBoundingClientRect();
      expect(popupRect.height).toBeGreaterThan(0);
      expect(popupRect.top).toBeGreaterThanOrEqual(0);
      expect(popupRect.bottom).toBeLessThanOrEqual(window.innerHeight);
    });

    await userEvent.click(trigger);
    await waitFor(() => {
      expect(popup.hidden).toBe(true);
    });

    const select = trigger.closest<HTMLElement>(".vot-select_new");
    await expect(select).not.toBeNull();
    if (!select?.parentNode) {
      return;
    }

    const originalParent = select.parentNode;
    const shadowHost =
      canvasElement.ownerDocument.createElement("vot-shadow-host");
    const shadowRoot = shadowHost.attachShadow({ mode: "open" });
    canvasElement.append(shadowHost);
    shadowRoot.append(select);

    await userEvent.click(trigger);
    await waitFor(() => {
      expect(popup.getRootNode()).toBe(shadowRoot);
    });

    shadowRoot.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expect(popup.hidden).toBe(true);
    });

    originalParent.append(select);
    canvasElement.ownerDocument.body.append(popup);
    shadowHost.remove();
  },
};
