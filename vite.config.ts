import fs from "node:fs";
import path from "node:path";
import {
  sitesCoursehunterLike,
  sitesInvidious,
  sitesPeertube,
  sitesPiped,
  sitesProxiTok,
} from "@vot.js/shared/alternativeUrls";
import ts from "typescript";
import { defineConfig } from "vite";
import { contentUrl, repositoryUrl } from "./src/config/config";
import {
  createViteConfig,
  defineConstants,
  distDir,
  srcDir,
} from "./vite.base.config";

const localesDir = path.resolve(srcDir, "localization", "locales");
const localeHeadersDir = path.resolve(localesDir, "headers");
const hashesPath = path.resolve(srcDir, "localization", "hashes.json");
const metaHeadersPath = path.resolve(srcDir, "headers.json");
const priorityLocales = ["auto", "en", "ru"] as const;
const analyzableCodeExtensions = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
]);

type PriorityLocale = (typeof priorityLocales)[number];
type HeaderFieldValue = string | readonly string[] | undefined;
type HashesJSON = Record<string, unknown>;
type UserscriptBranch = "dev" | "master";

interface UserscriptHeader {
  name: string;
  namespace?: string;
  version: string;
  author?: string;
  description?: string;
  icon?: string;
  match: string[] | string;
  exclude?: string[] | string;
  require?: string[] | string;
  connect?: string[] | string;
  grant?: string[] | string;
  homepageURL?: string;
  updateURL?: string;
  downloadURL?: string;
  supportURL?: string;
  [key: string]: string | string[] | undefined;
}

interface LocaleHeadersFile {
  name: string;
  description: string;
}

const legacyIdentifierGrantMap = new Map<string, string>([
  ["GM_addStyle", "GM_addStyle"],
  ["GM_deleteValue", "GM_deleteValue"],
  ["GM_getValue", "GM_getValue"],
  ["GM_getValues", "GM_getValues"],
  ["GM_info", "GM_info"],
  ["GM_listValues", "GM_listValues"],
  ["GM_notification", "GM_notification"],
  ["GM_setValue", "GM_setValue"],
  ["GM_xmlhttpRequest", "GM_xmlhttpRequest"],
]);

const gmMemberGrantMap = new Map<string, string>([
  ["deleteValue", "GM.deleteValue"],
  ["getValue", "GM.getValue"],
  ["getValues", "GM.getValues"],
  ["info", "GM.info"],
  ["listValues", "GM.listValues"],
  ["notification", "GM.notification"],
  ["setValue", "GM.setValue"],
  ["xmlHttpRequest", "GM.xmlHttpRequest"],
  ["xmlhttpRequest", "GM.xmlHttpRequest"],
]);

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function getHeaders<T = UserscriptHeader>(lang?: string) {
  const headersPath = lang
    ? path.resolve(localeHeadersDir, `${lang}.json`)
    : metaHeadersPath;
  return readJsonFile<T>(headersPath);
}

function getLocaleHeaderEntries(): Array<[string, LocaleHeadersFile]> {
  return fs
    .readdirSync(localeHeadersDir)
    .sort((left, right) => left.localeCompare(right))
    .map((file) => [
      file.substring(0, 2),
      readJsonFile<LocaleHeadersFile>(path.resolve(localeHeadersDir, file)),
    ]);
}

async function getAvailableLocales(): Promise<string[]> {
  const hashesRaw = await fs.promises.readFile(hashesPath, "utf8");
  const hashes = JSON.parse(hashesRaw) as HashesJSON;
  const locales = Object.keys(hashes).filter(
    (locale) => !priorityLocales.includes(locale as PriorityLocale),
  );
  return [...priorityLocales, ...locales];
}

function altUrlsToMatch(): string[] {
  return [
    sitesInvidious,
    sitesPiped,
    sitesProxiTok,
    sitesPeertube,
    sitesCoursehunterLike,
  ].flatMap((sites) =>
    sites.map((site) => {
      const dotCount = site.match(/\./g)?.length ?? 0;
      const isSubdomain = dotCount > 1;
      return `*://${isSubdomain ? "" : "*."}${site}/*`;
    }),
  );
}

