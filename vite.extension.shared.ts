import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { build as viteBuild } from "vite";
import { COMPRESSION_LEVEL, zip } from "zip-a-folder";
import {
  createViteConfig,
  defineConstants,
  rootDir,
  type ViteDefine,
} from "./vite.base.config";

export { rootDir } from "./vite.base.config";
export const srcDir = path.join(rootDir, "src");
export const outBase = path.join(rootDir, "dist-ext");
export const outTmp = path.join(outBase, "_tmp");

const DEFAULT_EXTENSION_NAME = "Voice Over Translation";
const DEFAULT_EXTENSION_DESCRIPTION = "Voice Over Translation";
const DEFAULT_EXTENSION_VERSION = "0.0.0";
const EXTENSION_ICON_SIZES = [16, 32, 48, 64, 96, 128, 256] as const;
const EXTENSION_LOADER_FILES = ["prelude.js", "content.js"] as const;
const EXTENSION_MODULE_FILES = [
  "prelude.module.js",
  "content.module.js",
] as const;
const EXTENSION_WEB_ACCESSIBLE_JS_GLOBS = ["*.js"] as const;

const GITHUB_DIST_EXT_RAW_BASE =
  "https://raw.githubusercontent.com/ilyhalight/voice-over-translation/master/dist-ext";
const CHROME_UPDATES_MANIFEST_FILE = "vot-extension-chrome-updates.xml";
const FIREFOX_UPDATES_MANIFEST_FILE = "vot-extension-firefox-updates.json";
const FIREFOX_UPDATES_MANIFEST_URL = `${GITHUB_DIST_EXT_RAW_BASE}/${FIREFOX_UPDATES_MANIFEST_FILE}`;

export type ExtensionBuildTarget = "chrome" | "firefox" | "all";

export interface ExtensionHeaders {
  name?: string;
  description?: string;
  version?: string;
  author?: string;
  match?: string[];
  exclude?: string[];
  connect?: string[];
}

export interface ExtensionBuildContext {
  availableLocales: string[];
  repoBranch: string;
}

interface ExtensionEntry {
  entry: string;
  format: "iife" | "es";
  fileName: string;
  emptyOutDir: boolean;
}

const extensionEntries: ExtensionEntry[] = [
  {
    entry: "src/index.ts",
    format: "es",
    fileName: "content.module.js",
    emptyOutDir: true,
  },
  {
    entry: "src/extension/prelude.ts",
    format: "es",
    fileName: "prelude.module.js",
    emptyOutDir: false,
  },
  {
    entry: "src/extension/bridge.ts",
    format: "iife",
    fileName: "bridge.js",
    emptyOutDir: false,
  },
  {
    entry: "src/extension/background.ts",
    format: "es",
    fileName: "background.js",
    emptyOutDir: false,
  },
  {
    entry: "src/extension/background.ts",
    format: "iife",
    fileName: "background-ff.js",
    emptyOutDir: false,
  },
];

export async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseNumericVersionParts(version: string): number[] | null {
  const parts = String(version)
    .trim()
    .split(".")
    .map((part) => part.trim());

  if (!parts.length || parts.some((part) => !/^\d+$/.test(part))) {
    return null;
  }

  return parts.map(Number);
}

