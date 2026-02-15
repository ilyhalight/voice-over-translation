import type {
  VideoData as CoreVideoData,
  VideoDataSubtitle,
} from "@vot.js/core/types/client";
import YoutubeHelper from "@vot.js/ext/helpers/youtube";
import type { VideoService } from "@vot.js/ext/types/service";
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

type RawVideoData = CoreVideoData<VideoService>;

type SubtitleLike = Pick<
  VideoDataSubtitle,
  "language" | "translatedFromLanguage"
>;

type ResolvedRequestLang = Exclude<RequestLang, "auto">;

type DetectSourceVideoData = Pick<
  RuntimeVideoData,
  | "videoId"
  | "detectedLanguage"
  | "responseLanguage"
  | "title"
  | "localizedTitle"
  | "description"
>;

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
): value is Exclude<RequestLang, "auto"> {
  return Boolean(value && value !== "auto");
}

function inferLanguageFromSubtitles(
  subtitles: unknown,
): RequestLang | undefined {
  if (!Array.isArray(subtitles) || subtitles.length === 0) {
    return undefined;
  }

  const tracks = subtitles as SubtitleLike[];

  // Prefer explicit source-language hints from translated tracks.
  for (const track of tracks) {
    const translatedFrom = normalizeToRequestLang(
      track?.translatedFromLanguage,
    );
    if (isResolvedLanguage(translatedFrom)) {
      return translatedFrom;
    }
  }

  // Then prefer non-translated original subtitle tracks.
  for (const track of tracks) {
    if (track?.translatedFromLanguage) continue;
    const language = normalizeToRequestLang(track?.language);
    if (isResolvedLanguage(language)) {
      return language;
    }
  }

  // Last subtitles fallback: any concrete language track.
  for (const track of tracks) {
    const language = normalizeToRequestLang(track?.language);
    if (isResolvedLanguage(language)) {
      return language;
    }
  }

  return undefined;
}

