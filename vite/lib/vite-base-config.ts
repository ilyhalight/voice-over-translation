import { type InlineConfig, mergeConfig, type UserConfig } from "vite";
import { sharedBuild, sharedCss, sharedResolveAlias } from "./paths";

export function createViteConfig(config: InlineConfig): InlineConfig;
export function createViteConfig(config: UserConfig): UserConfig;
export function createViteConfig(
  config: InlineConfig | UserConfig,
): InlineConfig | UserConfig {
  const base: UserConfig = {
    resolve: { alias: sharedResolveAlias },
    css: sharedCss,
    build: sharedBuild,
  };
  return mergeConfig(base, config) as InlineConfig | UserConfig;
}

export type { ViteDefine } from "./define";
export { defineConstants } from "./define";
