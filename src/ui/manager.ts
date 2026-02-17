import type { SubtitlesData } from "@vot.js/shared/types/subs";
import { convertSubs } from "@vot.js/shared/utils/subs";
import type { VideoHandler } from "..";
import {
  actualCompatVersion,
  maxAudioVolume,
  repositoryUrl,
} from "../config/config";
import { localizationProvider } from "../localization/localizationProvider";
import type { ProcessedSubtitles } from "../subtitles/types";
import type { Status } from "../types/components/votButton";
import type { StorageData } from "../types/storage";
import type { OverlayMount, UIManagerProps } from "../types/uiManager";
import ui from "../ui";
import debug from "../utils/debug";
import { buildTranslationBlob, downloadTranslation } from "../utils/download";
import { GM_fetch } from "../utils/gm";
import type { IntervalIdleChecker } from "../utils/intervalIdleChecker";
import { votStorage } from "../utils/storage";
import {
  clamp,
  clearFileName,
  downloadBlob,
  exitFullscreen,
} from "../utils/utils";
import VOTLocalizedError from "../utils/VOTLocalizedError";
import VOTButton from "./components/votButton";
import { OverlayView } from "./views/overlay";
import { SettingsView } from "./views/settings";

const mapProcessedSubtitlesToSharedData = (
  data: ProcessedSubtitles,
): SubtitlesData => {
  const subtitles = data.subtitles.map((line) => ({
    text: line.text,
    startMs: line.startMs,
    durationMs: line.durationMs,
    speakerId: line.speakerId,
    tokens: line.tokens.map((token) => ({
      text: token.text,
      startMs: token.startMs,
      durationMs: token.durationMs,
    })),
  }));

  return {
    containsTokens: subtitles.some((line) => line.tokens.length > 0),
    subtitles,
  };
};

export class UIManager {
  mount: OverlayMount;

  private initialized = false;
  private readonly videoHandler?: VideoHandler;
  private readonly intervalIdleChecker: IntervalIdleChecker;
  data: Partial<StorageData>;

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

  get root(): HTMLElement {
    return this.mount.root;
  }

  get portalContainer(): HTMLElement {
    return this.mount.portalContainer;
  }

  get tooltipLayoutRoot(): HTMLElement | undefined {
    return this.mount.tooltipLayoutRoot;
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

    return this;
  }

