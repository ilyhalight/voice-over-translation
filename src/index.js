import Bowser from "bowser";
import { svg, html } from "lit-html";
import { ID3Writer } from "browser-id3-writer";
import Chaimu, { initAudioContext } from "chaimu";

import VOTClient, { VOTWorkerClient } from "@vot.js/ext";
import votConfig from "@vot.js/shared/config";
import {
  getVideoData,
  getVideoID,
  getService,
} from "@vot.js/ext/utils/videoData";
import {
  availableLangs,
  availableTTS,
  subtitlesFormats,
} from "@vot.js/shared/consts";
import { convertSubs } from "@vot.js/shared/utils/subs";
import YoutubeHelper from "@vot.js/ext/helpers/youtube";

import {
  defaultAutoVolume,
  defaultDetectService,
  defaultTranslationService,
  m3u8ProxyHost,
  repositoryUrl,
  proxyWorkerHost,
  maxAudioVolume,
  minLongWaitingCount,
  votBackendUrl,
  workerHost,
  proxyOnlyExtensions,
} from "./config/config.js";
import {
  availableLocales,
  localizationProvider,
} from "./localization/localizationProvider.js";
import { SubtitlesWidget, SubtitlesProcessor } from "./subtitles.js";

import Tooltip from "./ui/tooltip.ts";
import ui from "./ui.js";
import debug from "./utils/debug.ts";

import { VOTLocalizedError } from "./utils/VOTLocalizedError.js";
import {
  GM_fetch,
  initHls,
  isPiPAvailable,
  lang,
  calculatedResLang,
  secsToStrTime,
  downloadBlob,
  clearFileName,
  cleanText,
} from "./utils/utils.js";
import { syncVolume } from "./utils/volume.js";
import { VideoObserver } from "./utils/VideoObserver.js";
import { votStorage, convertData } from "./utils/storage.ts";
import {
  detectServices,
  detect,
  translate,
  translateServices,
} from "./utils/translateApis.ts";

// Get browser information for later use.
const browserInfo = Bowser.getParser(window.navigator.userAgent).getResult();

/**
 * Generates options for language selection.
 * @param {string[]} obj Array of language codes.
 * @param {string} conditionString Current selected language code.
 * @returns {Array<{label: string, value: string, selected: boolean}>}
 */
function genOptionsByOBJ(obj, conditionString) {
  return obj.map((code) => ({
    label: localizationProvider.get("langs")[code] ?? code.toUpperCase(),
    value: code,
    selected: conditionString === code,
  }));
}

/**
 * Returns the hotkey text based on the current hotkey.
 * @param {string|null} hotkey Current hotkey.
 * @returns {string} The hotkey text.
 */
const createHotkeyText = (hotkey) =>
  hotkey
    ? localizationProvider
        .get("VOTChangeHotkeyWithCurrent")
        .replace("{0}", hotkey.replace("Key", ""))
    : localizationProvider.get("VOTCreateTranslationHotkey");

let countryCode; // Used later for proxy settings

/*─────────────────────────────────────────────────────────────*/
/*           Helper class: CacheManager                        */
/* Merges video translation and subtitles caching by a composite key  */
/*─────────────────────────────────────────────────────────────*/
class CacheManager {
  constructor() {
    this.cache = new Map();
  }
  /**
   * Returns the full cache entry for the given key.
   * @param {string} key The composite key.
   * @returns {Object|undefined}
   */
  get(key) {
    return this.cache.get(key);
  }
  /**
   * Sets the full cache entry for the given key.
   * @param {string} key The composite key.
   * @param {Object} value The cache entry.
   */
  set(key, value) {
    this.cache.set(key, value);
  }
  /**
   * Deletes the entire cache entry for the given key.
   * @param {string} key The composite key.
   */
  delete(key) {
    this.cache.delete(key);
  }
  /**
   * Gets the translation object for the given key.
   * @param {string} key The composite key.
   * @returns {Object|undefined}
   */
  getTranslation(key) {
    const entry = this.get(key);
    return entry ? entry.translation : undefined;
  }
  /**
   * Sets the translation object for the given key.
   * @param {string} key The composite key.
   * @param {Object} translation The translation data.
   */
  setTranslation(key, translation) {
    let entry = this.get(key) || {};
    entry.translation = translation;
    this.set(key, entry);
  }
  /**
   * Gets the subtitles array for the given key.
   * @param {string} key The composite key.
   * @returns {Array|undefined}
   */
  getSubtitles(key) {
    const entry = this.get(key);
    return entry ? entry.subtitles : undefined;
  }
  /**
   * Sets the subtitles array for the given key.
   * @param {string} key The composite key.
   * @param {Array} subtitles The subtitles data.
   */
  setSubtitles(key, subtitles) {
    let entry = this.get(key) || {};
    entry.subtitles = subtitles;
    this.set(key, entry);
  }
  /**
   * Deletes the subtitles data for the given key.
   * @param {string} key The composite key.
   */
  deleteSubtitles(key) {
    let entry = this.get(key);
    if (entry) {
      delete entry.subtitles;
      this.set(key, entry);
    }
  }
}

/*─────────────────────────────────────────────────────────────*/
/*           Helper class: VOTUIManager                        */
/*  Handles creation of UI elements, event registration, and UI logic  */
/*─────────────────────────────────────────────────────────────*/
class VOTUIManager {
  /**
   * @param {VideoHandler} videoHandler Parent VideoHandler instance.
   */
  constructor(videoHandler) {
    this.videoHandler = videoHandler;
  }

  getButtonPos() {
    // If a custom button position is set and container width > 550, arrange in column; otherwise row.
    if (
      this.videoHandler.data?.buttonPos &&
      this.videoHandler.data?.buttonPos !== "default" &&
      this.videoHandler.container.clientWidth > 550
    ) {
      return {
        direction: "column",
        position: this.videoHandler.data?.buttonPos,
      };
    }

    return {
      direction: "row",
      position: "default",
    };
  }

  getButtonTooltipPos(position) {
    switch (position) {
      case "left":
        return "right";
      case "right":
        return "left";
      default:
        return "bottom";
    }
  }

