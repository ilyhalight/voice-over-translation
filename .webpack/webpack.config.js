import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import webpack from "webpack";

import { monkey } from "webpack-monkey";
import { styleLoaderInsertStyleElement } from "webpack-monkey/lib/client/css.js";
import ESLintPlugin from "eslint-webpack-plugin";
import { OxcMinifyWebpackPlugin } from "oxc-minify-webpack-plugin";

import {
  sitesInvidious,
  sitesPiped,
  sitesProxiTok,
  sitesPeertube,
  sitesPoketube,
  sitesCoursehunterLike,
  sitesRicktube,
  // sitesMaterialious,
} from "@vot.js/shared/alternativeUrls";
import configShared from "./shared.config.js";

import { repositoryUrl, contentUrl } from "../src/config/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(path.dirname(__filename), "..");
const localesDir = path.resolve(__dirname, "src", "localization", "locales");
const metaHeadersPath = path.resolve(__dirname, "src", "headers.json");
const priorityLocales = ["auto", "en", "ru"];

let isBeta = getHeaders().version.includes("beta");
const availableLocales = await getAvailableLocales();

// globals
const DEBUG_MODE = process.env.NODE_ENV === "development";
const REPO_BRANCH = DEBUG_MODE || isBeta ? "dev" : "master";
const REPO_UPDATE_BRANCH = isBeta ? "dev" : "master";
const minimalOxc = {
  codegen: {
    removeWhitespace: false,
  },
  compress: {
    keepNames: {
      class: true,
      function: true,
    },
  },
  mangle: {
    keepNames: {
      class: true,
      function: true,
    },
  },
};

function getHeaders(lang = "") {
  const headersPath = lang
    ? path.resolve(localesDir, "headers", lang)
    : metaHeadersPath;
  return JSON.parse(fs.readFileSync(headersPath, "utf8"));
}

async function getAvailableLocales() {
  const hashes = await fs.promises.readFile(
    path.resolve(localesDir, "..", "hashes.json"),
    "utf8",
  );
  const content = JSON.parse(hashes);
  const locales = Object.keys(content).filter(
    (locale) => !priorityLocales.includes(locale),
  );
  return [...priorityLocales, ...locales];
}

export default (env) => {
  const BUILD_MINIFIED = env.build_type === "minify";
  console.log(`minified: ${BUILD_MINIFIED}, dev: ${DEBUG_MODE}. Building...`);

  let filename = "vot";
  if (BUILD_MINIFIED) {
    filename += "-min";
  }

  function altUrlsToMatch() {
    // autogenerating match list by alternative urls sites
    return [
      sitesInvidious,
      sitesPiped,
      sitesProxiTok,
      sitesPeertube,
      sitesPoketube,
      sitesRicktube,
      // sitesMaterialious,
      sitesCoursehunterLike,
    ]
      .map((sites) =>
        sites.map((site) => {
          const isSubdomain = site.match(/\./g)?.length > 1;
          return `*://${isSubdomain ? "" : "*."}${site}/*`;
        }),
      )
      .flat();
  }

  return monkey({
    mode: DEBUG_MODE ? "development" : "production",
    ...configShared,
    entry: path.resolve(__dirname, "src", "index.js"),
    output: {
      path: path.resolve(__dirname, "dist"),
      ...(!DEBUG_MODE ? { filename: `${filename}.user.js` } : {}),
    },
    monkey: {
      debug: DEBUG_MODE,
      meta: {
        resolve: metaHeadersPath,
        transform({ meta }) {
          const finalURL = `${contentUrl}/${REPO_UPDATE_BRANCH}/dist/${filename}.user.js`;

          meta.namespace = filename;
          meta.homepageURL = repositoryUrl;
          meta.updateURL = meta.downloadURL = finalURL;
          meta.supportURL = `${repositoryUrl}/issues`;

          const files = fs.readdirSync(path.resolve(localesDir, "headers"));
          meta = {
            ...meta,
            name: {
              default: meta.name,
            },
            description: {
              default: meta.description,
            },
            match: Array.from(new Set([...meta.match, ...altUrlsToMatch()])),
          };

          for (const file of files) {
            const localeHeaders = getHeaders(file);
            const lang = file.substring(0, 2);

            meta.name[lang] = localeHeaders.name;
            meta.description[lang] = localeHeaders.description;
          }

          return meta;
        },
      },
    },
    plugins: [
      new ESLintPlugin({
        configType: "flat",
      }),
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
      new webpack.DefinePlugin({
        DEBUG_MODE,
        AVAILABLE_LOCALES: JSON.stringify(availableLocales),
        REPO_BRANCH: JSON.stringify(REPO_BRANCH),
        ...(() => {
          if (!DEBUG_MODE) {
            return {
              __MK_GLOBAL__: {
                styleLoaderInsertStyleElement,
              },
            };
          }
        })(),
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^node:crypto$/,
      }),
    ],
    optimization: {
      emitOnErrors: true,
      moduleIds: "named",
      minimize: true,
      minimizer: [new OxcMinifyWebpackPlugin(BUILD_MINIFIED ? {} : minimalOxc)],
    },
  });
};
