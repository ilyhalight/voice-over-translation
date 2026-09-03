import path from "node:path";

export const ROOT_DIR = path.join(import.meta.dirname, "..", "..");
export const SOURCE_DIR = path.resolve(ROOT_DIR, "src");

export const DIST_DIR = path.resolve(ROOT_DIR, "dist");
export const DIST_EXT_DIR = path.resolve(ROOT_DIR, "dist-ext");
export const OUT_TEMP_DIR = path.resolve(DIST_EXT_DIR, "_tmp");

export const EXTENSION_NAME = "vot-extension";
export const FIREFOX_EXTENSION_NAME = `${EXTENSION_NAME}-firefox`;
export const CHROME_EXTENSION_NAME = `${EXTENSION_NAME}-chrome`;

export const FIREFOX_UPDATES_MANIFEST_FILE = `${FIREFOX_EXTENSION_NAME}-updates.json`;
export const FIREFOX_UPDATES_MANIFEST_PATH = path.join(
  DIST_EXT_DIR,
  FIREFOX_UPDATES_MANIFEST_FILE,
);

export const FIREFOX_XPI_FILE = `${FIREFOX_EXTENSION_NAME}.xpi`;
export const FIREFOX_XPI_PATH = path.join(DIST_EXT_DIR, FIREFOX_XPI_FILE);

export function viteCacheDir(name: string): string {
  return path.resolve(ROOT_DIR, "node_modules", ".vite", name);
}

export const nodeCryptoAlias = {
  "node:crypto": path.resolve(SOURCE_DIR, "shims", "nodeCrypto.ts"),
} as const;

export const sharedResolveAlias = {
  ...nodeCryptoAlias,
  "vot-solid-renderer": path.resolve(SOURCE_DIR, "ui/solid/renderer.ts"),
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
