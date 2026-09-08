import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { AccountMenu } from "./AccountMenu";

const meta = {
  component: AccountMenu,
} satisfies Meta<typeof AccountMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AccountMenuDefault: Story = {};
