import fs from "node:fs/promises";
import path from "node:path";
import { signAddon } from "web-ext/util/submit-addon";
import {
  FIREFOX_UPDATES_MANIFEST_PATH,
  FIREFOX_XPI_PATH,
} from "../../vite/lib/paths";
import { OUTPUT_DIR_PATH, OUTPUT_SOURCE_FILE_PATH } from "./paths";

const AMO_API_KEY = process.env.AMO_API_KEY;
const AMO_API_SECRET = process.env.AMO_API_SECRET;

const getExtensionId = async () => {
  if (!(await fs.exists(FIREFOX_UPDATES_MANIFEST_PATH))) {
    throw new Error(
      `Firefox extension file ${FIREFOX_UPDATES_MANIFEST_PATH} doesn't exist.`,
    );
  }

  try {
    const content = await fs.readFile(FIREFOX_UPDATES_MANIFEST_PATH);
    const data = await JSON.parse(content.toString());
    return Object.keys(data.addons)[0];
  } catch {
    return null;
  }
};

export async function signFirefoxExtension() {
  if (!AMO_API_KEY || !AMO_API_SECRET) {
    console.log(
      "AMO_API_KEY and AMO_API_SECRET environment variables aren't set. Skipping signing",
    );
    return;
  }

  if (!(await fs.exists(OUTPUT_SOURCE_FILE_PATH))) {
    console.log(
      `Source file ${OUTPUT_SOURCE_FILE_PATH} doesn't exist. Skipping signing`,
    );
    return;
  }

  if (!(await fs.exists(FIREFOX_XPI_PATH))) {
    console.log(
      `Firefox extension file ${FIREFOX_XPI_PATH} doesn't exist. Skipping signing`,
    );
    return;
  }

  const extensionId = await getExtensionId();
  if (!extensionId) {
    console.log(
      `Couldn't determine the extension ID from ${FIREFOX_UPDATES_MANIFEST_PATH}. Skipping signing`,
    );
    return;
  }

  console.log(`Signing the Firefox extension (${extensionId}) with AMO...`);

  const {
    downloadedFiles: [signedFile],
  } = await signAddon({
    userAgentString: "vot-extension-autobuild/1.0",
    amoBaseUrl: "https://addons.mozilla.org/api/v5/",
    downloadDir: OUTPUT_DIR_PATH,
    apiKey: process.env.AMO_API_KEY,
    apiSecret: process.env.AMO_API_SECRET,
    id: extensionId,
    xpiPath: FIREFOX_XPI_PATH,
    savedUploadUuidPath: ".amo-upload-uuid",
    channel: "unlisted",
    submissionSource: OUTPUT_SOURCE_FILE_PATH,
  });
  console.log(`Firefox extension (${extensionId}) signed successfully`);

  const signedFilePath = path.join(OUTPUT_DIR_PATH, signedFile);
  await fs.cp(signedFilePath, FIREFOX_XPI_PATH, { force: true });
  console.log(`Signed Firefox extension saved as ${FIREFOX_XPI_PATH}`);
}

if (import.meta.main) {
  await signFirefoxExtension();
}
