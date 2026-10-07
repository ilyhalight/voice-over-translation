import type { JSX } from "solid-js";
import {
  localizationProvider,
  t,
} from "../../localization/localizationProvider";
import { setSettings, settings } from "../../stores/settings";
import { type Position, positions } from "../../types/components/votButton";
import { isPiPAvailable } from "../../utils/utils";
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

export type SettingsAppearanceSectionProps = {
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
    `${autoHideButtonDelaySecs()} ${t("secs")}`;

  const buttonPositionOptions = positions.map<SelectOption>((position) => ({
    label: t(`position.${position}`),
    value: position,
  }));

  const langsOptions = genSelectOptionsByLangs(
    localizationProvider.getAvailableLangs(),
  );

  return (
    <SettingsSection title={t("appearance")}>
      <Switch
        heading={t("VOTShowPiPButton")}
        checked={settings.showPiPButton}
        hidden={!isPiPAvailable()}
        onChange={(checked) => {
          setSettings("showPiPButton", checked);
          props.onShowPiPButtonChange?.(checked);
        }}
      />
      <SliderWrapper>
        <SliderLabel value={autoHideButtonDelayValueText()}>
          {t("autoHideButtonDelay")}
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
        title={t("buttonPosition")}
        options={buttonPositionOptions}
        selectedValue={settings.buttonPos}
        onSelect={(option) => {
          setSettings("buttonPos", option.value as Position);
          props.onButtonPositionSelect?.(option);
        }}
      >
        {t("buttonPosition")}
      </Select>
      <Select
        title={t("VOTMenuLanguage")}
        options={langsOptions}
        selectedValue={localizationProvider.langOverride}
        onSelect={props.onLangSelect}
        search={true}
      >
        {t("VOTMenuLanguage")}
      </Select>
    </SettingsSection>
  );
}
