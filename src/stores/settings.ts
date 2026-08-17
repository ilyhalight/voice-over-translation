import { createStore } from "solid-js/store";

import {
  DEFAULT_AUTO_HIDE_DELAY,
  DEFAULT_AUTO_VOLUME,
  DEFAULT_DETECT_SERVICE,
  DEFAULT_TRANSLATION_SERVICE,
  PROXY_WORKER_HOST,
} from "../config/config";
import type { Position } from "../types/components/votButton";
import {
  AUTO_SUBTITLE_LANGUAGE_VALUE,
  type ResponseLanguageSubtitles,
  type TranslateProxyStatus,
} from "../types/storage";
import type { SubtitleFormat } from "../types/subtitles";
import type { DetectService, TranslateService } from "../types/translateApis";
import { isSupportGMXhr } from "../utils/gm";

export type SettingsStore = {
  // translation
  autoTranslate: boolean;
  autoSubtitles: boolean;
  enabledAutoVolume: boolean;
  autoVolume: number;
  enabledSmartDucking: boolean;
  showVideoSlider: boolean;
  audioBooster: boolean;
  syncVolume: boolean;
  downloadWithName: boolean;
  sendNotifyOnComplete: boolean;
  useAudioDownload: boolean;
  translationService: TranslateService;
  detectService: DetectService;
  // other
  translateAPIErrors: boolean;
  newAudioPlayer: boolean;
  onlyBypassMediaCSP: boolean;
  showPiPButton: boolean;
  autoHideButtonDelay: number;
  buttonPos: Position;
  proxyWorkerHost: string;
  translateProxyEnabled: TranslateProxyStatus;
  // hotkeys
  translationHotkey: string | null;
  subtitlesHotkey: string | null;
  // subtitles
  responseLanguageSubtitles: ResponseLanguageSubtitles;
  highlightWords: boolean;
  subtitlesSmartLayout: boolean;
  subtitlesDownloadFormat: SubtitleFormat;
  subtitlesMaxLength: number;
  subtitlesFontSize: number;
  subtitlesOpacity: number;
};

function createInitialState(): SettingsStore {
  return {
    // translation
    autoTranslate: false,
    autoSubtitles: false,
    enabledAutoVolume: true,
    autoVolume: DEFAULT_AUTO_VOLUME,
    enabledSmartDucking: true,
    showVideoSlider: true,
    audioBooster: false,
    syncVolume: false,
    downloadWithName: isSupportGMXhr,
    sendNotifyOnComplete: false,
    useAudioDownload: isSupportGMXhr,
    translationService: DEFAULT_TRANSLATION_SERVICE,
    detectService: DEFAULT_DETECT_SERVICE,
    // other
    translateAPIErrors: true,
    // TODO: set default by audioContextSupported?
    newAudioPlayer: false,
    onlyBypassMediaCSP: false,
    showPiPButton: false,
    autoHideButtonDelay: DEFAULT_AUTO_HIDE_DELAY,
    buttonPos: "default",
    proxyWorkerHost: PROXY_WORKER_HOST,
    translateProxyEnabled: 0,
    // hotkeys
    translationHotkey: null,
    subtitlesHotkey: null,
    // subtitles
    responseLanguageSubtitles: AUTO_SUBTITLE_LANGUAGE_VALUE,
    subtitlesDownloadFormat: "srt",
    highlightWords: false,
    subtitlesSmartLayout: true,
    subtitlesMaxLength: 300,
    subtitlesFontSize: 20,
    subtitlesOpacity: 20,
  };
}

export const [settings, setSettings] = createStore<SettingsStore>(
  createInitialState(),
);

export function resetSettings() {
  setSettings(createInitialState());
}
