import { createSignal, type JSX, mergeProps, Show, splitProps } from "solid-js";

import "./HotkeyButton.scss";
import { effect } from "solid-js/web";
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
  const finalProps = mergeProps({ key: null }, props);
  const [local, buttonProps] = splitProps(finalProps, [
    "children",
    "key",
    "buttonProps",
    "onChange",
  ]);

  const [key, setKey] = createSignal(local.key);
  const [recording, setRecording] = createSignal(false);
  const [pressedKeys, setPressedKeys] = createSignal(new Set<string>());
  const [comboKeys, setComboKeys] = createSignal(new Set<string>());

  const clearPressedKeys = () => setPressedKeys(new Set<string>());
  const clearComboKeys = () => setComboKeys(new Set<string>());

  const setKeyWithDispatch = (newKey: string | null) => {
    setKey(newKey);
    local.onChange?.(newKey);
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

  effect(() => {
    setKey(local.key);
  });

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
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.delete(event.code);
        return next;
      });
      if (pressedKeys().size) {
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

  return (
    <vot-block class="vot-hotkey">
      <Show when={local.children}>
        <vot-block class="vot-hotkey-label">{local.children}</vot-block>
      </Show>
      <RawButton
        {...buttonProps}
        buttonProps={{
          ...local.buttonProps,
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
