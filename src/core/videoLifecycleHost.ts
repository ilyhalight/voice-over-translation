import type { ResponseLang } from "@vot.js/shared/types/data";
import type { OverlayMount } from "../types/uiManager";
import type { VideoHandler } from "../VideoHandler";
import type { VideoLifecycleHost } from "./videoLifecycleController";

export function createVideoLifecycleHost(
  handler: VideoHandler,
  resolveOverlayMount: (container: HTMLElement) => OverlayMount,
): VideoLifecycleHost {
  return {
    get video() {
      return handler.video;
    },
    get site() {
      return handler.site;
    },
    get container() {
      return handler.container;
    },
    set container(value: HTMLElement) {
      if (handler.container === value) {
        return;
      }
      handler.container = value;
      handler.uiManager.updateMount(resolveOverlayMount(value));
    },
    get firstPlay() {
      return handler.firstPlay;
    },
    set firstPlay(value: boolean) {
      handler.firstPlay = value;
    },
    stopTranslation: () => handler.stopTranslation(),
    get uiManager() {
      return handler.uiManager as VideoLifecycleHost["uiManager"];
    },
    getVideoData: () => handler.getVideoData(),
    cacheManager: {
      getSubtitles: (key: string) => handler.cacheManager.getSubtitles(key),
    },
    getSubtitlesCacheKey: (
      videoId: string,
      detectedLanguage: string,
      subtitleLanguage: string,
    ) =>
      handler.getSubtitlesCacheKey(videoId, detectedLanguage, subtitleLanguage),
    getPreferredSubtitlesLanguage: (
      detectedLanguage?: string,
      responseLanguage?: string,
    ) =>
      handler.getPreferredSubtitlesLanguage(detectedLanguage, responseLanguage),
    updateSubtitlesLangSelect: () => handler.updateSubtitlesLangSelect(),
    enableSubtitlesForCurrentLangPair: () =>
      handler.enableSubtitlesForCurrentLangPair(),
    setSelectMenuValues: (from: string, to: string) =>
      handler.setSelectMenuValues(from, to),
    get translateToLang() {
      return handler.translateToLang;
    },
    set translateToLang(value: string) {
      handler.translateToLang = value as ResponseLang;
    },
    get data() {
      return handler.data ?? {};
    },
    get subtitles() {
      return handler.subtitles;
    },
    set subtitles(value: any[]) {
      handler.subtitles = value;
    },
    get subtitlesCacheKey() {
      return handler.subtitlesCacheKey;
    },
    set subtitlesCacheKey(value: string | null) {
      handler.subtitlesCacheKey = value;
    },
    get videoData() {
      return handler.videoData;
    },
    set videoData(value: any) {
      const previousVideoId = handler.videoData?.videoId;
      const nextVideoId = value?.videoId;
      if (previousVideoId !== nextVideoId) {
        handler.downloadTranslation = null;
      }
      handler.videoData = value;
    },
    get actionsAbortController() {
      return handler.actionsAbortController;
    },
    set actionsAbortController(value: AbortController) {
      handler.actionsAbortController = value;
    },
    resetActionsAbortController: (reason?: unknown) =>
      handler.resetActionsAbortController(reason),
    translationOrchestrator: handler.translationOrchestrator,
    resetSubtitlesWidget: () => handler.resetSubtitlesWidget(),
    queueOverlayAutoHide: () => handler.overlayVisibility?.queueAutoHide(),
  };
}
