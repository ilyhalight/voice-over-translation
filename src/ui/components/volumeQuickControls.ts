// Shared setting state; no independent stored values.
import { localizationProvider } from "../../localization/localizationProvider";
import type { StorageData } from "../../types/storage";
import { getVolumeQuickStates, type VolumeQuickKey } from "../volumeQuickState";

export class VolumeQuickControls {
  readonly container = document.createElement("vot-block");
  readonly buttons = new Map<VolumeQuickKey, HTMLButtonElement>();
  constructor(
    private readonly data: Partial<StorageData>,
    private readonly supportsBoost: boolean,
    private readonly onToggle: (key: VolumeQuickKey) => void | Promise<void>,
  ) {
    this.container.className = "vot-volume-quick-controls";
    for (const state of getVolumeQuickStates(data, supportsBoost)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "vot-volume-quick-button";
      button.dataset.volumeSetting = state.key;
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (button.disabled) return;
        button.disabled = true;
        try {
          await this.onToggle(state.key);
        } catch (error) {
          console.error("[VOT] Quick volume setting failed", error);
        } finally {
          this.refresh();
        }
      });
      this.buttons.set(state.key, button);
      this.container.append(button);
    }
    this.refresh();
  }
  refresh(): void {
    for (const state of getVolumeQuickStates(this.data, this.supportsBoost)) {
      const button = this.buttons.get(state.key);
      if (!button) continue;
      const label = localizationProvider.get(state.labelKey);
      const fullLabel = `${label}${state.detail ? ` ${state.detail}` : ""}`;
      button.textContent = `${state.emoji}${state.detail ? ` ${state.detail}` : ""}`;
      button.setAttribute("aria-label", fullLabel);
      button.setAttribute("aria-pressed", String(state.active));
      button.disabled = state.disabled;
      button.title =
        state.key === "audioBooster" && this.data.syncVolume
          ? localizationProvider.get("VOTQuickBoostUnavailableLinked")
          : fullLabel;
    }
  }
}
