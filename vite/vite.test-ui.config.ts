import fs from "node:fs/promises";
import path from "node:path";
import { defineConfig } from "vite";
import { buildDefine } from "./lib/env";
import {
  distDir,
  sharedBuild,
  sharedCss,
  sharedResolveAlias,
  testsDir,
} from "./lib/paths";
import { formatSimpleUserscriptHeader } from "./lib/userscript/headers";

export default defineConfig(async () => {
  const testMeta = JSON.parse(
    await fs.readFile(path.resolve(testsDir, "headers.json"), "utf8"),
  ) as Record<string, unknown>;

  return {
    resolve: { alias: sharedResolveAlias },
    css: sharedCss,
    define: buildDefine({
      debug: true,
      isExtension: false,
      availableLocales: [],
      repoBranch: "master",
      version: "",
      authors: "",
      crxjsBuild: false,
    }),
    build: {
      ...sharedBuild,
      outDir: distDir,
      emptyOutDir: false,
      lib: {
        entry: path.resolve(testsDir, "ui.js"),
        name: "testUi",
        formats: ["iife"],
        fileName: () => "test-ui.user.js",
      },
      minify: false,
      sourcemap: false,
      rolldownOptions: {
        output: { postBanner: formatSimpleUserscriptHeader(testMeta) },
      },
    },
  };
});
