import path from "node:path";
import { defineConfig } from "vite";
import { buildDefine } from "./lib/env";
import {
  distDir,
  sharedBuild,
  sharedCss,
  sharedResolveAlias,
  srcDir,
} from "./lib/paths";
import {
  collectUsedUserscriptGrantsFromEntry,
  getHeaders,
  mergeUserscriptGrants,
  type UserscriptBranch,
  type UserscriptHeader,
} from "./lib/userscript/grants";
import { formatUserscriptHeader } from "./lib/userscript/headers";
import {
  getAvailableLocales,
  getLocaleHeaderEntriesAsync,
} from "./lib/userscript/locales";

export default defineConfig(async ({ command, mode }) => {
  const debugMode = command === "serve" || mode === "development";
  const buildMinified = mode === "minify";
  const mainHeaders = getHeaders<UserscriptHeader>();
  const isBeta = String(mainHeaders.version).includes("beta");
  const repoBranch: UserscriptBranch = debugMode || isBeta ? "dev" : "master";
  const repoUpdateBranch: UserscriptBranch = isBeta ? "dev" : "master";
  const filename = buildMinified ? "vot-min" : "vot";

  const [availableLocales, localeEntries, grants] = await Promise.all([
    getAvailableLocales(),
    getLocaleHeaderEntriesAsync(),
    collectUsedUserscriptGrantsFromEntry(path.resolve(srcDir, "index.ts")),
  ]);
  const mergedGrants = mergeUserscriptGrants(grants, mainHeaders.grant);

  const banner = formatUserscriptHeader({
    filename,
    repoBranch,
    repoUpdateBranch,
    localeEntries,
    grants: mergedGrants,
  });

  return {
    resolve: { alias: sharedResolveAlias },
    css: sharedCss,
    define: buildDefine({
      debug: debugMode,
      isExtension: false,
      availableLocales,
      repoBranch,
      version: String(mainHeaders.version || ""),
      authors: String(mainHeaders.author || ""),
      crxjsBuild: false,
    }),
    build: {
      ...sharedBuild,
      outDir: distDir,
      // emptyOutDir:false because build:all runs build and build:min sequentially
      // (run-s in package.json). Each build writes a uniquely-named file
      // (vot.user.js vs vot-min.user.js), so neither overwrites the other.
      emptyOutDir: false,
      lib: {
        entry: path.resolve(srcDir, "index.ts"),
        name: "vot",
        formats: ["iife"],
        fileName: () => `${filename}.user.js`,
      },
      minify: buildMinified,
      sourcemap: debugMode,
      // Higher threshold for userscript (single IIFE bundle); default is 500
      chunkSizeWarningLimit: 600,
      rolldownOptions: {
        output: { postBanner: banner },
      },
    },
  };
});
