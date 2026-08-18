const SETTINGS_EVENT_KEYS: Array<keyof SettingsViewEventMap> = [
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
  "select:buttonPosition",
  "select:menuLanguage",
];
function createSettingsEvents(): {
  [K in keyof SettingsViewEventMap]: EventImpl<SettingsViewEventMap[K]>;
} {
  const events = {} as {
    [K in keyof SettingsViewEventMap]: EventImpl<SettingsViewEventMap[K]>;
  };
  for (const key of SETTINGS_EVENT_KEYS) {
    (events as Record<string, EventImpl<unknown[]>>)[key] = new EventImpl<
      unknown[]
    >();
  }
  return events;
}

import { AboutSection } from "../../components/About/AboutSection";
import { AccountMenu } from "../../components/Account/AccountMenu";
import { SettingsAppearanceSection } from "../../components/Settings/SettingsAppearanceSection";
import { SettingsHotkeySection } from "../../components/Settings/SettingsHotkeySection";
import { SettingsMiscSection } from "../../components/Settings/SettingsMiscSection";
import { SettingsProxySection } from "../../components/Settings/SettingsProxySection";
import { SettingsSection } from "../../components/Settings/SettingsSection";
import { SettingsSubtitlesSection } from "../../components/Settings/SettingsSubtitlesSection";
import { SettingsTranslationSection } from "../../components/Settings/SettingsTranslationSection";
import { PROXY_WORKER_HOST } from "../../config/config";
import { isAuthRefreshMessage } from "../../core/authRefreshMessage";
import { openAuthWindow } from "../../core/authWindow";
import {
  type LangOverride,
  localizationProvider,
} from "../../localization/localizationProvider";
import { account, resetAccount, updateAccount } from "../../stores/account";
import { setLocale } from "../../stores/locale";
import { setSettings } from "../../stores/settings";
import {
  getGoogleSubtitleFontFamilyName,
  loadGoogleFontsCatalog,
  toGoogleSubtitleFontFamily,
} from "../../subtitles/fonts";
import {
  type BuiltInSubtitleFontFamily,
  isBuiltInSubtitleFontFamily,
  type SubtitleFontFamily,
  type SubtitleFormat,
  subtitleFontFamilies,
} from "../../subtitles/types";
import type { SelectItem } from "../../types/components/select";
import type { Position } from "../../types/components/votButton";
import type {
  Account,
  ResponseLanguageSubtitles,
  StorageData,
  TranslateProxyStatus,
} from "../../types/storage";
import type {
  SettingsViewEventMap,
  SettingsViewProps,
} from "../../types/views/settings";
import ui from "../../ui";
import debug from "../../utils/debug";
import { EventImpl } from "../../utils/eventImpl";
import { votStorage } from "../../utils/storage";
import type { VideoHandler } from "../../VideoHandler";
import { createDomId } from "../components/componentShared";
import Details from "../components/details";
import Dialog from "../components/dialog";
import Label from "../components/label";
import Select from "../components/select";
import { type MountedComponent, mountComponent } from "../solid/mountComponent";

const GOOGLE_FONTS_SEARCH_LIMIT = 30;
type BufferedNumericStorageKey =
  | "autoVolume"
  | "subtitlesMaxLength"
  | "subtitlesFontSize"
  | "subtitlesOpacity"
  | "autoHideButtonDelay";

const subtitleFontFamilyLabels: Record<BuiltInSubtitleFontFamily, string> = {
  "default-sans": "Default Sans",
  arial: "Arial",
  helvetica: "Helvetica",
  roboto: "Roboto",
  verdana: "Verdana",
  "open-sans": "Open Sans",
  poppins: "Poppins",
  lato: "Lato",
  montserrat: "Montserrat",
  barlow: "Barlow",
};

function getSubtitleFontFamilyLabel(fontFamily: SubtitleFontFamily): string {
  if (isBuiltInSubtitleFontFamily(fontFamily)) {
    return subtitleFontFamilyLabels[fontFamily];
  }

  return getGoogleSubtitleFontFamilyName(fontFamily) ?? "Default Sans";
}

