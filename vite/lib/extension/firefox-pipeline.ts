import fs from "node:fs/promises";
import path from "node:path";
import type { BuildConfig } from "../env";
import {
  FIREFOX_UPDATES_MANIFEST_FILE,
  FIREFOX_UPDATES_MANIFEST_PATH,
  FIREFOX_XPI_FILE,
  getReleaseDownloadBase,
  SOURCE_DIR,
} from "../paths";
import type { ExtensionHeaders } from "./manifest-helpers";

export const DEFAULT_EXTENSION_VERSION = "0.0.0";

// ----------------------------------------------------------------
// Utilities
// ----------------------------------------------------------------

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

export async function getLocaleCodes(): Promise<string[]> {
  const localesDir = path.join(SOURCE_DIR, "localization", "locales");
  const entries = await fs.readdir(localesDir, { withFileTypes: true });

  const codes = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.replace(/\.json$/i, ""))
    .sort((a, b) => a.localeCompare(b));

  const priority = ["auto", "en", "ru"];
  const normalized = [
    ...priority.filter((item) => item === "auto" || codes.includes(item)),
    ...codes.filter((code) => !priority.includes(code)),
  ];

  return [...new Set(normalized)];
}

export async function getExtensionHeaders(): Promise<ExtensionHeaders> {
  return readJson<ExtensionHeaders>(path.join(SOURCE_DIR, "headers.json"));
}

// ----------------------------------------------------------------
// Firefox manifest
// ----------------------------------------------------------------

function compareFirefoxVersions(left: string, right: string): number {
  const leftParts = left
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = right
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const diff = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (diff !== 0) return diff;
  }

  return 0;
}

function getFirefoxAndroidSettings(
  config: BuildConfig,
): Record<string, string> {
  const {
    FIREFOX_ANDROID_STRICT_MIN_VERSION: strictMinVersion,
    FIREFOX_ANDROID_STRICT_MAX_VERSION: strictMaxVersion,
  } = config;

  return {
    ...(strictMinVersion ? { strict_min_version: strictMinVersion } : {}),
    ...(strictMaxVersion ? { strict_max_version: strictMaxVersion } : {}),
  };
}

const parseList = (raw: string): string[] =>
  String(raw)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

// Error reports are opt-in: `technicalAndInteraction` cannot be required, and
// the user can toggle it in the install prompt and in about:addons.
const TECHNICAL_AND_INTERACTION = "technicalAndInteraction";

function getFirefoxDataCollectionPermissions(config: BuildConfig): {
  required: string[];
  optional?: string[];
} {
  const {
    FIREFOX_DATA_COLLECTION_REQUIRED: requiredRaw,
    FIREFOX_DATA_COLLECTION_OPTIONAL: optionalRaw,
  } = config;

  const required = requiredRaw ? parseList(requiredRaw) : ["none"];
  const optional = optionalRaw?.trim()
    ? parseList(optionalRaw)
    : [TECHNICAL_AND_INTERACTION];

  return {
    required,
    ...(optional.length ? { optional } : {}),
  };
}

function getFirefoxAndroidSettingsForDataCollectionPermissions(
  config: BuildConfig,
): Record<string, string> {
  const androidSettings = getFirefoxAndroidSettings(config);
  const androidMinVersion = androidSettings.strict_min_version?.trim();
  const { REQUIRED_ANDROID_MIN_VERSION: requiredAndroidMinVersion } = config;

  if (
    !androidMinVersion ||
    compareFirefoxVersions(androidMinVersion, requiredAndroidMinVersion) < 0
  ) {
    return {
      ...androidSettings,
      strict_min_version: requiredAndroidMinVersion,
    };
  }

  return androidSettings;
}

export function getFirefoxSpecificSettings(config: BuildConfig) {
  const dataCollectionPermissions = getFirefoxDataCollectionPermissions(config);

  return {
    gecko: {
      id: config.FIREFOX_ADDON_ID,
      strict_min_version: config.FIREFOX_STRICT_MIN_VERSION,
      data_collection_permissions: dataCollectionPermissions,
      ...(config.IS_STORE_BUILD
        ? {}
        : {
            update_url: `${getReleaseDownloadBase(config.REPO_BRANCH)}/${FIREFOX_UPDATES_MANIFEST_FILE}`,
          }),
    },
    gecko_android:
      dataCollectionPermissions.required.length ||
      dataCollectionPermissions.optional?.length
        ? getFirefoxAndroidSettingsForDataCollectionPermissions(config)
        : getFirefoxAndroidSettings(config),
  };
}

export async function writeFirefoxUpdatesManifest({
  version,
  addonId,
}: {
  version: string;
  addonId: string;
}): Promise<string> {
  const updatesManifest = {
    addons: {
      [addonId]: {
        updates: [
          {
            version,
            update_link: `${getReleaseDownloadBase(version)}/${FIREFOX_XPI_FILE}`,
          },
        ],
      },
    },
  };

  await fs.writeFile(
    FIREFOX_UPDATES_MANIFEST_PATH,
    JSON.stringify(updatesManifest, null, 3),
    "utf8",
  );

  return FIREFOX_UPDATES_MANIFEST_PATH;
}
