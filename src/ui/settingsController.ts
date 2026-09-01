const SETTINGS_EVENT_KEYS: Array<keyof SettingsControllerEventMap> = [
  "click:bugReport",
  "click:resetSettings",
  "update:account",
  "change:autoTranslate",
  "change:autoSubtitles",
  "change:showVideoVolume",
  "change:audioBooster",
  "change:syncVolume",
  "change:subtitlesHighlightWords",
  "change:subtitlesSmartLayout",
  "select:responseLanguageSubtitles",
  "select:subtitlesFontFamily",
  "change:proxyWorkerHost",
  "change:useNewAudioPlayer",
  "change:onlyBypassMediaCSP",
  "change:showPiPButton",
  "input:subtitlesMaxLength",
  "input:subtitlesFontSize",
  "input:subtitlesBackgroundOpacity",
  "input:autoHideButtonDelay",
  "select:proxyTranslationStatus",
  "select:translationTextService",
  "select:menuLanguage",
];
function createSettingsEvents(): {
  [K in keyof SettingsControllerEventMap]: EventImpl<
    SettingsControllerEventMap[K]
  >;
} {
  const events = {} as {
    [K in keyof SettingsControllerEventMap]: EventImpl<
      SettingsControllerEventMap[K]
    >;
  };
  for (const key of SETTINGS_EVENT_KEYS) {
    (events as Record<string, EventImpl<unknown[]>>)[key] = new EventImpl<
      unknown[]
    >();
  }
  return events;
}

import { type Accessor, createSignal, type Setter } from "solid-js";
import { SettingsDialog } from "../components/Settings/SettingsDialog";
import { PROXY_WORKER_HOST } from "../config/config";
import { isAuthRefreshMessage } from "../core/authRefreshMessage";
import { openAuthWindow } from "../core/authWindow";
import {
  type LangOverride,
  localizationProvider,
} from "../localization/localizationProvider";
import { account, resetAccount, updateAccount } from "../stores/account";
import { setLocale } from "../stores/locale";
import { setSettings } from "../stores/settings";
import type { SubtitleFormat } from "../subtitles/types";
import type { Position } from "../types/components/votButton";
import type {
  Account,
  ResponseLanguageSubtitles,
  StorageData,
  TranslateProxyStatus,
} from "../types/storage";
import type { SubtitleFontFamily } from "../types/subtitles";
import type { TranslateService } from "../types/translateApis";
import debug from "../utils/debug";
import { EventImpl } from "../utils/eventImpl";
import { votStorage } from "../utils/storage";
import type { VideoHandler } from "../VideoHandler";
import { render } from "./solid/renderer";

type SettingsControllerProps = {
  globalPortal: HTMLElement;
  data?: Partial<StorageData>;
  videoHandler?: VideoHandler;
};

type SettingsControllerEventMap = {
  "click:bugReport": [];
  "click:resetSettings": [];
  "update:account": [account: Partial<Account> | undefined];
  "change:autoTranslate": [checked: boolean];
  "change:autoSubtitles": [checked: boolean];
  "change:showVideoVolume": [checked: boolean];
  "change:audioBooster": [checked: boolean];
  "change:syncVolume": [checked: boolean];
  "change:subtitlesHighlightWords": [checked: boolean];
  "change:subtitlesSmartLayout": [checked: boolean];
  "select:responseLanguageSubtitles": [item: ResponseLanguageSubtitles];
  "select:subtitlesFontFamily": [item: SubtitleFontFamily];
  "change:proxyWorkerHost": [value: string];
  "change:useNewAudioPlayer": [checked: boolean];
  "change:onlyBypassMediaCSP": [checked: boolean];
  "change:showPiPButton": [checked: boolean];
  "input:subtitlesMaxLength": [value: number];
  "input:subtitlesFontSize": [value: number];
  "input:subtitlesBackgroundOpacity": [value: number];
  "input:autoHideButtonDelay": [value: number];
  "select:proxyTranslationStatus": [item: TranslateProxyStatus];
  "select:translationTextService": [item: TranslateService];
  "select:menuLanguage": [item: LangOverride];
};

