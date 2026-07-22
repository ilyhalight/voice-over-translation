import fs from "node:fs/promises";
import path from "node:path";
import { srcDir } from "../paths";

const localesDir = path.resolve(srcDir, "localization", "locales");
const localeHeadersDir = path.resolve(localesDir, "headers");
const hashesPath = path.resolve(srcDir, "localization", "hashes.json");
const _metaHeadersPath = path.resolve(srcDir, "headers.json");

const priorityLocales = ["auto", "en", "ru"] as const;
type PriorityLocale = (typeof priorityLocales)[number];

export interface LocaleHeadersFile {
  name: string;
  description: string;
}

export async function getAvailableLocales(): Promise<string[]> {
  const hashesRaw = await fs.readFile(hashesPath, "utf8");
  const hashes = JSON.parse(hashesRaw) as Record<string, unknown>;
  const locales = Object.keys(hashes).filter(
    (locale) => !priorityLocales.includes(locale as PriorityLocale),
  );
  return [...priorityLocales, ...locales];
}

export async function getLocaleHeaderEntriesAsync(): Promise<
  Array<[string, LocaleHeadersFile]>
> {
  const files = await fs.readdir(localeHeadersDir);
  const sorted = files.sort((left, right) => left.localeCompare(right));
  const entries = await Promise.all(
    sorted.map(async (file) => {
      const data = JSON.parse(
        await fs.readFile(path.resolve(localeHeadersDir, file), "utf8"),
      ) as LocaleHeadersFile;
      return [file.substring(0, 2), data] as [string, LocaleHeadersFile];
    }),
  );
  return entries;
}
