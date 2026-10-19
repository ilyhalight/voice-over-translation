import { For, type JSX } from "solid-js";

import { t } from "../../localization/localizationProvider";
import type { HotkeyController } from "../../modules/hotkeys/controller";
import type { RawHotkey } from "../../modules/hotkeys/types";
import { setSettings, settings } from "../../stores/settings";
import { HotkeyButton } from "../Button/HotkeyButton";
import { SettingsSection } from "./SettingsSection";

export type SettingsHotkeySectionProps = {
  hotkeyController: HotkeyController;
};

export function SettingsHotkeySection(
  props: SettingsHotkeySectionProps,
): JSX.Element {
  return (
    <SettingsSection title={t("hotkeysSettings")}>
      <For each={props.hotkeyController.actions}>
        {(action) => (
          <HotkeyButton
            key={settings[action.settingsKey] as RawHotkey}
            onChange={(newKey) => {
              setSettings(action.settingsKey, newKey);
              action.onchange?.(newKey);
            }}
          >
            {t(action.localizationPhrase)}
          </HotkeyButton>
        )}
      </For>
    </SettingsSection>
  );
}
