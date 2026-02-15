import type { Plugin, UserConfig } from "vite";
import { defineConfig } from "vite";

import {
  buildExtensionBundles,
  cleanupExtensionTmpDir,
  type ExtensionBuildTarget,
  createExtensionBuildContext,
  finalizeExtensionBuildArtifacts,
  getExtensionHeaders,
  outBase,
  rootDir,
  verifyExtensionOutputs,
} from "./vite.extension.shared";

const verifyVirtualEntry = "virtual:vot-extension-verify";
const verifyVirtualEntryResolved = "\0virtual:vot-extension-verify";

function resolveBuildTarget(mode: string): ExtensionBuildTarget {
  if (mode === "chrome") return "chrome";
  if (mode === "firefox") return "firefox";
  return "all";
}

function extensionPipelinePlugin(target: ExtensionBuildTarget): Plugin {
  return {
    name: "vot-extension-build-pipeline",
    apply: "build",
    async closeBundle() {
      const context = await createExtensionBuildContext();
      const headers = await getExtensionHeaders();
      try {
        await buildExtensionBundles({
          context,
          headers,
        });
        await finalizeExtensionBuildArtifacts(target);
      } finally {
        await cleanupExtensionTmpDir();
      }
    },
  };
}

function verifyOnlyPlugin(target: ExtensionBuildTarget): Plugin {
  return {
    name: "vot-extension-verify-only",
    apply: "build",
    async closeBundle() {
      await verifyExtensionOutputs(target);
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

export default defineConfig(async ({ mode }) => {
  const target = resolveBuildTarget(mode);
  const config: UserConfig = {
    root: rootDir,
    plugins: [
      verifyVirtualEntryPlugin(),
      mode === "verify" ? verifyOnlyPlugin("all") : extensionPipelinePlugin(target),
    ],
    build: {
      outDir: outBase,
      emptyOutDir: false,
      write: false,
      minify: false,
      rollupOptions: {
        input: verifyVirtualEntry,
      },
    },
  };

  return config;
});
