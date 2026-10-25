import fs from "node:fs/promises";
import path from "node:path";
import { zipDir } from "../../../scripts/zip/utils";
import type { BuildConfig } from "../env";
import {
  CHROME_ZIP_FILE,
  DIST_EXT_DIR,
  getReleaseDownloadBase,
} from "../paths";

async function writeChromeUpdatesManifest({
  version,
  extensionId,
}: {
  version: string;
  extensionId: string;
}): Promise<string> {
  const updatesManifestPath = path.join(DIST_EXT_DIR, "update.xml");
  const packageUrl = `${getReleaseDownloadBase(version)}/${CHROME_ZIP_FILE}`;
  const xml =
    `<?xml version='1.0' encoding='UTF-8'?>\n` +
    `<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>\n` +
    `  <app appid='${extensionId}'>\n` +
    `    <updatecheck codebase='${packageUrl}' version='${version}' />\n` +
    `  </app>\n` +
    `</gupdate>\n`;

  await fs.writeFile(updatesManifestPath, xml, "utf8");
  return updatesManifestPath;
}

/**
 * Packages an already-built Chrome extension directory (e.g. WXT's
 * `.output/chrome-mv3`) into dist-ext and writes the self-hosted update.xml.
 */
export async function finalizeChromeBuild(
  sourceDir: string,
  config: BuildConfig,
  headers: {
    version?: string;
    author?: string;
  },
): Promise<void> {
  const version = String(headers.version || "");

  const zipPath = path.join(DIST_EXT_DIR, CHROME_ZIP_FILE);
  await zipDir(sourceDir, zipPath);

  const updatesPath = await writeChromeUpdatesManifest({
    version,
    extensionId: config.CHROME_EXTENSION_ID,
  });

  console.log(`Chrome package: ${zipPath}`);
  console.log(`Chrome updates: ${updatesPath}`);
}
