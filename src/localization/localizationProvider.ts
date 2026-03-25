import { contentUrl } from "../config/config";
import type { FlatPhrases, LangOverride, Phrase } from "../types/localization";
import type { LocaleStorageKey } from "../types/storage";
import debug from "../utils/debug";
import { GM_fetch } from "../utils/gm";
import { lang } from "../utils/localization";
import { votStorage } from "../utils/storage";
import { getTimestamp, toFlatObj } from "../utils/utils";
import rawDefaultLocale from "./locales/en.json";

export type { LangOverride } from "../types/localization";

const LOCALE_STORAGE_KEYS: readonly LocaleStorageKey[] = [
  "localePhrases",
  "localeLang",
  "localeHash",
  "localeVersion",
  "localeUpdatedAt",
  "localeLangOverride",
];
const DEFAULT_LOCALE: FlatPhrases = toFlatObj(rawDefaultLocale);

const repoBranch =
  typeof REPO_BRANCH !== "undefined" && REPO_BRANCH ? REPO_BRANCH : "master";
const availableLocales: readonly LangOverride[] = (() => {
  const locales =
    typeof AVAILABLE_LOCALES !== "undefined" && Array.isArray(AVAILABLE_LOCALES)
      ? AVAILABLE_LOCALES
      : ["en"];

  // Older extension builds injected AVAILABLE_LOCALES without the `auto`
  // option. Always expose it so Settings -> Language can restore automatic
  // detection.
  return locales.includes("auto")
    ? (locales as LangOverride[])
    : (["auto", ...locales] as LangOverride[]);
})();

export function resolveRuntimeLocaleVersion(
  buildVersion: string,
  scriptVersion: string,
) {
  return buildVersion || scriptVersion || "unknown";
}

function getRuntimeLocaleVersion() {
  const buildVersion =
    typeof VOT_VERSION !== "undefined" ? String(VOT_VERSION || "") : "";
  const scriptVersion =
    typeof GM_info !== "undefined"
      ? String(GM_info?.script?.version || "")
      : "";

  return resolveRuntimeLocaleVersion(buildVersion, scriptVersion);
}

class LocalizationProvider {
  /**
   * Language used before page was reloaded
   */
  lang: string;
  /**
   * Locale phrases with current language
   */
  locale: Partial<FlatPhrases>;
  readonly defaultLocale: FlatPhrases = DEFAULT_LOCALE;
  readonly localesUrl = `${contentUrl}/${repoBranch}/src/localization/locales`;
  readonly hashesUrl =
    `${contentUrl}/${repoBranch}/src/localization/hashes.json`;

  private readonly warnedMissingKeys = new Set<string>();
  private _langOverride: LangOverride = "auto";

  constructor() {
    this.lang = this.getLang();
    this.locale = {};
  }

  async init() {
    const [langOverride, phrases] = await Promise.all([
      votStorage.get<LangOverride>("localeLangOverride", "auto"),
      votStorage.get<string>("localePhrases", ""),
    ]);
    this._langOverride = langOverride;
    this.lang = this.getLang();
    this.setLocaleFromJsonString(phrases);
    return this;
  }

  get langOverride() {
    return this._langOverride;
  }

  getLang(): string {
    return this.langOverride !== "auto" ? this.langOverride : lang;
  }

  getAvailableLangs(): LangOverride[] {
    return [...availableLocales];
  }

  async reset() {
    await Promise.all(LOCALE_STORAGE_KEYS.map((key) => votStorage.delete(key)));
    return this;
  }

  private buildUrl(baseUrl: string, path = "", force = false) {
    const query = force ? `?timestamp=${getTimestamp()}` : "";
    return `${baseUrl}${path}${query}`;
  }

  async changeLang(newLang: LangOverride) {
    const oldLang = this.langOverride;
    if (oldLang === newLang) {
      return false;
    }

    await votStorage.set("localeLangOverride", newLang);
    this._langOverride = newLang;
    this.lang = this.getLang();
    await this.update(true);
    return true;
  }

