import type { SettingsStore } from "#stores/settings.ts";
import type { Phrase } from "#types/localization.ts";

export type ParsedHotkey = {
  parts: readonly string[];
  partsSet: ReadonlySet<string>;
};

export type RawHotkey = string | undefined | null;

export type HotkeyActionItem = {
  action: () => Promise<unknown>;
  settingsKey: keyof SettingsStore;
  hotkey: RawHotkey;
  localizationPhrase: Phrase;
  onchange?: (newKey: RawHotkey) => void;
};