  updateMount(mount: OverlayMount) {
    this.mount = mount;
    this.votOverlayView?.updateMount?.(mount);

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
        this.videoHandler?.subtitlesWidget?.releaseTooltip();
        this.videoHandler?.overlayVisibility?.cancel();
        this.videoHandler?.overlayVisibility?.show();
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

        const downloadButton = this.votOverlayView.downloadTranslationButton;
        const downloadUrl = this.videoHandler.downloadTranslationUrl;
        const filename = this.data.downloadWithName
          ? clearFileName(this.videoHandler.videoData.downloadTitle)
          : `translation_${this.videoHandler.videoData.videoId}`;
        const isMobile = this.videoHandler.site.additionalData === "mobile";

        if (downloadButton) {
          downloadButton.progress = 0;
        }

        try {
          if (isMobile) {
            // Download the full audio. A range request (bytes=0-0) only returns a
            // tiny fragment (~1 byte + headers) which results in a silent ~5KB file.
            const res = await GM_fetch(downloadUrl, { timeout: 0 });
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }
            const blob = await buildTranslationBlob(
              res,
              filename,
              (progress) => {
                if (downloadButton) {
                  downloadButton.progress = progress;
                }
              },
            );
            await this.saveBlobWithMobileShare(blob, `${filename}.mp3`, true);
            return;
          }

          // Download the full audio. A range request (bytes=0-0) only returns a
          // tiny fragment (~1 byte + headers) which results in a silent ~5KB file.
          const res = await GM_fetch(downloadUrl, { timeout: 0 });
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          await downloadTranslation(res, filename, (progress) => {
            if (downloadButton) {
              downloadButton.progress = progress;
            }
          });
        } catch (err) {
          console.error("[VOT] Download translation failed:", err);
          if (!this.triggerUrlDownload(downloadUrl, `${filename}.mp3`)) {
            globalThis.open(downloadUrl, "_blank")?.focus();
          }
        } finally {
          if (downloadButton) {
            downloadButton.progress = 0;
          }
        }
      })
      .addEventListener("click:downloadSubtitles", async () => {
        const videoHandler = this.videoHandler;
        if (!videoHandler?.yandexSubtitles || !videoHandler.videoData) {
          return;
        }

        const subsFormat = this.data.subtitlesDownloadFormat ?? "json";
        const subsContent = convertSubs(
          mapProcessedSubtitlesToSharedData(videoHandler.yandexSubtitles),
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
          ? clearFileName(videoHandler.videoData.downloadTitle)
          : `subtitles_${videoHandler.videoData.videoId}`;
        downloadBlob(blob, `${filename}.${subsFormat}`);
      })
      .addEventListener("input:videoVolume", (volume) => {
        if (!this.videoHandler) {
          return;
        }

        this.videoHandler.setVideoVolume(volume / 100);
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
        this.videoHandler.audioPlayer.player.volume = nextVolume / 100;
        if (!this.data.syncVolume) {
          this.videoHandler.onTranslationVolumeSliderSynced(nextVolume);
          return;
        }
        this.videoHandler.syncVolumeWrapper("translation", nextVolume);
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
      .addEventListener("change:autoSubtitles", async (checked) => {
        if (!checked || !this.videoHandler?.videoData?.videoId) {
          return;
        }

        await this.videoHandler.enableSubtitlesForCurrentLangPair();
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
          const maxVolume = this.data.audioBooster ? maxAudioVolume : 100;
          overlayView.translationVolumeSlider.max = maxVolume;
          const nextVolume = clamp(currentVolume, 0, maxVolume);
          overlayView.translationVolumeSlider.value = nextVolume;
          this.videoHandler?.onTranslationVolumeSliderSynced(nextVolume);
        });
      })
      .addEventListener("change:syncVolume", (checked) => {
        if (!this.videoHandler) {
          return;
        }
        this.videoHandler.setupAudioSettings();
        if (!checked) {
          return;
        }

        this.withInitializedOverlayView((overlayView) => {
          const videoSlider = overlayView.videoVolumeSlider;
          const translationSlider = overlayView.translationVolumeSlider;
          if (!videoSlider || !translationSlider) {
            return;
          }

          this.videoHandler.resetVolumeLinkState(
            Number(videoSlider.value),
            Number(translationSlider.value),
          );
        });
      })
      .addEventListener("change:useLivelyVoice", () => {
        void this.videoHandler?.stopTranslate();
      })
      .addEventListener("change:subtitlesHighlightWords", (checked) => {
        this.withSubtitlesWidget((widget) => {
          widget.setHighlightWords(this.data.highlightWords ?? checked);
        });
      })
      .addEventListener("change:subtitlesSmartLayout", (checked) => {
        this.withSubtitlesWidget((widget) => {
          widget.setSmartLayout(this.data.subtitlesSmartLayout ?? checked);
        });
      })
      .addEventListener("input:subtitlesMaxLength", (value) => {
        this.withSubtitlesWidget((widget) => {
          widget.setMaxLength(this.data.subtitlesMaxLength ?? value);
        });
      })
      .addEventListener("input:subtitlesFontSize", (value) => {
        this.withSubtitlesWidget((widget) => {
          widget.setFontSize(this.data.subtitlesFontSize ?? value);
        });
      })
      .addEventListener("input:subtitlesBackgroundOpacity", (value) => {
        this.withSubtitlesWidget((widget) => {
          widget.setOpacity(this.data.subtitlesOpacity ?? value);
        });
      })
      .addEventListener("change:proxyWorkerHost", (_value) => {
        if (!this.videoHandler) {
          return;
        }

        // Proxy host changes invalidate cached requests/URLs and should stop
        // the current translation session.
        void this.videoHandler.handleProxySettingsChanged("proxyWorkerHost");
      })
      .addEventListener("select:proxyTranslationStatus", () => {
        // Switching proxy mode changes request routing. Drop stale cache and
        // stop translation so the next run starts with fresh settings.
        void this.videoHandler?.handleProxySettingsChanged(
          "proxyTranslationStatus",
        );
      })
      .addEventListener("change:useNewAudioPlayer", () => {
        this.restartAudioPlayer();
      })
      .addEventListener("change:onlyBypassMediaCSP", () => {
        this.restartAudioPlayer();
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
          const newPosition = this.data.buttonPos ?? item;
          overlayView.updateButtonLayout(
            newPosition,
            VOTButton.calcDirection(newPosition),
          );
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
        await Promise.all(
          valuesForClear.map(async (val) => await votStorage.delete(val)),
        );
        await votStorage.set("compatVersion", actualCompatVersion);

        globalThis.location.reload();
      });

    // #endregion settings view events
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
    } catch {
      // ignore best-effort restore
    }

    // Re-bind overlay visibility interactions (overlay elements were recreated).
    try {
      this.videoHandler.rebindOverlayVisibilityTargets();
    } catch {
      // ignore
    }

    // Keep settings open when language changes (better UX).
    if (settingsWasOpen) {
      try {
        this.votSettingsView?.open();
      } catch {
        // ignore
      }
    }

    await this.videoHandler.updateSubtitlesLangSelect();
    const widget = this.videoHandler.subtitlesWidget;
    if (widget) {
      widget.setPortal(this.votOverlayView.votOverlayPortal);
      widget.resetTranslationContext(true);
    }

    return this;
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
      await this.videoHandler.stopTranslation();
      return this;
    }

    if (
      this.votOverlayView.votButton.status === "error" &&
      !this.votOverlayView.votButton.loading
    ) {
      this.transformBtn("none", localizationProvider.get("translateVideo"));
    }

    if (
      this.votOverlayView.votButton.status !== "none" ||
      this.votOverlayView.votButton.loading
    ) {
      debug.log(
        "[handleTranslationBtnClick] translationBtn isn't in none state",
      );
      this.videoHandler.actionsAbortController.abort();
      await this.videoHandler.stopTranslation();
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
      // Check if this is an abort error and handle silently
      if (err instanceof Error && err.name === "AbortError") {
        this.transformBtn("none", localizationProvider.get("translateVideo"));
        return this;
      }

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
    if (!this.isInitialized()) {
      return this;
    }

    // Release child views before removing the shared portal.
    // Each view is now idempotent and releases events before DOM.
    this.votOverlayView.release();
    this.votSettingsView.release();
    this.votGlobalPortal.remove();

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

  private async tryShareBlob(blob: Blob, filename: string): Promise<boolean> {
    const nav = typeof navigator === "undefined" ? undefined : navigator;
    if (!nav?.share || typeof File === "undefined") {
      return false;
    }

    let file: File;
    try {
      file = new File([blob], filename, {
        type: blob.type || "application/octet-stream",
      });
    } catch {
      return false;
    }

    if (
      typeof nav.canShare === "function" &&
      !nav.canShare({ files: [file] })
    ) {
      return false;
    }

    try {
      await nav.share({ files: [file], title: filename });
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return true;
      }
      debug.warn("[VOT] navigator.share failed, fallback to download", err);
      return false;
    }
  }

  private async saveBlobWithMobileShare(
    blob: Blob,
    filename: string,
    preferShare: boolean,
  ): Promise<void> {
    if (preferShare) {
      const shared = await this.tryShareBlob(blob, filename);
      if (shared) {
        return;
      }
    }

    downloadBlob(blob, filename);
  }

  private restartAudioPlayer() {
    if (!this.videoHandler) {
      return;
    }
    void (async () => {
      await this.videoHandler?.stopTranslate();
      this.videoHandler?.createPlayer();
    })();
  }
}
