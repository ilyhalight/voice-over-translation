import fs from "node:fs/promises";
import path from "node:path";
import headers from "../../src/headers.json";

import { zipDir } from "./utils";

const ROOT_PATH = path.join(__dirname, "..", "..");
const DIST_EXT_PATH = path.join(ROOT_PATH, ".output");
const OUTPUT_FILENAME = `vot-extension-${headers.version}-firefox-source.zip`;
const OUTPUT_PATH = path.join(DIST_EXT_PATH, OUTPUT_FILENAME);

const SOURCE_PATHS = [
  "src",
  "vite",
  "scripts",
  "README.md",
  "README-EN.md",
  "tsconfig.json",
  "biome.json",
  "bun.lock",
  "package.json",
].map((p) => path.join(ROOT_PATH, p));

async function main() {
  console.log(`Zipping source code as ${OUTPUT_FILENAME}...`);
  if (await fs.exists(OUTPUT_PATH)) {
    console.log("Removing existing zip file...");
    await fs.rm(OUTPUT_PATH);
  }

  if (!(await fs.exists(DIST_EXT_PATH))) {
    console.log("Creating output directory...");
    await fs.mkdir(DIST_EXT_PATH, { recursive: true });
  }

  const tmpdir = await fs.mkdtemp(path.join(DIST_EXT_PATH, "tmp-"));
  try {
    for (const sourcePath of SOURCE_PATHS) {
      const destPath = path.join(tmpdir, path.relative(ROOT_PATH, sourcePath));
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.cp(sourcePath, destPath, { recursive: true });
    }
    await zipDir(tmpdir, OUTPUT_PATH);
    console.log(`Source code zipped successfully: ${OUTPUT_PATH}`);
  } finally {
    console.log("Cleaning up temporary files...");
    await fs.rm(tmpdir, { recursive: true, force: true });
    console.log("Temporary files cleaned up");
  }
}

if (import.meta.main) {
  await main();
}
