import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { build as viteBuild } from "vite";
import { COMPRESSION_LEVEL, zip } from "zip-a-folder";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const rootDir = __dirname;
export const srcDir = path.join(rootDir, "src");
export const outBase = path.join(rootDir, "dist-ext");
export const outTmp = path.join(outBase, "_tmp");

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
    format: "iife",
    fileName: "content.js",
    emptyOutDir: true,
  },
  {
    entry: "src/extension/prelude.ts",
    format: "iife",
    fileName: "prelude.js",
    emptyOutDir: false,
  },
  {
    entry: "src/extension/bridge.ts",
    format: "iife",
    fileName: "bridge.js",
    emptyOutDir: false,
  },
  {
    entry: "src/extension/iframe.ts",
    format: "iife",
    fileName: "iframe.js",
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
  define: Record<string, string>;
}): Promise<void> {
  await viteBuild({
    root: rootDir,
    configFile: false,
    define: {
      ...define,
    },
    css: {
      transformer: "lightningcss",
    },
    build: {
      target: "es2020",
      outDir: outTmp,
      emptyOutDir,
      sourcemap: false,
      minify: "esbuild",
      lib: {
        entry: path.join(rootDir, entry),
        name: "VOT",
        formats: [format],
        fileName: () => fileName,
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  });
}

export async function buildExtensionBundles({
  context,
  headers,
}: {
  context: ExtensionBuildContext;
  headers: ExtensionHeaders;
}): Promise<void> {
  const defineMeta = {
    DEBUG_MODE: "false",
    IS_EXTENSION: "true",
    AVAILABLE_LOCALES: JSON.stringify(context.availableLocales),
    REPO_BRANCH: JSON.stringify(context.repoBranch),
    VOT_AUTHORS: JSON.stringify(String(headers.author || "")),
  };

  await ensureCleanDir(outTmp);
  for (const entry of extensionEntries) {
    await buildEntry({
      entry: entry.entry,
      format: entry.format,
      fileName: entry.fileName,
      emptyOutDir: entry.emptyOutDir,
      define: defineMeta,
    });
  }
}

async function renameContentCss(): Promise<void> {
  const entries = await fs.readdir(outTmp);
  const cssFiles = entries.filter((entry) => entry.endsWith(".css"));
  if (!cssFiles.length) return;
  if (cssFiles.includes("content.css")) return;

  const from = path.join(outTmp, cssFiles[0]);
  const to = path.join(outTmp, "content.css");
  await fs.rename(from, to);
}

async function copyExtensionFiles(
  targetDir: string,
  {
    backgroundSrc = "background.js",
    backgroundDst = "background.js",
  }: { backgroundSrc?: string; backgroundDst?: string } = {},
): Promise<void> {
  await fs.mkdir(targetDir, { recursive: true });

  const filesToCopy = [
    "bridge.js",
    "prelude.js",
    "content.js",
    "iframe.js",
    "content.css",
  ];
  for (const fileName of filesToCopy) {
    await fs.copyFile(path.join(outTmp, fileName), path.join(targetDir, fileName));
  }

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

function normalizeHostPermission(entry: string | undefined | null): string | null {
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
  const normalized: string[] = [];
  for (const item of list) {
    const value = normalizeHostPermission(item);
    if (value) normalized.push(value);
  }
  return [...new Set(normalized)];
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

function buildManifestChrome({
  headers,
  includeWorld,
}: {
  headers: ExtensionHeaders;
  includeWorld: boolean;
}): Record<string, unknown> {
  const name = headers.name || "Voice Over Translation";
  const description = headers.description || "Voice Over Translation";
  const version = headers.version || "0.0.0";
  const matches = headers.match || [];
  const excludeMatches = headers.exclude || [];
  const { originFallbackMatches, directMatches } =
    splitMatchesForOriginFallback(matches);
  const hostPermissions = normalizeHostPermissions(headers.connect || []);

  const bridgeScript = {
    js: ["bridge.js"],
    all_frames: true,
    match_about_blank: true,
    run_at: "document_start",
  };

  const mainWorldScripts: Record<string, unknown> = {
    js: ["prelude.js", "content.js"],
    css: ["content.css"],
    all_frames: true,
    match_about_blank: true,
    run_at: "document_idle",
    ...(includeWorld ? { world: "MAIN" } : {}),
  };

  const contentScripts: Record<string, unknown>[] = [];

  if (originFallbackMatches.length) {
    contentScripts.push(
      {
        matches: originFallbackMatches,
        exclude_matches: excludeMatches,
        ...bridgeScript,
        match_origin_as_fallback: true,
      },
      {
        matches: originFallbackMatches,
        exclude_matches: excludeMatches,
        ...mainWorldScripts,
        match_origin_as_fallback: true,
      },
    );
  }

  if (directMatches.length) {
    contentScripts.push(
      {
        matches: directMatches,
        exclude_matches: excludeMatches,
        ...bridgeScript,
      },
      {
        matches: directMatches,
        exclude_matches: excludeMatches,
        ...mainWorldScripts,
      },
    );
  }

  return {
    manifest_version: 3,
    name,
    description,
    version,
    action: {
      default_title: name,
      default_icon: {
        16: "icons/icon-16.png",
        32: "icons/icon-32.png",
      },
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
    icons: {
      16: "icons/icon-16.png",
      32: "icons/icon-32.png",
      48: "icons/icon-48.png",
      64: "icons/icon-64.png",
      96: "icons/icon-96.png",
      128: "icons/icon-128.png",
      256: "icons/icon-256.png",
    },
    content_scripts: [
      ...contentScripts,
      {
        matches: ["*://www.youtube.com/embed/*"],
        js: ["prelude.js", "iframe.js"],
        all_frames: true,
        match_about_blank: true,
        run_at: "document_start",
        ...(includeWorld ? { world: "MAIN" } : {}),
      },
    ],
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

function getFirefoxAndroidStrictMinVersion(): string {
  return process.env.FIREFOX_ANDROID_STRICT_MIN_VERSION || "142.0";
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
    ...(optional && optional.length ? { optional } : {}),
  };
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

  const action = manifest.action as Record<string, unknown> | undefined;
  const defaultIcon = action?.default_icon as Record<string, unknown> | undefined;
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
      data_collection_permissions: getFirefoxDataCollectionPermissions(),
    },
    gecko_android: {
      strict_min_version: getFirefoxAndroidStrictMinVersion(),
    },
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

async function zipDir(sourceDirPath: string, outZipPath: string): Promise<void> {
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

async function runCmd(cmd: string, args: string[], cwd?: string): Promise<void> {
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

async function maybeBuildCrx({
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
    throw new Error(`CRX builder not found: ${crx3Bin}. Install dependencies first.`);
  }
  const outCrx = path.join(outBase, `vot-extension-chrome-${version}.crx`);
  try {
    await runCmd(
      crx3Bin,
      [
        "-p",
        keyPath,
        "-o",
        outCrx,
        "--appVersion",
        version,
        sourceDir,
      ],
      rootDir,
    );
  } finally {
    if (useTemporaryKey) {
      await fs.rm(keyPath, { force: true });
      await fs.rm(path.join(outBase, "vot-extension-chrome.pem"), { force: true });
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

async function verifyOne(browserName: "chrome" | "firefox"): Promise<void> {
  const dir = path.join(outBase, browserName);
  const manifestPath = path.join(dir, "manifest.json");
  if (!(await exists(manifestPath))) {
    throw new Error(`${browserName}: missing manifest.json at ${manifestPath}`);
  }

  const manifest = await readJson<Record<string, any>>(manifestPath);
  if (manifest.manifest_version !== 3) {
    throw new Error(
      `${browserName}: expected manifest_version 3, got ${manifest.manifest_version}`,
    );
  }

  const permissions = new Set(manifest.permissions || []);
  if (
    !permissions.has("declarativeNetRequestWithHostAccess") &&
    !permissions.has("declarativeNetRequest")
  ) {
    throw new Error(
      `${browserName}: expected declarativeNetRequestWithHostAccess or declarativeNetRequest permission`,
    );
  }

  if (browserName === "chrome" && !manifest.background?.service_worker) {
    throw new Error(`${browserName}: expected background.service_worker`);
  }
  if (browserName === "chrome" && manifest.update_url) {
    throw new Error(`${browserName}: update_url must not be set`);
  }
  if (
    browserName === "firefox" &&
    (!Array.isArray(manifest.background?.scripts) ||
      !manifest.background.scripts.length)
  ) {
    throw new Error(`${browserName}: expected background.scripts[]`);
  }
  if (
    browserName === "firefox" &&
    manifest.browser_specific_settings?.gecko?.update_url !==
      FIREFOX_UPDATES_MANIFEST_URL
  ) {
    throw new Error(
      `${browserName}: expected browser_specific_settings.gecko.update_url to be ${FIREFOX_UPDATES_MANIFEST_URL}, got ${manifest.browser_specific_settings?.gecko?.update_url}`,
    );
  }

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

  const requiredFiles = [
    "bridge.js",
    "prelude.js",
    "content.js",
    "content.css",
    "iframe.js",
    "background.js",
    "icons/icon-16.png",
    "icons/icon-32.png",
    "icons/icon-48.png",
    "icons/icon-64.png",
    "icons/icon-96.png",
    "icons/icon-128.png",
    "icons/icon-256.png",
  ];

  for (const relPath of requiredFiles) {
    const fullPath = path.join(dir, relPath);
    if (!(await exists(fullPath))) {
      throw new Error(`${browserName}: missing required file: ${relPath}`);
    }
  }

  const bridge = await fs.readFile(path.join(dir, "bridge.js"), "utf8");
  const prelude = await fs.readFile(path.join(dir, "prelude.js"), "utf8");
  const content = await fs.readFile(path.join(dir, "content.js"), "utf8");
  const iframe = await fs.readFile(path.join(dir, "iframe.js"), "utf8");
  const background = await fs.readFile(path.join(dir, "background.js"), "utf8");
  const combined = `${bridge}\n${prelude}\n${content}\n${iframe}\n${background}`;

  const forbiddenSnippets = ["cdnjs.cloudflare.com/ajax/libs/hls.js", "@require"];
  for (const snippet of forbiddenSnippets) {
    if (combined.includes(snippet)) {
      throw new Error(
        `${browserName}: bundle contains forbidden snippet (${snippet})`,
      );
    }
  }

  const bridgeSrcPath = path.join(rootDir, "src/extension/bridge.ts");
  const serializationSrcPath = path.join(rootDir, "src/extension/bodySerialization.ts");
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

  if (await exists(bridgeSrcPath)) {
    const bridgeSource = await fs.readFile(bridgeSrcPath, "utf8");
    if (!/await\s+serializeBodyForPort\(/.test(bridgeSource)) {
      throw new Error(
        `${browserName}: regression guard failed: src/extension/bridge.ts must await serializeBodyForPort(...)`,
      );
    }
  }

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

export async function finalizeExtensionBuildArtifacts(
  target: ExtensionBuildTarget = "all",
): Promise<void> {
  const headers = await getExtensionHeaders();
  const includeWorld = true;
  const shouldBuildChrome = target === "all" || target === "chrome";
  const shouldBuildFirefox = target === "all" || target === "firefox";

  await renameContentCss();
  if (shouldBuildChrome) {
    await fs.rm(path.join(outBase, CHROME_UPDATES_MANIFEST_FILE), { force: true });
  }

  const version = headers.version || "0.0.0";
  let outChrome: string | null = null;
  let chromeCrx: string | null = null;
  let outFirefox: string | null = null;
  let firefoxXpi: string | null = null;
  let firefoxUpdatesManifestPath: string | null = null;

  if (shouldBuildChrome) {
    outChrome = path.join(outBase, "chrome");
    await ensureCleanDir(outChrome);
    await copyExtensionFiles(outChrome, {
      backgroundSrc: "background.js",
      backgroundDst: "background.js",
    });
    await writeManifest(
      outChrome,
      buildManifestChrome({ headers, includeWorld }),
    );

    const chromeZip = path.join(outBase, `vot-extension-chrome-${version}.zip`);
    await fs.rm(chromeZip, { force: true });
    const chromeBuildResult = await maybeBuildCrx({ sourceDir: outChrome, version });
    chromeCrx = chromeBuildResult.crxPath;
  }

  if (shouldBuildFirefox) {
    outFirefox = path.join(outBase, "firefox");
    await ensureCleanDir(outFirefox);
    await copyExtensionFiles(outFirefox, {
      backgroundSrc: "background-ff.js",
      backgroundDst: "background.js",
    });
    await writeManifest(
      outFirefox,
      buildManifestFirefox({ headers, includeWorld }),
    );

    firefoxXpi = path.join(outBase, `vot-extension-firefox-${version}.xpi`);
    await zipDir(outFirefox, firefoxXpi);
    firefoxUpdatesManifestPath = await writeFirefoxUpdatesManifest({
      version,
      addonId: getFirefoxAddonId(),
    });
  }

  await verifyExtensionOutputs(target);

  console.log("Extension build complete:");
  if (outChrome) {
    console.log(`- Chrome:  ${outChrome}`);
    console.log(`  - CRX:     ${chromeCrx}`);
  }
  if (outFirefox) {
    console.log(`- Firefox: ${outFirefox}`);
    console.log(`  - Package: ${firefoxXpi}`);
    console.log(`  - Updates: ${firefoxUpdatesManifestPath}`);
  }
}

export async function cleanupExtensionTmpDir(): Promise<void> {
  await fs.rm(outTmp, { recursive: true, force: true });
}
