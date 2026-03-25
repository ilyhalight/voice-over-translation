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

type StorageValueChangeListener<T = unknown> = (
  key: string,
  oldValue: T | undefined,
  newValue: T | undefined,
  remote: boolean,
) => void;

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

type CompatRule = Readonly<{
  category: ConvertCategory;
  oldKey: string;
  newKey: StorageKey;
  shouldDeleteOldKey: boolean;
}>;

const compatRules = (
  Object.entries(compatMay2025Data) as [
    ConvertCategory,
    readonly (readonly [string, string?])[],
  ][]
).flatMap<CompatRule>(([category, entries]) =>
  entries.map(([oldKey, maybeNewKey]) => ({
    category,
    oldKey,
    newKey: (maybeNewKey ?? oldKey) as StorageKey,
    shouldDeleteOldKey: Boolean(maybeNewKey),
  })),
);

const compatRuleByOldKey = new Map<string, CompatRule>(
  compatRules.map((rule) => [rule.oldKey, rule]),
);

const compatKeysToRead = Array.from(
  new Set<string>(compatRules.map((rule) => rule.oldKey)),
);

function createUndefinedDefaults(
  keys: Iterable<string>,
): Record<string, undefined> {
  const defaults: Record<string, undefined> = {};
  for (const key of keys) {
    defaults[key] = undefined;
  }

  return defaults;
}

function isCompatValue(category: ConvertCategory, value: unknown) {
  switch (category) {
    case "numToBool":
    case "number":
      return typeof value === "number";
    case "array":
      return Array.isArray(value);
    case "string":
      return typeof value === "string" || value === null;
    default:
      return false;
  }
}

function convertByCompatCategory(category: ConvertCategory, value: unknown) {
  switch (category) {
    case "string":
    case "array":
    case "number":
      return value;
    default:
      return !!value;
  }
}

function normalizeCompatValue(
  rule: CompatRule,
  value: unknown,
): KeysOrDefaultValue {
  let convertedValue = convertByCompatCategory(rule.category, value);

  if (rule.oldKey === "autoVolume" && typeof value === "number" && value < 1) {
    convertedValue = Math.round(value * 100);
  }

  return convertedValue as KeysOrDefaultValue;
}

function areStorageValuesEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length &&
      a.every((item, index) => Object.is(item, b[index]))
    );
  }

  return Object.is(a, b);
}

function parseStoredValue(rawValue: string | null): unknown {
  if (rawValue === null) {
    return undefined;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return undefined;
  }
}

export async function updateConfig<T>(
  data: Record<string, unknown>,
): Promise<T> {
  if ((data.compatVersion as CompatibilityVersion) === actualCompatVersion) {
    return data as T;
  }

  const keysToRead = new Set<string>([
    ...Object.keys(data),
    ...compatKeysToRead,
  ]);
  const persistedValues = await votStorage.getValues<
    Record<string, KeysOrDefaultValue>
  >(createUndefinedDefaults(keysToRead));

  const newData: Partial<StorageData> = { ...(data as Partial<StorageData>) };
  const writeOperations: Promise<unknown>[] = [];
  const deleteOperations: Promise<unknown>[] = [];

  for (const [key, storedValue] of Object.entries(persistedValues)) {
    if (storedValue === undefined) {
      continue;
    }

    const compatRule = compatRuleByOldKey.get(key);
    if (!compatRule || !isCompatValue(compatRule.category, storedValue)) {
      continue;
    }

    const convertedValue = normalizeCompatValue(compatRule, storedValue);
    (newData as Record<string, unknown>)[compatRule.newKey] = convertedValue;

    const existingNewValue = persistedValues[compatRule.newKey];
    if (
      compatRule.shouldDeleteOldKey ||
      !areStorageValuesEqual(existingNewValue, convertedValue)
    ) {
      writeOperations.push(votStorage.set(compatRule.newKey, convertedValue));
    }

    if (compatRule.shouldDeleteOldKey) {
      deleteOperations.push(votStorage.delete(compatRule.oldKey as StorageKey));
    }
  }

  await Promise.all([...writeOperations, ...deleteOperations]);

  return {
    ...newData,
    compatVersion: actualCompatVersion,
  } as T;
}

type StorageSupport = Readonly<{
  legacyGet: boolean;
  legacySet: boolean;
  legacyDelete: boolean;
  legacyList: boolean;
  legacyAddValueChangeListener: boolean;
  legacyRemoveValueChangeListener: boolean;
  promiseGet: boolean;
  promiseGetValues: boolean;
  promiseSet: boolean;
  promiseDelete: boolean;
  promiseList: boolean;
  promiseAddValueChangeListener: boolean;
  promiseRemoveValueChangeListener: boolean;
}>;

class VOTStorage {
  private support: StorageSupport | null = null;
  private readonly localStorageListeners = new Map<
    StorageKey,
    Set<StorageValueChangeListener<unknown>>
  >();

