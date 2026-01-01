import { getVideoData } from "@vot.js/ext/utils/videoData";
import votConfig from "@vot.js/shared/config";
import { availableLangs } from "@vot.js/shared/consts";

import YoutubeHelper from "@vot.js/ext/helpers/youtube";
import { RequestLang, ResponseLang } from "@vot.js/shared/types/data";
import { VideoHandler } from "..";
import { localizationProvider } from "../localization/localizationProvider";
import { VOTLocalizedError } from "../utils/VOTLocalizedError";
import debug from "../utils/debug";
import { GM_fetch } from "../utils/gm";
import { detect } from "../utils/translateApis";
import { cleanText } from "../utils/utils";

export class VOTVideoManager {
  videoHandler: VideoHandler;

  constructor(videoHandler: VideoHandler) {
    this.videoHandler = videoHandler;
  }

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
      const language = (await detect(text)) as RequestLang;
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

  videoValidator() {
    if (!this.videoHandler.videoData || !this.videoHandler.data) {
      throw new VOTLocalizedError("VOTNoVideoIDFound");
    }

    debug.log("VideoValidator videoData: ", this.videoHandler.videoData);
    if (
      this.videoHandler.site.host === "twitch" &&
      this.videoHandler.videoData.isStream
    ) {
      // to translate streams on twitch, need to somehow go back 30(?) seconds to the player
      throw new VOTLocalizedError("VOTStreamNotAvailable");
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
   * Gets current video volume (0.0 - 1.0)
   */
  getVideoVolume() {
    let videoVolume = this.videoHandler.video?.volume;
    if (["youtube", "googledrive"].includes(this.videoHandler.site.host)) {
      videoVolume = YoutubeHelper.getVolume() ?? videoVolume;
    }
    return videoVolume;
  }

  /**
   * Sets the video volume
   */
  setVideoVolume(volume: number) {
    if (!["youtube", "googledrive"].includes(this.videoHandler.site.host)) {
      this.videoHandler.video.volume = volume;
      return this;
    }

    const videoVolume = YoutubeHelper.setVolume(volume);
    if (videoVolume) {
      return this;
    }

    this.videoHandler.video.volume = volume;
    return this;
  }

  /**
   * Checks if the video is muted
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
    if (this.videoHandler.data?.syncVolume) {
      this.videoHandler.tempOriginalVolume = Number(newSlidersVolume);
    }
    if (this.videoHandler.uiManager.votOverlayView?.isInitialized()) {
      this.videoHandler.uiManager.votOverlayView.videoVolumeSlider.value =
        newSlidersVolume;
    }
    return this;
  }

  setSelectMenuValues(from: RequestLang, to: ResponseLang) {
    if (
      !this.videoHandler.uiManager.votOverlayView?.isInitialized() ||
      !this.videoHandler.videoData
    ) {
      return this;
    }

    console.log(`[VOT] Set translation from ${from} to ${to}`);
    this.videoHandler.uiManager.votOverlayView.languagePairSelect.fromSelect.selectTitle =
      localizationProvider.get(`langs.${from}`);
    this.videoHandler.uiManager.votOverlayView.languagePairSelect.toSelect.selectTitle =
      localizationProvider.get(`langs.${to}`);
    this.videoHandler.uiManager.votOverlayView.languagePairSelect.fromSelect.setSelectedValue(
      from,
    );
    this.videoHandler.uiManager.votOverlayView.languagePairSelect.toSelect.setSelectedValue(
      to,
    );
    this.videoHandler.videoData.detectedLanguage = from;
    this.videoHandler.videoData.responseLanguage = to;
  }
}
