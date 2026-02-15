// Minimal "GM storage" value union. We intentionally keep this wide because
// userscript managers store arbitrary JSON-like values.
type KeysOrDefaultValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, unknown>
  | unknown[];

import { actualCompatVersion } from "../config/config";
import {
  type CompatibilityVersion,
  type ConvertCategory,
  type ConvertData,
  type StorageData,
  type StorageKey,
  storageKeys,
} from "../types/storage";
import debug from "./debug";
import { isSupportGM4 } from "./gm";

const compatMay2025Data = {
  numToBool: [
    ["autoTranslate"],
    ["dontTranslateYourLang", "enabledDontTranslateLanguages"],
    ["autoSetVolumeYandexStyle", "enabledAutoVolume"],
    ["showVideoSlider"],
    ["syncVolume"],
    ["downloadWithName"],
    ["sendNotifyOnComplete"],
    ["highlightWords"],
    ["onlyBypassMediaCSP"],
    ["newAudioPlayer"],
    ["showPiPButton"],
    ["translateAPIErrors"],
    ["audioBooster"],
    ["useNewModel", "useLivelyVoice"],
  ],
  number: [["autoVolume"]],
  array: [["dontTranslateLanguage", "dontTranslateLanguages"]],
  string: [
    ["hotkeyButton", "translationHotkey"],
    ["locale-lang-override", "localeLangOverride"],
    ["locale-lang", "localeLang"],
  ],
} as const satisfies ConvertData;

function getCompatCategory(
  key: string,
  value: unknown,
  convertData?: ConvertData,
) {
  if (typeof value === "number") {
    return convertData?.number.some((item) => item[0] === key)
      ? "number"
      : "numToBool";
  } else if (Array.isArray(value)) {
    return "array";
  } else if (typeof value === "string" || value === null) {
    return "string";
  }

  return undefined;
}

function convertByCompatCategory(category: ConvertCategory, value: unknown) {
  if (["string", "array", "number"].includes(category)) {
    return value;
  }

  return !!value;
}

type AnyDataKeys = Record<string, undefined>;

export async function updateConfig<T>(
  data: Record<string, unknown>,
): Promise<T> {
  if ((data.compatVersion as CompatibilityVersion) === actualCompatVersion) {
    return data as T;
  }

  const oldKeys = Object.values(compatMay2025Data)
    .flat()
    .reduce<AnyDataKeys>((result, key) => {
      if (key[1]) {
        result[key[0]] = undefined;
      }

      return result;
    }, {});
  const oldData = await votStorage.getValues<Record<string, any>>(oldKeys);
  const existsOldData = Object.fromEntries(
    Object.entries(oldData).filter(([_, value]) => value !== undefined),
  );
  const allData = { ...data, ...existsOldData };
  const allDataKeys = Object.keys(allData).reduce<AnyDataKeys>(
    (result, key) => {
      result[key] = undefined;
      return result;
    },
    {},
  );
  const realValues =
    await votStorage.getValues<Record<string, any>>(allDataKeys);
  const newData: Partial<StorageData> = data;
  for (const [key, value] of Object.entries(allData)) {
    const category = getCompatCategory(key, value, compatMay2025Data);
    if (!category) {
      continue;
    }

    const compatItem = compatMay2025Data[category].find(
      (item) => item[0] === key,
    );
    if (!compatItem) {
      continue;
    }

    const newKey = (compatItem[1] ?? key) as StorageKey;
    if (realValues[key] === undefined) {
      // skip auto values
      continue;
    }

    let newValue = convertByCompatCategory(category, value);
    if (key === "autoVolume" && (value as number) < 1) {
      newValue = Math.round((value as number) * 100);
    }

    // `newKey` is runtime-validated by `convertData`. TS can lose the literal
    // key union and infer the indexed access as `never`.
    (newData as any)[newKey] = newValue as any;
    if (existsOldData[key] !== undefined) {
      // remove old key
      await votStorage.delete(key as StorageKey);
    }

    // Note: we intentionally don't call localizationProvider.changeLang(...) here.
    // The extension build bundles as a classic script (IIFE) and must avoid
    // localization<->storage runtime cycles. Localization is initialized later
    // (see ensureLocalizationProviderReady() in index.ts) and will read the persisted
    // override on startup.

    await votStorage.set<any>(newKey, newValue);
  }

  return {
    ...newData,
    compatVersion: actualCompatVersion,
  } as T;
}

