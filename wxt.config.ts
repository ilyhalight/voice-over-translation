import { defineConfig } from "wxt";
import headers from "./src/headers.json";
import { debugIdPlugin } from "./vite/lib/debug-id";
import { buildDefine, getBuildConfig, resolveDebugMode } from "./vite/lib/env";
import {
  getFirefoxSpecificSettings,
  getLocaleCodes,
} from "./vite/lib/extension/firefox-pipeline";
import {
  buildExtensionManifest,
  type ExtensionHeaders,
  getDevContentScriptMatches,
  iconPathFn,
  splitMatchesForOriginFallback,
} from "./vite/lib/extension/manifest-helpers";
import {
  SOURCEMAP_DIR,
  getReleaseDownloadBase,
  sharedCssOptions,
  sharedResolveAlias,
  viteCacheDir,
} from "./vite/lib/paths";
import {
  sharedVitePlugins,
  solidPluginOptions,
} from "./vite/lib/vite-base-config";

const CHROME_EXTENSION_KEY =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3IITn/V9BfBfaSk1oNpgoUNADzm15zSyWJ/a+bSnp5SkGAziTle3efpSWFTzpfmUnN+LyQeuXsgGqLJ6N8BeXA4g/Gh+J3gcZAgeSOaWmI7zbaXKrAyUo6irOyXaXNr4z+EuH6hqxNd7N5gv/XjaE0fGd9brepbKUoImFa5GnBE/xT6hnLPjwMYYO0tYBi7Om1Z2+Em4SvwixIK42cGxt0v6RwcE3isJ9Yt3Hm28fndfwaN6UO9C5NTXrYrlO2ivDX5njhjnVUXTM4oyy0NifcibYl0e2Au2e5xDLq0R7EkfWuW4mF3xzQi3D+R1A3pqAnMUIWDKt5bu8BmlhGzc3wIDAQAB";

const extensionHeaders = headers as ExtensionHeaders;

export default defineConfig({
  srcDir: "src",
  entrypointsDir: "entrypoints",
  // Single output folder for every artifact (builds, store zip/xpi, sources
  // archive). Keep in sync with OUTPUT_DIR in vite/lib/paths.ts.
  outDir: ".output",
  zip: {
    name: "vot-extension",
    // Archives are written to `outDir`; `wxt zip -b firefox` also creates the
    // sources archive (zipSources defaults to true for Firefox). Its name must
    // match OUTPUT_SOURCE_FILENAME in scripts/output/paths.ts.
    artifactTemplate: "{{name}}-{{version}}-{{browser}}.zip",
    sourcesTemplate: "{{name}}-{{version}}-sources.zip",
    includeSources: [
      "src",
      "vite",
      "scripts",
      "README.md",
      "README-EN.md",
      "package.json",
      "bun.lock",
      "tsconfig.json",
      "biome.json",
      "wxt.config.ts",
    ],
  },
  publicDir: "src/public",
  manifestVersion: 3,
  browser: "chrome",
  imports: false,
  // Official WXT module: vite-plugin-solid + solid-refresh HMR in `wxt` dev.
  modules: ["@wxt-dev/module-solid"],
  solid: { vite: solidPluginOptions },
  // `wxt` dev: Vite dev server + WXT live reload. Changed content scripts are
  // rebuilt and re-registered/re-injected without reloading the extension;
  // background/manifest changes trigger a full extension reload.
  dev: {
    reloadCommand: "Alt+R",
  },
  webExt: {
    startUrls: ["https://www.youtube.com/"],
    // Keep the dev browser profile (logins, settings) between `wxt` runs.
    keepProfileChanges: true,
  },
  manifest: ({ browser, mode }) => {
    const config = getBuildConfig(mode);
    const manifest = buildExtensionManifest({
      headers: extensionHeaders,
      versionName: browser === "firefox" ? undefined : headers.version,
    });

    if (browser === "firefox") {
      manifest.action.default_icon[64] = iconPathFn(64);
      return {
        ...manifest,
        browser_specific_settings: getFirefoxSpecificSettings(config),
      };
    }

    if (config.IS_STORE_BUILD) return manifest;

    return {
      ...manifest,
      update_url: `${getReleaseDownloadBase(config.REPO_BRANCH)}/update.xml`,
      key: CHROME_EXTENSION_KEY,
    };
  },
  vite: async (env) => {
    // DEBUG_MODE=true|false env overrides; default: dev server / development.
    const debug = resolveDebugMode(
      env.mode,
      env.command === "serve" || env.mode === "development",
    );
    const version = String(headers.version || "");

    return {
      cacheDir: viteCacheDir(`wxt-${env.browser}-${env.mode}`),
      plugins: [
        ...sharedVitePlugins,
        debugIdPlugin({
          variant: env.browser === "firefox" ? "firefox" : "chrome",
          // Only content scripts report errors through telemetry.
          registerChunk: ({ facadeModuleId }) =>
            !facadeModuleId?.includes("/entrypoints/background"),
          sourcemapDir: debug ? undefined : SOURCEMAP_DIR,
        }),
      ],
      resolve: {
        alias: sharedResolveAlias,
        dedupe: ["solid-js", "solid-js/web", "solid-js/store"],
      },
      css: sharedCssOptions,
      define: buildDefine({
        debug,
        isExtension: true,
        browser: env.browser === "firefox" ? "firefox" : "chrome",
        availableLocales: await getLocaleCodes(),
        repoBranch: getBuildConfig(env.mode).REPO_BRANCH,
        version,
        authors: String(headers.author || ""),
      }),
      build: {
        target: ["chrome106", "firefox106"],
        cssMinify: "lightningcss",
        reportCompressedSize: false,
        chunkSizeWarningLimit: 700,
        minify: debug ? false : "oxc",
        sourcemap: debug ? "inline" : "hidden",
      },
    };
  },
  hooks: {
    // `wxt` dev (MV3) registers content scripts at runtime from entrypoint
    // options, so path-specific matches added in build:manifestGenerated never
    // reach dev. Give dev the full production list + direct video files + Udemy.
    "entrypoints:resolved": (wxt, entrypoints) => {
      if (wxt.config.command !== "serve") return;
      const devMatches = getDevContentScriptMatches(extensionHeaders.match);
      for (const entry of entrypoints) {
        if (entry.type !== "content-script") continue;
        entry.options.matches = [...devMatches];
        // Chrome rejects match_origin_as_fallback on non-"/*" paths.
        Reflect.deleteProperty(entry.options, "matchOriginAsFallback");
      }
    },
    "build:manifestGenerated": (wxt, manifest) => {
      if (wxt.config.command === "serve" || !manifest.content_scripts) return;

      // Chrome rejects match_origin_as_fallback on patterns with a non-"/*"
      // path, so path-specific matches get duplicated entries without it.
      const { directMatches } = splitMatchesForOriginFallback(
        extensionHeaders.match,
      );
      if (!directMatches.length) return;

      const directScripts = manifest.content_scripts.map((script) => {
        const entry = { ...script, matches: directMatches };
        Reflect.deleteProperty(entry, "match_origin_as_fallback");
        return entry;
      });
      manifest.content_scripts.push(...directScripts);
    },
    "build:done": async (wxt) => {
      if (wxt.config.command !== "build") return;
      const { finalizeWxtBuild } = await import(
        "./vite/lib/extension/wxt-postbuild"
      );
      await finalizeWxtBuild(
        wxt.config.browser === "firefox" ? "firefox" : "chrome",
        wxt.config.outDir,
        wxt.config.mode,
      );
    },
  },
});