function sortGrantSet(grants: Iterable<string>): string[] {
  return [...new Set(grants)].sort((left, right) => left.localeCompare(right));
}

function getScriptKind(filePath: string): ts.ScriptKind {
  switch (path.extname(filePath).toLowerCase()) {
    case ".ts":
      return ts.ScriptKind.TS;
    case ".tsx":
      return ts.ScriptKind.TSX;
    case ".jsx":
      return ts.ScriptKind.JSX;
    default:
      return ts.ScriptKind.JS;
  }
}

function unwrapExpression(expression: ts.Expression): ts.Expression {
  if (
    ts.isParenthesizedExpression(expression) ||
    ts.isAsExpression(expression) ||
    ts.isTypeAssertionExpression(expression) ||
    ts.isNonNullExpression(expression) ||
    ts.isSatisfiesExpression(expression)
  ) {
    return unwrapExpression(expression.expression);
  }

  return expression;
}

function isGmNamespaceOrigin(expression: ts.Expression): boolean {
  const unwrappedExpression = unwrapExpression(expression);

  if (ts.isIdentifier(unwrappedExpression)) {
    return unwrappedExpression.text === "GM";
  }

  if (ts.isPropertyAccessExpression(unwrappedExpression)) {
    const baseExpression = unwrapExpression(unwrappedExpression.expression);
    return (
      unwrappedExpression.name.text === "GM" &&
      ts.isIdentifier(baseExpression) &&
      (baseExpression.text === "globalThis" ||
        baseExpression.text === "window" ||
        baseExpression.text === "self")
    );
  }

  if (ts.isConditionalExpression(unwrappedExpression)) {
    return (
      isGmNamespaceOrigin(unwrappedExpression.whenTrue) ||
      isGmNamespaceOrigin(unwrappedExpression.whenFalse)
    );
  }

  if (
    ts.isBinaryExpression(unwrappedExpression) &&
    (unwrappedExpression.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
      unwrappedExpression.operatorToken.kind ===
        ts.SyntaxKind.QuestionQuestionToken)
  ) {
    return (
      isGmNamespaceOrigin(unwrappedExpression.left) ||
      isGmNamespaceOrigin(unwrappedExpression.right)
    );
  }

  return false;
}