type BufferedNumericStorageKey =
  | "autoVolume"
  | "subtitlesMaxLength"
  | "subtitlesFontSize"
  | "subtitlesOpacity"
  | "autoHideButtonDelay";

export class SettingsController {
  private static readonly PERSIST_DELAY_MS = 250;
  globalPortal: HTMLElement;
  private initialized = false;
  private readonly data: Partial<StorageData>;
  private readonly videoHandler?: VideoHandler;
  private readonly events: {
    [K in keyof SettingsControllerEventMap]: EventImpl<
      SettingsControllerEventMap[K]
    >;
  } = createSettingsEvents();
  private persistTimerIds: Partial<
    Record<BufferedNumericStorageKey, ReturnType<typeof setTimeout>>
  > = {};
  private readonly onAuthRefreshMessage = (event: MessageEvent<unknown>) => {
    if (!isAuthRefreshMessage(event.data)) {
      return;
    }

    void this.refreshAccountFromStorage();
  };
  root?: HTMLElement;
  private disposeSettingsDialog?: () => void;
  private dialogOpen?: Accessor<boolean>;
  private setDialogOpen?: Setter<boolean>;
  private accountStorageListenerCleanup?: () => void;
  constructor({
    globalPortal,
    data = {},
    videoHandler,
  }: SettingsControllerProps) {
    this.globalPortal = globalPortal;
    this.data = data;
    this.videoHandler = videoHandler;
  }
  isInitialized(): this is Required<SettingsController> {
    return this.initialized;
  }
  private scheduleStoragePersist(
    key: BufferedNumericStorageKey,
    value: number,
  ): void {
    const prevTimerId = this.persistTimerIds[key];
    if (prevTimerId !== undefined) {
      globalThis.clearTimeout(prevTimerId);
    }
    this.persistTimerIds[key] = globalThis.setTimeout(() => {
      this.persistTimerIds[key] = undefined;
      void votStorage.set(key, value);
    }, SettingsController.PERSIST_DELAY_MS);
  }
  private flushStoragePersists(): void {
    for (const key of Object.keys(this.persistTimerIds) as Array<
      keyof typeof this.persistTimerIds
    >) {
      const timerId = this.persistTimerIds[key];
      if (timerId === undefined) {
        continue;
      }
      globalThis.clearTimeout(timerId);
      this.persistTimerIds[key] = undefined;
      const value = this.data[key];
      if (typeof value === "number") {
        void votStorage.set(key, value);
      }
    }
  }
  private createPersistedSettingHandler<K extends keyof StorageData>({
    apply,
    storageKey,
    logLabel = storageKey,
    dispatch,
    afterPersist,
  }: {
    apply?: (value: StorageData[K]) => void;
    storageKey: K;
    logLabel?: string;
    dispatch?: (value: StorageData[K]) => void;
    afterPersist?: (value: StorageData[K]) => void | Promise<void>;
  }): (value: StorageData[K]) => void {
    return (value) => {
      this.data[storageKey] = value;
      apply?.(value);
      void (async () => {
        await votStorage.set(storageKey, value);
        debug.log(`${logLabel} value changed. New value:`, value);
        await afterPersist?.(value);
        dispatch?.(value);
      })().catch((error) => {
        debug.error(`Failed to persist ${storageKey}:`, error);
      });
    };
  }

  private createBufferedNumericInputHandler({
    storageKey,
    logLabel = storageKey,
    dispatch,
  }: {
    storageKey: BufferedNumericStorageKey;
    logLabel?: string;
    dispatch?: (value: number) => void;
  }): (value: number) => void {
    return (value) => {
      this.data[storageKey] = value;
      this.scheduleStoragePersist(storageKey, value);
      debug.log(`${logLabel} value changed. New value:`, value);
      dispatch?.(value);
    };
  }

