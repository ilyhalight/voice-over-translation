type TMInfoScriptMeta = {
  author?: string;
  [key: string]: unknown;
};
const SETTINGS_EVENT_KEYS: Array<keyof SettingsViewEventMap> = [
  "click:bugReport",
  "click:resetSettings",
  "update:account",
  "change:autoTranslate",
  "change:autoSubtitles",
  "change:showVideoVolume",
  "change:audioBooster",
  "change:syncVolume",
  "change:useLivelyVoice",
  "change:subtitlesHighlightWords",
  "change:subtitlesSmartLayout",
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

import { availableLangs, subtitlesFormats } from "@vot.js/shared/consts";
import type { SubtitleFormat } from "@vot.js/shared/types/subs";
import { html } from "lit-html";
import { countryCode, type VideoHandler } from "../..";
import {
  authServerUrl,
  defaultAutoHideDelay,
  defaultAutoVolume,
  defaultDetectService,
  defaultTranslationService,
  proxyOnlyCountries,
  proxyWorkerHost,
} from "../../config/config";
import { EventImpl } from "../../core/eventImpl";
import {
  type LangOverride,
  localizationProvider,
} from "../../localization/localizationProvider";
import type {
  LanguageSelectKey,
  SelectItem,
} from "../../types/components/select";
import { type Position, positions } from "../../types/components/votButton";
import type {
  Account,
  StorageData,
  TranslateProxyStatus,
} from "../../types/storage";
import type {
  DetectService,
  TranslateService,
} from "../../types/translateApis";
import type {
  SettingsViewEventMap,
  SettingsViewProps,
} from "../../types/views/settings";
import ui from "../../ui";
import debug from "../../utils/debug";
import { getEnvironmentInfo } from "../../utils/environment";
import {
  isProxyOnlyExtension,
  isSupportGMXhr,
  isUnsafeWindowAllowed,
} from "../../utils/gm";
import { votStorage } from "../../utils/storage";
import { detectServices, translateServices } from "../../utils/translateApis";
import { isPiPAvailable } from "../../utils/utils";
import AccountButton from "../components/accountButton";
import Checkbox from "../components/checkbox";
import Details from "../components/details";
import Dialog from "../components/dialog";
import HotkeyButton from "../components/hotkeyButton";
import Label from "../components/label";
import Select from "../components/select";
import Slider from "../components/slider";
import SliderLabel from "../components/sliderLabel";
import Textfield from "../components/textfield";
import Tooltip from "../components/tooltip";
import { HELP_ICON, WARNING_ICON } from "../icons";
export class SettingsView {
  private static readonly PERSIST_DELAY_MS = 250;
  globalPortal: HTMLElement;
  private initialized = false;
  private readonly data: Partial<StorageData>;
  private readonly videoHandler?: VideoHandler;
  private suppressSubtitlesSmartLayoutCheckboxChange = false;
  private readonly events: {
    [K in keyof SettingsViewEventMap]: EventImpl<SettingsViewEventMap[K]>;
  } = createSettingsEvents();
  private persistTimerIds: Partial<
    Record<
      | "subtitlesMaxLength"
      | "subtitlesFontSize"
      | "subtitlesOpacity"
      | "autoHideButtonDelay",
      number
    >
  > = {};
  dialog?: Dialog;
  accountButton?: AccountButton;
  accountButtonRefreshTooltip?: Tooltip;
  accountButtonTokenTooltip?: Tooltip;
  autoTranslateCheckbox?: Checkbox;
  autoSubtitlesCheckbox?: Checkbox;
  dontTranslateLanguagesCheckbox?: Checkbox;
  dontTranslateLanguagesSelect?: Select<LanguageSelectKey, true>;
  autoSetVolumeSliderLabel?: SliderLabel;
  autoSetVolumeCheckbox?: Checkbox;
  smartDuckingCheckbox?: Checkbox;
  autoSetVolumeSlider?: Slider;
  showVideoVolumeSliderCheckbox?: Checkbox;
  audioBoosterCheckbox?: Checkbox;
  audioBoosterTooltip?: Tooltip;
  syncVolumeCheckbox?: Checkbox;
  downloadWithNameCheckbox?: Checkbox;
  sendNotifyOnCompleteCheckbox?: Checkbox;
  useLivelyVoiceCheckbox?: Checkbox;
  useLivelyVoiceTooltip?: Tooltip;
  useAudioDownloadCheckbox?: Checkbox;
  useAudioDownloadCheckboxLabel?: Label;
  useAudioDownloadCheckboxTooltip?: Tooltip;
  subtitlesDownloadFormatSelectLabel?: Label;
  subtitlesDownloadFormatSelect?: Select<SubtitleFormat>;
  subtitlesHighlightWordsCheckbox?: Checkbox;
  subtitlesSmartLayoutCheckbox?: Checkbox;
  subtitlesMaxLengthSliderLabel?: SliderLabel;
  subtitlesMaxLengthSlider?: Slider;
  subtitlesFontSizeSliderLabel?: SliderLabel;
  subtitlesFontSizeSlider?: Slider;
  subtitlesBackgroundOpacitySliderLabel?: SliderLabel;
  subtitlesBackgroundOpacitySlider?: Slider;
  translateHotkeyButton?: HotkeyButton;
  subtitlesHotkeyButton?: HotkeyButton;
  proxyWorkerHostTextfield?: Textfield;
  proxyTranslationStatusSelectLabel?: Label;
  proxyTranslationStatusSelectTooltip?: Tooltip;
  proxyTranslationStatusSelect?: Select;
  translateAPIErrorsCheckbox?: Checkbox;
  useNewAudioPlayerCheckbox?: Checkbox;
  useNewAudioPlayerTooltip?: Tooltip;
  onlyBypassMediaCSPCheckbox?: Checkbox;
  onlyBypassMediaCSPTooltip?: Tooltip;
  translationTextServiceLabel?: Label;
  translationTextServiceSelect?: Select<TranslateService>;
  translationTextServiceTooltip?: Tooltip;
  detectServiceLabel?: Label;
  detectServiceSelect?: Select<DetectService>;
  showPiPButtonCheckbox?: Checkbox;
  autoHideButtonDelaySliderLabel?: SliderLabel;
  autoHideButtonDelaySlider?: Slider;
  buttonPositionSelectLabel?: Label;
  buttonPositionSelect?: Select<Position>;
  buttonPositionTooltip?: Tooltip;
  menuLanguageSelectLabel?: Label;
  menuLanguageSelect?: Select<LangOverride>;
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
    const sectionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const headerId = `vot-settings-section-header-${sectionId}`;
    const contentId = `vot-settings-section-content-${sectionId}`;
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
  private setSubtitlesSmartLayout(checked: boolean): void {
    this.data.subtitlesSmartLayout = checked;
    void votStorage.set("subtitlesSmartLayout", checked);
    debug.log("subtitlesSmartLayout value changed. New value:", checked);
    if (this.subtitlesSmartLayoutCheckbox?.checked !== checked) {
      this.suppressSubtitlesSmartLayoutCheckboxChange = true;
      this.subtitlesSmartLayoutCheckbox.checked = checked;
      this.suppressSubtitlesSmartLayoutCheckboxChange = false;
    }
    this.events["change:subtitlesSmartLayout"].dispatch(checked);
  }
  private scheduleStoragePersist(
    key:
      | "subtitlesMaxLength"
      | "subtitlesFontSize"
      | "subtitlesOpacity"
      | "autoHideButtonDelay",
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
  private bindPersistedSetting({
    control,
    event,
    apply,
    storageKey,
    readPersistedValue,
    logLabel,
    dispatch,
    afterPersist,
  }: {
    control: {
      addEventListener: (
        type: string,
        listener: (value: any) => void | Promise<void>,
      ) => void;
    };
    event: string;
    apply: (value: any) => void;
    storageKey: string;
    readPersistedValue: () => unknown;
    logLabel: string;
    dispatch?: (value: any) => void;
    afterPersist?: (value: any) => void | Promise<void>;
  }): void {
    control.addEventListener(event, async (value) => {
      apply(value);
      await votStorage.set(storageKey as any, readPersistedValue() as any);
      debug.log(`${logLabel} value changed. New value:`, value);
      if (afterPersist) {
        await afterPersist(value);
      }
      dispatch?.(value);
    });
  }

  initUI() {
    if (this.isInitialized()) {
      throw new Error("[VOT] SettingsView is already initialized");
    }
    this.dialog = new Dialog({
      titleHtml: localizationProvider.get("VOTSettings"),
    });
    this.globalPortal.appendChild(this.dialog.container);
    const accountSection = this.createAccordionSection(
      localizationProvider.get("VOTMyAccount"),
      { open: true },
    );
    const translationSection = this.createAccordionSection(
      localizationProvider.get("translationSettings"),
      { open: true },
    );
    const subtitlesSection = this.createAccordionSection(
      localizationProvider.get("subtitlesSettings"),
    );
    const hotkeysSection = this.createAccordionSection(
      localizationProvider.get("hotkeysSettings"),
    );
    const proxySection = this.createAccordionSection(
      localizationProvider.get("proxySettings"),
    );
    const miscSection = this.createAccordionSection(
      localizationProvider.get("miscSettings"),
    );
    const appearanceSection = this.createAccordionSection(
      localizationProvider.get("appearance"),
    );
    const aboutSection = this.createAccordionSection(
      localizationProvider.get("aboutExtension"),
    );
    const sections = [
      accountSection,
      translationSection,
      subtitlesSection,
      hotkeysSection,
      proxySection,
      miscSection,
      appearanceSection,
      aboutSection,
    ];
    this.dialog.bodyContainer.append(
      ...sections.map((section) => section.container),
    );
    this.accountButton = new AccountButton({
      avatarId: this.data.account?.avatarId,
      username: this.data.account?.username,
      loggedIn: !!this.data.account?.token,
    });
    if (votStorage.isSupportOnlyLS) {
      this.accountButton.refreshButton.setAttribute("disabled", "true");
      this.accountButton.actionButton.setAttribute("disabled", "true");
    } else {
      this.accountButtonRefreshTooltip = new Tooltip({
        target: this.accountButton.refreshButton,
        content: localizationProvider.get("VOTRefresh"),
        position: "bottom",
        backgroundColor: "var(--vot-helper-ondialog)",
        parentElement: this.globalPortal,
      });
    }
    this.accountButtonTokenTooltip = new Tooltip({
      target: this.accountButton.tokenButton,
      content: localizationProvider.get("VOTLoginViaToken"),
      position: "bottom",
      backgroundColor: "var(--vot-helper-ondialog)",
      parentElement: this.globalPortal,
    });
    this.autoTranslateCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTAutoTranslate"),
      checked: this.data.autoTranslate,
    });
    this.autoSubtitlesCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTAutoSubtitles"),
      checked: this.data.autoSubtitles,
    });
    const dontTranslateLanguages = this.data.dontTranslateLanguages ?? [];
    this.dontTranslateLanguagesCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("DontTranslateSelectedLanguages"),
      checked: this.data.enabledDontTranslateLanguages,
    });
    this.dontTranslateLanguagesSelect = new Select({
      dialogParent: this.globalPortal,
      dialogTitle: localizationProvider.get("DontTranslateSelectedLanguages"),
      selectTitle:
        dontTranslateLanguages
          .map((lang) => localizationProvider.get(`langs.${lang}`))
          .join(", ") ||
        localizationProvider.get("DontTranslateSelectedLanguages"),
      items: Select.genLanguageItems(availableLangs).map<
        SelectItem<LanguageSelectKey>
      >((item) => ({
        ...item,
        selected: dontTranslateLanguages.includes(item.value),
      })),
      multiSelect: true,
      labelElement: this.dontTranslateLanguagesCheckbox.container,
    });
    this.dontTranslateLanguagesSelect.disabled =
      !this.dontTranslateLanguagesCheckbox.checked;
    const autoVolume = this.data.autoVolume ?? defaultAutoVolume;
    this.autoSetVolumeSliderLabel = new SliderLabel({
      labelText: localizationProvider.get("VOTAutoSetVolume"),
      value: autoVolume,
    });
    this.autoSetVolumeCheckbox = new Checkbox({
      labelHtml: this.autoSetVolumeSliderLabel.container,
      checked: this.data.enabledAutoVolume ?? true,
    });
    this.autoSetVolumeSlider = new Slider({
      labelHtml: this.autoSetVolumeCheckbox.container,
      value: autoVolume,
      min: 0,
    });
    const syncVolumeEnabled = Boolean(this.data.syncVolume);
    this.autoSetVolumeSlider.disabled = !this.autoSetVolumeCheckbox.checked;
    this.smartDuckingCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("smartDucking"),
      checked: this.data.enabledSmartDucking ?? true,
    });
    this.smartDuckingCheckbox.disabled =
      syncVolumeEnabled || !this.autoSetVolumeCheckbox.checked;
    this.showVideoVolumeSliderCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("showVideoVolumeSlider"),
      checked: this.data.showVideoSlider,
    });
    this.audioBoosterCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTAudioBooster"),
      checked: this.data.audioBooster,
    });
    if (!this.videoHandler?.isAudioContextSupported) {
      this.audioBoosterCheckbox.disabled = true;
      this.audioBoosterTooltip = new Tooltip({
        target: this.audioBoosterCheckbox.container,
        content: localizationProvider.get("VOTNeedWebAudioAPI"),
        position: "bottom",
        backgroundColor: "var(--vot-helper-ondialog)",
        parentElement: this.globalPortal,
      });
    }
    this.syncVolumeCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTSyncVolume"),
      checked: this.data.syncVolume,
    });
    this.downloadWithNameCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTDownloadWithName"),
      checked: this.data.downloadWithName,
    });
    this.downloadWithNameCheckbox.disabled = !isSupportGMXhr;
    this.sendNotifyOnCompleteCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTSendNotifyOnComplete"),
      checked: this.data.sendNotifyOnComplete,
    });
    this.useLivelyVoiceCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTUseLivelyVoice"),
      checked: this.data.useLivelyVoice,
    });
    this.useLivelyVoiceTooltip = new Tooltip({
      target: this.useLivelyVoiceCheckbox.container,
      content: localizationProvider.get("VOTAccountRequired"),
      position: "bottom",
      backgroundColor: "var(--vot-helper-ondialog)",
      parentElement: this.globalPortal,
      hidden: !!this.data.account?.token,
    });
    if (!this.data.account?.token) {
      this.useLivelyVoiceCheckbox.disabled = true;
    }
    this.useAudioDownloadCheckboxLabel = new Label({
      labelText: localizationProvider.get("VOTUseAudioDownload"),
      icon: WARNING_ICON,
    });
    this.useAudioDownloadCheckbox = new Checkbox({
      labelHtml: this.useAudioDownloadCheckboxLabel.container,
      checked: this.data.useAudioDownload,
    });
    if (
      !isUnsafeWindowAllowed &&
      !(typeof IS_EXTENSION !== "undefined" && IS_EXTENSION)
    ) {
      this.useAudioDownloadCheckbox.disabled = true;
    }
    this.useAudioDownloadCheckboxTooltip = new Tooltip({
      target: this.useAudioDownloadCheckboxLabel.container,
      content: localizationProvider.get("VOTUseAudioDownloadWarning"),
      position: "bottom",
      backgroundColor: "var(--vot-helper-ondialog)",
      parentElement: this.globalPortal,
    });
    accountSection.content.append(this.accountButton.container);
    translationSection.content.append(
      this.autoTranslateCheckbox.container,
      this.autoSubtitlesCheckbox.container,
      this.dontTranslateLanguagesSelect.container,
      this.autoSetVolumeSlider.container,
      this.smartDuckingCheckbox.container,
      this.showVideoVolumeSliderCheckbox.container,
      this.audioBoosterCheckbox.container,
      this.syncVolumeCheckbox.container,
      this.downloadWithNameCheckbox.container,
      this.sendNotifyOnCompleteCheckbox.container,
      this.useLivelyVoiceCheckbox.container,
      this.useAudioDownloadCheckbox.container,
    );
    this.subtitlesDownloadFormatSelectLabel = new Label({
      labelText: localizationProvider.get("VOTSubtitlesDownloadFormat"),
    });
    this.subtitlesDownloadFormatSelect = new Select<SubtitleFormat>({
      selectTitle:
        this.data.subtitlesDownloadFormat ??
        localizationProvider.get("VOTSubtitlesDownloadFormat"),
      dialogTitle: localizationProvider.get("VOTSubtitlesDownloadFormat"),
      dialogParent: this.globalPortal,
      labelElement: this.subtitlesDownloadFormatSelectLabel.container,
      items: subtitlesFormats.map<SelectItem<SubtitleFormat>>((format) => ({
        label: format.toUpperCase(),
        value: format,
        selected: format === this.data.subtitlesDownloadFormat,
      })),
    });
    this.subtitlesHighlightWordsCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTHighlightWords"),
      checked: this.data.highlightWords,
    });
    const subtitlesSmartLayout = this.data.subtitlesSmartLayout ?? true;
    this.subtitlesSmartLayoutCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("subtitlesSmartLayout"),
      checked: subtitlesSmartLayout,
    });
    const subtitlesMaxLength = this.data.subtitlesMaxLength ?? 300;
    this.subtitlesMaxLengthSliderLabel = new SliderLabel({
      labelText: localizationProvider.get("VOTSubtitlesMaxLength"),
      labelEOL: ":",
      value: subtitlesMaxLength,
      symbol: "",
    });
    this.subtitlesMaxLengthSlider = new Slider({
      labelHtml: this.subtitlesMaxLengthSliderLabel.container,
      value: subtitlesMaxLength,
      min: 50,
      max: 300,
    });
    const subtitlesFontSize = this.data.subtitlesFontSize ?? 20;
    this.subtitlesFontSizeSliderLabel = new SliderLabel({
      labelText: localizationProvider.get("VOTSubtitlesFontSize"),
      labelEOL: ":",
      value: subtitlesFontSize,
      symbol: "px",
    });
    this.subtitlesFontSizeSlider = new Slider({
      labelHtml: this.subtitlesFontSizeSliderLabel.container,
      value: subtitlesFontSize,
      min: 8,
      max: 50,
    });
    const subtitlesOpacity = this.data.subtitlesOpacity ?? 20;
    this.subtitlesBackgroundOpacitySliderLabel = new SliderLabel({
      labelText: localizationProvider.get("VOTSubtitlesOpacity"),
      labelEOL: ":",
      value: subtitlesOpacity,
      symbol: "%",
    });
    this.subtitlesBackgroundOpacitySlider = new Slider({
      labelHtml: this.subtitlesBackgroundOpacitySliderLabel.container,
      value: subtitlesOpacity,
      min: 0,
      max: 100,
    });
    subtitlesSection.content.append(
      this.subtitlesDownloadFormatSelect.container,
      this.subtitlesHighlightWordsCheckbox.container,
      this.subtitlesSmartLayoutCheckbox.container,
      this.subtitlesMaxLengthSlider.container,
      this.subtitlesFontSizeSlider.container,
      this.subtitlesBackgroundOpacitySlider.container,
    );
    this.translateHotkeyButton = new HotkeyButton({
      labelHtml: localizationProvider.get("translateVideo"),
      key: this.data.translationHotkey,
    });
    this.subtitlesHotkeyButton = new HotkeyButton({
      labelHtml: localizationProvider.get("VOTSubtitles"),
      key: this.data.subtitlesHotkey,
    });
    hotkeysSection.content.append(
      this.translateHotkeyButton.container,
      this.subtitlesHotkeyButton.container,
    );
    this.proxyWorkerHostTextfield = new Textfield({
      labelHtml: localizationProvider.get("VOTProxyWorkerHost"),
      value: this.data.proxyWorkerHost,
      placeholder: proxyWorkerHost,
    });
    const proxyEnabledLabels = [
      localizationProvider.get("VOTTranslateProxyDisabled"),
      localizationProvider.get("VOTTranslateProxyEnabled"),
      localizationProvider.get("VOTTranslateProxyEverything"),
    ];
    const translateProxyEnabled = this.data.translateProxyEnabled ?? 0;
    const isTranslateProxyRequired =
      countryCode && proxyOnlyCountries.includes(countryCode);
    this.proxyTranslationStatusSelectLabel = new Label({
      icon: isTranslateProxyRequired ? WARNING_ICON : undefined,
      labelText: localizationProvider.get("VOTTranslateProxyStatus"),
    });
    if (isTranslateProxyRequired) {
      this.proxyTranslationStatusSelectTooltip = new Tooltip({
        target: this.proxyTranslationStatusSelectLabel.icon,
        content: localizationProvider.get("VOTTranslateProxyStatusDefault"),
        position: "bottom",
        backgroundColor: "var(--vot-helper-ondialog)",
        parentElement: this.globalPortal,
      });
    }
    this.proxyTranslationStatusSelect = new Select({
      selectTitle: proxyEnabledLabels[translateProxyEnabled],
      dialogTitle: localizationProvider.get("VOTTranslateProxyStatus"),
      dialogParent: this.globalPortal,
      labelElement: this.proxyTranslationStatusSelectLabel.container,
      items: proxyEnabledLabels.map<SelectItem>((label, idx) => ({
        label,
        value: idx.toString(),
        selected: idx === translateProxyEnabled,
        disabled: idx === 0 && isProxyOnlyExtension,
      })),
    });
    proxySection.content.append(
      this.proxyWorkerHostTextfield.container,
      this.proxyTranslationStatusSelect.container,
    );
    this.translateAPIErrorsCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTTranslateAPIErrors"),
      checked: this.data.translateAPIErrors ?? true,
    });
    this.translateAPIErrorsCheckbox.hidden = localizationProvider.lang === "ru";
    this.useNewAudioPlayerCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTNewAudioPlayer"),
      checked: this.data.newAudioPlayer,
    });
    if (!this.videoHandler?.isAudioContextSupported) {
      this.useNewAudioPlayerCheckbox.disabled = true;
      this.useNewAudioPlayerTooltip = new Tooltip({
        target: this.useNewAudioPlayerCheckbox.container,
        content: localizationProvider.get("VOTNeedWebAudioAPI"),
        position: "bottom",
        backgroundColor: "var(--vot-helper-ondialog)",
        parentElement: this.globalPortal,
      });
    }
    const onlyBypassMediaCSPLabel = this.videoHandler?.site.needBypassCSP
      ? `${localizationProvider.get("VOTOnlyBypassMediaCSP")} (${localizationProvider.get("VOTMediaCSPEnabledOnSite")})`
      : localizationProvider.get("VOTOnlyBypassMediaCSP");
    this.onlyBypassMediaCSPCheckbox = new Checkbox({
      labelHtml: onlyBypassMediaCSPLabel,
      checked: this.data.onlyBypassMediaCSP,
      isSubCheckbox: true,
    });
    if (!this.videoHandler?.isAudioContextSupported) {
      this.onlyBypassMediaCSPTooltip = new Tooltip({
        target: this.onlyBypassMediaCSPCheckbox.container,
        content: localizationProvider.get("VOTNeedWebAudioAPI"),
        position: "bottom",
        backgroundColor: "var(--vot-helper-ondialog)",
        parentElement: this.globalPortal,
      });
    }
    this.onlyBypassMediaCSPCheckbox.disabled =
      !this.data.newAudioPlayer && !!this.videoHandler?.isAudioContextSupported;
    if (!this.data.newAudioPlayer) {
      this.onlyBypassMediaCSPCheckbox.hidden = true;
    }
    this.translationTextServiceLabel = new Label({
      labelText: localizationProvider.get("VOTTranslationTextService"),
      icon: HELP_ICON,
    });
    const translationService =
      this.data.translationService ?? defaultTranslationService;
    this.translationTextServiceSelect = new Select({
      selectTitle: localizationProvider.get(`services.${translationService}`),
      dialogTitle: localizationProvider.get("VOTTranslationTextService"),
      dialogParent: this.globalPortal,
      labelElement: this.translationTextServiceLabel.container,
      items: translateServices.map<SelectItem<TranslateService>>((service) => ({
        label: localizationProvider.get(`services.${service}`),
        value: service,
        selected: service === translationService,
      })),
    });
    this.translationTextServiceTooltip = new Tooltip({
      target: this.translationTextServiceLabel.icon,
      content: localizationProvider.get("VOTNotAffectToVoice"),
      position: "bottom",
      backgroundColor: "var(--vot-helper-ondialog)",
      parentElement: this.globalPortal,
    });
    this.detectServiceLabel = new Label({
      labelText: localizationProvider.get("VOTDetectService"),
    });
    const detectService = this.data.detectService ?? defaultDetectService;
    this.detectServiceSelect = new Select({
      selectTitle: localizationProvider.get(`services.${detectService}` as any),
      dialogTitle: localizationProvider.get("VOTDetectService"),
      dialogParent: this.globalPortal,
      labelElement: this.detectServiceLabel.container,
      items: detectServices.map<SelectItem<DetectService>>((service) => ({
        label: localizationProvider.get(`services.${service}`),
        value: service,
        selected: service === detectService,
      })),
    });
    this.showPiPButtonCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTShowPiPButton"),
      checked: this.data.showPiPButton,
    });
    this.showPiPButtonCheckbox.hidden = !isPiPAvailable();
    const autoHideButtonDelaySec =
      Math.round(
        ((this.data.autoHideButtonDelay ?? defaultAutoHideDelay) / 1000) * 10,
      ) / 10;
    this.autoHideButtonDelaySliderLabel = new SliderLabel({
      labelText: localizationProvider.get("autoHideButtonDelay"),
      labelEOL: ":",
      value: autoHideButtonDelaySec,
      symbol: ` ${localizationProvider.get("secs")}`,
    });
    this.autoHideButtonDelaySlider = new Slider({
      labelHtml: this.autoHideButtonDelaySliderLabel.container,
      value: autoHideButtonDelaySec,
      min: 0.1,
      max: 3,
      step: 0.1,
    });
    this.buttonPositionSelectLabel = new Label({
      labelText: localizationProvider.get("buttonPosition"),
      icon: HELP_ICON,
    });
    const buttonPos = this.data.buttonPos ?? "default";
    this.buttonPositionSelect = new Select<Position>({
      selectTitle: localizationProvider.get(`position.${buttonPos}`),
      dialogTitle: localizationProvider.get("buttonPosition"),
      labelElement: this.buttonPositionSelectLabel.container,
      dialogParent: this.globalPortal,
      items: positions.map<SelectItem<Position>>((position) => ({
        label: localizationProvider.get(`position.${position}`),
        value: position,
        selected: position === buttonPos,
      })),
    });
    this.buttonPositionTooltip = new Tooltip({
      target: this.buttonPositionSelectLabel.icon,
      content: localizationProvider.get("minButtonPositionContainer"),
      position: "bottom",
      backgroundColor: "var(--vot-helper-ondialog)",
      parentElement: this.globalPortal,
    });
    this.menuLanguageSelectLabel = new Label({
      labelText: localizationProvider.get("VOTMenuLanguage"),
    });
    this.menuLanguageSelect = new Select<LangOverride>({
      selectTitle: localizationProvider.get(
        `langs.${localizationProvider.langOverride}` as any,
      ),
      dialogTitle: localizationProvider.get("VOTMenuLanguage"),
      labelElement: this.menuLanguageSelectLabel.container,
      dialogParent: this.globalPortal,
      items: Select.genLanguageItems(
        localizationProvider.getAvailableLangs(),
        localizationProvider.langOverride,
      ),
    });
    this.bugReportButton = ui.createOutlinedButton(
      localizationProvider.get("VOTBugReport"),
    );
    this.resetSettingsButton = ui.createButton(
      localizationProvider.get("resetSettings"),
    );
    miscSection.content.append(
      this.translateAPIErrorsCheckbox.container,
      this.useNewAudioPlayerCheckbox.container,
      this.onlyBypassMediaCSPCheckbox.container,
    );
    translationSection.content.append(
      this.translationTextServiceSelect.container,
      this.detectServiceSelect.container,
    );
    appearanceSection.content.append(
      this.showPiPButtonCheckbox.container,
      this.autoHideButtonDelaySlider.container,
      this.buttonPositionSelect.container,
      this.menuLanguageSelect.container,
    );
    const envInfo = getEnvironmentInfo();
    const versionInfo = ui.createInformation(
      `${localizationProvider.get("VOTVersion")}:`,
      envInfo.scriptVersion ||
        GM_info.script.version ||
        localizationProvider.get("notFound"),
    );
    const buildAuthors =
      typeof VOT_AUTHORS === "undefined" ? "" : String(VOT_AUTHORS);
    const authorsInfo = ui.createInformation(
      `${localizationProvider.get("VOTAuthors")}:`,
      (GM_info.script as TMInfoScriptMeta).author ||
        buildAuthors ||
        localizationProvider.get("notFound"),
    );
    const loaderInfo = ui.createInformation(
      `${localizationProvider.get("VOTLoader")}:`,
      envInfo.loader,
    );
    const userBrowserInfo = ui.createInformation(
      `${localizationProvider.get("VOTBrowser")}:`,
      `${envInfo.browser} (${envInfo.os})`,
    );
    const localeUpdatedAt = new Date(
      (this.data.localeUpdatedAt ?? 0) * 1000,
    ).toLocaleString();
    const localeHashValue =
      this.data.localeHash ?? localizationProvider.get("notFound");
    const localeInfoValue = html`${localeHashValue}<br />(${localizationProvider.get(
      "VOTUpdatedAt",
    )}
      ${localeUpdatedAt})`;
    const localeInfo = ui.createInformation(
      `${localizationProvider.get("VOTLocaleHash")}:`,
      localeInfoValue,
    );
    const updateLocaleFilesButton = ui.createOutlinedButton(
      localizationProvider.get("VOTUpdateLocaleFiles"),
    );
    updateLocaleFilesButton.addEventListener("click", async () => {
      await votStorage.set("localeHash", "");
      await localizationProvider.update(true);
      globalThis.location.reload();
    });
    aboutSection.content.append(
      versionInfo.container,
      authorsInfo.container,
      loaderInfo.container,
      userBrowserInfo.container,
      localeInfo.container,
      updateLocaleFilesButton,
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
    this.accountButton.addEventListener("click", async () => {
      if (votStorage.isSupportOnlyLS) return;
      if (this.accountButton.loggedIn) {
        await votStorage.delete("account");
        this.data.account = {};
        return this.updateAccountInfo();
      }
      globalThis.open(authServerUrl, "_blank")?.focus();
    });
    this.accountButton.addEventListener("click:secret", async () => {
      const dialog = new Dialog({
        titleHtml: localizationProvider.get("VOTLoginViaToken"),
        isTemp: true,
      });
      this.globalPortal.appendChild(dialog.container);
      const tokenInfoEl = ui.createEl(
        "vot-block",
        undefined,
        localizationProvider.get("VOTYandexTokenInfo"),
      );
      const tokenTextfield = new Textfield({
        labelHtml: localizationProvider.get("VOTYandexToken"),
        value: this.data.account?.token,
      });
      tokenTextfield.addEventListener("change", async (token) => {
        this.data.account = token
          ? { expires: Date.now() + 31_534_180_000, token }
          : {};
        await votStorage.set<Partial<Account>>("account", this.data.account);
        this.updateAccountInfo();
      });
      dialog.bodyContainer.append(tokenInfoEl, tokenTextfield.container);
      dialog.open();
    });
    this.accountButton.addEventListener("refresh", async () => {
      if (votStorage.isSupportOnlyLS) return;
      this.data.account = await votStorage.get("account", {});
      this.updateAccountInfo();
    });
    this.bindPersistedSetting({
      control: this.autoTranslateCheckbox,
      event: "change",
      apply: (checked) => {
        this.data.autoTranslate = checked;
      },
      storageKey: "autoTranslate",
      readPersistedValue: () => this.data.autoTranslate,
      logLabel: "autoTranslate",
      dispatch: (checked) =>
        this.events["change:autoTranslate"].dispatch(checked),
    });
    this.bindPersistedSetting({
      control: this.autoSubtitlesCheckbox,
      event: "change",
      apply: (checked) => {
        this.data.autoSubtitles = checked;
      },
      storageKey: "autoSubtitles",
      readPersistedValue: () => this.data.autoSubtitles,
      logLabel: "autoSubtitles",
      dispatch: (checked) =>
        this.events["change:autoSubtitles"].dispatch(checked),
    });
    this.dontTranslateLanguagesCheckbox.addEventListener(
      "change",
      async (checked) => {
        this.data.enabledDontTranslateLanguages = checked;
        this.dontTranslateLanguagesSelect.disabled = !checked;
        await votStorage.set(
          "enabledDontTranslateLanguages",
          this.data.enabledDontTranslateLanguages,
        );
        debug.log(
          "enabledDontTranslateLanguages value changed. New value:",
          checked,
        );
      },
    );
    this.dontTranslateLanguagesSelect.addEventListener(
      "selectItem",
      async (values) => {
        this.data.dontTranslateLanguages = values;
        await votStorage.set(
          "dontTranslateLanguages",
          this.data.dontTranslateLanguages,
        );
        debug.log("dontTranslateLanguages value changed. New value:", values);
      },
    );
    this.bindPersistedSetting({
      control: this.autoSetVolumeCheckbox,
      event: "change",
      apply: (checked) => {
        this.data.enabledAutoVolume = checked;
        this.autoSetVolumeSlider.disabled = !checked;
        this.smartDuckingCheckbox.disabled =
          !checked || Boolean(this.syncVolumeCheckbox?.checked);
      },
      storageKey: "enabledAutoVolume",
      readPersistedValue: () => this.data.enabledAutoVolume,
      logLabel: "enabledAutoVolume",
      afterPersist: async () => this.videoHandler?.setupAudioSettings?.(),
    });
    this.bindPersistedSetting({
      control: this.smartDuckingCheckbox,
      event: "change",
      apply: (checked) => {
        this.data.enabledSmartDucking = checked;
      },
      storageKey: "enabledSmartDucking",
      readPersistedValue: () => this.data.enabledSmartDucking,
      logLabel: "enabledSmartDucking",
      afterPersist: async () => this.videoHandler?.setupAudioSettings?.(),
    });
    this.bindPersistedSetting({
      control: this.autoSetVolumeSlider,
      event: "input",
      apply: (value) => {
        this.data.autoVolume = this.autoSetVolumeSliderLabel.value = value;
      },
      storageKey: "autoVolume",
      readPersistedValue: () => this.data.autoVolume,
      logLabel: "autoVolume",
    });
    this.bindPersistedSetting({
      control: this.showVideoVolumeSliderCheckbox,
      event: "change",
      apply: (checked) => {
        this.data.showVideoSlider = checked;
      },
      storageKey: "showVideoSlider",
      readPersistedValue: () => this.data.showVideoSlider,
      logLabel: "showVideoVolumeSlider",
      dispatch: (checked) =>
        this.events["change:showVideoVolume"].dispatch(checked),
    });
    this.bindPersistedSetting({
      control: this.audioBoosterCheckbox,
      event: "change",
      apply: (checked) => {
        this.data.audioBooster = checked;
      },
      storageKey: "audioBooster",
      readPersistedValue: () => this.data.audioBooster,
      logLabel: "audioBooster",
      dispatch: (checked) =>
        this.events["change:audioBooster"].dispatch(checked),
    });
    this.bindPersistedSetting({
      control: this.syncVolumeCheckbox,
      event: "change",
      apply: (checked) => {
        this.data.syncVolume = checked;
        this.autoSetVolumeSlider.disabled =
          !this.autoSetVolumeCheckbox?.checked;
        this.smartDuckingCheckbox.disabled =
          checked || !this.autoSetVolumeCheckbox?.checked;
        if (checked && this.smartDuckingCheckbox?.checked) {
          this.smartDuckingCheckbox.checked = false;
        }
      },
      storageKey: "syncVolume",
      readPersistedValue: () => this.data.syncVolume,
      logLabel: "syncVolume",
      dispatch: (checked) => this.events["change:syncVolume"].dispatch(checked),
    });
    this.bindPersistedSetting({
      control: this.downloadWithNameCheckbox,
      event: "change",
      apply: (checked) => {
        this.data.downloadWithName = checked;
      },
      storageKey: "downloadWithName",
      readPersistedValue: () => this.data.downloadWithName,
      logLabel: "downloadWithName",
    });
    this.bindPersistedSetting({
      control: this.sendNotifyOnCompleteCheckbox,
      event: "change",
      apply: (checked) => {
        this.data.sendNotifyOnComplete = checked;
      },
      storageKey: "sendNotifyOnComplete",
      readPersistedValue: () => this.data.sendNotifyOnComplete,
      logLabel: "sendNotifyOnComplete",
    });
    this.bindPersistedSetting({
      control: this.useLivelyVoiceCheckbox,
      event: "change",
      apply: (checked) => {
        this.data.useLivelyVoice = checked;
      },
      storageKey: "useLivelyVoice",
      readPersistedValue: () => this.data.useLivelyVoice,
      logLabel: "useLivelyVoice",
      dispatch: (checked) =>
        this.events["change:useLivelyVoice"].dispatch(checked),
    });
    this.bindPersistedSetting({
      control: this.useAudioDownloadCheckbox,
      event: "change",
      apply: (checked) => {
        this.data.useAudioDownload = checked;
      },
      storageKey: "useAudioDownload",
      readPersistedValue: () => this.data.useAudioDownload,
      logLabel: "useAudioDownload",
    });
    this.bindPersistedSetting({
      control: this.subtitlesDownloadFormatSelect,
      event: "selectItem",
      apply: (item) => {
        this.data.subtitlesDownloadFormat = item;
      },
      storageKey: "subtitlesDownloadFormat",
      readPersistedValue: () => this.data.subtitlesDownloadFormat,
      logLabel: "subtitlesDownloadFormat",
    });
    this.bindPersistedSetting({
      control: this.subtitlesHighlightWordsCheckbox,
      event: "change",
      apply: (checked) => {
        this.data.highlightWords = checked;
      },
      storageKey: "highlightWords",
      readPersistedValue: () => this.data.highlightWords,
      logLabel: "highlightWords",
      dispatch: (checked) =>
        this.events["change:subtitlesHighlightWords"].dispatch(checked),
    });
    this.subtitlesSmartLayoutCheckbox?.addEventListener("change", (checked) => {
      if (this.suppressSubtitlesSmartLayoutCheckboxChange) return;
      this.setSubtitlesSmartLayout(checked);
    });
    this.subtitlesMaxLengthSlider.addEventListener("input", (value) => {
      this.subtitlesMaxLengthSliderLabel.value = value;
      if ((this.data.subtitlesSmartLayout ?? true) === true) {
        this.setSubtitlesSmartLayout(false);
      }
      this.data.subtitlesMaxLength = value;
      this.scheduleStoragePersist(
        "subtitlesMaxLength",
        this.data.subtitlesMaxLength,
      );
      debug.log("subtitlesMaxLength value changed. New value:", value);
      this.events["input:subtitlesMaxLength"].dispatch(value);
    });
    this.subtitlesFontSizeSlider.addEventListener("input", (value) => {
      this.subtitlesFontSizeSliderLabel.value = value;
      if ((this.data.subtitlesSmartLayout ?? true) === true) {
        this.setSubtitlesSmartLayout(false);
      }
      this.data.subtitlesFontSize = value;
      this.scheduleStoragePersist(
        "subtitlesFontSize",
        this.data.subtitlesFontSize,
      );
      debug.log("subtitlesFontSize value changed. New value:", value);
      this.events["input:subtitlesFontSize"].dispatch(value);
    });
    this.subtitlesBackgroundOpacitySlider.addEventListener("input", (value) => {
      this.subtitlesBackgroundOpacitySliderLabel.value = value;
      this.data.subtitlesOpacity = value;
      this.scheduleStoragePersist(
        "subtitlesOpacity",
        this.data.subtitlesOpacity,
      );
      debug.log("subtitlesOpacity value changed. New value:", value);
      this.events["input:subtitlesBackgroundOpacity"].dispatch(value);
    });
    this.bindPersistedSetting({
      control: this.translateHotkeyButton,
      event: "change",
      apply: (key) => {
        this.data.translationHotkey = key;
      },
      storageKey: "translationHotkey",
      readPersistedValue: () => this.data.translationHotkey,
      logLabel: "translationHotkey",
    });
    this.bindPersistedSetting({
      control: this.subtitlesHotkeyButton,
      event: "change",
      apply: (key) => {
        this.data.subtitlesHotkey = key;
      },
      storageKey: "subtitlesHotkey",
      readPersistedValue: () => this.data.subtitlesHotkey,
      logLabel: "subtitlesHotkey",
    });
    this.proxyWorkerHostTextfield.addEventListener("change", async (value) => {
      this.data.proxyWorkerHost = value || proxyWorkerHost;
      await votStorage.set("proxyWorkerHost", this.data.proxyWorkerHost);
      debug.log(
        "proxyWorkerHost value changed. New value:",
        this.data.proxyWorkerHost,
      );
      this.events["change:proxyWorkerHost"].dispatch(value);
    });
    this.proxyTranslationStatusSelect.addEventListener(
      "selectItem",
      async (item) => {
        this.data.translateProxyEnabled = Number.parseInt(
          item,
          10,
        ) as TranslateProxyStatus;
        await votStorage.set(
          "translateProxyEnabled",
          this.data.translateProxyEnabled,
        );
        await votStorage.set("translateProxyEnabledDefault", false);
        debug.log(
          "translateProxyEnabled value changed. New value:",
          this.data.translateProxyEnabled,
        );
        this.events["select:proxyTranslationStatus"].dispatch(item);
      },
    );
    this.bindPersistedSetting({
      control: this.translateAPIErrorsCheckbox,
      event: "change",
      apply: (checked) => {
        this.data.translateAPIErrors = checked;
      },
      storageKey: "translateAPIErrors",
      readPersistedValue: () => this.data.translateAPIErrors,
      logLabel: "translateAPIErrors",
    });
    this.bindPersistedSetting({
      control: this.useNewAudioPlayerCheckbox,
      event: "change",
      apply: (checked) => {
        this.data.newAudioPlayer = checked;
        this.onlyBypassMediaCSPCheckbox.disabled =
          this.onlyBypassMediaCSPCheckbox.hidden = !checked;
      },
      storageKey: "newAudioPlayer",
      readPersistedValue: () => this.data.newAudioPlayer,
      logLabel: "newAudioPlayer",
      dispatch: (checked) =>
        this.events["change:useNewAudioPlayer"].dispatch(checked),
    });
    this.bindPersistedSetting({
      control: this.onlyBypassMediaCSPCheckbox,
      event: "change",
      apply: (checked) => {
        this.data.onlyBypassMediaCSP = checked;
      },
      storageKey: "onlyBypassMediaCSP",
      readPersistedValue: () => this.data.onlyBypassMediaCSP,
      logLabel: "onlyBypassMediaCSP",
      dispatch: (checked) =>
        this.events["change:onlyBypassMediaCSP"].dispatch(checked),
    });
    this.bindPersistedSetting({
      control: this.translationTextServiceSelect,
      event: "selectItem",
      apply: (item) => {
        this.data.translationService = item;
      },
      storageKey: "translationService",
      readPersistedValue: () => this.data.translationService,
      logLabel: "translationService",
      dispatch: (item) =>
        this.events["select:translationTextService"].dispatch(item),
    });
    this.bindPersistedSetting({
      control: this.detectServiceSelect,
      event: "selectItem",
      apply: (item) => {
        this.data.detectService = item;
      },
      storageKey: "detectService",
      readPersistedValue: () => this.data.detectService,
      logLabel: "detectService",
    });
    this.bindPersistedSetting({
      control: this.showPiPButtonCheckbox,
      event: "change",
      apply: (checked) => {
        this.data.showPiPButton = checked;
      },
      storageKey: "showPiPButton",
      readPersistedValue: () => this.data.showPiPButton,
      logLabel: "showPiPButton",
      dispatch: (checked) =>
        this.events["change:showPiPButton"].dispatch(checked),
    });
    this.autoHideButtonDelaySlider.addEventListener("input", (value) => {
      this.autoHideButtonDelaySliderLabel.value = value;
      const newDelay = Math.round(value * 1000);
      debug.log("autoHideButtonDelay value changed. New value:", newDelay);
      this.data.autoHideButtonDelay = newDelay;
      this.scheduleStoragePersist(
        "autoHideButtonDelay",
        this.data.autoHideButtonDelay,
      );
      this.events["input:autoHideButtonDelay"].dispatch(value);
    });
    this.bindPersistedSetting({
      control: this.buttonPositionSelect,
      event: "selectItem",
      apply: (item) => {
        this.data.buttonPos = item;
      },
      storageKey: "buttonPos",
      readPersistedValue: () => this.data.buttonPos,
      logLabel: "buttonPos",
      dispatch: (item) => this.events["select:buttonPosition"].dispatch(item),
    });
    this.menuLanguageSelect.addEventListener("selectItem", async (item) => {
      const result = await localizationProvider.changeLang(item);
      if (!result) return;
      this.data.localeUpdatedAt = await votStorage.get("localeUpdatedAt", 0);
      this.events["select:menuLanguage"].dispatch(item);
    });
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
    this.dialog?.remove();
    for (const tooltip of [
      this.accountButtonRefreshTooltip,
      this.accountButtonTokenTooltip,
      this.audioBoosterTooltip,
      this.useLivelyVoiceTooltip,
      this.useAudioDownloadCheckboxTooltip,
      this.useNewAudioPlayerTooltip,
      this.onlyBypassMediaCSPTooltip,
      this.translationTextServiceTooltip,
      this.proxyTranslationStatusSelectTooltip,
      this.buttonPositionTooltip,
    ]) {
      tooltip?.release();
    }
  }
  private doReleaseUIEvents(): void {
    this.flushStoragePersists();
    for (const event of Object.values(this.events)) event.clear();
  }
  releaseUI(initialized = false) {
    if (!this.isInitialized())
      throw new Error("[VOT] SettingsView isn't initialized");
    this.doReleaseUI();
    this.initialized = initialized;
    return this;
  }
  releaseUIEvents(initialized = false) {
    if (!this.isInitialized())
      throw new Error("[VOT] SettingsView isn't initialized");
    this.doReleaseUIEvents();
    this.initialized = initialized;
    return this;
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
    const loggedIn = !!this.data.account?.token;
    this.accountButton.avatarId = this.data.account?.avatarId;
    this.useLivelyVoiceTooltip.hidden = this.accountButton.loggedIn = loggedIn;
    this.accountButton.username = this.data.account?.username;
    this.useLivelyVoiceCheckbox.disabled = !loggedIn;
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
