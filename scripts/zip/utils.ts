import fs from "node:fs/promises";
import path from "node:path";

import { COMPRESSION_LEVEL, zip } from "zip-a-folder";

export async function zipDir(
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
