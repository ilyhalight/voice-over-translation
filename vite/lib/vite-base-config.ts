import {
  normalizePath,
  type Plugin,
  type UserConfig,
  build as viteBuild,
} from "vite";
import {
  rootDir,
  sharedBuildOptions,
  sharedCssOptions,
  sharedResolveAlias,
  srcDir,
  viteCacheDir,
} from "./paths";

const youtubePlayerSolverPath = normalizePath(
  `${srcDir}/audioDownloader/strategies/ytPlayerSolver.js`,
);

function minifiedYouTubePlayerSolverPlugin(): Plugin {
  return {
    name: "vot-minified-youtube-player-solver",
    apply: "build",
    async load(id) {
      if (normalizePath(id) !== youtubePlayerSolverPath) return null;

      const result = await viteBuild({
        configFile: false,
        root: rootDir,
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
      const chunk = output.find(
        (item) => item.type === "chunk" && item.isEntry,
      );
      if (chunk?.type !== "chunk") {
        throw new Error("Failed to build ytPlayerSolver.js");
      }
      return chunk.code;
    },
  };
}

export interface BaseViteConfigOptions {
  cacheName: string;
}

export function createBaseViteConfig({
  cacheName,
}: BaseViteConfigOptions): UserConfig {
  return {
    root: rootDir,
    envDir: rootDir,
    publicDir: false,
    cacheDir: viteCacheDir(cacheName),
    appType: "custom",
    plugins: [minifiedYouTubePlayerSolverPlugin()],
    resolve: {
      alias: sharedResolveAlias,
    },
    css: sharedCssOptions,
    build: sharedBuildOptions,
  };
}

export function createViteConfig(
  config: UserConfig,
  options: BaseViteConfigOptions,
): UserConfig {
  const baseConfig = createBaseViteConfig(options);

  return {
    ...baseConfig,
    ...config,
    resolve: {
      ...baseConfig.resolve,
      ...config.resolve,
      alias: config.resolve?.alias ?? baseConfig.resolve?.alias,
    },
    css: {
      ...baseConfig.css,
      ...config.css,
    },
    build: {
      ...baseConfig.build,
      ...config.build,
    },
  };
}

export { defineConstants, type ViteDefine } from "./define";
