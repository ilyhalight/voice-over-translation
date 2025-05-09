import type { SubtitleFormat } from "@vot.js/shared/types/subs";
import type { LanguageSelectKey } from "./components/select";
import type { DetectService, TranslateService } from "./translateApis";
import type { Position } from "./components/votButton";
import type { ResponseLang } from "@vot.js/shared/types/data";

export type LocaleStorageKey =
  | "localePhrases"
  | "localeLang"
  | "localeHash"
  | "localeUpdatedAt"
  | "localeLangOverride";

export const storageKeys = [
  "autoTranslate",
  "dontTranslateLanguages",
  "enabledDontTranslateLanguages",
  "enabledAutoVolume",
  "autoVolume",
  "buttonPos",
  "showVideoSlider",
  "syncVolume",
  "downloadWithName",
  "sendNotifyOnComplete",
  "subtitlesMaxLength",
  "highlightWords",
  "subtitlesFontSize",
  "subtitlesOpacity",
  "subtitlesDownloadFormat",
  "responseLanguage",
  "defaultVolume",
  "onlyBypassMediaCSP",
  "newAudioPlayer",
  "showPiPButton",
  "translateAPIErrors",
  "translationService",
  "detectService",
  "translationHotkey",
  "m3u8ProxyHost",
  "proxyWorkerHost",
  "translateProxyEnabled",
  "translateProxyEnabledDefault",
  "audioBooster",
  "useNewModel",
  "autoHideButtonDelay",
  "useAudioDownload",
  "localePhrases",
  "localeLang",
  "localeHash",
  "localeUpdatedAt",
  "localeLangOverride",
] as const;

export type TranslateProxyStatus = 0 | 1 | 2;

// TODO: remove comments after add config converter
export type StorageData = {
  autoTranslate: boolean;
  // dontTranslateLanguage: string[]; -> dontTranslateLanguages
  dontTranslateLanguages: LanguageSelectKey[];
  // dontTranslateYourLang: boolean; -> enabledDontTranslateLanguages
  enabledDontTranslateLanguages: boolean;
  // autoSetVolumeYandexStyle: boolean; -> enabledAutoVolume
  enabledAutoVolume: boolean;
  // old 0.1 - 1.0 -> now 0 - 100
  autoVolume: number;
  buttonPos: Position;
  showVideoSlider: boolean;
  syncVolume: boolean;
  downloadWithName: boolean;
  sendNotifyOnComplete: boolean;
  subtitlesMaxLength: number;
  highlightWords: boolean;
  subtitlesFontSize: number;
  subtitlesOpacity: number;
  subtitlesDownloadFormat: SubtitleFormat;
  responseLanguage: ResponseLang;
  defaultVolume: number;
  onlyBypassMediaCSP: boolean;
  newAudioPlayer: boolean;
  showPiPButton: boolean;
  translateAPIErrors: boolean;
  translationService: TranslateService;
  detectService: DetectService;
  // hotkeyButton: null | string; -> translationHotkey
  translationHotkey: null | string;
  m3u8ProxyHost: string;
  proxyWorkerHost: string;
  translateProxyEnabled: TranslateProxyStatus;
  translateProxyEnabledDefault: boolean;
  audioBooster: boolean;
  useNewModel: boolean;
  autoHideButtonDelay: number;
  useAudioDownload: boolean;
  localePhrases: string;
  localeLang: string;
  localeHash: string;
  localeUpdatedAt: number;
  localeLangOverride: string;
};

// intentionally breaking type if StorageData has an extra keys
export type StorageKey = keyof StorageData extends (typeof storageKeys)[number]
  ? (typeof storageKeys)[number]
  : never;
