import { loadEnv } from "vite";
import { defineConstants, type ViteDefine } from "./define.ts";
import { ROOT_DIR } from "./paths.ts";

export interface BuildEnvMeta {
  debug: boolean;
  isExtension: boolean;
  availableLocales: readonly string[];
  repoBranch: string;
  version: string;
  authors: string;
  browser?: "chrome" | "firefox";
  minified?: boolean;
  localFile?: boolean;
}

function getBuildVariant(env: BuildEnvMeta): string {
  if (env.isExtension) return env.browser ?? "chrome";
  return env.minified ? "userscript-min" : "userscript";
}

export function getBuildConfig(mode: string) {
  const env = loadEnv(mode, ROOT_DIR, "");
  return {
    REPO_BRANCH: env.GITHUB_REF_NAME || env.REPO_BRANCH || "master",
    IS_STORE_BUILD: env.IS_STORE_BUILD === "true",
    CHROME_EXTENSION_ID: env.CHROME_EXTENSION_ID || "EXTENSION_ID",
    FIREFOX_ADDON_ID: env.FIREFOX_ADDON_ID || env.GECKO_ID || "vot-ext@firefox",
    FIREFOX_STRICT_MIN_VERSION:
      env.FIREFOX_STRICT_MIN_VERSION?.trim() || "128.0",
    FIREFOX_ANDROID_STRICT_MIN_VERSION:
      env.FIREFOX_ANDROID_STRICT_MIN_VERSION?.trim(),
    FIREFOX_ANDROID_STRICT_MAX_VERSION:
      env.FIREFOX_ANDROID_STRICT_MAX_VERSION?.trim(),
    FIREFOX_DATA_COLLECTION_REQUIRED: env.FIREFOX_DATA_COLLECTION_REQUIRED,
    FIREFOX_DATA_COLLECTION_OPTIONAL: env.FIREFOX_DATA_COLLECTION_OPTIONAL,
    REQUIRED_ANDROID_MIN_VERSION:
      env.REQUIRED_ANDROID_MIN_VERSION?.trim() || "128.0",
  } as const;
}

export type BuildConfig = ReturnType<typeof getBuildConfig>;

/**
 * DEBUG_MODE resolution: an explicit `DEBUG_MODE` env var (process.env or
 * .env.[mode] files) overrides the command/mode-based default.
 */
export function resolveDebugMode(mode: string, fallback: boolean): boolean {
  const raw = (process.env.DEBUG_MODE ?? loadEnv(mode, ROOT_DIR, "").DEBUG_MODE)
    ?.trim()
    .toLowerCase();
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return fallback;
}

/**
 * Experimental local file (file://) translation. Opt-in per build with
 * `VOT_LOCAL_FILE=true`; off everywhere else.
 */
export function resolveLocalFileExperiment(mode: string): boolean {
  const raw = (
    process.env.VOT_LOCAL_FILE ?? loadEnv(mode, ROOT_DIR, "").VOT_LOCAL_FILE
  )
    ?.trim()
    .toLowerCase();
  return raw === "true" || raw === "1";
}

export function buildDefine(env: BuildEnvMeta): ViteDefine {
  return {
    ...defineConstants({
      DEBUG_MODE: env.debug,
      IS_EXTENSION: env.isExtension,
      AVAILABLE_LOCALES: [...env.availableLocales],
      REPO_BRANCH: env.repoBranch,
      VOT_BUILD_VARIANT: getBuildVariant(env),
      VOT_VERSION: env.version,
      VOT_AUTHORS: env.authors,
      VOT_LOCAL_FILE: env.localFile ?? false,
    }),
  };
}