  /**
   * Creates and initializes all UI elements.
   */
  initUI() {
    // ----- VOT Button creation -----
    // Create the translation button using ui helper and set initial opacity.
    this.videoHandler.votPortal = ui.createPortal();
    document.documentElement.appendChild(this.videoHandler.votPortal);

    this.videoHandler.votButton = ui.createVOTButton(
      localizationProvider.get("translateVideo"),
    );
    this.videoHandler.votButton.container.style.opacity = 0;

    const { position: votPosition, direction: votDirection } =
      this.getButtonPos();
    this.videoHandler.votButton.container.dataset.direction = votDirection;
    this.videoHandler.votButton.container.dataset.position = votPosition;
    this.videoHandler.container.appendChild(
      this.videoHandler.votButton.container,
    );
    this.videoHandler.votButtonTooltip = new Tooltip({
      target: this.videoHandler.votButton.translateButton,
      content: localizationProvider.get("translateVideo"),
      position: this.getButtonTooltipPos(votPosition),
      parentElement: this.videoHandler.votPortal,
    });

    // Hide Picture-in-Picture (PiP) button if not available or not enabled.
    this.videoHandler.votButton.pipButton.hidden =
      !isPiPAvailable() || !this.videoHandler.data?.showPiPButton;
    this.videoHandler.votButton.separator2.hidden =
      !isPiPAvailable() || !this.videoHandler.data?.showPiPButton;

    // Prevent button click events from propagating.
    this.videoHandler.votButton.container.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    });

    // ----- VOT Menu creation -----
    // Create settings menu and set its position based on container width.
    this.videoHandler.votMenu = ui.createVOTMenu(
      localizationProvider.get("VOTSettings"),
    );
    this.videoHandler.votMenu.container.dataset.position =
      this.videoHandler.container.clientWidth &&
      this.videoHandler.container.clientWidth > 550
        ? this.videoHandler.data?.buttonPos
        : "default";
    this.videoHandler.container.appendChild(
      this.videoHandler.votMenu.container,
    );

    // ----- SVG Icon Buttons -----
    // Download Translation Button
    this.videoHandler.votDownloadButton = ui.createIconButton(
      svg`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="100%" viewBox="0 0 24 24" class="vot-loader" id="vot-loader-download">
            <path class="vot-loader-main" d="M12 15.575C11.8667 15.575 11.7417 15.5542 11.625 15.5125C11.5083 15.4708 11.4 15.4 11.3 15.3L7.7 11.7C7.5 11.5 7.40417 11.2667 7.4125 11C7.42083 10.7333 7.51667 10.5 7.7 10.3C7.9 10.1 8.1375 9.99583 8.4125 9.9875C8.6875 9.97917 8.925 10.075 9.125 10.275L11 12.15V5C11 4.71667 11.0958 4.47917 11.2875 4.2875C11.4792 4.09583 11.7167 4 12 4C12.2833 4 12.5208 4.09583 12.7125 4.2875C12.9042 4.47917 13 4.71667 13 5V12.15L14.875 10.275C15.075 10.075 15.3125 9.97917 15.5875 9.9875C15.8625 9.99583 16.1 10.1 16.3 10.3C16.4833 10.5 16.5792 10.7333 16.5875 11C16.5958 11.2667 16.5 11.5 16.3 11.7L12.7 15.3C12.6 15.4 12.4917 15.4708 12.375 15.5125C12.2583 15.5542 12.1333 15.575 12 15.575ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V16C4 15.7167 4.09583 15.4792 4.2875 15.2875C4.47917 15.0958 4.71667 15 5 15C5.28333 15 5.52083 15.0958 5.7125 15.2875C5.90417 15.4792 6 15.7167 6 16V18H18V16C18 15.7167 18.0958 15.4792 18.2875 15.2875C18.4792 15.0958 18.7167 15 19 15C19.2833 15 19.5208 15.0958 19.7125 15.2875C19.9042 15.4792 20 15.7167 20 16V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z"/>
            <path class="vot-loader-helper" d=""/>
         </svg>`,
    );
    this.videoHandler.votDownloadButton.hidden = true;
    this.videoHandler.votMenu.headerContainer.appendChild(
      this.videoHandler.votDownloadButton,
    );

    // Download Subtitles Button
    this.videoHandler.votDownloadSubtitlesButton = ui.createIconButton(
      svg`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="100%" viewBox="0 0 24 24">
            <path d="M4 20q-.825 0-1.413-.588T2 18V6q0-.825.588-1.413T4 4h16q.825 0 1.413.588T22 6v12q0 .825-.588 1.413T20 20H4Zm2-4h8v-2H6v2Zm10 0h2v-2h-2v2ZM6 12h2v-2H6v2Zm4 0h8v-2h-8v2Z"/>
         </svg>`,
    );
    this.videoHandler.votDownloadSubtitlesButton.hidden = true;
    this.videoHandler.votMenu.headerContainer.appendChild(
      this.videoHandler.votDownloadSubtitlesButton,
    );

    // Settings Button
    this.videoHandler.votSettingsButton = ui.createIconButton(
      svg`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="100%" viewBox="0 -960 960 960">
            <path d="M555-80H405q-15 0-26-10t-13-25l-12-93q-13-5-24.5-12T307-235l-87 36q-14 5-28 1t-22-17L96-344q-8-13-5-28t15-24l75-57q-1-7-1-13.5v-27q0-6.5 1-13.5l-75-57q-12-9-15-24t5-28l74-129q7-14 21.5-17.5T220-761l87 36q11-8 23-15t24-12l12-93q2-15 13-25t26-10h150q15 0 26 10t13 25l12 93q13 5 24.5 12t22.5 15l87-36q14-5 28-1t22 17l74 129q8 13 5 28t-15 24l-75 57q1 7 1 13.5v27q0 6.5-2 13.5l75 57q12 9 15 24t-5 28l-74 128q-8 13-22.5 17.5T738-199l-85-36q-11 8-23 15t-24 12l-12 93q-2 15-13 25t-26 10Zm-73-260q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm0-80q-25 0-42.5-17.5T422-480q0-25 17.5-42.5T482-540q25 0 42.5 17.5T542-480q0 25-17.5 42.5T482-420Zm-2-60Zm-40 320h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Z"/>
         </svg>`,
    );
    this.videoHandler.votMenu.headerContainer.appendChild(
      this.videoHandler.votSettingsButton,
    );

    // Create language selection menu (both source and target) using the ui helper.
    this.videoHandler.votTranslationLanguageSelect = ui.createVOTLanguageSelect(
      {
        fromTitle:
          localizationProvider.get("langs")[
            this.videoHandler.video.detectedLanguage
          ],
        fromDialogTitle: localizationProvider.get("videoLanguage"),
        fromItems: genOptionsByOBJ(
          availableLangs,
          this.videoHandler.videoData.detectedLanguage,
        ),
        fromOnSelectCB: async (e) => {
          debug.log(
            "[fromOnSelectCB] select from language",
            e.target.dataset.votValue,
          );
          this.videoHandler.setSelectMenuValues(
            e.target.dataset.votValue,
            this.videoHandler.videoData.responseLanguage,
          );
        },
        toTitle:
          localizationProvider.get("langs")[
            this.videoHandler.video.responseLanguage
          ],
        toDialogTitle: localizationProvider.get("translationLanguage"),
        toItems: genOptionsByOBJ(
          availableTTS,
          this.videoHandler.videoData.responseLanguage,
        ),
        toOnSelectCB: async (e) => {
          const newLang = e.target.dataset.votValue;
          debug.log("[toOnSelectCB] select to language", newLang);
          this.videoHandler.data.responseLanguage =
            this.videoHandler.translateToLang = newLang;
          await votStorage.set(
            "responseLanguage",
            this.videoHandler.data.responseLanguage,
          );
          debug.log(
            "Response Language value changed. New value: ",
            this.videoHandler.data.responseLanguage,
          );
          this.videoHandler.setSelectMenuValues(
            this.videoHandler.videoData.detectedLanguage,
            this.videoHandler.data.responseLanguage,
          );
        },
      },
    );
    this.videoHandler.votMenu.bodyContainer.appendChild(
      this.videoHandler.votTranslationLanguageSelect.container,
    );

    // Create Subtitles selection menu – initially only with the "disabled" option.
    this.videoHandler.votSubtitlesSelect = ui.createVOTSelect(
      localizationProvider.get("VOTSubtitlesDisabled"),
      localizationProvider.get("VOTSubtitles"),
      [
        {
          label: localizationProvider.get("VOTSubtitlesDisabled"),
          value: "disabled",
          selected: true,
          disabled: false,
        },
      ],
      {
        onSelectCb: async (e) => {
          await this.videoHandler.changeSubtitlesLang(
            e.target.dataset.votValue,
          );
        },
        labelElement: ui.createVOTSelectLabel(
          localizationProvider.get("VOTSubtitles"),
        ),
        onBeforeOpen: async () => {
          // If subtitles cache for the current parameters is missing, load subtitles.
          const cacheKey = `${this.videoHandler.videoData.videoId}_${this.videoHandler.videoData.detectedLanguage}_${this.videoHandler.videoData.responseLanguage}_${this.videoHandler.data.useNewModel}`;
          if (!this.videoHandler.cacheManager.getSubtitles(cacheKey)) {
            this.videoHandler.setLoadingBtn(true);
            await this.videoHandler.loadSubtitles();
            this.videoHandler.setLoadingBtn(false);
          }
        },
      },
    );
    this.videoHandler.votMenu.bodyContainer.appendChild(
      this.videoHandler.votSubtitlesSelect.container,
    );

    // Create the volume sliders for video and translation audio.
    this.videoHandler.votVideoVolumeSlider = ui.createSlider(
      html`${localizationProvider.get("VOTVolume")}:
        <strong>${this.videoHandler.getVideoVolume() * 100}%</strong>`,
      this.videoHandler.getVideoVolume() * 100,
    );
    this.videoHandler.votVideoVolumeSlider.container.hidden =
      this.videoHandler.data.showVideoSlider !== 1 ||
      this.videoHandler.votButton.container.dataset.status !== "success";
    this.videoHandler.votMenu.bodyContainer.appendChild(
      this.videoHandler.votVideoVolumeSlider.container,
    );

    this.videoHandler.votVideoTranslationVolumeSlider = ui.createSlider(
      html`${localizationProvider.get("VOTVolumeTranslation")}:
        <strong>${this.videoHandler.data?.defaultVolume ?? 100}%</strong>`,
      this.videoHandler.data?.defaultVolume ?? 100,
      0,
      this.videoHandler.data.audioBooster ? maxAudioVolume : 100,
    );
    this.videoHandler.votVideoTranslationVolumeSlider.container.hidden =
      this.videoHandler.votButton.container.dataset.status !== "success";
    this.videoHandler.votMenu.bodyContainer.appendChild(
      this.videoHandler.votVideoTranslationVolumeSlider.container,
    );

    // Prevent event propagation on the menu container.
    this.videoHandler.votMenu.container.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    });

    // ----- VOT Settings Dialog creation -----
    // Create a dialog for settings using ui helper.
    this.videoHandler.votSettingsDialog = ui.createDialog(
      localizationProvider.get("VOTSettings"),
    );
    this.videoHandler.votPortal.appendChild(
      this.videoHandler.votSettingsDialog.container,
    );

    // Append headers and checkboxes, textfields etc. (Preserving original comments)
    // Translation settings header.
    this.videoHandler.votTranslationHeader = ui.createHeader(
      localizationProvider.get("translationSettings"),
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votTranslationHeader,
    );

    // Auto translate checkbox.
    this.videoHandler.votAutoTranslateCheckbox = ui.createCheckbox(
      localizationProvider.get("VOTAutoTranslate"),
      this.videoHandler.data?.autoTranslate ?? false,
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votAutoTranslateCheckbox.container,
    );

    // Don't translate your language select.
    this.videoHandler.votDontTranslateYourLangSelect = ui.createVOTSelect(
      this.videoHandler.data.dontTranslateLanguage
        .map((lang) => localizationProvider.get("langs")[lang])
        .join(", ") || localizationProvider.get("langs")[lang],
      localizationProvider.get("VOTDontTranslateYourLang"),
      genOptionsByOBJ(availableLangs).map((option) => ({
        ...option,
        selected: this.videoHandler.data.dontTranslateLanguage.includes(
          option.value,
        ),
      })),
      {
        multiSelect: true,
        onSelectCb: async (e, selectedValues) => {
          this.videoHandler.data.dontTranslateLanguage = selectedValues;
          await votStorage.set(
            "dontTranslateLanguage",
            this.videoHandler.data.dontTranslateLanguage,
          );
          this.videoHandler.votDontTranslateYourLangSelect.setTitle(
            selectedValues
              .map((lang) => localizationProvider.get("langs")[lang])
              .join(", ") || localizationProvider.get("langs")[lang],
          );
        },
        labelElement: ui.createCheckbox(
          localizationProvider.get("VOTDontTranslateYourLang"),
          this.videoHandler.data?.dontTranslateYourLang ?? true,
        ).container,
      },
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votDontTranslateYourLangSelect.container,
    );

    // Hotkey change button.
    this.videoHandler.changehotkeyButton = ui.createOutlinedButton(
      createHotkeyText(this.videoHandler.data.hotkeyButton),
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.changehotkeyButton,
    );

    // Auto-set volume checkbox.
    this.videoHandler.votAutoSetVolumeCheckbox = ui.createCheckbox(
      `${localizationProvider.get("VOTAutoSetVolume")}`,
      this.videoHandler.data?.autoSetVolumeYandexStyle ?? true,
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votAutoSetVolumeCheckbox.container,
    );

    // Auto-set volume slider.
    this.videoHandler.votAutoSetVolumeSlider = ui.createSlider(
      html`<strong
        >${Math.round(
          (this.videoHandler.data?.autoVolume ?? defaultAutoVolume) * 100,
        )}%</strong
      >`,
      Math.round(
        (this.videoHandler.data?.autoVolume ?? defaultAutoVolume) * 100,
      ),
      0,
      100,
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votAutoSetVolumeSlider.container,
    );

    // Show video slider checkbox.
    this.videoHandler.votShowVideoSliderCheckbox = ui.createCheckbox(
      localizationProvider.get("VOTShowVideoSlider"),
      this.videoHandler.data?.showVideoSlider ?? false,
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votShowVideoSliderCheckbox.container,
    );

    // Audio booster checkbox.
    this.videoHandler.votAudioBoosterCheckbox = ui.createCheckbox(
      localizationProvider.get("VOTAudioBooster"),
      this.videoHandler.data?.audioBooster ?? false,
    );
    if (!this.videoHandler.audioContext) {
      this.videoHandler.votAudioBoosterCheckbox.input.disabled = true;
      this.videoHandler.votAudioBoosterTooltip = new Tooltip({
        target: this.videoHandler.votAudioBoosterCheckbox.container,
        content: localizationProvider.get("VOTNeedWebAudioAPI"),
        position: "bottom",
        backgroundColor: "var(--vot-helper-ondialog)",
        parentElement: this.videoHandler.votPortal,
      });
    }
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votAudioBoosterCheckbox.container,
    );

    // Sync volume checkbox.
    this.videoHandler.votSyncVolumeCheckbox = ui.createCheckbox(
      localizationProvider.get("VOTSyncVolume"),
      this.videoHandler.data?.syncVolume ?? false,
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votSyncVolumeCheckbox.container,
    );

    // Download with name checkbox.
    this.videoHandler.votDownloadWithNameCheckbox = ui.createCheckbox(
      localizationProvider.get("VOTDownloadWithName"),
      this.videoHandler.data?.downloadWithName ?? false,
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votDownloadWithNameCheckbox.container,
    );

    // Send notify on complete checkbox.
    this.videoHandler.votSendNotifyOnCompleteCheckbox = ui.createCheckbox(
      localizationProvider.get("VOTSendNotifyOnComplete"),
      this.videoHandler.data?.sendNotifyOnComplete ?? false,
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votSendNotifyOnCompleteCheckbox.container,
    );

    // Use new model checkbox.
    this.videoHandler.votUseNewModelCheckbox = ui.createCheckbox(
      localizationProvider.get("VOTUseNewModel"),
      this.videoHandler.data?.useNewModel ?? false,
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votUseNewModelCheckbox.container,
    );

    // Translation errors service select.
    this.videoHandler.votTranslationErrorsServiceSelect = ui.createVOTSelect(
      this.videoHandler.data.translationService.toUpperCase(),
      localizationProvider.get("VOTTranslationErrorsService"),
      genOptionsByOBJ(
        translateServices,
        this.videoHandler.data.translationService,
      ),
      {
        onSelectCb: async (e) => {
          this.videoHandler.data.translationService = e.target.dataset.votValue;
          await votStorage.set(
            "translationService",
            this.videoHandler.data.translationService,
          );
        },
        labelElement: ui.createCheckbox(
          localizationProvider.get("VOTTranslateAPIErrors"),
          this.videoHandler.data.translateAPIErrors ?? true,
        ).container,
      },
    );
    this.videoHandler.votTranslationErrorsServiceSelect.container.hidden =
      localizationProvider.lang === "ru";
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votTranslationErrorsServiceSelect.container,
    );

    // Detect service select.
    this.videoHandler.votDetectServiceSelect = ui.createVOTSelect(
      this.videoHandler.data.detectService.toUpperCase(),
      localizationProvider.get("VOTDetectService"),
      genOptionsByOBJ(detectServices, this.videoHandler.data.detectService),
      {
        onSelectCb: async (e) => {
          this.videoHandler.data.detectService = e.target.dataset.votValue;
          await votStorage.set(
            "detectService",
            this.videoHandler.data.detectService,
          );
        },
        labelElement: ui.createVOTSelectLabel(
          localizationProvider.get("VOTDetectService"),
        ),
      },
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votDetectServiceSelect.container,
    );

    // --- SUBTITLES Settings ---
    this.videoHandler.votSubtitlesHeader = ui.createHeader(
      localizationProvider.get("subtitlesSettings"),
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votSubtitlesHeader,
    );

    this.videoHandler.votSubtitlesDetails = ui.createDetails(
      localizationProvider.get("VOTSubtitlesDesign"),
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votSubtitlesDetails.container,
    );

    // --- PROXY Settings ---
    this.videoHandler.votProxyHeader = ui.createHeader(
      localizationProvider.get("proxySettings"),
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votProxyHeader,
    );

    this.videoHandler.votM3u8ProxyHostTextfield = ui.createTextfield(
      localizationProvider.get("VOTM3u8ProxyHost"),
      this.videoHandler.data?.m3u8ProxyHost,
      m3u8ProxyHost,
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votM3u8ProxyHostTextfield.container,
    );

    this.videoHandler.votProxyWorkerHostTextfield = ui.createTextfield(
      localizationProvider.get("VOTProxyWorkerHost"),
      this.videoHandler.data?.proxyWorkerHost,
      proxyWorkerHost,
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votProxyWorkerHostTextfield.container,
    );

    const proxyEnabledLabels = [
      localizationProvider.get("VOTTranslateProxyDisabled"),
      localizationProvider.get("VOTTranslateProxyEnabled"),
      localizationProvider.get("VOTTranslateProxyEverything"),
    ];
    this.videoHandler.votTranslateProxyEnabledSelect = ui.createVOTSelect(
      proxyEnabledLabels[this.videoHandler.data.translateProxyEnabled],
      localizationProvider.get("VOTTranslateProxyStatus"),
      genOptionsByOBJ(
        proxyEnabledLabels,
        proxyEnabledLabels[this.videoHandler.data.translateProxyEnabled],
      ),
      {
        onSelectCb: async (_, selectedValue) => {
          this.videoHandler.data.translateProxyEnabled =
            proxyEnabledLabels.findIndex((val) => val === selectedValue) ?? 0;
          await votStorage.set(
            "translateProxyEnabled",
            this.videoHandler.data.translateProxyEnabled,
          );
          this.videoHandler.initVOTClient();
        },
        labelElement: ui.createVOTSelectLabel(
          localizationProvider.get("VOTTranslateProxyStatus"),
        ),
      },
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votTranslateProxyEnabledSelect.container,
    );

    this.videoHandler.votNewAudioPlayerCheckbox = ui.createCheckbox(
      localizationProvider.get("VOTNewAudioPlayer"),
      this.videoHandler.data?.newAudioPlayer ?? false,
    );
    if (!this.videoHandler.audioContext) {
      this.videoHandler.votNewAudioPlayerCheckbox.input.disabled = true;
      this.videoHandler.votNewAudioPlayerTooltip = new Tooltip({
        target: this.videoHandler.votNewAudioPlayerCheckbox.container,
        content: localizationProvider.get("VOTNeedWebAudioAPI"),
        position: "bottom",
        backgroundColor: "var(--vot-helper-ondialog)",
        parentElement: this.videoHandler.votPortal,
      });
    }
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votNewAudioPlayerCheckbox.container,
    );

    this.videoHandler.votOnlyBypassMediaCSPCheckbox = ui.createCheckbox(
      localizationProvider.get("VOTOnlyBypassMediaCSP") +
        (this.videoHandler.site.needBypassCSP
          ? ` (${localizationProvider.get("VOTMediaCSPEnabledOnSite")})`
          : ""),
      this.videoHandler.data?.onlyBypassMediaCSP ?? false,
    );
    this.videoHandler.votOnlyBypassMediaCSPCheckbox.container.classList.add(
      "vot-checkbox-sub",
    );
    if (!this.videoHandler.audioContext) {
      this.videoHandler.votOnlyBypassMediaCSPTooltip = new Tooltip({
        target: this.videoHandler.votOnlyBypassMediaCSPCheckbox.container,
        content: localizationProvider.get("VOTNeedWebAudioAPI"),
        position: "bottom",
        backgroundColor: "var(--vot-helper-ondialog)",
        parentElement: this.videoHandler.votPortal,
      });
    }
    this.videoHandler.votOnlyBypassMediaCSPCheckbox.input.disabled =
      !this.videoHandler.data.newAudioPlayer && this.videoHandler.audioContext;
    if (!this.videoHandler.data.newAudioPlayer) {
      this.videoHandler.votOnlyBypassMediaCSPCheckbox.container.hidden = true;
    }
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votOnlyBypassMediaCSPCheckbox.container,
    );

    // --- ABOUT Section ---
    this.videoHandler.votAboutHeader = ui.createHeader(
      localizationProvider.get("about"),
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votAboutHeader,
    );

    this.videoHandler.votLanguageSelect = ui.createVOTSelect(
      localizationProvider.get("langs")[
        votStorage.syncGet("locale-lang-override", "auto")
      ],
      localizationProvider.get("VOTMenuLanguage"),
      genOptionsByOBJ(
        availableLocales,
        votStorage.syncGet("locale-lang-override", "auto"),
      ),
      {
        onSelectCb: async (e) => {
          await votStorage.set(
            "locale-lang-override",
            e.target.dataset.votValue,
          );
        },
        labelElement: ui.createVOTSelectLabel(
          localizationProvider.get("VOTMenuLanguage"),
        ),
      },
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votLanguageSelect.container,
    );

    this.videoHandler.votShowPiPButtonCheckbox = ui.createCheckbox(
      localizationProvider.get("VOTShowPiPButton"),
      this.videoHandler.data?.showPiPButton ?? false,
    );
    this.videoHandler.votShowPiPButtonCheckbox.container.hidden =
      !isPiPAvailable();
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votShowPiPButtonCheckbox.container,
    );

    this.videoHandler.votVersionInfo = ui.createInformation(
      `${localizationProvider.get("VOTVersion")}:`,
      GM_info.script.version,
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votVersionInfo.container,
    );

    this.videoHandler.votAuthorsInfo = ui.createInformation(
      `${localizationProvider.get("VOTAuthors")}:`,
      GM_info.script.author,
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votAuthorsInfo.container,
    );

    this.videoHandler.votLoaderInfo = ui.createInformation(
      `${localizationProvider.get("VOTLoader")}:`,
      `${GM_info.scriptHandler} v${GM_info.version}`,
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votLoaderInfo.container,
    );

    this.videoHandler.votBrowserInfo = ui.createInformation(
      `${localizationProvider.get("VOTBrowser")}:`,
      `${browserInfo.browser.name} ${browserInfo.browser.version} (${browserInfo.os.name} ${browserInfo.os.version})`,
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votBrowserInfo.container,
    );

    this.videoHandler.votLocaleInfo = ui.createInformation(
      `${localizationProvider.get("VOTLocaleHash")}:`,
      html`${this.videoHandler.data
          .localeHash}<br />(${localizationProvider.get("VOTUpdatedAt")}
        ${new Date(
          this.videoHandler.data.localeUpdatedAt * 1000,
        ).toLocaleString()})`,
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votLocaleInfo.container,
    );

    this.videoHandler.votBugReportButton = ui.createOutlinedButton(
      localizationProvider.get("VOTBugReport"),
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votBugReportButton,
    );

    this.videoHandler.votUpdateLocaleFilesButton = ui.createOutlinedButton(
      localizationProvider.get("VOTUpdateLocaleFiles"),
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votUpdateLocaleFilesButton,
    );

    this.videoHandler.votResetSettingsButton = ui.createButton(
      localizationProvider.get("resetSettings"),
    );
    this.videoHandler.votSettingsDialog.bodyContainer.appendChild(
      this.videoHandler.votResetSettingsButton,
    );
  }

  updateButtonPos(position, direction) {
    this.videoHandler.votButton.container.dataset.direction = direction;
    this.videoHandler.votButton.container.dataset.position = position;
    this.videoHandler.votButtonTooltip.hidden = direction === "row";
    this.videoHandler.votButtonTooltip.setPosition(
      this.getButtonTooltipPos(position),
    );
    return this;
  }

  /**
   * Registers UI event listeners.
   */
  initUIEvents() {
    // ----- VOT Button Events -----
    this.videoHandler.votButton.translateButton.addEventListener(
      "pointerdown",
      async () => {
        await this.videoHandler.translationHandler.handleTranslationBtnClick();
      },
    );

    this.videoHandler.votButton.pipButton.addEventListener(
      "pointerdown",
      async () => {
        const isPiPActive =
          this.videoHandler.video === document.pictureInPictureElement;
        await (isPiPActive
          ? document.exitPictureInPicture()
          : this.videoHandler.video.requestPictureInPicture());
      },
    );

    this.videoHandler.votButton.menuButton.addEventListener(
      "pointerdown",
      async () => {
        this.videoHandler.votMenu.container.hidden =
          !this.videoHandler.votMenu.container.hidden;
      },
    );

    // ----- Position Update (Drag and Touch) -----
    const moveButton = async (percentX) => {
      const isBigContainer = this.videoHandler.container.clientWidth > 550;
      const position = isBigContainer
        ? percentX <= 44
          ? "left"
          : percentX >= 66
            ? "right"
            : "default"
        : "default";
      const direction = position === "default" ? "row" : "column";
      this.videoHandler.data.buttonPos = position;
      this.videoHandler.votMenu.container.dataset.position = position;
      this.updateButtonPos(position, direction);
      if (isBigContainer) await votStorage.set("buttonPos", position);
    };

    const handleDragMove = async (
      event,
      clientX,
      rect = this.videoHandler.container.getBoundingClientRect(),
    ) => {
      if (!this.videoHandler.dragging) return;
      event.preventDefault();
      const x = clientX - rect.left;
      const percentX = (x / rect.width) * 100;
      await moveButton(percentX);
    };

    // Mouse/pointer events for dragging.
    this.videoHandler.votButton.container.addEventListener(
      "pointerdown",
      (e) => {
        this.videoHandler.dragging = true;
        e.preventDefault();
      },
    );
    this.videoHandler.container.addEventListener(
      "pointerup",
      () => (this.videoHandler.dragging = false),
    );
    this.videoHandler.container.addEventListener("pointermove", (e) =>
      handleDragMove(e, e.clientX),
    );

    // Touch events for dragging.
    this.videoHandler.votButton.container.addEventListener(
      "touchstart",
      (e) => {
        this.videoHandler.dragging = true;
        e.preventDefault();
      },
      { passive: false },
    );
    this.videoHandler.container.addEventListener(
      "touchend",
      () => (this.videoHandler.dragging = false),
    );
    this.videoHandler.container.addEventListener(
      "touchmove",
      (e) => {
        handleDragMove(
          e,
          e.touches[0].clientX,
          this.videoHandler.container.getBoundingClientRect(),
        );
      },
      { passive: false },
    );

    // Cancel drag on pointer/touch cancel events.
    ["pointercancel", "touchcancel"].forEach((event) => {
      document.addEventListener(
        event,
        () => (this.videoHandler.dragging = false),
      );
    });

    // ----- VOT Menu Events -----
    this.videoHandler.votDownloadButton.addEventListener("click", async () => {
      if (!this.videoHandler.downloadTranslationUrl) return;
      try {
        if (!this.videoHandler.data.downloadWithName) {
          window
            .open(this.videoHandler.downloadTranslationUrl, "_blank")
            .focus();
          return;
        }
        this.videoHandler.votLoader =
          this.videoHandler.votDownloadButton.querySelector(
            "#vot-loader-download",
          );
        const primaryColor = getComputedStyle(
          this.videoHandler.votMenu.container,
        ).getPropertyValue("--vot-primary-rgb");
        const updateAnimation = ui.animateLoader(
          this.videoHandler.votLoader,
          primaryColor,
        );
        const res = await GM_fetch(this.videoHandler.downloadTranslationUrl, {
          timeout: 0,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const contentLength = +res.headers.get("Content-Length");
        const reader = res.body.getReader();
        const chunksBuffer = new Uint8Array(contentLength);
        let offset = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunksBuffer.set(value, offset);
          offset += value.length;
          updateAnimation(Math.round((offset / contentLength) * 100));
        }
        ui.afterAnimateLoader(this.videoHandler.votLoader, primaryColor);
        const filename = clearFileName(
          this.videoHandler.videoData.downloadTitle,
        );
        const writer = new ID3Writer(chunksBuffer.buffer);
        writer.setFrame("TIT2", filename);
        writer.addTag();
        downloadBlob(writer.getBlob(), `${filename}.mp3`);
      } catch (err) {
        console.error("[VOT] Download failed:", err);
        this.videoHandler.transformBtn(
          "error",
          localizationProvider.get("downloadFailed"),
        );
      }
    });

    this.videoHandler.votDownloadSubtitlesButton.addEventListener(
      "click",
      async () => {
        const format = this.videoHandler.data.subtitlesDownloadFormat;
        const subsContent = convertSubs(
          this.videoHandler.yandexSubtitles,
          format,
        );
        const blob = new Blob(
          [format === "json" ? JSON.stringify(subsContent) : subsContent],
          { type: "text/plain" },
        );
        const filename = this.videoHandler.data.downloadWithName
          ? clearFileName(this.videoHandler.videoData.downloadTitle)
          : `subtitles_${this.videoHandler.videoData.videoId}`;
        downloadBlob(blob, `${filename}.${format}`);
      },
    );

    this.videoHandler.votSettingsButton.addEventListener("click", () => {
      this.videoHandler.votSettingsDialog.container.hidden =
        !this.videoHandler.votSettingsDialog.container.hidden;
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        document.webkitExitFullscreen && document.webkitExitFullscreen();
        document.exitFullscreen && document.exitFullscreen();
      }
    });

    this.videoHandler.votVideoVolumeSlider.input.addEventListener(
      "input",
      (e) => {
        const value = Number(e.target.value);
        this.videoHandler.votVideoVolumeSlider.label.querySelector(
          "strong",
        ).textContent = `${value}%`;
        this.videoHandler.setVideoVolume(value / 100);
        if (this.videoHandler.data.syncVolume)
          this.videoHandler.syncVolumeWrapper("video", value);
      },
    );

    this.videoHandler.votVideoTranslationVolumeSlider.input.addEventListener(
      "input",
      (e) => {
        (async () => {
          this.videoHandler.data.defaultVolume = Number(e.target.value);
          await votStorage.set(
            "defaultVolume",
            this.videoHandler.data.defaultVolume,
          );
          this.videoHandler.votVideoTranslationVolumeSlider.label.querySelector(
            "strong",
          ).textContent = `${this.videoHandler.data.defaultVolume}%`;
          this.videoHandler.audioPlayer.player.volume =
            this.videoHandler.data.defaultVolume / 100;
          if (!this.videoHandler.data.syncVolume) return;
          this.videoHandler.syncVolumeWrapper(
            "translation",
            this.videoHandler.data.defaultVolume,
          );
          if (
            ["youtube", "googledrive"].includes(this.videoHandler.site.host) &&
            this.videoHandler.site.additionalData !== "mobile"
          ) {
            this.videoHandler.setVideoVolume(
              this.videoHandler.tempOriginalVolume / 100,
            );
          }
        })();
      },
    );

    // ----- VOT Settings Events -----
    // Checkbox and select events for all settings; using async arrow functions for brevity.
    this.videoHandler.votAutoTranslateCheckbox.input.addEventListener(
      "change",
      (e) => {
        (async () => {
          this.videoHandler.data.autoTranslate = Number(e.target.checked);
          await votStorage.set(
            "autoTranslate",
            this.videoHandler.data.autoTranslate,
          );
          if (
            !this.videoHandler.audioPlayer.player.src &&
            this.videoHandler.data.autoTranslate === 1
          ) {
            await this.videoHandler.translationHandler.handleTranslationBtnClick();
          }
          debug.log(
            "autoTranslate value changed. New value: ",
            this.videoHandler.data.autoTranslate,
          );
        })();
      },
    );

    this.videoHandler.votDontTranslateYourLangSelect.labelElement.addEventListener(
      "change",
      (e) => {
        (async () => {
          this.videoHandler.data.dontTranslateYourLang = Number(
            e.target.checked,
          );
          await votStorage.set(
            "dontTranslateYourLang",
            this.videoHandler.data.dontTranslateYourLang,
          );
          debug.log(
            "dontTranslateYourLang value changed. New value: ",
            this.videoHandler.data.dontTranslateYourLang,
          );
        })();
      },
    );

    const updateHotkey = async (newKey) => {
      await votStorage.set("hotkeyButton", newKey);
      this.videoHandler.data.hotkeyButton = newKey;
      this.videoHandler.changehotkeyButton.textContent =
        createHotkeyText(newKey);
    };
    const keydownHandler = (e) => {
      const newKey = e.code === "Escape" ? null : e.code;
      updateHotkey(newKey);
      document.removeEventListener("keydown", keydownHandler);
    };
    this.videoHandler.changehotkeyButton.addEventListener("click", () => {
      this.videoHandler.changehotkeyButton.textContent =
        localizationProvider.get("VOTPressNewHotkey");
      document.addEventListener("keydown", keydownHandler);
    });

    this.videoHandler.votAutoSetVolumeCheckbox.input.addEventListener(
      "change",
      (e) => {
        (async () => {
          this.videoHandler.data.autoSetVolumeYandexStyle = Number(
            e.target.checked,
          );
          await votStorage.set(
            "autoSetVolumeYandexStyle",
            this.videoHandler.data.autoSetVolumeYandexStyle,
          );
          debug.log(
            "autoSetVolumeYandexStyle value changed. New value: ",
            this.videoHandler.data.autoSetVolumeYandexStyle,
          );
        })();
      },
    );

    this.videoHandler.votAutoSetVolumeSlider.input.addEventListener(
      "input",
      (e) => {
        (async () => {
          const presetAutoVolume = Number(e.target.value);
          this.videoHandler.data.autoVolume = (presetAutoVolume / 100).toFixed(
            2,
          );
          await votStorage.set("autoVolume", this.videoHandler.data.autoVolume);
          this.videoHandler.votAutoSetVolumeSlider.label.querySelector(
            "strong",
          ).textContent = `${presetAutoVolume}%`;
        })();
      },
    );

    this.videoHandler.votShowVideoSliderCheckbox.input.addEventListener(
      "change",
      (e) => {
        (async () => {
          this.videoHandler.data.showVideoSlider = Number(e.target.checked);
          await votStorage.set(
            "showVideoSlider",
            this.videoHandler.data.showVideoSlider,
          );
          debug.log(
            "showVideoSlider value changed. New value: ",
            this.videoHandler.data.showVideoSlider,
          );
          this.videoHandler.votVideoVolumeSlider.container.hidden =
            this.videoHandler.data.showVideoSlider !== 1 ||
            this.videoHandler.votButton.container.dataset.status !== "success";
        })();
      },
    );

    this.videoHandler.votAudioBoosterCheckbox.input.addEventListener(
      "change",
      (e) => {
        (async () => {
          this.videoHandler.data.audioBooster = Number(e.target.checked);
          await votStorage.set(
            "audioBooster",
            this.videoHandler.data.audioBooster,
          );
          debug.log(
            "audioBooster value changed. New value: ",
            this.videoHandler.data.audioBooster,
          );
          const currentAudioVolume =
            this.videoHandler.votVideoTranslationVolumeSlider.input.value;
          this.videoHandler.votVideoTranslationVolumeSlider.input.max = this
            .videoHandler.data.audioBooster
            ? maxAudioVolume
            : 100;
          this.videoHandler.votVideoTranslationVolumeSlider.input.value =
            currentAudioVolume > 100 ? 100 : currentAudioVolume;
          this.videoHandler.votVideoTranslationVolumeSlider.input.dispatchEvent(
            new Event("input"),
          );
        })();
      },
    );

    this.videoHandler.votSyncVolumeCheckbox.input.addEventListener(
      "change",
      (e) => {
        (async () => {
          this.videoHandler.data.syncVolume = Number(e.target.checked);
          await votStorage.set("syncVolume", this.videoHandler.data.syncVolume);
          debug.log(
            "syncVolume value changed. New value: ",
            this.videoHandler.data.syncVolume,
          );
        })();
      },
    );

    this.videoHandler.votDownloadWithNameCheckbox.input.addEventListener(
      "change",
      (e) => {
        (async () => {
          this.videoHandler.data.downloadWithName = Number(e.target.checked);
          await votStorage.set(
            "downloadWithName",
            this.videoHandler.data.downloadWithName,
          );
          debug.log(
            "downloadWithName value changed. New value: ",
            this.videoHandler.data.downloadWithName,
          );
        })();
      },
    );

    this.videoHandler.votSendNotifyOnCompleteCheckbox.input.addEventListener(
      "change",
      (e) => {
        (async () => {
          this.videoHandler.data.sendNotifyOnComplete = Number(
            e.target.checked,
          );
          await votStorage.set(
            "sendNotifyOnComplete",
            this.videoHandler.data.sendNotifyOnComplete,
          );
          debug.log(
            "sendNotifyOnComplete value changed. New value: ",
            this.videoHandler.data.sendNotifyOnComplete,
          );
        })();
      },
    );

    this.videoHandler.votUseNewModelCheckbox.input.addEventListener(
      "change",
      (e) => {
        (async () => {
          this.videoHandler.data.useNewModel = Number(e.target.checked);
          await votStorage.set(
            "useNewModel",
            this.videoHandler.data.useNewModel,
          );
          debug.log(
            "useNewModel value changed. New value: ",
            this.videoHandler.data.useNewModel,
          );
          this.videoHandler.stopTranslate();
        })();
      },
    );

    this.videoHandler.votTranslationErrorsServiceSelect.labelElement.addEventListener(
      "change",
      (e) => {
        (async () => {
          this.videoHandler.data.translateAPIErrors = Number(e.target.checked);
          await votStorage.set(
            "translateAPIErrors",
            this.videoHandler.data.translateAPIErrors,
          );
          debug.log(
            "translateAPIErrors value changed. New value: ",
            this.videoHandler.data.translateAPIErrors,
          );
        })();
      },
    );

    // ----- SUBTITLES Settings Events -----
    this.videoHandler.votSubtitlesDetails.container.addEventListener(
      "click",
      () => {
        this.videoHandler.votSubtitlesDialog = ui.createDialog(
          localizationProvider.get("VOTSubtitlesDesign"),
        );
        this.videoHandler.votSubtitlesDialog.container.classList.add(
          "vot-dialog-temp",
        );
        this.videoHandler.votSubtitlesDialog.container.hidden = false;
        // Remove the modal after use.
        this.videoHandler.votSubtitlesDialog.backdrop.onclick =
          this.videoHandler.votSubtitlesDialog.closeButton.onclick = () => {
            this.videoHandler.votSubtitlesDialog.container.remove();
          };

        // Create subtitles elements.
        this.videoHandler.votSubtitlesHighlightWordsCheckbox =
          ui.createCheckbox(
            localizationProvider.get("VOTHighlightWords"),
            this.videoHandler.data?.highlightWords ?? false,
          );
        this.videoHandler.votSubtitlesDialog.bodyContainer.appendChild(
          this.videoHandler.votSubtitlesHighlightWordsCheckbox.container,
        );

        this.videoHandler.votSubtitlesDownloadFormatSelect = ui.createVOTSelect(
          this.videoHandler.data.subtitlesDownloadFormat.toUpperCase(),
          localizationProvider.get("VOTSubtitlesDownloadFormat"),
          genOptionsByOBJ(
            subtitlesFormats,
            this.videoHandler.data.subtitlesDownloadFormat,
          ),
          {
            onSelectCb: async (e) => {
              this.videoHandler.data.subtitlesDownloadFormat =
                e.target.dataset.votValue;
              await votStorage.set(
                "subtitlesDownloadFormat",
                this.videoHandler.data.subtitlesDownloadFormat,
              );
            },
            labelElement: ui.createVOTSelectLabel(
              localizationProvider.get("VOTSubtitlesDownloadFormat"),
            ),
          },
        );
        this.videoHandler.votSubtitlesDialog.bodyContainer.appendChild(
          this.videoHandler.votSubtitlesDownloadFormatSelect.container,
        );

        this.videoHandler.votSubtitlesMaxLengthSlider = ui.createSlider(
          html`${localizationProvider.get("VOTSubtitlesMaxLength")}:
            <strong
              >${this.videoHandler.data?.subtitlesMaxLength ?? 300}</strong
            >`,
          this.videoHandler.data?.subtitlesMaxLength ?? 300,
          50,
          300,
        );
        this.videoHandler.votSubtitlesDialog.bodyContainer.appendChild(
          this.videoHandler.votSubtitlesMaxLengthSlider.container,
        );

        this.videoHandler.votSubtitlesFontSizeSlider = ui.createSlider(
          html`${localizationProvider.get("VOTSubtitlesFontSize")}:
            <strong
              >${this.videoHandler.data?.subtitlesFontSize ?? 20}</strong
            >`,
          this.videoHandler.data?.subtitlesFontSize ?? 20,
          8,
          50,
        );
        this.videoHandler.votSubtitlesDialog.bodyContainer.appendChild(
          this.videoHandler.votSubtitlesFontSizeSlider.container,
        );

        this.videoHandler.votSubtitlesOpacitySlider = ui.createSlider(
          html`${localizationProvider.get("VOTSubtitlesOpacity")}:
            <strong>${this.videoHandler.data?.subtitlesOpacity ?? 20}</strong>`,
          this.videoHandler.data?.subtitlesOpacity ?? 20,
          0,
          100,
        );
        this.videoHandler.votSubtitlesDialog.bodyContainer.appendChild(
          this.videoHandler.votSubtitlesOpacitySlider.container,
        );

        // Subtitles events.
        this.videoHandler.votSubtitlesHighlightWordsCheckbox.input.addEventListener(
          "change",
          (e) => {
            (async () => {
              this.videoHandler.data.highlightWords = Number(e.target.checked);
              await votStorage.set(
                "highlightWords",
                this.videoHandler.data.highlightWords,
              );
              debug.log(
                "highlightWords value changed. New value: ",
                this.videoHandler.data.highlightWords,
              );
              this.videoHandler.subtitlesWidget.setHighlightWords(
                this.videoHandler.data.highlightWords,
              );
            })();
          },
        );
        this.videoHandler.votSubtitlesMaxLengthSlider.input.addEventListener(
          "input",
          (e) => {
            (async () => {
              this.videoHandler.data.subtitlesMaxLength = Number(
                e.target.value,
              );
              await votStorage.set(
                "subtitlesMaxLength",
                this.videoHandler.data.subtitlesMaxLength,
              );
              this.videoHandler.votSubtitlesMaxLengthSlider.label.querySelector(
                "strong",
              ).textContent = `${this.videoHandler.data.subtitlesMaxLength}`;
              this.videoHandler.subtitlesWidget.setMaxLength(
                this.videoHandler.data.subtitlesMaxLength,
              );
            })();
          },
        );
        this.videoHandler.votSubtitlesFontSizeSlider.input.addEventListener(
          "input",
          (e) => {
            (async () => {
              this.videoHandler.data.subtitlesFontSize = Number(e.target.value);
              await votStorage.set(
                "subtitlesFontSize",
                this.videoHandler.data.subtitlesFontSize,
              );
              this.videoHandler.votSubtitlesFontSizeSlider.label.querySelector(
                "strong",
              ).textContent = `${this.videoHandler.data.subtitlesFontSize}`;
              this.videoHandler.subtitlesWidget.setFontSize(
                this.videoHandler.data.subtitlesFontSize,
              );
            })();
          },
        );
        this.videoHandler.votSubtitlesOpacitySlider.input.addEventListener(
          "input",
          (e) => {
            (async () => {
              this.videoHandler.data.subtitlesOpacity = Number(e.target.value);
              await votStorage.set(
                "subtitlesOpacity",
                this.videoHandler.data.subtitlesOpacity,
              );
              this.videoHandler.votSubtitlesOpacitySlider.label.querySelector(
                "strong",
              ).textContent = `${this.videoHandler.data.subtitlesOpacity}`;
              this.videoHandler.subtitlesWidget.setOpacity(
                this.videoHandler.data.subtitlesOpacity,
              );
            })();
          },
        );

        this.videoHandler.votPortal.appendChild(
          this.videoHandler.votSubtitlesDialog.container,
        );
      },
    );

    // ----- OTHER Settings -----
    this.videoHandler.votShowPiPButtonCheckbox.input.addEventListener(
      "change",
      (e) => {
        (async () => {
          this.videoHandler.data.showPiPButton = Number(e.target.checked);
          await votStorage.set(
            "showPiPButton",
            this.videoHandler.data.showPiPButton,
          );
          debug.log(
            "showPiPButton value changed. New value: ",
            this.videoHandler.data.showPiPButton,
          );
          this.videoHandler.votButton.pipButton.hidden =
            this.videoHandler.votButton.separator2.hidden =
              !isPiPAvailable() || !this.videoHandler.data.showPiPButton;
        })();
      },
    );
    this.videoHandler.votM3u8ProxyHostTextfield.input.addEventListener(
      "change",
      (e) => {
        (async () => {
          this.videoHandler.data.m3u8ProxyHost =
            e.target.value || m3u8ProxyHost;
          await votStorage.set(
            "m3u8ProxyHost",
            this.videoHandler.data.m3u8ProxyHost,
          );
          debug.log(
            "m3u8ProxyHost value changed. New value: ",
            this.videoHandler.data.m3u8ProxyHost,
          );
        })();
      },
    );
    this.videoHandler.votProxyWorkerHostTextfield.input.addEventListener(
      "change",
      (e) => {
        (async () => {
          this.videoHandler.data.proxyWorkerHost =
            e.target.value || proxyWorkerHost;
          await votStorage.set(
            "proxyWorkerHost",
            this.videoHandler.data.proxyWorkerHost,
          );
          debug.log(
            "proxyWorkerHost value changed. New value: ",
            this.videoHandler.data.proxyWorkerHost,
          );
          if (this.videoHandler.data.translateProxyEnabled) {
            this.videoHandler.votClient.host =
              this.videoHandler.data.proxyWorkerHost;
          }
        })();
      },
    );
    this.videoHandler.votOnlyBypassMediaCSPCheckbox.input.addEventListener(
      "change",
      (e) => {
        (async () => {
          this.videoHandler.data.onlyBypassMediaCSP = Number(e.target.checked);
          await votStorage.set(
            "onlyBypassMediaCSP",
            this.videoHandler.data.onlyBypassMediaCSP,
          );
          debug.log(
            "onlyBypassMediaCSP value changed. New value: ",
            this.videoHandler.data.onlyBypassMediaCSP,
          );
          this.videoHandler.stopTranslate();
          this.videoHandler.createPlayer();
        })();
      },
    );
    this.videoHandler.votNewAudioPlayerCheckbox.input.addEventListener(
      "change",
      (e) => {
        (async () => {
          const checked = e.target.checked;
          this.videoHandler.data.newAudioPlayer = Number(checked);
          await votStorage.set(
            "newAudioPlayer",
            this.videoHandler.data.newAudioPlayer,
          );
          debug.log(
            "newAudioPlayer value changed. New value: ",
            this.videoHandler.data.newAudioPlayer,
          );
          this.videoHandler.stopTranslate();
          this.videoHandler.createPlayer();
          this.videoHandler.votOnlyBypassMediaCSPCheckbox.input.disabled =
            this.videoHandler.votOnlyBypassMediaCSPCheckbox.container.hidden =
              !checked;
        })();
      },
    );
    this.videoHandler.votBugReportButton.addEventListener("click", () => {
      const params = new URLSearchParams(
        this.videoHandler.collectReportInfo(),
      ).toString();
      window.open(`${repositoryUrl}/issues/new?${params}`, "_blank").focus();
    });
    this.videoHandler.votUpdateLocaleFilesButton.addEventListener(
      "click",
      () => {
        (async () => {
          await votStorage.set("locale-hash", "");
          await localizationProvider.update(true);
          window.location.reload();
        })();
      },
    );
    this.videoHandler.votResetSettingsButton.addEventListener("click", () => {
      (async () => {
        localizationProvider.reset();
        const valuesForClear = await votStorage.list();
        for (let i = 0; i < valuesForClear.length; i++) {
          const v = valuesForClear[i];
          if (!localizationProvider.gmValues.includes(v)) {
            votStorage.syncDelete(v);
          }
        }
        window.location.reload();
      })();
    });
  }
}

