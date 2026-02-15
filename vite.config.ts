import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  sitesCoursehunterLike,
  sitesInvidious,
  sitesPeertube,
  sitesPiped,
  sitesProxiTok,
} from "@vot.js/shared/alternativeUrls";
import type { UserConfig } from "vite";
import { defineConfig } from "vite";
import type { MonkeyUserScript } from "vite-plugin-monkey";
import monkey from "vite-plugin-monkey";
import { contentUrl, repositoryUrl } from "./src/config/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, "src");
const distDir = path.resolve(__dirname, "dist");
const localesDir = path.resolve(srcDir, "localization", "locales");
const localeHeadersDir = path.resolve(localesDir, "headers");
const hashesPath = path.resolve(srcDir, "localization", "hashes.json");
const metaHeadersPath = path.resolve(srcDir, "headers.json");
const priorityLocales = ["auto", "en", "ru"] as const;

type PriorityLocale = (typeof priorityLocales)[number];

type HashesJSON = Record<string, unknown>;

type UserscriptBranch = "dev" | "master";

interface LocaleHeadersFile {
  name: string;
  description: string;
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function getHeaders<T = MonkeyUserScript>(lang?: string) {
  const headersPath = lang
    ? path.resolve(localeHeadersDir, `${lang}.json`)
    : metaHeadersPath;
  return readJsonFile<T>(headersPath);
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

function buildUserscriptMeta(
  filename: string,
  repoBranch: UserscriptBranch,
  repoUpdateBranch: UserscriptBranch,
): MonkeyUserScript {
  const baseMeta = getHeaders<MonkeyUserScript>();
  const files = fs.readdirSync(localeHeadersDir);
  const baseName =
    typeof baseMeta.name === "string"
      ? baseMeta.name
      : (baseMeta.name?.default ?? "");
  const baseDescription =
    typeof baseMeta.description === "string"
      ? baseMeta.description
      : (baseMeta.description?.default ?? "");
  const nameLocales: Record<string, string> = { "": baseName };
  const descriptionLocales: Record<string, string> = { "": baseDescription };

  for (const file of files) {
    const localeHeaders = readJsonFile<LocaleHeadersFile>(
      path.resolve(localeHeadersDir, file),
    );
    const locale = file.substring(0, 2);
    nameLocales[locale] = localeHeaders.name;
    descriptionLocales[locale] = localeHeaders.description;
  }

  const finalUrl = `${contentUrl}/${repoUpdateBranch}/dist/${filename}.user.js`;
  const baseMatch = Array.isArray(baseMeta.match) ? baseMeta.match : [];
  const match = Array.from(new Set([...baseMatch, ...altUrlsToMatch()]));

  const userscript: MonkeyUserScript = {
    ...baseMeta,
    name: nameLocales,
    description: descriptionLocales,
    match,
    homepageURL: repositoryUrl,
    updateURL: finalUrl,
    downloadURL: finalUrl,
    supportURL: `${repositoryUrl}/issues`,
  };

  const localeProps = userscript as Record<string, unknown>;
  for (const [locale, value] of Object.entries(nameLocales)) {
    if (!locale) continue;
    localeProps[`name:${locale}`] = value;
  }
  for (const [locale, value] of Object.entries(descriptionLocales)) {
    if (!locale) continue;
    localeProps[`description:${locale}`] = value;
  }

  if (repoBranch === "dev") {
    const baseConnect = Array.isArray(userscript.connect)
      ? userscript.connect
      : [];
    userscript.connect = Array.from(
      new Set([...baseConnect, "raw.githubusercontent.com"]),
    );
  }

  return userscript;
}

export default defineConfig(async ({ command, mode }) => {
  const isDevCommand = command === "serve";
  const buildMinified = mode === "minify";
  const debugMode = isDevCommand || mode === "development";
  const mainHeaders = getHeaders();
  const isBetaVersion = String(mainHeaders.version).includes("beta");
  const repoBranch: UserscriptBranch =
    debugMode || isBetaVersion ? "dev" : "master";
  const repoUpdateBranch: UserscriptBranch = isBetaVersion ? "dev" : "master";
  const filename = buildMinified ? "vot-min" : "vot";
  const availableLocales = await getAvailableLocales();

  const config: UserConfig = {
    define: {
      DEBUG_MODE: JSON.stringify(debugMode),
      AVAILABLE_LOCALES: JSON.stringify(availableLocales),
      REPO_BRANCH: JSON.stringify(repoBranch),
      // Expose a tiny piece of metadata to runtime UI (Settings → About).
      // This avoids relying on GM_info.script.author which isn't present in
      // the extension build.
      VOT_AUTHORS: JSON.stringify(String((mainHeaders as any).author || "")),
    },
    resolve: {
      extensions: [".js", ".ts"],
    },
    css: {
      transformer: "lightningcss",
    },
    build: {
      outDir: distDir,
      emptyOutDir: !buildMinified,
      minify: buildMinified ? "esbuild" : false,
      sourcemap: debugMode,
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === "CIRCULAR_DEPENDENCY") return;
          warn(warning);
        },
      },
    },
    plugins: [
      ...monkey({
        entry: path.resolve(srcDir, "index.ts"),
        userscript: buildUserscriptMeta(filename, repoBranch, repoUpdateBranch),
        build: {
          fileName: `${filename}.user.js`,
          metaFileName: false,
          cssSideEffects: "(css)=>GM_addStyle(css)",
          autoGrant: true,
          systemjs: "inline",
        },
      }),
    ],
  };
  return config;
});