export class SettingsView {
  private static readonly PERSIST_DELAY_MS = 250;
  globalPortal: HTMLElement;
  private initialized = false;
  private readonly data: Partial<StorageData>;
  private readonly videoHandler?: VideoHandler;
  private readonly events: {
    [K in keyof SettingsViewEventMap]: EventImpl<SettingsViewEventMap[K]>;
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
  dialog?: Dialog;
  accountSection?: MountedComponent<HTMLElement>;
  translationSection?: MountedComponent<HTMLElement>;
  private accountStorageListenerCleanup?: () => void;
  subtitlesFontFamilySelectLabel?: Label;
  subtitlesFontFamilySelect?: Select<SubtitleFontFamily>;
  hotkeysSection?: MountedComponent<HTMLDivElement>;
  subtitlesSection?: MountedComponent<HTMLDivElement>;
  proxySection?: MountedComponent<HTMLDivElement>;
  appearanceSection?: MountedComponent<HTMLDivElement>;
  miscSection?: MountedComponent<HTMLDivElement>;
  aboutSection?: MountedComponent<HTMLDivElement>;
  bugReportButton?: HTMLElement;
  resetSettingsButton?: HTMLElement;
  constructor({ globalPortal, data = {}, videoHandler }: SettingsViewProps) {
    this.globalPortal = globalPortal;
    this.data = data;
    this.videoHandler = videoHandler;
  }
  isInitialized(): this is Required<SettingsView> {
    return this.initialized;
  }
  private createAccordionSection(
    title: string,
    options: { open?: boolean } = {},
  ): {
    title: string;
    container: HTMLElement;
    header: HTMLElement;
    content: HTMLElement;
    setOpen: (open: boolean) => void;
    getOpen: () => boolean;
  } {
    const section = ui.createEl("vot-block", ["vot-settings-section"]);
    const header = new Details({ titleHtml: title });
    header.container.classList.add("vot-settings-section-header");
    const sectionId = createDomId("vot-settings-section");
    const headerId = `${sectionId}-header`;
    const contentId = `${sectionId}-content`;
    header.container.id = headerId;
    const content = ui.createEl("vot-block", ["vot-settings-section-content"]);
    content.id = contentId;
    content.setAttribute("role", "region");
    content.setAttribute("aria-labelledby", headerId);
    header.container.setAttribute("aria-controls", contentId);
    const setOpen = (open: boolean) => {
      header.container.dataset.open = open ? "true" : "false";
      header.container.setAttribute("aria-expanded", open ? "true" : "false");
      content.hidden = !open;
    };
    const getOpen = () => header.container.dataset.open === "true";
    setOpen(!!options.open);
    header.addEventListener("click", () => {
      const isOpen = header.container.dataset.open === "true";
      setOpen(!isOpen);
    });
    section.append(header.container, content);
    return {
      title,
      container: section,
      header: header.container,
      content,
      setOpen,
      getOpen,
    };
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
    }, SettingsView.PERSIST_DELAY_MS);
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

