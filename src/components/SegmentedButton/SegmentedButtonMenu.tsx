import { createSignal, type JSX, mergeProps, Show } from "solid-js";

import "./SegmentedButtonMenu.scss";
import { availableLangs, availableTTS } from "@vot.js/shared/consts";
import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";
import { effect } from "solid-js/web";
import { localizationProvider } from "../../localization/localizationProvider";
import { setSettings, settings } from "../../stores/settings";
import type { Status } from "../../types/components/votButton";
import { clamp } from "../../utils/utils";
import { IconButton } from "../Button/IconButton";
import { ProgressIconButton } from "../Button/ProgressIconButton";
import {
  genSelectOptionsByLangs,
  Select,
  type SelectControls,
  type SelectOption,
} from "../Control/Select";
import { Slider } from "../Control/Slider";
import { SliderLabel } from "../Control/SliderLabel";
import { SliderWrapper } from "../Control/SliderWrapper";
import { ArrowRightIcon } from "../Icons/ArrowRightIcon";
import { DownloadIcon } from "../Icons/DownloadIcon";
import { GearIcon } from "../Icons/GearIcon";
import { SubtitlesIcon } from "../Icons/SubtitlesIcon";
import { Menu } from "../Utils/Menu";

export type MenuHeaderContentControls = {
  setTranslationProgress: (progress: number) => void;
  setShowTranslationProgress: (show: boolean) => void;
};

export type MenuHeaderContentProps = {
  showDownloadTranslation?: boolean;
  showDownloadSubtitles?: boolean;
  controlsRef?: (controls: MenuHeaderContentControls) => void;
  onDownloadTranslationClick?: () => void | Promise<void>;
  onDownloadSubtitlesClick?: () => void | Promise<void>;
};
export function MenuHeaderContent(props: MenuHeaderContentProps): JSX.Element {
  const finalProps = mergeProps(
    {
      showDownloadTranslation: false,
      showDownloadSubtitles: false,
    } as Partial<MenuHeaderContentProps>,
    props,
  );

  const [translationProgress, setTranslationProgress] = createSignal(0);
  const [showTranslationProgress, setShowTranslationProgress] =
    createSignal(false);

  finalProps.controlsRef?.({
    setTranslationProgress,
    setShowTranslationProgress,
  });

  return (
    <vot-block class="vot-segmented-button__menu-header">
      <Show when={finalProps.showDownloadTranslation}>
        <ProgressIconButton
          ariaLabel={localizationProvider.get("VOTDownloadTranslation")}
          progress={translationProgress()}
          showProgress={showTranslationProgress()}
          onClick={finalProps.onDownloadTranslationClick}
        >
          <DownloadIcon />
        </ProgressIconButton>
      </Show>
      <Show when={finalProps.showDownloadSubtitles}>
        <IconButton
          ariaLabel={localizationProvider.get("VOTDownloadSubtitles")}
          onClick={finalProps.onDownloadSubtitlesClick}
        >
          <SubtitlesIcon />
        </IconButton>
      </Show>
      <IconButton ariaLabel={localizationProvider.get("VOTSettings")}>
        <GearIcon />
      </IconButton>
    </vot-block>
  );
}

export type LanguagePairSelectControls = {
  closeFloatingUI: () => void;
};

export type LanguagePairSelectProps = {
  detectedLanguage: RequestLang;
  responseLanguage: ResponseLang;
  onDetectedLanguageSelect?: (lang: RequestLang) => void | Promise<void>;
  onResponseLanguageSelect?: (lang: ResponseLang) => void | Promise<void>;
  controlsRef?: (controls: LanguagePairSelectControls) => void;
};
export function LanguagePairSelect(
  props: LanguagePairSelectProps,
): JSX.Element {
  const fromLangsOptions = genSelectOptionsByLangs(availableLangs);
  const toLangsOptions = genSelectOptionsByLangs(availableTTS);

  let videoControlsRef: SelectControls | undefined;
  let translationControlsRef: SelectControls | undefined;

  props.controlsRef?.({
    closeFloatingUI: () => {
      videoControlsRef?.close();
      translationControlsRef?.close();
    },
  });

  return (
    <vot-block class="vot-langpair-select">
      {/* TODO: Open as dialog */}
      <Select
        title={localizationProvider.get("videoLanguage")}
        options={fromLangsOptions}
        selectedValue={props.detectedLanguage}
        controlsRef={(controls) => (videoControlsRef = controls)}
        onSelect={async (option) =>
          await props.onDetectedLanguageSelect?.(option.value as RequestLang)
        }
      />
      <vot-block class="vot-langpair-select__icon">
        <ArrowRightIcon />
      </vot-block>
      <Select
        title={localizationProvider.get("translationLanguage")}
        options={toLangsOptions}
        selectedValue={props.responseLanguage}
        controlsRef={(controls) => (translationControlsRef = controls)}
        onSelect={async (option) =>
          await props.onResponseLanguageSelect?.(option.value as ResponseLang)
        }
      />
    </vot-block>
  );
}

const MAX_AUDIO_BOOSTER_VOLUME = 900;

export type SegmentedButtonMenuControls = {
  closeFloatingUI: () => void;
  setVideoVolume: (volume: number) => void;
  getVideoVolume: () => number;
  setTranslationVolume: (volume: number) => void;
  getTranslationVolume: () => number;
  getMaxTranslationVolume: () => number;
} & Pick<
  MenuHeaderContentControls,
  "setTranslationProgress" | "setShowTranslationProgress"
