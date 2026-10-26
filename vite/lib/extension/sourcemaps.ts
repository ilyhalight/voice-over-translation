import fs from "node:fs/promises";
import path from "node:path";
import { EXT_SOURCEMAPS_DIR, SOURCEMAP_DIR } from "../paths";

async function listMapFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { recursive: true });
  return entries.filter((entry) => entry.endsWith(".map"));
}

/**
 * Moves the maps out of the extension directory so they never end up in the
 * package. Maps that carry no debug id (crxjs internals, standalone scripts
 * without telemetry) are dropped.
 */
export async function stashChromeSourcemaps(chromeDir: string): Promise<void> {
  const target = path.join(EXT_SOURCEMAPS_DIR, "chrome");
  await fs.rm(target, { recursive: true, force: true });
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.rename(path.join(chromeDir, SOURCEMAP_DIR), target);

  await Promise.all(
    (await listMapFiles(chromeDir)).map((entry) =>
      fs.rm(path.join(chromeDir, entry)),
    ),
  );
}

/** The Firefox background bundle is shipped as `background.js`. */
export async function stashFirefoxSourcemaps(tmpDir: string): Promise<void> {
  const target = path.join(EXT_SOURCEMAPS_DIR, "firefox");
  await fs.rm(target, { recursive: true, force: true });
  await fs.mkdir(target, { recursive: true });

  for (const entry of await listMapFiles(path.join(tmpDir, SOURCEMAP_DIR))) {
    const source = path.join(tmpDir, SOURCEMAP_DIR, entry);
    if (entry !== "background-ff.js.map") {
      await fs.copyFile(source, path.join(target, entry));
      continue;
    }

    const map = JSON.parse(await fs.readFile(source, "utf8"));
    map.file = "background.js";
    await fs.writeFile(
      path.join(target, "background.js.map"),
      JSON.stringify(map),
    );
  }
}
