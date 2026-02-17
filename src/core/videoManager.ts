import YoutubeHelper from "@vot.js/ext/helpers/youtube";
import { getVideoData } from "@vot.js/ext/utils/videoData";
import votConfig from "@vot.js/shared/config";
import { availableLangs } from "@vot.js/shared/consts";
import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";

import type { VideoHandler } from "..";
import { localizationProvider } from "../localization/localizationProvider";
import debug from "../utils/debug";
import { GM_fetch } from "../utils/gm";
import { cleanText } from "../utils/text";
import { detect } from "../utils/translateApis";
import VOTLocalizedError from "../utils/VOTLocalizedError";
import {
  clampPercentInt,
  percentToVolume01,
  snapVolume01,
  volume01ToPercent,
} from "../utils/volume";
import type { VideoData as RuntimeVideoData } from "../videoHandler/shared";
import { isExternalVolumeHost } from "./hostPolicies";

const FORCED_DETECTED_LANGUAGE_BY_HOST: Record<string, RequestLang> = {
  rutube: "ru",
  "ok.ru": "ru",
  mail_ru: "ru",
  weverse: "ko",
  niconico: "ja",
  youku: "zh",
  bilibili: "zh",
  weibo: "zh",
  zdf: "de",
};

const YT_VOLUME_NOW_SELECTOR = ".ytp-volume-panel [aria-valuenow]";

type ResolvedRequestLang = Exclude<RequestLang, "auto">;

function pickFirstNonEmptyString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return undefined;
}

function normalizeToRequestLang(value: unknown): RequestLang | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toLowerCase().split(/[-_]/)[0] as RequestLang;
  return availableLangs.includes(normalized) ? normalized : undefined;
}

function isResolvedLanguage(
  value: RequestLang | undefined,
): value is ResolvedRequestLang {
  return Boolean(value && value !== "auto");
}

function buildDetectText(
  title: unknown,
  localizedTitle: unknown,
  description: unknown,
): string {
  const textTitle = pickFirstNonEmptyString(
    title,
    localizedTitle,
    document.title,
  );
  const textDescription =
    typeof description === "string" ? description : undefined;
  return cleanText(textTitle ?? "", textDescription);
}

function resolveHostDetectedLanguage(host: string): RequestLang | undefined {
  const forcedDetectedLanguage = FORCED_DETECTED_LANGUAGE_BY_HOST[host];
  if (forcedDetectedLanguage) {
    return forcedDetectedLanguage;
  }

  if (host === "vk") {
    const trackLang = document.getElementsByTagName("track")?.[0]?.srclang;
    return normalizeToRequestLang(trackLang);
  }

  return undefined;
}

function getAriaValueNowPercent(selector: string): number | null {
  const el = document.querySelector(selector);
  const rawNow = el?.getAttribute("aria-valuenow");
  const rawMax = el?.getAttribute("aria-valuemax");
  const now = rawNow == null ? Number.NaN : Number.parseFloat(rawNow);
  const max = rawMax == null ? Number.NaN : Number.parseFloat(rawMax);

  if (!Number.isFinite(now)) return null;
  if (Number.isFinite(max) && max > 0) {
    return clampPercentInt((now / max) * 100);
  }

  return clampPercentInt(now);
}

export class VOTVideoManager {
  videoHandler: VideoHandler;
  private readonly detectInFlightByVideoId = new Map<
    string,
    Promise<ResolvedRequestLang | undefined>
  >();

  constructor(videoHandler: VideoHandler) {
    this.videoHandler = videoHandler;
  }

  private async detectLanguageSingleFlight(
    videoId: string,
    text: string,
  ): Promise<ResolvedRequestLang | undefined> {
    const inFlightDetect = this.detectInFlightByVideoId.get(videoId);
    if (inFlightDetect !== undefined) {
      return await inFlightDetect;
    }

    const task: Promise<ResolvedRequestLang | undefined> = (async () => {
      debug.log(`Detecting language text: ${text}`);
      const language = normalizeToRequestLang(await detect(text));
      return isResolvedLanguage(language) ? language : undefined;
    })();

    this.detectInFlightByVideoId.set(videoId, task);
    try {
      return await task;
    } finally {
      if (this.detectInFlightByVideoId.get(videoId) === task) {
        this.detectInFlightByVideoId.delete(videoId);
      }
    }
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

    const normalizedPossibleLanguage = normalizeToRequestLang(possibleLanguage);
    // Do not reuse previous video's language when current metadata has no lang.
    // This keeps UI/auto behavior consistent on hosts where language is unknown.
    let detectedLanguage: RequestLang = normalizedPossibleLanguage ?? "auto";

    if (!normalizedPossibleLanguage) {
      const text = buildDetectText(title, localizedTitle, description);
      if (text) {
        try {
          const language = await this.detectLanguageSingleFlight(videoId, text);
          if (language) {
            detectedLanguage = language;
          }
        } catch (error) {
          // Detection is best-effort; metadata loading must keep working.
          debug.log("[VOT] detectLanguageSingleFlight failed", error);
        }
      }
    }

    const hostDetectedLanguage = resolveHostDetectedLanguage(
      this.videoHandler.site.host,
    );
    if (hostDetectedLanguage) {
      detectedLanguage = hostDetectedLanguage;
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
      description,
      downloadTitle: localizedTitle ?? title ?? videoId,
    } satisfies RuntimeVideoData;

    console.log("[VOT] Detected language:", detectedLanguage);
    return videoData;
  }