  private bindAccountStorageListener(): void {
    this.accountStorageListenerCleanup?.();
    this.accountStorageListenerCleanup = votStorage.addValueChangeListener<
      Partial<Account>
    >("account", (_key, _oldValue, account) => {
      this.data.account = account ?? {};
      if (!this.isInitialized()) {
        return;
      }

      updateAccount(account);
      this.updateAccountInfo();
    });
  }

  private async refreshAccountFromStorage(): Promise<void> {
    if (votStorage.isSupportOnlyLS) {
      return;
    }

    this.data.account = await votStorage.get("account", {});
    if (!this.isInitialized()) {
      return;
    }

    updateAccount(this.data.account);
    this.updateAccountInfo();
  }

  initUI() {
    if (this.isInitialized()) {
      throw new Error("[VOT] SettingsController is already initialized");
    }
    this.disposeSettingsDialog = render(() => {
      const [isOpen, setIsOpen] = createSignal(false);
      this.dialogOpen = isOpen;
      this.setDialogOpen = setIsOpen;
      return SettingsDialog({
        ref: (element) => {
          this.root = element;
        },
        get isOpen() {
          return isOpen();
        },
        onClose: () => setIsOpen(false),
        account: {
          onClickLogin: async () => {
            debug.log("Account login button clicked");
            if (account.isLoggedIn) {
              await votStorage.delete("account");
              resetAccount();
              return this.updateAccountInfo();
            }

            openAuthWindow();
          },
        },
        translation: {
          isAudioContextSupported: this.videoHandler?.isAudioContextSupported,
          onAutoTranslateChange: this.createPersistedSettingHandler({
            storageKey: "autoTranslate",
            dispatch: (checked) =>
              this.events["change:autoTranslate"].dispatch(checked),
          }),
          onAutoSubtitlesChange: this.createPersistedSettingHandler({
            storageKey: "autoSubtitles",
            dispatch: (checked) =>
              this.events["change:autoSubtitles"].dispatch(checked),
          }),
          onDontTranslateLanguagesChange: this.createPersistedSettingHandler({
            storageKey: "dontTranslateLanguages",
          }),
          onEnabledAutoVolumeChange: this.createPersistedSettingHandler({
            storageKey: "enabledAutoVolume",
            afterPersist: () => this.videoHandler?.setupAudioSettings?.(),
          }),
          onAutoVolumeInput: this.createBufferedNumericInputHandler({
            storageKey: "autoVolume",
          }),
          onEnabledSmartDuckingChange: this.createPersistedSettingHandler({
            storageKey: "enabledSmartDucking",
            afterPersist: () => this.videoHandler?.setupAudioSettings?.(),
          }),
          onShowVideoSliderChange: this.createPersistedSettingHandler({
            storageKey: "showVideoSlider",
            dispatch: (checked) =>
              this.events["change:showVideoVolume"].dispatch(checked),
          }),
          onAudioBoosterChange: this.createPersistedSettingHandler({
            storageKey: "audioBooster",
            dispatch: (checked) =>
              this.events["change:audioBooster"].dispatch(checked),
          }),
          onSyncVolumeChange: this.createPersistedSettingHandler({
            storageKey: "syncVolume",
            dispatch: (checked) =>
              this.events["change:syncVolume"].dispatch(checked),
          }),
          onDownloadWithNameChange: this.createPersistedSettingHandler({
            storageKey: "downloadWithName",
          }),
          onSendNotifyOnCompleteChange: this.createPersistedSettingHandler({
            storageKey: "sendNotifyOnComplete",
          }),
          onUseAudioDownloadChange: this.createPersistedSettingHandler({
            storageKey: "useAudioDownload",
          }),
          onTranslationServiceSelect: this.createPersistedSettingHandler({
            storageKey: "translationService",
            dispatch: (item) =>
              this.events["select:translationTextService"].dispatch(item),
          }),
          onDetectServiceSelect: this.createPersistedSettingHandler({
            storageKey: "detectService",
          }),
        },
        hotkeys: {
          onTranslationHotkeyChange: this.createPersistedSettingHandler({
            storageKey: "translationHotkey",
          }),
          onSubtitlesHotkeyChange: this.createPersistedSettingHandler({
            storageKey: "subtitlesHotkey",
          }),
        },
        subtitles: {
          onResponseLanguageSubtitlesSelect: (option) =>
            this.createPersistedSettingHandler({
              storageKey: "responseLanguageSubtitles",
              dispatch: (item) =>
                this.events["select:responseLanguageSubtitles"].dispatch(item),
            })(option.value as ResponseLanguageSubtitles),
          onSubtitlesDownloadFormatSelect: (option) =>
            this.createPersistedSettingHandler({
              storageKey: "subtitlesDownloadFormat",
            })(option.value as SubtitleFormat),
          onSubtitlesFontFamilySelect: this.createPersistedSettingHandler({
            storageKey: "subtitlesFontFamily",
            dispatch: (item) =>
              this.events["select:subtitlesFontFamily"].dispatch(item),
          }),
          onHighlightWordsChange: this.createPersistedSettingHandler({
            storageKey: "highlightWords",
            dispatch: (checked) =>
              this.events["change:subtitlesHighlightWords"].dispatch(checked),
          }),
          onSubtitlesSmartLayoutChange: this.createPersistedSettingHandler({
            storageKey: "subtitlesSmartLayout",
            dispatch: (checked) =>
              this.events["change:subtitlesSmartLayout"].dispatch(checked),
          }),
          onSubtitlesMaxLengthInput: this.createBufferedNumericInputHandler({
            storageKey: "subtitlesMaxLength",
            dispatch: (value) =>
              this.events["input:subtitlesMaxLength"].dispatch(value),
          }),
          onSubtitlesFontSizeInput: this.createBufferedNumericInputHandler({
            storageKey: "subtitlesFontSize",
            dispatch: (value) =>
              this.events["input:subtitlesFontSize"].dispatch(value),
          }),
          onSubtitlesOpacityInput: this.createBufferedNumericInputHandler({
            storageKey: "subtitlesOpacity",
            dispatch: (value) =>
              this.events["input:subtitlesBackgroundOpacity"].dispatch(value),
          }),
        },
        proxy: {
          onProxyWorkerHostChange: async (value) => {
            this.data.proxyWorkerHost = value || PROXY_WORKER_HOST;
            setSettings("proxyWorkerHost", this.data.proxyWorkerHost);
            await votStorage.set("proxyWorkerHost", this.data.proxyWorkerHost);
            debug.log(
              "proxyWorkerHost value changed. New value:",
              this.data.proxyWorkerHost,
            );
            this.events["change:proxyWorkerHost"].dispatch(value);
          },
          onTranslateProxyStatusSelect: async (option) => {
            const value = option.value as TranslateProxyStatus;
            this.data.translateProxyEnabled = value;
            setSettings(
              "translateProxyEnabled",
              this.data.translateProxyEnabled,
            );
            await votStorage.set(
              "translateProxyEnabled",
              this.data.translateProxyEnabled,
            );
            await votStorage.set("translateProxyEnabledDefault", false);
            debug.log(
              "translateProxyEnabled value changed. New value:",
              this.data.translateProxyEnabled,
            );
            this.events["select:proxyTranslationStatus"].dispatch(value);
          },
        },
        appearance: {
          onShowPiPButtonChange: this.createPersistedSettingHandler({
            storageKey: "showPiPButton",
            dispatch: (checked) =>
              this.events["change:showPiPButton"].dispatch(checked),
          }),
          onAutoHideButtonDelayInput: this.createBufferedNumericInputHandler({
            storageKey: "autoHideButtonDelay",
            dispatch: (value) =>
              this.events["input:autoHideButtonDelay"].dispatch(value),
          }),
          onButtonPositionSelect: (option) =>
            this.createPersistedSettingHandler({
              storageKey: "buttonPos",
            })(option.value as Position),
          onLangSelect: async (option) => {
            const item = option.value as LangOverride;
            const result = await localizationProvider.changeLang(item);
            if (!result) {
              return;
            }
            this.data.localeUpdatedAt = await votStorage.get(
              "localeUpdatedAt",
              0,
            );
            setLocale("updatedAt", 0);
            this.events["select:menuLanguage"].dispatch(item);
          },
        },
        misc: {
          onChangeTranslateAPIErrors: this.createPersistedSettingHandler({
            storageKey: "translateAPIErrors",
          }),
          isAudioContextSupported: this.videoHandler?.isAudioContextSupported,
          needBypassCSP: this.videoHandler.site.needBypassCSP,
          onChangeNewAudioPlayer: this.createPersistedSettingHandler({
            storageKey: "newAudioPlayer",
            dispatch: (checked) =>
              this.events["change:useNewAudioPlayer"].dispatch(checked),
          }),
          onChangeOnlyBypassMediaCSP: this.createPersistedSettingHandler({
            storageKey: "onlyBypassMediaCSP",
            dispatch: (checked) =>
              this.events["change:onlyBypassMediaCSP"].dispatch(checked),
          }),
        },
        footer: {
          onBugReportClick: () => this.events["click:bugReport"].dispatch(),
          onResetSettingsClick: () =>
            this.events["click:resetSettings"].dispatch(),
        },
      }) as Node;
    }, this.globalPortal);
    if (!this.root) {
      this.disposeSettingsDialog();
      this.disposeSettingsDialog = undefined;
      throw new Error("[VOT] Settings dialog did not expose a root element");
    }
    this.initialized = true;
    return this;
  }
  initUIEvents() {
    if (!this.isInitialized()) {
      throw new Error("[VOT] SettingsController isn't initialized");
    }
    globalThis.addEventListener("message", this.onAuthRefreshMessage);
    this.bindAccountStorageListener();
    return this;
  }
  addEventListener<K extends keyof SettingsControllerEventMap>(
    type: K,
    listener: (...data: SettingsControllerEventMap[K]) => void,
  ): this {
    this.events[type].addListener(listener);
    return this;
  }
  removeEventListener<K extends keyof SettingsControllerEventMap>(
    type: K,
    listener: (...data: SettingsControllerEventMap[K]) => void,
  ): this {
    this.events[type].removeListener(listener);
    return this;
  }
  private doReleaseUI(): void {
    this.disposeSettingsDialog?.();
    this.disposeSettingsDialog = undefined;
    this.root?.remove();
    this.dialogOpen = undefined;
    this.setDialogOpen = undefined;
    this.root = undefined;
  }
  private doReleaseUIEvents(): void {
    this.accountStorageListenerCleanup?.();
    this.accountStorageListenerCleanup = undefined;
    globalThis.removeEventListener("message", this.onAuthRefreshMessage);
    this.flushStoragePersists();
    for (const event of Object.values(this.events)) event.clear();
  }
  release() {
    if (!this.isInitialized()) return this;
    this.doReleaseUIEvents();
    this.doReleaseUI();
    this.initialized = false;
    return this;
  }
  updateAccountInfo() {
    if (!this.isInitialized())
      throw new Error("[VOT] SettingsController isn't initialized");
    this.events["update:account"].dispatch(this.data.account);
    return this;
  }
  open() {
    if (!this.isInitialized())
      throw new Error("[VOT] SettingsController isn't initialized");
    this.setDialogOpen(true);
    return this;
  }
  close() {
    if (!this.isInitialized())
      throw new Error("[VOT] SettingsController isn't initialized");
    this.setDialogOpen(false);
    return this;
  }
  isOpen() {
    return this.dialogOpen?.() ?? false;
  }
}
