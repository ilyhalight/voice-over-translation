import { createSignal } from "solid-js";
import { expect, userEvent, waitFor } from "storybook/test";
import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { Dialog } from "../Dialog/Dialog";
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
    disabled: true,
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

export const SelectWithDisabledSelected: Story = {
  args: {
    title: "Select something",
    options: selectOptions,
    selectedValue: 3,
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
    const trigger =
      canvasElement.querySelector<HTMLElement>(".vot-select-outer");
    const popup =
      canvasElement.ownerDocument.querySelector<HTMLElement>(
        ".vot-select-inner",
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

    const select = trigger.closest<HTMLElement>(".vot-select");
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

export const SelectInShadowPortal: Story = {
  args: {
    title: "Select something",
    isOpen: true,
    options: selectOptions,
  },
  render: (args) => {
    const portalHost = document.createElement("vot-select-portal");
    const portal = portalHost.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      .vot-select-inner { position: fixed; display: block; padding: 8px; background: white; color: black; }
      .vot-select-inner__option { display: block; padding: 8px; }
    `;
    portal.append(style);

    return (
      <vot-block style="display: flex; gap: 16px; align-items: start;">
        <vot-block
          class="portal-clipped"
          style="height: 36px; width: 180px; overflow: hidden; contain: paint; border: 1px solid;"
        >
          <Select {...args} mount={() => portal} />
        </vot-block>
        {portalHost}
      </vot-block>
    );
  },
  play: async ({ canvasElement }) => {
    const trigger =
      canvasElement.querySelector<HTMLElement>(".vot-select-outer");
    await expect(trigger).not.toBeNull();
    if (!trigger) return;

    const popupId = trigger.getAttribute("aria-controls");
    const portal = canvasElement.querySelector("vot-select-portal")?.shadowRoot;
    const popup = popupId ? portal?.getElementById(popupId) : null;
    await expect(popup).not.toBeNull();
    if (!popup) return;

    const option = popup.querySelector<HTMLElement>(
      ".vot-select-inner__option",
    );
    await expect(option).toHaveTextContent("Option 1");
    const clippedContainer =
      canvasElement.querySelector<HTMLElement>(".portal-clipped");
    await expect(clippedContainer).not.toBeNull();
    if (!option || !clippedContainer) return;

    await waitFor(() => {
      expect(popup.getRootNode()).toBe(portal);
      const optionRect = option.getBoundingClientRect();
      expect(optionRect.height).toBeGreaterThan(0);
      expect(optionRect.top).toBeGreaterThanOrEqual(0);
      expect(optionRect.bottom).toBeLessThanOrEqual(window.innerHeight);
      expect(optionRect.top).toBeGreaterThan(
        clippedContainer.getBoundingClientRect().bottom,
      );
    });
  },
};

export const SelectWithSearch: Story = {
  args: {
    title: "Select something",
    options: selectOptions,
    search: true,
  },
};

export const SelectEscapeInDialog: Story = {
  args: {
    title: "Select something",
    options: selectOptions,
  },
  render: () => {
    const [isDialogOpen, setIsDialogOpen] = createSignal(true);

    return (
      <Dialog
        title="Select Escape regression"
        isOpen={isDialogOpen()}
        onClose={() => setIsDialogOpen(false)}
      >
        <Select title="Select something" options={selectOptions} search />
      </Dialog>
    );
  },
  play: async ({ canvasElement }) => {
    const dialog = canvasElement.querySelector<HTMLElement>(
      ".vot-dialog-container",
    );
    const trigger =
      canvasElement.querySelector<HTMLElement>(".vot-select-outer");
    await expect(dialog).not.toBeNull();
    await expect(trigger).not.toBeNull();
    if (!dialog || !trigger) return;

    await userEvent.click(trigger);
    const popup = dialog.querySelector<HTMLElement>(".vot-select-inner");
    const search = popup?.querySelector<HTMLInputElement>("input");
    await expect(popup).not.toBeNull();
    await expect(search).not.toBeNull();
    if (!popup || !search) return;

    search.focus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(popup).toHaveAttribute("hidden");
    });
    await expect(dialog).not.toHaveAttribute("aria-hidden", "true");
    await expect(document.activeElement).toBe(trigger);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(dialog).toHaveAttribute("aria-hidden", "true");
    });
  },
};

export const SelectLoading: Story = {
  args: {
    title: "Select something",
    options: selectOptions,
    isOpen: true,
    loading: true,
  },
  play: async () => {
    const listbox = document.querySelector('[role="listbox"]');
    const loader = document.querySelector(
      '.vot-select-inner__no-options[data-searching="true"]',
    );

    await expect(listbox).toHaveAttribute("aria-busy", "true");
    await expect(loader).not.toBeNull();
  },
};

export const SelectStaysOpenWhenOptionsChange: Story = {
  args: {
    title: "Select something",
    options: selectOptions,
  },
  render: () => {
    const [options, setOptions] = createSignal(selectOptions);

    return (
      <Select
        title="Select something"
        options={options()}
        onOpen={() => {
          queueMicrotask(() => {
            setOptions([
              ...selectOptions,
              { label: "Loaded option", value: "loaded" },
            ]);
          });
        }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const trigger =
      canvasElement.querySelector<HTMLElement>(".vot-select-outer");
    const popup = canvasElement.querySelector<HTMLElement>(".vot-select-inner");

    await expect(trigger).not.toBeNull();
    await expect(popup).not.toBeNull();
    if (!trigger || !popup) return;

    await userEvent.click(trigger);
    await waitFor(() => {
      expect(popup).not.toHaveAttribute("hidden");
      expect(popup).toHaveTextContent("Loaded option");
    });
  },
};

export const SelectWithSearchWithCustomProvider: Story = {
  args: {
    title: "Select something",
    options: selectOptions,
    search: true,
    searchItemsProvider: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return [
        {
          label: "123",
          value: 123,
        },
      ];
    },
  },
  play: async ({ canvasElement }) => {
    const trigger =
      canvasElement.querySelector<HTMLElement>(".vot-select-outer");
    await expect(trigger).not.toBeNull();
    if (!trigger) {
      return;
    }

    await userEvent.click(trigger);

    const popupId = trigger.getAttribute("aria-controls");
    const popup = popupId
      ? canvasElement.ownerDocument.getElementById(popupId)
      : null;
    await expect(popup).not.toBeNull();
    if (!popup) {
      return;
    }

    await waitFor(() => expect(popup.style.top).not.toBe(""));
    const triggerRect = trigger.getBoundingClientRect();
    const initialPopupRect = popup.getBoundingClientRect();
    const initiallyOpensBelow = initialPopupRect.top >= triggerRect.bottom;
    const initialAnchorEdge = initiallyOpensBelow
      ? initialPopupRect.top
      : initialPopupRect.bottom;

    const input = canvasElement.ownerDocument.querySelector<HTMLInputElement>(
      ".vot-select-inner input",
    );
    await expect(input).not.toBeNull();
    if (!input) {
      return;
    }

    await userEvent.type(input, "123");

    let providerOption: HTMLElement | null = null;
    await waitFor(() => {
      providerOption =
        Array.from(
          canvasElement.ownerDocument.querySelectorAll<HTMLElement>(
            ".vot-select-inner__option",
          ),
        ).find((option) => option.textContent === "123") ?? null;
      expect(providerOption).not.toBeNull();
    });

    await waitFor(() => {
      const popupRect = popup.getBoundingClientRect();
      const opensBelow = popupRect.top >= triggerRect.bottom;
      const anchorEdge = opensBelow ? popupRect.top : popupRect.bottom;
      expect(opensBelow).toBe(initiallyOpensBelow);
      expect(Math.abs(anchorEdge - initialAnchorEdge)).toBeLessThanOrEqual(1);
      expect(popupRect.height).toBeLessThan(initialPopupRect.height);
    });

    if (!providerOption) {
      return;
    }

    await userEvent.click(providerOption);
    await expect(trigger).toHaveTextContent("123");
  },
};

export const SelectMultiple: Story = {
  args: {
    title: "Select something",
    options: selectOptions,
    multiple: true,
  },
};

export const SelectMultipleWithZeroSelected: Story = {
  args: {
    title: "None",
    options: selectOptions,
    multiple: true,
    minSelected: 0,
  },
};

export const SelectMultipleWithManySelected: Story = {
  args: {
    title: "None",
    options: selectOptions,
    multiple: true,
    selectedValues: [true, "two"],
    minSelected: 0,
  },
};
