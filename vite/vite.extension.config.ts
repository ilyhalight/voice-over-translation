import { defineConfig, type Plugin } from "vite";
import {
  type BuildConfig,
  buildDefine,
  getBuildConfig,
  isStoreBuild,
} from "./lib/env";
import {
  buildExtensionBundles,
  cleanupExtensionTmpDir,
  createExtensionBuildContext,
  finalizeFirefoxBuild,
  getExtensionHeaders,
  getFirefoxBuildEnv,
} from "./lib/extension/firefox-pipeline";
import { distExtDir } from "./lib/paths";
import { createBaseViteConfig } from "./lib/vite-base-config";

const FIREFOX_PIPELINE_ENTRY = "virtual:vot-firefox-extension-pipeline";
const RESOLVED_FIREFOX_PIPELINE_ENTRY = `\0${FIREFOX_PIPELINE_ENTRY}`;

function firefoxPipelineEntryPlugin(): Plugin {
  return {
    name: "vot-firefox-pipeline-entry",
    resolveId(id) {
      return id === FIREFOX_PIPELINE_ENTRY
        ? RESOLVED_FIREFOX_PIPELINE_ENTRY
        : null;
    },
    load(id) {
      if (id !== RESOLVED_FIREFOX_PIPELINE_ENTRY) return null;
      return "export default true;";
    },
  };
}

function firefoxBuildPipelinePlugin(config: BuildConfig): Plugin {
  return {
    name: "vot-firefox-build-pipeline",
    apply: "build",
    async closeBundle() {
      const [context, headers] = await Promise.all([
        createExtensionBuildContext(config),
        getExtensionHeaders(),
      ]);

      try {
        await buildExtensionBundles({ context, headers });
        await finalizeFirefoxBuild(config);
      } finally {
        await cleanupExtensionTmpDir();
      }
    },
  };
}

export default defineConfig(async ({ mode }) => {
  const buildConfig = getBuildConfig(mode);
  console.log(
    `Building extension with store mode? ${buildConfig.IS_STORE_BUILD}`,
  );
  const baseConfig = createBaseViteConfig({ cacheName: "firefox-extension" });
  const env = await getFirefoxBuildEnv(buildConfig);

  return {
    ...baseConfig,
    define: buildDefine(env),
    plugins: [
      firefoxPipelineEntryPlugin(),
      firefoxBuildPipelinePlugin(buildConfig),
    ],
    build: {
      ...baseConfig.build,
      outDir: distExtDir,
      emptyOutDir: false,
      write: false,
      sourcemap: false,
      minify: false,
      rolldownOptions: {
        input: FIREFOX_PIPELINE_ENTRY,
      },
    },
  };
});
