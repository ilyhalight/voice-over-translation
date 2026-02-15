import { EventImpl } from "../../core/eventImpl";
import { localizationProvider } from "../../localization/localizationProvider";
import type { HotkeyButtonProps } from "../../types/components/hotkeyButton";
import UI from "../../ui";
import {
  addComponentEventListener,
  getHiddenState,
  removeComponentEventListener,
  setHiddenState,
} from "./componentShared";

export default class HotkeyButton {
  container: HTMLElement;
  button: HTMLElement;

  private readonly onChange = new EventImpl<[string | null]>();
  private readonly events = {
    change: this.onChange,
  };

  private readonly _labelHtml: string;
  private _key: string | null;
  // Currently held keys while recording.
  private readonly pressedKeys: Set<string>;
  // Union of all keys pressed during the recording session.
  private readonly comboKeys: Set<string>;

  private recording: boolean = false;

  constructor({ labelHtml, key = null }: HotkeyButtonProps) {
    this._labelHtml = labelHtml;
    this._key = key;
    this.pressedKeys = new Set<string>();
    this.comboKeys = new Set<string>();

    const elements = this.createElements();
    this.container = elements.container;
    this.button = elements.button;
  }

  private stopRecordingKeys() {
    this.recording = false;
    document.removeEventListener("keydown", this.keydownHandle);
    document.removeEventListener("keyup", this.keyupOrBlurHandle);
    // "blur" on globalThis fires when the tab loses focus.
    globalThis.removeEventListener("blur", this.blurHandle);
    delete this.button.dataset.status;
    this.pressedKeys.clear();
    this.comboKeys.clear();
  }

  private readonly keydownHandle = (event: KeyboardEvent) => {
    if (!this.recording || event.repeat) {
      return;
    }

    event.preventDefault();
    if (event.code === "Escape") {
      this.key = null;
      this.button.textContent = this.keyText;
      this.stopRecordingKeys();
      return;
    }

    this.pressedKeys.add(event.code);
    this.comboKeys.add(event.code);
    this.button.textContent = formatKeysComboDisplay(this.pressedKeys);
  };

  private readonly keyupOrBlurHandle = (event?: KeyboardEvent) => {
    if (!this.recording) return;

    // On keyup, release the key and finish once all keys are released.
    if (event) {
      this.pressedKeys.delete(event.code);
      // Keep showing what the user is currently holding.
      this.button.textContent = this.pressedKeys.size
        ? formatKeysComboDisplay(this.pressedKeys)
        : formatKeysComboDisplay(this.comboKeys);
      if (this.pressedKeys.size) {
        return;
      }
    }

    // If user exited without pressing any key, treat as "no hotkey".
    this.key = this.comboKeys.size ? formatKeysCombo(this.comboKeys) : null;
    this.stopRecordingKeys();
  };

  private readonly blurHandle = () => {
    this.keyupOrBlurHandle();
  };

  private createElements() {
    const container = UI.createEl("vot-block", ["vot-hotkey"]);
    const label = UI.createEl("vot-block", ["vot-hotkey-label"]);
    label.textContent = this._labelHtml;

    const button = UI.createEl("vot-block", ["vot-hotkey-button"]);
    // A11y: keyboard access for custom element.
    UI.makeButtonLike(button);
    button.textContent = this.keyText;
    button.addEventListener("click", () => {
      if (this.recording) {
        // Clicking again cancels recording without changing the value.
        this.stopRecordingKeys();
        this.button.textContent = this.keyText;
        return;
      }

      button.dataset.status = "active";

      this.recording = true;
      this.pressedKeys.clear();
      this.comboKeys.clear();
      this.button.textContent = localizationProvider.get(
        "PressTheKeyCombination",
      );

      document.addEventListener("keydown", this.keydownHandle);
      document.addEventListener("keyup", this.keyupOrBlurHandle);
      globalThis.addEventListener("blur", this.blurHandle);
    });

    container.append(label, button);
    return { container, button, label };
  }

  addEventListener(
    _type: "change",
    listener: (key: string | null) => void,
  ): this {
    addComponentEventListener(this.events, "change", listener);

    return this;
  }

  removeEventListener(
    _type: "change",
    listener: (key: string | null) => void,
  ): this {
    removeComponentEventListener(this.events, "change", listener);

    return this;
  }

  set hidden(isHidden: boolean) {
    setHiddenState(this.container, isHidden);
  }

  get hidden() {
    return getHiddenState(this.container);
  }

  get key() {
    return this._key;
  }

  get keyText() {
    if (!this._key) {
      return localizationProvider.get("None");
    }

    return formatKeysComboDisplay(this._key);
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
 * Formats a set of key codes into a string representing a key combination
 */
export function formatKeysCombo(keys: Set<string> | string[]): string {
  const keysArray = Array.isArray(keys) ? keys : Array.from(keys);

  return keysArray
    .map((code) => code.replace("Key", "").replace("Digit", ""))
    .join("+");
}

/**
 * Human-friendly formatting for hotkeys. Does not change stored semantics.
 */
function formatKeysComboDisplay(keys: Set<string> | string[] | string): string {
  let parts: string[];
  if (typeof keys === "string") {
    parts = keys.split("+").filter(Boolean);
  } else if (Array.isArray(keys)) {
    parts = keys;
  } else {
    parts = Array.from(keys);
  }

  const map = (k: string) => {
    // Stored keys may have removed "Key" / "Digit" already.
    switch (k) {
      case "ControlLeft":
      case "ControlRight":
      case "Control":
        return "Ctrl";
      case "ShiftLeft":
      case "ShiftRight":
      case "Shift":
        return "Shift";
      case "AltLeft":
      case "AltRight":
      case "Alt":
        return "Alt";
      case "MetaLeft":
      case "MetaRight":
      case "Meta":
        return "Meta";
      case "Space":
        return "Space";
      case "ArrowUp":
        return "↑";
      case "ArrowDown":
        return "↓";
      case "ArrowLeft":
        return "←";
      case "ArrowRight":
        return "→";
      default:
        return k.replace("Key", "").replace("Digit", "");
    }
  };

  // Show modifiers first, then the rest.
  const priority = (k: string) => {
    const m = map(k);
    if (m === "Ctrl") return 0;
    if (m === "Alt") return 1;
    if (m === "Shift") return 2;
    if (m === "Meta") return 3;
    return 10;
  };

  return parts
    .slice()
    .sort((a, b) => priority(a) - priority(b))
    .map(map)
    .join("+");
}
