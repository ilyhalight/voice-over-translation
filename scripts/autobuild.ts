import { $ } from "bun";

import headers from "../src/headers.json";

const EXTENSION_NAME = "vot-extension";

const FIREFOX_EXTENSION_NAME = `${EXTENSION_NAME}-firefox`;
const CHROME_EXTENSION_NAME = `${EXTENSION_NAME}-chrome`;

const OUTPUT_EXTENSION_FIREFOX_NAME = `${EXTENSION_NAME}-${headers.version}-firefox`;
const OUTPUT_EXTENSION_CHROME_NAME = `${EXTENSION_NAME}-${headers.version}-chrome`;

async function main() {
  console.log("Starting autobuild...");
  console.log("Clearing output directory...");
  await $`rm -rf .output`.quiet(false);
  await $`mkdir -p .output`.quiet(false);

  console.log("Building extension source zip...");
  await $`bun zip:source`.quiet(false);
  console.log("Building extension as an userscript...");
  await $`bun build:gm`.quiet(false);

  console.log("Building extension in store mode...");
  await $`bun build:ext`
    .env({
      ...process.env,
      IS_STORE_BUILD: "true",
      FIREFOX_ADDON_ID: "vot-ext-store@firefox",
    })
    .quiet(false);

  console.log("Copying store build to output directory...");
  await $`cp dist-ext/${FIREFOX_EXTENSION_NAME}.xpi .output/${OUTPUT_EXTENSION_FIREFOX_NAME}-store.xpi`.quiet(
    false,
  );
  await $`cp dist-ext/${CHROME_EXTENSION_NAME}.zip .output/${OUTPUT_EXTENSION_CHROME_NAME}-store.zip`.quiet(
    false,
  );

  console.log("Building extension in non-store mode...");
  await $`bun build:ext`
    .env({
      ...process.env,
      IS_STORE_BUILD: "false",
    })
    .quiet(false);
  console.log("Copying non-store firefox build to output directory...");
  await $`cp dist-ext/${FIREFOX_EXTENSION_NAME}.xpi .output/${OUTPUT_EXTENSION_FIREFOX_NAME}.xpi`.quiet(
    false,
  );

  await $`bunx @biomejs/biome check --write --unsafe dist-ext/${FIREFOX_EXTENSION_NAME}-updates.json`.quiet(
    false,
  );
}

await main();
