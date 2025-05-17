import type VOTClient from "@vot.js/ext";

import type { ServiceConf, VideoService } from "@vot.js/ext/types/service";
import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";
import type { SubtitlesData } from "@vot.js/shared/types/subs";
import type { VOTWorkerClient } from "@vot.js/ext";
import type { TranslationHelp } from "@vot.js/core/types/yandex";

import { CacheManager } from "./core/cacheManager";
import { UIManager } from "./ui/manager";

export type VideoData = {
  host: VideoService;
  url: string;
  downloadTitle: string;
  videoId: string;
  duration: number;
  detectedLanguage: RequestLang;
  responseLanguage: ResponseLang;
  isStream: boolean;
  translationHelp: TranslationHelp[] | null;
  title?: string;
};

export let countryCode: string | undefined;

export class VideoHandler {
  translateFromLang: string;
  translateToLang: string;

  timer: ReturnType<typeof setTimeout> | undefined;
  autoRetry: ReturnType<typeof setTimeout> | undefined;
  streamPing: ReturnType<typeof setInterval> | undefined;
  videoData?: VideoData;
  site: ServiceConf;
  votClient: VOTClient | VOTWorkerClient;
  uiManager: UIManager;

  firstPlay: boolean;
  audioContext?: AudioContext;
  downloadTranslationUrl: string | null;
  yandexSubtitles: SubtitlesData | null;
  tempOriginalVolume: number;

  longWaitingResCount: number;

  // set in methods
  video: HTMLVideoElement;
  data?: Partial<import("./types/storage").StorageData>;

  subtitlesWidget: {
    strTranslatedTokens: string;
    portal?: HTMLElement;
    releaseTooltip: () => void;
    setHighlightWords: (value: boolean) => void;
    setMaxLength: (len: number) => void;
    setFontSize: (size: number) => void;
    setOpacity: (rate: number) => void;
  };
  cacheManager: CacheManager;
  audioPlayer: import("chaimu").default;
  abortController: AbortController;
  actionsAbortController: AbortController;

  constructor(
    video: HTMLVideoElement,
    container: HTMLElement,
    site: ServiceConf,
  );

  transformBtn(status: "none" | "success" | "error", text: string): this;
  syncVolumeWrapper(fromType: "translation" | "video", newVolume: number): void;
  getVideoVolume(): number;
  setVideoVolume(volume: number): this;
  getVideoData(): Promise<VideoData>;
  changeSubtitlesLang(subs: string): Promise<this>;
  loadSubtitles(): Promise<void>;
  isMuted(): boolean;
  hasActiveSource(): boolean;
  translateFunc(
    videoId: string,
    isStream: boolean,
    requestLang: RequestLang,
    responseLang: ResponseLang,
    translationHelp: TranslationHelp[] | null,
  ): Promise<void>;
  initVOTClient(): this;
  createPlayer(): this;
  stopTranslate(): void;
  stopTranslation: () => void;
  collectReportInfo(): {
    assignees: "ilyhalight";
    template: string;
    os: string;
    "script-version": string;
    "additional-info": string;
  };
  updateSubtitlesLangSelect(): Promise<void>;
  updateTranslationErrorMsg(errorMessage: string | Error): Promise<void>;
}
