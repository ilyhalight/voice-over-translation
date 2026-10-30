import { JSX } from "solid-js";

declare global {
  // Build-time globals injected by Vite define config.
  const DEBUG_MODE: boolean;
  /** `true` in the WXT extension build, `false` in the userscript build. */
  const IS_EXTENSION: boolean;
  const AVAILABLE_LOCALES: import("./types/localization").LangOverride[];
  const REPO_BRANCH: "master" | "dev";

  /**
   * Build-time injected comma-separated author list (from `src/headers.json`).
   * Present in both userscript and extension builds.
   */
  const VOT_AUTHORS: string;

  /**
   * Build-time injected extension/userscript version (from `src/headers.json`).
   * Present in both userscript and extension builds.
   */
  const VOT_VERSION: string;

  /**
   * Build-time injected build flavor (see `getBuildVariant` in vite/lib/env.ts).
   */
  const VOT_BUILD_VARIANT:
    | "userscript"
    | "userscript-min"
    | "chrome"
    | "firefox";

  // --- Userscript globals (Tampermonkey / Violentmonkey / etc.) ---
  // These are injected at runtime by the userscript manager or by our extension
  // prelude.  GM is installed synchronously at document_start before any
  // content-script code evaluates.

  // --- WebExtension globals (Chrome) ---
  // We intentionally keep these as `any` to avoid pulling in the huge
  // @types/chrome dependency for the core build.
  const chrome: any;
}

// Allow style imports in TS files, including Vite's inline CSS string mode.
declare module "*.scss";
declare module "*.scss?inline" {
  const content: string;
  export default content;
}

declare module "solid-js" {
  namespace JSX {
    interface ExplicitAttributes {
      lang: string;
    }
    interface IntrinsicElements {
      "vot-block": JSX.HTMLAttributes<HTMLElement>;
    }
  }
}
