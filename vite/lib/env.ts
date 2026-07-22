import { loadEnv } from "vite";
import { defineConstants, type ViteDefine } from "./define";
import { rootDir } from "./paths";

export interface BuildEnvMeta {
  debug: boolean;
  isExtension: boolean;
  availableLocales: readonly string[];
  repoBranch: string;
  version: string;
  authors: string;
  crxjsBuild: boolean;
}

export function getBuildConfig(mode: string) {
  const env = loadEnv(mode, rootDir, "");
  return {
    REPO_BRANCH: env.GITHUB_REF_NAME || env.REPO_BRANCH || "master",
    IS_STORE_BUILD: env.IS_STORE_BUILD === "true",
    CHROME_EXTENSION_ID: env.CHROME_EXTENSION_ID || "EXTENSION_ID",
    FIREFOX_ADDON_ID: env.FIREFOX_ADDON_ID || env.GECKO_ID || "vot-ext@firefox",
    FIREFOX_STRICT_MIN_VERSION:
      env.FIREFOX_STRICT_MIN_VERSION?.trim() || "140.0",
    FIREFOX_ANDROID_STRICT_MIN_VERSION:
      env.FIREFOX_ANDROID_STRICT_MIN_VERSION?.trim(),
    FIREFOX_ANDROID_STRICT_MAX_VERSION:
      env.FIREFOX_ANDROID_STRICT_MAX_VERSION?.trim(),
    FIREFOX_DATA_COLLECTION_REQUIRED: env.FIREFOX_DATA_COLLECTION_REQUIRED,
    FIREFOX_DATA_COLLECTION_OPTIONAL: env.FIREFOX_DATA_COLLECTION_OPTIONAL,
    REQUIRED_ANDROID_MIN_VERSION:
      env.REQUIRED_ANDROID_MIN_VERSION?.trim() || "142.0",
  } as const;
}

export type BuildConfig = ReturnType<typeof getBuildConfig>;

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
