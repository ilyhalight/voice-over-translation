import { createHmac, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import headers from "../../src/headers.json";
import { FIREFOX_XPI_PATH } from "../../vite/lib/paths";
import { OUTPUT_FIREFOX_XPI_PATH } from "./paths";

const AMO_BASE_URL = "https://addons.mozilla.org/api/v5/";
const AMO_API_KEY = process.env.AMO_API_KEY;
const AMO_API_SECRET = process.env.AMO_API_SECRET;
const ADDON_ID = process.env.FIREFOX_ADDON_ID || "vot-ext@firefox";

function createJwt(apiKey: string, apiSecret: string): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = [
    encode({ alg: "HS256", typ: "JWT" }),
    encode({
      iss: apiKey,
      jti: randomUUID(),
      iat: issuedAt,
      exp: issuedAt + 300,
    }),
  ].join(".");
  const signature = createHmac("sha256", apiSecret)
    .update(unsigned)
    .digest("base64url");

  return `${unsigned}.${signature}`;
}

async function getSignedFileUrl(token: string, version: string) {
  const url = new URL(
    `addons/addon/${encodeURIComponent(ADDON_ID)}/versions/${encodeURIComponent(version)}/`,
    AMO_BASE_URL,
  );
  const response = await fetch(url, {
    headers: { Authorization: `JWT ${token}` },
  });
  if (!response.ok) {
    throw new Error(
      `AMO has no version ${version} of ${ADDON_ID} for these API credentials (${response.status} ${response.statusText}). Sign it first or check the addon id.`,
    );
  }

  const data = (await response.json()) as {
    file?: { url?: string; status?: string };
  };
  if (!data.file?.url) {
    throw new Error(
      `AMO version ${version} has no signed file yet (status: ${data.file?.status ?? "unknown"}).`,
    );
  }

  return { url: data.file.url, status: data.file.status };
}

/**
 * Replaces the unsigned Firefox build with the XPI AMO already signed for the
 * version in `src/headers.json`. Used by a manual release run, where signing
 * again would fail on AMO's duplicate version check.
 */
export async function downloadSignedFirefoxXpi() {
  if (!AMO_API_KEY || !AMO_API_SECRET) {
    throw new Error(
      "AMO_API_KEY and AMO_API_SECRET environment variables aren't set.",
    );
  }

  const version = String(headers.version || "");
  if (!version) {
    throw new Error("Version is missing in src/headers.json.");
  }

  const token = createJwt(AMO_API_KEY, AMO_API_SECRET);
  const signedFile = await getSignedFileUrl(token, version);
  const response = await fetch(new URL(signedFile.url, AMO_BASE_URL), {
    headers: { Authorization: `JWT ${token}` },
  });
  if (!response.ok) {
    throw new Error(
      `Downloading the signed XPI failed (${response.status} ${response.statusText}).`,
    );
  }

  const xpi = Buffer.from(await response.arrayBuffer());
  // Zip magic: anything else means AMO served an error page instead of the file.
  if (xpi[0] !== 0x50 || xpi[1] !== 0x4b) {
    throw new Error("Downloaded file is not an XPI archive.");
  }

  await fs.writeFile(FIREFOX_XPI_PATH, xpi);
  if (await fs.exists(OUTPUT_FIREFOX_XPI_PATH)) {
    await fs.writeFile(OUTPUT_FIREFOX_XPI_PATH, xpi);
  }

  console.log(
    `Signed XPI ${version} (${signedFile.status}) saved to ${FIREFOX_XPI_PATH}`,
  );
}

if (import.meta.main) {
  await downloadSignedFirefoxXpi();
}