  private createSettingsSections() {
    const sections = [
      this.createAccordionSection(
        localizationProvider.get("subtitlesSettings"),
      ),
    ];

    return {
      subtitlesSection: sections[0],
      sections,
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

  private buildSubtitleFontItems(
    selectedFontFamily: SubtitleFontFamily,
    dynamicFontFamilies: string[] = [],
  ): SelectItem<SubtitleFontFamily>[] {
    const items = subtitleFontFamilies.map<SelectItem<SubtitleFontFamily>>(
      (fontFamily) => ({
        label: subtitleFontFamilyLabels[fontFamily],
        value: fontFamily,
        selected: fontFamily === selectedFontFamily,
      }),
    );

    const dynamicItems = dynamicFontFamilies
      .filter((familyName) => {
        const lowerFamilyName = familyName.toLowerCase();
        return !items.some(
          (item) => item.label.toLowerCase() === lowerFamilyName,
        );
      })
      .map<SelectItem<SubtitleFontFamily>>((familyName) => {
        const fontValue = toGoogleSubtitleFontFamily(familyName);
        return {
          label: familyName,
          value: fontValue,
          selected: fontValue === selectedFontFamily,
        };
      });

    if (
      !isBuiltInSubtitleFontFamily(selectedFontFamily) &&
      !dynamicItems.some((item) => item.value === selectedFontFamily)
    ) {
      const currentGoogleFontFamily =
        getGoogleSubtitleFontFamilyName(selectedFontFamily);
      if (currentGoogleFontFamily) {
        dynamicItems.unshift({
          label: currentGoogleFontFamily,
          value: selectedFontFamily,
          selected: true,
        });
      }
    }

    return [...items, ...dynamicItems];
  }

  private async searchSubtitleFontItems(
    query: string,
    fallbackFontFamily: SubtitleFontFamily,
  ): Promise<SelectItem<SubtitleFontFamily>[]> {
    const activeFontFamily =
      Array.from(this.subtitlesFontFamilySelect?.selectedValues ?? [])[0] ??
      fallbackFontFamily;
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return this.buildSubtitleFontItems(activeFontFamily);
    }

    const googleFontsCatalog = await loadGoogleFontsCatalog();
    const matchingGoogleFonts = googleFontsCatalog
      .filter((familyName) =>
        familyName.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, GOOGLE_FONTS_SEARCH_LIMIT);

    return this.buildSubtitleFontItems(activeFontFamily, matchingGoogleFonts);
  }

  initUI() {
    if (this.isInitialized()) {
      throw new Error("[VOT] SettingsView is already initialized");
    }
    this.dialog = new Dialog({
      titleHtml: localizationProvider.get("VOTSettings"),
    });
    this.globalPortal.appendChild(this.dialog.container);
    this.accountSection = mountComponent<HTMLDivElement>((rootRef) =>
      SettingsSection({
        title: localizationProvider.get("VOTMyAccount"),
        isOpen: true,
        ref: rootRef,
        children: AccountMenu({
          onClickLogin: async () => {
            debug.log("Account login button clicked");
            if (account.isLoggedIn) {
              await votStorage.delete("account");
              resetAccount();
              return this.updateAccountInfo();
            }

            openAuthWindow();
          },
        }),
      }),
    );
    this.translationSection = mountComponent<HTMLDivElement>((rootRef) =>
      SettingsTranslationSection({
        isAudioContextSupported: this.videoHandler?.isAudioContextSupported,
        ref: rootRef,
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
      }),
    );
    this.hotkeysSection = mountComponent<HTMLDivElement>((rootRef) =>
      SettingsHotkeySection({
        ref: rootRef,
        onTranslationHotkeyChange: this.createPersistedSettingHandler({
          storageKey: "translationHotkey",
        }),
        onSubtitlesHotkeyChange: this.createPersistedSettingHandler({
          storageKey: "subtitlesHotkey",
        }),
      }),
    );
    this.subtitlesSection = mountComponent<HTMLDivElement>((rootRef) =>
      SettingsSubtitlesSection({
        ref: rootRef,
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
      }),
    );
    this.proxySection = mountComponent<HTMLDivElement>((rootRef) =>
      SettingsProxySection({
        ref: rootRef,
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
          setSettings("translateProxyEnabled", this.data.translateProxyEnabled);
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
      }),
    );
    this.appearanceSection = mountComponent<HTMLDivElement>((rootRef) =>
      SettingsAppearanceSection({
        ref: rootRef,
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
            dispatch: (item) =>
              this.events["select:buttonPosition"].dispatch(item),
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
      }),
    );
    this.miscSection = mountComponent<HTMLDivElement>((rootRef) =>
      SettingsMiscSection({
        ref: rootRef,
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
      }),
    );
    this.aboutSection = mountComponent<HTMLDivElement>((rootRef) =>
      SettingsSection({
        title: localizationProvider.get("aboutExtension"),
        ref: rootRef,
        children: AboutSection({}),
      }),
    );

    const { subtitlesSection, sections } = this.createSettingsSections();
    this.dialog.bodyContainer.append(
      this.accountSection.root,
      ...sections.map((section) => section.container),
      this.translationSection.root,
      this.hotkeysSection.root,
      this.subtitlesSection.root,
      this.proxySection.root,
      this.miscSection.root,
      this.appearanceSection.root,
      this.aboutSection.root,
    );

    const storedSubtitlesFontFamily =
      typeof this.data.subtitlesFontFamily === "string"
        ? this.data.subtitlesFontFamily
        : undefined;
    const subtitlesFontFamily =
      storedSubtitlesFontFamily &&
      (isBuiltInSubtitleFontFamily(storedSubtitlesFontFamily) ||
        getGoogleSubtitleFontFamilyName(storedSubtitlesFontFamily))
        ? storedSubtitlesFontFamily
        : "default-sans";
    this.subtitlesFontFamilySelectLabel = new Label({
      labelText: localizationProvider.get("VOTSubtitlesFont" as any),
    });
    this.subtitlesFontFamilySelect = new Select<SubtitleFontFamily>({
      selectTitle: getSubtitleFontFamilyLabel(subtitlesFontFamily),
      dialogTitle: localizationProvider.get("VOTSubtitlesFont" as any),
      dialogParent: this.globalPortal,
      labelElement: this.subtitlesFontFamilySelectLabel.container,
      items: this.buildSubtitleFontItems(subtitlesFontFamily),
      searchItemsProvider: (query) =>
        this.searchSubtitleFontItems(query, subtitlesFontFamily),
    });
    this.subtitlesFontFamilySelect.addEventListener("selectItem", (item) => {
      if (!this.subtitlesFontFamilySelect) {
        return;
      }
      this.subtitlesFontFamilySelect.updateItems(
        this.buildSubtitleFontItems(item),
      );
      this.subtitlesFontFamilySelect.selectTitle =
        getSubtitleFontFamilyLabel(item);
    });
    subtitlesSection.content.append(this.subtitlesFontFamilySelect.container);

    this.bugReportButton = ui.createOutlinedButton(
      localizationProvider.get("VOTBugReport"),
    );
    this.resetSettingsButton = ui.createButton(
      localizationProvider.get("resetSettings"),
    );

    this.dialog.footerContainer.append(
      this.bugReportButton,
      this.resetSettingsButton,
    );
    this.initialized = true;
    return this;
  }
  initUIEvents() {
    if (!this.isInitialized()) {
      throw new Error("[VOT] SettingsView isn't initialized");
    }
    globalThis.addEventListener("message", this.onAuthRefreshMessage);
    this.bindAccountStorageListener();
    this.subtitlesFontFamilySelect.addEventListener(
      "selectItem",
      this.createPersistedSettingHandler({
        storageKey: "subtitlesFontFamily",
        dispatch: (item) =>
          this.events["select:subtitlesFontFamily"].dispatch(item),
      }),
    );

    this.bugReportButton.addEventListener("click", () =>
      this.events["click:bugReport"].dispatch(),
    );
    this.resetSettingsButton.addEventListener("click", () =>
      this.events["click:resetSettings"].dispatch(),
    );
    return this;
  }
  addEventListener<K extends keyof SettingsViewEventMap>(
    type: K,
    listener: (...data: SettingsViewEventMap[K]) => void,
  ): this {
    this.events[type].addListener(listener);
    return this;
  }
  removeEventListener<K extends keyof SettingsViewEventMap>(
    type: K,
    listener: (...data: SettingsViewEventMap[K]) => void,
  ): this {
    this.events[type].removeListener(listener);
    return this;
  }
  private doReleaseUI(): void {
    for (const key of [
      "accountSection",
      "subtitlesSection",
      "hotkeysSection",
      "subtitlesSection",
      "proxySection",
      "appearanceSection",
      "miscSection",
      "aboutSection",
    ] satisfies (keyof (typeof SettingsView)["prototype"])[]) {
      const control = this[key] as MountedComponent<any> | undefined;
      control?.dispose();
      control?.root.remove();
      this[key] = undefined as any;
    }

    this.dialog?.remove();
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
      throw new Error("[VOT] SettingsView isn't initialized");
    this.events["update:account"].dispatch(this.data.account);
    return this;
  }
  open() {
    if (!this.isInitialized())
      throw new Error("[VOT] SettingsView isn't initialized");
    return this.dialog.open();
  }
  close() {
    if (!this.isInitialized())
      throw new Error("[VOT] SettingsView isn't initialized");
    return this.dialog.close();
  }
}
