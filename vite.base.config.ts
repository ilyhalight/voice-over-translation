import path from "node:path";
import { fileURLToPath } from "node:url";

import { type InlineConfig, mergeConfig, type UserConfig } from "vite";

type DefineValue =
  | string
  | number
  | boolean
  | null
  | readonly DefineValue[]
  | { readonly [key: string]: DefineValue };

export const rootDir = fileURLToPath(new URL(".", import.meta.url));
export const srcDir = path.resolve(rootDir, "src");
export const distDir = path.resolve(rootDir, "dist");
export const testsDir = path.resolve(rootDir, "tests");

const sharedConfig = {
  resolve: {
    alias: {
      "node:crypto": path.resolve(srcDir, "shims", "nodeCrypto.ts"),
    },
  },
  css: {
    transformer: "lightningcss",
  },
  build: {
    copyPublicDir: false,
    reportCompressedSize: false,
    cssMinify: "lightningcss",
  },
} satisfies UserConfig;

export type ViteDefine = NonNullable<UserConfig["define"]>;

export function createViteConfig(config: InlineConfig): InlineConfig;
export function createViteConfig(config: UserConfig): UserConfig;
export function createViteConfig(
  config: InlineConfig | UserConfig,
): InlineConfig | UserConfig {
  return mergeConfig(
    sharedConfig as Record<string, unknown>,
    config as Record<string, unknown>,
  ) as InlineConfig | UserConfig;
}

export function defineConstants(
  constants: Record<string, DefineValue>,
): ViteDefine {
  return Object.fromEntries(
    Object.entries(constants).map(([key, value]) => [
      key,
      typeof value === "string" ? JSON.stringify(value) : value,
    ]),
  );
}