/*─────────────────────────────────────────────────────────────*/
/*       Helper class: VOTTranslationHandler                   */
/*  Handles video translation, audio URL validation, etc.      */
/*─────────────────────────────────────────────────────────────*/
class VOTTranslationHandler {
  /**
   * @param {VideoHandler} videoHandler Parent VideoHandler instance.
   */
  constructor(videoHandler) {
    this.videoHandler = videoHandler;
  }

  /**
   * Translates video data via API.
   * @param {Object} videoData The video data object.
   * @param {string} requestLang Source language.
   * @param {string} responseLang Target language.
   * @param {Object|null} [translationHelp=null] Optional translation helper data.
   * @returns {Promise<Object|null>} Promise resolving to the translation result.
   */
  async translateVideoImpl(
    videoData,
    requestLang,
    responseLang,
    translationHelp = null,
  ) {
    clearTimeout(this.videoHandler.autoRetry);
    debug.log(
      videoData,
      `Translate video (requestLang: ${requestLang}, responseLang: ${responseLang})`,
    );
    try {
      const res = await this.videoHandler.votClient.translateVideo({
        videoData,
        requestLang,
        responseLang,
        translationHelp,
        extraOpts: {
          useNewModel: this.videoHandler.data?.useNewModel,
          videoTitle: this.videoHandler.videoData.title,
        },
      });
      debug.log("Translate video result", res);
      if (res.translated && res.remainingTime < 1) {
        debug.log("Video translation finished with this data: ", res);
        return res;
      }
      const message =
        res.message ?? localizationProvider.get("translationTakeFewMinutes");
      await this.videoHandler.updateTranslationErrorMsg(
        res.remainingTime > 0 ? secsToStrTime(res.remainingTime) : message,
      );
    } catch (err) {
      await this.videoHandler.updateTranslationErrorMsg(
        err.data?.message ?? err,
      );
      console.error("[VOT]", err);
      const cacheKey = `${videoData.videoId}_${requestLang}_${responseLang}_${this.videoHandler.data.useNewModel}`;
      this.videoHandler.cacheManager.setTranslation(cacheKey, { error: err });
      return null;
    }
    return new Promise((resolve) => {
      this.videoHandler.autoRetry = setTimeout(async () => {
        resolve(
          await this.translateVideoImpl(
            videoData,
            requestLang,
            responseLang,
            translationHelp,
          ),
        );
      }, 20000);
    });
  }

