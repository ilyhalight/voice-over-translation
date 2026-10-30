import { createComponent, createSignal } from "solid-js";
import { expect } from "storybook/test";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { render } from "../../ui/solid/renderer";

import { Switch } from "./Switch";

const meta = {
  component: Switch,
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SwitchDefault: Story = {};
export const SwitchChecked: Story = {
  args: {
    checked: true,
  },
};

export const SwitchDisabled: Story = {
  args: {
    disabled: true,
  },
};
export const SwitchCheckedDisabled: Story = {
  args: {
    disabled: true,
    checked: true,
  },
};
export const SwitchHidden: Story = {
  args: {
    hidden: true,
    heading: "hidden",
    description: "you shouldn't see this",
  },
};
export const SwitchSub: Story = {
  args: {
    isSubSwitch: true,
    heading: "Translate videos automatically",
  },
};

export const SwitchWithHeading: Story = {
  args: {
    heading: "Translate videos automatically",
  },
};

export const SwitchWithDescription: Story = {
  args: {
    heading: "Translate videos automatically",
    description: "Start translation when a supported video begins playing",
  },
};

export const SwitchOnlyWithDescription: Story = {
  args: {
    description: "Start translation when a supported video begins playing",
  },
};

export const SwitchWithDescriptionDisabled: Story = {
  args: {
    heading: "Translate videos automatically",
    description: "Start translation when a supported video begins playing",
    disabled: true,
  },
};

export const DisabledPreservesSelection: Story = {
  play: async ({ canvasElement }) => {
    const host = document.createElement("vot-block");
    canvasElement.append(host);
    const [disabled, setDisabled] = createSignal(false);
    const dispose = render(
      () =>
        createComponent(Switch, {
          get disabled() {
            return disabled();
          },
        }) as Node,
      host,
    );
    try {
      const control = host.querySelector<HTMLInputElement>("input");
      control?.click();
      await expect(control).toBeChecked();
      setDisabled(true);
      await expect(control).toBeDisabled();
      await expect(control).toBeChecked();
      await expect(host.querySelector(".vot-switch-track")).toHaveAttribute(
        "data-checked",
        "true",
      );
      setDisabled(false);
      await expect(control).toBeEnabled();
      await expect(control).toBeChecked();
    } finally {
      dispose();
      host.remove();
    }
  },
};
