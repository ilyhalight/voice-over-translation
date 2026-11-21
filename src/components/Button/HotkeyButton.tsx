import type { JSX } from "@solidjs/web";
import { createSignal, merge, omit, onCleanup, Show } from "solid-js";

import {
  formatKeysCombo,
  formatKeysComboDisplay,
} from "#modules/hotkeys/utils.ts";
import { t } from "../../localization/localizationProvider";
import { RawButton, type RawButtonProps } from "./RawButton";

export type HotkeyButtonProps = Omit<
  RawButtonProps,
  "class" | "children" | "onClick"
> & {
  key?: string | null;
  children?: JSX.Element;
  onChange?: (newKey: string | null) => void;
};
export function HotkeyButton(props: HotkeyButtonProps): JSX.Element {
  const finalProps = merge({ key: null }, props);
  const buttonProps = omit(
    finalProps,
    "children",
    "key",
    "buttonProps",
    "onChange",
  );

  const [key, setKey] = createSignal(() => finalProps.key);
  const [recording, setRecording] = createSignal(false);
  const [pressedKeys, setPressedKeys] = createSignal(new Set<string>());
  const [comboKeys, setComboKeys] = createSignal(new Set<string>());

  const clearPressedKeys = () => setPressedKeys(new Set<string>());
  const clearComboKeys = () => setComboKeys(new Set<string>());

  const setKeyWithDispatch = (newKey: string | null) => {
    setKey(newKey);
    finalProps.onChange?.(newKey);
  };

  const keyText = () => {
    const pressed = pressedKeys();
    if (pressed.size > 0) {
      return formatKeysComboDisplay(pressed);
    }

    if (recording()) {
      return t("PressTheKeyCombination");
    }

    const currentKey = key();
    return currentKey ? formatKeysComboDisplay(currentKey) : t("None");
  };

  function stopRecordingKeys() {
    setRecording(false);
    document.removeEventListener("keydown", keydownHandle, { capture: true });
    document.removeEventListener("keyup", keyupOrBlurHandle, { capture: true });
    // "blur" on globalThis fires when the tab loses focus.
    globalThis.removeEventListener("blur", keyupOrBlurHandle);
    clearPressedKeys();
    clearComboKeys();
  }

  function keyupOrBlurHandle(event?: KeyboardEvent) {
    if (!recording()) {
      return;
    }

    // On keyup, release the key and finish once all keys are released.
    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      let remaining = 0;
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.delete(event.code);
        remaining = next.size;
        return next;
      });
      if (remaining) {
        return;
      }
    }

    const combo = comboKeys();
    setKeyWithDispatch(combo.size ? formatKeysCombo(combo) : null);
    stopRecordingKeys();
  }

  function keydownHandle(event: KeyboardEvent) {
    if (!recording() || event.repeat) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.code === "Escape") {
      setKeyWithDispatch(null);
      stopRecordingKeys();
      return;
    }

    setPressedKeys((prev) => {
      const next = new Set(prev);
      next.add(event.code);
      return next;
    });
    setComboKeys((prev) => {
      const next = new Set(prev);
      next.add(event.code);
      return next;
    });
  }

  function buttonClickHandle() {
    if (recording()) {
      return stopRecordingKeys();
    }

    setRecording(true);
    clearPressedKeys();
    clearComboKeys();
    document.addEventListener("keydown", keydownHandle, { capture: true });
    document.addEventListener("keyup", keyupOrBlurHandle, { capture: true });
    globalThis.addEventListener("blur", keyupOrBlurHandle);
  }

  onCleanup(stopRecordingKeys);

  return (
    <vot-block class="vot-hotkey">
      <Show when={finalProps.children}>
        <vot-block class="vot-hotkey-label">{finalProps.children}</vot-block>
      </Show>
      <RawButton
        {...buttonProps}
        buttonProps={{
          ...finalProps.buttonProps,
          "data-status": recording() ? "active" : undefined,
        }}
        class="vot-hotkey-button"
        onClick={buttonClickHandle}
      >
        {keyText()}
      </RawButton>
    </vot-block>
  );
}
