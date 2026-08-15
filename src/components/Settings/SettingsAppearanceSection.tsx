import { createSignal, type JSX, mergeProps } from "solid-js";
import { DEFAULT_AUTO_HIDE_DELAY } from "../../config/config";
import { localizationProvider } from "../../localization/localizationProvider";
import { settings } from "../../stores/settings";
import { positions } from "../../types/components/votButton";
import type { Phrase } from "../../types/localization";
import { isPiPAvailable } from "../../utils/utils";
import { Select, type SelectOption } from "../Control/Select";
import { Slider } from "../Control/Slider";
import { SliderLabel } from "../Control/SliderLabel";
import { SliderWrapper } from "../Control/SliderWrapper";
import { Switch } from "../Control/Switch";
import { SettingsSection } from "./SettingsSection";

export type SettingsAppearanceSectionProps = {
  ref?: (element: HTMLElement) => void;
  onShowPiPButtonChange?: (checked: boolean) => void;
  onAutoHideButtonDelayInput?: (delay: number) => void;
  onButtonPositionSelect?: (option: SelectOption) => void;
  onLangSelect?: (option: SelectOption) => void;
};

const MAX_AUTO_HIDE_BUTTON_DELAY = 3000;
const MIN_AUTO_HIDE_BUTTON_DELAY = 100;
const STEP_AUTO_HIDE_BUTTON_DELAY = 100;

export function SettingsAppearanceSection(
  props: SettingsAppearanceSectionProps,
): JSX.Element {
  const finalProps = mergeProps(props);

  const [autoHideButtonDelay, setAutoHideButtonDelay] = createSignal(
    DEFAULT_AUTO_HIDE_DELAY,
  );
  const autoHideButtonDelaySecs = () =>
    Math.round(autoHideButtonDelay() / STEP_AUTO_HIDE_BUTTON_DELAY) / 10;
  const autoHideButtonDelayValueText = () =>
    `${autoHideButtonDelaySecs()} ${localizationProvider.get("secs")}`;

  const buttonPositionOptions: SelectOption[] = positions.map((position) => ({
    label: localizationProvider.get(`position.${position}`),
    value: position,
  }));
  const selectedButtonPositionIndex = () =>
    buttonPositionOptions.findIndex(
      (option) => option.value === settings.buttonPos,
    );

  const langsOptions: SelectOption[] = localizationProvider
    .getAvailableLangs()
    .map((lang) => {
      const phrase = `langs.${lang}` satisfies Phrase;
      const label = localizationProvider.get(phrase);
      return {
        label: label === phrase ? lang.toUpperCase() : label,
        value: lang,
      };
    });
  const selectedLangIndex = () =>
    langsOptions.findIndex(
      (option) => option.value === localizationProvider.langOverride,
    );

  return (
    <SettingsSection
      ref={finalProps.ref}
      title={localizationProvider.get("appearance")}
    >
      <Switch
        heading={localizationProvider.get("VOTShowPiPButton")}
        checked={settings.showPiPButton}
        hidden={!isPiPAvailable()}
        onChange={finalProps.onShowPiPButtonChange}
      />
      <SliderWrapper>
        <SliderLabel value={autoHideButtonDelayValueText()}>
          {localizationProvider.get("autoHideButtonDelay")}
        </SliderLabel>
        <Slider
          min={MIN_AUTO_HIDE_BUTTON_DELAY}
          max={MAX_AUTO_HIDE_BUTTON_DELAY}
          step={STEP_AUTO_HIDE_BUTTON_DELAY}
          value={autoHideButtonDelay()}
          onInput={(val) => {
            setAutoHideButtonDelay(val);
            finalProps.onAutoHideButtonDelayInput?.(val);
          }}
        />
      </SliderWrapper>
      <Select
        title={localizationProvider.get("buttonPosition")}
        options={buttonPositionOptions}
        selectedValue={selectedButtonPositionIndex()}
        onSelect={finalProps.onButtonPositionSelect}
      >
        {localizationProvider.get("buttonPosition")}
      </Select>
      <Select
        title={localizationProvider.get("VOTMenuLanguage")}
        options={langsOptions}
        selectedValue={selectedLangIndex()}
        onSelect={finalProps.onLangSelect}
      >
        {localizationProvider.get("VOTMenuLanguage")}
      </Select>
    </SettingsSection>
  );
}
