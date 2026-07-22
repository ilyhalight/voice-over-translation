import path from "node:path";
import { defineConfig } from "vite";
import { buildDefine } from "./lib/env";
import { distDir, singleFileBuildOptions, srcDir } from "./lib/paths";
import {
  collectUsedUserscriptGrantsFromEntry,
  getHeaders,
  mergeUserscriptGrants,
  type UserscriptHeader,
} from "./lib/userscript/grants";
import { formatUserscriptHeader } from "./lib/userscript/headers";
import {
  getAvailableLocales,
  getLocaleHeaderEntriesAsync,
} from "./lib/userscript/locales";
import { createBaseViteConfig } from "./lib/vite-base-config";

const USERSCRIPT_ENTRY = path.resolve(srcDir, "index.ts");
const USERSCRIPT_GLOBAL_NAME = "vot";

type UserscriptBranch = "dev" | "master";

function isDebugBuild(command: string, mode: string): boolean {
  return command === "serve" || mode === "development";
}

function getUserscriptBranches({
  debug,
  version,
}: {
  debug: boolean;
  version: string;
}): {
  repoBranch: UserscriptBranch;
  repoUpdateBranch: UserscriptBranch;
} {
  const isBeta = version.includes("beta");

  return {
    repoBranch: debug || isBeta ? "dev" : "master",
    repoUpdateBranch: isBeta ? "dev" : "master",
  };
}

export default defineConfig(async ({ command, mode }) => {
  const baseConfig = createBaseViteConfig({ cacheName: "userscript" });
  const debug = isDebugBuild(command, mode);
  const minified = mode === "minify";
  const headers = getHeaders<UserscriptHeader>();
  const version = String(headers.version || "");
  const authors = String(headers.author || "");
  const filename = minified ? "vot-min" : "vot";
  const { repoBranch, repoUpdateBranch } = getUserscriptBranches({
    debug,
    version,
  });

  const [availableLocales, localeEntries, detectedGrants] = await Promise.all([
    getAvailableLocales(),
    getLocaleHeaderEntriesAsync(),
    collectUsedUserscriptGrantsFromEntry(USERSCRIPT_ENTRY),
  ]);

  const banner = formatUserscriptHeader({
    filename,
    repoBranch,
    repoUpdateBranch,
    localeEntries,
    grants: mergeUserscriptGrants(detectedGrants, headers.grant),
  });

  return {
    ...baseConfig,
    define: buildDefine({
      debug,
      isExtension: false,
      availableLocales,
      repoBranch,
      version,
      authors,
      crxjsBuild: false,
    }),
    build: {
      ...baseConfig.build,
      ...singleFileBuildOptions,
      outDir: distDir,
      emptyOutDir: false,
      sourcemap: debug,
      minify: minified ? "oxc" : false,
      lib: {
        entry: USERSCRIPT_ENTRY,
        name: USERSCRIPT_GLOBAL_NAME,
        formats: ["iife"],
        fileName: () => `${filename}.user.js`,
      },
      rolldownOptions: {
        output: {
          postBanner: banner,
        },
      },
    },
  };
});