class VOTStorage {
  supportGM = false;
  supportGMPromises = false;
  supportGMGetValues = false;
  supportResolved = false;

  private resolveSupport(): void {
    if (this.supportResolved) return;
    this.supportResolved = true;

    this.supportGM = typeof GM_getValue === "function";
    this.supportGMPromises = isSupportGM4 && typeof GM?.getValue === "function";
    this.supportGMGetValues =
      isSupportGM4 && typeof GM?.getValues === "function";

    debug.log(
      `[VOT Storage] GM Promises: ${this.supportGMPromises} | GM: ${this.supportGM}`,
    );
  }

  /**
   * Check if storage type is LocalStorage
   */
  get isSupportOnlyLS() {
    this.resolveSupport();
    return !this.supportGM && !this.supportGMPromises;
  }

  private syncGet<T = unknown>(name: StorageKey, def?: T): T {
    this.resolveSupport();
    if (this.supportGM) {
      return GM_getValue<T>(name, def);
    }

    const val = globalThis.localStorage.getItem(name);
    if (!val) {
      return def as T;
    }

    try {
      return JSON.parse(val);
    } catch {
      return def as T;
    }
  }

  async get<T = unknown>(name: StorageKey, def?: T) {
    this.resolveSupport();
    if (this.supportGMPromises) {
      return await GM.getValue<T>(name, def);
    }

    return this.syncGet<T>(name, def);
  }

  async getValues<
    T extends Partial<Record<StorageKey, KeysOrDefaultValue>> = Record<
      StorageKey,
      KeysOrDefaultValue
    >,
  >(data: T): Promise<T> {
    this.resolveSupport();
    if (this.supportGMGetValues) {
      return await GM.getValues<T>(data);
    }

    return Object.fromEntries(
      await Promise.all(
        Object.entries(data as Record<StorageKey, KeysOrDefaultValue>).map(
          async ([key, value]) => {
            const val = await this.get<T[keyof T]>(
              key as StorageKey,
              value as unknown as T[keyof T],
            );
            return [key, val] as const;
          },
        ),
      ),
    ) as unknown as T;
  }

  private syncSet<T extends KeysOrDefaultValue = undefined>(
    name: StorageKey,
    value: T,
  ) {
    this.resolveSupport();
    if (this.supportGM) {
      return GM_setValue<T>(name, value);
    }

    return globalThis.localStorage.setItem(name, JSON.stringify(value));
  }

  async set<T extends KeysOrDefaultValue = undefined>(
    name: StorageKey,
    value: T,
  ) {
    this.resolveSupport();
    if (this.supportGMPromises) {
      return await GM.setValue<T>(name, value);
    }

    return this.syncSet<T>(name, value);
  }

  private syncDelete(name: StorageKey) {
    this.resolveSupport();
    if (this.supportGM) {
      return GM_deleteValue(name);
    }

    return globalThis.localStorage.removeItem(name);
  }

  async delete(name: StorageKey) {
    this.resolveSupport();
    if (this.supportGMPromises) {
      return await GM.deleteValue(name);
    }

    return this.syncDelete(name);
  }

  private syncList(): readonly StorageKey[] {
    this.resolveSupport();
    if (this.supportGM) {
      return GM_listValues<StorageKey>();
    }

    return storageKeys;
  }

  async list() {
    this.resolveSupport();
    if (this.supportGMPromises) {
      return await GM.listValues<StorageKey>();
    }

    return this.syncList();
  }
}

const VOT_STORAGE_GLOBAL_KEY = "__VOT_STORAGE_SINGLETON__";

export const votStorage: VOTStorage = (() => {
  const scope = globalThis as Record<string, unknown>;
  const existing = scope[VOT_STORAGE_GLOBAL_KEY];
  if (existing instanceof VOTStorage) {
    return existing;
  }

  const created = new VOTStorage();
  scope[VOT_STORAGE_GLOBAL_KEY] = created;
  return created;
})();
