import type { VideoData, VideoHandler } from "..";
import {
  actualCompatVersion,
  maxAudioVolume,
  repositoryUrl,
} from "../config/config";
import { localizationProvider } from "../localization/localizationProvider";
import { serializeProcessedSubtitles } from "../subtitles/standards";
import type { Status } from "../types/components/votButton";
import type { StorageData } from "../types/storage";
import type { OverlayMount, UIManagerProps } from "../types/uiManager";
import debug from "../utils/debug";
import { downloadTranslation } from "../utils/download";
import { GM_fetch } from "../utils/gm";
import type { IntervalIdleChecker } from "../utils/intervalIdleChecker";
import { votStorage } from "../utils/storage";
import { safeSetPlayerVolume } from "../utils/translationVolume";
import {
  clamp,
  clearFileName,
  type DownloadBlobOptions,
  downloadBlob,
} from "../utils/utils";
import { applyOverlayMountUpdate } from "./mount";
import {
  createShadowMount,
  destroyShadowMount,
  reparentShadowMount,
  type ShadowMount,
} from "./shadowMount";
import { handleTranslationButtonCommand } from "./translationCommands";
import { OverlayView } from "./views/overlay";
import { SettingsView } from "./views/settings";

export class UIManager {
  mount: OverlayMount;

  private initialized = false;
  private readonly videoHandler?: VideoHandler;
  private readonly intervalIdleChecker: IntervalIdleChecker;
  data: Partial<StorageData>;

  votGlobalPortal?: HTMLElement;
  private globalPortalMount?: ShadowMount;
  /**
   * Contains all elements over video player e.g. button, menu and etc
   */
  votOverlayView?: OverlayView;
  /**
   * Dialog settings menu
   */
  votSettingsView?: SettingsView;

  constructor({
    mount,
    data = {},
    videoHandler,
    intervalIdleChecker,
  }: UIManagerProps) {
    this.mount = mount;
    this.videoHandler = videoHandler;
    this.data = data;
    this.intervalIdleChecker = intervalIdleChecker;
  }

  get root(): HTMLElement | ShadowRoot {
    return this.mount.root;
  }

  get portalContainer(): HTMLElement {
    return this.mount.portalContainer;
  }

  getSubtitlesMountContainer(): HTMLElement | ShadowRoot {
    return this.votOverlayView?.root ?? this.mount.subtitlesMountContainer;
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

    this.globalPortalMount = createShadowMount({
      parent: this.getGlobalPortalHost(this.mount),
      rootClasses: ["vot-portal"],
    });
    this.votGlobalPortal = this.globalPortalMount.root;

    this.votOverlayView = new OverlayView({
      mount: this.mount,
      globalPortal: this.votGlobalPortal,
      data: this.data,
      videoHandler: this.videoHandler,
      intervalIdleChecker: this.intervalIdleChecker,
    });
    // Preserve the user's last chosen button position across UI reloads
    // (e.g. when changing the menu language).
    this.votOverlayView.initUI(this.data.buttonPos ?? "default");

    this.votSettingsView = new SettingsView({
      globalPortal: this.votGlobalPortal,
      data: this.data,
      videoHandler: this.videoHandler,
    });
    this.votSettingsView.initUI();

    this.videoHandler?.subtitlesWidget?.updateMount({
      container: this.getSubtitlesMountContainer(),
    });

    return this;
  }

  updateMount(mount: OverlayMount) {
    reparentShadowMount(
      this.globalPortalMount,
      this.getGlobalPortalHost(mount),
    );

    this.mount = applyOverlayMountUpdate(this.mount, mount, (nextMount) => {
      this.votOverlayView?.updateMount(nextMount);
    });

    this.videoHandler?.subtitlesWidget?.updateMount({
      container: this.getSubtitlesMountContainer(),
    });

    return this;
  }

