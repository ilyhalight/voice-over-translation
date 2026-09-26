import type { Preview } from "storybook-solidjs-vite";
import "./storybook.scss";
import "../src/components/global.scss";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    backgrounds: {
      options: {
        dark: { name: "Dark", value: "rgb(32, 33, 36)" },
        light: { name: "Light", value: "#F7F9F2" },
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
  tags: ["autodocs"],
  initialGlobals: {
    backgrounds: { value: "dark" },
  },
};

export default preview;
