import { actualCompatVersion } from "../config/config";
import {
  type CompatibilityVersion,
  type StorageKey,
  storageKeys,
} from "../types/storage";
import debug from "./debug";
import { isGM4Supported } from "./gm";

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

async function migrateAugust2026(
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const enabledDontTranslateLanguages = await votStorage.getRaw<unknown>(
    "enabledDontTranslateLanguages",
  );

  const storedLanguages = Array.isArray(data.dontTranslateLanguages)
    ? data.dontTranslateLanguages
    : [];

  const dontTranslateLanguages =
    enabledDontTranslateLanguages === false ? [] : storedLanguages;

  if (enabledDontTranslateLanguages === false) {
    await votStorage.set("dontTranslateLanguages", dontTranslateLanguages);
  }

  await votStorage.deleteRaw("enabledDontTranslateLanguages");

  const migratedData = {
    ...data,
    dontTranslateLanguages,
  };

  return migratedData;
}

export async function updateConfig<T>(
  data: Record<string, unknown>,
): Promise<T> {
  const sourceVersion = data.compatVersion as CompatibilityVersion;
  if (sourceVersion === actualCompatVersion) {
    return data as T;
  }

  let migratedData = data;
  if (sourceVersion === "" || sourceVersion === "2025-05-09") {
    migratedData = await migrateAugust2026(migratedData);
  }

  return {
    ...migratedData,
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
      promiseGet: isGM4Supported && typeof gm?.getValue === "function",
      promiseGetValues: isGM4Supported && typeof gm?.getValues === "function",
      promiseSet: isGM4Supported && typeof gm?.setValue === "function",
      promiseDelete: isGM4Supported && typeof gm?.deleteValue === "function",
      promiseList: isGM4Supported && typeof gm?.listValues === "function",
      promiseAddValueChangeListener:
        isGM4Supported && typeof gm?.addValueChangeListener === "function",
      promiseRemoveValueChangeListener:
        isGM4Supported && typeof gm?.removeValueChangeListener === "function",
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
