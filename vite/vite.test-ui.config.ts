import fs from "node:fs";
import path from "node:path";

import { defineConfig } from "vite";
import {
  createViteConfig,
  defineConstants,
  distDir,
  testsDir,
} from "./vite.base.config";

const headersPath = path.resolve(testsDir, "headers.json");

type UserscriptHeader = Record<string, unknown>;

const testMeta = JSON.parse(
  fs.readFileSync(headersPath, "utf8"),
) as UserscriptHeader;

function formatUserscriptHeader(header: UserscriptHeader): string {
  const lines = ["// ==UserScript=="];

  for (const [key, value] of Object.entries(header)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        lines.push(`// @${key} ${item}`);
      }
      continue;
    }

    lines.push(`// @${key} ${value}`);
  }

  lines.push("// ==/UserScript==\n");
  return lines.join("\n");
}

export default defineConfig(() => {
  return createViteConfig({
    define: {
      ...defineConstants({
        DEBUG_MODE: true,
        REPO_BRANCH: "master",
      }),
    },
    build: {
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
        output: {
          postBanner: formatUserscriptHeader(testMeta),
        },
      },
    },
  });
});
