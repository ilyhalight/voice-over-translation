import path from "node:path";
import { defineConfig, type UserConfig } from "vite";
import { debugIdPlugin } from "./lib/debug-id.ts";
import { buildDefine, resolveDebugMode } from "./lib/env.ts";
import {
  DIST_DIR,
  SOURCE_DIR,
  SOURCEMAP_DIR,
  sharedBuildOptions,
} from "./lib/paths.ts";
import {
  collectUsedUserscriptGrantsFromEntry,
  getHeaders,
  mergeUserscriptGrants,
  type UserscriptHeader,
} from "./lib/userscript/grants.ts";
import { formatUserscriptHeader } from "./lib/userscript/headers.ts";
import {
  getAvailableLocales,
  getLocaleHeaderEntriesAsync,
} from "./lib/userscript/locales.ts";
import { createBaseViteConfig } from "./lib/vite-base-config.ts";

const USERSCRIPT_ENTRY = path.resolve(SOURCE_DIR, "index.ts");
const USERSCRIPT_GLOBAL_NAME = "vot";

type UserscriptBranch = "dev" | "master";

function isDebugBuild(command: string, mode: string): boolean {
  return resolveDebugMode(mode, command === "serve" || mode === "development");
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
    plugins: [
      ...(baseConfig.plugins ?? []),
      debugIdPlugin({
        variant: minified ? "userscript-min" : "userscript",
        sourcemapDir: debug ? undefined : SOURCEMAP_DIR,
      }),
    ],
    define: buildDefine({
      debug,
      isExtension: false,
      availableLocales,
      repoBranch,
      version,
      authors,
      minified,
    }),
    build: {
      ...baseConfig.build,
      ...sharedBuildOptions,
      outDir: DIST_DIR,
      emptyOutDir: false,
      sourcemap: debug ? true : "hidden",
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
          comments: minified ? undefined : false,
        },
      },
    },
  } satisfies UserConfig;
});
