import type { JSX } from "solid-js";
import { localizationProvider } from "../../localization/localizationProvider";
import { setSettings, settings } from "../../stores/settings";
import { type Position, positions } from "../../types/components/votButton";
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
  const autoHideButtonDelaySecs = () =>
    Math.round(settings.autoHideButtonDelay / STEP_AUTO_HIDE_BUTTON_DELAY) / 10;
  const autoHideButtonDelayValueText = () =>
    `${autoHideButtonDelaySecs()} ${localizationProvider.get("secs")}`;

  const buttonPositionOptions = positions.map<SelectOption>((position) => ({
    label: localizationProvider.get(`position.${position}`),
    value: position,
  }));

  const langsOptions = localizationProvider
    .getAvailableLangs()
    .map<SelectOption>((lang) => {
      const phrase = `langs.${lang}` satisfies Phrase;
      const label = localizationProvider.get(phrase);
      return {
        label: label === phrase ? lang.toUpperCase() : label,
        value: lang,
      };
    });

  return (
    <SettingsSection
      ref={props.ref}
      title={localizationProvider.get("appearance")}
    >
      <Switch
        heading={localizationProvider.get("VOTShowPiPButton")}
        checked={settings.showPiPButton}
        hidden={!isPiPAvailable()}
        onChange={(checked) => {
          setSettings("showPiPButton", checked);
          props.onShowPiPButtonChange?.(checked);
        }}
      />
      <SliderWrapper>
        <SliderLabel value={autoHideButtonDelayValueText()}>
          {localizationProvider.get("autoHideButtonDelay")}
        </SliderLabel>
        <Slider
          min={MIN_AUTO_HIDE_BUTTON_DELAY}
          max={MAX_AUTO_HIDE_BUTTON_DELAY}
          step={STEP_AUTO_HIDE_BUTTON_DELAY}
          value={settings.autoHideButtonDelay}
          onInput={(val) => {
            setSettings("autoHideButtonDelay", val);
            props.onAutoHideButtonDelayInput?.(val);
          }}
        />
      </SliderWrapper>
      <Select
        title={localizationProvider.get("buttonPosition")}
        options={buttonPositionOptions}
        selectedValue={settings.buttonPos}
        onSelect={(option) => {
          setSettings("buttonPos", option.value as Position);
          props.onButtonPositionSelect?.(option);
        }}
      >
        {localizationProvider.get("buttonPosition")}
      </Select>
      <Select
        title={localizationProvider.get("VOTMenuLanguage")}
        options={langsOptions}
        selectedValue={localizationProvider.langOverride}
        onSelect={props.onLangSelect}
        search={true}
      >
        {localizationProvider.get("VOTMenuLanguage")}
      </Select>
    </SettingsSection>
  );
}
