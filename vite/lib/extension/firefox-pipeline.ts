import fs from "node:fs/promises";
import path from "node:path";
import { type UserConfig, build as viteBuild } from "vite";
import { COMPRESSION_LEVEL, zip } from "zip-a-folder";
import { type BuildEnvMeta, buildDefine } from "../env";
import {
  distExtDir,
  outTmp,
  rootDir,
  singleFileBuildOptions,
  srcDir,
} from "../paths";
import { createBaseViteConfig } from "../vite-base-config";
import {
  buildManifestChrome,
  EXTENSION_ICON_SIZES,
  type ExtensionHeaders,
} from "./manifest-helpers";

export { distExtDir, outTmp, srcDir } from "../paths";
export type { ExtensionHeaders } from "./manifest-helpers";

const DEFAULT_EXTENSION_VERSION = "0.0.0";
const EXTENSION_LOADER_FILES = ["prelude.js", "content.js"] as const;
const EXTENSION_MODULE_FILES = [
  "prelude.module.js",
  "content.module.js",
] as const;

const GITHUB_DIST_EXT_RAW_BASE =
  "https://raw.githubusercontent.com/ilyhalight/voice-over-translation/master/dist-ext";
const FIREFOX_UPDATES_MANIFEST_FILE = "vot-extension-firefox-updates.json";
const FIREFOX_UPDATES_MANIFEST_URL = `${GITHUB_DIST_EXT_RAW_BASE}/${FIREFOX_UPDATES_MANIFEST_FILE}`;

export interface ExtensionBuildContext {
  availableLocales: string[];
  repoBranch: string;
}

interface ExtensionEntry {
  entry: string;
  fileName: string;
  emptyOutDir: boolean;
}

const extensionEntries: ExtensionEntry[] = [
  {
    entry: "src/index.ts",
    fileName: "content.module.js",
    emptyOutDir: true,
  },
  {
    entry: "src/extension/prelude.ts",
    fileName: "prelude.module.js",
    emptyOutDir: false,
  },
  {
    entry: "src/extension/bridge.ts",
    fileName: "bridge.js",
    emptyOutDir: false,
  },
  {
    entry: "src/extension/background.ts",
    fileName: "background.js",
    emptyOutDir: false,
  },
  {
    entry: "src/extension/background.ts",
    fileName: "background-ff.js",
    emptyOutDir: false,
  },
];

// ----------------------------------------------------------------
// Utilities
// ----------------------------------------------------------------

export async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function ensureCleanDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

