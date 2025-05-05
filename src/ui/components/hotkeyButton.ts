import UI from "../../ui";
import { EventImpl } from "../../core/eventImpl";
import type { HotkeyButtonProps } from "../../types/components/hotkeyButton";
import { localizationProvider } from "../../localization/localizationProvider";

export default class HotkeyButton {
  container: HTMLElement;
  button: HTMLElement;

  private onChange = new EventImpl();

  private _labelHtml: string;
  private _key: string | null;
  private pressedKeys: Set<string>;

  private recording: boolean = false;

  constructor({ labelHtml, key = null }: HotkeyButtonProps) {
    this._labelHtml = labelHtml;
    this._key = key;
    this.pressedKeys = new Set<string>();

    const elements = this.createElements();
    this.container = elements.container;
    this.button = elements.button;
  }

  private keydownHandle = (event: KeyboardEvent) => {
    if (!this.recording) return;

    event.preventDefault();
    if (event.code === "Escape") {
      this.pressedKeys.clear();
      this.key = null;
      this.button.textContent = this.keyText;
      this.recording = false;
      this.button.removeAttribute("data-status");
      document.removeEventListener("keydown", this.keydownHandle);
      document.removeEventListener("keyup", this.keyupHandle);
      return;
    }

    this.pressedKeys.add(event.code);
    this.button.textContent = formatKeysCombo(this.pressedKeys);
  };

  private keyupHandle = async (_event: KeyboardEvent) => {
    if (!this.recording) return;

    this.recording = false;
    document.removeEventListener("keydown", this.keydownHandle);
    document.removeEventListener("keyup", this.keyupHandle);

    this.key = formatKeysCombo(this.pressedKeys);

    this.pressedKeys.clear();
    this.button.removeAttribute("data-status");
  };

  private createElements() {
    const container = UI.createEl("vot-block", ["vot-hotkey"]);
    const label = UI.createEl("vot-block", ["vot-hotkey-label"]);
    label.textContent = this._labelHtml;

    const button = UI.createEl("vot-block", ["vot-hotkey-button"]);
    button.textContent = this.keyText;
    button.onclick = () => console.log("click onclick");
    button.addEventListener("click", () => {
      console.log("click");
      button.dataset.status = "active";

      this.recording = true;
      this.pressedKeys.clear();
      this.button.textContent = localizationProvider.get(
        "PressTheKeyCombination",
      );

      document.addEventListener("keydown", this.keydownHandle);
      document.addEventListener("keyup", this.keyupHandle);
    });

    container.append(label, button);
    return { container, button, label };
  }

  addEventListener(
    type: "change",
    listener: (key: string | null) => void,
  ): this {
    this.onChange.addListener(listener);

    return this;
  }

  removeEventListener(
    type: "change",
    listener: (key: string | null) => void,
  ): this {
    this.onChange.removeListener(listener);

    return this;
  }

  set hidden(isHidden: boolean) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }

  get key() {
    return this._key;
  }

  get keyText() {
    return (
      this._key?.replace("Key", "").replace("Digit", "") ??
      localizationProvider.get("None")
    );
  }

  /**
   * If you set a different new value, it will trigger the change event
   */
  set key(newKey: string | null) {
    if (this._key === newKey) {
      return;
    }

    this._key = newKey;
    this.button.textContent = this.keyText;
    this.onChange.dispatch(this._key);
  }
}

/**
 * Formats a set of key codes into a string representing a key combination.
 *
 * @param {Set<string> | string[]} keys - A set or array of strings representing key codes.
 * @returns {string} - A formatted string representing the key combination.
 */
export function formatKeysCombo(keys: Set<string> | string[]): string {
  const keysArray = Array.isArray(keys) ? keys : Array.from(keys);

  return keysArray
    .map((code) => code.replace("Key", "").replace("Digit", ""))
    .join("+");
}