  async checkUpdates(force = false): Promise<false | null | string> {
    debug.log("Check locale updates...");
    try {
      const res = await GM_fetch(this.buildUrl(this.hashesUrl, "", force));
      if (!res.ok) throw res.status;

      const hashes = await res.json();
      if (!hashes || typeof hashes !== "object") {
        throw new Error("Invalid locale hashes payload");
      }

      const nextHash = (hashes as Record<string, unknown>)[this.lang];
      if (typeof nextHash !== "string" || !nextHash) {
        return false;
      }

      const currentHash = await votStorage.get<string>("localeHash", "");
      return currentHash === nextHash ? false : nextHash;
    } catch (err) {
      console.error(
        "[VOT] [localizationProvider] Failed to get locales hash:",
        err,
      );
      return null;
    }
  }

  async update(force = false) {
    const runtimeLocaleVersion = getRuntimeLocaleVersion();
    const storedLocaleVersion = await votStorage.get<string>(
      "localeVersion",
      "",
    );

    const hash = await this.checkUpdates(force);
    if (hash === null) {
      // Do not update localeUpdatedAt on transient failures.
      // This allows a near-term retry instead of waiting for cache TTL.
      return this;
    }

    if (!hash) {
      if (storedLocaleVersion !== runtimeLocaleVersion) {
        await votStorage.set("localeVersion", runtimeLocaleVersion);
      }
      return this;
    }

    const timestamp = getTimestamp();
    debug.log("Updating locale...");
    try {
      const res = await GM_fetch(
        this.buildUrl(this.localesUrl, `/${this.lang}.json`, force),
      );
      if (!res.ok) throw res.status;

      // Use `.text()` to keep a single storage format for GM_Storage/localStorage.
      const text = await res.text();
      this.setLocaleFromJsonString(text);
      await Promise.all([
        votStorage.set("localePhrases", text),
        votStorage.set("localeHash", hash),
        votStorage.set("localeLang", this.lang),
        votStorage.set("localeVersion", runtimeLocaleVersion),
        votStorage.set("localeUpdatedAt", timestamp),
      ]);
    } catch (err) {
      console.error("[VOT] [localizationProvider] Failed to get locale:", err);
      this.setLocaleFromJsonString(await votStorage.get("localePhrases", ""));
    }

    return this;
  }

  setLocaleFromJsonString(json: string) {
    const trimmed = json.trim();
    if (!trimmed) {
      this.locale = {};
      this.warnedMissingKeys.clear();
      return this;
    }

    try {
      const locale = JSON.parse(trimmed);
      if (!locale || typeof locale !== "object" || Array.isArray(locale)) {
        throw new Error("Locale payload should be a JSON object");
      }

      this.locale = toFlatObj(locale as Record<string, unknown>);
    } catch (err) {
      console.error("[VOT] [localizationProvider]", err);
      this.locale = {};
    }

    this.warnedMissingKeys.clear();
    return this;
  }

  private getFromLocale(
    locale: Partial<FlatPhrases>,
    key: Phrase,
    source: "default" | "locale" = "locale",
  ) {
    const phrase = locale[key];
    return phrase ?? this.warnMissingKey(locale, key, source);
  }

  private warnMissingKey(
    locale: Partial<FlatPhrases>,
    key: Phrase,
    source: "default" | "locale",
  ) {
    const warningKey = `${source}:${key}`;
    if (this.warnedMissingKeys.has(warningKey)) {
      return undefined;
    }

    this.warnedMissingKeys.add(warningKey);
    console.warn(
      "[VOT] [localizationProvider] locale",
      locale,
      "doesn't contain key",
      key,
    );
    return undefined;
  }

  getDefault(key: Phrase) {
    return this.getFromLocale(this.defaultLocale, key, "default") ?? key;
  }

  get(key: Phrase) {
    return this.getFromLocale(this.locale, key) ?? this.getDefault(key);
  }

  getLangLabel(lang: string) {
    const key = `langs.${lang}` as Phrase;
    if (key in this.defaultLocale) {
      const label = this.get(key);
      if (label) {
        return label;
      }
    }
    return lang.toUpperCase();
  }
}

export const localizationProvider = new LocalizationProvider();
/**
 * In the userscript build, SystemJS wrapping allowed a top-level await.
 * For the extension build we bootstrap through loader scripts and keep the
 * runtime initialization explicit, so avoid top-level await and expose a lazy
 * ready Promise instead.
 */
let localizationProviderReadyPromise: Promise<LocalizationProvider> | null =
  null;

export function ensureLocalizationProviderReady(): Promise<LocalizationProvider> {
  localizationProviderReadyPromise ??= localizationProvider.init();
  return localizationProviderReadyPromise;
}
