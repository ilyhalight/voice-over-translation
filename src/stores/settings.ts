import { createStore } from "solid-js/store";

import type { Position } from "../types/components/votButton";

export type SettingsStore = {
  translateAPIErrors: boolean;
  newAudioPlayer: boolean;
  onlyBypassMediaCSP: boolean;
  showPiPButton: boolean;
  buttonPos: Position;
};

function createInitialState(): SettingsStore {
  return {
    translateAPIErrors: true,
    // TODO: set default by audioContextSupported?
    newAudioPlayer: false,
    onlyBypassMediaCSP: false,
    showPiPButton: false,
    buttonPos: "default",
  };
}

export const [settings, setSettings] = createStore<SettingsStore>(
  createInitialState(),
);

export function resetSettings() {
  setSettings(createInitialState());
}
