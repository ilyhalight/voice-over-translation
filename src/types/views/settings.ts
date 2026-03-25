import type { VideoHandler } from "../..";
import type { LangOverride } from "../../types/localization";
import type { SubtitleFontFamily } from "../../types/subtitles";
import type { Position } from "../components/votButton";
import type {
  Account,
  ResponseLanguageSubtitles,
  StorageData,
} from "../storage";
import type { TranslateService } from "../translateApis";

export type SettingsViewProps = {
  globalPortal: HTMLElement;
  data?: Partial<StorageData>;
  videoHandler?: VideoHandler;
};

export type SettingsViewEventMap = {
  "click:bugReport": [];
  "click:resetSettings": [];
  "update:account": [account: Partial<Account> | undefined];
  "change:autoTranslate": [checked: boolean];
  "change:autoSubtitles": [checked: boolean];
  "change:showVideoVolume": [checked: boolean];
  "change:audioBooster": [checked: boolean];
  "change:syncVolume": [checked: boolean];
  "change:useLivelyVoice": [checked: boolean];
  "change:subtitlesHighlightWords": [checked: boolean];
  "change:subtitlesSmartLayout": [checked: boolean];
  "select:responseLanguageSubtitles": [item: ResponseLanguageSubtitles];
  "select:subtitlesFontFamily": [item: SubtitleFontFamily];
  "change:proxyWorkerHost": [value: string];
  "change:useNewAudioPlayer": [checked: boolean];
  "change:onlyBypassMediaCSP": [checked: boolean];
  "change:showPiPButton": [checked: boolean];
  "input:subtitlesMaxLength": [value: number];
  "input:subtitlesFontSize": [value: number];
  "input:subtitlesBackgroundOpacity": [value: number];
  "input:autoHideButtonDelay": [value: number];
  "select:proxyTranslationStatus": [item: string];
  "select:translationTextService": [item: TranslateService];
  "select:buttonPosition": [item: Position];
  "select:menuLanguage": [item: LangOverride];
};