  /**
   * Translates a video stream.
   * @param {Object} videoData The video data.
   * @param {string} requestLang Source language.
   * @param {string} responseLang Target language.
   * @returns {Promise<Object|null>} Promise resolving to the stream translation result.
   */
  async translateStreamImpl(videoData, requestLang, responseLang) {
    clearTimeout(this.videoHandler.autoRetry);
    debug.log(
      videoData,
      `Translate stream (requestLang: ${requestLang}, responseLang: ${responseLang})`,
    );
    try {
      const res = await this.videoHandler.votClient.translateStream({
        videoData,
        requestLang,
        responseLang,
      });
      debug.log("Translate stream result", res);
      if (!res.translated && res.interval === 10) {
        await this.videoHandler.updateTranslationErrorMsg(
          localizationProvider.get("translationTakeFewMinutes"),
        );
        return new Promise((resolve) => {
          this.videoHandler.autoRetry = setTimeout(async () => {
            resolve(
              await this.translateStreamImpl(
                videoData,
                requestLang,
                responseLang,
              ),
            );
          }, res.interval * 1000);
        });
      }
      if (res.message) {
        debug.log(`Stream translation aborted! Message: ${res.message}`);
        throw new VOTLocalizedError("streamNoConnectionToServer");
      }
      if (!res.result) {
        debug.log("Failed to find translation result! Data:", res);
        throw new VOTLocalizedError("audioNotReceived");
      }
      debug.log("Stream translated successfully. Running...", res);
      this.videoHandler.streamPing = setInterval(async () => {
        debug.log("Ping stream translation", res.pingId);
        this.videoHandler.votClient.pingStream({ pingId: res.pingId });
      }, res.interval * 1000);
      return res;
    } catch (err) {
      console.error("[VOT] Failed to translate stream", err);
      await this.videoHandler.updateTranslationErrorMsg(
        err.data?.message ?? err,
      );
      return null;
    }
  }

