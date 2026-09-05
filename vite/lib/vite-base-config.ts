import type { UserConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import {
  ROOT_DIR,
  sharedBuildOptions,
  sharedCssOptions,
  sharedResolveAlias,
  viteCacheDir,
} from "./paths.ts";

export interface BaseViteConfigOptions {
  cacheName: string;
}

export function createBaseViteConfig({
  cacheName,
}: BaseViteConfigOptions): UserConfig {
  return {
    root: ROOT_DIR,
    envDir: ROOT_DIR,
    publicDir: false,
    cacheDir: viteCacheDir(cacheName),
    appType: "custom",
    plugins: [
      solidPlugin({
        solid: {
          generate: "universal",
          moduleName: "vot-solid-renderer",
        },
      }),
    ],
    resolve: {
      alias: sharedResolveAlias,
      dedupe: ["solid-js", "solid-js/web", "solid-js/store"],
    },
    css: sharedCssOptions,
    build: sharedBuildOptions,
  };
}