function compareVersions(left: string, right: string): number {
  const leftNumeric = parseNumericVersionParts(left);
  const rightNumeric = parseNumericVersionParts(right);

  if (leftNumeric && rightNumeric) {
    const maxLength = Math.max(leftNumeric.length, rightNumeric.length);
    for (let index = 0; index < maxLength; index += 1) {
      const leftPart = leftNumeric[index] ?? 0;
      const rightPart = rightNumeric[index] ?? 0;
      if (leftPart > rightPart) return 1;
      if (leftPart < rightPart) return -1;
    }
    return 0;
  }

  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function cleanupOlderVersionedArtifacts({
  artifactPrefix,
  fileExtension,
  currentVersion,
}: {
  artifactPrefix: string;
  fileExtension: string;
  currentVersion: string;
}): Promise<string[]> {
  const removedFiles: string[] = [];
  const versionedArtifactPattern = new RegExp(
    `^${escapeRegExp(artifactPrefix)}-(.+)${escapeRegExp(fileExtension)}$`,
  );

  let entries: string[] = [];
  try {
    entries = await fs.readdir(outBase);
  } catch {
    return removedFiles;
  }

  for (const entry of entries) {
    const match = versionedArtifactPattern.exec(entry);
    if (!match) continue;

    const artifactVersion = match[1];
    if (compareVersions(artifactVersion, currentVersion) >= 0) continue;

    await fs.rm(path.join(outBase, entry), { force: true });
    removedFiles.push(entry);
  }

  return removedFiles;
}

export async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

export async function ensureCleanDir(dir: string): Promise<void> {
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

async function buildEntry({
  entry,
  format,
  fileName,
  emptyOutDir,
  define,
}: {
  entry: string;
  format: "iife" | "es";
  fileName: string;
  emptyOutDir: boolean;
  define: ViteDefine;
}): Promise<void> {
  await viteBuild(
    createViteConfig({
      root: rootDir,
      configFile: false,
      define,
      build: {
        outDir: outTmp,
        emptyOutDir,
        sourcemap: false,
        minify: "oxc",
        lib: {
          entry: path.join(rootDir, entry),
          name: "VOT",
          formats: [format],
          fileName: () => fileName,
        },
      },
    }),
  );
}

export async function buildExtensionBundles({
  context,
  headers,
}: {
  context: ExtensionBuildContext;
  headers: ExtensionHeaders;
}): Promise<void> {
  const defineMeta = defineConstants({
    DEBUG_MODE: false,
    IS_EXTENSION: true,
    AVAILABLE_LOCALES: context.availableLocales,
    REPO_BRANCH: context.repoBranch,
    VOT_VERSION: String(headers.version || ""),
    VOT_AUTHORS: String(headers.author || ""),
  });

  await ensureCleanDir(outTmp);
  for (const entry of extensionEntries) {
    await buildEntry({
      ...entry,
      define: defineMeta,
    });
  }
}

async function copyExtensionFiles(
  targetDir: string,
  {
    backgroundSrc = "background.js",
    backgroundDst = "background.js",
  }: { backgroundSrc?: string; backgroundDst?: string } = {},
): Promise<void> {
  await fs.mkdir(targetDir, { recursive: true });

  const bundleFiles = await fs.readdir(outTmp);
  const frontEndJsFiles = bundleFiles.filter((fileName) => {
    if (!fileName.endsWith(".js")) {
      return false;
    }

    return !["background.js", "background-ff.js"].includes(fileName);
  });

  for (const fileName of frontEndJsFiles) {
    await fs.copyFile(
      path.join(outTmp, fileName),
      path.join(targetDir, fileName),
    );
  }

  await writeExtensionLoaders(targetDir);

  await fs.copyFile(
    path.join(outTmp, backgroundSrc),
    path.join(targetDir, backgroundDst),
  );

  const iconsSrcDir = path.join(srcDir, "extension", "icons");
  const iconsDstDir = path.join(targetDir, "icons");
  await fs.mkdir(iconsDstDir, { recursive: true });
  const iconFiles = await fs.readdir(iconsSrcDir);
  for (const iconFile of iconFiles) {
    await fs.copyFile(
      path.join(iconsSrcDir, iconFile),
      path.join(iconsDstDir, iconFile),
    );
  }
}

async function writeExtensionLoaders(targetDir: string): Promise<void> {
  const loaders: Record<(typeof EXTENSION_LOADER_FILES)[number], string> = {
    "prelude.js": "\n",
    "content.js": "\n",
  };

  await Promise.all(
    EXTENSION_LOADER_FILES.map((fileName) =>
      fs.writeFile(path.join(targetDir, fileName), loaders[fileName], "utf8"),
    ),
  );
}

function normalizeHostPermission(
  entry: string | undefined | null,
): string | null {
  if (!entry) return null;
  const value = String(entry).trim();
  if (!value) return null;
  if (value === "<all_urls>") return value;

  if (/^[a-z*]+:\/\//i.test(value)) {
    if (/^[a-z*]+:\/\/[^/]+\/?$/i.test(value)) {
      return `${value.replace(/\/?$/, "")}/*`;
    }
    return value;
  }

  return `*://*.${value}/*`;
}

function normalizeHostPermissions(list: string[] = []): string[] {
  const normalized = list
    .map((item) => normalizeHostPermission(item))
    .filter((value): value is string => Boolean(value));

  return [...new Set(normalized)];
}

function normalizeWebAccessibleResourceMatch(
  pattern: string | undefined | null,
): string | null {
  if (!pattern) return null;
  const value = String(pattern).trim();
  if (!value) return null;
  if (value === "<all_urls>") {
    return "*://*/*";
  }

  const match = /^([^:]+:\/\/[^/]+)(\/.*)?$/.exec(value);
  if (!match) {
    return null;
  }

  return `${match[1]}/*`;
}

function normalizeWebAccessibleResourceMatches(
  matches: string[] = [],
): string[] {
  return [
    ...new Set(
      matches
        .map((pattern) => normalizeWebAccessibleResourceMatch(pattern))
        .filter((pattern): pattern is string => Boolean(pattern)),
    ),
  ];
}

function splitMatchesForOriginFallback(matches: string[] = []): {
  originFallbackMatches: string[];
  directMatches: string[];
} {
  const originFallbackMatches: string[] = [];
  const directMatches: string[] = [];

  const getPath = (pattern: string): string | null => {
    if (pattern === "<all_urls>") return "/*";
    const result = /^[^:]+:\/\/[^/]+(\/.*)$/.exec(pattern);
    return result ? result[1] : null;
  };

  for (const match of matches) {
    const pathPart = getPath(String(match));
    if (pathPart === "/*") originFallbackMatches.push(String(match));
    else directMatches.push(String(match));
  }

  return { originFallbackMatches, directMatches };
}

function buildIconsMap(sizes: readonly number[]): Record<number, string> {
  return Object.fromEntries(
    sizes.map((size) => [size, `icons/icon-${size}.png`]),
  ) as Record<number, string>;
}

function createContentScriptEntries({
  matches,
  excludeMatches,
  includeWorld,
  matchOriginAsFallback = false,
}: {
  matches: string[];
  excludeMatches: string[];
  includeWorld: boolean;
  matchOriginAsFallback?: boolean;
}): Record<string, unknown>[] {
  if (!matches.length) return [];

  const fallbackConfig = matchOriginAsFallback
    ? { match_origin_as_fallback: true }
    : {};

  return [
    {
      matches,
      exclude_matches: excludeMatches,
      js: ["bridge.js"],
      all_frames: true,
      match_about_blank: true,
      run_at: "document_start",
      ...fallbackConfig,
    },
    {
      matches,
      exclude_matches: excludeMatches,
      js: ["prelude.js", "content.js"],
      all_frames: true,
      match_about_blank: true,
      run_at: "document_idle",
      ...(includeWorld ? { world: "MAIN" } : {}),
      ...fallbackConfig,
    },
  ];
}

function createWebAccessibleResources(
  matches: string[],
): Array<Record<string, unknown>> {
  const normalizedMatches = normalizeWebAccessibleResourceMatches(matches);
  if (!normalizedMatches.length) {
    return [];
  }

  return [
    {
      resources: [...EXTENSION_WEB_ACCESSIBLE_JS_GLOBS],
      matches: normalizedMatches,
    },
  ];
}

function buildManifestChrome({
  headers,
  includeWorld,
}: {
  headers: ExtensionHeaders;
  includeWorld: boolean;
}): Record<string, unknown> {
  const name = headers.name || DEFAULT_EXTENSION_NAME;
  const description = headers.description || DEFAULT_EXTENSION_DESCRIPTION;
  const version = headers.version || DEFAULT_EXTENSION_VERSION;
  const matches = headers.match || [];
  const excludeMatches = headers.exclude || [];
  const { originFallbackMatches, directMatches } =
    splitMatchesForOriginFallback(matches);
  const hostPermissions = normalizeHostPermissions(headers.connect || []);
  const contentScripts = [
    ...createContentScriptEntries({
      matches: originFallbackMatches,
      excludeMatches,
      includeWorld,
      matchOriginAsFallback: true,
    }),
    ...createContentScriptEntries({
      matches: directMatches,
      excludeMatches,
      includeWorld,
    }),
  ];

  return {
    manifest_version: 3,
    name,
    description,
    version,
    action: {
      default_title: name,
      default_icon: buildIconsMap([16, 32]),
    },
    permissions: [
      "storage",
      "notifications",
      "tabs",
      "declarativeNetRequestWithHostAccess",
    ],
    host_permissions: hostPermissions,
    background: {
      service_worker: "background.js",
      type: "module",
    },
    icons: buildIconsMap(EXTENSION_ICON_SIZES),
    content_scripts: contentScripts,
    web_accessible_resources: createWebAccessibleResources(matches),
  };
}

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
    if (diff !== 0) {
      return diff;
    }
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

function getFirefoxXpiRawUrl(version: string): string {
  return `${GITHUB_DIST_EXT_RAW_BASE}/vot-extension-firefox-${version}.xpi`;
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
  const updatesManifestPath = path.join(outBase, FIREFOX_UPDATES_MANIFEST_FILE);
  const updatesManifest = {
    addons: {
      [addonId]: {
        updates: [
          {
            version,
            update_link: getFirefoxXpiRawUrl(version),
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

function getCrx3Bin(): string {
  return path.join(
    rootDir,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "crx3.cmd" : "crx3",
  );
}

async function runCmd(
  cmd: string,
  args: string[],
  cwd?: string,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function _maybeBuildCrx({
  sourceDir,
  version,
}: {
  sourceDir: string;
  version: string;
}): Promise<{ crxPath: string }> {
  const customKeyPath = process.env.CHROME_CRX_KEY_PATH?.trim() || null;
  const useTemporaryKey = !customKeyPath;
  const keyPath = path.resolve(
    rootDir,
    customKeyPath || path.join(outTmp, "vot-extension-chrome.pem"),
  );
  await fs.mkdir(path.dirname(keyPath), { recursive: true });

  const crx3Bin = getCrx3Bin();
  if (!(await exists(crx3Bin))) {
    throw new Error(
      `CRX builder not found: ${crx3Bin}. Install dependencies first.`,
    );
  }
  const outCrx = path.join(outBase, `vot-extension-chrome-${version}.zip`);
  try {
    await runCmd(
      crx3Bin,
      ["-p", keyPath, "-o", outCrx, "--appVersion", version, sourceDir],
      rootDir,
    );
  } finally {
    if (useTemporaryKey) {
      await fs.rm(keyPath, { force: true });
      await fs.rm(path.join(outBase, "vot-extension-chrome.pem"), {
        force: true,
      });
    }
  }
  return {
    crxPath: outCrx,
  };
}

function isValidMatchPattern(pattern: string): boolean {
  if (pattern === "<all_urls>") return true;
  return /^(\*|http|https|file|ftp|ws|wss):\/\/(\*|\*\.[^/*]+|[^/*]+)\/.*$/.test(
    pattern,
  );
}

function assertValidPatterns(
  label: string,
  browserName: string,
  patterns: string[] = [],
): void {
  for (const pattern of patterns) {
    if (!isValidMatchPattern(pattern)) {
      throw new Error(
        `${browserName}: ${label} contains malformed URL pattern: ${pattern}`,
      );
    }
  }
}

function assertOriginFallbackPathIsWildcard(
  browserName: string,
  patterns: string[] = [],
): void {
  for (const pattern of patterns) {
    const match = /^[^:]+:\/\/[^/]+(\/.*)$/.exec(pattern);
    const pathPart = match ? match[1] : null;
    if (pathPart !== "/*") {
      throw new Error(
        `${browserName}: match_origin_as_fallback requires path /*. Got: ${pattern}`,
      );
    }
  }
}

async function readVerifiedManifest(
  browserName: "chrome" | "firefox",
  manifestPath: string,
): Promise<Record<string, any>> {
  if (!(await exists(manifestPath))) {
    throw new Error(`${browserName}: missing manifest.json at ${manifestPath}`);
  }

  const manifest = await readJson<Record<string, any>>(manifestPath);
  if (manifest.manifest_version !== 3) {
    throw new Error(
      `${browserName}: expected manifest_version 3, got ${manifest.manifest_version}`,
    );
  }

  return manifest;
}

function verifyManifestPermissions(
  browserName: "chrome" | "firefox",
  manifest: Record<string, any>,
): void {
  const permissions = new Set(manifest.permissions || []);
  if (
    !permissions.has("declarativeNetRequestWithHostAccess") &&
    !permissions.has("declarativeNetRequest")
  ) {
    throw new Error(
      `${browserName}: expected declarativeNetRequestWithHostAccess or declarativeNetRequest permission`,
    );
  }
}

function verifyBrowserSpecificManifestFields(
  browserName: "chrome" | "firefox",
  manifest: Record<string, any>,
): void {
  if (browserName === "chrome") {
    if (!manifest.background?.service_worker) {
      throw new Error(`${browserName}: expected background.service_worker`);
    }
    if (manifest.update_url) {
      throw new Error(`${browserName}: update_url must not be set`);
    }
    return;
  }

  if (
    !Array.isArray(manifest.background?.scripts) ||
    !manifest.background.scripts.length
  ) {
    throw new Error(`${browserName}: expected background.scripts[]`);
  }
  if (
    manifest.browser_specific_settings?.gecko?.update_url !==
    FIREFOX_UPDATES_MANIFEST_URL
  ) {
    throw new Error(
      `${browserName}: expected browser_specific_settings.gecko.update_url to be ${FIREFOX_UPDATES_MANIFEST_URL}, got ${manifest.browser_specific_settings?.gecko?.update_url}`,
    );
  }
  if (
    !manifest.browser_specific_settings?.gecko_android ||
    typeof manifest.browser_specific_settings.gecko_android !== "object" ||
    Array.isArray(manifest.browser_specific_settings.gecko_android)
  ) {
    throw new Error(
      `${browserName}: expected browser_specific_settings.gecko_android to be an object`,
    );
  }
}

function verifyContentScripts(
  browserName: "chrome" | "firefox",
  manifest: Record<string, any>,
): void {
  assertValidPatterns(
    "host_permissions",
    browserName,
    manifest.host_permissions,
  );

  let sawOriginFallback = false;
  for (const contentScript of manifest.content_scripts || []) {
    assertValidPatterns(
      "content_scripts.matches",
      browserName,
      contentScript.matches,
    );

    if (contentScript.all_frames !== true) {
      throw new Error(
        `${browserName}: content_scripts entry must set all_frames: true`,
      );
    }
    if (contentScript.match_about_blank !== true) {
      throw new Error(
        `${browserName}: content_scripts entry must set match_about_blank: true`,
      );
    }

    if (contentScript.match_origin_as_fallback === true) {
      sawOriginFallback = true;
      assertOriginFallbackPathIsWildcard(browserName, contentScript.matches);
    }
  }

  if (!sawOriginFallback) {
    throw new Error(
      `${browserName}: expected at least one content_scripts entry with match_origin_as_fallback: true`,
    );
  }
}

async function verifyRequiredOutputFiles(
  browserName: "chrome" | "firefox",
  dir: string,
): Promise<void> {
  const requiredFiles = [
    "bridge.js",
    ...EXTENSION_LOADER_FILES,
    ...EXTENSION_MODULE_FILES,
    "background.js",
    ...EXTENSION_ICON_SIZES.map((size) => `icons/icon-${size}.png`),
  ];

  for (const relPath of requiredFiles) {
    const fullPath = path.join(dir, relPath);
    if (!(await exists(fullPath))) {
      throw new Error(`${browserName}: missing required file: ${relPath}`);
    }
  }
}

async function verifyBundleSources(
  browserName: "chrome" | "firefox",
  dir: string,
): Promise<void> {
  const bridge = await fs.readFile(path.join(dir, "bridge.js"), "utf8");
  const prelude = await fs.readFile(path.join(dir, "prelude.js"), "utf8");
  const preludeModule = await fs.readFile(
    path.join(dir, "prelude.module.js"),
    "utf8",
  );
  const content = await fs.readFile(path.join(dir, "content.js"), "utf8");
  const contentModule = await fs.readFile(
    path.join(dir, "content.module.js"),
    "utf8",
  );
  const background = await fs.readFile(path.join(dir, "background.js"), "utf8");
  const combined = `${bridge}\n${prelude}\n${preludeModule}\n${content}\n${contentModule}\n${background}`;

  const forbiddenSnippets = [
    "cdnjs.cloudflare.com/ajax/libs/hls.js",
    "@require",
  ];
  for (const snippet of forbiddenSnippets) {
    if (combined.includes(snippet)) {
      throw new Error(
        `${browserName}: bundle contains forbidden snippet (${snippet})`,
      );
    }
  }

  if (/import\s*\(/.test(bridge)) {
    throw new Error(
      `${browserName}: expected bridge.js to avoid dynamic imports`,
    );
  }

  for (const [fileName, source] of [
    ["prelude.js", prelude],
    ["content.js", content],
  ] as const) {
    if (/import\s*\(/.test(source)) {
      throw new Error(
        `${browserName}: expected ${fileName} to stay inert and avoid dynamic imports`,
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
  for (const importedFile of moduleImportTargets) {
    if (!(await exists(path.join(dir, importedFile)))) {
      throw new Error(
        `${browserName}: missing module dependency referenced by extension bundle: ${importedFile}`,
      );
    }
  }

  const legacyIifePrefixes = [
    "var VOT = (function",
    "var VOT = (() =>",
    "(function () {",
    "(() => {",
  ];
  for (const [fileName, source] of [
    ["prelude.module.js", preludeModule],
    ["content.module.js", contentModule],
  ] as const) {
    const normalizedSource = source.trimStart();
    if (
      legacyIifePrefixes.some((prefix) => normalizedSource.startsWith(prefix))
    ) {
      throw new Error(
        `${browserName}: expected ${fileName} to avoid legacy IIFE wrapping`,
      );
    }
  }
}

async function verifyBodySerializationGuards(
  browserName: "chrome" | "firefox",
): Promise<void> {
  const bridgeSrcPath = path.join(rootDir, "src/extension/bridge.ts");
  const bridgeXhrSrcPath = path.join(rootDir, "src/extension/bridgeXhr.ts");
  const serializationSrcPath = path.join(
    rootDir,
    "src/extension/bodySerialization.ts",
  );
  let sourceToCheck: string | null = null;
  if (await exists(serializationSrcPath)) {
    sourceToCheck = await fs.readFile(serializationSrcPath, "utf8");
  } else if (await exists(bridgeSrcPath)) {
    sourceToCheck = await fs.readFile(bridgeSrcPath, "utf8");
  }

  if (sourceToCheck && !/(Blob|FileReader)/.test(sourceToCheck)) {
    throw new Error(
      `${browserName}: regression guard failed: expected Blob/FileReader handling in body serialization`,
    );
  }

  const bridgeSerializationSourcePaths = [bridgeXhrSrcPath, bridgeSrcPath];
  for (const sourcePath of bridgeSerializationSourcePaths) {
    if (!(await exists(sourcePath))) {
      continue;
    }

    const source = await fs.readFile(sourcePath, "utf8");
    if (/await\s+serializeBodyForPort\(/.test(source)) {
      return;
    }
  }

  throw new Error(
    `${browserName}: regression guard failed: expected bridge XHR flow to await serializeBodyForPort(...)`,
  );
}

async function verifyOne(browserName: "chrome" | "firefox"): Promise<void> {
  const dir = path.join(outBase, browserName);
  const manifestPath = path.join(dir, "manifest.json");
  const manifest = await readVerifiedManifest(browserName, manifestPath);
  verifyManifestPermissions(browserName, manifest);
  verifyBrowserSpecificManifestFields(browserName, manifest);
  verifyContentScripts(browserName, manifest);
  await verifyRequiredOutputFiles(browserName, dir);
  await verifyBundleSources(browserName, dir);
  await verifyBodySerializationGuards(browserName);

  console.log(`OK ${browserName}: basic structure checks passed`);
}

export async function verifyExtensionOutputs(
  target: ExtensionBuildTarget = "all",
): Promise<void> {
  if (target === "all" || target === "chrome") {
    await verifyOne("chrome");
  }
  if (target === "all" || target === "firefox") {
    await verifyOne("firefox");
    const firefoxUpdatesManifestPath = path.join(
      outBase,
      FIREFOX_UPDATES_MANIFEST_FILE,
    );
    if (!(await exists(firefoxUpdatesManifestPath))) {
      throw new Error(
        `firefox: missing updates manifest at ${firefoxUpdatesManifestPath}`,
      );
    }
  }
  console.log("\nExtension verification complete.");
}

interface BrowserBuildResult {
  outDir: string;
  packagePath: string;
  removedPackages: string[];
  updatesPath?: string;
}

async function buildBrowserArtifacts({
  browserDir,
  artifactPrefix,
  fileExtension,
  backgroundSrc,
  headers,
  version,
  includeWorld,
  buildManifest,
  afterPackage,
}: {
  browserDir: "chrome" | "firefox";
  artifactPrefix: string;
  fileExtension: ".zip" | ".xpi";
  backgroundSrc: string;
  headers: ExtensionHeaders;
  version: string;
  includeWorld: boolean;
  buildManifest: (args: {
    headers: ExtensionHeaders;
    includeWorld: boolean;
  }) => Record<string, unknown>;
  afterPackage?: () => Promise<string>;
}): Promise<BrowserBuildResult> {
  const removedPackages = await cleanupOlderVersionedArtifacts({
    artifactPrefix,
    fileExtension,
    currentVersion: version,
  });

  const outDir = path.join(outBase, browserDir);
  await ensureCleanDir(outDir);
  await copyExtensionFiles(outDir, {
    backgroundSrc,
    backgroundDst: "background.js",
  });
  await writeManifest(outDir, buildManifest({ headers, includeWorld }));

  const packagePath = path.join(
    outBase,
    `${artifactPrefix}-${version}${fileExtension}`,
  );
  await zipDir(outDir, packagePath);

  const updatesPath = afterPackage ? await afterPackage() : undefined;
  return { outDir, packagePath, removedPackages, updatesPath };
}

export async function finalizeExtensionBuildArtifacts(
  target: ExtensionBuildTarget = "all",
): Promise<void> {
  const headers = await getExtensionHeaders();
  const includeWorld = true;
  const shouldBuildChrome = target === "all" || target === "chrome";
  const shouldBuildFirefox = target === "all" || target === "firefox";

  if (shouldBuildChrome) {
    await fs.rm(path.join(outBase, CHROME_UPDATES_MANIFEST_FILE), {
      force: true,
    });
  }

  const version = headers.version || DEFAULT_EXTENSION_VERSION;
  let chromeBuild: BrowserBuildResult | null = null;
  let firefoxBuild: BrowserBuildResult | null = null;

  if (shouldBuildChrome) {
    chromeBuild = await buildBrowserArtifacts({
      browserDir: "chrome",
      artifactPrefix: "vot-extension-chrome",
      fileExtension: ".zip",
      backgroundSrc: "background.js",
      headers,
      version,
      includeWorld,
      buildManifest: buildManifestChrome,
    });
  }

  if (shouldBuildFirefox) {
    firefoxBuild = await buildBrowserArtifacts({
      browserDir: "firefox",
      artifactPrefix: "vot-extension-firefox",
      fileExtension: ".xpi",
      backgroundSrc: "background-ff.js",
      headers,
      version,
      includeWorld,
      buildManifest: buildManifestFirefox,
      afterPackage: async () =>
        writeFirefoxUpdatesManifest({
          version,
          addonId: getFirefoxAddonId(),
        }),
    });
  }

  await verifyExtensionOutputs(target);

  console.log("Extension build complete:");
  if (chromeBuild) {
    console.log(`- Chrome:  ${chromeBuild.outDir}`);
    console.log(`  - Package: ${chromeBuild.packagePath}`);
    if (chromeBuild.removedPackages.length) {
      console.log(
        `  - Removed old packages: ${chromeBuild.removedPackages.join(", ")}`,
      );
    }
  }
  if (firefoxBuild) {
    console.log(`- Firefox: ${firefoxBuild.outDir}`);
    console.log(`  - Package: ${firefoxBuild.packagePath}`);
    console.log(`  - Updates: ${firefoxBuild.updatesPath}`);
    if (firefoxBuild.removedPackages.length) {
      console.log(
        `  - Removed old packages: ${firefoxBuild.removedPackages.join(", ")}`,
      );
    }
  }
}

export async function cleanupExtensionTmpDir(): Promise<void> {
  await fs.rm(outTmp, { recursive: true, force: true });
}
