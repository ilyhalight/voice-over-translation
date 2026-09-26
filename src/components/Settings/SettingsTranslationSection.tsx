import { availableLangs } from "@vot.js/shared/consts";
import { createSignal, type JSX, mergeProps } from "solid-js";
import { effect } from "solid-js/web";

import { detectServices, translateServices } from "../../core/translateApis";
import {
  localizationProvider,
  t,
} from "../../localization/localizationProvider";
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
import { SliderLabel } from "../Control/SliderLabel";
import { SliderWrapper } from "../Control/SliderWrapper";
import { Switch } from "../Control/Switch";
import { SettingsSection } from "./SettingsSection";

export type SettingsTranslationSectionProps = {
  isAudioContextSupported?: boolean;
  onAutoTranslateChange?: (checked: boolean) => void;
  onAutoPauseOnTranslateChange?: (checked: boolean) => void;
  onAutoSubtitlesChange?: (checked: boolean) => void;
  onDontTranslateLanguagesChange?: (
    selectedLanguages: LanguageSelectKey[],
    changedLanguage: LanguageSelectKey,
  ) => void;
  onEnabledAutoVolumeChange?: (checked: boolean) => void;
  onAutoVolumeInput?: (volume: number) => void;
  onSmartDuckingStrengthInput?: (volume: number) => void;
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
      label: t(`services.${service}`),
      value: service,
    }),
  );

  const detectServiceOptions = detectServices.map<SelectOption>((service) => ({
    label: t(`services.${service}`),
    value: service,
  }));

  const [isAudioContextSupported, setIsAudioContextSupported] = createSignal(
    finalProps.isAudioContextSupported,
  );

  effect(() => {
    setIsAudioContextSupported(finalProps.isAudioContextSupported);
  });

  const autoVolumeText = () =>
    `${settings.enabledSmartDucking ? settings.smartDuckingStrength : settings.autoVolume}%`;
  const useAudioDownloadDescription = () =>
    isSupportGMXhr
      ? t("VOTUseAudioDownloadWarning")
      : `${t("VOTUseAudioDownloadWarning")}. ${t("VOTNotSupportedByLoader")}`;

  return (
    <SettingsSection isOpen={true} title={t("translationSettings")}>
      <Switch
        heading={t("VOTAutoTranslate")}
        checked={settings.autoTranslate}
        onChange={(checked) => {
          setSettings("autoTranslate", checked);
          finalProps.onAutoTranslateChange?.(checked);
        }}
      />
      <Switch
        heading={t("VOTAutoPauseOnTranslate")}
        checked={settings.autoPauseOnTranslate}
        onChange={(checked) => {
          setSettings("autoPauseOnTranslate", checked);
          finalProps.onAutoPauseOnTranslateChange?.(checked);
        }}
      />
      <Switch
        heading={t("VOTAutoSubtitles")}
        checked={settings.autoSubtitles}
        onChange={(checked) => {
          setSettings("autoSubtitles", checked);
          finalProps.onAutoSubtitlesChange?.(checked);
        }}
      />
      <Select
        multiple={true}
        search={true}
        title={t("None")}
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
        {t("DontTranslateSelectedLanguages")}
      </Select>
      <Switch
        heading={t("VOTAutoReduceVolume")}
        checked={settings.enabledAutoVolume}
        onChange={(checked) => {
          setSettings("enabledAutoVolume", checked);
          finalProps.onEnabledAutoVolumeChange?.(checked);
        }}
      />
      <SliderWrapper>
        <SliderLabel
          value={autoVolumeText()}
          disabled={!settings.enabledAutoVolume}
        >
          {settings.enabledSmartDucking
            ? t("VOTSmartDuckingStrength")
            : t("VOTReducedVolumeLevel")}
        </SliderLabel>
        <Slider
          value={
            settings.enabledSmartDucking
              ? settings.smartDuckingStrength
              : settings.autoVolume
          }
          disabled={!settings.enabledAutoVolume}
          onInput={(val) => {
            if (settings.enabledSmartDucking) {
              setSettings("smartDuckingStrength", val);
              finalProps.onSmartDuckingStrengthInput?.(val);
              return;
            }

            setSettings("autoVolume", val);
            finalProps.onAutoVolumeInput?.(val);
          }}
        />
      </SliderWrapper>
      <Switch
        heading={t("smartDucking")}
        description={localizationProvider
          .get("VOTIncompatibleWith")
          .replace("{0}", t("VOTSyncVolume"))}
        disabled={settings.syncVolume || !settings.enabledAutoVolume}
        checked={settings.enabledSmartDucking}
        onChange={(checked) => {
          setSettings("enabledSmartDucking", checked);
          finalProps.onEnabledSmartDuckingChange?.(checked);
        }}
      />
      <Switch
        heading={t("showVideoVolumeSlider")}
        checked={settings.showVideoSlider}
        onChange={(checked) => {
          setSettings("showVideoSlider", checked);
          finalProps.onShowVideoSliderChange?.(checked);
        }}
      />
      <Switch
        heading={t("VOTAudioBooster")}
        description={
          isAudioContextSupported() ? undefined : t("VOTNeedWebAudioAPI")
        }
        checked={settings.audioBooster}
        disabled={!isAudioContextSupported()}
        onChange={(checked) => {
          setSettings("audioBooster", checked);
          finalProps.onAudioBoosterChange?.(checked);
        }}
      />
      <Switch
        heading={t("VOTSyncVolume")}
        description={t("VOTIncompatibleWith").replace("{0}", t("smartDucking"))}
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
        heading={t("VOTDownloadWithName")}
        description={isSupportGMXhr ? undefined : t("VOTNotSupportedByLoader")}
        disabled={!isSupportGMXhr}
        checked={settings.downloadWithName}
        onChange={(checked) => {
          setSettings("downloadWithName", checked);
          finalProps.onDownloadWithNameChange?.(checked);
        }}
      />
      <Switch
        heading={t("VOTSendNotifyOnComplete")}
        checked={settings.sendNotifyOnComplete}
        onChange={(checked) => {
          setSettings("sendNotifyOnComplete", checked);
          finalProps.onSendNotifyOnCompleteChange?.(checked);
        }}
      />
      <Switch
        heading={t("VOTUseAudioDownload")}
        description={useAudioDownloadDescription()}
        disabled={!isSupportGMXhr}
        checked={settings.useAudioDownload}
        onChange={(checked) => {
          setSettings("useAudioDownload", checked);
          finalProps.onUseAudioDownloadChange?.(checked);
        }}
      />
      <Select
        title={t("VOTTranslationTextService")}
        options={translationTextServiceOptions}
        selectedValue={settings.translationService}
        onSelect={(option) => {
          const value = option.value as TranslateService;
          setSettings("translationService", value);
          finalProps.onTranslationServiceSelect?.(value);
        }}
      >
        {t("VOTTranslationTextService")}
        <br />
        <vot-block class="vot-select-label__description">
          {t("VOTNotAffectToVoice")}
        </vot-block>
      </Select>
      <Select
        title={t("VOTDetectService")}
        options={detectServiceOptions}
        selectedValue={settings.detectService}
        onSelect={(option) => {
          const value = option.value as DetectService;
          setSettings("detectService", value);
          finalProps.onDetectServiceSelect?.(value);
        }}
      >
        {t("VOTDetectService")}
      </Select>
    </SettingsSection>
  );
}
