import { availableLangs } from "@vot.js/shared/consts";
import { createSignal, type JSX, mergeProps } from "solid-js";
import { effect } from "solid-js/web";
import { detectServices, translateServices } from "../../core/translateApis";
import { localizationProvider } from "../../localization/localizationProvider";
import { setSettings, settings } from "../../stores/settings";
import type { LanguageSelectKey } from "../../types/components/select";
import type {
  DetectService,
  TranslateService,
} from "../../types/translateApis";
import { isSupportGMXhr } from "../../utils/gm";
import {
  genSelectOptionsByLangs,
  Select,
  type SelectOption,
} from "../Control/Select";
import { Slider } from "../Control/Slider";
import { SliderLabel, SliderLabelDesc } from "../Control/SliderLabel";
import { SliderWrapper } from "../Control/SliderWrapper";
import { Switch } from "../Control/Switch";
import { SettingsSection } from "./SettingsSection";

export type SettingsTranslationSectionProps = {
  isAudioContextSupported?: boolean;
  onAutoTranslateChange?: (checked: boolean) => void;
  onAutoSubtitlesChange?: (checked: boolean) => void;
  onDontTranslateLanguagesChange?: (
    selectedLanguages: LanguageSelectKey[],
    changedLanguage: LanguageSelectKey,
  ) => void;
  onEnabledAutoVolumeChange?: (checked: boolean) => void;
  onAutoVolumeInput?: (volume: number) => void;
  onEnabledSmartDuckingChange?: (checked: boolean) => void;
  onShowVideoSliderChange?: (checked: boolean) => void;
  onAudioBoosterChange?: (checked: boolean) => void;
  onSyncVolumeChange?: (checked: boolean) => void;
  onDownloadWithNameChange?: (checked: boolean) => void;
  onSendNotifyOnCompleteChange?: (checked: boolean) => void;
  onUseAudioDownloadChange?: (checked: boolean) => void;
  onTranslationServiceSelect?: (service: TranslateService) => void;
  onDetectServiceSelect?: (service: DetectService) => void;
};