  private getGlobalPortalHost(_mount: OverlayMount): HTMLElement | ShadowRoot {
    const fullscreenInfo =
      this.videoHandler?.fullscreenHelper?.getFullscreenInfo();

    if (fullscreenInfo?.element && fullscreenInfo.belongsToCurrentVideo) {
      return fullscreenInfo.shadowRoot ?? fullscreenInfo.element;
    }

    return document.documentElement;
  }

  initUIEvents() {
    if (!this.isInitialized()) {
      throw new Error("[VOT] UIManager isn't initialized");
    }

    this.votOverlayView.initUIEvents();
    this.bindOverlayViewEvents();

    this.votSettingsView.initUIEvents();
    this.bindSettingsViewEvents();
  }

  private bindOverlayViewEvents() {
    const overlayView = this.votOverlayView;
    if (!overlayView) {
      return;
    }

    overlayView
      .addEventListener("click:translate", async () => {
        await this.handleTranslationBtnClick();
      })
      .addEventListener("click:pip", async () => {
        if (!this.videoHandler) {
          return;
        }

        try {
          const inPiP = document.pictureInPictureElement != null;
          if (inPiP) {
            await document.exitPictureInPicture();
          } else {
            await this.videoHandler.video.requestPictureInPicture();
          }
        } catch (err) {
          debug.warn("[VOT] Failed to toggle Picture-in-Picture", err);
        }
      })
      .addEventListener("click:settings", async () => {
        this.videoHandler?.subtitlesWidget?.releaseTooltip();
        this.videoHandler?.overlayVisibility?.cancel();
        this.videoHandler?.overlayVisibility?.show();
        this.votSettingsView.open();
      })
      .addEventListener("click:downloadTranslation", async () => {
        await this.handleDownloadTranslationClick();
      })
      .addEventListener("click:downloadSubtitles", async () => {
        await this.handleDownloadSubtitlesClick();
      })
      .addEventListener("input:videoVolume", (volume) => {
        if (!this.videoHandler) {
          return;
        }

        const nextVolume01 = volume / 100;
        this.videoHandler.setVideoVolume(nextVolume01);
        this.videoHandler.applyManualVideoVolumeOverride(nextVolume01);
        if (!this.data.syncVolume) {
          this.videoHandler.onVideoVolumeSliderSynced(volume);
          return;
        }

        this.videoHandler.syncVolumeWrapper("video", volume);
      })
      .addEventListener("input:translationVolume", (volume) => {
        if (!this.videoHandler) {
          return;
        }

        // Prefer the actual event payload (the overlay also updates `data`, but
        // using the payload is simpler and avoids accidental desyncs).
        const nextVolume = volume ?? this.data.defaultVolume ?? 100;
        safeSetPlayerVolume(
          this.videoHandler.audioPlayer.player,
          nextVolume / 100,
        );
        if (!this.data.syncVolume) {
          this.videoHandler.onTranslationVolumeSliderSynced(nextVolume);
          return;
        }
        const syncResult = this.videoHandler.syncVolumeWrapper(
          "translation",
          nextVolume,
        );
        if (typeof syncResult?.nextVideo === "number") {
          this.videoHandler.applyManualVideoVolumeOverride(
            syncResult.nextVideo / 100,
          );
        }
      })
      .addEventListener("select:fromLanguage", async () => {
        if (!this.videoHandler) {
          return;
        }

        await this.videoHandler.refreshAutoSubtitlesForCurrentLangPair();
      })
      .addEventListener("select:subtitles", (data) => {
        if (!this.videoHandler) {
          return;
        }

        this.runDetached(
          this.videoHandler.changeSubtitlesLang(data),
          "Failed to change subtitles language",
        );
      });
  }

