import { convertSubs } from "@vot.js/shared/utils/subs";

import ui from "../ui";

import type { VideoHandler } from "..";
import {
  actualCompatVersion,
  maxAudioVolume,
  repositoryUrl,
} from "../config/config";
import { localizationProvider } from "../localization/localizationProvider";
import type { Status } from "../types/components/votButton";
import type { StorageData } from "../types/storage";
import type { UIManagerProps } from "../types/uiManager";
import { VOTLocalizedError } from "../utils/VOTLocalizedError.js";
import debug from "../utils/debug";
import { GM_fetch, isSupportGMXhr } from "../utils/gm";
import { votStorage } from "../utils/storage";
import {
  clamp,
  clearFileName,
  downloadBlob,
  downloadTranslation,
  exitFullscreen,
  openDownloadTranslation,
} from "../utils/utils";
import VOTButton from "./components/votButton";
import { OverlayView } from "./views/overlay";
import { SettingsView } from "./views/settings";

export class UIManager {
  root: HTMLElement;
  portalContainer: HTMLElement;
  tooltipLayoutRoot: HTMLElement;

  private initialized = false;
  private data: Partial<StorageData>;
  private videoHandler?: VideoHandler;

  votGlobalPortal?: HTMLElement;
  /**
   * Contains all elements over video player e.g. button, menu and etc
   */
  votOverlayView?: OverlayView;
  /**
   * Dialog settings menu
   */
  votSettingsView?: SettingsView;

  constructor({
    root,
    portalContainer,
    tooltipLayoutRoot,
    data = {},
    videoHandler,
  }: UIManagerProps) {
    this.root = root;
    this.portalContainer = portalContainer;
    this.tooltipLayoutRoot = tooltipLayoutRoot;
    this.videoHandler = videoHandler;
    this.data = data;
  }

  isInitialized(): this is {
    votGlobalPortal: HTMLElement;
    votOverlayView: OverlayView;
    votSettingsView: SettingsView;
  } {
    return this.initialized;
  }

  initUI() {
    if (this.isInitialized()) {
      throw new Error("[VOT] UIManager is already initialized");
    }

    this.initialized = true;

    this.votGlobalPortal = ui.createPortal();
    document.documentElement.appendChild(this.votGlobalPortal);

    this.votOverlayView = new OverlayView({
      root: this.root,
      portalContainer: this.portalContainer,
      tooltipLayoutRoot: this.tooltipLayoutRoot,
      globalPortal: this.votGlobalPortal,
      data: this.data,
      videoHandler: this.videoHandler,
    });
    this.votOverlayView.initUI();

    this.votSettingsView = new SettingsView({
      globalPortal: this.votGlobalPortal,
      data: this.data,
      videoHandler: this.videoHandler,
    });
    this.votSettingsView.initUI();

    return this;
  }

