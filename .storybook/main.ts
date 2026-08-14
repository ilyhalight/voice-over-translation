import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "storybook-solidjs-vite";
import { mergeConfig, type PluginOption } from "vite";
import solidPlugin from "vite-plugin-solid";

const solidRendererPath = fileURLToPath(
  new URL("../src/ui/solid/renderer.ts", import.meta.url),
);

function isSolidPlugin(plugin: PluginOption): boolean {
  return (
    plugin !== false &&
    plugin != null &&
    typeof plugin === "object" &&
    "name" in plugin &&
    plugin.name === "solid"
  );
}

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-styling-webpack",
  ],
  framework: "storybook-solidjs-vite",
  viteFinal(viteConfig) {
    const plugins = (viteConfig.plugins ?? []).filter(
      (plugin) => !isSolidPlugin(plugin),
    );

    return mergeConfig(
      { ...viteConfig, plugins },
      {
        plugins: [
          solidPlugin({
            solid: {
              generate: "universal",
              moduleName: "vot-solid-renderer",
            },
          }),
        ],
        define: {
          DEBUG_MODE: true,
          GM_info: {},
        },
        resolve: {
          alias: {
            "vot-solid-renderer": solidRendererPath,
          },
        },
      },
    );
  },
};
export default config;
