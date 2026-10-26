import path from "node:path";

import headers from "../../src/headers.json";
import { EXTENSION_NAME, OUTPUT_DIR } from "../../vite/lib/paths";

/** Single output folder (WXT `outDir`) for every build/release artifact. */
export const OUTPUT_DIR_PATH = OUTPUT_DIR;

export const OUTPUT_EXTENSION_FIREFOX_NAME = `${EXTENSION_NAME}-${headers.version}-firefox`;
export const OUTPUT_EXTENSION_CHROME_NAME = `${EXTENSION_NAME}-${headers.version}-chrome`;

export const OUTPUT_FIREFOX_XPI_PATH = path.join(
  OUTPUT_DIR_PATH,
  `${OUTPUT_EXTENSION_FIREFOX_NAME}.xpi`,
);
export const OUTPUT_FIREFOX_STORE_XPI_PATH = path.join(
  OUTPUT_DIR_PATH,
  `${OUTPUT_EXTENSION_FIREFOX_NAME}-store.xpi`,
);
export const OUTPUT_CHROME_STORE_ZIP_PATH = path.join(
  OUTPUT_DIR_PATH,
  `${OUTPUT_EXTENSION_CHROME_NAME}-store.zip`,
);

// Written by `wxt zip -b firefox` (zip.sourcesTemplate in wxt.config.ts).
export const OUTPUT_SOURCE_FILENAME = `${EXTENSION_NAME}-${headers.version}-sources.zip`;
export const OUTPUT_SOURCE_FILE_PATH = path.join(
  OUTPUT_DIR_PATH,
  OUTPUT_SOURCE_FILENAME,
);
