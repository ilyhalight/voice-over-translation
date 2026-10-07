import type { ResponseLang } from "@vot.js/shared/types/data";
import { createStore } from "solid-js/store";
import {
  DEFAULT_DETECT_SERVICE,
  DEFAULT_TRANSLATION_SERVICE,
} from "#modules/translateText/consts.ts";
import type {
  DetectService,
  TranslateTextService,
} from "#modules/translateText/types.ts";
import {
  DEFAULT_AUTO_HIDE_DELAY,
  DEFAULT_AUTO_VOLUME,
  DEFAULT_SMART_DUCKING_STRENGTH,
  PROXY_WORKER_HOST,
} from "../config/config";
import type { RawHotkey } from "../modules/hotkeys/types";
import type { LanguageSelectKey } from "../types/components/select";
import type { Position } from "../types/components/votButton";
import {
  AUTO_SUBTITLE_LANGUAGE_VALUE,
  type ResponseLanguageSubtitles,
  type TranslateProxyStatus,
} from "../types/storage";
import type { SubtitleFontFamily, SubtitleFormat } from "../types/subtitles";
import { isSupportGMXhr } from "../utils/gm";
import { calculatedResLang } from "../utils/localization";

export type SettingsStore = {
  // menu
  defaultVolume: number;
  responseLanguage: ResponseLang;
  useLivelyVoice: boolean;
  // translation
  autoTranslate: boolean;
  autoPauseOnTranslate: boolean;
  autoSubtitles: boolean;
  dontTranslateLanguages: LanguageSelectKey[];
  enabledAutoVolume: boolean;
  autoVolume: number;
  enabledSmartDucking: boolean;
  smartDuckingStrength: number;
  showVideoSlider: boolean;
  audioBooster: boolean;
  syncVolume: boolean;
  downloadWithName: boolean;
  sendNotifyOnComplete: boolean;
  useAudioDownload: boolean;
  translationService: TranslateTextService;
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
  translationHotkey: RawHotkey;
  subtitlesHotkey: RawHotkey;
  pipHotkey: RawHotkey;
  // subtitles
  responseLanguageSubtitles: ResponseLanguageSubtitles;
  highlightWords: boolean;
  subtitlesSmartLayout: boolean;
  subtitlesDownloadFormat: SubtitleFormat;
  subtitlesFontFamily: SubtitleFontFamily;
  subtitlesMaxLength: number;
  subtitlesFontSize: number;
  subtitlesOpacity: number;
};

export function createDefaultSettings(
  audioContextSupported = false,
): SettingsStore {
  return {
    // menu
    defaultVolume: 100,
    responseLanguage: calculatedResLang,
    useLivelyVoice: false,
    // translation
    autoTranslate: false,
    autoPauseOnTranslate: false,
    autoSubtitles: false,
    dontTranslateLanguages: [calculatedResLang],
    enabledAutoVolume: true,
    autoVolume: DEFAULT_AUTO_VOLUME,
    enabledSmartDucking: true,
    smartDuckingStrength: DEFAULT_SMART_DUCKING_STRENGTH,
    showVideoSlider: true,
    audioBooster: false,
    syncVolume: false,
    downloadWithName: isSupportGMXhr,
    sendNotifyOnComplete: false,
    // Audio download uses direct network requests (GM_fetch/GM_xmlhttpRequest).
    useAudioDownload: isSupportGMXhr,
    translationService: DEFAULT_TRANSLATION_SERVICE,
    detectService: DEFAULT_DETECT_SERVICE,
    // other
    translateAPIErrors: true,
    newAudioPlayer: audioContextSupported,
    onlyBypassMediaCSP: audioContextSupported,
    showPiPButton: false,
    autoHideButtonDelay: DEFAULT_AUTO_HIDE_DELAY,
    buttonPos: "default",
    proxyWorkerHost: PROXY_WORKER_HOST,
    translateProxyEnabled: 0,
    // hotkeys
    translationHotkey: null,
    subtitlesHotkey: null,
    pipHotkey: null,
    // subtitles
    responseLanguageSubtitles: AUTO_SUBTITLE_LANGUAGE_VALUE,
    subtitlesDownloadFormat: "srt",
    subtitlesFontFamily: "default-sans",
    highlightWords: false,
    subtitlesSmartLayout: true,
    subtitlesMaxLength: 300,
    subtitlesFontSize: 20,
    subtitlesOpacity: 20,
  };
}

const SETTINGS_KEYS = Object.keys(
  createDefaultSettings(),
) as (keyof SettingsStore)[];

export function pickSettings(
  source: Partial<SettingsStore>,
): Partial<SettingsStore> {
  return Object.fromEntries(
    SETTINGS_KEYS.map((key) => [key, source[key]]),
  ) as Partial<SettingsStore>;
}

export const [settings, setSettings] = createStore<SettingsStore>(
  createDefaultSettings(),
);
