import { contentUrl } from "../config/config";
import type { FlatPhrases, Locale, Phrase } from "../types/localization";
import type { LocaleStorageKey } from "../types/storage";
import debug from "../utils/debug";
import { GM_fetch } from "../utils/gm";
import { lang } from "../utils/localization";
import { votStorage } from "../utils/storage";
import { getTimestamp, toFlatObj } from "../utils/utils";
import rawDefaultLocale from "./locales/en.json";

export type LangOverride = "auto" | Locale;

const repoBranch =
  typeof REPO_BRANCH !== "undefined" && REPO_BRANCH ? REPO_BRANCH : "master";
const availableLocales =
  typeof AVAILABLE_LOCALES !== "undefined" && Array.isArray(AVAILABLE_LOCALES)
    ? AVAILABLE_LOCALES
    : ["en"];

class LocalizationProvider {
  storageKeys: LocaleStorageKey[] = [
    "localePhrases",
    "localeLang",
    "localeHash",
    "localeUpdatedAt",
    "localeLangOverride",
  ];
  /**
   * Language used before page was reloaded
   */
  lang: string;
  /**
   * Locale phrases with current language
   */
  locale: Partial<FlatPhrases>;
  defaultLocale: FlatPhrases = toFlatObj(rawDefaultLocale);

  cacheTTL = 7200;
  localesUrl = `${contentUrl}/${repoBranch}/src/localization/locales`;
  hashesUrl = `${contentUrl}/${repoBranch}/src/localization/hashes.json`;

  _langOverride: LangOverride = "auto";

  constructor() {
    this.lang = this.getLang();
    this.locale = {};
  }

  async init() {
    this._langOverride = await votStorage.get<LangOverride>(
      "localeLangOverride",
      "auto",
    );
    this.lang = this.getLang();
    const phrases = await votStorage.get<string>("localePhrases", "");
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
    // Older extension builds injected AVAILABLE_LOCALES without the `auto`
    // option. Ensure it is always present so Settings → Language can restore
    // automatic detection.
    return availableLocales.includes("auto")
      ? (availableLocales as LangOverride[])
      : (["auto", ...availableLocales] as LangOverride[]);
  }

  async reset() {
    for (const key of this.storageKeys) {
      await votStorage.delete(key);
    }

    return this;
  }

  private buildUrl(baseUrl: string, path: string, force = false) {
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

  async checkUpdates(force = false) {
    debug.log("Check locale updates...");
    try {
      const res = await GM_fetch(this.buildUrl(this.hashesUrl, "", force));
      if (!res.ok) throw res.status;
      const hashes = await res.json();
      return (await votStorage.get("localeHash")) !== hashes[this.lang]
        ? hashes[this.lang]
        : false;
    } catch (err) {
      console.error(
        "[VOT] [localizationProvider] Failed to get locales hash:",
        err,
      );
      return false;
    }
  }

  async update(force = false) {
    const localeUpdatedAt = await votStorage.get<number>("localeUpdatedAt", 0);
    if (
      !force &&
      localeUpdatedAt + this.cacheTTL > getTimestamp() &&
      (await votStorage.get("localeLang")) === this.lang
    ) {
      return this;
    }

    const hash = await this.checkUpdates(force);
    await votStorage.set("localeUpdatedAt", getTimestamp());
    if (!hash) {
      return this;
    }

    debug.log("Updating locale...");
    try {
      const res = await GM_fetch(
        this.buildUrl(this.localesUrl, `/${this.lang}.json`, force),
      );
      if (!res.ok) throw res.status;
      // We use it .text() in order for there to be a single logic for GM_Storage and localStorage
      const text = await res.text();
      await votStorage.set("localePhrases", text);
      await votStorage.set("localeHash", hash);
      await votStorage.set("localeLang", this.lang);
      this.setLocaleFromJsonString(text);
    } catch (err) {
      console.error("[VOT] [localizationProvider] Failed to get locale:", err);
      this.setLocaleFromJsonString(await votStorage.get("localePhrases", ""));
    }
    return this;
  }

  setLocaleFromJsonString(json: string) {
    try {
      const locale = JSON.parse(json) || {};
      this.locale = toFlatObj(locale);
    } catch (err) {
      console.error("[VOT] [localizationProvider]", err);
      this.locale = {};
    }
    return this;
  }

  getFromLocale(locale: Partial<FlatPhrases>, key: Phrase) {
    return locale?.[key] ?? this.warnMissingKey(locale, key);
  }

  warnMissingKey(locale: Partial<FlatPhrases>, key: Phrase) {
    console.warn(
      "[VOT] [localizationProvider] locale",
      locale,
      "doesn't contain key",
      key,
    );
    return undefined;
  }

  getDefault(key: Phrase) {
    return this.getFromLocale(this.defaultLocale, key) ?? key;
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
    return typeof lang === "string" ? lang.toUpperCase() : "";
  }
}

export const localizationProvider = new LocalizationProvider();
/**
 * In the userscript build, SystemJS wrapping allowed a top-level await.
 * For the extension build we emit classic scripts (IIFE), so we must avoid
 * top-level await and instead expose an explicit lazy ready Promise.
 */
let localizationProviderReadyPromise: Promise<LocalizationProvider> | null =
  null;

export function ensureLocalizationProviderReady(): Promise<LocalizationProvider> {
  localizationProviderReadyPromise ??= localizationProvider.init();
  return localizationProviderReadyPromise;
}
