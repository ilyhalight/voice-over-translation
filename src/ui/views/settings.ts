import { html } from "lit-html";
import { availableLangs, subtitlesFormats } from "@vot.js/shared/consts";
import type { SubtitleFormat } from "@vot.js/shared/types/subs";
import type { TMInfoScriptMeta } from "@toil/gm-types/types/info/tampermonkey";

import ui from "../../ui";
import Tooltip from "../components/tooltip";
import Select from "../components/select";
import Slider from "../components/slider";
import Dialog from "../components/dialog";
import Checkbox from "../components/checkbox";
import HotkeyButton from "../components/hotkeyButton";
import SliderLabel from "../components/sliderLabel";
import Details from "../components/details";
import Textfield from "../components/textfield";

import type { Locale } from "../../types/localization";
import type {
  LanguageSelectKey,
  SelectItem,
} from "../../types/components/select";
import type {
  Account,
  StorageData,
  TranslateProxyStatus,
} from "../../types/storage";
import type { SettingsViewProps } from "../../types/views/settings";
import { countryCode, type VideoHandler } from "../..";
import type {
  DetectService,
  TranslateService,
} from "../../types/translateApis";
import debug from "../../utils/debug";
import { detectServices, translateServices } from "../../utils/translateApis";
import {
  authServerUrl,
  defaultAutoHideDelay,
  defaultAutoVolume,
  defaultDetectService,
  defaultTranslationService,
  m3u8ProxyHost,
  proxyOnlyCountries,
  proxyWorkerHost,
} from "../../config/config";
import { EventImpl } from "../../core/eventImpl";
import { votStorage } from "../../utils/storage";
import { localizationProvider } from "../../localization/localizationProvider";
import { positions, type Position } from "../../types/components/votButton";
import {
  browserInfo,
  isPiPAvailable,
  isProxyOnlyExtension,
} from "../../utils/utils";
import { HELP_ICON, WARNING_ICON } from "../icons";
import Label from "../components/label";
import AccountButton from "../components/accountButton";

export class SettingsView {
  globalPortal: HTMLElement;

  private initialized = false;
  private data: Partial<StorageData>;
  private videoHandler?: VideoHandler;

  private onClickBugReport = new EventImpl();
  private onClickResetSettings = new EventImpl();

  private onUpdateAccount = new EventImpl();

  private onChangeAutoTranslate = new EventImpl();
  private onChangeShowVideoVolume = new EventImpl();
  private onChangeAudioBooster = new EventImpl();
  private onChangeUseLivelyVoice = new EventImpl();
  private onChangeSubtitlesHighlightWords = new EventImpl();
  private onChangeProxyWorkerHost = new EventImpl();
  private onChangeUseNewAudioPlayer = new EventImpl();
  private onChangeOnlyBypassMediaCSP = new EventImpl();
  private onChangeShowPiPButton = new EventImpl();

  private onInputSubtitlesMaxLength = new EventImpl();
  private onInputSubtitlesFontSize = new EventImpl();
  private onInputSubtitlesBackgroundOpacity = new EventImpl();
  private onInputAutoHideButtonDelay = new EventImpl();

  private onSelectItemProxyTranslationStatus = new EventImpl();
  private onSelectItemTranslationTextService = new EventImpl();
  private onSelectItemButtonPosition = new EventImpl();
  private onSelectItemMenuLanguage = new EventImpl();

  dialog?: Dialog;
  accountHeader?: HTMLElement;
  accountButton?: AccountButton;
  accountButtonRefreshTooltip?: Tooltip;
  translationSettingsHeader?: HTMLElement;
  autoTranslateCheckbox?: Checkbox;
  dontTranslateLanguagesCheckbox?: Checkbox;
  dontTranslateLanguagesSelect?: Select<LanguageSelectKey, true>;
  autoSetVolumeSliderLabel?: SliderLabel;
  autoSetVolumeCheckbox?: Checkbox;
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
  subtitlesSettingsHeader?: HTMLElement;
  subtitlesDownloadFormatSelectLabel?: Label;
  subtitlesDownloadFormatSelect?: Select<SubtitleFormat>;
  subtitlesDesignDetails?: Details;
  hotkeysSettingsHeader?: HTMLElement;
  translateHotkeyButton?: HotkeyButton;
  proxySettingsHeader?: HTMLElement;
  proxyM3U8HostTextfield?: Textfield;
  proxyWorkerHostTextfield?: Textfield;
  proxyTranslationStatusSelectLabel?: Label;
  proxyTranslationStatusSelectTooltip?: Tooltip;
  proxyTranslationStatusSelect?: Select;
  miscSettingsHeader?: HTMLElement;
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
  appearanceDetails?: Details;
  aboutExtensionDetails?: Details;
  bugReportButton?: HTMLElement;
  resetSettingsButton?: HTMLElement;

  constructor({ globalPortal, data = {}, videoHandler }: SettingsViewProps) {
    this.globalPortal = globalPortal;
    this.data = data;
    this.videoHandler = videoHandler;
  }