  private bindSettingsViewEvents() {
    const settingsView = this.votSettingsView;
    if (!settingsView) {
      return;
    }

    settingsView
      .addEventListener("update:account", async (account) => {
        if (!this.videoHandler) {
          return;
        }

        this.videoHandler.votClient.apiToken = account?.token;
      })
      .addEventListener("change:autoTranslate", async (checked) => {
        const videoHandler = this.videoHandler;
        if (checked && videoHandler && !videoHandler.hasActiveSource()) {
          await this.handleTranslationBtnClick();
        }
      })
      .addEventListener("change:autoSubtitles", async (checked) => {
        if (!checked || !this.videoHandler?.videoData?.videoId) {
          return;
        }

        await this.videoHandler.refreshAutoSubtitlesForCurrentLangPair();
      })
      .addEventListener("select:responseLanguageSubtitles", async () => {
        if (
          !this.videoHandler?.data.autoSubtitles ||
          !this.videoHandler.videoData
        ) {
          return;
        }

        await this.videoHandler.refreshAutoSubtitlesForCurrentLangPair();
      })
      .addEventListener("change:showVideoVolume", () => {
        this.withInitializedOverlayView((overlayView) => {
          if (!overlayView.videoVolumeSlider || !overlayView.votButton) {
            return;
          }

          overlayView.videoVolumeSlider.container.hidden =
            !this.data.showVideoSlider ||
            overlayView.votButton.status !== "success";
        });
      })
      .addEventListener("change:audioBooster", async () => {
        this.withInitializedOverlayView((overlayView) => {
          if (!overlayView.translationVolumeSlider) {
            return;
          }

          const currentVolume = overlayView.translationVolumeSlider.value;
          const maxVolume =
            this.data.audioBooster && !this.data.syncVolume
              ? maxAudioVolume
              : 100;
          overlayView.translationVolumeSlider.max = maxVolume;
          const nextVolume = clamp(currentVolume, 0, maxVolume);
          overlayView.translationVolumeSlider.value = nextVolume;
          this.videoHandler?.onTranslationVolumeSliderSynced(nextVolume);
          this.videoHandler?.syncTranslationPlaybackVolume();
        });
      })
      .addEventListener("change:syncVolume", (checked) => {
        if (!this.videoHandler) {
          return;
        }
        this.videoHandler.setupAudioSettings();

        this.withInitializedOverlayView((overlayView) => {
          const videoSlider = overlayView.videoVolumeSlider;
          const translationSlider = overlayView.translationVolumeSlider;
          if (!videoSlider || !translationSlider) {
            return;
          }

          const maxVolume =
            this.data.audioBooster && !checked ? maxAudioVolume : 100;
          translationSlider.max = maxVolume;
          const nextTranslation = clamp(translationSlider.value, 0, maxVolume);
          translationSlider.value = nextTranslation;
          this.videoHandler.onTranslationVolumeSliderSynced(nextTranslation);
          this.videoHandler.syncTranslationPlaybackVolume();

          if (!checked) {
            return;
          }

          this.videoHandler.resetVolumeLinkState(
            Number(videoSlider.value),
            nextTranslation,
          );
        });
      })
      .addEventListener("change:useLivelyVoice", () => {
        if (!this.videoHandler) {
          return;
        }

        this.runDetached(
          this.videoHandler.stopTranslate(),
          "Failed to stop translation after voice mode change",
        );
      })
      .addEventListener("change:subtitlesHighlightWords", (checked) => {
        this.updateSubtitlesWidgetSetting(
          checked,
          this.data.highlightWords,
          (widget, value) => {
            widget.setHighlightWords(value);
          },
        );
      })
      .addEventListener("change:subtitlesSmartLayout", (checked) => {
        this.updateSubtitlesWidgetSetting(
          checked,
          this.data.subtitlesSmartLayout,
          (widget, value) => {
            widget.setSmartLayout(value);
          },
        );
      })
      .addEventListener("input:subtitlesMaxLength", (value) => {
        this.updateSubtitlesWidgetSetting(
          value,
          this.data.subtitlesMaxLength,
          (widget, nextValue) => {
            widget.setMaxLength(nextValue);
          },
        );
      })
      .addEventListener("input:subtitlesFontSize", (value) => {
        this.updateSubtitlesWidgetSetting(
          value,
          this.data.subtitlesFontSize,
          (widget, nextValue) => {
            widget.setFontSize(nextValue);
          },
        );
      })
      .addEventListener("select:subtitlesFontFamily", (item) => {
        this.updateSubtitlesWidgetSetting(
          item,
          this.data.subtitlesFontFamily,
          (widget, nextValue) => {
            widget.setFontFamily(nextValue);
          },
        );
      })
      .addEventListener("input:subtitlesBackgroundOpacity", (value) => {
        this.updateSubtitlesWidgetSetting(
          value,
          this.data.subtitlesOpacity,
          (widget, nextValue) => {
            widget.setOpacity(nextValue);
          },
        );
      })
      .addEventListener("change:proxyWorkerHost", (_value) => {
        if (!this.videoHandler) {
          return;
        }

        // Proxy host changes invalidate cached requests/URLs and should stop
        // the current translation session.
        this.runDetached(
          this.videoHandler.handleProxySettingsChanged("proxyWorkerHost"),
          "Failed to apply proxyWorkerHost change",
        );
      })
      .addEventListener("select:proxyTranslationStatus", () => {
        // Switching proxy mode changes request routing. Drop stale cache and
        // stop translation so the next run starts with fresh settings.
        if (!this.videoHandler) {
          return;
        }

        this.runDetached(
          this.videoHandler.handleProxySettingsChanged(
            "proxyTranslationStatus",
          ),
          "Failed to apply proxyTranslationStatus change",
        );
      })
      .addEventListener("change:useNewAudioPlayer", () => {
        void this.restartAudioPlayer();
      })
      .addEventListener("change:onlyBypassMediaCSP", () => {
        void this.restartAudioPlayer();
      })
      .addEventListener("select:translationTextService", () => {
        this.withSubtitlesWidget((widget) => {
          widget.resetTranslationContext(true);
        });
      })
      .addEventListener("change:showPiPButton", () => {
        this.withInitializedOverlayView((overlayView) => {
          if (!overlayView.votButton) {
            return;
          }

          overlayView.votButton.pipButton.hidden =
            overlayView.votButton.separator2.hidden =
              !overlayView.pipButtonVisible;
        });
      })
      .addEventListener("select:buttonPosition", (item) => {
        this.withInitializedOverlayView((overlayView) => {
          const preferredPosition = this.data.buttonPos ?? item;
          const { position, direction } =
            overlayView.calcButtonLayout(preferredPosition);
          overlayView.updateButtonLayout(position, direction);
        });
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

        globalThis
          .open(`${repositoryUrl}/issues/new?${params}`, "_blank")
          ?.focus();
      })
      .addEventListener("click:resetSettings", async () => {
        const valuesForClear = await votStorage.list();
        await Promise.all(valuesForClear.map((key) => votStorage.delete(key)));
        await votStorage.set("compatVersion", actualCompatVersion);

        globalThis.location.reload();
      });
  }