  /**
   * Handles the translation button click.
   * @returns {Promise<void>}
   */
  async handleTranslationBtnClick() {
    debug.log(
      "[click translationBtn]",
      this.videoHandler.audioPlayer,
      this.videoHandler.audioPlayer.player,
    );
    if (this.videoHandler.audioPlayer.player.src) {
      debug.log(
        "[click translationBtn] audio.src is not empty",
        this.videoHandler.audioPlayer.player.src,
      );
      this.videoHandler.stopTranslate();
      return;
    }
    if (this.videoHandler.hls?.url) {
      debug.log(
        "[click translationBtn] hls is not empty",
        this.videoHandler.hls.url,
      );
      this.videoHandler.stopTranslate();
      return;
    }
    try {
      debug.log("[click translationBtn] trying execute translation");
      if (!this.videoHandler.videoData.videoId) {
        throw new VOTLocalizedError("VOTNoVideoIDFound");
      }
      // For VK clips and Douyin, get the current video ID.
      if (
        (this.videoHandler.site.host === "vk" &&
          this.videoHandler.site.additionalData === "clips") ||
        this.videoHandler.site.host === "douyin"
      ) {
        this.videoHandler.videoData = await this.videoHandler.getVideoData();
      }
      debug.log("Run translateFunc", this.videoHandler.videoData.videoId);
      this.videoHandler.isTranslating = true;
      await this.videoHandler.translateFunc(
        this.videoHandler.videoData.videoId,
        this.videoHandler.videoData.isStream,
        this.videoHandler.videoData.detectedLanguage,
        this.videoHandler.videoData.responseLanguage,
        this.videoHandler.videoData.translationHelp,
      );
    } catch (err) {
      console.error("[VOT]", err);
      if (err?.name === "VOTLocalizedError") {
        this.videoHandler.transformBtn("error", err.localizedMessage);
      } else {
        this.videoHandler.transformBtn("error", err?.message);
      }
    }
  }
}

/*─────────────────────────────────────────────────────────────*/
/*         Helper class: VOTVideoManager                       */
/*  Handles video data retrieval, volume controls, subtitles, and related events  */
/*─────────────────────────────────────────────────────────────*/
class VOTVideoManager {
  /**
   * @param {VideoHandler} videoHandler Parent VideoHandler instance.
   */
  constructor(videoHandler) {
    this.videoHandler = videoHandler;
  }

  /**
   * Retrieves video data from the page.
   * @returns {Promise<Object>} Video data object.
   */
  async getVideoData() {
    const {
      duration,
      url,
      videoId,
      host,
      title,
      translationHelp = null,
      localizedTitle,
      description,
      detectedLanguage: possibleLanguage,
      subtitles,
      isStream = false,
    } = await getVideoData(this.videoHandler.site, {
      fetchFn: GM_fetch,
      video: this.videoHandler.video,
      language: localizationProvider.lang,
    });

    let detectedLanguage =
      possibleLanguage ?? this.videoHandler.translateFromLang;
    if (!possibleLanguage && title) {
      const text = cleanText(title, description);
      debug.log(`Detecting language text: ${text}`);
      const language = await detect(text);
      if (availableLangs.includes(language)) {
        detectedLanguage = language;
      }
    }
    const videoData = {
      translationHelp,
      isStream,
      duration:
        duration ||
        this.videoHandler.video?.duration ||
        votConfig.defaultDuration, // if 0, we get 400 error
      videoId,
      url,
      host,
      detectedLanguage,
      responseLanguage: this.videoHandler.translateToLang,
      subtitles,
      title,
      localizedTitle,
      downloadTitle: localizedTitle ?? title ?? videoId,
    };
    console.log("[VOT] Detected language:", detectedLanguage);
    // For certain hosts, force a default language.
    if (["rutube", "ok.ru", "mail_ru"].includes(this.videoHandler.site.host)) {
      videoData.detectedLanguage = "ru";
    } else if (this.videoHandler.site.host === "youku") {
      videoData.detectedLanguage = "zh";
    } else if (this.videoHandler.site.host === "vk") {
      const trackLang = document.getElementsByTagName("track")?.[0]?.srclang;
      videoData.detectedLanguage = trackLang || "auto";
    } else if (this.videoHandler.site.host === "weverse") {
      videoData.detectedLanguage = "ko";
    }
    return videoData;
  }

  /**
   * Validates video data (duration, language) before translation.
   * @throws {VOTLocalizedError} If the video is too long or in a language that should not be translated.
   * @returns {boolean} True if video is valid.
   */
  videoValidator() {
    debug.log("VideoValidator videoData: ", this.videoHandler.videoData);
    if (
      this.videoHandler.data.dontTranslateYourLang === 1 &&
      this.videoHandler.data.dontTranslateLanguage?.includes(
        this.videoHandler.videoData.detectedLanguage,
      )
    ) {
      throw new VOTLocalizedError("VOTDisableFromYourLang");
    }
    if (
      !this.videoHandler.videoData.isStream &&
      this.videoHandler.videoData.duration > 14400
    ) {
      throw new VOTLocalizedError("VOTVideoIsTooLong");
    }
    return true;
  }

  /**
   * Gets current video volume (0.0 - 1.0).
   * @returns {number} Video volume.
   */
  getVideoVolume() {
    let videoVolume = this.videoHandler.video?.volume;
    if (["youtube", "googledrive"].includes(this.videoHandler.site.host)) {
      videoVolume = YoutubeHelper.getVolume() ?? videoVolume;
    }
    return videoVolume;
  }

  /**
   * Sets the video volume.
   * @param {number} volume A value between 0.0 and 1.0.
   * @returns {VideoHandler} The VideoHandler instance.
   */
  setVideoVolume(volume) {
    if (["youtube", "googledrive"].includes(this.videoHandler.site.host)) {
      const videoVolume = YoutubeHelper.setVolume(volume);
      if (videoVolume) return this.videoHandler;
    }
    this.videoHandler.video.volume = volume;
    return this.videoHandler;
  }

  /**
   * Checks if the video is muted.
   * @returns {boolean} True if muted.
   */
  isMuted() {
    return ["youtube", "googledrive"].includes(this.videoHandler.site.host)
      ? YoutubeHelper.isMuted()
      : this.videoHandler.video?.muted;
  }

  /**
   * Syncs the video volume slider with the actual video volume.
   */
  syncVideoVolumeSlider() {
    const videoVolume = this.isMuted() ? 0 : this.getVideoVolume() * 100;
    const newSlidersVolume = Math.round(videoVolume);
    this.videoHandler.votVideoVolumeSlider.input.value = newSlidersVolume;
    this.videoHandler.votVideoVolumeSlider.label.querySelector(
      "strong",
    ).textContent = `${newSlidersVolume}%`;
    ui.updateSlider(this.videoHandler.votVideoVolumeSlider.input);
    if (this.videoHandler.data.syncVolume === 1) {
      this.videoHandler.tempOriginalVolume = Number(newSlidersVolume);
    }
  }

  /**
   * Sets the language select menu values.
   * @param {string} from Source language code.
   * @param {string} to Target language code.
   */
  setSelectMenuValues(from, to) {
    this.videoHandler.votTranslationLanguageSelect.fromSelect.setTitle(
      localizationProvider.get("langs")[from],
    );
    this.videoHandler.votTranslationLanguageSelect.toSelect.setTitle(
      localizationProvider.get("langs")[to],
    );
    this.videoHandler.votTranslationLanguageSelect.fromSelect.setSelected(from);
    this.videoHandler.votTranslationLanguageSelect.toSelect.setSelected(to);
    console.log(`[VOT] Set translation from ${from} to ${to}`);
    this.videoHandler.videoData.detectedLanguage = from;
    this.videoHandler.videoData.responseLanguage = to;
  }
}

