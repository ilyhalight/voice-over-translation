import type { ResponseLang } from "@vot.js/shared/types/data";

import type { VideoHandler } from "../index";
import type { OverlayMount } from "../types/uiManager";
import type { VideoLifecycleHost } from "./videoLifecycleController";

export function createVideoLifecycleHost(
  handler: VideoHandler,
  resolveOverlayMount: (container: HTMLElement) => OverlayMount,
): VideoLifecycleHost {
  const self = () => handler;

  return {
    get video() {
      return self().video;
    },
    get site() {
      return self().site;
    },
    get container() {
      return self().container;
    },
    set container(value: HTMLElement) {
      if (self().container === value) {
        return;
      }
      self().container = value;
      self().uiManager.updateMount(resolveOverlayMount(value));
    },
    get firstPlay() {
      return self().firstPlay;
    },
    set firstPlay(value: boolean) {
      self().firstPlay = value;
    },
    stopTranslation: () => handler.stopTranslation(),
    get uiManager() {
      return self().uiManager as VideoLifecycleHost["uiManager"];
    },
    getVideoData: () => handler.getVideoData(),
    cacheManager: {
      getSubtitles: (key: string) => self().cacheManager.getSubtitles(key),
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
      return self().translateToLang;
    },
    set translateToLang(value: string) {
      self().translateToLang = value as ResponseLang;
    },
    get data() {
      return self().data ?? {};
    },
    get subtitles() {
      return self().subtitles;
    },
    set subtitles(value: any[]) {
      self().subtitles = value;
    },
    get subtitlesCacheKey() {
      return self().subtitlesCacheKey;
    },
    set subtitlesCacheKey(value: string | null) {
      self().subtitlesCacheKey = value;
    },
    get videoData() {
      return self().videoData;
    },
    set videoData(value: any) {
      const handler = self();
      const previousVideoId = handler.videoData?.videoId;
      const nextVideoId = value?.videoId;
      if (previousVideoId !== nextVideoId) {
        handler.downloadTranslation = null;
      }
      handler.videoData = value;
    },
    get actionsAbortController() {
      return self().actionsAbortController;
    },
    set actionsAbortController(value: AbortController) {
      self().actionsAbortController = value;
    },
    resetActionsAbortController: (reason?: unknown) =>
      handler.resetActionsAbortController(reason),
    translationOrchestrator: handler.translationOrchestrator,
    resetSubtitlesWidget: () => handler.resetSubtitlesWidget(),
    queueOverlayAutoHide: () => handler.overlayVisibility?.queueAutoHide(),
  };
}