function pickResolvedLanguage(
  ...values: Array<RequestLang | undefined>
): Exclude<RequestLang, "auto"> | undefined {
  for (const value of values) {
    if (isResolvedLanguage(value)) {
      return value;
    }
  }

  return undefined;
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
    const normalizedTrackLang = normalizeToRequestLang(trackLang);
    if (isResolvedLanguage(normalizedTrackLang)) {
      return normalizedTrackLang;
    }
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

function extractYouTubeVideoId(url: URL): string | undefined {
  if (url.pathname === "/attribution_link") {
    const encoded = url.searchParams.get("u");
    if (encoded) {
      try {
        const decoded = decodeURIComponent(encoded);
        const nestedUrl = decoded.startsWith("http")
          ? new URL(decoded)
          : new URL(decoded, url.origin);
        return extractYouTubeVideoId(nestedUrl);
      } catch {
        // ignore malformed nested links
      }
    }
  }

  if (url.hostname === "youtu.be") {
    const id = url.pathname.replace(/^\/+/, "").split("/")[0];
    return id || undefined;
  }

  const vParam = url.searchParams.get("v");
  if (vParam) {
    return vParam;
  }

  return (
    /\/(?:shorts|embed|live|v|e)\/([^/?#]+)/.exec(url.pathname)?.[1] ??
    undefined
  );
}

function selectDetectTextSource(
  current: RuntimeVideoData | undefined,
  fallback: DetectSourceVideoData,
) {
  if (current && current.videoId === fallback.videoId) {
    return {
      title: current.title,
      localizedTitle: current.localizedTitle,
      description: current.description,
    };
  }

  return {
    title: fallback.title,
    localizedTitle: fallback.localizedTitle,
    description: fallback.description,
  };
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
      return pickResolvedLanguage(language);
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

  private scheduleLanguageDetection(videoData: DetectSourceVideoData): void {
    if (videoData.detectedLanguage !== "auto") {
      return;
    }

    const source = selectDetectTextSource(
      this.videoHandler.videoData,
      videoData,
    );
    const text = buildDetectText(
      source.title,
      source.localizedTitle,
      source.description,
    );
    if (!text) {
      return;
    }

    void this.detectLanguageSingleFlight(videoData.videoId, text)
      .then((detectedLanguage) => {
        if (!detectedLanguage) {
          return;
        }
        const latestVideoData = this.videoHandler.videoData;
        if (!latestVideoData || latestVideoData.videoId !== videoData.videoId) {
          return;
        }
        if (latestVideoData.detectedLanguage !== "auto") {
          return;
        }

        this.setSelectMenuValues(
          detectedLanguage,
          latestVideoData.responseLanguage,
        );
        debug.log(
          `[VOT] Async detected language resolved: ${detectedLanguage} for video ${videoData.videoId}`,
        );
      })
      .catch((error) => {
        debug.log("[VOT] Async detect failed", error);
      });
  }

  private getYouTubeVideoDataFast(): RawVideoData {
    const playerData = YoutubeHelper.getPlayerData();
    const playerResponse = YoutubeHelper.getPlayerResponse();
    const videoId =
      pickFirstNonEmptyString(playerData?.video_id) ??
      extractYouTubeVideoId(new URL(globalThis.location.href));

    if (!videoId) {
      throw new Error("[VOT] Failed to resolve YouTube videoId");
    }

    const { title: localizedTitle } = playerData ?? {};
    const {
      shortDescription: description,
      isLive: isStream,
      title,
    } = playerResponse?.videoDetails ?? {};

    const subtitles = YoutubeHelper.getSubtitles(localizationProvider.lang);
    const duration = YoutubeHelper.getPlayer()?.getDuration?.() ?? undefined;
    const detectedLanguage = normalizeToRequestLang(
      YoutubeHelper.getLanguage(),
    );

    return {
      duration,
      url: `${this.videoHandler.site.url}${videoId}`,
      videoId,
      host: this.videoHandler.site.host,
      title,
      localizedTitle,
      description,
      detectedLanguage,
      subtitles,
      isStream: Boolean(isStream),
    };
  }

  async getVideoData() {
    let rawVideoData: RawVideoData;
    if (this.videoHandler.site.host === "youtube") {
      rawVideoData = this.getYouTubeVideoDataFast();
    } else {
      rawVideoData = await getVideoData(this.videoHandler.site, {
        fetchFn: GM_fetch,
        video: this.videoHandler.video,
        language: localizationProvider.lang,
      });
    }

    const {
      duration,
      url,
      videoId,
      host,
      title,
      translationHelp,
      localizedTitle,
      description,
      detectedLanguage: possibleLanguage,
      subtitles,
      isStream = false,
    } = rawVideoData;

    const possibleRequestLanguage = normalizeToRequestLang(possibleLanguage);
    const selectedRequestLanguage = normalizeToRequestLang(
      this.videoHandler.translateFromLang,
    );
    const shouldUseLanguageFallbacks =
      this.videoHandler.site.host !== "youtube" ||
      isResolvedLanguage(possibleRequestLanguage);

    let detectedLanguage = pickResolvedLanguage(
      possibleRequestLanguage,
      shouldUseLanguageFallbacks ? selectedRequestLanguage : undefined,
      shouldUseLanguageFallbacks
        ? inferLanguageFromSubtitles(subtitles)
        : undefined,
    );

    detectedLanguage = pickResolvedLanguage(
      resolveHostDetectedLanguage(this.videoHandler.site.host),
      detectedLanguage,
    );

    const normalizedDetectedLanguage: RequestLang = detectedLanguage ?? "auto";

    const videoData = {
      translationHelp: translationHelp ?? null,
      isStream,
      duration:
        duration ||
        this.videoHandler.video?.duration ||
        votConfig.defaultDuration, // if 0, we get 400 error
      videoId,
      url,
      host,
      detectedLanguage: normalizedDetectedLanguage,
      responseLanguage: this.videoHandler.translateToLang,
      subtitles,
      title,
      localizedTitle,
      description,
      downloadTitle: localizedTitle ?? title ?? videoId,
    } satisfies RuntimeVideoData;
    console.log("[VOT] Detected language:", normalizedDetectedLanguage);

    this.scheduleLanguageDetection(videoData);
    return videoData;
  }

  videoValidator() {
    if (!this.videoHandler.videoData || !this.videoHandler.data) {
      throw new VOTLocalizedError("VOTNoVideoIDFound");
    }

    console.log("[VOT] Video Data: ", this.videoHandler.videoData);
    if (
      this.videoHandler.data.enabledDontTranslateLanguages &&
      this.videoHandler.data.dontTranslateLanguages?.includes(
        this.videoHandler.videoData.detectedLanguage,
      )
    ) {
      throw new VOTLocalizedError("VOTDisableFromYourLang");
    }
    if (this.videoHandler.videoData.isStream) {
      // Stream translation (HLS) is currently disabled.
      // to translate streams on twitch, need to somehow go back 30(?) seconds to the player
      throw new VOTLocalizedError("VOTStreamNotAvailable");
    }

    if (
      // !this.videoHandler.videoData.isStream &&
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
    if (
      !this.videoHandler.uiManager.votOverlayView?.isInitialized() ||
      !this.videoHandler.videoData
    ) {
      return this;
    }

    const normalizedFrom = normalizeToRequestLang(from) ?? "auto";
    console.log(`[VOT] Set translation from ${normalizedFrom} to ${to}`);
    this.videoHandler.uiManager.votOverlayView.languagePairSelect.fromSelect.selectTitle =
      localizationProvider.getLangLabel(normalizedFrom);
    this.videoHandler.uiManager.votOverlayView.languagePairSelect.toSelect.selectTitle =
      localizationProvider.getLangLabel(to);
    this.videoHandler.uiManager.votOverlayView.languagePairSelect.fromSelect.setSelectedValue(
      normalizedFrom,
    );
    this.videoHandler.uiManager.votOverlayView.languagePairSelect.toSelect.setSelectedValue(
      to,
    );
    this.videoHandler.videoData.detectedLanguage = normalizedFrom;
    this.videoHandler.videoData.responseLanguage = to;
  }
}
