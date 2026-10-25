import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "wxt";
import headers from "./src/headers.json";
import { buildDefine, getBuildConfig } from "./vite/lib/env";
import {
  getFirefoxSpecificSettings,
  getLocaleCodes,
} from "./vite/lib/extension/firefox-pipeline";
import {
  buildManifestChrome,
  type ExtensionHeaders,
} from "./vite/lib/extension/manifest-helpers";
import {
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
const iconPathFn = (size: number) => `icons/icon-${size}.png`;

const WXT_CONTENT_SCRIPT_PATHS: Record<string, string> = {
  "bridge.js": "content-scripts/bridge.js",
  "prelude.js": "content-scripts/prelude.js",
  "content.js": "content-scripts/content.js",
};

export default defineConfig({
  srcDir: "src",
  entrypointsDir: "entrypoints",
  outDir: ".output",
  publicDir: "public",
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
    const manifest = buildManifestChrome({
      headers: extensionHeaders,
      includeWorld: true,
      pathStrategy: { iconPathFn },
      chromeOptions:
        browser === "firefox" ? undefined : { versionName: headers.version },
    });

    // WXT generates background and content_scripts from src/entrypoints.
    delete manifest.manifest_version;
    delete manifest.background;
    delete manifest.content_scripts;

    if (browser === "firefox") {
      const action = manifest.action as {
        default_icon: Record<number, string>;
      };
      action.default_icon[64] = iconPathFn(64);
      manifest.browser_specific_settings = getFirefoxSpecificSettings(config);
    } else if (!config.IS_STORE_BUILD) {
      manifest.update_url = `${getReleaseDownloadBase(config.REPO_BRANCH)}/update.xml`;
      manifest.key = CHROME_EXTENSION_KEY;
    }

    return manifest;
  },
  vite: async (env) => {
    const debug = env.command === "serve" || env.mode === "development";
    const version = String(headers.version || "");

    return {
      cacheDir: viteCacheDir(`wxt-${env.browser}-${env.mode}`),
      plugins: sharedVitePlugins,
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
        sourcemap: debug ? "inline" : false,
      },
    };
  },
  hooks: {
    "build:publicAssets": (_wxt, assets) => {
      const iconSourceDir = resolve("src/extension/icons");
      for (const entry of readdirSync(iconSourceDir, { withFileTypes: true })) {
        if (!entry.isFile()) continue;
        assets.push({
          absoluteSrc: resolve(iconSourceDir, entry.name),
          relativeDest: `icons/${entry.name}`,
        });
      }
    },
    "build:manifestGenerated": (wxt, manifest) => {
      // Dev mode keeps WXT's own content script entries so its built-in
      // reload of changed content scripts keeps working.
      if (wxt.config.command === "serve") return;

      // Production keeps the exact match_origin_as_fallback split
      // the release manifests always had.
      const full = buildManifestChrome({
        headers: extensionHeaders,
        includeWorld: true,
        pathStrategy: {
          scriptPathFn: (file) => WXT_CONTENT_SCRIPT_PATHS[file] ?? file,
        },
      });
      manifest.content_scripts = full.content_scripts as NonNullable<
        typeof manifest.content_scripts
      >;
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