  async videoValidator() {
    const videoData = this.videoHandler.videoData;
    const data = this.videoHandler.data;
    if (!videoData || !data) {
      throw new VOTLocalizedError("VOTNoVideoIDFound");
    }

    debug.log("VideoValidator videoData: ", this.videoHandler.videoData);
    if (
      this.videoHandler.data.enabledDontTranslateLanguages &&
      this.videoHandler.data.dontTranslateLanguages?.includes(
        this.videoHandler.videoData.detectedLanguage,
      )
    ) {
      throw new VOTLocalizedError("VOTDisableFromYourLang");
    }

    if (this.videoHandler.videoData.isStream) {
      // Stream translation is disabled for all hosts.
      throw new VOTLocalizedError("VOTStreamNotAvailable");
    }

    if (this.videoHandler.videoData.duration > 14400) {
      throw new VOTLocalizedError("VOTVideoIsTooLong");
    }
    return true;
  }

  /**
   * Gets current video volume (0.0 - 1.0)
   */
  getVideoVolume() {
    const video = this.videoHandler.video;
    if (!video) return undefined;

    // For external players (YouTube / Google Drive), prefer the UI's aria values
    // when available. This avoids float drift and off-by-one issues like 100% -> 99%.
    if (isExternalVolumeHost(this.videoHandler.site.host)) {
      const ariaPercent = getAriaValueNowPercent(YT_VOLUME_NOW_SELECTOR);
      if (ariaPercent != null) {
        return percentToVolume01(ariaPercent);
      }

      const extVolume = YoutubeHelper.getVolume();
      if (typeof extVolume === "number" && Number.isFinite(extVolume)) {
        return snapVolume01(extVolume);
      }
    }

    return snapVolume01(video.volume);
  }

  /**
   * Sets the video volume
   */
  setVideoVolume(volume: number) {
    const snapped = snapVolume01(volume);

    if (!isExternalVolumeHost(this.videoHandler.site.host)) {
      this.videoHandler.video.volume = snapped;
      return this;
    }

    // YoutubeHelper.setVolume() historically returned either a boolean or a number.
    // Do NOT use a truthy check here, or setting volume to 0 (0%) will be treated
    // as a failure.
    try {
      const result = YoutubeHelper.setVolume(snapped) as unknown;
      const ok =
        (typeof result === "boolean" && result) ||
        (typeof result === "number" && Number.isFinite(result));
      if (ok) return this;
    } catch {
      // ignore - fall back to setting the HTMLMediaElement volume below.
    }

    this.videoHandler.video.volume = snapped;
    return this;
  }

  /**
   * Checks if the video is muted
   */
  isMuted() {
    return isExternalVolumeHost(this.videoHandler.site.host)
      ? YoutubeHelper.isMuted()
      : this.videoHandler.video?.muted;
  }

  /**
   * Syncs the video volume slider with the actual video volume.
   */
  syncVideoVolumeSlider() {
    const overlayView = this.videoHandler.uiManager.votOverlayView;
    if (!overlayView?.isInitialized()) return this;

    const ariaPercent = isExternalVolumeHost(this.videoHandler.site.host)
      ? getAriaValueNowPercent(YT_VOLUME_NOW_SELECTOR)
      : null;

    const volumePercent = this.isMuted()
      ? 0
      : (ariaPercent ?? volume01ToPercent(this.getVideoVolume() ?? 0));

    overlayView.videoVolumeSlider.value = volumePercent;

    // Keep syncVolume delta state aligned with programmatic slider updates.
    this.videoHandler.onVideoVolumeSliderSynced?.(volumePercent);
    return this;
  }

  setSelectMenuValues(from: RequestLang, to: ResponseLang) {
    const videoData = this.videoHandler.videoData;
    if (!videoData) {
      return this;
    }

    const normalizedFrom = normalizeToRequestLang(from) ?? "auto";
    console.log(`[VOT] Set translation from ${normalizedFrom} to ${to}`);
    videoData.detectedLanguage = normalizedFrom;
    videoData.responseLanguage = to;
    this.videoHandler.translateFromLang = normalizedFrom;
    this.videoHandler.translateToLang = to;

    const overlayView = this.videoHandler.uiManager.votOverlayView;
    if (!overlayView?.isInitialized()) {
      return this;
    }

    overlayView.languagePairSelect.fromSelect.selectTitle =
      localizationProvider.getLangLabel(normalizedFrom);
    overlayView.languagePairSelect.toSelect.selectTitle =
      localizationProvider.getLangLabel(to);
    overlayView.languagePairSelect.fromSelect.setSelectedValue(normalizedFrom);
    overlayView.languagePairSelect.toSelect.setSelectedValue(to);
  }
}