export async function getLocaleCodes(): Promise<string[]> {
  const localesDir = path.join(srcDir, "localization", "locales");
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

export function getRepoBranch(): string {
  return process.env.GITHUB_REF_NAME || process.env.REPO_BRANCH || "master";
}

export async function createExtensionBuildContext(): Promise<ExtensionBuildContext> {
  return {
    availableLocales: await getLocaleCodes(),
    repoBranch: getRepoBranch(),
  };
}

export async function getExtensionHeaders(): Promise<ExtensionHeaders> {
  return readJson<ExtensionHeaders>(path.join(srcDir, "headers.json"));
}

export async function getFirefoxBuildEnv(): Promise<BuildEnvMeta> {
  const headers = await getExtensionHeaders();
  const locales = await getLocaleCodes();
  const branch = getRepoBranch();

  return {
    debug: false,
    isExtension: true,
    availableLocales: locales,
    repoBranch: branch,
    version: String(headers.version || ""),
    authors: String(headers.author || ""),
    crxjsBuild: false,
  };
}

// ----------------------------------------------------------------
// Firefox bundle building
// ----------------------------------------------------------------

function createExtensionEntryConfig(
  entry: ExtensionEntry,
  define: UserConfig["define"],
): UserConfig {
  const baseConfig = createBaseViteConfig({
    cacheName: "firefox-extension-bundles",
  });

  return {
    ...baseConfig,
    configFile: false,
    define,
    build: {
      ...baseConfig.build,
      ...singleFileBuildOptions,
      outDir: outTmp,
      emptyOutDir: entry.emptyOutDir,
      sourcemap: false,
      minify: "oxc",
      lib: {
        entry: path.join(rootDir, entry.entry),
        name: "VOT",
        formats: ["es"],
        fileName: () => entry.fileName,
      },
    },
  };
}

async function buildEntry(
  entry: ExtensionEntry,
  define: UserConfig["define"],
): Promise<void> {
  await viteBuild(createExtensionEntryConfig(entry, define));
}

export async function buildExtensionBundles({
  context,
  headers,
}: {
  context: ExtensionBuildContext;
  headers: ExtensionHeaders;
}): Promise<void> {
  const define = buildDefine({
    debug: false,
    isExtension: true,
    availableLocales: context.availableLocales,
    repoBranch: context.repoBranch,
    version: String(headers.version || ""),
    authors: String(headers.author || ""),
    crxjsBuild: false,
  });

  await ensureCleanDir(outTmp);

  for (const entry of extensionEntries) {
    await buildEntry(entry, define);
  }
}

async function copyExtensionFiles(targetDir: string): Promise<void> {
  const iconsDstDir = path.join(targetDir, "icons");
  await Promise.all([
    fs.mkdir(targetDir, { recursive: true }),
    fs.mkdir(iconsDstDir, { recursive: true }),
  ]);

  const bundleFiles = await fs.readdir(outTmp);
  const frontEndJsFiles = bundleFiles.filter((fileName) => {
    if (!fileName.endsWith(".js")) return false;
    return !["background.js", "background-ff.js"].includes(fileName);
  });

  const iconsSrcDir = path.join(srcDir, "extension", "icons");
  const iconFiles = await fs.readdir(iconsSrcDir);

  await Promise.all([
    // Front-end JS bundles
    ...frontEndJsFiles.map((fileName) =>
      fs.copyFile(path.join(outTmp, fileName), path.join(targetDir, fileName)),
    ),
    // Empty loader stubs
    ...EXTENSION_LOADER_FILES.map((fileName) =>
      fs.writeFile(path.join(targetDir, fileName), "\n", "utf8"),
    ),
    // Firefox background (renamed from background-ff.js)
    fs.copyFile(
      path.join(outTmp, "background-ff.js"),
      path.join(targetDir, "background.js"),
    ),
    // Icon files
    ...iconFiles.map((iconFile) =>
      fs.copyFile(
        path.join(iconsSrcDir, iconFile),
        path.join(iconsDstDir, iconFile),
      ),
    ),
  ]);
}

// ----------------------------------------------------------------
// Firefox manifest
// ----------------------------------------------------------------

function getFirefoxAddonId(): string {
  return (
    process.env.FIREFOX_ADDON_ID ||
    process.env.GECKO_ID ||
    "vot-extension@firefox"
  );
}

function getFirefoxStrictMinVersion(): string {
  return process.env.FIREFOX_STRICT_MIN_VERSION || "140.0";
}

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

function getFirefoxAndroidSettings(): Record<string, string> {
  const strictMinVersion =
    process.env.FIREFOX_ANDROID_STRICT_MIN_VERSION?.trim();
  const strictMaxVersion =
    process.env.FIREFOX_ANDROID_STRICT_MAX_VERSION?.trim();

  return {
    ...(strictMinVersion ? { strict_min_version: strictMinVersion } : {}),
    ...(strictMaxVersion ? { strict_max_version: strictMaxVersion } : {}),
  };
}

function getFirefoxDataCollectionPermissions(): {
  required: string[];
  optional?: string[];
} {
  const requiredRaw = process.env.FIREFOX_DATA_COLLECTION_REQUIRED;
  const optionalRaw = process.env.FIREFOX_DATA_COLLECTION_OPTIONAL;

  const parseList = (raw: string): string[] =>
    String(raw)
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

  const required = requiredRaw ? parseList(requiredRaw) : ["none"];
  const optional = optionalRaw ? parseList(optionalRaw) : null;

  return {
    required,
    ...(optional?.length ? { optional } : {}),
  };
}

function getFirefoxAndroidSettingsForDataCollectionPermissions(): Record<
  string,
  string
> {
  const androidSettings = getFirefoxAndroidSettings();
  const androidMinVersion = androidSettings.strict_min_version?.trim();
  const requiredAndroidMinVersion = "142.0";

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

function getFirefoxXpiRawUrl(): string {
  return `${GITHUB_DIST_EXT_RAW_BASE}/vot-extension-firefox.xpi`;
}

function buildManifestFirefox({
  headers,
  includeWorld,
}: {
  headers: ExtensionHeaders;
  includeWorld: boolean;
}): Record<string, unknown> {
  const manifest = buildManifestChrome({ headers, includeWorld });
  const dataCollectionPermissions = getFirefoxDataCollectionPermissions();

  const action = manifest.action as Record<string, unknown> | undefined;
  const defaultIcon = action?.default_icon as
    | Record<string, unknown>
    | undefined;
  if (defaultIcon) {
    defaultIcon[64] = "icons/icon-64.png";
  }

  delete manifest.update_url;
  delete manifest.background;
  manifest.background = {
    scripts: ["background.js"],
  };
  manifest.browser_specific_settings = {
    gecko: {
      id: getFirefoxAddonId(),
      update_url: FIREFOX_UPDATES_MANIFEST_URL,
      strict_min_version: getFirefoxStrictMinVersion(),
      data_collection_permissions: dataCollectionPermissions,
    },
    gecko_android:
      dataCollectionPermissions.required.length ||
      dataCollectionPermissions.optional?.length
        ? getFirefoxAndroidSettingsForDataCollectionPermissions()
        : getFirefoxAndroidSettings(),
  };

  return manifest;
}

async function writeManifest(
  targetDir: string,
  manifest: Record<string, unknown>,
): Promise<void> {
  await fs.writeFile(
    path.join(targetDir, "manifest.json"),
    JSON.stringify(manifest, null, 3),
    "utf8",
  );
}

async function writeFirefoxUpdatesManifest({
  version,
  addonId,
}: {
  version: string;
  addonId: string;
}): Promise<string> {
  const updatesManifestPath = path.join(
    distExtDir,
    FIREFOX_UPDATES_MANIFEST_FILE,
  );
  const updatesManifest = {
    addons: {
      [addonId]: {
        updates: [
          {
            version,
            update_link: getFirefoxXpiRawUrl(),
          },
        ],
      },
    },
  };

  await fs.writeFile(
    updatesManifestPath,
    JSON.stringify(updatesManifest, null, 3),
    "utf8",
  );

  return updatesManifestPath;
}

async function zipDir(
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

// ----------------------------------------------------------------
// Firefox verification
// ----------------------------------------------------------------

function isValidMatchPattern(pattern: string): boolean {
  if (pattern === "<all_urls>") return true;
  return /^(\*|http|https|file|ftp|ws|wss):\/\/(\*|\*\.[^/*]+|[^/*]+)\/.*$/.test(
    pattern,
  );
}

function assertValidPatterns(label: string, patterns: string[] = []): void {
  for (const pattern of patterns) {
    if (!isValidMatchPattern(pattern)) {
      throw new Error(
        `firefox: ${label} contains malformed URL pattern: ${pattern}`,
      );
    }
  }
}

function assertOriginFallbackPathIsWildcard(patterns: string[] = []): void {
  for (const pattern of patterns) {
    const match = /^[^:]+:\/\/[^/]+(\/.*)$/.exec(pattern);
    const pathPart = match ? match[1] : null;
    if (pathPart !== "/*") {
      throw new Error(
        `firefox: match_origin_as_fallback requires path /*. Got: ${pattern}`,
      );
    }
  }
}

async function verifyManifest(
  manifestPath: string,
): Promise<Record<string, any>> {
  if (!(await exists(manifestPath))) {
    throw new Error(`firefox: missing manifest.json at ${manifestPath}`);
  }

  const manifest = await readJson<Record<string, any>>(manifestPath);
  if (manifest.manifest_version !== 3) {
    throw new Error(
      `firefox: expected manifest_version 3, got ${manifest.manifest_version}`,
    );
  }

  return manifest;
}

function verifyFirefoxManifestFields(manifest: Record<string, any>): void {
  const permissions = new Set(manifest.permissions || []);
  if (
    !permissions.has("declarativeNetRequestWithHostAccess") &&
    !permissions.has("declarativeNetRequest")
  ) {
    throw new Error(
      "firefox: expected declarativeNetRequestWithHostAccess or declarativeNetRequest permission",
    );
  }

  if (
    !Array.isArray(manifest.background?.scripts) ||
    !manifest.background.scripts.length
  ) {
    throw new Error("firefox: expected background.scripts[]");
  }
  if (
    manifest.browser_specific_settings?.gecko?.update_url !==
    FIREFOX_UPDATES_MANIFEST_URL
  ) {
    throw new Error(
      `firefox: expected browser_specific_settings.gecko.update_url to be ${FIREFOX_UPDATES_MANIFEST_URL}`,
    );
  }
  if (
    !manifest.browser_specific_settings?.gecko_android ||
    typeof manifest.browser_specific_settings.gecko_android !== "object" ||
    Array.isArray(manifest.browser_specific_settings.gecko_android)
  ) {
    throw new Error(
      "firefox: expected browser_specific_settings.gecko_android to be an object",
    );
  }
}

function verifyContentScripts(manifest: Record<string, any>): void {
  assertValidPatterns("host_permissions", manifest.host_permissions);

  let sawOriginFallback = false;
  for (const contentScript of manifest.content_scripts || []) {
    assertValidPatterns("content_scripts.matches", contentScript.matches);

    if (contentScript.all_frames !== true) {
      throw new Error(
        "firefox: content_scripts entry must set all_frames: true",
      );
    }
    if (contentScript.match_about_blank !== true) {
      throw new Error(
        "firefox: content_scripts entry must set match_about_blank: true",
      );
    }

    if (contentScript.match_origin_as_fallback === true) {
      sawOriginFallback = true;
      assertOriginFallbackPathIsWildcard(contentScript.matches);
    }
  }

  if (!sawOriginFallback) {
    throw new Error(
      "firefox: expected at least one content_scripts entry with match_origin_as_fallback: true",
    );
  }
}

async function verifyRequiredOutputFiles(dir: string): Promise<void> {
  const requiredFiles = [
    "bridge.js",
    ...EXTENSION_LOADER_FILES,
    ...EXTENSION_MODULE_FILES,
    "background.js",
    ...EXTENSION_ICON_SIZES.map((size) => `icons/icon-${size}.png`),
  ];

  const results = await Promise.all(
    requiredFiles.map(async (relPath) => ({
      relPath,
      exists: await exists(path.join(dir, relPath)),
    })),
  );

  for (const { relPath, exists: fileExists } of results) {
    if (!fileExists) {
      throw new Error(`firefox: missing required file: ${relPath}`);
    }
  }
}

async function verifyBundleSources(dir: string): Promise<void> {
  // Read all bundle files in parallel.
  const [bridge, prelude, preludeModule, content, contentModule, background] =
    await Promise.all([
      fs.readFile(path.join(dir, "bridge.js"), "utf8"),
      fs.readFile(path.join(dir, "prelude.js"), "utf8"),
      fs.readFile(path.join(dir, "prelude.module.js"), "utf8"),
      fs.readFile(path.join(dir, "content.js"), "utf8"),
      fs.readFile(path.join(dir, "content.module.js"), "utf8"),
      fs.readFile(path.join(dir, "background.js"), "utf8"),
    ]);

  const combined = `${bridge}\n${prelude}\n${preludeModule}\n${content}\n${contentModule}\n${background}`;

  const forbiddenSnippets = [
    "cdnjs.cloudflare.com/ajax/libs/hls.js",
    "@require",
  ];
  for (const snippet of forbiddenSnippets) {
    if (combined.includes(snippet)) {
      throw new Error(
        `firefox: bundle contains forbidden snippet (${snippet})`,
      );
    }
  }

  if (/import\s*\(/.test(bridge)) {
    throw new Error("firefox: expected bridge.js to avoid dynamic imports");
  }

  for (const [fileName, source] of [
    ["prelude.js", prelude],
    ["content.js", content],
  ] as const) {
    if (/import\s*\(/.test(source)) {
      throw new Error(
        `firefox: expected ${fileName} to stay inert and avoid dynamic imports`,
      );
    }
  }

  const moduleImportTargets = Array.from(
    new Set(
      [preludeModule, contentModule]
        .flatMap((source) =>
          Array.from(
            source.matchAll(/from\s+"(\.\/[^"]+\.js)"/g),
            (match) => match[1],
          ),
        )
        .map((pathValue) => pathValue.replace(/^\.\//, "")),
    ),
  );

  const importResults = await Promise.all(
    moduleImportTargets.map(async (importedFile) => ({
      importedFile,
      exists: await exists(path.join(dir, importedFile)),
    })),
  );

  for (const { importedFile, exists: fileExists } of importResults) {
    if (!fileExists) {
      throw new Error(
        `firefox: missing module dependency referenced by extension bundle: ${importedFile}`,
      );
    }
  }
}

async function verifyBodySerializationGuards(): Promise<void> {
  const bridgeSrcPath = path.join(srcDir, "extension/bridge/index.ts");
  const bridgeXhrSrcPath = path.join(srcDir, "extension/bridge/xhr-bridge.ts");
  const serializationSrcPath = path.join(
    srcDir,
    "extension/shared/bodySerialization.ts",
  );

  // Check existence of all three paths in parallel.
  const [hasSerial, hasBridge, hasXhr] = await Promise.all([
    exists(serializationSrcPath),
    exists(bridgeSrcPath),
    exists(bridgeXhrSrcPath),
  ]);

  // Read the primary source to verify Blob/FileReader handling.
  let sourceToCheck: string | null = null;
  if (hasSerial) {
    sourceToCheck = await fs.readFile(serializationSrcPath, "utf8");
  } else if (hasBridge) {
    sourceToCheck = await fs.readFile(bridgeSrcPath, "utf8");
  }

  if (sourceToCheck && !/(Blob|FileReader)/.test(sourceToCheck)) {
    throw new Error(
      "firefox: regression guard failed: expected Blob/FileReader handling in body serialization",
    );
  }

  // Read XHR and bridge sources in parallel to check for serializeBodyForPort.
  const pathsToCheck = [bridgeXhrSrcPath, bridgeSrcPath].filter(
    (p) =>
      (p === bridgeXhrSrcPath && hasXhr) || (p === bridgeSrcPath && hasBridge),
  );

  const sources = await Promise.all(
    pathsToCheck.map((p) => fs.readFile(p, "utf8")),
  );

  for (const source of sources) {
    if (/await\s+serializeBodyForPort\(/.test(source)) return;
  }

  throw new Error(
    "firefox: regression guard failed: expected bridge XHR flow to await serializeBodyForPort(...)",
  );
}

export async function verifyFirefoxOutputs(): Promise<void> {
  const dir = path.join(distExtDir, "firefox");
  const manifest = await verifyManifest(path.join(dir, "manifest.json"));
  verifyFirefoxManifestFields(manifest);
  verifyContentScripts(manifest);

  // File-level checks are independent — run in parallel.
  await Promise.all([
    verifyRequiredOutputFiles(dir),
    verifyBundleSources(dir),
    verifyBodySerializationGuards(),
  ]);

  console.log("OK firefox: basic structure checks passed");

  const firefoxUpdatesManifestPath = path.join(
    distExtDir,
    FIREFOX_UPDATES_MANIFEST_FILE,
  );
  if (!(await exists(firefoxUpdatesManifestPath))) {
    throw new Error(
      `firefox: missing updates manifest at ${firefoxUpdatesManifestPath}`,
    );
  }
}

// ----------------------------------------------------------------
// Firefox build pipeline
// ----------------------------------------------------------------

export async function finalizeFirefoxBuild(): Promise<void> {
  const headers = await getExtensionHeaders();
  const version = headers.version || DEFAULT_EXTENSION_VERSION;

  const outDir = path.join(distExtDir, "firefox");
  await ensureCleanDir(outDir);
  await copyExtensionFiles(outDir);
  await writeManifest(
    outDir,
    buildManifestFirefox({ headers, includeWorld: true }),
  );

  await zipDir(outDir, path.join(distExtDir, "vot-extension-firefox.xpi"));

  const updatesPath = await writeFirefoxUpdatesManifest({
    version,
    addonId: getFirefoxAddonId(),
  });

  await verifyFirefoxOutputs();

  console.log("Extension build complete:");
  console.log(`- Firefox: ${outDir}`);
  console.log(`  - Updates: ${updatesPath}`);
}

export async function cleanupExtensionTmpDir(): Promise<void> {
  await fs.rm(outTmp, { recursive: true, force: true });
}
