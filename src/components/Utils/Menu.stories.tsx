import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { Menu } from "./Menu";

const meta = {
  component: Menu,
  render: (args) => (
    <div style="display: flex;background: gray;padding: 20px 200px 200px;">
      <Menu {...args} />
    </div>
  ),
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MenuDefault: Story = {
  args: {
    title: "Settings",
    children: <div>hello world</div>,
  },
};

export const MenuWithHeaderAndFooter: Story = {
  args: {
    title: "Settings",
    children: <div>hello world</div>,
    headerChildren: "header",
    footerChildren: "footer",
  },
};
