import type { ResponseLang } from "@vot.js/shared/types/data";
import type { SubtitleFormat } from "@vot.js/shared/types/subs";
import type { LanguageSelectKey } from "./components/select";
import type { Position } from "./components/votButton";
import type { DetectService, TranslateService } from "./translateApis";

export type LocaleStorageKey =
  | "localePhrases"
  | "localeLang"
  | "localeHash"
  | "localeUpdatedAt"
  | "localeLangOverride";

export type ConvertCategory = "numToBool" | "number" | "array" | "string";
export type ConvertDataItem = [oldName: string, newName?: string];
export type ConvertData = Record<ConvertCategory, ConvertDataItem[]>;

export const storageKeys = [
  "autoTranslate",
  "autoSubtitles",
  "dontTranslateLanguages",
  "enabledDontTranslateLanguages",
  "enabledAutoVolume",
  "enabledSmartDucking",
  "autoVolume",
  "buttonPos",
  "showVideoSlider",
  "syncVolume",
  "downloadWithName",
  "sendNotifyOnComplete",
  "subtitlesMaxLength",
  "subtitlesSmartLayout",
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
  "subtitlesHotkey",
  "m3u8ProxyHost",
  "proxyWorkerHost",
  "translateProxyEnabled",
  "translateProxyEnabledDefault",
  "audioBooster",
  "useLivelyVoice",
  "autoHideButtonDelay",
  "useAudioDownload",
  "compatVersion",
  "localePhrases",
  "localeLang",
  "localeHash",
  "localeUpdatedAt",
  "localeLangOverride",
  "account",
] as const;

export type TranslateProxyStatus = 0 | 1 | 2;
export type CompatibilityVersion = "" | "2025-05-09";

export type Account = {
  username: string | undefined;
  avatarId: string | undefined;
  expires: number;
  token: string;
};

export type StorageData = {
  autoTranslate: boolean;
  autoSubtitles: boolean;
  dontTranslateLanguages: LanguageSelectKey[];
  enabledDontTranslateLanguages: boolean;
  enabledAutoVolume: boolean;
  /**
   * Smart Auto-Volume ducking: only lower original video volume while translated
   * audio is actually audible.
   *
   * When disabled, Auto-Volume behaves like a classic constant ducking.
   */
  enabledSmartDucking: boolean;
  autoVolume: number;
  buttonPos: Position;
  showVideoSlider: boolean;
  syncVolume: boolean;
  downloadWithName: boolean;
  sendNotifyOnComplete: boolean;
  subtitlesMaxLength: number;
  /**
   * Automatically adapts subtitle typography/line length to the current player size.
   * Enabled by default for new users.
   */
  subtitlesSmartLayout: boolean;
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
  translationHotkey: null | string;
  subtitlesHotkey: null | string;
  m3u8ProxyHost: string;
  proxyWorkerHost: string;
  translateProxyEnabled: TranslateProxyStatus;
  translateProxyEnabledDefault: boolean;
  audioBooster: boolean;
  useLivelyVoice: boolean;
  autoHideButtonDelay: number;
  useAudioDownload: boolean;
  compatVersion: CompatibilityVersion;
  // for have empty object if info isn't provided
  account: Partial<Account>;
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