  isInitialized(): this is {
    // #region Settings type
    dialog: Dialog;
    // #region Settings Account type
    accountHeader: HTMLElement;
    accountButton: AccountButton;
    accountButtonRefreshTooltip: Tooltip;
    // #endregion Settings Account type
    // #region Settings Translation type
    translationSettingsHeader: HTMLElement;
    autoTranslateCheckbox: Checkbox;
    dontTranslateLanguagesCheckbox: Checkbox;
    dontTranslateLanguagesSelect: Select<LanguageSelectKey, true>;
    autoSetVolumeSliderLabel: SliderLabel;
    autoSetVolumeCheckbox: Checkbox;
    autoSetVolumeSlider: Slider;
    showVideoVolumeSliderCheckbox: Checkbox;
    audioBoosterCheckbox: Checkbox;
    syncVolumeCheckbox: Checkbox;
    downloadWithNameCheckbox: Checkbox;
    sendNotifyOnCompleteCheckbox: Checkbox;
    useLivelyVoiceCheckbox: Checkbox;
    useLivelyVoiceTooltip: Tooltip;
    useAudioDownloadCheckbox: Checkbox;
    useAudioDownloadCheckboxLabel: Label;
    useAudioDownloadCheckboxTooltip: Tooltip;
    // #endregion Settings Translation type
    // #region Settings Subtitles type
    subtitlesSettingsHeader: HTMLElement;
    subtitlesDownloadFormatSelectLabel: Label;
    subtitlesDownloadFormatSelect: Select<SubtitleFormat>;
    subtitlesDesignDetails: Details;
    // #endregion Settings Subtitles type
    // #region Settings Hotkeys type
    hotkeysSettingsHeader: HTMLElement;
    translateHotkeyButton: HotkeyButton;
    // #endregion Settings Hotkeys type
    // #region Settings Proxy type
    proxySettingsHeader: HTMLElement;
    proxyM3U8HostTextfield: Textfield;
    proxyWorkerHostTextfield: Textfield;
    proxyTranslationStatusSelectLabel: Label;
    proxyTranslationStatusSelect: Select;
    // #endregion Settings Proxy type
    // #region Settings Misc type
    miscSettingsHeader: HTMLElement;
    translationTextServiceLabel: Label;
    translateAPIErrorsCheckbox: Checkbox;
    useNewAudioPlayerCheckbox: Checkbox;
    useNewAudioPlayerTooltip: Tooltip;
    onlyBypassMediaCSPCheckbox: Checkbox;
    onlyBypassMediaCSPTooltip: Tooltip;
    translationTextServiceSelect: Select<TranslateService>;
    translationTextServiceTooltip: Tooltip;
    detectServiceLabel: Label;
    detectServiceSelect: Select<DetectService>;
    appearanceDetails: Details;
    aboutExtensionDetails: Details;
    bugReportButton: HTMLElement;
    resetSettingsButton: HTMLElement;
    // #endregion Settings Misc type
    // #endregion Settings type
  } {
    return this.initialized;
  }

  initUI() {
    if (this.isInitialized()) {
      throw new Error("[VOT] SettingsView is already initialized");
    }

    this.initialized = true;

    this.dialog = new Dialog({
      titleHtml: localizationProvider.get("VOTSettings"),
    });
    this.globalPortal.appendChild(this.dialog.container);

    // #region Account
    this.accountHeader = ui.createHeader(
      localizationProvider.get("VOTMyAccount"),
    );
    this.accountButton = new AccountButton({
      avatarId: this.data.account?.avatarId,
      username: this.data.account?.username,
      loggedIn: !!this.data.account?.token,
    });
    if (votStorage.isSupportOnlyLS()) {
      // LocalStorage can't support sync settings between sites
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

    // #endregion Account
    // #region Translation
    this.translationSettingsHeader = ui.createHeader(
      localizationProvider.get("translationSettings"),
    );

    this.autoTranslateCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTAutoTranslate"),
      checked: this.data.autoTranslate,
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
          .join(", ") ??
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
    });

