import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { AccountInfo } from "./AccountInfo";

const meta = {
  component: AccountInfo,
} satisfies Meta<typeof AccountInfo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AccountInfoDefault: Story = {
  args: {
    avatarUrl:
      "https://avatars.yandex.net/get-yapic/0/0-0/islands-retina-middle",
    username: "unknown",
  },
};