export function SettingsTranslationSection(
  props: SettingsTranslationSectionProps,
): JSX.Element {
  const finalProps = mergeProps(
    {
      isAudioContextSupported: false,
    },
    props,
  );

  const dontTranslateLanguagesOptions = genSelectOptionsByLangs(availableLangs);
  const translationTextServiceOptions = translateServices.map<SelectOption>(
    (service) => ({
      label: localizationProvider.get(`services.${service}`),
      value: service,
    }),
  );

  const detectServiceOptions = detectServices.map<SelectOption>((service) => ({
    label: localizationProvider.get(`services.${service}`),
    value: service,
  }));

  const [isAudioContextSupported, setIsAudioContextSupported] = createSignal(
    finalProps.isAudioContextSupported,
  );

  effect(() => {
    setIsAudioContextSupported(finalProps.isAudioContextSupported);
  });

  const autoVolumeText = () => `${settings.autoVolume}%`;
  const useAudioDownloadDescription = () =>
    isSupportGMXhr
      ? localizationProvider.get("VOTUseAudioDownloadWarning")
      : `${localizationProvider.get("VOTUseAudioDownloadWarning")}. ${localizationProvider.get("VOTNotSupportedByLoader")}`;

  return (
    <SettingsSection
      isOpen={true}
      title={localizationProvider.get("translationSettings")}
    >
      <Switch
        heading={localizationProvider.get("VOTAutoTranslate")}
        checked={settings.autoTranslate}
        onChange={(checked) => {
          setSettings("autoTranslate", checked);
          finalProps.onAutoTranslateChange?.(checked);
        }}
      />
      <Switch
        heading={localizationProvider.get("VOTAutoSubtitles")}
        checked={settings.autoSubtitles}
        onChange={(checked) => {
          setSettings("autoSubtitles", checked);
          finalProps.onAutoSubtitlesChange?.(checked);
        }}
      />
      <Select
        multiple={true}
        search={true}
        title={localizationProvider.get("None")}
        options={dontTranslateLanguagesOptions}
        selectedValues={settings.dontTranslateLanguages}
        minSelected={0}
        onSelectionChange={(values, changedOption) => {
          setSettings("dontTranslateLanguages", values as LanguageSelectKey[]);
          finalProps.onDontTranslateLanguagesChange?.(
            values as LanguageSelectKey[],
            changedOption.value as LanguageSelectKey,
          );
        }}
      >
        {localizationProvider.get("DontTranslateSelectedLanguages")}
      </Select>
      <Switch
        heading={localizationProvider.get("VOTAutoReduceVolume")}
        checked={settings.enabledAutoVolume}
        onChange={(checked) => {
          setSettings("enabledAutoVolume", checked);
          finalProps.onEnabledAutoVolumeChange?.(checked);
        }}
      />
      <SliderWrapper>
        <SliderLabel
          value={autoVolumeText()}
          disabled={!settings.enabledAutoVolume || settings.enabledSmartDucking}
        >
          {localizationProvider.get("VOTReducedVolumeLevel")}
          <SliderLabelDesc>
            {localizationProvider
              .get("VOTIncompatibleWith")
              .replace("{0}", localizationProvider.get("smartDucking"))}
          </SliderLabelDesc>
        </SliderLabel>
        <Slider
          value={settings.autoVolume}
          disabled={!settings.enabledAutoVolume || settings.enabledSmartDucking}
          onInput={(val) => {
            setSettings("autoVolume", val);
            finalProps.onAutoVolumeInput?.(val);
          }}
        />
      </SliderWrapper>
      <Switch
        heading={localizationProvider.get("smartDucking")}
        description={localizationProvider
          .get("VOTIncompatibleWith")
          .replace("{0}", localizationProvider.get("VOTSyncVolume"))}
        disabled={settings.syncVolume || !settings.enabledAutoVolume}
        checked={settings.enabledSmartDucking}
        onChange={(checked) => {
          setSettings("enabledSmartDucking", checked);
          finalProps.onEnabledSmartDuckingChange?.(checked);
        }}
      />
      <Switch
        heading={localizationProvider.get("showVideoVolumeSlider")}
        checked={settings.showVideoSlider}
        onChange={(checked) => {
          setSettings("showVideoSlider", checked);
          finalProps.onShowVideoSliderChange?.(checked);
        }}
      />
      <Switch
        heading={localizationProvider.get("VOTAudioBooster")}
        description={
          isAudioContextSupported()
            ? undefined
            : localizationProvider.get("VOTNeedWebAudioAPI")
        }
        checked={settings.audioBooster}
        disabled={!isAudioContextSupported()}
        onChange={(checked) => {
          setSettings("audioBooster", checked);
          finalProps.onAudioBoosterChange?.(checked);
        }}
      />
      <Switch
        heading={localizationProvider.get("VOTSyncVolume")}
        description={localizationProvider
          .get("VOTIncompatibleWith")
          .replace("{0}", localizationProvider.get("smartDucking"))}
        checked={settings.syncVolume}
        onChange={(checked) => {
          setSettings("syncVolume", checked);
          if (checked) {
            setSettings("enabledSmartDucking", false);
            finalProps.onEnabledSmartDuckingChange?.(checked);
          }

          finalProps.onSyncVolumeChange?.(checked);
        }}
      />
      <Switch
        heading={localizationProvider.get("VOTDownloadWithName")}
        description={
          isSupportGMXhr
            ? undefined
            : localizationProvider.get("VOTNotSupportedByLoader")
        }
        disabled={!isSupportGMXhr}
        checked={settings.downloadWithName}
        onChange={(checked) => {
          setSettings("downloadWithName", checked);
          finalProps.onDownloadWithNameChange?.(checked);
        }}
      />
      <Switch
        heading={localizationProvider.get("VOTSendNotifyOnComplete")}
        checked={settings.sendNotifyOnComplete}
        onChange={(checked) => {
          setSettings("sendNotifyOnComplete", checked);
          finalProps.onSendNotifyOnCompleteChange?.(checked);
        }}
      />
      <Switch
        heading={localizationProvider.get("VOTUseAudioDownload")}
        description={useAudioDownloadDescription()}
        disabled={!isSupportGMXhr}
        checked={settings.useAudioDownload}
        onChange={(checked) => {
          setSettings("useAudioDownload", checked);
          finalProps.onUseAudioDownloadChange?.(checked);
        }}
      />
      <Select
        title={localizationProvider.get("VOTTranslationTextService")}
        options={translationTextServiceOptions}
        selectedValue={settings.translationService}
        onSelect={(option) => {
          const value = option.value as TranslateService;
          setSettings("translationService", value);
          finalProps.onTranslationServiceSelect?.(value);
        }}
      >
        {localizationProvider.get("VOTTranslationTextService")}
        <br />
        <vot-block class="vot-select_new-label__description">
          {localizationProvider.get("VOTNotAffectToVoice")}
        </vot-block>
      </Select>
      <Select
        title={localizationProvider.get("VOTDetectService")}
        options={detectServiceOptions}
        selectedValue={settings.detectService}
        onSelect={(option) => {
          const value = option.value as DetectService;
          setSettings("detectService", value);
          finalProps.onDetectServiceSelect?.(value);
        }}
      >
        {localizationProvider.get("VOTDetectService")}
      </Select>
    </SettingsSection>
  );
}