  private async handleDownloadTranslationClick() {
    const overlayView = this.votOverlayView;
    const videoHandler = this.videoHandler;
    const download = videoHandler?.downloadTranslation;
    if (!overlayView?.isInitialized() || !download || !videoHandler.videoData) {
      return;
    }

    const downloadVideoData = await this.getDownloadVideoData(
      videoHandler,
      download.videoId,
    );
    if (!downloadVideoData) {
      return;
    }

    const downloadButton = overlayView.downloadTranslationButton;
    const downloadUrl = download.url;
    const filename = this.data.downloadWithName
      ? clearFileName(downloadVideoData.downloadTitle)
      : `translation_${downloadVideoData.videoId}`;
    const isMobile = this.isLikelyMobileDownloadContext();
    const saveOptions: DownloadBlobOptions = { preferShare: isMobile };

    const setProgress = (progress: number) => {
      if (downloadButton) {
        downloadButton.progress = progress;
      }
    };

    setProgress(0);
    try {
      await this.downloadTranslationAudio(
        downloadUrl,
        filename,
        setProgress,
        saveOptions,
      );
    } catch (err) {
      console.error("[VOT] Download translation failed:", err);
      if (!this.triggerUrlDownload(downloadUrl, `${filename}.mp3`)) {
        globalThis.open(downloadUrl, "_blank")?.focus();
      }
    } finally {
      setProgress(0);
    }
  }

