import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import { defineConfig, type Plugin, type UserConfig } from "vite";
import { debugIdPlugin } from "./lib/debug-id";
import { type BuildConfig, buildDefine, getBuildConfig } from "./lib/env";
import {
  finalizeChromeBuild,
  getChromeExtensionBuildEnv,
} from "./lib/extension/chrome-postbuild";
import manifest from "./lib/extension/manifest.config";
import { DIST_EXT_DIR, SOURCEMAP_DIR } from "./lib/paths";
import { createBaseViteConfig } from "./lib/vite-base-config";

const BACKGROUND_ENTRY = "src/extension/background.ts";

function chromePackagePlugin(
  config: BuildConfig,
  headers: {
    version?: string;
    author?: string;
  },
): Plugin {
  return {
    name: "vot-chrome-package",
    apply: "build",
    enforce: "post",
    async closeBundle() {
      await finalizeChromeBuild(config, headers);
    },
  };
}

export default defineConfig(async ({ mode }) => {
  const buildConfig = getBuildConfig(mode);
  const baseConfig = createBaseViteConfig({ cacheName: "chrome-extension" });
  const { headers, locales, branch } =
    await getChromeExtensionBuildEnv(buildConfig);

  return {
    ...baseConfig,
    plugins: [
      ...(baseConfig.plugins ?? []),
      crx({
        manifest,
        contentScripts: {
          standaloneFiles: ["src/extension/bridge.ts"],
        },
      }),
      debugIdPlugin({
        variant: "chrome",
        registerChunk: ({ facadeModuleId }) =>
          !facadeModuleId?.endsWith(BACKGROUND_ENTRY),
        sourcemapDir: SOURCEMAP_DIR,
      }),
      chromePackagePlugin(buildConfig, headers),
    ],
    define: buildDefine({
      debug: false,
      isExtension: true,
      availableLocales: locales,
      repoBranch: branch,
      version: String(headers.version || ""),
      authors: String(headers.author || ""),
      crxjsBuild: true,
    }),
    server: {
      cors: {
        origin: [/chrome-extension:\/\//],
      },
    },
    build: {
      ...baseConfig.build,
      outDir: path.join(DIST_EXT_DIR, "chrome"),
      emptyOutDir: true,
      sourcemap: "hidden",
      minify: "oxc",
    },
  } satisfies UserConfig;
});
