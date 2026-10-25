import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { type ESTree, parseAstAsync, Visitor } from "vite";
import { SOURCE_DIR } from "../paths.ts";

const analyzableCodeExtensions = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
]);

export interface UserscriptHeader {
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

export function getHeaders<T = UserscriptHeader>(lang?: string): T {
  const localesDir = path.resolve(SOURCE_DIR, "localization", "locales");
  const localeHeadersDir = path.resolve(localesDir, "headers");
  const metaHeadersPath = path.resolve(SOURCE_DIR, "headers.json");
  const headersPath = lang
    ? path.resolve(localeHeadersDir, `${lang}.json`)
    : metaHeadersPath;
  return readJsonFile<T>(headersPath);
}

function sortGrantSet(grants: Iterable<string>): string[] {
  return [...new Set(grants)].sort((left, right) => left.localeCompare(right));
}

type ParserLang = "js" | "jsx" | "ts" | "tsx";

function getParserLang(filePath: string): ParserLang {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  return ext === "ts" || ext === "tsx" || ext === "jsx" ? ext : "js";
}

function unwrapExpression(expression: ESTree.Expression): ESTree.Expression {
  switch (expression.type) {
    case "ParenthesizedExpression":
    case "TSAsExpression":
    case "TSTypeAssertion":
    case "TSNonNullExpression":
    case "TSSatisfiesExpression":
      return unwrapExpression(expression.expression);
    default:
      return expression;
  }
}

function isGlobalObjectName(name: string): boolean {
  return name === "globalThis" || name === "window" || name === "self";
}

function isGmNamespaceOrigin(expression: ESTree.Expression): boolean {
  const unwrappedExpression = unwrapExpression(expression);

  switch (unwrappedExpression.type) {
    case "Identifier":
      return unwrappedExpression.name === "GM";
    case "MemberExpression": {
      if (
        unwrappedExpression.computed ||
        unwrappedExpression.property.type !== "Identifier"
      ) {
        return false;
      }
      const baseExpression = unwrapExpression(unwrappedExpression.object);
      return (
        unwrappedExpression.property.name === "GM" &&
        baseExpression.type === "Identifier" &&
        isGlobalObjectName(baseExpression.name)
      );
    }
    case "ConditionalExpression":
      return (
        isGmNamespaceOrigin(unwrappedExpression.consequent) ||
        isGmNamespaceOrigin(unwrappedExpression.alternate)
      );
    case "LogicalExpression":
      return (
        (unwrappedExpression.operator === "||" ||
          unwrappedExpression.operator === "??") &&
        (isGmNamespaceOrigin(unwrappedExpression.left) ||
          isGmNamespaceOrigin(unwrappedExpression.right))
      );
    default:
      return false;
  }
}

function visitGrantNodes(
  program: ESTree.Program,
  detectedGrants: Set<string>,
): void {
  const gmNamespaceAliases = new Set<string>();

  new Visitor({
    VariableDeclarator(node) {
      if (
        node.id.type === "Identifier" &&
        node.init &&
        isGmNamespaceOrigin(node.init)
      ) {
        gmNamespaceAliases.add(node.id.name);
      }
    },
    Identifier(node) {
      const grant = legacyIdentifierGrantMap.get(node.name);
      if (grant) detectedGrants.add(grant);
    },
    MemberExpression(node) {
      if (
        node.computed ||
        node.object.type !== "Identifier" ||
        node.property.type !== "Identifier"
      ) {
        return;
      }

      const targetName = node.object.name;
      const propertyName = node.property.name;

      if (targetName === "GM" || gmNamespaceAliases.has(targetName)) {
        const grant = gmMemberGrantMap.get(propertyName);
        if (grant) detectedGrants.add(grant);
      }

      if (propertyName === "focus" && isGlobalObjectName(targetName)) {
        detectedGrants.add("window.focus");
      }
    },
  }).visit(program);
}

function normalizeImportSpecifier(specifier: string): string {
  return specifier.replace(/[?#].*/, "");
}

function resolveLocalModule(
  importerPath: string,
  specifier: string,
): string | null {
  const normalizedSpecifier = normalizeImportSpecifier(specifier);
  if (!normalizedSpecifier.startsWith(".")) return null;

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
    try {
      const stat = fs.statSync(candidate);
      if (stat.isFile()) return candidate;
    } catch {
      // file does not exist — try next candidate
    }
  }

  return null;
}

function collectLocalDependencies(
  filePath: string,
  program: ESTree.Program,
): string[] {
  const dependencies = new Set<string>();

  function addDependency(specifier: string) {
    const resolved = resolveLocalModule(filePath, specifier);
    if (resolved) dependencies.add(resolved);
  }

  new Visitor({
    ImportDeclaration(node) {
      if (node.importKind !== "type") addDependency(node.source.value);
    },
    ExportNamedDeclaration(node) {
      if (node.source && node.exportKind !== "type") {
        addDependency(node.source.value);
      }
    },
    ExportAllDeclaration(node) {
      if (node.exportKind !== "type") addDependency(node.source.value);
    },
  }).visit(program);

  return [...dependencies];
}

export async function collectUsedUserscriptGrantsFromEntry(
  entryFilePath: string,
): Promise<string[]> {
  const visitedFiles = new Set<string>();
  const detectedGrants = new Set<string>();

  async function visitFile(currentFilePath: string): Promise<void> {
    if (visitedFiles.has(currentFilePath)) return;

    visitedFiles.add(currentFilePath);

    const ext = path.extname(currentFilePath).toLowerCase();
    if (
      !analyzableCodeExtensions.has(ext) ||
      currentFilePath.endsWith(".d.ts")
    ) {
      return;
    }

    const source = await fsPromises.readFile(currentFilePath, "utf8");
    const program = await parseAstAsync(
      source,
      { lang: getParserLang(currentFilePath) },
      currentFilePath,
    );

    visitGrantNodes(program, detectedGrants);

    await Promise.all(
      collectLocalDependencies(currentFilePath, program).map(visitFile),
    );
  }

  await visitFile(path.resolve(entryFilePath));
  return sortGrantSet(detectedGrants);
}

export function mergeUserscriptGrants(
  autoDetectedGrants: readonly string[],
  manualGrants?: string | readonly string[],
): string[] {
  const merged = new Set<string>(autoDetectedGrants);
  if (manualGrants) {
    const list = Array.isArray(manualGrants) ? manualGrants : [manualGrants];
    for (const grant of list) merged.add(grant);
  }

  return sortGrantSet(merged);
}
