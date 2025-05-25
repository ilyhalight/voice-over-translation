import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig([
  {
    ignores: ["dist/*"],
  },
  js.configs.recommended,
  {
    rules: {
      "no-control-regex": 0,
      "no-async-promise-executor": 0,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.greasemonkey,
        // IMPORTED SCRIPTS
        protobuf: "readonly",
        Hls: "readonly",
        anime: "readonly",
        // WEBPACK ENVIRONMENT
        DEBUG_MODE: "readonly",
        AVAILABLE_LOCALES: "readonly",
        IS_BETA_VERSION: "readonly",
        __MK_GLOBAL__: "readonly",
        // YOUTUBE PAGE API
        ytplayer: "readonly",
      },
    },
  },
]);