  private async getDownloadVideoData(
    videoHandler: VideoHandler,
    downloadVideoId: string,
  ): Promise<VideoData | null> {
    if (videoHandler.videoData?.videoId !== downloadVideoId) {
      this.clearDownloadTranslation(videoHandler);
      return null;
    }

    let videoData: VideoData;
    try {
      videoData = await videoHandler.getVideoData();
    } catch (err) {
      debug.log("[VOT] Failed to refresh video data before download", err);
      return null;
    }

    if (videoData.videoId !== downloadVideoId) {
      this.clearDownloadTranslation(videoHandler);
      return null;
    }

    videoHandler.videoData = videoData;
    return videoData;
  }

  private clearDownloadTranslation(videoHandler: VideoHandler): void {
    videoHandler.downloadTranslation = null;
    if (this.votOverlayView?.downloadTranslationButton) {
      this.votOverlayView.downloadTranslationButton.hidden = true;
    }
  }

  private async downloadTranslationAudio(
    downloadUrl: string,
    filename: string,
    onProgress: (progress: number) => void,
    saveOptions: DownloadBlobOptions,
  ) {
    // Download the full audio. A range request (bytes=0-0) only returns a tiny
    // fragment (~1 byte + headers), which results in a silent ~5KB file.
    const response = await GM_fetch(downloadUrl, { timeout: 0 });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    await downloadTranslation(response, filename, onProgress, saveOptions);
  }

