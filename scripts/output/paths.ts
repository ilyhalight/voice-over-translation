import path from "node:path";

import headers from "../../src/headers.json";
import { EXTENSION_NAME, ROOT_DIR } from "../../vite/lib/paths";

export const OUTPUT_DIR_PATH = path.join(ROOT_DIR, ".output");

export const OUTPUT_EXTENSION_FIREFOX_NAME = `${EXTENSION_NAME}-${headers.version}-firefox`;
export const OUTPUT_EXTENSION_CHROME_NAME = `${EXTENSION_NAME}-${headers.version}-chrome`;

export const OUTPUT_SOURCE_FILENAME = `vot-extension-${headers.version}-firefox-source.zip`;
export const OUTPUT_SOURCE_FILE_PATH = path.join(
  OUTPUT_DIR_PATH,
  OUTPUT_SOURCE_FILENAME,
);