    this.showVideoVolumeSliderCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("showVideoVolumeSlider"),
      checked: this.data.showVideoSlider,
    });

    this.audioBoosterCheckbox = new Checkbox({
      labelHtml: localizationProvider.get("VOTAudioBooster"),
      checked: this.data.audioBooster,
    });
    if (!this.videoHandler?.audioContext) {
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

    this.useAudioDownloadCheckboxTooltip = new Tooltip({
      target: this.useAudioDownloadCheckboxLabel.container,
      content: localizationProvider.get("VOTUseAudioDownloadWarning"),
      position: "bottom",
      backgroundColor: "var(--vot-helper-ondialog)",
      parentElement: this.globalPortal,
    });

    this.dialog.bodyContainer.append(
      this.accountHeader,
      this.accountButton.container,
      this.translationSettingsHeader,
      this.autoTranslateCheckbox.container,
      this.dontTranslateLanguagesSelect.container,
      this.autoSetVolumeSlider.container,
      this.showVideoVolumeSliderCheckbox.container,
      this.audioBoosterCheckbox.container,
      this.syncVolumeCheckbox.container,
      this.downloadWithNameCheckbox.container,
      this.sendNotifyOnCompleteCheckbox.container,
      this.useLivelyVoiceCheckbox.container,
      this.useAudioDownloadCheckbox.container,
    );

    // #endregion Translation
    // #region Subtitles

    this.subtitlesSettingsHeader = ui.createHeader(
      localizationProvider.get("subtitlesSettings"),
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

    this.subtitlesDesignDetails = new Details({
      titleHtml: localizationProvider.get("VOTSubtitlesDesign"),
    });

    this.dialog.bodyContainer.append(
      this.subtitlesSettingsHeader,
      this.subtitlesDownloadFormatSelect.container,
      this.subtitlesDesignDetails.container,
    );

    // #endregion Subtitles
    // #region Hotkeys
    this.hotkeysSettingsHeader = ui.createHeader(
      localizationProvider.get("hotkeysSettings"),
    );
    this.translateHotkeyButton = new HotkeyButton({
      labelHtml: "Translate",
      key: this.data.translationHotkey,
    });

    this.dialog.bodyContainer.append(
      this.hotkeysSettingsHeader,
      this.translateHotkeyButton.container,
    );

    // #endregion Hotkeys
    // #region Proxy

    this.proxySettingsHeader = ui.createHeader(
      localizationProvider.get("proxySettings"),
    );

    this.proxyM3U8HostTextfield = new Textfield({
      labelHtml: localizationProvider.get("VOTM3u8ProxyHost"),
      value: this.data.m3u8ProxyHost,
      placeholder: m3u8ProxyHost,
    });

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

    this.dialog.bodyContainer.append(
      this.proxySettingsHeader,
      this.proxyM3U8HostTextfield.container,
      this.proxyWorkerHostTextfield.container,
      this.proxyTranslationStatusSelect.container,
    );

    // #endregion Proxy
    // #region Misc

    this.miscSettingsHeader = ui.createHeader(
      localizationProvider.get("miscSettings"),
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
    if (!this.videoHandler?.audioContext) {
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
    if (!this.videoHandler?.audioContext) {
      this.onlyBypassMediaCSPTooltip = new Tooltip({
        target: this.onlyBypassMediaCSPCheckbox.container,
        content: localizationProvider.get("VOTNeedWebAudioAPI"),
        position: "bottom",
        backgroundColor: "var(--vot-helper-ondialog)",
        parentElement: this.globalPortal,
      });
    }
    this.onlyBypassMediaCSPCheckbox.disabled =
      !this.data.newAudioPlayer && !!this.videoHandler?.audioContext;
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
      selectTitle: localizationProvider.get(`services.${detectService}`),
      dialogTitle: localizationProvider.get("VOTDetectService"),
      dialogParent: this.globalPortal,
      labelElement: this.detectServiceLabel.container,
      items: detectServices.map<SelectItem<DetectService>>((service) => ({
        label: localizationProvider.get(`services.${service}`),
        value: service,
        selected: service === detectService,
      })),
    });

    this.appearanceDetails = new Details({
      titleHtml: localizationProvider.get("appearance"),
    });

    this.aboutExtensionDetails = new Details({
      titleHtml: localizationProvider.get("aboutExtension"),
    });

    this.bugReportButton = ui.createOutlinedButton(
      localizationProvider.get("VOTBugReport"),
    );
    this.resetSettingsButton = ui.createButton(
      localizationProvider.get("resetSettings"),
    );

    this.dialog.bodyContainer.append(
      this.miscSettingsHeader,
      this.translateAPIErrorsCheckbox.container,
      this.useNewAudioPlayerCheckbox.container,
      this.onlyBypassMediaCSPCheckbox.container,
      this.translationTextServiceSelect.container,
      this.detectServiceSelect.container,
      this.appearanceDetails.container,
      this.aboutExtensionDetails.container,
      this.bugReportButton,
      this.resetSettingsButton,
    );

    // #endregion Misc
    return this;
  }

  initUIEvents() {
    if (!this.isInitialized()) {
      throw new Error("[VOT] SettingsView isn't initialized");
    }

    // #region [Events]
    this.accountButton.addEventListener("click", async () => {
      if (votStorage.isSupportOnlyLS()) {
        return;
      }

      if (this.accountButton.loggedIn) {
        await votStorage.delete("account");
        this.data.account = {};
        return this.updateAccountInfo();
      }

      window.open(authServerUrl, "_blank")?.focus();
    });
    this.accountButton.addEventListener("refresh", async () => {
      if (votStorage.isSupportOnlyLS()) {
        return;
      }

      this.data.account = await votStorage.get("account", {});
      this.updateAccountInfo();
    });

    // #region [Events] Translation
    this.autoTranslateCheckbox.addEventListener("change", async (checked) => {
      this.data.autoTranslate = checked;
      await votStorage.set("autoTranslate", this.data.autoTranslate);
      debug.log("autoTranslate value changed. New value:", checked);
      this.onChangeAutoTranslate.dispatch(checked);
    });

    this.dontTranslateLanguagesCheckbox.addEventListener(
      "change",
      async (checked) => {
        this.data.enabledDontTranslateLanguages = checked;
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

    this.autoSetVolumeCheckbox.addEventListener("change", async (checked) => {
      this.data.enabledAutoVolume = checked;
      await votStorage.set("enabledAutoVolume", this.data.enabledAutoVolume);
      debug.log("enabledAutoVolume value changed. New value:", checked);
    });

    this.autoSetVolumeSlider.addEventListener("input", async (value) => {
      this.data.autoVolume = this.autoSetVolumeSliderLabel.value = value;
      await votStorage.set("autoVolume", this.data.autoVolume);
      debug.log("autoVolume value changed. New value:", value);
    });

    this.showVideoVolumeSliderCheckbox.addEventListener(
      "change",
      async (checked) => {
        this.data.showVideoSlider = checked;
        await votStorage.set("showVideoSlider", this.data.showVideoSlider);
        debug.log("showVideoVolumeSlider value changed. New value:", checked);
        this.onChangeShowVideoVolume.dispatch(checked);
      },
    );

    this.audioBoosterCheckbox.addEventListener("change", async (checked) => {
      this.data.audioBooster = checked;
      await votStorage.set("audioBooster", this.data.audioBooster);
      debug.log("audioBooster value changed. New value:", checked);
      this.onChangeAudioBooster.dispatch(checked);
    });

    this.syncVolumeCheckbox.addEventListener("change", async (checked) => {
      this.data.syncVolume = checked;
      await votStorage.set("syncVolume", this.data.syncVolume);
      debug.log("syncVolume value changed. New value:", checked);
    });

    this.downloadWithNameCheckbox.addEventListener(
      "change",
      async (checked) => {
        this.data.downloadWithName = checked;
        await votStorage.set("downloadWithName", this.data.downloadWithName);
        debug.log("downloadWithName value changed. New value:", checked);
      },
    );

    this.sendNotifyOnCompleteCheckbox.addEventListener(
      "change",
      async (checked) => {
        this.data.sendNotifyOnComplete = checked;
        await votStorage.set(
          "sendNotifyOnComplete",
          this.data.sendNotifyOnComplete,
        );
        debug.log("sendNotifyOnComplete value changed. New value:", checked);
      },
    );

    this.useLivelyVoiceCheckbox.addEventListener("change", async (checked) => {
      this.data.useLivelyVoice = checked;
      await votStorage.set("useLivelyVoice", this.data.useLivelyVoice);
      debug.log("useLivelyVoice value changed. New value:", checked);
      this.onChangeUseLivelyVoice.dispatch(checked);
    });

    this.useAudioDownloadCheckbox.addEventListener(
      "change",
      async (checked) => {
        this.data.useAudioDownload = checked;
        await votStorage.set("useAudioDownload", this.data.useAudioDownload);
        debug.log("useAudioDownload value changed. New value:", checked);
      },
    );

    // #endregion [Events] Translation
    // #region [Events] Subtitles
    this.subtitlesDownloadFormatSelect.addEventListener(
      "selectItem",
      async (item) => {
        this.data.subtitlesDownloadFormat = item;
        await votStorage.set(
          "subtitlesDownloadFormat",
          this.data.subtitlesDownloadFormat,
        );
        debug.log("subtitlesDownloadFormat value changed. New value:", item);
      },
    );
    this.subtitlesDesignDetails.addEventListener("click", () => {
      const dialog = new Dialog({
        titleHtml: localizationProvider.get("VOTSubtitlesDesign"),
        isTemp: true,
      });
      this.globalPortal.appendChild(dialog.container);

      // #region [Events] Subtitles Dialog UI
      const subtitlesHighlightWordsCheckbox = new Checkbox({
        labelHtml: localizationProvider.get("VOTHighlightWords"),
        checked: this.data.highlightWords,
      });

      const subtitlesMaxLength = this.data.subtitlesMaxLength ?? 300;
      const subtitlesMaxLengthSliderLabel = new SliderLabel({
        labelText: localizationProvider.get("VOTSubtitlesMaxLength"),
        labelEOL: ":",
        symbol: "",
        value: subtitlesMaxLength,
      });
      const subtitlesMaxLengthSlider = new Slider({
        labelHtml: subtitlesMaxLengthSliderLabel.container,
        value: subtitlesMaxLength,
        min: 50,
        max: 300,
      });

      const subtitlesFontSize = this.data.subtitlesFontSize ?? 20;
      const subtitlesFontSizeSliderLabel = new SliderLabel({
        labelText: localizationProvider.get("VOTSubtitlesFontSize"),
        labelEOL: ":",
        symbol: "px",
        value: subtitlesFontSize,
      });
      const subtitlesFontSizeSlider = new Slider({
        labelHtml: subtitlesFontSizeSliderLabel.container,
        value: subtitlesFontSize,
        min: 8,
        max: 50,
      });

      const subtitlesBackgroundOpacity = this.data.subtitlesOpacity ?? 20;
      const subtitlesBackgroundOpacitySliderLabel = new SliderLabel({
        labelText: localizationProvider.get("VOTSubtitlesOpacity"),
        labelEOL: ":",
        value: subtitlesBackgroundOpacity,
      });

      const subtitlesBackgroundOpacitySlider = new Slider({
        labelHtml: subtitlesBackgroundOpacitySliderLabel.container,
        value: subtitlesBackgroundOpacity,
      });

      dialog.bodyContainer.append(
        subtitlesHighlightWordsCheckbox.container,
        subtitlesMaxLengthSlider.container,
        subtitlesFontSizeSlider.container,
        subtitlesBackgroundOpacitySlider.container,
      );

      // #endregion [Events] Subtitles Dialog UI
      // #region [Events] Subtitles Dialog Events
      subtitlesHighlightWordsCheckbox.addEventListener(
        "change",
        async (checked) => {
          this.data.highlightWords = checked;
          await votStorage.set("highlightWords", this.data.highlightWords);
          debug.log("highlightWords value changed. New value:", checked);
          this.onChangeSubtitlesHighlightWords.dispatch(checked);
        },
      );
      subtitlesMaxLengthSlider.addEventListener("input", (value) => {
        subtitlesMaxLengthSliderLabel.value = value;
        this.data.subtitlesMaxLength = value;
        votStorage.set("subtitlesMaxLength", this.data.subtitlesMaxLength);
        debug.log("highlightWords value changed. New value:", value);
        this.onInputSubtitlesMaxLength.dispatch(value);
      });

      subtitlesFontSizeSlider.addEventListener("input", (value) => {
        subtitlesFontSizeSliderLabel.value = value;
        this.data.subtitlesFontSize = value;
        votStorage.set("subtitlesFontSize", this.data.subtitlesFontSize);
        debug.log("subtitlesFontSize value changed. New value:", value);
        this.onInputSubtitlesFontSize.dispatch(value);
      });

      subtitlesBackgroundOpacitySlider.addEventListener("input", (value) => {
        subtitlesBackgroundOpacitySliderLabel.value = value;
        this.data.subtitlesOpacity = value;
        votStorage.set("subtitlesOpacity", this.data.subtitlesOpacity);
        debug.log("subtitlesOpacity value changed. New value:", value);
        this.onInputSubtitlesBackgroundOpacity.dispatch(value);
      });

      // #endregion [Events] Subtitles Dialog Events
    });

    // #endregion [Events] Settings Subtitles
    // #region [Events] Hotkeys
    this.translateHotkeyButton.addEventListener("change", async (key) => {
      this.data.translationHotkey = key;
      await votStorage.set("translationHotkey", this.data.translationHotkey);
      debug.log("translationHotkey value changed. New value:", key);
    });

    // #endregion [Events] Hotkeys
    // #region [Events] Proxy
    this.proxyM3U8HostTextfield.addEventListener("change", async (value) => {
      this.data.m3u8ProxyHost = value || m3u8ProxyHost;
      await votStorage.set("m3u8ProxyHost", this.data.m3u8ProxyHost);
      debug.log(
        "m3u8ProxyHost value changed. New value:",
        this.data.m3u8ProxyHost,
      );
    });

    this.proxyWorkerHostTextfield.addEventListener("change", async (value) => {
      this.data.proxyWorkerHost = value || proxyWorkerHost;
      await votStorage.set("proxyWorkerHost", this.data.proxyWorkerHost);
      debug.log(
        "proxyWorkerHost value changed. New value:",
        this.data.proxyWorkerHost,
      );
      this.onChangeProxyWorkerHost.dispatch(value);
    });
    this.proxyTranslationStatusSelect.addEventListener(
      "selectItem",
      async (item) => {
        this.data.translateProxyEnabled = Number.parseInt(
          item,
        ) as TranslateProxyStatus;
        await votStorage.set(
          "translateProxyEnabled",
          this.data.translateProxyEnabled,
        );
        // User has set the value manually, we don't need to set the default value
        await votStorage.set("translateProxyEnabledDefault", false);
        debug.log(
          "translateProxyEnabled value changed. New value:",
          this.data.translateProxyEnabled,
        );
        this.onSelectItemProxyTranslationStatus.dispatch(item);
      },
    );

    // #endregion [Events] Proxy
    // #region [Events] Misc
    this.translateAPIErrorsCheckbox.addEventListener(
      "change",
      async (checked) => {
        this.data.translateAPIErrors = checked;
        await votStorage.set(
          "translateAPIErrors",
          this.data.translateAPIErrors,
        );
        debug.log("translateAPIErrors value changed. New value:", checked);
      },
    );

    this.useNewAudioPlayerCheckbox.addEventListener(
      "change",
      async (checked) => {
        this.data.newAudioPlayer = checked;
        await votStorage.set("newAudioPlayer", this.data.newAudioPlayer);
        debug.log("newAudioPlayer value changed. New value:", checked);
        this.onlyBypassMediaCSPCheckbox.disabled =
          this.onlyBypassMediaCSPCheckbox.hidden = !checked;
        this.onChangeUseNewAudioPlayer.dispatch(checked);
      },
    );

    this.onlyBypassMediaCSPCheckbox.addEventListener(
      "change",
      async (checked) => {
        this.data.onlyBypassMediaCSP = checked;
        await votStorage.set(
          "onlyBypassMediaCSP",
          this.data.onlyBypassMediaCSP,
        );
        debug.log("onlyBypassMediaCSP value changed. New value:", checked);
        this.onChangeOnlyBypassMediaCSP.dispatch(checked);
      },
    );

    this.translationTextServiceSelect.addEventListener(
      "selectItem",
      async (item) => {
        this.data.translationService = item;
        await votStorage.set(
          "translationService",
          this.data.translationService,
        );
        debug.log("translationService value changed. New value:", item);
        this.onSelectItemTranslationTextService.dispatch(item);
      },
    );

    this.detectServiceSelect.addEventListener("selectItem", async (item) => {
      this.data.detectService = item;
      await votStorage.set("detectService", this.data.detectService);
      debug.log("detectService value changed. New value:", item);
    });

    this.appearanceDetails.addEventListener("click", () => {
      const dialog = new Dialog({
        titleHtml: localizationProvider.get("appearance"),
        isTemp: true,
      });
      this.globalPortal.appendChild(dialog.container);

      // #region [Events] Misc Dialog UI
      const showPiPButtonCheckbox = new Checkbox({
        labelHtml: localizationProvider.get("VOTShowPiPButton"),
        checked: this.data.showPiPButton,
      });
      showPiPButtonCheckbox.hidden = !isPiPAvailable();

      const autoHideButtonDelay =
        (this.data.autoHideButtonDelay ?? defaultAutoHideDelay) / 1000;
      const autoHideButtonDelaySliderLabel = new SliderLabel({
        labelText: localizationProvider.get("autoHideButtonDelay"),
        labelEOL: ":",
        symbol: ` ${localizationProvider.get("secs")}`,
        value: autoHideButtonDelay,
      });

      const autoHideButtonDelaySlider = new Slider({
        labelHtml: autoHideButtonDelaySliderLabel.container,
        value: autoHideButtonDelay,
        min: 0.1,
        max: 3,
        step: 0.1,
      });

      const buttonPositionSelectLabel = new Label({
        labelText: localizationProvider.get("buttonPositionInWidePlayer"),
        icon: HELP_ICON,
      });
      const buttonPositionSelect = new Select({
        selectTitle: localizationProvider.get("buttonPositionInWidePlayer"),
        dialogTitle: localizationProvider.get("buttonPositionInWidePlayer"),
        labelElement: buttonPositionSelectLabel.container,
        dialogParent: this.globalPortal,
        items: positions.map<SelectItem<Position>>((position) => ({
          label: localizationProvider.get(`position.${position}`),
          value: position,
          selected: position === this.data.buttonPos,
        })),
      });
      const buttonPositionTooltip = new Tooltip({
        target: buttonPositionSelectLabel.icon,
        content: localizationProvider.get("minButtonPositionContainer"),
        position: "bottom",
        backgroundColor: "var(--vot-helper-ondialog)",
        parentElement: this.globalPortal,
      });

      const menuLanguageSelectLabel = new Label({
        labelText: localizationProvider.get("VOTMenuLanguage"),
      });
      const menuLanguageSelect = new Select({
        selectTitle: localizationProvider.get(
          `langs.${localizationProvider.getLangOverride() as Locale | "auto"}`,
        ),
        dialogTitle: localizationProvider.get("VOTMenuLanguage"),
        labelElement: menuLanguageSelectLabel.container,
        dialogParent: this.globalPortal,
        items: Select.genLanguageItems(
          localizationProvider.getAvailableLangs(),
          localizationProvider.getLangOverride(),
        ),
      });

      dialog.bodyContainer.append(
        showPiPButtonCheckbox.container,
        autoHideButtonDelaySlider.container,
        buttonPositionSelect.container,
        menuLanguageSelect.container,
      );

      // #endregion [Events] Misc Dialog UI
      // #region [Events] Misc Dialog Events
      dialog.addEventListener("close", () => {
        buttonPositionTooltip.release();
      });

      showPiPButtonCheckbox.addEventListener("change", async (checked) => {
        this.data.showPiPButton = checked;
        await votStorage.set("showPiPButton", this.data.showPiPButton);
        debug.log("showPiPButton value changed. New value:", checked);
        this.onChangeShowPiPButton.dispatch(checked);
      });

      autoHideButtonDelaySlider.addEventListener("input", async (value) => {
        autoHideButtonDelaySliderLabel.value = value;
        // convert seconds to milliseconds
        const newDelay = Math.round(value * 1000);
        debug.log("autoHideButtonDelay value changed. New value:", newDelay);
        this.data.autoHideButtonDelay = newDelay;
        await votStorage.set(
          "autoHideButtonDelay",
          this.data.autoHideButtonDelay,
        );
        this.onInputAutoHideButtonDelay.dispatch(value);
      });

      buttonPositionSelect.addEventListener("selectItem", async (item) => {
        debug.log("buttonPos value changed. New value:", item);
        this.data.buttonPos = item;
        await votStorage.set("buttonPos", this.data.buttonPos);
        this.onSelectItemButtonPosition.dispatch(item);
      });

      menuLanguageSelect.addEventListener("selectItem", async (item) => {
        const result = await localizationProvider.changeLang(item);
        if (!result) {
          return;
        }

        this.data.localeUpdatedAt = await votStorage.get("localeUpdatedAt", 0);
        this.onSelectItemMenuLanguage.dispatch(item);
      });

      // #endregion [Events] Misc Dialog Events
    });

    this.aboutExtensionDetails.addEventListener("click", () => {
      const dialog = new Dialog({
        titleHtml: localizationProvider.get("aboutExtension"),
        isTemp: true,
      });
      this.globalPortal.appendChild(dialog.container);

      const versionInfo = ui.createInformation(
        `${localizationProvider.get("VOTVersion")}:`,
        GM_info.script.version || localizationProvider.get("notFound"),
      );

      const authorsInfo = ui.createInformation(
        `${localizationProvider.get("VOTAuthors")}:`,
        (GM_info.script as TMInfoScriptMeta).author ??
          localizationProvider.get("notFound"),
      );

      const loaderInfo = ui.createInformation(
        `${localizationProvider.get("VOTLoader")}:`,
        `${GM_info.scriptHandler} v${GM_info.version}`,
      );

      const userBrowserInfo = ui.createInformation(
        `${localizationProvider.get("VOTBrowser")}:`,
        `${browserInfo.browser.name} ${browserInfo.browser.version} (${browserInfo.os.name} ${browserInfo.os.version})`,
      );

      const localeUpdatedAt = new Date(
        (this.data.localeUpdatedAt ?? 0) * 1000,
      ).toLocaleString();
      const localeInfoValue = html`${this.data.localeHash}<br />(${localizationProvider.get(
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

      dialog.bodyContainer.append(
        versionInfo.container,
        authorsInfo.container,
        loaderInfo.container,
        userBrowserInfo.container,
        localeInfo.container,
        updateLocaleFilesButton,
      );

      updateLocaleFilesButton.addEventListener("click", async () => {
        await votStorage.set("localeHash", "");
        await localizationProvider.update(true);
        window.location.reload();
      });
    });

    this.bugReportButton.addEventListener("click", () => {
      this.onClickBugReport.dispatch();
    });

    this.resetSettingsButton.addEventListener("click", () => {
      this.onClickResetSettings.dispatch();
    });

    // #endregion [Events]
    return this;
  }

  addEventListener(
    type: "click:bugReport",
    listener: (checked: boolean) => void,
  ): this;
  addEventListener(
    type: "click:resetSettings",
    listener: (checked: boolean) => void,
  ): this;
  addEventListener(
    type: "update:account",
    listener: (account: Partial<Account> | undefined) => void,
  ): this;
  addEventListener(
    type: "change:autoTranslate",
    listener: (checked: boolean) => void,
  ): this;
  addEventListener(
    type: "change:showVideoVolume",
    listener: (checked: boolean) => void,
  ): this;
  addEventListener(
    type: "change:audioBuster",
    listener: (checked: boolean) => void,
  ): this;
  addEventListener(
    type: "change:useLivelyVoice",
    listener: (checked: boolean) => void,
  ): this;
  addEventListener(
    type: "change:subtitlesHighlightWords",
    listener: (checked: boolean) => void,
  ): this;
  addEventListener(
    type: "change:proxyWorkerHost",
    listener: (checked: string) => void,
  ): this;
  addEventListener(
    type: "change:useNewAudioPlayer",
    listener: (checked: boolean) => void,
  ): this;
  addEventListener(
    type: "change:onlyBypassMediaCSP",
    listener: (checked: boolean) => void,
  ): this;
  addEventListener(
    type: "change:showPiPButton",
    listener: (checked: boolean) => void,
  ): this;
  addEventListener(
    type: "input:subtitlesMaxLength",
    listener: (value: number) => void,
  ): this;
  addEventListener(
    type: "input:subtitlesFontSize",
    listener: (value: number) => void,
  ): this;
  addEventListener(
    type: "input:subtitlesBackgroundOpacity",
    listener: (value: number) => void,
  ): this;
  addEventListener(
    type: "input:autoHideButtonDelay",
    listener: (value: number) => void,
  ): this;
  addEventListener(
    type: "select:proxyTranslationStatus",
    listener: (item: string) => void,
  ): this;
  addEventListener(
    type: "select:translationTextService",
    listener: (item: TranslateService) => void,
  ): this;
  addEventListener(
    type: "select:buttonPosition",
    listener: (item: Position) => void,
  ): this;
  addEventListener(
    type: "select:menuLanguage",
    listener: (item: Locale) => void,
  ): this;
  addEventListener(
    type:
      | "click:bugReport"
      | "click:resetSettings"
      | "update:account"
      | "change:autoTranslate"
      | "change:showVideoVolume"
      | "change:audioBuster"
      | "change:useLivelyVoice"
      | "change:subtitlesHighlightWords"
      | "change:proxyWorkerHost"
      | "change:useNewAudioPlayer"
      | "change:onlyBypassMediaCSP"
      | "change:showPiPButton"
      | "input:subtitlesMaxLength"
      | "input:subtitlesFontSize"
      | "input:subtitlesBackgroundOpacity"
      | "input:autoHideButtonDelay"
      | "select:proxyTranslationStatus"
      | "select:translationTextService"
      | "select:buttonPosition"
      | "select:menuLanguage",
    // biome-ignore lint/suspicious/noExplicitAny: it's ok trust me
    listener: (...data: any[]) => void,
  ): this {
    switch (type) {
      case "click:bugReport": {
        this.onClickBugReport.addListener(listener);
        break;
      }
      case "click:resetSettings": {
        this.onClickResetSettings.addListener(listener);
        break;
      }
      case "update:account": {
        this.onUpdateAccount.addListener(listener);
        break;
      }
      case "change:autoTranslate": {
        this.onChangeAutoTranslate.addListener(listener);
        break;
      }
      case "change:showVideoVolume": {
        this.onChangeShowVideoVolume.addListener(listener);
        break;
      }
      case "change:audioBuster": {
        this.onChangeAudioBooster.addListener(listener);
        break;
      }
      case "change:useLivelyVoice": {
        this.onChangeUseLivelyVoice.addListener(listener);
        break;
      }
      case "change:subtitlesHighlightWords": {
        this.onChangeSubtitlesHighlightWords.addListener(listener);
        break;
      }
      case "change:proxyWorkerHost": {
        this.onChangeProxyWorkerHost.addListener(listener);
        break;
      }
      case "change:useNewAudioPlayer": {
        this.onChangeUseNewAudioPlayer.addListener(listener);
        break;
      }
      case "change:onlyBypassMediaCSP": {
        this.onChangeOnlyBypassMediaCSP.addListener(listener);
        break;
      }
      case "change:showPiPButton": {
        this.onChangeShowPiPButton.addListener(listener);
        break;
      }
      case "input:subtitlesMaxLength": {
        this.onInputSubtitlesMaxLength.addListener(listener);
        break;
      }
      case "input:subtitlesFontSize": {
        this.onInputSubtitlesFontSize.addListener(listener);
        break;
      }
      case "input:subtitlesBackgroundOpacity": {
        this.onInputSubtitlesBackgroundOpacity.addListener(listener);
        break;
      }
      case "input:autoHideButtonDelay": {
        this.onInputAutoHideButtonDelay.addListener(listener);
        break;
      }
      case "select:proxyTranslationStatus": {
        this.onSelectItemProxyTranslationStatus.addListener(listener);
        break;
      }
      case "select:translationTextService": {
        this.onSelectItemTranslationTextService.addListener(listener);
        break;
      }
      case "select:buttonPosition": {
        this.onSelectItemButtonPosition.addListener(listener);
        break;
      }
      case "select:menuLanguage": {
        this.onSelectItemMenuLanguage.addListener(listener);
        break;
      }
    }

    return this;
  }

  removeEventListener(
    type: "click:bugReport",
    listener: (checked: boolean) => void,
  ): this;
  removeEventListener(
    type: "click:resetSettings",
    listener: (checked: boolean) => void,
  ): this;
  removeEventListener(
    type: "update:account",
    listener: (account: Partial<Account> | undefined) => void,
  ): this;
  removeEventListener(
    type: "change:autoTranslate",
    listener: (checked: boolean) => void,
  ): this;
  removeEventListener(
    type: "change:showVideoVolume",
    listener: (checked: boolean) => void,
  ): this;
  removeEventListener(
    type: "change:audioBuster",
    listener: (checked: boolean) => void,
  ): this;
  removeEventListener(
    type: "change:useLivelyVoice",
    listener: (checked: boolean) => void,
  ): this;
  removeEventListener(
    type: "change:subtitlesHighlightWords",
    listener: (checked: boolean) => void,
  ): this;
  removeEventListener(
    type: "change:proxyWorkerHost",
    listener: (checked: string) => void,
  ): this;
  removeEventListener(
    type: "change:useNewAudioPlayer",
    listener: (checked: boolean) => void,
  ): this;
  removeEventListener(
    type: "change:onlyBypassMediaCSP",
    listener: (checked: boolean) => void,
  ): this;
  removeEventListener(
    type: "change:showPiPButton",
    listener: (checked: boolean) => void,
  ): this;
  removeEventListener(
    type: "input:subtitlesMaxLength",
    listener: (value: number) => void,
  ): this;
  removeEventListener(
    type: "input:subtitlesFontSize",
    listener: (value: number) => void,
  ): this;
  removeEventListener(
    type: "input:subtitlesBackgroundOpacity",
    listener: (value: number) => void,
  ): this;
  removeEventListener(
    type: "input:autoHideButtonDelay",
    listener: (value: number) => void,
  ): this;
  removeEventListener(
    type: "select:proxyTranslationStatus",
    listener: (item: string) => void,
  ): this;
  removeEventListener(
    type: "select:translationTextService",
    listener: (item: TranslateService) => void,
  ): this;
  removeEventListener(
    type: "select:buttonPosition",
    listener: (item: Position) => void,
  ): this;
  removeEventListener(
    type: "select:menuLanguage",
    listener: (item: Locale) => void,
  ): this;
  removeEventListener(
    type:
      | "click:bugReport"
      | "click:resetSettings"
      | "update:account"
      | "change:autoTranslate"
      | "change:showVideoVolume"
      | "change:audioBuster"
      | "change:useLivelyVoice"
      | "change:subtitlesHighlightWords"
      | "change:proxyWorkerHost"
      | "change:useNewAudioPlayer"
      | "change:onlyBypassMediaCSP"
      | "change:showPiPButton"
      | "input:subtitlesMaxLength"
      | "input:subtitlesFontSize"
      | "input:subtitlesBackgroundOpacity"
      | "input:autoHideButtonDelay"
      | "select:proxyTranslationStatus"
      | "select:translationTextService"
      | "select:buttonPosition"
      | "select:menuLanguage",
    // biome-ignore lint/suspicious/noExplicitAny: it's ok trust me
    listener: (...data: any[]) => void,
  ) {
    switch (type) {
      case "click:bugReport": {
        this.onClickBugReport.removeListener(listener);
        break;
      }
      case "click:resetSettings": {
        this.onClickResetSettings.removeListener(listener);
        break;
      }
      case "update:account": {
        this.onUpdateAccount.removeListener(listener);
        break;
      }
      case "change:autoTranslate": {
        this.onChangeAutoTranslate.removeListener(listener);
        break;
      }
      case "change:showVideoVolume": {
        this.onChangeShowVideoVolume.removeListener(listener);
        break;
      }
      case "change:audioBuster": {
        this.onChangeAudioBooster.removeListener(listener);
        break;
      }
      case "change:useLivelyVoice": {
        this.onChangeUseLivelyVoice.removeListener(listener);
        break;
      }
      case "change:subtitlesHighlightWords": {
        this.onChangeSubtitlesHighlightWords.removeListener(listener);
        break;
      }
      case "change:proxyWorkerHost": {
        this.onChangeProxyWorkerHost.removeListener(listener);
        break;
      }
      case "change:useNewAudioPlayer": {
        this.onChangeUseNewAudioPlayer.removeListener(listener);
        break;
      }
      case "change:onlyBypassMediaCSP": {
        this.onChangeOnlyBypassMediaCSP.removeListener(listener);
        break;
      }
      case "change:showPiPButton": {
        this.onChangeShowPiPButton.removeListener(listener);
        break;
      }
      case "input:subtitlesMaxLength": {
        this.onInputSubtitlesMaxLength.removeListener(listener);
        break;
      }
      case "input:subtitlesFontSize": {
        this.onInputSubtitlesFontSize.removeListener(listener);
        break;
      }
      case "input:subtitlesBackgroundOpacity": {
        this.onInputSubtitlesBackgroundOpacity.removeListener(listener);
        break;
      }
      case "input:autoHideButtonDelay": {
        this.onInputAutoHideButtonDelay.removeListener(listener);
        break;
      }
      case "select:proxyTranslationStatus": {
        this.onSelectItemProxyTranslationStatus.removeListener(listener);
        break;
      }
      case "select:translationTextService": {
        this.onSelectItemTranslationTextService.removeListener(listener);
        break;
      }
      case "select:buttonPosition": {
        this.onSelectItemButtonPosition.removeListener(listener);
        break;
      }
      case "select:menuLanguage": {
        this.onSelectItemMenuLanguage.removeListener(listener);
        break;
      }
    }

    return this;
  }

  releaseUI(initialized = false) {
    if (!this.isInitialized()) {
      throw new Error("[VOT] SettingsView isn't initialized");
    }

    this.dialog.remove();
    this.accountButtonRefreshTooltip?.release();
    this.audioBoosterTooltip?.release();
    this.useAudioDownloadCheckboxTooltip?.release();
    this.useNewAudioPlayerTooltip?.release();
    this.onlyBypassMediaCSPTooltip?.release();
    this.translationTextServiceTooltip?.release();
    this.proxyTranslationStatusSelectTooltip?.release();

    this.initialized = initialized;
    return this;
  }

  releaseUIEvents(initialized = false) {
    if (!this.isInitialized()) {
      throw new Error("[VOT] SettingsView isn't initialized");
    }

    this.onClickBugReport.clear();
    this.onClickResetSettings.clear();

    this.onUpdateAccount.clear();

    this.onChangeAutoTranslate.clear();
    this.onChangeShowVideoVolume.clear();
    this.onChangeAudioBooster.clear();
    this.onChangeUseLivelyVoice.clear();
    this.onChangeSubtitlesHighlightWords.clear();
    this.onChangeProxyWorkerHost.clear();
    this.onChangeUseNewAudioPlayer.clear();
    this.onChangeOnlyBypassMediaCSP.clear();
    this.onChangeShowPiPButton.clear();

    this.onInputSubtitlesMaxLength.clear();
    this.onInputSubtitlesFontSize.clear();
    this.onInputSubtitlesBackgroundOpacity.clear();
    this.onInputAutoHideButtonDelay.clear();

    this.onSelectItemProxyTranslationStatus.clear();
    this.onSelectItemTranslationTextService.clear();
    this.onSelectItemButtonPosition.clear();
    this.onSelectItemMenuLanguage.clear();

    this.initialized = initialized;
    return this;
  }

  release() {
    this.releaseUI(true);
    this.releaseUIEvents(false);
    return this;
  }

  updateAccountInfo() {
    if (!this.isInitialized()) {
      throw new Error("[VOT] SettingsView isn't initialized");
    }

    const loggedIn = !!this.data.account?.token;
    this.accountButton.avatarId = this.data.account?.avatarId;
    this.useLivelyVoiceTooltip.hidden = this.accountButton.loggedIn = loggedIn;
    this.accountButton.username = this.data.account?.username;
    this.useLivelyVoiceCheckbox.disabled = !loggedIn;
    this.onUpdateAccount.dispatch(this.data.account);
    return this;
  }

  open() {
    if (!this.isInitialized()) {
      throw new Error("[VOT] SettingsView isn't initialized");
    }

    return this.dialog.open();
  }

  close() {
    if (!this.isInitialized()) {
      throw new Error("[VOT] SettingsView isn't initialized");
    }

    return this.dialog.close();
  }
}
