import { defineConfig } from "vite";
import { buildDefine } from "./lib/env";
import {
  buildExtensionBundles,
  cleanupExtensionTmpDir,
  createExtensionBuildContext,
  finalizeFirefoxBuild,
  getExtensionHeaders,
  getFirefoxBuildEnv,
} from "./lib/extension/firefox-pipeline";
import { distExtDir, sharedBuild } from "./lib/paths";

const verifyVirtualEntry = "virtual:vot-extension-verify";
const verifyVirtualEntryResolved = "\0virtual:vot-extension-verify";

function verifyVirtualEntryPlugin() {
  return {
    name: "vot-extension-verify-virtual-entry",
    resolveId(source: string) {
      if (source === verifyVirtualEntry) return verifyVirtualEntryResolved;
      return null;
    },
    load(id: string) {
      if (id !== verifyVirtualEntryResolved) return null;
      return "globalThis.__VOT_EXTENSION_VERIFY_ENTRY__ = true;";
    },
  };
}

function firefoxPipelinePlugin() {
  return {
    name: "vot-firefox-build-pipeline",
    apply: "build" as const,
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

export default defineConfig(async () => {
  const env = await getFirefoxBuildEnv();

  return {
    define: buildDefine(env),
    plugins: [verifyVirtualEntryPlugin(), firefoxPipelinePlugin()],
    build: {
      ...sharedBuild,
      outDir: distExtDir,
      emptyOutDir: false,
      write: false,
      minify: false,
      rolldownOptions: {
        input: verifyVirtualEntry,
      },
    },
  };
});
