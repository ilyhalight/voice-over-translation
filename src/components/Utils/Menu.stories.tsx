import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { Menu } from "./Menu";

const meta = {
  component: Menu,
  render: (args) => (
    <vot-block style="display: flex;background: gray;padding: 20px 200px 200px;">
      <Menu {...args} />
    </vot-block>
  ),
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MenuDefault: Story = {
  args: {
    title: "Settings",
    children: <vot-block>hello world</vot-block>,
  },
};

export const MenuWithHeaderAndFooter: Story = {
  args: {
    title: "Settings",
    children: <vot-block>hello world</vot-block>,
    headerChildren: "header",
    footerChildren: "footer",
  },
};
