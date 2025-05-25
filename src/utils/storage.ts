import { KeysOrDefaultValue } from "@toil/gm-types/types/utils";

import debug from "./debug";
import {
  CompatibilityVersion,
  ConvertCategory,
  ConvertData,
  StorageData,
  StorageKey,
  storageKeys,
} from "../types/storage";
import { isSupportGM4 } from "./gm";
import { actualCompatVersion } from "../config/config";
import { localizationProvider } from "../localization/localizationProvider";

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

export async function updateConfig(data: Record<string, unknown>) {
  if ((data.compatVersion as CompatibilityVersion) === actualCompatVersion) {
    return data;
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

    newData[newKey] = newValue as any;
    if (existsOldData[key] !== undefined) {
      // remove old key
      await votStorage.delete(key as StorageKey);
    }

    if (newKey === "localeLangOverride") {
      // by default data doesn't have localeLangOverride
      await localizationProvider.changeLang(value);
    }

    await votStorage.set<any>(newKey, newValue);
  }

  return {
    ...newData,
    compatVersion: "2025-05-09",
  };
}

export const votStorage = new (class {
  supportGM: boolean;
  supportGMPromises: boolean;
  supportGMGetValues: boolean;

  constructor() {
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
  isSupportOnlyLS() {
    return !this.supportGM && !this.supportGMPromises;
  }

  private syncGet<T = unknown>(name: StorageKey, def?: unknown): T {
    if (this.supportGM) {
      return GM_getValue<T>(name, def);
    }

    let val = window.localStorage.getItem(name);
    if (!val) {
      return def as T;
    }

    try {
      return JSON.parse(val);
    } catch {
      return def as T;
    }
  }

  async get<T = unknown>(name: StorageKey, def?: unknown) {
    if (this.supportGMPromises) {
      return await GM.getValue<T>(name, def);
    }

    return Promise.resolve(this.syncGet<T>(name, def));
  }

  async getValues<
    T extends Record<StorageKey, KeysOrDefaultValue> = Record<
      StorageKey,
      KeysOrDefaultValue
    >,
  >(data: T): Promise<T> {
    if (this.supportGMGetValues) {
      return await GM.getValues<T>(data);
    }

    return Object.fromEntries(
      await Promise.all(
        Object.entries(data as Record<StorageKey, KeysOrDefaultValue>).map(
          async ([key, value]) => {
            const val = await this.get<T[keyof T]>(key as StorageKey, value);
            return [key, val];
          },
        ),
      ),
    );
  }

  private syncSet<T extends KeysOrDefaultValue = undefined>(
    name: StorageKey,
    value: T,
  ) {
    if (this.supportGM) {
      return GM_setValue<T>(name, value);
    }

    return window.localStorage.setItem(name, JSON.stringify(value));
  }

  async set<T extends KeysOrDefaultValue = undefined>(
    name: StorageKey,
    value: T,
  ) {
    if (this.supportGMPromises) {
      return await GM.setValue<T>(name, value);
    }

    return Promise.resolve(this.syncSet<T>(name, value));
  }

  private syncDelete(name: StorageKey) {
    if (this.supportGM) {
      return GM_deleteValue(name);
    }

    return window.localStorage.removeItem(name);
  }

  async delete(name: StorageKey) {
    if (this.supportGMPromises) {
      return await GM.deleteValue(name);
    }

    return Promise.resolve(this.syncDelete(name));
  }

  private syncList(): readonly StorageKey[] {
    if (this.supportGM) {
      return GM_listValues<StorageKey>();
    }

    return storageKeys;
  }

  async list() {
    if (this.supportGMPromises) {
      return await GM.listValues<StorageKey>();
    }

    return Promise.resolve(this.syncList());
  }
})();
