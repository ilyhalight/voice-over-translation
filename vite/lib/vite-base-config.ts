import type { UserConfig } from "vite";
import {
  rootDir,
  sharedBuildOptions,
  sharedCssOptions,
  sharedResolveAlias,
  viteCacheDir,
} from "./paths";

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
    resolve: {
      alias: sharedResolveAlias,
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
    resolve: {
      ...baseConfig.resolve,
      ...config.resolve,
      alias: config.resolve?.alias ?? baseConfig.resolve?.alias,
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

export type { ViteDefine } from "./define";
export { defineConstants } from "./define";