  initUIEvents() {
    if (!this.isInitialized()) {
      throw new Error("[VOT] UIManager isn't initialized");
    }

    // #region overlay view events
    this.votOverlayView.initUIEvents();
    this.votOverlayView
      .addEventListener("click:translate", async () => {
        await this.handleTranslationBtnClick();
      })
      .addEventListener("click:pip", async () => {
        if (!this.videoHandler) {
          return;
        }

        const isPiPActive =
          this.videoHandler.video === document.pictureInPictureElement;
        await (isPiPActive
          ? document.exitPictureInPicture()
          : this.videoHandler.video.requestPictureInPicture());
      })
      .addEventListener("click:settings", async () => {
        this.videoHandler?.subtitlesWidget.releaseTooltip();
        this.votSettingsView.open();
        await exitFullscreen();
      })
      .addEventListener("click:downloadTranslation", async () => {
        if (
          !this.votOverlayView.isInitialized() ||
          !this.videoHandler?.downloadTranslationUrl ||
          !this.videoHandler.videoData
        ) {
          return;
        }

        try {
          if (!this.data.downloadWithName || !isSupportGMXhr) {
            return openDownloadTranslation(
              this.videoHandler.downloadTranslationUrl,
            );
          }

          this.votOverlayView.downloadTranslationButton.progress = 0;
          const res = await GM_fetch(this.videoHandler.downloadTranslationUrl, {
            timeout: 0,
          });
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          const filename = clearFileName(
            this.videoHandler.videoData.downloadTitle,
          );
          await downloadTranslation(res, filename, (progress) => {
            this.votOverlayView.downloadTranslationButton!.progress = progress;
          });
        } catch (err) {
          console.error("[VOT] Download translation failed:", err);
          openDownloadTranslation(this.videoHandler.downloadTranslationUrl);
        }

        this.votOverlayView.downloadTranslationButton.progress = 0;
      })
      .addEventListener("click:downloadSubtitles", async () => {
        if (
          !this.videoHandler ||
          !this.videoHandler.yandexSubtitles ||
          !this.videoHandler.videoData
        ) {
          return;
        }

        const subsFormat = this.data.subtitlesDownloadFormat ?? "json";
        const subsContent = convertSubs(
          this.videoHandler.yandexSubtitles,
          subsFormat,
        );
        const blob = new Blob(
          [
            subsFormat === "json"
              ? JSON.stringify(subsContent)
              : (subsContent as string),
          ],
          {
            type: "text/plain",
          },
        );
        const filename = this.data.downloadWithName
          ? clearFileName(this.videoHandler.videoData.downloadTitle)
          : `subtitles_${this.videoHandler.videoData.videoId}`;
        downloadBlob(blob, `${filename}.${subsFormat}`);
      })
      .addEventListener("input:videoVolume", (volume) => {
        if (!this.videoHandler) {
          return;
        }

        this.videoHandler.setVideoVolume(volume / 100);
        if (!this.data.syncVolume) {
          return;
        }

        this.videoHandler.syncVolumeWrapper("video", volume);
      })
      .addEventListener("input:translationVolume", () => {
        if (!this.videoHandler) {
          return;
        }

        const defaultVolume = this.data.defaultVolume ?? 100;
        this.videoHandler.audioPlayer.player.volume = defaultVolume / 100;
        if (!this.data.syncVolume) {
          return;
        }

        this.videoHandler.syncVolumeWrapper("translation", defaultVolume);
        if (
          ["youtube", "googledrive"].includes(this.videoHandler.site.host) &&
          this.videoHandler.site.additionalData !== "mobile"
        ) {
          this.videoHandler.setVideoVolume(
            this.videoHandler.tempOriginalVolume / 100,
          );
        }
      })
      .addEventListener("select:subtitles", async (data) => {
        await this.videoHandler?.changeSubtitlesLang(data);
      });

    // #endregion overlay view events
    // #region settings view events
    this.votSettingsView.initUIEvents();
    this.votSettingsView
      .addEventListener("update:account", async (account) => {
        if (!this.videoHandler) {
          return;
        }

        this.videoHandler.votClient.apiToken = account?.token;
      })
      .addEventListener("change:autoTranslate", async (checked) => {
        if (
          checked &&
          this.videoHandler &&
          !this.videoHandler?.hasActiveSource()
        ) {
          await this.handleTranslationBtnClick();
        }
      })
      .addEventListener("change:showVideoVolume", () => {
        if (!this.votOverlayView.isInitialized()) {
          return;
        }

        this.votOverlayView.videoVolumeSlider.container.hidden =
          !this.data.showVideoSlider ||
          this.votOverlayView.votButton.status !== "success";
      })
      .addEventListener("change:audioBuster", async () => {
        if (!this.votOverlayView.isInitialized()) {
          return;
        }

        const currentVolume = this.votOverlayView.translationVolumeSlider.value;
        this.votOverlayView.translationVolumeSlider.max = this.data.audioBooster
          ? maxAudioVolume
          : 100;
        this.votOverlayView.translationVolumeSlider.value = clamp(
          currentVolume,
          0,
          100,
        );
      })
      .addEventListener("change:useLivelyVoice", () => {
        this.videoHandler?.stopTranslate();
      })
      .addEventListener("change:subtitlesHighlightWords", (checked) => {
        this.videoHandler?.subtitlesWidget.setHighlightWords(
          this.data.highlightWords ?? checked,
        );
      })
      .addEventListener("input:subtitlesMaxLength", (value) => {
        this.videoHandler?.subtitlesWidget.setMaxLength(
          this.data.subtitlesMaxLength ?? value,
        );
      })
      .addEventListener("input:subtitlesFontSize", (value) => {
        this.videoHandler?.subtitlesWidget.setFontSize(
          this.data.subtitlesFontSize ?? value,
        );
      })
      .addEventListener("input:subtitlesBackgroundOpacity", (value) => {
        this.videoHandler?.subtitlesWidget.setOpacity(
          this.data.subtitlesOpacity ?? value,
        );
      })
      .addEventListener("change:proxyWorkerHost", (value) => {
        if (!this.data.translateProxyEnabled || !this.videoHandler) {
          return;
        }

        this.videoHandler.votClient.host = this.data.proxyWorkerHost ?? value;
      })
      .addEventListener("select:proxyTranslationStatus", () => {
        this.videoHandler?.initVOTClient();
      })
      .addEventListener("change:useNewAudioPlayer", () => {
        if (!this.videoHandler) {
          return;
        }

        this.videoHandler.stopTranslate();
        this.videoHandler.createPlayer();
      })
      .addEventListener("change:onlyBypassMediaCSP", () => {
        if (!this.videoHandler) {
          return;
        }

        this.videoHandler.stopTranslate();
        this.videoHandler.createPlayer();
      })
      .addEventListener("select:translationTextService", () => {
        if (!this.videoHandler) {
          return;
        }

        this.videoHandler.subtitlesWidget.strTranslatedTokens = "";
        this.videoHandler.subtitlesWidget.releaseTooltip();
      })
      .addEventListener("change:showPiPButton", () => {
        if (!this.votOverlayView.isInitialized()) {
          return;
        }

        this.votOverlayView.votButton.pipButton.hidden =
          this.votOverlayView.votButton.separator2.hidden =
            !this.votOverlayView.pipButtonVisible;
      })
      .addEventListener("select:buttonPosition", (item) => {
        if (!this.votOverlayView.isInitialized()) {
          return;
        }

        const newPosition = this.data.buttonPos ?? item;
        this.votOverlayView.updateButtonLayout(
          newPosition,
          VOTButton.calcDirection(newPosition),
        );
      })
      .addEventListener("select:menuLanguage", async () => {
        await this.reloadMenu();
      })
      .addEventListener("click:bugReport", () => {
        if (!this.videoHandler) {
          return;
        }

        const params = new URLSearchParams(
          this.videoHandler.collectReportInfo(),
        ).toString();

        window.open(`${repositoryUrl}/issues/new?${params}`, "_blank")?.focus();
      })
      .addEventListener("click:resetSettings", async () => {
        const valuesForClear = await votStorage.list();
        await Promise.all(
          valuesForClear.map(async (val) => await votStorage.delete(val)),
        );
        await votStorage.set("compatVersion", actualCompatVersion);

        window.location.reload();
      });

    // #endregion settings view events
  }

