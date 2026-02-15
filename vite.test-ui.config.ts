import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { UserConfig } from "vite";
import { defineConfig } from "vite";
import type { MonkeyUserScript } from "vite-plugin-monkey";
import monkey from "vite-plugin-monkey";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testsDir = path.resolve(__dirname, "tests");
const distDir = path.resolve(__dirname, "dist");
const headersPath = path.resolve(testsDir, "headers.json");

const testMeta = JSON.parse(
  fs.readFileSync(headersPath, "utf8"),
) as MonkeyUserScript;

export default defineConfig(() => {
  const config: UserConfig = {
    define: {
      DEBUG_MODE: "true",
      IS_BETA_VERSION: "false",
      REPO_BRANCH: JSON.stringify("master"),
    },
    resolve: {
      extensions: [".js", ".ts"],
    },
    css: {
      transformer: "lightningcss",
    },
    build: {
      outDir: distDir,
      emptyOutDir: false,
      minify: false,
      sourcemap: false,
    },
    plugins: [
      ...monkey({
        entry: path.resolve(testsDir, "ui.js"),
        userscript: testMeta,
        server: {
          mountGmApi: true,
        },
        build: {
          fileName: "test-ui.user.js",
          metaFileName: false,
          cssSideEffects: "(css)=>GM_addStyle(css)",
          autoGrant: true,
        },
      }),
    ],
  };

  return config;
});
