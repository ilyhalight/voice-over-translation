import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import { defineConfig, type Plugin } from "vite";
import { buildDefine } from "./lib/env";
import {
  finalizeChromeBuild,
  getChromeExtensionBuildEnv,
} from "./lib/extension/chrome-postbuild";
import manifest from "./lib/extension/manifest.config";
import { distExtDir } from "./lib/paths";
import { createBaseViteConfig } from "./lib/vite-base-config";

function chromePackagePlugin(headers: {
  version?: string;
  author?: string;
}): Plugin {
  return {
    name: "vot-chrome-package",
    apply: "build",
    enforce: "post",
    async closeBundle() {
      await finalizeChromeBuild(headers);
    },
  };
}

export default defineConfig(async () => {
  const baseConfig = createBaseViteConfig({ cacheName: "chrome-extension" });
  const { headers, locales, branch } = await getChromeExtensionBuildEnv();

  return {
    ...baseConfig,
    plugins: [crx({ manifest }), chromePackagePlugin(headers)],
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
      outDir: path.join(distExtDir, "chrome"),
      emptyOutDir: true,
      sourcemap: false,
      minify: "oxc",
    },
  };
});
