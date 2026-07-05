import { defineConstants, type ViteDefine } from "./define";

export interface BuildEnvMeta {
  debug: boolean;
  isExtension: boolean;
  availableLocales: readonly string[];
  repoBranch: string;
  version: string;
  authors: string;
  crxjsBuild: boolean;
}

export function buildDefine(env: BuildEnvMeta): ViteDefine {
  return {
    ...defineConstants({
      DEBUG_MODE: env.debug,
      IS_EXTENSION: env.isExtension,
      AVAILABLE_LOCALES: [...env.availableLocales],
      REPO_BRANCH: env.repoBranch,
      VOT_VERSION: env.version,
      VOT_AUTHORS: env.authors,
    }),
    "import.meta.env.VITE_CRXJS_BUILD": env.crxjsBuild ? '"true"' : '"false"',
  };
}
