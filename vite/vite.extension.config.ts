import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { createViteConfig } from "./vite.base.config";
import {
  buildExtensionBundles,
  cleanupExtensionTmpDir,
  createExtensionBuildContext,
  finalizeFirefoxBuild,
  getExtensionHeaders,
  outBase,
  rootDir,
} from "./vite.extension.shared";

const verifyVirtualEntry = "virtual:vot-extension-verify";
const verifyVirtualEntryResolved = "\0virtual:vot-extension-verify";

function firefoxPipelinePlugin(): Plugin {
  return {
    name: "vot-firefox-build-pipeline",
    apply: "build",
    async closeBundle() {
      const context = await createExtensionBuildContext();
      const headers = await getExtensionHeaders();
      try {
        await buildExtensionBundles({ context, headers });
        await finalizeFirefoxBuild();
      } finally {
        await cleanupExtensionTmpDir();
      }
    },
  };
}

function verifyVirtualEntryPlugin(): Plugin {
  return {
    name: "vot-extension-verify-virtual-entry",
    resolveId(source) {
      if (source === verifyVirtualEntry) return verifyVirtualEntryResolved;
      return null;
    },
    load(id) {
      if (id !== verifyVirtualEntryResolved) return null;
      return "globalThis.__VOT_EXTENSION_VERIFY_ENTRY__ = true;";
    },
  };
}

export default defineConfig(async () => {
  return createViteConfig({
    root: rootDir,
    plugins: [
      verifyVirtualEntryPlugin(),
      firefoxPipelinePlugin(),
    ],
    build: {
      outDir: outBase,
      emptyOutDir: false,
      copyPublicDir: false,
      reportCompressedSize: false,
      write: false,
      minify: false,
      rolldownOptions: {
        input: verifyVirtualEntry,
      },
    },
  });
});
