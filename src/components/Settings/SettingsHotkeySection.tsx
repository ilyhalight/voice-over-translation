import type { JSX } from "solid-js";
import { localizationProvider } from "../../localization/localizationProvider";
import { setSettings, settings } from "../../stores/settings";
import { HotkeyButton } from "../Button/HotkeyButton";
import { SettingsSection } from "./SettingsSection";

export type SettingsHotkeySectionProps = {
  onTranslationHotkeyChange?: (newKey: string | null) => void;
  onSubtitlesHotkeyChange?: (newKey: string | null) => void;
};

export function SettingsHotkeySection(
  props: SettingsHotkeySectionProps,
): JSX.Element {
  return (
    <SettingsSection title={localizationProvider.get("hotkeysSettings")}>
      <HotkeyButton
        key={settings.translationHotkey}
        onChange={(newKey) => {
          setSettings("translationHotkey", newKey);
          props.onTranslationHotkeyChange?.(newKey);
        }}
      >
        {localizationProvider.get("translateVideo")}
      </HotkeyButton>
      <HotkeyButton
        key={settings.subtitlesHotkey}
        onChange={(newKey) => {
          setSettings("subtitlesHotkey", newKey);
          props.onSubtitlesHotkeyChange?.(newKey);
        }}
      >
        {localizationProvider.get("VOTSubtitles")}
      </HotkeyButton>
    </SettingsSection>
  );
}
