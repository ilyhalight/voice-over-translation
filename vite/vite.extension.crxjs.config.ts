import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import { defineConfig } from "vite";
import { buildDefine } from "./lib/env";
import {
  finalizeChromeBuild,
  getChromeExtensionBuildEnv,
} from "./lib/extension/chrome-postbuild";
import manifest from "./lib/extension/manifest.config";
import { distExtDir, nodeCryptoAlias } from "./lib/paths";

export default defineConfig(async () => {
  const { headers, locales, branch } = await getChromeExtensionBuildEnv();

  return {
    resolve: {
      alias: {
        // CRXJS creates its own internal Rollup/Vite builds for each content-script
        // entry and the service worker. The node:crypto alias defined in
        // vite/lib/paths.ts applies to the user-facing config but CRXJS's
        // internal rebuilds may not inherit it, causing node:crypto to be
        // externalized into an empty __vite-browser-external stub that creates a
        // circular dependency back to the main chunk.
        //
        // By re-declaring the alias here we ensure it is present in every CRXJS-
        // generated sub-build.
        ...nodeCryptoAlias,
      },
    },
    plugins: [
      crx({ manifest }),
      {
        name: "zip-chrome-output",
        async closeBundle() {
          await finalizeChromeBuild(headers);
        },
      },
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
    build: {
      outDir: path.join(distExtDir, "chrome"),
      emptyOutDir: true,
      chunkSizeWarningLimit: 700,
    },
  };
});
