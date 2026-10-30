import fs from "node:fs/promises";
import path from "node:path";
import { EXT_SOURCEMAPS_DIR, SOURCEMAP_DIR } from "../paths";

async function listMapFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { recursive: true });
  return entries.filter((entry) => entry.endsWith(".map"));
}

/**
 * Moves the maps out of the extension directory so they never end up in the
 * package. Maps that carry no debug id (standalone scripts without telemetry)
 * are dropped. Debug builds use inline maps, so there may be nothing to stash.
 */
export async function stashSourcemaps(
  browser: "chrome" | "firefox",
  extensionDir: string,
): Promise<void> {
  const source = path.join(extensionDir, SOURCEMAP_DIR);
  const target = path.join(EXT_SOURCEMAPS_DIR, browser);
  await fs.rm(target, { recursive: true, force: true });
  await fs.mkdir(path.dirname(target), { recursive: true });
  try {
    await fs.rename(source, target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  await Promise.all(
    (await listMapFiles(extensionDir)).map((entry) =>
      fs.rm(path.join(extensionDir, entry)),
    ),
  );
}
