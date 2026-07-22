import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { srcDir } from "../paths";

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
  const localesDir = path.resolve(srcDir, "localization", "locales");
  const localeHeadersDir = path.resolve(localesDir, "headers");
  const metaHeadersPath = path.resolve(srcDir, "headers.json");
  const headersPath = lang
    ? path.resolve(localeHeadersDir, `${lang}.json`)
    : metaHeadersPath;
  return readJsonFile<T>(headersPath);
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
      if (grant) detectedGrants.add(grant);
    }

    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression)
    ) {
      const targetName = node.expression.text;
      const propertyName = node.name.text;

      if (targetName === "GM" || gmNamespaceAliases.has(targetName)) {
        const grant = gmMemberGrantMap.get(propertyName);
        if (grant) detectedGrants.add(grant);
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
  parsed: ts.SourceFile,
): string[] {
  const dependencies = new Set<string>();

  function addDependency(specifier?: string) {
    if (!specifier) return;
    const resolved = resolveLocalModule(filePath, specifier);
    if (resolved) dependencies.add(resolved);
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

export async function collectUsedUserscriptGrantsFromEntry(
  entryFilePath: string,
): Promise<string[]> {
  const pendingFiles = [path.resolve(entryFilePath)];
  const visitedFiles = new Set<string>();
  const detectedGrants = new Set<string>();

  // Touch GetAltMatchPatternsFn for signature symmetry with the old API (reserved hook).
  // void (undefined as GetAltMatchPatternsFn | undefined);

  while (pendingFiles.length > 0) {
    const currentFilePath = pendingFiles.pop();
    if (!currentFilePath || visitedFiles.has(currentFilePath)) continue;

    visitedFiles.add(currentFilePath);

    const ext = path.extname(currentFilePath).toLowerCase();
    if (
      !analyzableCodeExtensions.has(ext) ||
      currentFilePath.endsWith(".d.ts")
    ) {
      continue;
    }

    const source = await fsPromises.readFile(currentFilePath, "utf8");
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
