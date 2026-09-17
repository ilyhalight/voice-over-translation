import fs from "node:fs/promises";
import path from "node:path";
import { ROOT_DIR } from "../../vite/lib/paths";
import { zipDir } from "../zip/utils";
import {
  OUTPUT_DIR_PATH,
  OUTPUT_SOURCE_FILE_PATH,
  OUTPUT_SOURCE_FILENAME,
} from "./paths";

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
].map((p) => path.join(ROOT_DIR, p));

async function main() {
  console.log(`Zipping source code as ${OUTPUT_SOURCE_FILENAME}...`);
  if (await fs.exists(OUTPUT_SOURCE_FILE_PATH)) {
    console.log("Removing existing zip file...");
    await fs.rm(OUTPUT_SOURCE_FILE_PATH);
  }

  if (!(await fs.exists(OUTPUT_DIR_PATH))) {
    console.log("Creating output directory...");
    await fs.mkdir(OUTPUT_DIR_PATH, { recursive: true });
  }

  const tmpdir = await fs.mkdtemp(path.join(OUTPUT_DIR_PATH, "tmp-"));
  try {
    for (const sourcePath of SOURCE_PATHS) {
      const destPath = path.join(tmpdir, path.relative(ROOT_DIR, sourcePath));
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.cp(sourcePath, destPath, { recursive: true });
    }
    await zipDir(tmpdir, OUTPUT_SOURCE_FILE_PATH);
    console.log(`Source code zipped successfully: ${OUTPUT_SOURCE_FILE_PATH}`);
  } finally {
    console.log("Cleaning up temporary files...");
    await fs.rm(tmpdir, { recursive: true, force: true });
    console.log("Temporary files cleaned up");
  }
}

if (import.meta.main) {
  await main();
}
