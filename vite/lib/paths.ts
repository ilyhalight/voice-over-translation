import path from "node:path";
import { fileURLToPath } from "node:url";

const rootUrl = new URL("../..", import.meta.url);

export const rootDir = fileURLToPath(rootUrl);
export const srcDir = path.resolve(rootDir, "src");
export const testsDir = path.resolve(rootDir, "tests");
export const viteDir = path.resolve(rootDir, "vite");

export const distDir = path.resolve(rootDir, "dist");
export const distExtDir = path.resolve(rootDir, "dist-ext");
export const outTmp = path.resolve(distExtDir, "_tmp");

export function viteCacheDir(name: string): string {
  return path.resolve(rootDir, "node_modules", ".vite", name);
}

export const nodeCryptoAlias = {
  "node:crypto": path.resolve(srcDir, "shims", "nodeCrypto.ts"),
} as const;

export const sharedResolveAlias = {
  ...nodeCryptoAlias,
} as const;

export const sharedCssOptions = {
  transformer: "lightningcss" as const,
};

export const sharedBuildOptions = {
  target: "baseline-widely-available" as const,
  modulePreload: { polyfill: false },
  copyPublicDir: false,
  cssMinify: "lightningcss" as const,
  reportCompressedSize: false,
  chunkSizeWarningLimit: 700,
};

export const singleFileBuildOptions = {
  ...sharedBuildOptions,
  cssCodeSplit: false,
};
