import type { VideoHandler } from "../..";
import type { IntervalIdleChecker } from "../../utils/intervalIdleChecker";
import type { LanguageSelectKey } from "../components/select";
import type { StorageData } from "../storage";
import type { OverlayMount } from "../uiManager";

export type OverlayEventType =
  | "click:settings"
  | "click:pip"
  | "click:downloadTranslation"
  | "click:downloadSubtitles"
  | "click:translate"
  | "input:videoVolume"
  | "input:translationVolume"
  | "select:fromLanguage"
  | "select:toLanguage"
  | "select:subtitles";

export type OverlayViewProps = {
  mount: OverlayMount;
  globalPortal: HTMLElement;
  data?: Partial<StorageData>;
  videoHandler?: VideoHandler;
  intervalIdleChecker: IntervalIdleChecker;
};

export type OverlayViewEventMap = {
  "click:settings": [];
  "click:pip": [];
  "click:downloadTranslation": [];
  "click:downloadSubtitles": [];
  "click:translate": [];
  "input:videoVolume": [volume: number];
  "input:translationVolume": [volume: number];
  "select:fromLanguage": [item: LanguageSelectKey];
  "select:toLanguage": [item: LanguageSelectKey];
  "select:subtitles": [item: string];
};
