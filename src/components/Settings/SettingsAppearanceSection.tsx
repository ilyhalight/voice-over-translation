import type { JSX } from "solid-js";
import {
  localizationProvider,
  t,
} from "../../localization/localizationProvider";
import { setSettings, settings } from "../../stores/settings";
import { type Position, positions } from "../../types/components/votButton";
import { type QuickActionSlot, quickActions } from "../../ui/quickAction";
import {
  genSelectOptionsByLangs,
  Select,
  type SelectOption,
} from "../Control/Select";
import { Slider } from "../Control/Slider";
import { SliderLabel } from "../Control/SliderLabel";
import { SliderWrapper } from "../Control/SliderWrapper";
import { SettingsSection } from "./SettingsSection";

export type SettingsAppearanceSectionProps = {
  onQuickActionSelect?: (slot: QuickActionSlot, option: SelectOption) => void;
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

  const quickActionOptions: SelectOption[] = quickActions.map<SelectOption>(
    (action) => ({
      label: t(action.phrase),
      value: action.id,
      disabled: action.disabled,
    }),
  );

  const langsOptions = genSelectOptionsByLangs(
    localizationProvider.getAvailableLangs(),
  );

  const QuickActionSelect = (opts: {
    action: QuickActionSlot;
    order: number;
  }) => (
    <Select
      title={t("QuickAction").replace("{0}", opts.order)}
      options={quickActionOptions}
      selectedValue={settings[opts.action]}
      onSelect={(option) => {
        props.onQuickActionSelect?.(opts.action, option);
      }}
    >
      {t("QuickAction").replace("{0}", opts.order)}
    </Select>
  );

  return (
    <SettingsSection title={t("appearance")}>
      <QuickActionSelect action="quickAction1" order={1} />
      <QuickActionSelect action="quickAction2" order={2} />
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
