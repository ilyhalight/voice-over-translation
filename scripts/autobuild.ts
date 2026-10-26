import fs from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";
import {
  CHROME_ZIP_FILE,
  DIST_DIR,
  EXT_SOURCEMAPS_DIR,
  FIREFOX_EXTENSION_NAME,
  FIREFOX_XPI_FILE,
  SOURCEMAP_DIR,
} from "../vite/lib/paths";
import {
  OUTPUT_CHROME_STORE_ZIP_PATH,
  OUTPUT_DIR_PATH,
  OUTPUT_FIREFOX_STORE_XPI_PATH,
  OUTPUT_FIREFOX_XPI_PATH,
  OUTPUT_SOURCE_FILE_PATH,
  OUTPUT_WXT_FIREFOX_ZIP_PATH,
} from "./output/paths";

/** Uploaded to Bugsink by release.yml (`sentry-cli sourcemaps upload`). */
const OUTPUT_SOURCEMAPS_PATH = path.join(OUTPUT_DIR_PATH, SOURCEMAP_DIR);

/**
 * Copies stashed maps into `.output/sourcemaps/<target>`, next to (never
 * inside) the packaged zip/xpi files. Run right after each build: the next
 * `build:ext` replaces dist-ext/sourcemaps.
 */
async function collectSourcemaps(source: string, target: string) {
  if (!(await fs.exists(source))) {
    console.warn(`No sourcemaps in ${source}, skipping ${target}.`);
    return;
  }
  await fs.cp(source, path.join(OUTPUT_SOURCEMAPS_PATH, target), {
    recursive: true,
  });
}

async function main() {
  console.log("Starting autobuild...");
  // `.output` is the single WXT output folder for every artifact. Clear it
  // exactly once, before anything is written: `wxt zip -b firefox` puts the
  // Firefox zip and the sources archive here, and the later `wxt build` runs
  // only recreate their own `.output/<browser>-mv*` subfolders.
  console.log(`Clearing output directory (${OUTPUT_DIR_PATH})...`);
  await $`rm -rf ${OUTPUT_DIR_PATH}`.quiet(false);
  await $`mkdir -p ${OUTPUT_DIR_PATH}`.quiet(false);

  console.log("Building Firefox extension and sources zip (wxt zip)...");
  await $`bun run zip:firefox`.quiet(false);
  if (!(await fs.exists(OUTPUT_SOURCE_FILE_PATH))) {
    throw new Error(
      `Sources archive ${OUTPUT_SOURCE_FILE_PATH} wasn't created by wxt zip.`,
    );
  }
  // `wxt zip` also packs the unsigned Firefox build; only the sources archive
  // is needed (Firefox ships as the XPIs below), so keep the zip out of
  // `.output` and the uploaded artifact.
  await fs.rm(OUTPUT_WXT_FIREFOX_ZIP_PATH, { force: true });

  console.log("Building extension as an userscript...");
  await $`bun build:gm`.quiet(false);
  await collectSourcemaps(path.join(DIST_DIR, SOURCEMAP_DIR), "userscript");

  console.log("Building extension in store mode...");
  await $`bun build:ext`
    .env({
      ...process.env,
      IS_STORE_BUILD: "true",
      FIREFOX_ADDON_ID: "vot-ext-store@firefox",
    })
    .quiet(false);
  await collectSourcemaps(EXT_SOURCEMAPS_DIR, "store");

  console.log("Copying store build to output directory...");
  await $`cp dist-ext/${FIREFOX_XPI_FILE} ${OUTPUT_FIREFOX_STORE_XPI_PATH}`.quiet(
    false,
  );
  await $`cp dist-ext/${CHROME_ZIP_FILE} ${OUTPUT_CHROME_STORE_ZIP_PATH}`.quiet(
    false,
  );

  console.log("Building extension in non-store mode...");
  await $`bun build:ext`
    .env({
      ...process.env,
      IS_STORE_BUILD: "false",
    })
    .quiet(false);
  await collectSourcemaps(EXT_SOURCEMAPS_DIR, "non-store");

  await $`bunx @biomejs/biome check --write --unsafe dist-ext/${FIREFOX_EXTENSION_NAME}-updates.json`.quiet(
    false,
  );

  if (process.env.SIGN_FIREFOX === "true") {
    console.log("Signing the Firefox extension...");
    await $`bun sign:firefox`.quiet(false);
  }

  // Copied after signing so `.output` gets the signed XPI with SIGN_FIREFOX=true.
  console.log("Copying non-store firefox build to output directory...");
  await $`cp dist-ext/${FIREFOX_XPI_FILE} ${OUTPUT_FIREFOX_XPI_PATH}`.quiet(
    false,
  );
}

await main();
