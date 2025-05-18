import path from "path";
import { fileURLToPath } from "url";

import webpack from "webpack";

import { monkey } from "webpack-monkey";
import { styleLoaderInsertStyleElement } from "webpack-monkey/lib/client/css.js";
import ESLintPlugin from "eslint-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";

import configShared from "./shared.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(path.dirname(__filename), "..");

export default () => {
  return monkey({
    mode: "production",
    ...configShared,
    entry: path.resolve(__dirname, "tests", "ui.js"),
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "test-ui.user.js",
    },
    monkey: {
      debug: false,
      meta: {
        resolve: path.resolve(__dirname, "tests", "headers.json"),
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
        DEBUG_MODE: true,
        IS_BETA_VERSION: false,
        REPO_BRANCH: JSON.stringify("master"),
        __MK_GLOBAL__: {
          styleLoaderInsertStyleElement,
        },
      }),
    ],
    optimization: {
      emitOnErrors: true,
      moduleIds: "named",
      minimize: false,
      minimizer: [new TerserPlugin()],
    },
  });
};