  private async handleDownloadSubtitlesClick() {
    const videoHandler = this.videoHandler;
    if (!videoHandler?.yandexSubtitles || !videoHandler.videoData) {
      return;
    }

    const subsFormat = this.data.subtitlesDownloadFormat ?? "json";
    const subsContent = serializeProcessedSubtitles(
      videoHandler.yandexSubtitles,
      subsFormat,
      {
        assTitle:
          videoHandler.videoData.localizedTitle ??
          videoHandler.videoData.title ??
          videoHandler.videoData.downloadTitle,
      },
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
      ? clearFileName(videoHandler.videoData.downloadTitle)
      : `subtitles_${videoHandler.videoData.videoId}`;
    const targetFilename = `${filename}.${subsFormat}`;
    const isMobile = this.isLikelyMobileDownloadContext();
    const saveOptions: DownloadBlobOptions = { preferShare: isMobile };

    await downloadBlob(blob, targetFilename, saveOptions);
  }

  async reloadMenu() {
    if (!this.votOverlayView?.isInitialized()) {
      throw new Error("[VOT] OverlayView isn't initialized");
    }

    // Preserve overlay state across UI rebuild.
    const prevButtonOpacity = this.votOverlayView.votButton.opacity;
    const prevButtonHidden = this.votOverlayView.votButton.container.hidden;
    const prevMenuHidden = this.votOverlayView.votMenu.hidden;
    const prevButtonPos = this.data.buttonPos ?? "default";
    const settingsWasOpen =
      this.votSettingsView?.dialog?.container?.hidden === false;

    await this.videoHandler?.stopTranslation();
    this.release();
    this.initUI();
    this.initUIEvents();
    if (!this.videoHandler) {
      return this;
    }

    // Restore button/menu visibility + layout.
    try {
      const { position, direction } =
        this.votOverlayView.calcButtonLayout(prevButtonPos);
      this.votOverlayView.updateButtonLayout(position, direction);
      this.votOverlayView.votMenu.hidden = prevMenuHidden;
      this.votOverlayView.votButton.container.hidden = prevButtonHidden;
      this.votOverlayView.votButton.opacity = prevButtonOpacity;
    } catch (err) {
      debug.warn(
        "[VOT] Failed to restore overlay state after menu reload",
        err,
      );
    }

    // Re-bind overlay visibility interactions (overlay elements were recreated).
    try {
      this.videoHandler.rebindOverlayVisibilityTargets();
    } catch (err) {
      debug.warn("[VOT] Failed to rebind overlay visibility targets", err);
    }

    // Keep settings open when language changes (better UX).
    if (settingsWasOpen) {
      try {
        this.votSettingsView?.open();
      } catch (err) {
        debug.warn("[VOT] Failed to reopen settings after menu reload", err);
      }
    }

    await this.videoHandler.updateSubtitlesLangSelect();
    const widget = this.videoHandler.subtitlesWidget;
    if (widget) {
      widget.resetTranslationContext(true);
    }

    return this;
  }

  async handleTranslationBtnClick() {
    if (!this.votOverlayView?.isInitialized()) {
      throw new Error("[VOT] OverlayView isn't initialized");
    }

    await handleTranslationButtonCommand({
      videoHandler: this.videoHandler,
      currentStatus: this.votOverlayView.votButton.status,
      currentLoading: this.votOverlayView.votButton.loading,
      transformBtn: (status, text) => {
        this.transformBtn(status, text);
      },
    });
    return this;
  }

  private isLoadingText(text: string) {
    // Localization keys have historically varied in casing across builds.
    const delayed = localizationProvider.get("TranslationDelayed");
    return (
      typeof text === "string" &&
      (text.includes(localizationProvider.get("translationTake")) ||
        (delayed ? text.includes(delayed) : false))
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

  release() {
    if (!this.isInitialized()) {
      return this;
    }

    // Release child views before removing the shared portal.
    // Each view is now idempotent and releases events before DOM.
    this.votOverlayView.release();
    this.votSettingsView.release();
    destroyShadowMount(this.globalPortalMount);
    this.globalPortalMount = undefined;
    this.votGlobalPortal = undefined;

    this.initialized = false;
    return this;
  }

  private withInitializedOverlayView(
    callback: (overlayView: OverlayView) => void,
  ) {
    if (!this.votOverlayView?.isInitialized()) {
      return;
    }

    callback(this.votOverlayView);
  }

  private withSubtitlesWidget(
    callback: (widget: NonNullable<VideoHandler["subtitlesWidget"]>) => void,
  ) {
    const widget = this.videoHandler?.subtitlesWidget;
    if (!widget) {
      return;
    }

    callback(widget);
  }

  private updateSubtitlesWidgetSetting<T>(
    nextValue: T,
    storedValue: T | undefined,
    apply: (
      widget: NonNullable<VideoHandler["subtitlesWidget"]>,
      value: T,
    ) => void,
  ) {
    this.withSubtitlesWidget((widget) => {
      apply(widget, storedValue ?? nextValue);
    });
  }

  private runDetached(task: Promise<unknown>, errorMessage: string) {
    void task.catch((err) => {
      debug.warn(`[VOT] ${errorMessage}`, err);
    });
  }

  private triggerUrlDownload(url: string, filename: string): boolean {
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      // Cross-origin downloads can ignore `download`; keep navigation off the
      // current tab in that case.
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      return true;
    } catch {
      return false;
    }
  }

  private isLikelyMobileDownloadContext(): boolean {
    if (this.videoHandler?.site.additionalData === "mobile") {
      return true;
    }

    return (
      typeof matchMedia === "function" &&
      matchMedia("(pointer: coarse)").matches
    );
  }

  private async restartAudioPlayer() {
    const videoHandler = this.videoHandler;
    if (!videoHandler) {
      return;
    }

    try {
      await videoHandler.stopTranslate();
      videoHandler.createPlayer();
    } catch (err) {
      debug.warn("[VOT] Failed to restart audio player", err);
    }
  }
}