/*─────────────────────────────────────────────────────────────*/
/*                        Main class: VideoHandler             */
/*  Composes the helper classes and retains full functionality.  */
/*─────────────────────────────────────────────────────────────*/
class VideoHandler {
  /** @type {string} */
  translateFromLang = "auto";
  /** @type {string} */
  translateToLang = calculatedResLang;
  /** @type {number|undefined} */
  timer;
  /** @type {any} */
  videoData = "";
  /** @type {boolean} */
  firstPlay = true;
  /** @type {AudioContext} */
  audioContext = initAudioContext();
  hls; // For HLS streaming (if applicable)
  /** @type {VOTClient|VOTWorkerClient} */
  votClient;
  /** @type {Chaimu} */
  audioPlayer;
  cacheManager; // cache for translation and subtitles
  downloadTranslationUrl = null;
  autoRetry; // auto retry timeout
  streamPing; // stream ping interval
  votOpts;
  volumeOnStart;
  tempOriginalVolume; // temp video volume for syncing
  tempVolume; // temp translation volume for syncing
  firstSyncVolume = true; // used for skip 1st syncing with observer
  longWaitingResCount = 0;
  subtitles = []; // current subtitle list
  /** @type {any} */
  dragging;

  /**
   * Constructs a new VideoHandler instance.
   * @param {HTMLVideoElement} video The video element to handle.
   * @param {HTMLElement} container The container element for the video.
   * @param {Object} site The site object associated with the video.
   */
  constructor(video, container, site) {
    debug.log(
      "[VideoHandler] add video:",
      video,
      "container:",
      container,
      this,
    );
    this.video = video;
    this.container = container;
    this.site = site;
    this.abortController = new AbortController();
    this.extraEvents = [];
    // Create helper instances.
    this.uiManager = new VOTUIManager(this);
    this.translationHandler = new VOTTranslationHandler(this);
    this.videoManager = new VOTVideoManager(this);
    this.cacheManager = new CacheManager();
    this.init();
  }

  /**
   * Returns the container element for event listeners.
   * @returns {HTMLElement} The event container.
   */
  getEventContainer() {
    if (!this.site.eventSelector) return this.container;
    if (this.site.host === "twitter")
      return this.container.closest(this.site.eventSelector);
    return document.querySelector(this.site.eventSelector);
  }

  /**
   * Auto-initiates translation if conditions are met.
   */
  async autoTranslate() {
    if (
      !(
        this.firstPlay &&
        this.data.autoTranslate === 1 &&
        this.videoData.videoId
      )
    )
      return;
    this.firstPlay = false;
    try {
      this.videoManager.videoValidator();
      await this.translationHandler.handleTranslationBtnClick();
    } catch (err) {
      console.error("[VOT]", err);
      return;
    }
  }

  /**
   * Determines if audio should be preferred.
   * @returns {boolean} True if audio is preferred.
   */
  getPreferAudio() {
    if (!this.audioContext) return true;
    if (!this.data.newAudioPlayer) return true;
    if (this.videoData.isStream) return true; // Use old player for streams with HLS
    if (this.data.newAudioPlayer && !this.data.onlyBypassMediaCSP) return false;
    return !this.site.needBypassCSP;
  }

  /**
   * Creates the audio player.
   * @returns {VideoHandler} The VideoHandler instance.
   */
  createPlayer() {
    const preferAudio = this.getPreferAudio();
    debug.log("preferAudio:", preferAudio);
    this.audioPlayer = new Chaimu({
      video: this.video,
      debug: DEBUG_MODE,
      fetchFn: GM_fetch,
      fetchOpts: { timeout: 0 },
      preferAudio,
    });
    return this;
  }

  /**
   * Initializes the VideoHandler: loads settings, UI, video data, events, etc.
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) return;

    // Retrieve settings from storage.
    const dataPromises = {
      autoTranslate: votStorage.get("autoTranslate", 0),
      dontTranslateLanguage: votStorage.get("dontTranslateLanguage", [
        calculatedResLang,
      ]),
      dontTranslateYourLang: votStorage.get("dontTranslateYourLang", 1),
      autoSetVolumeYandexStyle: votStorage.get("autoSetVolumeYandexStyle", 1),
      autoVolume: votStorage.get("autoVolume", defaultAutoVolume),
      buttonPos: votStorage.get("buttonPos", "default"),
      showVideoSlider: votStorage.get("showVideoSlider", 1),
      syncVolume: votStorage.get("syncVolume", 0),
      downloadWithName: votStorage.get("downloadWithName", 1),
      sendNotifyOnComplete: votStorage.get("sendNotifyOnComplete", 0),
      subtitlesMaxLength: votStorage.get("subtitlesMaxLength", 300),
      highlightWords: votStorage.get("highlightWords", 0),
      subtitlesFontSize: votStorage.get("subtitlesFontSize", 20),
      subtitlesOpacity: votStorage.get("subtitlesOpacity", 20),
      subtitlesDownloadFormat: votStorage.get("subtitlesDownloadFormat", "srt"),
      responseLanguage: votStorage.get("responseLanguage", calculatedResLang),
      defaultVolume: votStorage.get("defaultVolume", 100),
      onlyBypassMediaCSP: votStorage.get(
        "onlyBypassMediaCSP",
        Number(!!this.audioContext),
      ),
      newAudioPlayer: votStorage.get(
        "newAudioPlayer",
        Number(!!this.audioContext),
      ),
      showPiPButton: votStorage.get("showPiPButton", 0),
      translateAPIErrors: votStorage.get("translateAPIErrors", 1),
      translationService: votStorage.get(
        "translationService",
        defaultTranslationService,
      ),
      detectService: votStorage.get("detectService", defaultDetectService),
      hotkeyButton: votStorage.get("hotkeyButton", null),
      m3u8ProxyHost: votStorage.get("m3u8ProxyHost", m3u8ProxyHost),
      proxyWorkerHost: votStorage.get("proxyWorkerHost", proxyWorkerHost),
      translateProxyEnabled: votStorage.get("translateProxyEnabled", 0),
      audioBooster: votStorage.get("audioBooster", 0),
      useNewModel: votStorage.get("useNewModel", 1),
      localeHash: votStorage.get("locale-hash", ""),
      localeUpdatedAt: votStorage.get("locale-updated-at", 0),
    };

    this.data = Object.fromEntries(
      await Promise.all(
        Object.entries(dataPromises).map(async ([key, promise]) => [
          key,
          await promise,
        ]),
      ),
    );
    console.log("[VOT] data from db: ", this.data);

    // Convert old settings to new values (backwards compatibility)
    await convertData(
      this.data,
      "m3u8ProxyHost",
      "m3u8-proxy.toil.cc",
      m3u8ProxyHost,
    );
    await convertData(
      this.data,
      "proxyWorkerHost",
      "vot.toil.cc",
      proxyWorkerHost,
    );
    await convertData(
      this.data,
      "detectService",
      "yandex",
      defaultDetectService,
    );
    await convertData(
      this.data,
      "translationService",
      "yandex",
      defaultTranslationService,
    );
    await convertData(
      this.data,
      "dontTranslateLanguage",
      false,
      [this.data.dontTranslateLanguage],
      Array.isArray(this.data.dontTranslateLanguage),
    );

    // Enable translate proxy if running in a supported script handler.
    if (
      !this.data.translateProxyEnabled &&
      GM_info?.scriptHandler &&
      proxyOnlyExtensions.includes(GM_info.scriptHandler)
    ) {
      this.data.translateProxyEnabled = 1;
    }
    // Determine country for proxy purposes.
    if (!countryCode) {
      try {
        const response = await GM_fetch("https://speed.cloudflare.com/meta", {
          timeout: 7000,
        });
        ({ country: countryCode } = await response.json());
        if (countryCode === "UA") this.data.translateProxyEnabled = 2;
      } catch (err) {
        console.error("[VOT] Error getting country:", err);
      }
    } else if (countryCode === "UA") {
      this.data.translateProxyEnabled = 2;
    }
    debug.log("translateProxyEnabled", this.data.translateProxyEnabled);
    debug.log("Extension compatibility passed...");

    this.initVOTClient();

    // Initialize subtitles widget.
    this.subtitlesWidget = new SubtitlesWidget(
      this.video,
      this.container,
      this.site,
    );
    this.subtitlesWidget.setMaxLength(this.data.subtitlesMaxLength);
    this.subtitlesWidget.setHighlightWords(this.data.highlightWords);
    this.subtitlesWidget.setFontSize(this.data.subtitlesFontSize);
    this.subtitlesWidget.setOpacity(this.data.subtitlesOpacity);

    // Initialize UI elements and events.
    this.uiManager.initUI();
    this.uiManager.initUIEvents();

    // Get video data and create player.
    this.videoData = await this.getVideoData();
    this.createPlayer();
    this.setSelectMenuValues(
      this.videoData.detectedLanguage,
      this.data.responseLanguage ?? "ru",
    );

    this.translateToLang = this.data.responseLanguage ?? "ru";
    this.initExtraEvents();

    await this.autoTranslate();

    this.initialized = true;
  }

  /**
   * Initializes the VOT client.
   * @returns {VideoHandler} This instance.
   */
  initVOTClient() {
    this.votOpts = {
      fetchFn: GM_fetch,
      hostVOT: votBackendUrl,
      host: this.data.translateProxyEnabled
        ? this.data.proxyWorkerHost
        : workerHost,
    };
    this.votClient = new (
      this.data.translateProxyEnabled ? VOTWorkerClient : VOTClient
    )(this.votOpts);
    return this;
  }

  /**
   * Checks if the provided text indicates a loading state.
   * @param {string} text The text to check.
   * @returns {boolean} True if text is a loading message.
   */
  isLoadingText(text) {
    return (
      text.includes(localizationProvider.get("translationTake")) ||
      text.includes(localizationProvider.get("TranslationDelayed"))
    );
  }

  /**
   * Sets the translation button state and text.
   * @param {string} status The new status.
   * @param {string} text The text to display.
   * @returns {VideoHandler} This instance.
   */
  transformBtn(status, text) {
    this.votButton.container.dataset.status = status;
    const isLoading = status === "error" && this.isLoadingText(text);
    this.setLoadingBtn(isLoading);
    this.votButton.label.textContent = text;
    this.votButtonTooltip.setContent(text);
    return this;
  }

  /**
   * Sets the loading indicator on the translation button.
   * @param {boolean} [loading=false] True to show loading indicator.
   * @returns {VideoHandler} This instance.
   */
  setLoadingBtn(loading = false) {
    this.votButton.container.dataset.loading = loading;
    return this;
  }

