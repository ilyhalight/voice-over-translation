import {
  normalizePath,
  type Plugin,
  type UserConfig,
  build as viteBuild,
} from "vite";
import solidPlugin from "vite-plugin-solid";
import {
  ROOT_DIR,
  SOURCE_DIR,
  sharedBuildOptions,
  sharedCssOptions,
  sharedResolveAlias,
  viteCacheDir,
} from "./paths.ts";

const youtubePlayerSolverPath = normalizePath(
  `${SOURCE_DIR}/audioDownloader/strategies/ytPlayerSolver.js`,
);

const minifiedYouTubePlayerSolverPlugin: Plugin = {
  name: "vot-minified-youtube-player-solver",
  apply: "build",
  async load(id) {
    if (normalizePath(id) !== youtubePlayerSolverPath) return null;

    const result = await viteBuild({
      configFile: false,
      root: ROOT_DIR,
      publicDir: false,
      logLevel: "silent",
      build: {
        ...sharedBuildOptions,
        write: false,
        minify: "oxc",
        lib: {
          entry: youtubePlayerSolverPath,
          formats: ["es"],
        },
      },
    });
    const output = (Array.isArray(result) ? result : [result]).flatMap(
      (build) => ("output" in build ? build.output : []),
    );
    const chunk = output.find((item) => item.type === "chunk" && item.isEntry);
    if (chunk?.type !== "chunk") {
      throw new Error("Failed to build ytPlayerSolver.js");
    }
    return chunk.code;
  },
};

export interface BaseViteConfigOptions {
  cacheName: string;
}

export function createBaseViteConfig({
  cacheName,
}: BaseViteConfigOptions): UserConfig {
  return {
    root: ROOT_DIR,
    envDir: ROOT_DIR,
    publicDir: false,
    cacheDir: viteCacheDir(cacheName),
    appType: "custom",
    plugins: [
      solidPlugin({
        solid: {
          generate: "universal",
          moduleName: "vot-solid-renderer",
        },
      }),
      minifiedYouTubePlayerSolverPlugin,
    ],
    resolve: {
      alias: sharedResolveAlias,
      dedupe: ["solid-js", "solid-js/web", "solid-js/store"],
    },
    css: sharedCssOptions,
    build: sharedBuildOptions,
  };
}
