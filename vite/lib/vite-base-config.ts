import type { UserConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import {
  rootDir,
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
    root: rootDir,
    envDir: rootDir,
    publicDir: false,
    cacheDir: viteCacheDir(cacheName),
    appType: "custom",
    plugins: [solidPlugin()],
    resolve: {
      alias: sharedResolveAlias,
      dedupe: ["solid-js", "solid-js/web", "solid-js/store"],
    },
    css: sharedCssOptions,
    build: sharedBuildOptions,
  };
}

export function createViteConfig(
  config: UserConfig,
  options: BaseViteConfigOptions,
): UserConfig {
  const baseConfig = createBaseViteConfig(options);

  return {
    ...baseConfig,
    ...config,
    plugins: [...(baseConfig.plugins ?? []), ...(config.plugins ?? [])],
    resolve: {
      ...baseConfig.resolve,
      ...config.resolve,
      alias: config.resolve?.alias ?? baseConfig.resolve?.alias,
      dedupe: config.resolve?.dedupe ?? baseConfig.resolve?.dedupe,
    },
    css: {
      ...baseConfig.css,
      ...config.css,
    },
    build: {
      ...baseConfig.build,
      ...config.build,
    },
  };
}

export type { ViteDefine } from "./define.ts";
export { defineConstants } from "./define.ts";