  private shouldUseSyntheticListeners(support: StorageSupport): boolean {
    return (
      !support.promiseAddValueChangeListener &&
      !support.legacyAddValueChangeListener
    );
  }

  private getGMRuntime(): Record<string, unknown> | undefined {
    if (typeof GM !== "undefined") {
      return GM as unknown as Record<string, unknown>;
    }

    return (globalThis as { GM?: Record<string, unknown> }).GM;
  }

  private resolveSupport(): StorageSupport {
    if (this.support) {
      return this.support;
    }

    const gm = this.getGMRuntime();
    const support: StorageSupport = {
      legacyGet: typeof GM_getValue === "function",
      legacySet: typeof GM_setValue === "function",
      legacyDelete: typeof GM_deleteValue === "function",
      legacyList: typeof GM_listValues === "function",
      legacyAddValueChangeListener:
        typeof (
          globalThis as {
            GM_addValueChangeListener?: unknown;
          }
        ).GM_addValueChangeListener === "function",
      legacyRemoveValueChangeListener:
        typeof (
          globalThis as {
            GM_removeValueChangeListener?: unknown;
          }
        ).GM_removeValueChangeListener === "function",
      promiseGet: isSupportGM4 && typeof gm?.getValue === "function",
      promiseGetValues: isSupportGM4 && typeof gm?.getValues === "function",
      promiseSet: isSupportGM4 && typeof gm?.setValue === "function",
      promiseDelete: isSupportGM4 && typeof gm?.deleteValue === "function",
      promiseList: isSupportGM4 && typeof gm?.listValues === "function",
      promiseAddValueChangeListener:
        isSupportGM4 && typeof gm?.addValueChangeListener === "function",
      promiseRemoveValueChangeListener:
        isSupportGM4 && typeof gm?.removeValueChangeListener === "function",
    };
    this.support = support;

    debug.log(
      `[VOT Storage] GM Promises: ${support.promiseGet} | GM legacy: ${support.legacyGet}`,
    );

    return support;
  }

  /**
   * Check if storage type is LocalStorage
   */
  get isSupportOnlyLS() {
    const support = this.resolveSupport();
    return (
      !support.legacyGet &&
      !support.legacySet &&
      !support.legacyDelete &&
      !support.legacyList &&
      !support.promiseGet &&
      !support.promiseGetValues &&
      !support.promiseSet &&
      !support.promiseDelete &&
      !support.promiseList
    );
  }

  private syncGetByName<T = unknown>(
    name: string,
    def: T | undefined,
    support: StorageSupport,
  ): T {
    if (support.legacyGet) {
      return GM_getValue<T>(name, def);
    }

    const val = globalThis.localStorage.getItem(name);
    if (val === null) {
      return def;
    }

    try {
      return JSON.parse(val);
    } catch {
      return def;
    }
  }

  async getRaw<T = unknown>(name: string, def?: T): Promise<T> {
    const support = this.resolveSupport();
    if (support.promiseGet && GM.getValue) {
      return await GM.getValue(name, def);
    }

    return this.syncGetByName<T>(name, def, support);
  }

  async get<T = unknown>(name: StorageKey, def?: T): Promise<T> {
    return this.getRaw<T>(name, def);
  }

  async getValues<
    T extends Record<string, KeysOrDefaultValue> = Record<
      StorageKey,
      KeysOrDefaultValue
    >,
  >(data: T): Promise<T> {
    const support = this.resolveSupport();
    if (support.promiseGetValues && GM.getValues) {
      return await GM.getValues(data);
    }

    const entries = Object.entries(data as Record<string, KeysOrDefaultValue>);

    if (support.promiseGet && GM.getValue) {
      const values = await Promise.all(
        entries.map(async ([key, value]) => {
          const storedValue = await GM.getValue(key, value);
          return [key, storedValue] as const;
        }),
      );
      return Object.fromEntries(values) as T;
    }

    return Object.fromEntries(
      entries.map(([key, value]) => [
        key,
        this.syncGetByName(key, value, support),
      ]),
    ) as T;
  }

  private syncSetByName(
    name: string,
    value: KeysOrDefaultValue,
    support: StorageSupport,
  ) {
    if (support.legacySet) {
      return GM_setValue(name, value);
    }

    return globalThis.localStorage.setItem(name, JSON.stringify(value));
  }

  async setRaw<T extends KeysOrDefaultValue = undefined>(
    name: string,
    value: T,
  ): Promise<void> {
    const support = this.resolveSupport();
    const storageKey = name as StorageKey;
    const shouldNotify = this.shouldUseSyntheticListeners(support);
    const oldValue = shouldNotify
      ? await this.getRaw<T | undefined>(name)
      : undefined;

    if (support.promiseSet && GM.setValue) {
      await GM.setValue(name, value);
      if (shouldNotify) {
        this.notifyLocalStorageListeners(storageKey, oldValue, value, false);
      }
      return;
    }
    const setResult = this.syncSetByName(name, value, support);
    this.notifyLocalStorageListeners(storageKey, oldValue, value, false);
    return setResult;
  }