  /**
   * Initializes extra event listeners (resize, click outside, keydown, etc.).
   */
  initExtraEvents() {
    const { signal } = this.abortController;
    const addExtraEventListener = (element, event, handler) => {
      this.extraEvents.push({ element, event, handler });
      element.addEventListener(event, handler, { signal });
    };
    const addExtraEventListeners = (element, events, handler) => {
      events.forEach((event) => addExtraEventListener(element, event, handler));
    };

    // Update menu container height on resize.
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((e) => {
        this.votMenu.container.style.setProperty(
          "--vot-container-height",
          `${e.contentRect.height}px`,
        );
      });

      const { position, direction } = this.uiManager.getButtonPos();
      this.uiManager.updateButtonPos(position, direction);
    });
    this.resizeObserver.observe(this.video);
    this.votMenu.container.style.setProperty(
      "--vot-container-height",
      `${this.video.getBoundingClientRect().height}px`,
    );

    // Sync volume slider with original YouTube video.
    if (
      ["youtube", "googledrive"].includes(this.site.host) &&
      this.site.additionalData !== "mobile"
    ) {
      this.syncVolumeObserver = new MutationObserver((mutations) => {
        if (!this.audioPlayer.player.src || !this.data.syncVolume) return;
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "aria-valuenow"
          ) {
            if (this.firstSyncVolume) {
              this.firstSyncVolume = false;
              return;
            }
            const videoVolume = this.isMuted()
              ? 0
              : this.getVideoVolume() * 100;
            const finalVolume = Math.round(videoVolume);
            this.data.defaultVolume = finalVolume;
            this.audioPlayer.player.volume = this.data.defaultVolume / 100;
            this.syncVolumeWrapper("video", finalVolume);
          }
        });
      });
      const ytpVolumePanel = document.querySelector(".ytp-volume-panel");
      if (ytpVolumePanel) {
        this.syncVolumeObserver.observe(ytpVolumePanel, {
          attributes: true,
          subtree: true,
        });
      }
    }

    // Global document click event: hide menu if click is outside.
    document.addEventListener(
      "click",
      (event) => {
        const e = event.target;
        const button = this.votButton.container;
        const menu = this.votMenu.container;
        const container = this.container;
        const settings = this.votSettingsDialog.container;
        const tempDialog = document.querySelector(".vot-dialog-temp");
        const isButton = button.contains(e);
        const isMenu = menu.contains(e);
        const isVideo = container.contains(e);
        const isSettings = settings.contains(e);
        const isTempDialog = tempDialog?.contains(e) ?? false;
        debug.log(
          `[document click] ${isButton} ${isMenu} ${isVideo} ${isSettings} ${isTempDialog}`,
        );
        if (!(!isButton && !isMenu && !isSettings && !isTempDialog)) return;
        if (!isVideo) this.logout(0);
        this.votMenu.container.hidden = true;
      },
      { signal },
    );

    // Global keydown: trigger translation hotkey if appropriate.
    document.addEventListener(
      "keydown",
      async (event) => {
        const code = event.code;
        const activeElement = document.activeElement;
        const isInputElement =
          ["input", "textarea"].includes(activeElement.tagName.toLowerCase()) ||
          activeElement.isContentEditable;
        if (!isInputElement && code === this.data.hotkeyButton)
          await this.translationHandler.handleTranslationBtnClick();
      },
      { signal },
    );

    let eventContainer = this.getEventContainer();
    if (eventContainer)
      addExtraEventListeners(
        eventContainer,
        ["pointermove", "pointerout"],
        this.resetTimer,
      );

    addExtraEventListener(
      this.votButton.container,
      "pointermove",
      this.changeOpacityOnEvent,
    );
    addExtraEventListener(
      this.votMenu.container,
      "pointermove",
      this.changeOpacityOnEvent,
    );
    // fix #866
    if (this.site.host !== "xvideos")
      addExtraEventListener(document, "touchmove", this.resetTimer);

    // Prevent propagation on pointerdown events.
    addExtraEventListener(this.votButton.container, "pointerdown", (e) => {
      e.stopImmediatePropagation();
    });
    // don't change mousedown, otherwise it may break on youtube
    addExtraEventListeners(
      this.votMenu.container,
      ["pointerdown", "mousedown"],
      (e) => {
        e.stopImmediatePropagation();
      },
    );

    // fix draggable menu in youtube (#394, #417)
    if (this.site.host === "youtube") this.container.draggable = false;
    if (this.site.host === "googledrive") this.container.style.height = "100%";

    addExtraEventListener(this.video, "canplay", async () => {
      if (this.site.host === "rutube" && this.video.src) return;
      await this.setCanPlay();
    });
    addExtraEventListener(this.video, "emptied", async () => {
      if (
        this.video.src &&
        (await getVideoID(this.site, {
          fetchFn: GM_fetch,
          video: this.video,
        })) === this.videoData.videoId
      )
        return;
      debug.log("lipsync mode is emptied");
      this.videoData = "";
      this.stopTranslation();
    });
    if (!["rutube", "ok"].includes(this.site.host)) {
      addExtraEventListener(this.video, "volumechange", () => {
        this.syncVideoVolumeSlider();
      });
    }
    if (this.site.host === "youtube" && !this.site.additionalData) {
      addExtraEventListener(document, "yt-page-data-updated", async () => {
        debug.log("yt-page-data-updated");
        // fix #802
        if (!window.location.pathname.includes("/shorts/")) return;
        await this.setCanPlay();
      });
    }
  }

  /**
   * Called when the video can play.
   */
  async setCanPlay() {
    if (
      (await getVideoID(this.site, {
        fetchFn: GM_fetch,
        video: this.video,
      })) === this.videoData.videoId
    )
      return;
    await this.handleSrcChanged();
    await this.autoTranslate();
    debug.log("lipsync mode is canplay");
  }

  /**
   * Adjusts the opacity of the button container.
   * @param {number} n The new opacity value.
   */
  logout(n) {
    if (!this.votMenu.container.hidden) return;
    this.votButton.container.style.opacity = n;
  }

  /**
   * Resets the auto-hide timer for the UI.
   */
  resetTimer = () => {
    clearTimeout(this.timer);
    this.logout(1);
    this.timer = setTimeout(() => {
      this.logout(0);
    }, 1000);
  };

  /**
   * Changes the opacity when an event occurs.
   * @param {Event} event The event object.
   */
  changeOpacityOnEvent = (event) => {
    clearTimeout(this.timer);
    this.logout(1);
    event.stopPropagation();
  };

  /**
   * Changes subtitles language based on user selection.
   * @param {string} subs The subtitles selection value.
   */
  async changeSubtitlesLang(subs) {
    debug.log("[onchange] subtitles", subs);
    this.votSubtitlesSelect.setSelected(subs);
    if (subs === "disabled") {
      this.votSubtitlesSelect.setTitle(
        localizationProvider.get("VOTSubtitlesDisabled"),
      );
      this.subtitlesWidget.setContent(null);
      this.votDownloadSubtitlesButton.hidden = true;
      this.yandexSubtitles = null;
    } else {
      const subtitlesObj = this.subtitles.at(parseInt(subs));
      if (
        this.data.translateProxyEnabled === 2 &&
        subtitlesObj.url.startsWith(
          "https://brosubs.s3-private.mds.yandex.net/vtrans/",
        )
      ) {
        const subsPath = subtitlesObj.url.replace(
          "https://brosubs.s3-private.mds.yandex.net/vtrans/",
          "",
        );
        subtitlesObj.url = `https://${this.data.proxyWorkerHost}/video-subtitles/subtitles-proxy/${subsPath}`;
        console.log(`[VOT] Subs proxied via ${subtitlesObj.url}`);
      }
      this.yandexSubtitles =
        await SubtitlesProcessor.fetchSubtitles(subtitlesObj);
      this.subtitlesWidget.setContent(this.yandexSubtitles);
      this.votDownloadSubtitlesButton.hidden = false;
    }
  }

  /**
   * Updates the subtitles selection options.
   */
  async updateSubtitlesLangSelect() {
    if (!this.subtitles || this.subtitles.length === 0) {
      const updatedOptions = [
        {
          label: localizationProvider.get("VOTSubtitlesDisabled"),
          value: "disabled",
          selected: true,
          disabled: false,
        },
      ];
      this.votSubtitlesSelect.updateItems(updatedOptions);
      await this.changeSubtitlesLang(updatedOptions[0].value);
      return;
    }
    const updatedOptions = [
      {
        label: localizationProvider.get("VOTSubtitlesDisabled"),
        value: "disabled",
        selected: true,
        disabled: false,
      },
      ...this.subtitles.map((s, idx) => ({
        label:
          (localizationProvider.get("langs")[s.language] ??
            s.language.toUpperCase()) +
          (s.translatedFromLanguage
            ? ` ${localizationProvider.get("VOTTranslatedFrom")} ${
                localizationProvider.get("langs")[s.translatedFromLanguage] ??
                s.translatedFromLanguage.toUpperCase()
              }`
            : "") +
          (s.source !== "yandex" ? `, ${window.location.hostname}` : "") +
          (s.isAutoGenerated
            ? ` (${localizationProvider.get("VOTAutogenerated")})`
            : ""),
        value: idx,
        selected: false,
        disabled: false,
      })),
    ];
    this.votSubtitlesSelect.updateItems(updatedOptions);
    await this.changeSubtitlesLang(updatedOptions[0].value);
  }

  /**
   * Loads subtitles for the current video.
   */
  async loadSubtitles() {
    if (!this.videoData.videoId) {
      console.error(
        `[VOT] ${localizationProvider.getDefault("VOTNoVideoIDFound")}`,
      );
      this.subtitles = [];
      return;
    }
    const cacheKey = `${this.videoData.videoId}_${this.videoData.detectedLanguage}_${this.videoData.responseLanguage}_${this.data.useNewModel}`;
    try {
      let cachedSubs = this.cacheManager.getSubtitles(cacheKey);
      if (!cachedSubs) {
        cachedSubs = await SubtitlesProcessor.getSubtitles(
          this.votClient,
          this.videoData,
        );
        this.cacheManager.setSubtitles(cacheKey, cachedSubs);
      }
      this.subtitles = cachedSubs;
    } catch (error) {
      console.error("[VOT] Failed to load subtitles:", error);
      this.subtitles = [];
    }
    await this.updateSubtitlesLangSelect();
  }

  /**
   * Gets the video volume.
   * @returns {number} The video volume (0.0 - 1.0).
   */
  getVideoVolume() {
    return this.videoManager.getVideoVolume();
  }

  /**
   * Sets the video volume.
   * @param {number} volume A number between 0 and 1.
   * @returns {VideoHandler} This instance.
   */
  setVideoVolume(volume) {
    return this.videoManager.setVideoVolume(volume);
  }

  /**
   * Checks if the video is muted.
   * @returns {boolean} True if muted.
   */
  isMuted() {
    return this.videoManager.isMuted();
  }

  /**
   * Syncs the video volume slider.
   */
  syncVideoVolumeSlider() {
    this.videoManager.syncVideoVolumeSlider();
  }

  /**
   * Sets language select menu values.
   * @param {string} from Source language.
   * @param {string} to Target language.
   */
  setSelectMenuValues(from, to) {
    this.videoManager.setSelectMenuValues(from, to);
  }

  /**
   * Wraps over syncVolume for slider syncing.
   * @param {"translation"|"video"} fromType The initiator slider.
   * @param {number} newVolume The new volume value.
   */
  syncVolumeWrapper(fromType, newVolume) {
    const slider =
      fromType === "translation"
        ? this.votVideoVolumeSlider
        : this.votVideoTranslationVolumeSlider;
    const currentSliderValue = Number(slider.input.value);
    const finalValue = syncVolume(
      fromType === "translation" ? this.video : this.audioPlayer.player,
      newVolume,
      currentSliderValue,
      fromType === "translation" ? this.tempVolume : this.tempOriginalVolume,
    );
    slider.input.value = finalValue;
    slider.label.querySelector("strong").textContent = `${finalValue}%`;
    ui.updateSlider(slider.input);
    this.tempOriginalVolume =
      fromType === "translation" ? finalValue : newVolume;
    this.tempVolume = fromType === "translation" ? newVolume : finalValue;
  }

  /**
   * Retrieves video data.
   * @returns {Promise<Object>} The video data object.
   */
  async getVideoData() {
    return await this.videoManager.getVideoData();
  }

  /**
   * Validates the video.
   * @returns {boolean} True if valid.
   */
  videoValidator() {
    return this.videoManager.videoValidator();
  }

  /**
   * Stops translation and resets UI elements.
   */
  stopTranslate() {
    this.audioPlayer.player.removeVideoEvents();
    this.audioPlayer.player.clear();
    this.audioPlayer.player.src = undefined;
    debug.log("audioPlayer after stopTranslate", this.audioPlayer);
    this.votVideoVolumeSlider.container.hidden = true;
    this.votVideoTranslationVolumeSlider.container.hidden = true;
    this.votDownloadButton.hidden = true;
    this.downloadTranslationUrl = null;
    this.longWaitingResCount = 0;
    this.transformBtn("none", localizationProvider.get("translateVideo"));
    debug.log(`Volume on start: ${this.volumeOnStart}`);
    if (this.volumeOnStart) this.setVideoVolume(this.volumeOnStart);
    clearInterval(this.streamPing);
    clearTimeout(this.autoRetry);
    this.hls?.destroy();
    this.firstSyncVolume = true;
  }

  /**
   * Updates the translation error message on the UI.
   * @param {string|Error} errorMessage The error message.
   */
  async updateTranslationErrorMsg(errorMessage) {
    const translationTake = localizationProvider.get("translationTake");
    const lang = localizationProvider.lang;
    this.longWaitingResCount =
      errorMessage === localizationProvider.get("translationTakeAboutMinute")
        ? this.longWaitingResCount + 1
        : 0;
    debug.log("longWaitingResCount", this.longWaitingResCount);
    if (this.longWaitingResCount > minLongWaitingCount) {
      errorMessage = new VOTLocalizedError("TranslationDelayed");
    }
    if (errorMessage?.name === "VOTLocalizedError") {
      this.transformBtn("error", errorMessage.localizedMessage);
    } else if (errorMessage instanceof Error) {
      this.transformBtn("error", errorMessage?.message);
    } else if (
      this.data.translateAPIErrors === 1 &&
      lang !== "ru" &&
      !errorMessage.includes(translationTake)
    ) {
      this.setLoadingBtn(true);
      const translatedMessage = await translate(errorMessage, "ru", lang);
      this.transformBtn("error", translatedMessage);
    } else {
      this.transformBtn("error", errorMessage);
    }
    if (
      [
        "Подготавливаем перевод",
        "Видео передано в обработку",
        "Ожидаем перевод видео",
        "Загружаем переведенное аудио",
      ].includes(errorMessage)
    ) {
      this.setLoadingBtn(true);
    }
  }

  /**
   * Called after translation is updated.
   * @param {string} audioUrl The URL of the translation audio.
   */
  afterUpdateTranslation(audioUrl) {
    const isSuccess = this.votButton.container.dataset.status === "success";
    this.votVideoVolumeSlider.container.hidden =
      this.data.showVideoSlider !== 1 || !isSuccess;
    this.votVideoTranslationVolumeSlider.container.hidden = !isSuccess;
    if (this.data.autoSetVolumeYandexStyle === 1) {
      this.votVideoVolumeSlider.input.value = this.data.autoVolume * 100;
      this.votVideoVolumeSlider.label.querySelector("strong").textContent =
        `${this.data.autoVolume * 100}%`;
      ui.updateSlider(this.votVideoVolumeSlider.input);
    }
    if (!this.videoData.isStream) {
      this.votDownloadButton.hidden = false;
      this.downloadTranslationUrl = audioUrl;
    }
    debug.log(
      "afterUpdateTranslation downloadTranslationUrl",
      this.downloadTranslationUrl,
    );
    if (
      this.data.sendNotifyOnComplete &&
      this.longWaitingResCount &&
      isSuccess
    ) {
      GM_notification({
        text: localizationProvider
          .get("VOTTranslationCompletedNotify")
          .replace("{0}", window.location.hostname),
        title: GM_info.script.name,
        timeout: 5000,
        silent: true,
        tag: "VOTTranslationCompleted", // TM 5.0
        onclick: () => {
          window.focus();
        },
      });
    }
  }

  /**
   * Validates the audio URL by sending a HEAD request.
   * @param {string} audioUrl The audio URL to validate.
   * @returns {Promise<string>} The valid audio URL.
   */
  async validateAudioUrl(audioUrl) {
    try {
      const response = await GM_fetch(audioUrl, { method: "HEAD" });
      debug.log("Test audio response", response);
      if (response.ok) {
        debug.log("Valid audioUrl", audioUrl);
        return audioUrl;
      }
      debug.log("Yandex returned not valid audio, trying to fix...");
      let translateRes = await this.translationHandler.translateVideoImpl(
        this.videoData,
        (this.videoData.detectedLanguage = "auto"),
        this.videoData.responseLanguage,
        this.videoData.translationHelp,
      );
      this.setSelectMenuValues(
        this.videoData.detectedLanguage,
        this.videoData.responseLanguage,
      );
      audioUrl = translateRes.url;
      debug.log("Fixed audio audioUrl", audioUrl);
    } catch (err) {
      debug.log("Test audio error:", err);
    }
    return audioUrl;
  }

  /**
   * Proxifies the audio URL if needed.
   * @param {string} audioUrl The original audio URL.
   * @returns {string} The proxified audio URL.
   */
  proxifyAudio(audioUrl) {
    if (
      this.data.translateProxyEnabled === 2 &&
      audioUrl.startsWith("https://vtrans.s3-private.mds.yandex.net/tts/prod/")
    ) {
      const audioPath = audioUrl.replace(
        "https://vtrans.s3-private.mds.yandex.net/tts/prod/",
        "",
      );
      audioUrl = `https://${this.data.proxyWorkerHost}/video-translation/audio-proxy/${audioPath}`;
      console.log(`[VOT] Audio proxied via ${audioUrl}`);
    }
    return audioUrl;
  }

  /**
   * Updates the translation audio source.
   * @param {string} audioUrl The audio URL.
   */
  async updateTranslation(audioUrl) {
    if (audioUrl !== this.audioPlayer.player.currentSrc) {
      audioUrl = await this.validateAudioUrl(this.proxifyAudio(audioUrl));
    }
    if (this.audioPlayer.player.src !== audioUrl) {
      this.audioPlayer.player.src = audioUrl;
    }
    try {
      this.audioPlayer.init();
    } catch (err) {
      debug.log("this.audioPlayer.init() error", err);
      this.transformBtn("error", err.message);
    }
    this.setupAudioSettings();
    if (this.site.host === "twitter") {
      document
        .querySelector('button[data-testid="app-bar-back"][role="button"]')
        .addEventListener("click", this.stopTranslation);
    }
    this.transformBtn("success", localizationProvider.get("disableTranslate"));
    this.afterUpdateTranslation(audioUrl);
  }

  /**
   * Translates the video/audio.
   * @param {string} VIDEO_ID The video ID.
   * @param {boolean} isStream Whether the video is a stream.
   * @param {string} requestLang Source language.
   * @param {string} responseLang Target language.
   * @param {any} translationHelp Optional translation helper data.
   */
  async translateFunc(
    VIDEO_ID,
    isStream,
    requestLang,
    responseLang,
    translationHelp,
  ) {
    console.log("[VOT] Video Data: ", this.videoData);
    debug.log("Run videoValidator");
    this.videoValidator();
    this.setLoadingBtn(true);
    this.volumeOnStart = this.getVideoVolume();
    const cacheKey = `${VIDEO_ID}_${requestLang}_${responseLang}_${this.data.useNewModel}`;
    const cachedEntry = this.cacheManager.getTranslation(cacheKey);
    if (cachedEntry?.url) {
      await this.updateTranslation(cachedEntry.url);
      debug.log("[translateFunc] Cached translation was received");
      return;
    } else if (cachedEntry?.error) {
      debug.log("Skip translation - previous attempt failed");
      await this.updateTranslationErrorMsg(cachedEntry.error.data?.message);
      return;
    }
    if (isStream) {
      const translateRes = await this.translationHandler.translateStreamImpl(
        this.videoData,
        requestLang,
        responseLang,
      );
      if (!translateRes) {
        debug.log("Skip translation");
        return;
      }
      this.transformBtn(
        "success",
        localizationProvider.get("disableTranslate"),
      );
      try {
        this.hls = initHls();
        this.audioPlayer.init();
      } catch (err) {
        debug.log("this.audioPlayer.init() error", err);
        this.transformBtn("error", err.message);
      }
      const streamURL = this.setHLSSource(translateRes.result.url);
      if (this.site.host === "youtube") {
        YoutubeHelper.videoSeek(this.video, 10);
      }
      this.setupAudioSettings();
      if (!this.video.src && !this.video.currentSrc && !this.video.srcObject) {
        return this.stopTranslation();
      }
      return this.afterUpdateTranslation(streamURL);
    }
    const translateRes = await this.translationHandler.translateVideoImpl(
      this.videoData,
      requestLang,
      responseLang,
      translationHelp,
    );
    debug.log("[translateRes]", translateRes);
    if (!translateRes) {
      debug.log("Skip translation");
      return;
    }
    await this.updateTranslation(translateRes.url);
    // Invalidate subtitles cache if there is no matching subtitle.
    const cachedSubs = this.cacheManager.getSubtitles(cacheKey);
    if (
      !cachedSubs?.some(
        (item) =>
          item.source === "yandex" &&
          item.translatedFromLanguage === this.videoData.detectedLanguage &&
          item.language === this.videoData.responseLanguage,
      )
    ) {
      this.cacheManager.deleteSubtitles(cacheKey);
      this.subtitles = [];
    }
    this.cacheManager.setTranslation(cacheKey, {
      videoId: VIDEO_ID,
      from: requestLang,
      to: responseLang,
      url: this.downloadTranslationUrl,
      useNewModel: this.data?.useNewModel,
    });
  }

  /**
   * Sets up HLS streaming if needed.
   * @param {string} streamURL The HLS stream URL.
   */
  setupHLS(streamURL) {
    this.hls.on(Hls.Events.MEDIA_ATTACHED, function () {
      debug.log("audio and hls.js are now bound together !");
    });
    this.hls.on(Hls.Events.MANIFEST_PARSED, function (data) {
      debug.log(
        "manifest loaded, found " + data?.levels?.length + " quality level",
      );
    });
    this.hls.loadSource(streamURL);
    this.hls.attachMedia(this.audioPlayer.player.audio);
    this.hls.on(Hls.Events.ERROR, function (data) {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log("fatal media error encountered, try to recover");
            this.hls.recoverMediaError();
            break;
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.error("fatal network error encountered", data);
            break;
          default:
            this.hls.destroy();
            break;
        }
      }
    });
    debug.log(this.hls);
  }

  /**
   * Sets the HLS source URL.
   * @param {string} url The original URL.
   * @returns {string} The final stream URL.
   */
  setHLSSource(url) {
    const streamURL = `https://${this.data.m3u8ProxyHost}/?all=yes&origin=${encodeURIComponent("https://strm.yandex.ru")}&referer=${encodeURIComponent("https://strm.yandex.ru")}&url=${encodeURIComponent(url)}`;
    if (this.hls) {
      this.setupHLS(streamURL);
    } else if (
      this.audioPlayer.player.audio.canPlayType("application/vnd.apple.mpegurl")
    ) {
      this.audioPlayer.player.src = streamURL; // For Safari
    } else {
      throw new VOTLocalizedError("audioFormatNotSupported");
    }
    return streamURL;
  }

  /**
   * Configures audio settings such as volume.
   */
  setupAudioSettings() {
    if (typeof this.data.defaultVolume === "number") {
      this.audioPlayer.player.volume = this.data.defaultVolume / 100;
    }
    if (
      typeof this.data.autoSetVolumeYandexStyle === "number" &&
      this.data.autoSetVolumeYandexStyle
    ) {
      this.setVideoVolume(this.data.autoVolume);
    }
  }

  /**
   * Stops translation and synchronizes volume.
   */
  stopTranslation = () => {
    this.stopTranslate();
    this.syncVideoVolumeSlider();
  };

  /**
   * Handles video source change events.
   */
  async handleSrcChanged() {
    debug.log("[VideoHandler] src changed", this);
    this.firstPlay = true;
    this.stopTranslation();
    const hide =
      !this.video.src && !this.video.currentSrc && !this.video.srcObject;
    this.votButton.container.hidden = hide;
    if (hide) this.votMenu.container.hidden = hide;
    if (!this.site.selector) this.container = this.video.parentElement;
    if (!this.container.contains(this.votButton.container)) {
      this.container.append(this.votButton.container, this.votMenu.container);
    }
    this.videoData = await this.getVideoData();
    const cacheKey = `${this.videoData.videoId}_${this.videoData.detectedLanguage}_${this.videoData.responseLanguage}_${this.data.useNewModel}`;
    this.subtitles = this.cacheManager.getSubtitles(cacheKey);
    await this.updateSubtitlesLangSelect();
    this.translateToLang = this.data.responseLanguage ?? "ru";
    this.setSelectMenuValues(
      this.videoData.detectedLanguage,
      this.videoData.responseLanguage,
    );
  }

  /**
   * Releases resources and removes event listeners.
   */
  async release() {
    debug.log("[VideoHandler] release");
    this.initialized = false;
    this.releaseExtraEvents();
    this.subtitlesWidget.release();
    this.votButton.container.remove();
    this.votMenu.container.remove();
  }

  /**
   * Collects report information for bug reporting.
   * @returns {Object} Report info object.
   */
  collectReportInfo() {
    const os = `${browserInfo.os.name} ${browserInfo.os.version}`;
    const additionalInfo = `Autogenerated by VOT:
- OS: ${os}
- Browser: ${browserInfo.browser.name} ${browserInfo.browser.version}
- Loader: ${GM_info.scriptHandler} v${GM_info.version}
- Script version: ${GM_info.script.version}
- URL: \`${window.location.href}\``;
    return {
      assignees: "ilyhalight",
      template: "bug.yml",
      os,
      "script-version": GM_info.script.version,
      "additional-info": additionalInfo,
    };
  }

  /**
   * Releases extra event listeners.
   */
  releaseExtraEvents() {
    this.abortController.abort();
    this.resizeObserver?.disconnect();
    if (
      ["youtube", "googledrive"].includes(this.site.host) &&
      this.site.additionalData !== "mobile"
    ) {
      this.syncVolumeObserver?.disconnect();
    }
  }
}

