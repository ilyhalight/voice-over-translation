import fs from "node:fs/promises";
import path from "node:path";
import { COMPRESSION_LEVEL, zip } from "zip-a-folder";
import type { BuildConfig } from "../env";
import { distExtDir } from "../paths";

const GITHUB_DIST_EXT_RAW_BASE =
  "https://raw.githubusercontent.com/ilyhalight/voice-over-translation/master/dist-ext";
const CHROME_CRX_RAW_URL = `${GITHUB_DIST_EXT_RAW_BASE}/vot-extension-chrome.zip`;

async function zipDir(
  sourceDirPath: string,
  outZipPath: string,
): Promise<void> {
  await fs.rm(outZipPath, { force: true });
  await fs.mkdir(path.dirname(outZipPath), { recursive: true });
  await zip(sourceDirPath, outZipPath, {
    compression: COMPRESSION_LEVEL.high,
    zlib: { level: 9 },
  });
}

export async function writeChromeUpdatesManifest({
  version,
  extensionId,
}: {
  version: string;
  extensionId: string;
}): Promise<string> {
  const updatesManifestPath = path.join(distExtDir, "update.xml");
  const xml =
    `<?xml version='1.0' encoding='UTF-8'?>\n` +
    `<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>\n` +
    `  <app appid='${extensionId}'>\n` +
    `    <updatecheck codebase='${CHROME_CRX_RAW_URL}' version='${version}' />\n` +
    `  </app>\n` +
    `</gupdate>\n`;

  await fs.writeFile(updatesManifestPath, xml, "utf8");
  return updatesManifestPath;
}

export async function finalizeChromeBuild(
  config: BuildConfig,
  headers: {
    version?: string;
    author?: string;
  },
): Promise<void> {
  const chromeDir = path.join(distExtDir, "chrome");
  const version = String(headers.version || "");

  const zipPath = path.join(distExtDir, "vot-extension-chrome.zip");
  await zipDir(chromeDir, zipPath);

  const updatesPath = await writeChromeUpdatesManifest({
    version,
    extensionId: config.CHROME_EXTENSION_ID,
  });

  console.log(`Chrome package: ${zipPath}`);
  console.log(`Chrome updates: ${updatesPath}`);
}

export async function getChromeExtensionBuildEnv(config: BuildConfig): Promise<{
  headers: { version?: string; author?: string };
  locales: string[];
  branch: string;
}> {
  const { getExtensionHeaders, getLocaleCodes } = await import(
    "./firefox-pipeline"
  );
  const [headers, locales] = await Promise.all([
    getExtensionHeaders(),
    getLocaleCodes(),
  ]);
  return { headers, locales, branch: config.REPO_BRANCH };
}
