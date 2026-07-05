import { contentUrl, repositoryUrl } from "../../../src/config/config";
import { getAltMatchPatterns } from "./alt-urls";
import { getHeaders, type UserscriptHeader } from "./grants";
import type { LocaleHeadersFile } from "./locales";

type UserscriptBranch = "dev" | "master";
type HeaderFieldValue = string | readonly string[] | undefined;

function buildUserscriptMeta(
  filename: string,
  repoBranch: UserscriptBranch,
  repoUpdateBranch: UserscriptBranch,
  localeEntries: Array<[string, LocaleHeadersFile]>,
): UserscriptHeader {
  const baseMeta = getHeaders<UserscriptHeader>();
  const finalUrl = `${contentUrl}/${repoUpdateBranch}/dist/${filename}.user.js`;
  const baseMatch = Array.isArray(baseMeta.match)
    ? baseMeta.match
    : [baseMeta.match];
  const match = Array.from(new Set([...baseMatch, ...getAltMatchPatterns()]));
  const userscript: UserscriptHeader = {
    ...baseMeta,
    match,
    homepageURL: repositoryUrl,
    updateURL: finalUrl,
    downloadURL: finalUrl,
    supportURL: `${repositoryUrl}/issues`,
  };

  for (const [locale, headers] of localeEntries) {
    userscript[`name:${locale}`] = headers.name;
    userscript[`description:${locale}`] = headers.description;
  }

  if (repoBranch === "dev") {
    const baseConnect = userscript.connect;
    let existing: string[];
    if (Array.isArray(baseConnect)) {
      existing = baseConnect;
    } else if (baseConnect == null) {
      existing = [];
    } else {
      existing = [baseConnect];
    }
    userscript.connect = Array.from(
      new Set([...existing, "raw.githubusercontent.com"]),
    );
  }

  return userscript;
}

export function formatUserscriptHeader(options: {
  filename: string;
  repoBranch: UserscriptBranch;
  repoUpdateBranch: UserscriptBranch;
  localeEntries: Array<[string, LocaleHeadersFile]>;
  grants: readonly string[];
}): string {
  const meta = buildUserscriptMeta(
    options.filename,
    options.repoBranch,
    options.repoUpdateBranch,
    options.localeEntries,
  );
  const sourceUrl = `${repositoryUrl}.git`;
  const grants = [...options.grants];
  const orderedEntries: Array<[string, HeaderFieldValue]> = [
    ["name", meta.name],
    ...options.localeEntries.map(([locale, value]): [string, string] => [
      `name:${locale}`,
      value.name,
    ]),
    ["namespace", meta.namespace],
    ["version", meta.version],
    ["author", meta.author],
    ["description", meta.description],
    ...options.localeEntries.map(([locale, value]): [string, string] => [
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

  let maxKeyLength = 0;
  for (const [key] of orderedEntries) {
    if (key.length > maxKeyLength) maxKeyLength = key.length;
  }
  maxKeyLength += 1;

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

// Упрощённый форматтер для test-ui (без локалей/грантов/альтернативных URL)
export function formatSimpleUserscriptHeader(
  header: Record<string, unknown>,
): string {
  const lines = ["// ==UserScript=="];

  for (const [key, value] of Object.entries(header)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        lines.push(`// @${key} ${item}`);
      }
      continue;
    }

    lines.push(`// @${key} ${String(value)}`);
  }

  lines.push("// ==/UserScript==\n");
  return lines.join("\n");
}