  async reloadMenu() {
    if (!this.votOverlayView?.isInitialized()) {
      throw new Error("[VOT] OverlayView isn't initialized");
    }

    this.videoHandler?.stopTranslation();
    this.release();
    this.initUI();
    this.initUIEvents();
    if (!this.videoHandler) {
      return this;
    }

    await this.videoHandler.updateSubtitlesLangSelect();
    this.videoHandler.subtitlesWidget.portal =
      this.votOverlayView.votOverlayPortal;
    this.videoHandler.subtitlesWidget.strTranslatedTokens = "";
  }

  async handleTranslationBtnClick() {
    if (!this.votOverlayView?.isInitialized()) {
      throw new Error("[VOT] OverlayView isn't initialized");
    }

    if (!this.videoHandler) {
      return this;
    }

    debug.log("[handleTranslationBtnClick] click translationBtn");
    if (this.videoHandler.hasActiveSource()) {
      debug.log("[handleTranslationBtnClick] video has active source");
      this.videoHandler.stopTranslation();
      return this;
    }

    if (
      this.votOverlayView.votButton.status !== "none" ||
      this.votOverlayView.votButton.loading
    ) {
      debug.log(
        "[handleTranslationBtnClick] translationBtn isn't in none state",
      );
      this.videoHandler.actionsAbortController.abort();
      this.videoHandler.stopTranslation();
      return this;
    }

    try {
      debug.log("[handleTranslationBtnClick] trying execute translation");
      if (!this.videoHandler.videoData?.videoId) {
        throw new VOTLocalizedError("VOTNoVideoIDFound");
      }

      // for VK clips and Douyin, we need update current video ID
      if (
        (this.videoHandler.site.host === "vk" &&
          this.videoHandler.site.additionalData === "clips") ||
        this.videoHandler.site.host === "douyin"
      ) {
        this.videoHandler.videoData = await this.videoHandler.getVideoData();
      }

      debug.log(
        "[handleTranslationBtnClick] Run translateFunc",
        this.videoHandler.videoData.videoId,
      );
      await this.videoHandler.translateFunc(
        this.videoHandler.videoData.videoId,
        this.videoHandler.videoData.isStream,
        this.videoHandler.videoData.detectedLanguage,
        this.videoHandler.videoData.responseLanguage,
        this.videoHandler.videoData.translationHelp,
      );
    } catch (err) {
      console.error("[VOT]", err);
      if (!(err instanceof Error)) {
        this.transformBtn("error", String(err));
        return this;
      }

      const message =
        err.name === "VOTLocalizedError"
          ? (err as VOTLocalizedError).localizedMessage
          : err.message;
      this.transformBtn("error", message);
    }

    return this;
  }
  private isLoadingText(text: string) {
    return (
      typeof text === "string" &&
      (text.includes(localizationProvider.get("translationTake")) ||
        text.includes(localizationProvider.get("TranslationDelayed")))
    );
  }

  transformBtn(status: Status, text: string) {
    if (!this.votOverlayView?.isInitialized()) {
      throw new Error("[VOT] OverlayView isn't initialized");
    }

    this.votOverlayView.votButton.status = status;
    this.votOverlayView.votButton.loading =
      status === "error" && this.isLoadingText(text);
    this.votOverlayView.votButton.setText(text);
    this.votOverlayView.votButtonTooltip.setContent(text);
    return this;
  }

  releaseUI(initialized = false) {
    if (!this.isInitialized()) {
      throw new Error("[VOT] UIManager isn't initialized");
    }

    this.votOverlayView.releaseUI(true);
    this.votSettingsView.releaseUI(true);
    this.votGlobalPortal.remove();
    this.initialized = initialized;

    return this;
  }

  releaseUIEvents(initialized = false) {
    if (!this.isInitialized()) {
      throw new Error("[VOT] UIManager isn't initialized");
    }

    this.votOverlayView.releaseUIEvents(false);
    this.votSettingsView.releaseUIEvents(false);
    this.initialized = initialized;
    return this;
  }

  release() {
    this.releaseUI(true);
    this.releaseUIEvents(false);
    return this;
  }
}