const videoObserver = new VideoObserver();
const videosWrappers = new WeakMap();

/**
 * Recursively finds the closest parent element matching a selector.
 * @param {HTMLElement} el The starting element.
 * @param {string} selector The CSS selector.
 * @returns {HTMLElement|null} The matching parent element.
 */
function climb(el, selector) {
  if (!el || !selector) return null;
  if (el instanceof Document) return el.querySelector(selector);
  const foundEl = el.closest(selector);
  if (foundEl) return foundEl;
  const root = el.getRootNode();
  return climb(root instanceof ShadowRoot ? root.host : root, selector);
}

/**
 * Finds the container element for a given video.
 * @param {Object} site The site object.
 * @param {HTMLVideoElement} video The video element.
 * @returns {HTMLElement|null} The container element.
 */
function findContainer(site, video) {
  debug.log("findContainer", site, video);
  if (site.shadowRoot) {
    const container = climb(video, site.selector);
    debug.log("findContainer with site.shadowRoot", container);
    return container ?? video.parentElement;
  }
  debug.log("findContainer without shadowRoot");
  if (!site.selector) return video.parentElement;
  const elements = document.querySelectorAll(site.selector);
  return (
    Array.from(elements).find((e) => e.contains(video)) ?? video.parentElement
  );
}

/**
 * Initializes iframe communication for special cases.
 */
function initIframeInteractor() {
  const configs = {
    "https://9animetv.to": {
      targetOrigin: "https://rapid-cloud.co",
      dataFilter: (data) => data === "getVideoId",
      extractVideoId: (url) => url.pathname.split("/").pop(),
      iframeSelector: "#iframe-embed",
      responseFormatter: (videoId) => `getVideoId:${videoId}`,
    },
    "https://dev.epicgames.com": {
      targetOrigin: "https://dev.epicgames.com",
      dataFilter: (data) =>
        typeof data === "string" && data.startsWith("getVideoId:"),
      extractVideoId: (url) => url.pathname.split("/").slice(-2, -1)[0],
      iframeSelector: (src) => `electra-player > iframe[src="${src}"]`,
      responseFormatter: (videoId, data) => `${data}:${videoId}`,
      processRequest: (data) => {
        const reqId = data.replace("getVideoId:", "");
        return atob(reqId);
      },
    },
  };

  const currentConfig = Object.entries(configs).find(
    ([origin]) =>
      window.location.origin === origin &&
      (origin !== "https://dev.epicgames.com" ||
        window.location.pathname.includes("/community/learning/")),
  )?.[1];
  if (!currentConfig) return;
  window.addEventListener("message", (event) => {
    try {
      if (event.origin !== currentConfig.targetOrigin) return;
      if (!currentConfig.dataFilter(event.data)) return;
      const url = new URL(window.location.href);
      const videoId = currentConfig.extractVideoId(url);
      if (!videoId) return;
      const iframeSrc = currentConfig.processRequest?.(event.data) || url.href;
      const selector =
        typeof currentConfig.iframeSelector === "function"
          ? currentConfig.iframeSelector(iframeSrc)
          : currentConfig.iframeSelector;
      const iframe = document.querySelector(selector);
      if (!iframe?.contentWindow) return;
      const response = currentConfig.responseFormatter(videoId, event.data);
      iframe.contentWindow.postMessage(response, currentConfig.targetOrigin);
    } catch (error) {
      console.error("Iframe communication error:", error);
    }
  });
}

/**
 * Main function to start the extension.
 */
async function main() {
  debug.log("Loading extension...");
  await localizationProvider.update();
  debug.log(`Selected menu language: ${localizationProvider.lang}`);
  initIframeInteractor();
  videoObserver.onVideoAdded.addListener((video) => {
    for (const site of getService()) {
      if (!site) continue;
      let container = findContainer(site, video);
      if (!container) continue;
      if (site.host === "rumble" && !video.style.display) continue; // fix multiply translation buttons in rumble.com
      if (["peertube", "directlink"].includes(site.host)) {
        site.url = window.location.origin; // set the url of the current site for peertube and directlink
      }
      if (!videosWrappers.has(video)) {
        videosWrappers.set(video, new VideoHandler(video, container, site));
        break;
      }
    }
  });
  videoObserver.onVideoRemoved.addListener(async (video) => {
    if (videosWrappers.has(video)) {
      await videosWrappers.get(video).release();
      videosWrappers.delete(video);
    }
  });
  videoObserver.enable();
}

main().catch((e) => {
  console.error("[VOT]", e);
});
