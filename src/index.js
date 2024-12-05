import Bowser from "bowser";
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
import { svg, html } from "lit-html";
import { ID3Writer } from "browser-id3-writer";

import {
  defaultAutoVolume,
  defaultDetectService,
  defaultTranslationService,
  m3u8ProxyHost,
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
import { SubtitlesWidget, fetchSubtitles, getSubtitles } from "./subtitles.js";

import ui from "./ui.js";
import youtubeUtils from "./utils/youtubeUtils.js";
import debug from "./utils/debug.ts";

import { VOTLocalizedError } from "./utils/VOTLocalizedError.js";
import {
  GM_fetch,
  initHls,
  isPiPAvailable,
  lang,
  secsToStrTime,
  downloadBlob,
  clearFileName,
  getTimestamp,
} from "./utils/utils.js";
import { syncVolume } from "./utils/volume.js";
import { VideoObserver } from "./utils/VideoObserver.js";
import { votStorage, convertData } from "./utils/storage.ts";
import {
  detectServices,
  translate,
  translateServices,
} from "./utils/translateApis.ts";
import Chaimu, { initAudioContext } from "chaimu";

const browserInfo = Bowser.getParser(window.navigator.userAgent).getResult();

function genOptionsByOBJ(obj, conditionString) {
  return obj.map((code) => ({
    label: localizationProvider.get("langs")[code] ?? code.toUpperCase(),
    value: code,
    selected: conditionString === code,
  }));
}

const createHotkeyText = (hotkey) =>
  hotkey
    ? localizationProvider
        .get("VOTChangeHotkeyWithCurrent")
        .replace("{0}", hotkey.replace("Key", ""))
    : localizationProvider.get("VOTCreateTranslationHotkey");

let countryCode;

class VideoHandler {
  /**
   * default language of video
   *
   * @type {import("./index").VideoHandler['translateFromLang']}
   */
  translateFromLang = "en";

  /**
   * default language of audio response
   *
   * @type {import("./index").VideoHandler['translateToLang']}
   */
  translateToLang = lang;

  /**
   * @type {import("./index").VideoHandler['timer']}
   */
  timer;

  /**
   * @type {import("./index").VideoHandler['videoData']}
   */
  videoData = "";

  /**
   * @type {import("./index").VideoHandler['firstPlay']}
   */
  firstPlay = true;

  /**
   * @type {import("./index").VideoHandler['audioContext']}
   */
  audioContext = initAudioContext();

  hls = initHls(); // debug enabled only in dev mode
  /**
   * @type {import("@vot.js/ext").default}
   */
  votClient;

  /**
   * @type {import("chaimu").default}
   */
  audioPlayer;

  videoTranslations = []; // list of video translations
  videoTranslationTTL = 7200; // 2 hours
  translateProxyEnabled = 0; // 0 - disabled, 1 - enabled, 2 - proxy everything
  cachedTranslation; // cached video translation

  downloadTranslationUrl = null;

  autoRetry; // auto retry timeout
  streamPing; // stream ping interval
  votOpts;
  volumeOnStart;
  tempOriginalVolume; // temp video volume for syncing
  tempVolume; // temp translation volume for syncing
  firstSyncVolume = true; // used for skip 1st syncing with observer
  longWaitingResCount = 0;

  subtitlesList = [];
  subtitlesListVideoId = null;

  /**
   * button move
   *
   * @type {import("./index").VideoHandler['dragging']}
   */
  dragging;

  /**
   * Constructor function for VideoHandler class.
   *
   * @param {Object} video - The video element to handle.
   * @param {Object} container - The container element for the video.
   * @param {Object} site - The site object associated with the video.
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
    this.init();
  }

  /**
   * Translate a video based on the specified languages.
   *
   * @param {Object} videoData - The data of the video to be translated.
   * @param {string} requestLang - The language code for the requested translation.
   * @param {string} responseLang - The language code for the desired translated output.
   * @param {Object} [translationHelp=null] - Additional translation help data (optional).
   * @return {Promise} A Promise that resolves to the translated video data.
   */
  async translateVideoImpl(
    videoData,
    requestLang,
    responseLang,
    translationHelp = null,
  ) {
    clearTimeout(this.autoRetry);
    debug.log(
      videoData,
      `Translate video (requestLang: ${requestLang}, responseLang: ${responseLang})`,
    );

    if (
      (await getVideoID(this.site, this.video, { fetchFn: GM_fetch })) !==
      videoData.videoId
    ) {
      return null;
    }

    try {
      const res = await this.votClient.translateVideo({
        videoData,
        requestLang,
        responseLang,
        translationHelp,
        extraOpts: {
          useNewModel: this.data?.useNewModel,
        },
      });
      debug.log("Translate video result", res);
      if (res.translated && res.remainingTime < 1) {
        debug.log("Video translation finished with this data: ", res);
        return res;
      }

      await this.updateTranslationErrorMsg(
        res.remainingTime > 0
          ? secsToStrTime(res.remainingTime)
          : res.message ??
              localizationProvider.get("translationTakeFewMinutes"),
      );
    } catch (err) {
      console.error("[VOT] Failed to translate video", err);
      await this.updateTranslationErrorMsg(err.data?.message ?? err);
      return null;
    }

    return new Promise((resolve) => {
      const timeoutDuration = this.subtitlesList.some(
        (item) => item.source === "yandex",
      )
        ? 20_000
        : 30_000;
      this.autoRetry = setTimeout(async () => {
        const res = await this.translateVideoImpl(
          videoData,
          requestLang,
          responseLang,
          translationHelp,
        );
        if (!res || (res.translated && res.remainingTime < 1)) {
          resolve(res);
        }
      }, timeoutDuration);
    });
  }

  /**
   * Translate a video stream based on the specified languages.
   *
   * @param {Object} videoData - The data of the video stream to be translated.
   * @param {string} requestLang - The language code for the requested translation.
   * @param {string} responseLang - The language code for the desired translated output.
   * @return {Promise} A Promise that resolves to the translated video stream data.
   */
  async translateStreamImpl(videoData, requestLang, responseLang) {
    clearTimeout(this.autoRetry);
    debug.log(
      videoData,
      `Translate stream (requestLang: ${requestLang}, responseLang: ${responseLang})`,
    );

    if (
      (await getVideoID(this.site, this.video, { fetchFn: GM_fetch })) !==
      videoData.videoId
    ) {
      return null;
    }

    try {
      const res = await this.votClient.translateStream({
        videoData,
        requestLang,
        responseLang,
      });
      debug.log("Translate stream result", res);
      if (!res.translated && res.interval === 10) {
        await this.updateTranslationErrorMsg(
          localizationProvider.get("translationTakeFewMinutes"),
        );
        return new Promise((resolve) => {
          this.autoRetry = setTimeout(async () => {
            const res = await this.translateStreamImpl(
              videoData,
              requestLang,
              responseLang,
            );
            if (!res || !(!res.translated && res.interval === 10)) {
              resolve(res);
            }
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

      this.streamPing = setInterval(async () => {
        debug.log("Ping stream translation", res.pingId);
        this.votClient.pingStream({
          pingId: res.pingId,
        });
      }, res.interval * 1000);

      return res;
    } catch (err) {
      console.error("[VOT] Failed to translate stream", err);
      await this.updateTranslationErrorMsg(err.data?.message ?? err);
      return null;
    }
  }

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
      await this.translateExecutor(this.videoData.videoId);
    } catch (err) {
      console.error("[VOT]", err);
      this.transformBtn(
        "error",
        err?.name === "VOTLocalizedError" ? err.localizedMessage : err,
      );
    }
  }

  getPreferAudio() {
    if (!this.audioContext) {
      return true;
    }

    if (!this.data.newAudioPlayer) {
      return true;
    }

    if (this.videoData.isStream) {
      // streams use old player for work with hls
      return true;
    }

    if (this.data.newAudioPlayer && !this.data.onlyBypassMediaCSP) {
      return false;
    }

    return !this.site.needBypassCSP;
  }

  createPlayer() {
    const preferAudio = this.getPreferAudio();
    debug.log("preferAudio:", preferAudio);
    this.audioPlayer = new Chaimu({
      video: this.video,
      debug: DEBUG_MODE,
      fetchFn: GM_fetch,
      preferAudio,
    });
    return this;
  }

  /**
   * Initializes the VideoHandler class by setting up data promises, fetching data, initializing UI elements, and setting up event listeners.
   */
  async init() {
    if (this.initialized) return;

    const dataPromises = {
      autoTranslate: votStorage.get("autoTranslate", 0),
      dontTranslateLanguage: votStorage.get("dontTranslateLanguage", lang),
      dontTranslateYourLang: votStorage.get("dontTranslateYourLang", 1),
      autoSetVolumeYandexStyle: votStorage.get("autoSetVolumeYandexStyle", 1),
      autoVolume: votStorage.get("autoVolume", defaultAutoVolume),
      buttonPos: votStorage.get("buttonPos", "default"),
      showVideoSlider: votStorage.get("showVideoSlider", 1),
      syncVolume: votStorage.get("syncVolume", 0),
      downloadWithName: votStorage.get("downloadWithName", 1),
      subtitlesMaxLength: votStorage.get("subtitlesMaxLength", 300),
      highlightWords: votStorage.get("highlightWords", 0),
      subtitlesFontSize: votStorage.get("subtitlesFontSize", 20),
      subtitlesOpacity: votStorage.get("subtitlesOpacity", 20),
      subtitlesDownloadFormat: votStorage.get("subtitlesDownloadFormat", "srt"),
      responseLanguage: votStorage.get("responseLanguage", lang),
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

    // TODO: delete converters after several versions
    // convert old m3u8-proxy-worker to new media-proxy
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

    if (
      !this.translateProxyEnabled &&
      GM_info?.scriptHandler &&
      proxyOnlyExtensions.includes(GM_info.scriptHandler)
    ) {
      this.translateProxyEnabled = 1;
    }

    if (!countryCode) {
      try {
        const response = await GM_fetch("https://speed.cloudflare.com/meta", {
          timeout: 7000,
        });
        const { country } = await response.json();
        countryCode = country;
        this.translateProxyEnabled =
          country === "UA" ? 2 : this.translateProxyEnabled;
      } catch (err) {
        console.error("[VOT] Error getting country:", err);
      }
    } else if (countryCode === "UA") {
      this.translateProxyEnabled = 2;
    }

    debug.log("translateProxyEnabled", this.translateProxyEnabled);
    debug.log("Extension compatibility passed...");

    this.votOpts = {
      headers: this.translateProxyEnabled
        ? {}
        : {
            "sec-ch-ua": null,
            "sec-ch-ua-mobile": null,
            "sec-ch-ua-platform": null,
          },
      fetchFn: GM_fetch,
      hostVOT: votBackendUrl,
      host: this.translateProxyEnabled ? this.data.proxyWorkerHost : workerHost,
    };

    this.votClient = new (
      this.translateProxyEnabled ? VOTWorkerClient : VOTClient
    )(this.votOpts);

    this.subtitlesWidget = new SubtitlesWidget(
      this.video,
      this.container,
      this.site,
    );
    this.subtitlesWidget.setMaxLength(this.data.subtitlesMaxLength);
    this.subtitlesWidget.setHighlightWords(this.data.highlightWords);
    this.subtitlesWidget.setFontSize(this.data.subtitlesFontSize);
    this.subtitlesWidget.setOpacity(this.data.subtitlesOpacity);

    this.initUI();
    this.initUIEvents();

    this.videoData = await this.getVideoData();
    this.createPlayer();
    this.setSelectMenuValues(
      this.videoData.detectedLanguage,
      this.data.responseLanguage ?? "ru",
    );

    this.translateToLang = this.data.responseLanguage ?? "ru";
    this.initExtraEvents();

    await Promise.all([this.updateSubtitles(), this.autoTranslate()]);

    this.initialized = true;
  }

  isLoadingText(text) {
    return (
      text.includes(localizationProvider.get("translationTake")) ||
      text.includes(localizationProvider.get("TranslationDelayed"))
    );
  }

  /**
   * Set translation button status and text
   *
   * @type {import('./index').VideoHandler['transformBtn']}
   */
  transformBtn(status, text) {
    this.votButton.container.dataset.status = status;
    const isLoading = status === "error" && this.isLoadingText(text);
    this.setLoadingBtn(isLoading);
    this.votButton.label.textContent = text;
    this.votButton.container.title = status === "error" ? text : "";
    return this;
  }

  /**
   * Set loading icon to translation button
   *
   * @type {import('./index').VideoHandler['setLoadingBtn']}
   */
  setLoadingBtn(loading = false) {
    this.votButton.container.dataset.loading = loading;
    return this;
  }

  initUI() {
    // VOT Button
    {
      this.votButton = ui.createVOTButton(
        localizationProvider.get("translateVideo"),
      );
      this.votButton.container.style.opacity = 0;

      // use an additional check because sometimes this.video.clientWidth = 0
      if (
        this.data?.buttonPos &&
        this.data?.buttonPos !== "default" &&
        this.container.clientWidth > 550
      ) {
        this.votButton.container.dataset.direction = "column";
        this.votButton.container.dataset.position = this.data?.buttonPos;
      } else {
        this.votButton.container.dataset.direction = "row";
        this.votButton.container.dataset.position = "default";
      }
      this.container.appendChild(this.votButton.container);

      this.votButton.pipButton.hidden =
        !isPiPAvailable() || !this.data?.showPiPButton;
      this.votButton.separator2.hidden =
        !isPiPAvailable() || !this.data?.showPiPButton;

      this.votButton.container.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      });
    }

    // VOT Menu
    {
      this.votMenu = ui.createVOTMenu(localizationProvider.get("VOTSettings"));
      this.votMenu.container.dataset.position =
        this.container.clientWidth && this.container.clientWidth > 550
          ? this.data?.buttonPos
          : "default";
      this.container.appendChild(this.votMenu.container);

      this.votDownloadButton = ui.createIconButton(
        svg`<svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="100%"
          viewBox="0 0 24 24"
          class="vot-loader"
          id="vot-loader-download"
        >
          <path
            class="vot-loader-main"
            d="M12 15.575C11.8667 15.575 11.7417 15.5542 11.625 15.5125C11.5083 15.4708 11.4 15.4 11.3 15.3L7.7 11.7C7.5 11.5 7.40417 11.2667 7.4125 11C7.42083 10.7333 7.51667 10.5 7.7 10.3C7.9 10.1 8.1375 9.99583 8.4125 9.9875C8.6875 9.97917 8.925 10.075 9.125 10.275L11 12.15V5C11 4.71667 11.0958 4.47917 11.2875 4.2875C11.4792 4.09583 11.7167 4 12 4C12.2833 4 12.5208 4.09583 12.7125 4.2875C12.9042 4.47917 13 4.71667 13 5V12.15L14.875 10.275C15.075 10.075 15.3125 9.97917 15.5875 9.9875C15.8625 9.99583 16.1 10.1 16.3 10.3C16.4833 10.5 16.5792 10.7333 16.5875 11C16.5958 11.2667 16.5 11.5 16.3 11.7L12.7 15.3C12.6 15.4 12.4917 15.4708 12.375 15.5125C12.2583 15.5542 12.1333 15.575 12 15.575ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V16C4 15.7167 4.09583 15.4792 4.2875 15.2875C4.47917 15.0958 4.71667 15 5 15C5.28333 15 5.52083 15.0958 5.7125 15.2875C5.90417 15.4792 6 15.7167 6 16V18H18V16C18 15.7167 18.0958 15.4792 18.2875 15.2875C18.4792 15.0958 18.7167 15 19 15C19.2833 15 19.5208 15.0958 19.7125 15.2875C19.9042 15.4792 20 15.7167 20 16V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z"
          />
          <path class="vot-loader-helper" d="" />
        </svg>`,
      );
      this.votDownloadButton.hidden = true;
      this.votMenu.headerContainer.appendChild(this.votDownloadButton);

      this.votDownloadSubtitlesButton = ui.createIconButton(
        svg`<svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="100%"
          viewBox="0 0 24 24"
        >
          <path
            d="M4 20q-.825 0-1.413-.588T2 18V6q0-.825.588-1.413T4 4h16q.825 0 1.413.588T22 6v12q0 .825-.588 1.413T20 20H4Zm2-4h8v-2H6v2Zm10 0h2v-2h-2v2ZM6 12h2v-2H6v2Zm4 0h8v-2h-8v2Z"
          />
        </svg>`,
      );
      this.votDownloadSubtitlesButton.hidden = true;
      this.votMenu.headerContainer.appendChild(this.votDownloadSubtitlesButton);

      this.votSettingsButton = ui.createIconButton(
        svg`<svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="100%"
          viewBox="0 -960 960 960"
        >
          <path
            d="M555-80H405q-15 0-26-10t-13-25l-12-93q-13-5-24.5-12T307-235l-87 36q-14 5-28 1t-22-17L96-344q-8-13-5-28t15-24l75-57q-1-7-1-13.5v-27q0-6.5 1-13.5l-75-57q-12-9-15-24t5-28l74-129q7-14 21.5-17.5T220-761l87 36q11-8 23-15t24-12l12-93q2-15 13-25t26-10h150q15 0 26 10t13 25l12 93q13 5 24.5 12t22.5 15l87-36q14-5 28-1t22 17l74 129q8 13 5 28t-15 24l-75 57q1 7 1 13.5v27q0 6.5-2 13.5l75 57q12 9 15 24t-5 28l-74 128q-8 13-22.5 17.5T738-199l-85-36q-11 8-23 15t-24 12l-12 93q-2 15-13 25t-26 10Zm-73-260q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm0-80q-25 0-42.5-17.5T422-480q0-25 17.5-42.5T482-540q25 0 42.5 17.5T542-480q0 25-17.5 42.5T482-420Zm-2-60Zm-40 320h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Z"
          />
        </svg>`,
      );
      this.votMenu.headerContainer.appendChild(this.votSettingsButton);

      this.votTranslationLanguageSelect = ui.createVOTLanguageSelect({
        fromTitle:
          localizationProvider.get("langs")[this.video.detectedLanguage],
        fromDialogTitle: localizationProvider.get("videoLanguage"),
        fromItems: genOptionsByOBJ(
          availableLangs,
          this.videoData.detectedLanguage,
        ),
        fromOnSelectCB: async (e) => {
          debug.log(
            "[fromOnSelectCB] select from language",
            e.target.dataset.votValue,
          );
          this.videoData = await this.getVideoData();
          this.setSelectMenuValues(
            e.target.dataset.votValue,
            this.videoData.responseLanguage,
          );
        },
        toTitle: localizationProvider.get("langs")[this.video.responseLanguage],
        toDialogTitle: localizationProvider.get("translationLanguage"),
        toItems: genOptionsByOBJ(availableTTS, this.videoData.responseLanguage),
        toOnSelectCB: async (e) => {
          const newLang = e.target.dataset.votValue;
          debug.log("[toOnSelectCB] select to language", newLang);
          this.data.responseLanguage = this.translateToLang = newLang;
          await votStorage.set("responseLanguage", this.data.responseLanguage);
          debug.log(
            "Response Language value changed. New value: ",
            this.data.responseLanguage,
          );
          this.videoData = await this.getVideoData();
          this.setSelectMenuValues(
            this.videoData.detectedLanguage,
            this.data.responseLanguage,
          );
        },
      });

      this.votMenu.bodyContainer.appendChild(
        this.votTranslationLanguageSelect.container,
      );

      this.votSubtitlesSelect = ui.createVOTSelect(
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
            await this.changeSubtitlesLang(e.target.dataset.votValue);
          },
          labelElement: ui.createVOTSelectLabel(
            localizationProvider.get("VOTSubtitles"),
          ),
        },
      );

      this.votMenu.bodyContainer.appendChild(this.votSubtitlesSelect.container);

      this.votVideoVolumeSlider = ui.createSlider(
        html`${localizationProvider.get("VOTVolume")}:
          <strong>${this.getVideoVolume() * 100}%</strong>`,
        this.getVideoVolume() * 100,
      );
      this.votVideoVolumeSlider.container.hidden =
        this.data.showVideoSlider !== 1 ||
        this.votButton.container.dataset.status !== "success";
      this.votMenu.bodyContainer.appendChild(
        this.votVideoVolumeSlider.container,
      );

      this.votVideoTranslationVolumeSlider = ui.createSlider(
        html`${localizationProvider.get("VOTVolumeTranslation")}:
          <strong>${this.data?.defaultVolume ?? 100}%</strong>`,
        this.data?.defaultVolume ?? 100,
        0,
        this.data.audioBooster ? maxAudioVolume : 100,
      );
      this.votVideoTranslationVolumeSlider.container.hidden =
        this.votButton.container.dataset.status !== "success";
      this.votMenu.bodyContainer.appendChild(
        this.votVideoTranslationVolumeSlider.container,
      );

      this.votMenu.container.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      });
    }

    // VOT Settings
    {
      this.votSettingsDialog = ui.createDialog(
        localizationProvider.get("VOTSettings"),
      );
      document.documentElement.appendChild(this.votSettingsDialog.container);

      this.votTranslationHeader = ui.createHeader(
        localizationProvider.get("translationSettings"),
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votTranslationHeader,
      );

      this.votAutoTranslateCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTAutoTranslate"),
        this.data?.autoTranslate ?? false,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votAutoTranslateCheckbox.container,
      );

      this.votDontTranslateYourLangSelect = ui.createVOTSelect(
        localizationProvider.get("langs")[this.data.dontTranslateLanguage],
        localizationProvider.get("VOTDontTranslateYourLang"),
        genOptionsByOBJ(availableLangs, this.data.dontTranslateLanguage),
        {
          onSelectCb: async (e) => {
            this.data.dontTranslateLanguage = e.target.dataset.votValue;
            await votStorage.set(
              "dontTranslateLanguage",
              this.data.dontTranslateLanguage,
            );
          },
          labelElement: ui.createCheckbox(
            localizationProvider.get("VOTDontTranslateYourLang"),
            this.data?.dontTranslateYourLang ?? true,
          ).container,
        },
      );

      this.votSettingsDialog.bodyContainer.appendChild(
        this.votDontTranslateYourLangSelect.container,
      );

      this.changehotkeyButton = ui.createOutlinedButton(
        createHotkeyText(this.data.hotkeyButton),
      );
      this.votSettingsDialog.bodyContainer.appendChild(this.changehotkeyButton);

      this.votAutoSetVolumeCheckbox = ui.createCheckbox(
        `${localizationProvider.get("VOTAutoSetVolume")}`,
        this.data?.autoSetVolumeYandexStyle ?? true,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votAutoSetVolumeCheckbox.container,
      );
      this.votAutoSetVolumeSlider = ui.createSlider(
        html`<strong
          >${Math.round(
            (this.data?.autoVolume ?? defaultAutoVolume) * 100,
          )}%</strong
        >`,
        Math.round((this.data?.autoVolume ?? defaultAutoVolume) * 100),
        0,
        100,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votAutoSetVolumeSlider.container,
      );

      this.votShowVideoSliderCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTShowVideoSlider"),
        this.data?.showVideoSlider ?? false,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votShowVideoSliderCheckbox.container,
      );

      this.votAudioBoosterCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTAudioBooster"),
        this.data?.audioBooster ?? false,
      );
      if (!this.audioContext) {
        this.votAudioBoosterCheckbox.input.disabled = true;
        this.votAudioBoosterCheckbox.container.title =
          localizationProvider.get("VOTNeedWebAudioAPI");
      }
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votAudioBoosterCheckbox.container,
      );

      this.votSyncVolumeCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTSyncVolume"),
        this.data?.syncVolume ?? false,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votSyncVolumeCheckbox.container,
      );

      this.votDownloadWithNameCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTDownloadWithName"),
        this.data?.downloadWithName ?? false,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votDownloadWithNameCheckbox.container,
      );

      this.votUseNewModelCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTUseNewModel"),
        this.data?.useNewModel ?? false,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votUseNewModelCheckbox.container,
      );

      this.votTranslationErrorsServiceSelect = ui.createVOTSelect(
        this.data.translationService.toUpperCase(),
        localizationProvider.get("VOTTranslationErrorsService"),
        genOptionsByOBJ(translateServices, this.data.translationService),
        {
          onSelectCb: async (e) => {
            this.data.translationService = e.target.dataset.votValue;
            await votStorage.set(
              "translationService",
              this.data.translationService,
            );
          },
          labelElement: ui.createCheckbox(
            localizationProvider.get("VOTTranslateAPIErrors"),
            this.data.translateAPIErrors ?? true,
          ).container,
        },
      );
      this.votTranslationErrorsServiceSelect.container.hidden =
        localizationProvider.lang === "ru";
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votTranslationErrorsServiceSelect.container,
      );

      this.votDetectServiceSelect = ui.createVOTSelect(
        this.data.detectService.toUpperCase(),
        localizationProvider.get("VOTDetectService"),
        genOptionsByOBJ(detectServices, this.data.detectService),
        {
          onSelectCb: async (e) => {
            this.data.detectService = e.target.dataset.votValue;
            await votStorage.set("detectService", this.data.detectService);
          },
          labelElement: ui.createVOTSelectLabel(
            localizationProvider.get("VOTDetectService"),
          ),
        },
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votDetectServiceSelect.container,
      );

      // SUBTITLES

      this.votSubtitlesHeader = ui.createHeader(
        localizationProvider.get("subtitlesSettings"),
      );
      this.votSettingsDialog.bodyContainer.appendChild(this.votSubtitlesHeader);

      this.votSubtitlesDetails = ui.createDetails(
        localizationProvider.get("VOTSubtitlesDesign"),
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votSubtitlesDetails.container,
      );

      // PROXY

      this.votProxyHeader = ui.createHeader(
        localizationProvider.get("proxySettings"),
      );
      this.votSettingsDialog.bodyContainer.appendChild(this.votProxyHeader);

      this.votM3u8ProxyHostTextfield = ui.createTextfield(
        localizationProvider.get("VOTM3u8ProxyHost"),
        this.data?.m3u8ProxyHost,
        m3u8ProxyHost,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votM3u8ProxyHostTextfield.container,
      );

      this.votProxyWorkerHostTextfield = ui.createTextfield(
        localizationProvider.get("VOTProxyWorkerHost"),
        this.data?.proxyWorkerHost,
        proxyWorkerHost,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votProxyWorkerHostTextfield.container,
      );

      this.votNewAudioPlayerCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTNewAudioPlayer"),
        this.data?.newAudioPlayer ?? false,
      );
      if (!this.audioContext) {
        this.votNewAudioPlayerCheckbox.input.disabled = true;
        this.votNewAudioPlayerCheckbox.container.title =
          localizationProvider.get("VOTNeedWebAudioAPI");
      }
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votNewAudioPlayerCheckbox.container,
      );

      this.votOnlyBypassMediaCSPCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTOnlyBypassMediaCSP") +
          (this.site.needBypassCSP
            ? ` (${localizationProvider.get("VOTMediaCSPEnabledOnSite")})`
            : ""),
        this.data?.onlyBypassMediaCSP ?? false,
      );
      this.votOnlyBypassMediaCSPCheckbox.container.classList.add(
        "vot-checkbox-sub",
      );
      if (!this.audioContext) {
        this.votOnlyBypassMediaCSPCheckbox.container.title =
          localizationProvider.get("VOTNeedWebAudioAPI");
      }
      this.votOnlyBypassMediaCSPCheckbox.input.disabled =
        !this.data.newAudioPlayer && this.audioContext;
      if (!this.data.newAudioPlayer) {
        this.votOnlyBypassMediaCSPCheckbox.container.hidden = true;
      }
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votOnlyBypassMediaCSPCheckbox.container,
      );

      // ABOUT

      this.votAboutHeader = ui.createHeader(localizationProvider.get("about"));
      this.votSettingsDialog.bodyContainer.appendChild(this.votAboutHeader);

      this.votLanguageSelect = ui.createVOTSelect(
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

      this.votSettingsDialog.bodyContainer.appendChild(
        this.votLanguageSelect.container,
      );

      this.votShowPiPButtonCheckbox = ui.createCheckbox(
        localizationProvider.get("VOTShowPiPButton"),
        this.data?.showPiPButton ?? false,
      );
      this.votShowPiPButtonCheckbox.container.hidden = !isPiPAvailable();
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votShowPiPButtonCheckbox.container,
      );

      this.votVersionInfo = ui.createInformation(
        `${localizationProvider.get("VOTVersion")}:`,
        GM_info.script.version,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votVersionInfo.container,
      );

      this.votAuthorsInfo = ui.createInformation(
        `${localizationProvider.get("VOTAuthors")}:`,
        GM_info.script.author,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votAuthorsInfo.container,
      );

      this.votLoaderInfo = ui.createInformation(
        `${localizationProvider.get("VOTLoader")}:`,
        `${GM_info.scriptHandler} v${GM_info.version}`,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votLoaderInfo.container,
      );

      this.votBrowserInfo = ui.createInformation(
        `${localizationProvider.get("VOTBrowser")}:`,
        `${browserInfo.browser.name} ${browserInfo.browser.version} (${browserInfo.os.name} ${browserInfo.os.version})`,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votBrowserInfo.container,
      );

      this.votLocaleInfo = ui.createInformation(
        `${localizationProvider.get("VOTLocaleHash")}:`,
        html`${this.data.localeHash}<br />(${localizationProvider.get(
            "VOTUpdatedAt",
          )}
          ${new Date(this.data.localeUpdatedAt * 1000).toLocaleString()})`,
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votLocaleInfo.container,
      );

      this.votUpdateLocaleFilesButton = ui.createOutlinedButton(
        localizationProvider.get("VOTUpdateLocaleFiles"),
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votUpdateLocaleFilesButton,
      );

      this.votResetSettingsButton = ui.createButton(
        localizationProvider.get("resetSettings"),
      );
      this.votSettingsDialog.bodyContainer.appendChild(
        this.votResetSettingsButton,
      );
    }
  }

  async handleTranslationBtnClick() {
    debug.log(
      "[click translationBtn]",
      this.audioPlayer,
      this.audioPlayer.player,
    );
    if (this.audioPlayer.player.src) {
      debug.log(
        "[click translationBtn] audio.src is not empty",
        this.audioPlayer.player.src,
      );
      this.stopTranslate();
      return;
    }

    if (this.hls.url) {
      debug.log("[click translationBtn] hls is not empty", this.hls.url);
      this.stopTranslate();
      return;
    }

    try {
      debug.log("[click translationBtn] trying execute translation");

      if (!this.videoData.videoId) {
        throw new VOTLocalizedError("VOTNoVideoIDFound");
      }

      // при скролле ленты клипов в вк сохраняется старый айди видео для перевода,
      // но для субтитров используется новый, поэтому перед запуском перевода необходимо получить актуальный айди
      if (this.site.host === "vk" && this.site.additionalData === "clips") {
        this.videoData = await this.getVideoData();
      }
      await this.translateExecutor(this.videoData.videoId);
    } catch (err) {
      console.error("[VOT]", err);
      if (err?.name === "VOTLocalizedError") {
        this.transformBtn("error", err.localizedMessage);
      } else {
        this.transformBtn("error", err?.message);
      }
    }
  }

  initUIEvents() {
    // VOT Button
    {
      this.votButton.translateButton.addEventListener("click", async () => {
        await this.handleTranslationBtnClick();
      });

      this.votButton.pipButton.addEventListener("click", () => {
        (async () => {
          if (this.video !== document.pictureInPictureElement) {
            await this.video.requestPictureInPicture();
          } else {
            await document.exitPictureInPicture();
          }
        })();
      });

      this.votButton.menuButton.addEventListener("click", () => {
        this.votMenu.container.hidden = !this.votMenu.container.hidden;
      });

      this.votButton.container.addEventListener("mousedown", () => {
        this.dragging = true;
      });

      this.container.addEventListener("mouseup", () => {
        this.dragging = false;
      });

      this.container.addEventListener("mousemove", async (e) => {
        if (this.dragging) {
          e.preventDefault();

          const percentX = (e.clientX / this.container.clientWidth) * 100;
          // const percentY = (e.clientY / this.video.clientHeight) * 100;
          const isBigContainer = this.container.clientWidth > 550;
          const isLeft = percentX <= 44;
          const isRightSide = percentX >= 66 ? "right" : "default";
          const side = isLeft ? "left" : isRightSide;

          this.data.buttonPos = isBigContainer ? side : "default";
          this.votButton.container.dataset.direction =
            this.data.buttonPos === "default" ? "row" : "column";
          this.votButton.container.dataset.position = this.data.buttonPos;
          this.votMenu.container.dataset.position = this.data.buttonPos;
          if (isBigContainer) {
            await votStorage.set("buttonPos", this.data.buttonPos);
          }
        }
      });
    }

    // VOT Menu
    {
      this.votDownloadButton.addEventListener("click", async () => {
        if (!this.downloadTranslationUrl) {
          return;
        }

        if (!this.data.downloadWithName) {
          return window.open(this.downloadTranslationUrl, "_blank").focus();
        }

        const votLoader = document.querySelector("#vot-loader-download");
        const primaryColor = getComputedStyle(
          this.votMenu.container,
        ).getPropertyValue("--vot-primary-rgb");
        const updateAnimation = ui.animateLoader(votLoader, primaryColor);

        const res = await GM_fetch(this.downloadTranslationUrl);
        const reader = res.body.getReader();
        const contentLength = +res.headers.get("Content-Length");

        let receivedLength = 0;
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          chunks.push(value);
          receivedLength += value.length;
          updateAnimation(Math.round((receivedLength / contentLength) * 100));
        }

        ui.afterAnimateLoader(votLoader, primaryColor);
        const blob = new Blob(chunks);
        const filename = clearFileName(
          this.videoData.title ?? this.videoData.videoId,
        );
        const arrayBuffer = await blob.arrayBuffer();
        const writer = new ID3Writer(arrayBuffer);
        writer.setFrame("TIT2", filename);
        writer.addTag();
        downloadBlob(writer.getBlob(), `${filename}.mp3`);
      });

      this.votDownloadSubtitlesButton.addEventListener("click", async () => {
        const format = this.data.subtitlesDownloadFormat;
        const subsContent = convertSubs(this.yandexSubtitles, format);
        const blob = new Blob(
          [format === "json" ? JSON.stringify(subsContent) : subsContent],
          {
            type: "text/plain",
          },
        );

        const filename = this.data.downloadWithName
          ? clearFileName(this.videoData.title ?? this.videoData.videoId)
          : `subtitles_${this.videoData.videoId}`;
        downloadBlob(blob, `${filename}.${format}`);
      });

      this.votSettingsButton.addEventListener("click", () => {
        this.votSettingsDialog.container.hidden =
          !this.votSettingsDialog.container.hidden;
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          document.webkitExitFullscreen && document.webkitExitFullscreen();
          document.exitFullscreen && document.exitFullscreen();
        }
      });

      this.votVideoVolumeSlider.input.addEventListener("input", (e) => {
        const value = Number(e.target.value);
        this.votVideoVolumeSlider.label.querySelector("strong").textContent =
          `${value}%`;
        this.setVideoVolume(value / 100);
        if (this.data.syncVolume) {
          this.syncVolumeWrapper("video", value);
        }
      });

      this.votVideoTranslationVolumeSlider.input.addEventListener(
        "input",
        (e) => {
          (async () => {
            this.data.defaultVolume = Number(e.target.value);
            await votStorage.set("defaultVolume", this.data.defaultVolume);
            this.votVideoTranslationVolumeSlider.label.querySelector(
              "strong",
            ).textContent = `${this.data.defaultVolume}%`;
            this.audioPlayer.player.volume = this.data.defaultVolume / 100;
            if (!this.data.syncVolume) {
              return;
            }

            this.syncVolumeWrapper("translation", this.data.defaultVolume);
            if (
              ["youtube", "googledrive"].includes(this.site.host) &&
              this.site.additionalData !== "mobile"
            ) {
              // fix update youtube volume slider
              this.setVideoVolume(this.tempOriginalVolume / 100);
            }
          })();
        },
      );
    }

    // VOT Settings
    {
      this.votAutoTranslateCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          this.data.autoTranslate = Number(e.target.checked);
          await Promise.all([
            votStorage.set("autoTranslate", this.data.autoTranslate),
            this.autoTranslate(),
          ]);
          debug.log(
            "autoTranslate value changed. New value: ",
            this.data.autoTranslate,
          );
        })();
      });

      this.votDontTranslateYourLangSelect.labelElement.addEventListener(
        "change",
        (e) => {
          (async () => {
            this.data.dontTranslateYourLang = Number(e.target.checked);
            await votStorage.set(
              "dontTranslateYourLang",
              this.data.dontTranslateYourLang,
            );
            debug.log(
              "dontTranslateYourLang value changed. New value: ",
              this.data.dontTranslateYourLang,
            );
          })();
        },
      );

      const updateHotkey = async (newKey) => {
        await votStorage.set("hotkeyButton", newKey);
        this.data.hotkeyButton = newKey;
        this.changehotkeyButton.textContent = createHotkeyText(newKey);
      };

      const keydownHandler = (e) => {
        const newKey = e.code === "Escape" ? null : e.code;
        updateHotkey(newKey);
        document.removeEventListener("keydown", keydownHandler);
      };

      this.changehotkeyButton.addEventListener("click", () => {
        this.changehotkeyButton.textContent =
          localizationProvider.get("VOTPressNewHotkey");
        document.addEventListener("keydown", keydownHandler);
      });

      this.votAutoSetVolumeCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          this.data.autoSetVolumeYandexStyle = Number(e.target.checked);
          await votStorage.set(
            "autoSetVolumeYandexStyle",
            this.data.autoSetVolumeYandexStyle,
          );
          debug.log(
            "autoSetVolumeYandexStyle value changed. New value: ",
            this.data.autoSetVolumeYandexStyle,
          );
        })();
      });

      this.votAutoSetVolumeSlider.input.addEventListener("input", (e) => {
        (async () => {
          const presetAutoVolume = Number(e.target.value);
          this.data.autoVolume = (presetAutoVolume / 100).toFixed(2);
          await votStorage.set("autoVolume", this.data.autoVolume);
          this.votAutoSetVolumeSlider.label.querySelector(
            "strong",
          ).textContent = `${presetAutoVolume}%`;
        })();
      });

      this.votShowVideoSliderCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          this.data.showVideoSlider = Number(e.target.checked);
          await votStorage.set("showVideoSlider", this.data.showVideoSlider);
          debug.log(
            "showVideoSlider value changed. New value: ",
            this.data.showVideoSlider,
          );
          this.votVideoVolumeSlider.container.hidden =
            this.data.showVideoSlider !== 1 ||
            this.votButton.container.dataset.status !== "success";
        })();
      });

      this.votAudioBoosterCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          this.data.audioBooster = Number(e.target.checked);
          await votStorage.set("audioBooster", this.data.audioBooster);
          debug.log(
            "audioBooster value changed. New value: ",
            this.data.audioBooster,
          );

          const currentAudioVolume =
            this.votVideoTranslationVolumeSlider.input.value;
          this.votVideoTranslationVolumeSlider.input.max = this.data
            .audioBooster
            ? maxAudioVolume
            : 100;
          if (!this.data.audioBooster) {
            this.votVideoTranslationVolumeSlider.input.value =
              currentAudioVolume > 100 ? 100 : currentAudioVolume;
            this.votVideoTranslationVolumeSlider.input.dispatchEvent(
              new Event("input"),
            );
          }
        })();
      });

      this.votSyncVolumeCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          this.data.syncVolume = Number(e.target.checked);
          await votStorage.set("syncVolume", this.data.syncVolume);
          debug.log(
            "syncVolume value changed. New value: ",
            this.data.syncVolume,
          );
        })();
      });

      this.votDownloadWithNameCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          this.data.downloadWithName = Number(e.target.checked);
          await votStorage.set("downloadWithName", this.data.downloadWithName);
          debug.log(
            "downloadWithName value changed. New value: ",
            this.data.downloadWithName,
          );
        })();
      });

      this.votUseNewModelCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          this.data.useNewModel = Number(e.target.checked);
          await votStorage.set("useNewModel", this.data.useNewModel);
          debug.log(
            "useNewModel value changed. New value: ",
            this.data.useNewModel,
          );
          this.stopTranslate();
        })();
      });

      this.votTranslationErrorsServiceSelect.labelElement.addEventListener(
        "change",
        (e) => {
          (async () => {
            this.data.translateAPIErrors = Number(e.target.checked);
            await votStorage.set(
              "translateAPIErrors",
              this.data.translateAPIErrors,
            );
            debug.log(
              "translateAPIErrors value changed. New value: ",
              this.data.translateAPIErrors,
            );
          })();
        },
      );

      // SUBTITLES

      this.votSubtitlesDetails.container.addEventListener("click", () => {
        this.votSubtitlesDialog = ui.createDialog(
          localizationProvider.get("VOTSubtitlesDesign"),
        );
        this.votSubtitlesDialog.container.classList.add("vot-dialog-temp");
        this.votSubtitlesDialog.container.hidden = false;
        // remove the modal so that they do not accumulate
        this.votSubtitlesDialog.backdrop.onclick =
          this.votSubtitlesDialog.closeButton.onclick = () => {
            this.votSubtitlesDialog.container.remove();
          };

        // subtitles elements
        this.votSubtitlesHighlightWordsCheckbox = ui.createCheckbox(
          localizationProvider.get("VOTHighlightWords"),
          this.data?.highlightWords ?? false,
        );
        this.votSubtitlesDialog.bodyContainer.appendChild(
          this.votSubtitlesHighlightWordsCheckbox.container,
        );

        this.votSubtitlesDownloadFormatSelect = ui.createVOTSelect(
          this.data.subtitlesDownloadFormat.toUpperCase(),
          localizationProvider.get("VOTSubtitlesDownloadFormat"),
          genOptionsByOBJ(subtitlesFormats, this.data.subtitlesDownloadFormat),
          {
            onSelectCb: async (e) => {
              this.data.subtitlesDownloadFormat = e.target.dataset.votValue;
              await votStorage.set(
                "subtitlesDownloadFormat",
                this.data.subtitlesDownloadFormat,
              );
            },
            labelElement: ui.createVOTSelectLabel(
              localizationProvider.get("VOTSubtitlesDownloadFormat"),
            ),
          },
        );
        this.votSubtitlesDialog.bodyContainer.appendChild(
          this.votSubtitlesDownloadFormatSelect.container,
        );

        this.votSubtitlesMaxLengthSlider = ui.createSlider(
          html`${localizationProvider.get("VOTSubtitlesMaxLength")}:
            <strong>${this.data?.subtitlesMaxLength ?? 300}</strong>`,
          this.data?.subtitlesMaxLength ?? 300,
          50,
          300,
        );
        this.votSubtitlesDialog.bodyContainer.appendChild(
          this.votSubtitlesMaxLengthSlider.container,
        );

        this.votSubtitlesFontSizeSlider = ui.createSlider(
          html`${localizationProvider.get("VOTSubtitlesFontSize")}:
            <strong>${this.data?.subtitlesFontSize ?? 20}</strong>`,
          this.data?.subtitlesFontSize ?? 20,
          8,
          50,
        );
        this.votSubtitlesDialog.bodyContainer.appendChild(
          this.votSubtitlesFontSizeSlider.container,
        );

        this.votSubtitlesOpacitySlider = ui.createSlider(
          html`${localizationProvider.get("VOTSubtitlesOpacity")}:
            <strong>${this.data?.subtitlesOpacity ?? 20}</strong>`,
          this.data?.subtitlesOpacity ?? 20,
          0,
          100,
        );
        this.votSubtitlesDialog.bodyContainer.appendChild(
          this.votSubtitlesOpacitySlider.container,
        );

        // subtitles events
        this.votSubtitlesHighlightWordsCheckbox.input.addEventListener(
          "change",
          (e) => {
            (async () => {
              this.data.highlightWords = Number(e.target.checked);
              await votStorage.set("highlightWords", this.data.highlightWords);
              debug.log(
                "highlightWords value changed. New value: ",
                this.data.highlightWords,
              );
              this.subtitlesWidget.setHighlightWords(this.data.highlightWords);
            })();
          },
        );

        this.votSubtitlesMaxLengthSlider.input.addEventListener(
          "input",
          (e) => {
            (async () => {
              this.data.subtitlesMaxLength = Number(e.target.value);
              await votStorage.set(
                "subtitlesMaxLength",
                this.data.subtitlesMaxLength,
              );
              this.votSubtitlesMaxLengthSlider.label.querySelector(
                "strong",
              ).textContent = `${this.data.subtitlesMaxLength}`;
              this.subtitlesWidget.setMaxLength(this.data.subtitlesMaxLength);
            })();
          },
        );

        this.votSubtitlesFontSizeSlider.input.addEventListener("input", (e) => {
          (async () => {
            this.data.subtitlesFontSize = Number(e.target.value);
            await votStorage.set(
              "subtitlesFontSize",
              this.data.subtitlesFontSize,
            );
            this.votSubtitlesFontSizeSlider.label.querySelector(
              "strong",
            ).textContent = `${this.data.subtitlesFontSize}`;
            this.subtitlesWidget.setFontSize(this.data.subtitlesFontSize);
          })();
        });

        this.votSubtitlesOpacitySlider.input.addEventListener("input", (e) => {
          (async () => {
            this.data.subtitlesOpacity = Number(e.target.value);
            await votStorage.set(
              "subtitlesOpacity",
              this.data.subtitlesOpacity,
            );
            this.votSubtitlesOpacitySlider.label.querySelector(
              "strong",
            ).textContent = `${this.data.subtitlesOpacity}`;
            this.subtitlesWidget.setOpacity(this.data.subtitlesOpacity);
          })();
        });

        document.documentElement.appendChild(this.votSubtitlesDialog.container);
      });

      // OTHER

      this.votShowPiPButtonCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          this.data.showPiPButton = Number(e.target.checked);
          await votStorage.set("showPiPButton", this.data.showPiPButton);
          debug.log(
            "showPiPButton value changed. New value: ",
            this.data.showPiPButton,
          );
          this.votButton.pipButton.hidden =
            !isPiPAvailable() || !this.data.showPiPButton;
          this.votButton.separator2.hidden =
            !isPiPAvailable() || !this.data.showPiPButton;
        })();
      });

      // PROXY

      this.votM3u8ProxyHostTextfield.input.addEventListener("change", (e) => {
        (async () => {
          this.data.m3u8ProxyHost = e.target.value || m3u8ProxyHost;
          await votStorage.set("m3u8ProxyHost", this.data.m3u8ProxyHost);
          debug.log(
            "m3u8ProxyHost value changed. New value: ",
            this.data.m3u8ProxyHost,
          );
        })();
      });

      this.votProxyWorkerHostTextfield.input.addEventListener("change", (e) => {
        (async () => {
          this.data.proxyWorkerHost = e.target.value || proxyWorkerHost;
          await votStorage.set("proxyWorkerHost", this.data.proxyWorkerHost);
          debug.log(
            "proxyWorkerHost value changed. New value: ",
            this.data.proxyWorkerHost,
          );
          if (this.translateProxyEnabled) {
            this.votClient.host = this.data.proxyWorkerHost;
          }
        })();
      });

      this.votOnlyBypassMediaCSPCheckbox.input.addEventListener(
        "change",
        (e) => {
          (async () => {
            this.data.onlyBypassMediaCSP = Number(e.target.checked);
            await votStorage.set(
              "onlyBypassMediaCSP",
              this.data.onlyBypassMediaCSP,
            );
            debug.log(
              "onlyBypassMediaCSP value changed. New value: ",
              this.data.onlyBypassMediaCSP,
            );
            this.stopTranslate();
            this.createPlayer();
          })();
        },
      );

      this.votNewAudioPlayerCheckbox.input.addEventListener("change", (e) => {
        (async () => {
          const checked = e.target.checked;
          this.data.newAudioPlayer = Number(checked);
          await votStorage.set("newAudioPlayer", this.data.newAudioPlayer);
          debug.log(
            "newAudioPlayer value changed. New value: ",
            this.data.newAudioPlayer,
          );
          this.stopTranslate();
          this.createPlayer();

          this.votOnlyBypassMediaCSPCheckbox.input.disabled =
            this.votOnlyBypassMediaCSPCheckbox.container.hidden = !checked;
        })();
      });

      this.votUpdateLocaleFilesButton.addEventListener("click", () => {
        (async () => {
          await votStorage.set("locale-hash", "");
          await localizationProvider.update(true);
          window.location.reload();
        })();
      });

      this.votResetSettingsButton.addEventListener("click", () => {
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

  initExtraEvents() {
    const { signal } = this.abortController;

    const addExtraEventListener = (element, event, handler) => {
      this.extraEvents.push({
        element,
        event,
        handler,
      });
      element.addEventListener(event, handler, { signal });
    };

    const addExtraEventListeners = (element, events, handler) => {
      for (const event of events) {
        addExtraEventListener(element, event, handler);
      }
    };

    this.resizeObserver = new ResizeObserver((entries) => {
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        this.votMenu.container.setAttribute(
          "style",
          `--vot-container-height: ${e.contentRect.height}px`,
        );
      }

      const isBigWidth = this.container.clientWidth > 550;
      this.votButton.container.dataset.position =
        this.votMenu.container.dataset.position = isBigWidth
          ? this.data?.buttonPos
          : "default";
      this.votButton.container.dataset.direction =
        this.data?.buttonPos && this.data?.buttonPos !== "default" && isBigWidth
          ? "column"
          : "row";
    });

    this.resizeObserver.observe(this.video);
    this.votMenu.container.setAttribute(
      "style",
      `--vot-container-height: ${this.video.getBoundingClientRect().height}px`,
    );
    // Sync menu volume slider with youtube original video (youtube only)
    if (
      ["youtube", "googledrive"].includes(this.site.host) &&
      this.site.additionalData !== "mobile"
    ) {
      this.syncVolumeObserver = new MutationObserver((mutations) => {
        if (!this.audioPlayer.player.src || !this.data.syncVolume) {
          return;
        }

        for (let i = 0; i < mutations.length; i++) {
          const mutation = mutations[i];
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "aria-valuenow"
          ) {
            if (this.firstSyncVolume) {
              // disable sync if it's sync when the translation is enabled
              this.firstSyncVolume = false;
              return;
            }

            // youtube sets setMuted and returns the old value if the slider is moved to 0
            // also fixes the operation if the video is muted via the hotkey
            const videoVolume = this.isMuted()
              ? 0
              : this.getVideoVolume() * 100;

            const finalVolume = Math.round(videoVolume);
            this.data.defaultVolume = finalVolume;
            this.audioPlayer.player.volume = this.data.defaultVolume / 100;
            this.syncVolumeWrapper("video", finalVolume);
          }
        }
      });

      const ytpVolumePanel = document.querySelector(".ytp-volume-panel");
      if (ytpVolumePanel) {
        this.syncVolumeObserver.observe(ytpVolumePanel, {
          attributes: true,
          childList: false,
          subtree: true,
          attributeOldValue: true,
        });
      }
    }

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

    document.addEventListener(
      "keydown",
      async (event) => {
        const code = event.code;
        // Проверка, если активный элемент - это вводимый элемент
        const activeElement = document.activeElement;
        const isInputElement =
          ["input", "textarea"].includes(activeElement.tagName.toLowerCase()) ||
          activeElement.isContentEditable;
        if (!isInputElement && code === this.data.hotkeyButton) {
          await this.handleTranslationBtnClick();
        }
      },
      { signal },
    );

    let eventContainer = this.site.eventSelector
      ? document.querySelector(this.site.eventSelector)
      : this.container;
    if (eventContainer)
      addExtraEventListeners(
        eventContainer,
        ["mousemove", "mouseout"],
        this.resetTimer,
      );

    addExtraEventListener(
      this.votButton.container,
      "mousemove",
      this.changeOpacityOnEvent,
    );
    addExtraEventListener(
      this.votMenu.container,
      "mousemove",
      this.changeOpacityOnEvent,
    );
    addExtraEventListeners(
      document,
      ["touchstart", "touchmove", "touchend"],
      this.changeOpacityOnEvent,
    );

    // fix youtube hold to fast
    addExtraEventListener(this.votButton.container, "mousedown", (e) => {
      e.stopImmediatePropagation();
    });
    addExtraEventListener(this.votMenu.container, "mousedown", (e) => {
      e.stopImmediatePropagation();
    });

    // fix draggable menu in youtube (#394, #417)
    if (this.site.host === "youtube") {
      this.container.draggable = false;
    }

    addExtraEventListener(this.video, "canplay", async () => {
      // Временное решение
      if (this.site.host === "rutube" && this.video.src) {
        return;
      }
      await this.setCanPlay();
    });

    addExtraEventListener(this.video, "emptied", async () => {
      if (
        this.video.src &&
        (await getVideoID(this.site, this.video, { fetchFn: GM_fetch })) ===
          this.videoData.videoId
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
        if (!window.location.pathname.includes("/shorts/")) {
          return;
        }
        await this.setCanPlay();
      });
    }
  }

  async setCanPlay() {
    if (
      (await getVideoID(this.site, this.video, { fetchFn: GM_fetch })) ===
      this.videoData.videoId
    )
      return;
    await this.handleSrcChanged();
    await this.autoTranslate();
    debug.log("lipsync mode is canplay");
  }

  logout(n) {
    if (!this.votMenu.container.hidden) return;
    this.votButton.container.style.opacity = n;
    if (this.site.externalEventHost) {
      debug.log("Send data to external event host");
      window.parent.postMessage(
        n === 0 ? "extraEventMouseOut" : "extraEventMouseEnter",
        this.site.externalEventHost,
      );
    }
  }

  resetTimer = () => {
    clearTimeout(this.timer);
    this.logout(1);
    this.timer = setTimeout(() => {
      this.logout(0);
    }, 1000);
  };

  changeOpacityOnEvent = (event) => {
    clearTimeout(this.timer);
    this.logout(1);
    event.stopPropagation();
  };

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
      const subtitlesObj = this.subtitlesList.at(parseInt(subs));
      if (
        this.translateProxyEnabled >= 1 &&
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

      this.yandexSubtitles = await fetchSubtitles(subtitlesObj);
      this.subtitlesWidget.setContent(this.yandexSubtitles);
      this.votDownloadSubtitlesButton.hidden = false;
    }
  }

  async updateSubtitlesLangSelect() {
    const updatedOptions = [
      {
        label: localizationProvider.get("VOTSubtitlesDisabled"),
        value: "disabled",
        selected: true,
        disabled: false,
      },
      ...this.subtitlesList.map((s, idx) => ({
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

  async updateSubtitles() {
    await this.changeSubtitlesLang("disabled");

    if (!this.videoData.videoId) {
      console.error(
        `[VOT] ${localizationProvider.getDefault("VOTNoVideoIDFound")}`,
      );
      this.subtitlesList = [];
      this.subtitlesListVideoId = null;
      this.votButton.container.hidden = true;
      await this.updateSubtitlesLangSelect();
      return;
    }

    this.votButton.container.hidden = false;

    if (this.subtitlesListVideoId === this.videoData.videoId) {
      return;
    }

    this.subtitlesList = await getSubtitles(this.votClient, this.videoData);

    if (!this.subtitlesList) {
      await this.changeSubtitlesLang("disabled");
    } else {
      this.subtitlesListVideoId = this.videoData.videoId;
    }
    await this.updateSubtitlesLangSelect();
  }

  /**
   * Get video volume in 0.00-1.00 format
   *
   * @type {import('./index').VideoHandler['getVideoVolume']}
   */
  getVideoVolume() {
    let videoVolume = this.video?.volume;
    if (["youtube", "googledrive"].includes(this.site.host)) {
      videoVolume = youtubeUtils.getVideoVolume() ?? videoVolume;
    }

    return videoVolume;
  }

  /**
   * Set video volume in 0.00-1.00 format
   *
   * @type {import('./index').VideoHandler['setVideoVolume']}
   */
  setVideoVolume(volume) {
    if (["youtube", "googledrive"].includes(this.site.host)) {
      const videoVolume = youtubeUtils.setVideoVolume(volume);
      if (videoVolume) {
        return this;
      }
    }

    this.video.volume = volume;
    return this;
  }

  /**
   * @type {import('./index').VideoHandler['isMuted']}
   */
  isMuted() {
    return ["youtube", "googledrive"].includes(this.site.host)
      ? youtubeUtils.isMuted()
      : this.video?.muted;
  }

  // Sync volume slider with original video
  syncVideoVolumeSlider() {
    const videoVolume = this.isMuted() ? 0 : this.getVideoVolume() * 100;
    const newSlidersVolume = Math.round(videoVolume);

    this.votVideoVolumeSlider.input.value = newSlidersVolume;
    this.votVideoVolumeSlider.label.querySelector("strong").textContent =
      `${newSlidersVolume}%`;
    ui.updateSlider(this.votVideoVolumeSlider.input);

    if (this.data.syncVolume === 1) {
      this.tempOriginalVolume = Number(newSlidersVolume);
    }
  }

  setSelectMenuValues(from, to) {
    this.votTranslationLanguageSelect.fromSelect.setTitle(
      localizationProvider.get("langs")[from],
    );
    this.votTranslationLanguageSelect.toSelect.setTitle(
      localizationProvider.get("langs")[to],
    );
    this.votTranslationLanguageSelect.fromSelect.setSelected(from);
    this.votTranslationLanguageSelect.toSelect.setSelected(to);
    console.log(`[VOT] Set translation from ${from} to ${to}`);
    this.videoData.detectedLanguage = from;
    this.videoData.responseLanguage = to;
  }

  /**
   * wrap over syncVolume to make it easier to work with sliders
   * @constructor
   * @param {"translation" | "video"} fromType - the initiator of sync
   * @param {number} newVolume - new volume of sliders
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

    // Update the temp variables for future syncing
    this.tempOriginalVolume =
      fromType === "translation" ? finalValue : newVolume;
    this.tempVolume = fromType === "translation" ? newVolume : finalValue;
  }

  /**
   * Asynchronously retrieves video data from the current page's URL.
   * If the video is hosted on YouTube, it also retrieves additional data.
   *
   * @return {Promise<Object>} An object containing the video's duration, URL, video ID, host,
   * detected language, response language, and translation help.
   */
  async getVideoData() {
    const {
      duration,
      url,
      videoId,
      host,
      title,
      translationHelp,
      detectedLanguage,
      subtitles,
    } = await getVideoData(this.site, this.video, {
      fetchFn: GM_fetch,
    });
    const videoData = {
      translationHelp: translationHelp ?? null,
      // by default, we request the translation of the video
      isStream: false,
      // ! if 0 - we get 400 error
      duration: this.video?.duration || duration || votConfig.defaultDuration,
      videoId,
      url,
      host,
      detectedLanguage: detectedLanguage ?? this.translateFromLang,
      responseLanguage: this.translateToLang,
      subtitles,
      title,
    };

    if (this.site.host === "youtube") {
      const youtubeData = await youtubeUtils.getVideoData();
      videoData.isStream = youtubeData.isLive;
      if (youtubeData.title) {
        videoData.detectedLanguage = youtubeData.detectedLanguage;
        videoData.title = youtubeData.localizedTitle;
      }
    } else if (["rutube", "ok.ru", "mail_ru"].includes(this.site.host)) {
      videoData.detectedLanguage = "ru";
    } else if (this.site.host === "youku") {
      videoData.detectedLanguage = "zh";
    } else if (this.site.host === "vk") {
      const trackLang = document.getElementsByTagName("track")?.[0]?.srclang;
      videoData.detectedLanguage = trackLang || "auto";
    } else if (this.site.host === "weverse") {
      videoData.detectedLanguage = "ko";
    } else {
      videoData.detectedLanguage = "auto";
    }
    return videoData;
  }

  videoValidator() {
    debug.log("VideoValidator videoData: ", this.videoData);
    if (
      this.data.dontTranslateYourLang === 1 &&
      this.videoData.detectedLanguage === this.data.dontTranslateLanguage
    ) {
      throw new VOTLocalizedError("VOTDisableFromYourLang");
    }

    if (!this.videoData.isStream && this.videoData.duration > 14_400) {
      throw new VOTLocalizedError("VOTVideoIsTooLong");
    }

    return true;
  }

  // Default actions on stop translate
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
    if (this.volumeOnStart) {
      this.setVideoVolume(this.volumeOnStart);
    }
    clearInterval(this.streamPing);
    clearTimeout(this.autoRetry);
    this.hls?.destroy();
    this.hls = initHls();
    this.firstSyncVolume = true;
  }

  async translateExecutor(VIDEO_ID) {
    debug.log("Run translateFunc", VIDEO_ID);
    await this.translateFunc(
      VIDEO_ID,
      this.videoData.isStream,
      this.videoData.detectedLanguage,
      this.videoData.responseLanguage,
      this.videoData.translationHelp,
    );
  }

  async updateTranslationErrorMsg(errorMessage) {
    const translationTake = localizationProvider.get("translationTake");
    const lang = localizationProvider.lang;

    // we always change it so isn't to accidentally replace the error message
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
      // to prevent pass Error as text
      this.transformBtn("error", errorMessage?.message);
    } else if (
      this.data.translateAPIErrors === 1 &&
      lang !== "ru" &&
      !errorMessage.includes(translationTake)
    ) {
      // adds a stub text until a text translation is received to avoid a long delay with long text
      this.setLoadingBtn(true);
      const translatedMessage = await translate(errorMessage, "ru", lang);
      this.transformBtn("error", translatedMessage);
    } else {
      this.transformBtn("error", errorMessage);
    }

    // it must be at the very bottom of the function, otherwise it will be overwritten in the transformBtn
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

  afterUpdateTranslation(audioUrl) {
    this.votVideoVolumeSlider.container.hidden =
      this.data.showVideoSlider !== 1 ||
      this.votButton.container.dataset.status !== "success";
    this.votVideoTranslationVolumeSlider.container.hidden =
      this.votButton.container.dataset.status !== "success";

    if (this.data.autoSetVolumeYandexStyle === 1) {
      this.votVideoVolumeSlider.input.value = this.data.autoVolume * 100;
      this.votVideoVolumeSlider.label.querySelector("strong").textContent = `${
        this.data.autoVolume * 100
      }%`;
      ui.updateSlider(this.votVideoVolumeSlider.input);
    }

    this.votDownloadButton.hidden = false;
    this.downloadTranslationUrl = audioUrl;
    debug.log(
      "afterUpdateTranslation downloadTranslationUrl",
      this.downloadTranslationUrl,
    );
  }

  async validateAudioUrl(audioUrl) {
    try {
      const response = await GM_fetch(audioUrl, {
        method: "HEAD",
      });
      debug.log("Test audio response", response);
      if (response.status !== 404) {
        debug.log("Valid audioUrl", audioUrl);
        return audioUrl;
      }

      debug.log("Yandex returned not valid audio, trying to fix...");
      let translateRes = await this.translateVideoImpl(
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

  // update translation audio src
  async updateTranslation(audioUrl) {
    // ! Don't use this function for streams
    if (this.cachedTranslation?.url !== this.audioPlayer.player.currentSrc) {
      audioUrl = await this.validateAudioUrl(audioUrl);
    }

    if (
      this.translateProxyEnabled === 2 &&
      audioUrl.startsWith("https://vtrans.s3-private.mds.yandex.net/tts/prod/")
    ) {
      const audioPath = audioUrl.replace(
        "https://vtrans.s3-private.mds.yandex.net/tts/prod/",
        "",
      );
      audioUrl = `https://${this.data.proxyWorkerHost}/video-translation/audio-proxy/${audioPath}`;
      console.log(`[VOT] Audio proxied via ${audioUrl}`);
    }

    if (this.audioPlayer.player.src !== audioUrl) {
      this.audioPlayer.player.src = audioUrl;
    }

    try {
      this.audioPlayer.init();
    } catch (err) {
      debug.log("this.audioPlayer.init() error", err);
      this.videoHandler.transformBtn("error", err.message);
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

  // Define a function to translate a video and handle the callback
  async translateFunc(
    VIDEO_ID,
    isStream,
    requestLang,
    responseLang,
    translationHelp,
  ) {
    console.log("[VOT] Video Data: ", this.videoData);
    // fix enabling the old requested voiceover when changing the language to the native language (#414)
    debug.log("Run videoValidator");
    this.videoValidator();
    this.setLoadingBtn(true);
    this.volumeOnStart = this.getVideoVolume();

    if (isStream) {
      let translateRes = await this.translateStreamImpl(
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
      const streamURL = this.setHLSSource(translateRes.result.url);
      if (this.site.host === "youtube") {
        youtubeUtils.videoSeek(this.video, 10); // 10 is the most successful number for streaming. With it, the audio is not so far behind the original
      }

      this.setupAudioSettings();
      if (!this.video.src && !this.video.currentSrc && !this.video.srcObject) {
        return this.stopTranslation();
      }

      return this.afterUpdateTranslation(streamURL);
    }

    this.cachedTranslation = this.videoTranslations.find(
      (t) =>
        t.videoId === VIDEO_ID &&
        t.expires > getTimestamp() &&
        t.from === requestLang &&
        t.to === responseLang &&
        t.useNewModel === this.data.useNewModel,
    );

    if (this.cachedTranslation) {
      await this.updateTranslation(this.cachedTranslation.url);
      debug.log("[translateFunc] Cached translation was received");
      return;
    }

    let translateRes = await this.translateVideoImpl(
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

    if (
      !this.subtitlesList.some(
        (item) =>
          item.source === "yandex" &&
          item.translatedFromLanguage === this.videoData.detectedLanguage &&
          item.language === this.videoData.responseLanguage,
      )
    ) {
      this.subtitlesList = await getSubtitles(this.votClient, this.videoData);
      await this.updateSubtitlesLangSelect();
    }

    this.videoTranslations.push({
      videoId: VIDEO_ID,
      from: requestLang,
      to: responseLang,
      url: this.downloadTranslationUrl,
      expires: getTimestamp() + this.videoTranslationTTL,
      useNewModel: this.data?.useNewModel,
    });
  }

  // Вспомогательные методы
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
    // doesn't work
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
            // All retries and media options have been exhausted.
            // Immediately trying to restart loading could cause loop loading.
            // Consider modifying loading policies to best fit your asset and network
            // conditions (manifestLoadPolicy, playlistLoadPolicy, fragLoadPolicy).
            break;
          default:
            // cannot recover
            this.hls.destroy();
            break;
        }
      }
    });
    debug.log(this.hls);
  }

  setHLSSource(url) {
    const streamURL = `https://${
      this.data.m3u8ProxyHost
    }/?all=yes&origin=${encodeURIComponent(
      "https://strm.yandex.ru",
    )}&referer=${encodeURIComponent(
      "https://strm.yandex.ru",
    )}&url=${encodeURIComponent(url)}`;
    if (this.hls) {
      this.setupHLS(streamURL);
    } else if (
      this.audioPlayer.player.audio.canPlayType("application/vnd.apple.mpegurl")
    ) {
      // safari
      this.audioPlayer.player.src = streamURL; // TODO: make class for HLS audio player
    } else {
      // browser doesn't support m3u8 (hls unsupported and it isn't a safari)
      throw new VOTLocalizedError("audioFormatNotSupported");
    }

    return streamURL;
  }

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

  // Define a function to stop translation and clean up
  stopTranslation = () => {
    this.stopTranslate();
    this.syncVideoVolumeSlider();
  };

  async handleSrcChanged() {
    debug.log("[VideoHandler] src changed", this);
    this.firstPlay = true;
    this.stopTranslation();

    const hide =
      !this.video.src && !this.video.currentSrc && !this.video.srcObject;
    this.votButton.container.hidden = hide;
    if (hide) {
      this.votMenu.container.hidden = hide;
    }

    if (!this.site.selector) {
      this.container = this.video.parentElement;
    }

    if (!this.container.contains(this.votButton.container)) {
      this.container.append(this.votButton.container, this.votMenu.container);
    }

    this.videoData = await this.getVideoData();
    await this.updateSubtitles();
    this.translateToLang = this.data.responseLanguage ?? "ru";
    this.setSelectMenuValues(
      this.videoData.detectedLanguage,
      this.videoData.responseLanguage,
    );
  }

  async release() {
    debug.log("[VideoHandler] release");

    this.initialized = false;
    this.releaseExtraEvents();
    this.subtitlesWidget.release();
    this.votButton.container.remove();
    this.votMenu.container.remove();
  }
}

const videoObserver = new VideoObserver();
const videosWrappers = new WeakMap();

/**
 * Finds the parent element of a given element that matches a specified selector.
 *
 * @param {HTMLElement} el - The element to start searching from.
 * @param {string} selector - The CSS selector to match.
 * @returns {HTMLElement|null} The parent element that matches the selector, or null if no match is found.
 */
function climb(el, selector) {
  if (!el || !selector) {
    return null;
  }

  if (el instanceof Document) {
    return el.querySelector(selector);
  }

  const foundEl = el.closest(selector);
  if (foundEl) {
    return foundEl;
  }

  const root = el.getRootNode();
  return climb(root instanceof Document ? root : root.host, selector);
}

/**
 * Finds the container element for a given video element and site object.
 *
 * @param {Object} site - The site object.
 * @param {Object} video - The video element.
 * @return {Object|null} The container element or null if not found.
 */
function findContainer(site, video) {
  debug.log("findContainer", site, video);
  if (site.shadowRoot) {
    let container = climb(video, site.selector);

    debug.log("findContainer with site.shadowRoot", container);
    return container ?? video.parentElement;
  }

  debug.log("findContainer without shadowRoot");

  const browserVersion = browserInfo.browser.version?.split(".")?.[0];
  if (
    site.selector?.includes(":not") &&
    site.selector?.includes("*") &&
    browserVersion &&
    ((browserInfo.browser.name === "Chrome" && Number(browserVersion) < 88) ||
      (browserInfo.browser.name === "Firefox" && Number(browserVersion) < 84))
  ) {
    const selector = site.selector.split(" *")[0];
    return selector
      ? Array.from(document.querySelectorAll(selector)).find((e) =>
          e.contains(video),
        )
      : video.parentElement;
  }

  return site.selector
    ? Array.from(document.querySelectorAll(site.selector)).find((e) =>
        e.contains(video),
      )
    : video.parentElement;
}

async function main() {
  debug.log("Loading extension...");

  await localizationProvider.update();

  debug.log(`Selected menu language: ${localizationProvider.lang}`);

  // I haven't figured out how to do it any other way
  if (window.location.origin === "https://9animetv.to") {
    window.addEventListener("message", (e) => {
      if (e.origin !== "https://rapid-cloud.co") {
        return;
      }

      if (e.data === "getVideoId") {
        const videoId = /[^/]+$/.exec(window.location.href)?.[0];
        const iframeWin =
          document.querySelector("#iframe-embed")?.contentWindow;

        iframeWin.postMessage(
          `getVideoId:${videoId}`,
          "https://rapid-cloud.co/",
        );
      }
    });
  }

  if (window.location.origin === "https://drive.google.com") {
    window.addEventListener("message", (e) => {
      if (e.origin !== "https://youtube.googleapis.com") {
        return;
      }

      if (!["extraEventMouseEnter", "extraEventMouseOut"].includes(e.data)) {
        return;
      }

      debug.log("pass!!", e.data);

      const iframeEl = document.querySelector("iframe[title]");
      if (!iframeEl) {
        console.error("[VOT] Failed to find video player iframe element");
      }

      iframeEl.style =
        e.data === "extraEventMouseOut"
          ? ""
          : "position:relative;z-index:777 !important";
    });
  }

  videoObserver.onVideoAdded.addListener((video) => {
    for (const site of getService()) {
      if (!site) continue;

      let container = findContainer(site, video);
      if (!container) continue;

      if (site.host === "rumble" && !video.style.display) {
        continue; // fix multiply translation buttons in rumble.com
      }

      // if (
      //   site.host === "youku" &&
      //   !video.parentElement?.classList.contains("video-layer")
      // ) {
      //   continue;
      // }

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
