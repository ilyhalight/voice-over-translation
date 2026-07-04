import fs from "node:fs/promises";
import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import { defineConfig } from "vite";
import { COMPRESSION_LEVEL, zip } from "zip-a-folder";
import manifest from "../manifest.config";
import { defineConstants, rootDir, srcDir } from "./vite.base.config";
import {
  getExtensionHeaders,
  getLocaleCodes,
  getRepoBranch,
} from "./vite.extension.shared";

const outBase = path.join(rootDir, "dist-ext");

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

const GITHUB_DIST_EXT_RAW_BASE =
  "https://raw.githubusercontent.com/ilyhalight/voice-over-translation/master/dist-ext";
const CHROME_CRX_RAW_URL = `${GITHUB_DIST_EXT_RAW_BASE}/vot-extension-chrome.zip`;

function getChromeExtensionId(): string {
  return process.env.CHROME_EXTENSION_ID || "EXTENSION_ID";
}

async function writeChromeUpdatesManifest({
  version,
  extensionId,
}: {
  version: string;
  extensionId: string;
}): Promise<string> {
  const updatesManifestPath = path.join(outBase, "update.xml");
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

/**
 * CRXJS-based Chrome extension build.
 *
 */
export default defineConfig(async () => {
  const headers = await getExtensionHeaders();
  const locales = await getLocaleCodes();
  const branch = getRepoBranch();

  return {
    define: {
      ...defineConstants({
        DEBUG_MODE: false,
        IS_EXTENSION: true,
        AVAILABLE_LOCALES: locales,
        REPO_BRANCH: branch,
        VOT_VERSION: String(headers.version || ""),
        VOT_AUTHORS: String(headers.author || ""),
      }),
      "import.meta.env.VITE_CRXJS_BUILD": '"true"',
    },
    resolve: {
      alias: {
        // CRXJS creates its own internal Rollup/Vite builds for each content-script
        // entry and the service worker. The node:crypto alias defined in
        // vite.base.config.ts applies to the user-facing config but CRXJS's
        // internal rebuilds may not inherit it, causing node:crypto to be
        // externalized into an empty __vite-browser-external stub that creates a
        // circular dependency back to the main chunk.
        //
        // By re-declaring the alias here we ensure it is present in every CRXJS-
        // generated sub-build.
        "node:crypto": path.resolve(srcDir, "shims", "nodeCrypto.ts"),
      },
    },
    plugins: [
      crx({ manifest }),
      {
        name: "zip-chrome-output",
        async closeBundle() {
          const chromeDir = path.join(outBase, "chrome");
          const version = String(headers.version || "");

          const zipPath = path.join(outBase, "vot-extension-chrome.zip");
          await zipDir(chromeDir, zipPath);

          const updatesPath = await writeChromeUpdatesManifest({
            version,
            extensionId: getChromeExtensionId(),
          });

          console.log(`Chrome package: ${zipPath}`);
          console.log(`Chrome updates: ${updatesPath}`);
        },
      },
    ],
    build: {
      outDir: "dist-ext/chrome",
      emptyOutDir: true,
      chunkSizeWarningLimit: 700,
      rolldownOptions: {
        treeshake: true,
      },
    },
  };
});
