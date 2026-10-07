import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { OrBlock } from "./OrBlock";

const meta = {
  component: OrBlock,
} satisfies Meta<typeof OrBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OrBlockDefault: Story = {
  args: {
    children: <vot-block>hello world</vot-block>,
  },
};
