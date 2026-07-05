import path from "node:path";
import { fileURLToPath } from "node:url";

// vite/lib/paths.ts -> project root = ../../
export const rootDir = fileURLToPath(new URL("../..", import.meta.url));
export const srcDir = path.resolve(rootDir, "src");
export const distDir = path.resolve(rootDir, "dist");
export const testsDir = path.resolve(rootDir, "tests");
export const distExtDir = path.resolve(rootDir, "dist-ext");
export const outTmp = path.resolve(distExtDir, "_tmp");
export const viteDir = path.resolve(rootDir, "vite");

export const nodeCryptoAlias = {
  "node:crypto": path.resolve(srcDir, "shims", "nodeCrypto.ts"),
} as const;

export const sharedCss = { transformer: "lightningcss" as const };

export const sharedBuild = {
  copyPublicDir: false,
  reportCompressedSize: false,
  // Single-file userscript output; no CSS code-splitting needed
  cssCodeSplit: false,
  cssMinify: "lightningcss" as const,
} as const;

export const sharedResolveAlias = { ...nodeCryptoAlias };
