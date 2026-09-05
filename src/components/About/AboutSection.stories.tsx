import type { Meta, StoryObj } from "storybook-solidjs-vite";

import { AboutSection } from "./AboutSection";

const meta = {
  component: AboutSection,
} satisfies Meta<typeof AboutSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AboutSectionDefault: Story = {
  args: {},
};