>;
export type SegmentedButtonMenuProps = {
  videoVolume?: number;
  buttonStatus?: Status;
  showTranslationVolume?: boolean;
  translationVolume?: number;
  subtitlesOptions?: SelectOption[];
  selectedSubtitles?: string;
  subtitlesLoading?: boolean;
  controlsRef?: (controls: SegmentedButtonMenuControls) => void;
  onVideoVolumeInput?: (volume: number) => void;
  onTranslationVolumeInput?: (volume: number) => void;
  onSubtitlesOpen?: () => void;
  onSubtitlesSelect?: (value: string) => void;
} & Partial<LanguagePairSelectProps> &
  Partial<MenuHeaderContentProps>;
export function SegmentedButtonMenu(
  props: SegmentedButtonMenuProps,
): JSX.Element {
  const finalProps = mergeProps(
    {
      detectedLanguage: "en",
      responseLanguage: "ru",
      videoVolume: 100,
      showTranslationVolume: false,
      translationVolume: 100,
      subtitlesOptions: [
        {
          label: localizationProvider.get("VOTSubtitlesDisabled"),
          value: "disabled",
        },
      ],
      selectedSubtitles: "disabled",
      subtitlesLoading: false,
    } as Partial<SegmentedButtonMenuProps>,
    props,
  );

  let menuHeaderContentControls: MenuHeaderContentControls | undefined;
  let languagePairSelectControls: LanguagePairSelectControls | undefined;
  let subtitlesSelectControls: SelectControls | undefined;

  const [videoVolume, setVideoVolume] = createSignal(finalProps.videoVolume);
  const [translationVolumeState, setTranslationVolume] = createSignal(
    finalProps.translationVolume,
  );

  const maxTranslationVolume = () =>
    settings.audioBooster && !settings.syncVolume
      ? MAX_AUDIO_BOOSTER_VOLUME
      : 100;
  const translationVolume = () =>
    clamp(translationVolumeState(), 0, maxTranslationVolume());

  const videoVolumeText = () => `${videoVolume()}%`;
  const translationVolumeText = () => `${translationVolume()}%`;

  effect(() => {
    setVideoVolume(finalProps.videoVolume);
  });
  effect(() => {
    setTranslationVolume(finalProps.translationVolume);
  });

  finalProps.controlsRef?.({
    closeFloatingUI: () => {
      languagePairSelectControls?.closeFloatingUI();
      subtitlesSelectControls?.close();
    },
    setVideoVolume,
    getVideoVolume: videoVolume,
    setTranslationVolume,
    getTranslationVolume: translationVolume,
    getMaxTranslationVolume: maxTranslationVolume,
    setTranslationProgress: (progress) => {
      menuHeaderContentControls?.setTranslationProgress(progress);
    },
    setShowTranslationProgress: (show) =>
      menuHeaderContentControls?.setShowTranslationProgress(show),
  });

  return (
    <Menu
      title={localizationProvider.get("VOTSettings")}
      headerChildren={
        <MenuHeaderContent
          controlsRef={(controls) => (menuHeaderContentControls = controls)}
          showDownloadTranslation={finalProps.showDownloadTranslation}
          showDownloadSubtitles={finalProps.showDownloadSubtitles}
          onDownloadTranslationClick={finalProps.onDownloadTranslationClick}
          onDownloadSubtitlesClick={finalProps.onDownloadSubtitlesClick}
        />
      }
    >
      <LanguagePairSelect
        controlsRef={(controls) => (languagePairSelectControls = controls)}
        detectedLanguage={finalProps.detectedLanguage}
        onDetectedLanguageSelect={finalProps.onDetectedLanguageSelect}
        responseLanguage={settings.responseLanguage}
        onResponseLanguageSelect={(lang) => {
          const prevResponseLanguage = settings.responseLanguage;
          setSettings("responseLanguage", lang);
          if (
            Array.isArray(settings.dontTranslateLanguages) &&
            settings.dontTranslateLanguages.length === 1 &&
            prevResponseLanguage !== lang &&
            settings.dontTranslateLanguages[0] === prevResponseLanguage
          ) {
            setSettings("dontTranslateLanguages", [lang]);
          }

          finalProps.onResponseLanguageSelect?.(lang);
        }}
      />
      <Select
        title={localizationProvider.get("VOTSubtitles")}
        options={finalProps.subtitlesOptions}
        selectedValue={finalProps.selectedSubtitles}
        search
        loading={finalProps.subtitlesLoading}
        controlsRef={(controls) => (subtitlesSelectControls = controls)}
        onOpen={finalProps.onSubtitlesOpen}
        onSelect={(option) =>
          finalProps.onSubtitlesSelect?.(String(option.value))
        }
      >
        {localizationProvider.get("VOTSubtitles")}
      </Select>
      <Show
        when={finalProps.buttonStatus === "success" && settings.showVideoSlider}
      >
        <SliderWrapper>
          <SliderLabel value={videoVolumeText()}>
            {localizationProvider.get("VOTVolume")}
          </SliderLabel>
          <Slider
            value={videoVolume()}
            onInput={(value) => {
              setVideoVolume(value);
              finalProps.onVideoVolumeInput?.(value);
            }}
          />
        </SliderWrapper>
      </Show>
      <Show
        when={
          finalProps.buttonStatus === "success" &&
          finalProps.showTranslationVolume
        }
      >
        <SliderWrapper>
          <SliderLabel value={translationVolumeText()}>
            {localizationProvider.get("VOTVolumeTranslation")}
          </SliderLabel>
          <Slider
            max={maxTranslationVolume()}
            value={translationVolume()}
            onInput={(value) => {
              setTranslationVolume(value);
              setSettings("defaultVolume", value);
              finalProps.onTranslationVolumeInput?.(value);
            }}
          />
        </SliderWrapper>
      </Show>
    </Menu>
  );
}