function visitGrantNodes(
  parsed: ts.SourceFile,
  detectedGrants: Set<string>,
): void {
  const gmNamespaceAliases = new Set<string>();

  function visit(node: ts.Node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      isGmNamespaceOrigin(node.initializer)
    ) {
      gmNamespaceAliases.add(node.name.text);
    }

    if (ts.isIdentifier(node)) {
      const grant = legacyIdentifierGrantMap.get(node.text);
      if (grant) {
        detectedGrants.add(grant);
      }
    }

    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression)
    ) {
      const targetName = node.expression.text;
      const propertyName = node.name.text;

      if (targetName === "GM" || gmNamespaceAliases.has(targetName)) {
        const grant = gmMemberGrantMap.get(propertyName);
        if (grant) {
          detectedGrants.add(grant);
        }
      }

      if (
        propertyName === "focus" &&
        (targetName === "window" ||
          targetName === "globalThis" ||
          targetName === "self")
      ) {
        detectedGrants.add("window.focus");
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(parsed);
}

function normalizeImportSpecifier(specifier: string): string {
  return specifier.replace(/[?#].*$/, "");
}

function resolveLocalModule(
  importerPath: string,
  specifier: string,
): string | null {
  const normalizedSpecifier = normalizeImportSpecifier(specifier);
  if (!normalizedSpecifier.startsWith(".")) {
    return null;
  }

  const basePath = path.resolve(
    path.dirname(importerPath),
    normalizedSpecifier,
  );
  const candidates = [
    basePath,
    ...Array.from(analyzableCodeExtensions, (ext) => `${basePath}${ext}`),
    ...Array.from(analyzableCodeExtensions, (ext) =>
      path.join(basePath, `index${ext}`),
    ),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function collectLocalDependencies(
  filePath: string,
  parsed: ts.SourceFile,
): string[] {
  const dependencies = new Set<string>();

  function addDependency(specifier?: string) {
    if (!specifier) return;
    const resolved = resolveLocalModule(filePath, specifier);
    if (resolved) {
      dependencies.add(resolved);
    }
  }

  function visit(node: ts.Node) {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      !node.importClause?.isTypeOnly
    ) {
      addDependency(node.moduleSpecifier.text);
    }

    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      !node.isTypeOnly
    ) {
      addDependency(node.moduleSpecifier.text);
    }

    ts.forEachChild(node, visit);
  }

  visit(parsed);
  return [...dependencies];
}

function collectUsedUserscriptGrantsFromEntry(entryFilePath: string): string[] {
  const pendingFiles = [path.resolve(entryFilePath)];
  const visitedFiles = new Set<string>();
  const detectedGrants = new Set<string>();

  while (pendingFiles.length > 0) {
    const currentFilePath = pendingFiles.pop();
    if (!currentFilePath || visitedFiles.has(currentFilePath)) {
      continue;
    }

    visitedFiles.add(currentFilePath);

    const ext = path.extname(currentFilePath).toLowerCase();
    if (
      !analyzableCodeExtensions.has(ext) ||
      currentFilePath.endsWith(".d.ts")
    ) {
      continue;
    }

    const source = fs.readFileSync(currentFilePath, "utf8");
    const parsed = ts.createSourceFile(
      currentFilePath,
      source,
      ts.ScriptTarget.Latest,
      true,
      getScriptKind(currentFilePath),
    );

    visitGrantNodes(parsed, detectedGrants);

    for (const dependencyPath of collectLocalDependencies(
      currentFilePath,
      parsed,
    )) {
      if (!visitedFiles.has(dependencyPath)) {
        pendingFiles.push(dependencyPath);
      }
    }
  }

  return sortGrantSet(detectedGrants);
}

function mergeUserscriptGrants(
  autoDetectedGrants: readonly string[],
  manualGrants?: string | readonly string[],
): string[] {
  const merged = new Set<string>(autoDetectedGrants);
  const manualGrantList =
    typeof manualGrants === "string"
      ? [manualGrants]
      : Array.isArray(manualGrants)
        ? manualGrants
        : [];

  for (const grant of manualGrantList) {
    merged.add(grant);
  }

  return sortGrantSet(merged);
}

function buildUserscriptMeta(
  filename: string,
  repoBranch: UserscriptBranch,
  repoUpdateBranch: UserscriptBranch,
): UserscriptHeader {
  const baseMeta = getHeaders<UserscriptHeader>();
  const finalUrl = `${contentUrl}/${repoUpdateBranch}/dist/${filename}.user.js`;
  const baseMatch = Array.isArray(baseMeta.match)
    ? baseMeta.match
    : [baseMeta.match];
  const match = Array.from(new Set([...baseMatch, ...altUrlsToMatch()]));
  const userscript: UserscriptHeader = {
    ...baseMeta,
    match,
    homepageURL: repositoryUrl,
    updateURL: finalUrl,
    downloadURL: finalUrl,
    supportURL: `${repositoryUrl}/issues`,
  };

  for (const file of fs.readdirSync(localeHeadersDir)) {
    const localeHeaders = readJsonFile<LocaleHeadersFile>(
      path.resolve(localeHeadersDir, file),
    );
    const locale = file.substring(0, 2);
    userscript[`name:${locale}`] = localeHeaders.name;
    userscript[`description:${locale}`] = localeHeaders.description;
  }

  if (repoBranch === "dev") {
    const baseConnect = Array.isArray(userscript.connect)
      ? userscript.connect
      : userscript.connect
        ? [userscript.connect]
        : [];
    userscript.connect = Array.from(
      new Set([...baseConnect, "raw.githubusercontent.com"]),
    );
  }

  return userscript;
}

function formatUserscriptHeader(
  filename: string,
  repoBranch: UserscriptBranch,
  repoUpdateBranch: UserscriptBranch,
  grantsOverride?: readonly string[],
): string {
  const meta = buildUserscriptMeta(filename, repoBranch, repoUpdateBranch);
  const localeEntries = getLocaleHeaderEntries();
  const sourceUrl = `${repositoryUrl}.git`;
  const grants = grantsOverride
    ? [...grantsOverride]
    : Array.isArray(meta.grant)
      ? [...meta.grant]
      : meta.grant
        ? [meta.grant]
        : [];
  const orderedEntries: Array<[string, HeaderFieldValue]> = [
    ["name", meta.name],
    ...localeEntries.map(([locale, value]): [string, string] => [
      `name:${locale}`,
      value.name,
    ]),
    ["namespace", meta.namespace],
    ["version", meta.version],
    ["author", meta.author],
    ["description", meta.description],
    ...localeEntries.map(([locale, value]): [string, string] => [
      `description:${locale}`,
      value.description,
    ]),
    ["license", "MIT"],
    ["icon", meta.icon],
    ["homepageURL", meta.homepageURL],
    ["source", sourceUrl],
    ["supportURL", meta.supportURL],
    ["downloadURL", meta.downloadURL],
    ["updateURL", meta.updateURL],
    ["match", meta.match],
    ["exclude", meta.exclude],
    ["require", meta.require],
    ["connect", meta.connect],
    ["grant", grants],
  ];

  const maxKeyLength =
    Math.max(...orderedEntries.map(([key]) => key.length)) + 1;
  const lines = ["// ==UserScript=="];

  for (const [key, value] of orderedEntries) {
    if (value === undefined) continue;

    const pad = " ".repeat(maxKeyLength - key.length);
    if (Array.isArray(value)) {
      for (const item of value) {
        lines.push(`// @${key}${pad}${item}`);
      }
    } else {
      lines.push(`// @${key}${pad}${value}`);
    }
  }

  lines.push("// ==/UserScript==\n");
  return lines.join("\n");
}

export default defineConfig(async ({ command, mode }) => {
  const isDevCommand = command === "serve";
  const buildMinified = mode === "minify";
  const debugMode = isDevCommand || mode === "development";
  const mainHeaders = getHeaders<UserscriptHeader>();
  const isBetaVersion = String(mainHeaders.version).includes("beta");
  const repoBranch: UserscriptBranch =
    debugMode || isBetaVersion ? "dev" : "master";
  const repoUpdateBranch: UserscriptBranch = isBetaVersion ? "dev" : "master";
  const filename = buildMinified ? "vot-min" : "vot";
  const availableLocales = await getAvailableLocales();
  const grants = mergeUserscriptGrants(
    collectUsedUserscriptGrantsFromEntry(path.resolve(srcDir, "index.ts")),
    (mainHeaders as UserscriptHeader).grant,
  );
  const banner = formatUserscriptHeader(
    filename,
    repoBranch,
    repoUpdateBranch,
    grants,
  );

  return createViteConfig({
    define: {
      ...defineConstants({
        DEBUG_MODE: debugMode,
        AVAILABLE_LOCALES: availableLocales,
        REPO_BRANCH: repoBranch,
        VOT_VERSION: String(mainHeaders.version || ""),
        VOT_AUTHORS: String(mainHeaders.author || ""),
      }),
    },
    build: {
      outDir: distDir,
      emptyOutDir: false,
      lib: {
        entry: path.resolve(srcDir, "index.ts"),
        name: "vot",
        formats: ["iife"],
        fileName: () => `${filename}.user.js`,
      },
      minify: buildMinified ? "oxc" : false,
      sourcemap: debugMode,
      rolldownOptions: {
        output: {
          postBanner: banner,
        },
        onwarn(warning, warn) {
          if (warning.code === "CIRCULAR_DEPENDENCY") return;
          warn(warning);
        },
      },
    },
  });
});
