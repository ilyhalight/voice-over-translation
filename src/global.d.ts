// Build-time globals injected by Vite define config.
const DEBUG_MODE: boolean;
/**
 * Defined only in the extension build (see vite.extension.config.ts).
 * Use `typeof IS_EXTENSION !== "undefined"` checks before reading.
 */
const IS_EXTENSION: boolean;
const AVAILABLE_LOCALES: import("./localization/localizationProvider").LangOverride[];
const REPO_BRANCH: "master" | "dev";

/**
 * Build-time injected comma-separated author list (from `src/headers.json`).
 * Present in both userscript and extension builds.
 */
const VOT_AUTHORS: string;

/**
 * @link https://wiki.greasespot.net/unsafeWindow
 */
const unsafeWindow: Window;

// --- Userscript globals (Tampermonkey / Violentmonkey / etc.) ---
// These are injected at runtime by the userscript manager or by our extension
// prelude. Keep them loosely typed.
declare const GM_info: any;
declare const GM: {
  // Promise-based GM API (supported by most userscript managers).
  getValue?<T>(key: string, defaultValue?: T): Promise<T>;
  getValues?<T extends Record<string, unknown>>(data: T): Promise<T>;
  setValue?<T>(key: string, value: T): Promise<void>;
  deleteValue?(key: string): Promise<void>;
  listValues?<T extends string = string>(): Promise<T[]>;
  // Some managers expose more APIs, but we only rely on the above.
};
declare function GM_getValue<T>(key: string, defaultValue?: T): T;
declare function GM_setValue<T>(key: string, value: T): void;
declare function GM_deleteValue(key: string): void;
declare function GM_listValues<T extends string = string>(): T[];
declare function GM_xmlhttpRequest(details: any): { abort?: () => void } | void;

// --- WebExtension globals (Chrome) ---
// We intentionally keep these as `any` to avoid pulling in the huge
// @types/chrome dependency for the core build.
declare const chrome: any;

interface Window {
  /** Safari legacy prefix for AudioContext */
  webkitAudioContext?: typeof AudioContext;
}

// Allow side-effect style imports for styles in TS files (e.g. `import "./styles/main.scss"`).
declare module "*.scss";
