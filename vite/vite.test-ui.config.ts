import fs from "node:fs/promises";
import path from "node:path";
import { defineConfig } from "vite";
import { buildDefine } from "./lib/env";
import { distDir, singleFileBuildOptions, testsDir } from "./lib/paths";
import { formatSimpleUserscriptHeader } from "./lib/userscript/headers";
import { createBaseViteConfig } from "./lib/vite-base-config";

const TEST_UI_ENTRY = path.resolve(testsDir, "ui.js");
const TEST_UI_HEADERS_PATH = path.resolve(testsDir, "headers.json");

export default defineConfig(async () => {
  const baseConfig = createBaseViteConfig({ cacheName: "test-ui" });
  const testMeta = JSON.parse(
    await fs.readFile(TEST_UI_HEADERS_PATH, "utf8"),
  ) as Record<string, unknown>;

  return {
    ...baseConfig,
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
      ...baseConfig.build,
      ...singleFileBuildOptions,
      outDir: distDir,
      emptyOutDir: false,
      sourcemap: false,
      minify: false,
      lib: {
        entry: TEST_UI_ENTRY,
        name: "testUi",
        formats: ["iife"],
        fileName: () => "test-ui.user.js",
      },
      rolldownOptions: {
        output: {
          postBanner: formatSimpleUserscriptHeader(testMeta),
        },
      },
    },
  };
});
