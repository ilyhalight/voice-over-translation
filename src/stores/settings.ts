import { createStore } from "solid-js/store";

import { DEFAULT_AUTO_HIDE_DELAY, PROXY_WORKER_HOST } from "../config/config";
import type { Position } from "../types/components/votButton";
import {
  AUTO_SUBTITLE_LANGUAGE_VALUE,
  type ResponseLanguageSubtitles,
  type TranslateProxyStatus,
} from "../types/storage";
import type { SubtitleFormat } from "../types/subtitles";

export type SettingsStore = {
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
