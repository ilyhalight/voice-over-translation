import path from "node:path";
import { zipDir } from "../../../scripts/zip/utils";
import { getBuildConfig } from "../env";
import { FIREFOX_XPI_PATH } from "../paths";
import { finalizeChromeBuild } from "./chrome-postbuild";
import {
  DEFAULT_EXTENSION_VERSION,
  getExtensionHeaders,
  writeFirefoxUpdatesManifest,
} from "./firefox-pipeline";
import { stashSourcemaps } from "./sourcemaps";

/**
 * Packages a finished WXT build (`.output/<browser>-mv3`) into dist-ext and
 * writes the self-hosted updates manifest. Call from the `build:done` hook
 * (production builds only, not dev).
 */
export async function finalizeWxtBuild(
  browser: "chrome" | "firefox",
  outDir: string,
  mode: string,
): Promise<void> {
  const config = getBuildConfig(mode);
  const headers = await getExtensionHeaders();
  const sourceDir = path.resolve(outDir);
  await stashSourcemaps(browser, sourceDir);

  if (browser === "chrome") {
    await finalizeChromeBuild(sourceDir, config, headers);
    return;
  }

  const version = String(headers.version || DEFAULT_EXTENSION_VERSION);
  await zipDir(sourceDir, FIREFOX_XPI_PATH);
  const updatesPath = await writeFirefoxUpdatesManifest({
    version,
    addonId: config.FIREFOX_ADDON_ID,
  });

  console.log(`Firefox package: ${FIREFOX_XPI_PATH}`);
  console.log(`Firefox updates: ${updatesPath}`);
}
