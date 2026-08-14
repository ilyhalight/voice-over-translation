import { expect } from "storybook/test";
import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { IconButton } from "./IconButton";

const meta = {
  component: IconButton,
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const IconTemplate = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 16 16"
  >
    <path
      fill="currentColor"
      fill-rule="evenodd"
      d="M7.199 2H8.8a.2.2 0 0 1 .2.2c0 1.808 1.958 2.939 3.524 2.034a.2.2 0 0 1 .271.073l.802 1.388a.2.2 0 0 1-.073.272c-1.566.904-1.566 3.164 0 4.069a.2.2 0 0 1 .073.271l-.802 1.388a.2.2 0 0 1-.271.073C10.958 10.863 9 11.993 9 13.8a.2.2 0 0 1-.199.2H7.2a.2.2 0 0 1-.2-.2c0-1.808-1.958-2.938-3.524-2.034a.2.2 0 0 1-.272-.073l-.8-1.388a.2.2 0 0 1 .072-.271c1.566-.905 1.566-3.165 0-4.07a.2.2 0 0 1-.073-.27l.801-1.389a.2.2 0 0 1 .272-.072C5.042 5.138 7 4.007 7 2.199c0-.11.089-.199.199-.199M5.5 2.2c0-.94.76-1.7 1.699-1.7H8.8c.94 0 1.7.76 1.7 1.7a.85.85 0 0 0 1.274.735a1.7 1.7 0 0 1 2.32.622l.802 1.388c.469.813.19 1.851-.622 2.32a.85.85 0 0 0 0 1.472a1.7 1.7 0 0 1 .622 2.32l-.802 1.388a1.7 1.7 0 0 1-2.32.622a.85.85 0 0 0-1.274.735c0 .939-.76 1.7-1.699 1.7H7.2a1.7 1.7 0 0 1-1.699-1.7a.85.85 0 0 0-1.274-.735a1.7 1.7 0 0 1-2.32-.622l-.802-1.388a1.7 1.7 0 0 1 .622-2.32a.85.85 0 0 0 0-1.471a1.7 1.7 0 0 1-.622-2.32l.801-1.389a1.7 1.7 0 0 1 2.32-.622A.85.85 0 0 0 5.5 2.2m4 5.8a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0M11 8a3 3 0 1 1-6 0a3 3 0 0 1 6 0"
      clip-rule="evenodd"
    />
  </svg>
);

export const IconButtonDefault: Story = {
  args: {
    ariaLabel: "Settings",
    children: IconTemplate(),
  },
  play: async ({ canvasElement }) => {
    // check svg renderer
    const svg = canvasElement.querySelector(".vot-icon-button svg");
    const path = svg?.querySelector("path");

    await expect(svg).toBeInstanceOf(SVGSVGElement);
    await expect(path).toBeInstanceOf(SVGPathElement);
    await expect(svg?.getBoundingClientRect().width).toBeGreaterThan(0);
    await expect(svg?.getBoundingClientRect().height).toBeGreaterThan(0);
  },
};

export const IconButtonWithOnClick: Story = {
  args: {
    ariaLabel: "Settings",
    children: IconTemplate(),
    onClick: () => {
      alert("hi");
    },
  },
};

export const IconButtonDisabled: Story = {
  args: {
    ariaLabel: "Settings",
    children: IconTemplate(),
    disabled: true,
    onClick: () => {
      alert("you shouldn't see this");
    },
  },
};

export const IconButtonHidden: Story = {
  args: {
    ariaLabel: "Settings",
    children: IconTemplate(),
    hidden: true,
  },
};
