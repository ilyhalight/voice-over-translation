import rawDefaultLocale from "./locales/en.json";

import debug from "../utils/debug";
import { contentUrl } from "../config/config.js";
import { votStorage } from "../utils/storage";
import { getTimestamp, GM_fetch, lang, toFlatObj } from "../utils/utils.js";
import { LocaleStorageKey } from "../types/storage";
import { FlatPhrases, Locale, Phrase } from "../types/localization";

export type LangOverride = "auto" | Locale;

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
  localizationUrl = `${contentUrl}/${REPO_BRANCH}/src/localization`;

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

  getAvailableLangs() {
    return AVAILABLE_LOCALES;
  }

  async reset() {
    for (const key of this.storageKeys) {
      await votStorage.delete(key);
    }

    return this;
  }

  private buildUrl(path: string, force = false) {
    const query = force ? `?timestamp=${getTimestamp()}` : "";
    return `${this.localizationUrl}${path}${query}`;
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
      const res = await GM_fetch(this.buildUrl("/hashes.json", force));
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
        this.buildUrl(`/locales/${this.lang}.json`, force),
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
}

export const localizationProvider = new LocalizationProvider();
await localizationProvider.init();
