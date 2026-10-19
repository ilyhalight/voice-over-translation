import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { AccountLogin } from "./AccountLogin";

const meta = {
  component: AccountLogin,
} satisfies Meta<typeof AccountLogin>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AccountLoginDefault: Story = {
  args: {
    // required because votStorage.isSupportOnlyLS is true in storybook
    disableExternalLogin: false,
  },
};
export const AccountLoginWithDisabledExternal: Story = {
  args: {
    disableExternalLogin: true,
  },
};
