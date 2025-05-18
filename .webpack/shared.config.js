import path from "node:path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(path.dirname(__filename));

/**
 * @type {import('webpack').Configuration}
 */
const config = {
  resolve: {
    extensions: [".js", ".ts"],
  },
  performance: {
    hints: "error",
    maxEntrypointSize: 2000 * 10 ** 3,
    maxAssetSize: 2000 * 10 ** 3,
  },
  resolveLoader: {
    alias: {
      "lightning-loader": path.resolve(__dirname, "lightning-loader.js"),
    },
  },
  module: {
    rules: [
      {
        test: /\.(css|scss|sass)$/i,
        // use: ["style-loader", "css-loader", "sass-loader"],
        use: ["lightning-loader"],
      },
      // {
      //   test: /\.ts$/,
      //   use: "ts-loader",
      //   exclude: /node_modules/,
      // },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "@sucrase/webpack-loader",
          options: {
            transforms: ["typescript"],
            disableESTransforms: true,
          },
        },
      },
    ],
  },
};

export default config;