  async set<T extends KeysOrDefaultValue = undefined>(
    name: StorageKey,
    value: T,
  ): Promise<void> {
    return this.setRaw(name, value);
  }

  private syncDeleteByName(name: string, support: StorageSupport) {
    if (support.legacyDelete) {
      return GM_deleteValue(name);
    }

    return globalThis.localStorage.removeItem(name);
  }

  async deleteRaw(name: string): Promise<void> {
    const support = this.resolveSupport();
    const storageKey = name as StorageKey;
    const shouldNotify = this.shouldUseSyntheticListeners(support);
    const oldValue = shouldNotify ? await this.getRaw(name) : undefined;

    if (support.promiseDelete && GM.deleteValue) {
      await GM.deleteValue(name);
      if (shouldNotify) {
        this.notifyLocalStorageListeners(
          storageKey,
          oldValue,
          undefined,
          false,
        );
      }
      return;
    }
    const deleteResult = this.syncDeleteByName(name, support);
    this.notifyLocalStorageListeners(storageKey, oldValue, undefined, false);
    return deleteResult;
  }

  async delete(name: StorageKey): Promise<void> {
    return this.deleteRaw(name);
  }

  addValueChangeListener<T = unknown>(
    name: StorageKey,
    listener: StorageValueChangeListener<T>,
  ): () => void {
    const support = this.resolveSupport();
    const gm = this.getGMRuntime();

    if (support.promiseAddValueChangeListener) {
      const addListener = gm?.addValueChangeListener as
        | ((
            key: string,
            callback: StorageValueChangeListener<unknown>,
          ) => unknown)
        | undefined;
      const removeListener = support.promiseRemoveValueChangeListener
        ? (gm?.removeValueChangeListener as
            | ((id: unknown) => unknown)
            | undefined)
        : undefined;

      if (typeof addListener === "function") {
        const gmListener = this.createTypedListener(listener);
        const listenerId = addListener(name, gmListener);
        return () => {
          if (typeof removeListener === "function") {
            removeListener(listenerId);
          }
        };
      }
    }

    if (support.legacyAddValueChangeListener) {
      const addListener = (
        globalThis as unknown as {
          GM_addValueChangeListener?: (
            key: string,
            callback: StorageValueChangeListener<unknown>,
          ) => unknown;
        }
      ).GM_addValueChangeListener;
      const removeListener = support.legacyRemoveValueChangeListener
        ? (
            globalThis as {
              GM_removeValueChangeListener?: (id: unknown) => unknown;
            }
          ).GM_removeValueChangeListener
        : undefined;

      if (typeof addListener === "function") {
        const gmListener = this.createTypedListener(listener);
        const listenerId = addListener(name, gmListener);
        return () => {
          if (typeof removeListener === "function") {
            removeListener(listenerId);
          }
        };
      }
    }

    const listeners = this.getLocalStorageListeners(name);
    const typedListener = listener as StorageValueChangeListener<unknown>;
    listeners.add(typedListener);

    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== globalThis.localStorage || event.key !== name) {
        return;
      }

      typedListener(
        name,
        parseStoredValue(event.oldValue),
        parseStoredValue(event.newValue),
        true,
      );
    };

    globalThis.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(typedListener);
      if (listeners.size === 0) {
        this.localStorageListeners.delete(name);
      }
      globalThis.removeEventListener("storage", onStorage);
    };
  }

  private createTypedListener<T>(
    listener: StorageValueChangeListener<T>,
  ): StorageValueChangeListener<unknown> {
    return (key, oldValue, newValue, remote) => {
      listener(
        key,
        oldValue as T | undefined,
        newValue as T | undefined,
        remote,
      );
    };
  }

  private getLocalStorageListeners(name: StorageKey) {
    const existing = this.localStorageListeners.get(name);
    if (existing) {
      return existing;
    }

    const created = new Set<StorageValueChangeListener<unknown>>();
    this.localStorageListeners.set(name, created);
    return created;
  }

  private notifyLocalStorageListeners(
    name: StorageKey,
    oldValue: unknown,
    newValue: unknown,
    remote: boolean,
  ): void {
    const listeners = this.localStorageListeners.get(name);
    if (!listeners || listeners.size === 0) {
      return;
    }

    for (const listener of listeners) {
      listener(name, oldValue, newValue, remote);
    }
  }

  private syncList(support: StorageSupport): readonly StorageKey[] {
    if (support.legacyList) {
      return GM_listValues<StorageKey>();
    }

    return storageKeys;
  }

  async list(): Promise<readonly StorageKey[]> {
    const support = this.resolveSupport();
    if (support.promiseList && GM.listValues) {
      return await GM.listValues<StorageKey>();
    }

    return this.syncList(support);
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
