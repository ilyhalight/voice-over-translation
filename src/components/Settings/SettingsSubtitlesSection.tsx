import type { JSX } from "solid-js";
import { localizationProvider } from "../../localization/localizationProvider";
import { setSettings, settings } from "../../stores/settings";
import type { LanguageSelectKey } from "../../types/components/select";
import {
  AUTO_SUBTITLE_LANGUAGE_VALUE,
  ORIGINAL_SUBTITLE_LANGUAGE_VALUE,
  type ResponseLanguageSubtitles,
} from "../../types/storage";
import { type SubtitleFormat, subtitleFormats } from "../../types/subtitles";
import { Select, type SelectOption } from "../Control/Select";
import { Slider } from "../Control/Slider";
import { SliderLabel } from "../Control/SliderLabel";
import { SliderWrapper } from "../Control/SliderWrapper";
import { Switch } from "../Control/Switch";
import { SettingsSection } from "./SettingsSection";

export type SettingsSubtitlesSectionProps = {
  ref?: (element: HTMLElement) => void;
  onResponseLanguageSubtitlesSelect?: (option: SelectOption) => void;
  onSubtitlesDownloadFormatSelect?: (option: SelectOption) => void;
  onHighlightWordsChange?: (checked: boolean) => void;
  onSubtitlesSmartLayoutChange?: (checked: boolean) => void;
  onSubtitlesMaxLengthInput?: (value: number) => void;
  onSubtitlesFontSizeInput?: (value: number) => void;
  onSubtitlesOpacityInput?: (value: number) => void;
};

const LANG_PREFIX = "langs.";

type RealLanguageSelectKey = Exclude<LanguageSelectKey, "auto">;
type RealLangKey = `${typeof LANG_PREFIX}${Exclude<LanguageSelectKey, "auto">}`;

function getAvailableSubtitleLanguages(): RealLanguageSelectKey[] {
  return Object.keys(localizationProvider.defaultLocale)
    .filter(
      (key): key is RealLangKey =>
        key.startsWith(LANG_PREFIX) && key !== `${LANG_PREFIX}auto`,
    )
    .map((key) => key.slice(LANG_PREFIX.length) as RealLanguageSelectKey)
    .sort((left, right) =>
      localizationProvider
        .getLangLabel(left)
        .localeCompare(localizationProvider.getLangLabel(right)),
    );
}

function buildSubtitleLanguageSettingOptions(): SelectOption[] {
  return [
    {
      label: localizationProvider.getLangLabel(AUTO_SUBTITLE_LANGUAGE_VALUE),
      value: AUTO_SUBTITLE_LANGUAGE_VALUE,
    },
    {
      label: localizationProvider.get("VOTOriginalVideoLanguage"),
      value: ORIGINAL_SUBTITLE_LANGUAGE_VALUE,
    },
    ...getAvailableSubtitleLanguages().map<SelectOption>((language) => ({
      label: localizationProvider.getLangLabel(language),
      value: language,
    })),
  ];
}

export function SettingsSubtitlesSection(
  props: SettingsSubtitlesSectionProps,
): JSX.Element {
  const subtitleLanguageOptions = buildSubtitleLanguageSettingOptions();
  const subtitlesDownloadFormatOptions: SelectOption[] =
    subtitleFormats.map<SelectOption>((format) => ({
      label: format.toUpperCase(),
      value: format,
    }));

  return (
    <SettingsSection
      ref={props.ref}
      title={localizationProvider.get("subtitlesSettings")}
    >
      <Select
        title={localizationProvider.get("VOTDefaultSubtitlesLanguage")}
        options={subtitleLanguageOptions}
        selectedValue={settings.responseLanguageSubtitles}
        onSelect={(option) => {
          setSettings(
            "responseLanguageSubtitles",
            option.value as ResponseLanguageSubtitles,
          );
          props.onResponseLanguageSubtitlesSelect?.(option);
        }}
      >
        {localizationProvider.get("VOTDefaultSubtitlesLanguage")}
      </Select>
      <Select
        title={localizationProvider.get("VOTSubtitlesDownloadFormat")}
        options={subtitlesDownloadFormatOptions}
        selectedValue={settings.subtitlesDownloadFormat}
        onSelect={(option) => {
          setSettings(
            "subtitlesDownloadFormat",
            option.value as SubtitleFormat,
          );
          props.onSubtitlesDownloadFormatSelect?.(option);
        }}
      >
        {localizationProvider.get("VOTSubtitlesDownloadFormat")}
      </Select>
      <Switch
        heading={localizationProvider.get("VOTHighlightWords")}
        checked={settings.highlightWords}
        onChange={(checked) => {
          setSettings("highlightWords", checked);
          props.onHighlightWordsChange?.(checked);
        }}
      />
      <Switch
        heading={localizationProvider.get("subtitlesSmartLayout")}
        checked={settings.subtitlesSmartLayout}
        onChange={(checked) => {
          setSettings("subtitlesSmartLayout", checked);
          props.onSubtitlesSmartLayoutChange?.(checked);
        }}
      />
      <SliderWrapper>
        <SliderLabel value={settings.subtitlesMaxLength.toString()}>
          {localizationProvider.get("VOTSubtitlesMaxLength")}
        </SliderLabel>
        <Slider
          min={50}
          max={300}
          value={settings.subtitlesMaxLength}
          onInput={(value) => {
            if (settings.subtitlesSmartLayout) {
              setSettings("subtitlesSmartLayout", false);
              props.onSubtitlesSmartLayoutChange?.(false);
            }

            setSettings("subtitlesMaxLength", value);
            props.onSubtitlesMaxLengthInput?.(value);
          }}
        />
      </SliderWrapper>
      <SliderWrapper>
        <SliderLabel value={`${settings.subtitlesFontSize}px`}>
          {localizationProvider.get("VOTSubtitlesFontSize")}
        </SliderLabel>
        <Slider
          min={8}
          max={50}
          value={settings.subtitlesFontSize}
          onInput={(value) => {
            if (settings.subtitlesSmartLayout) {
              setSettings("subtitlesSmartLayout", false);
              props.onSubtitlesSmartLayoutChange?.(false);
            }

            setSettings("subtitlesFontSize", value);
            props.onSubtitlesFontSizeInput?.(value);
          }}
        />
      </SliderWrapper>
      <SliderWrapper>
        <SliderLabel value={`${settings.subtitlesOpacity}%`}>
          {localizationProvider.get("VOTSubtitlesOpacity")}
        </SliderLabel>
        <Slider
          value={settings.subtitlesOpacity}
          onInput={(value) => {
            setSettings("subtitlesOpacity", value);
            props.onSubtitlesOpacityInput?.(value);
          }}
        />
      </SliderWrapper>
    </SettingsSection>
  );
}
