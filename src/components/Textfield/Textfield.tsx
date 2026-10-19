import {
  createEffect,
  createSignal,
  createUniqueId,
  type JSX,
  mergeProps,
  onCleanup,
  Show,
} from "solid-js";

import "./Textfield.scss";

export type TextfieldProps = {
  labelText: JSX.Element;
  placeholder?: string;
  value?: string;
  multiline?: boolean;
  disabled?: boolean;
  ref?: (element: HTMLElement) => void;
  inputRef?: (element: HTMLInputElement | HTMLTextAreaElement) => void;
  labelRef?: (element: HTMLSpanElement) => void;
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
};

export function Textfield(props: TextfieldProps): JSX.Element {
  const finalProps = mergeProps(
    {
      value: "",
      placeholder: "",
      multiline: false,
      disabled: false,
    },
    props,
  );
  const labelId = createUniqueId();
  const [value, setValue] = createSignal(finalProps.value);

  createEffect(() => setValue(finalProps.value));

  const stopKeyEvent = (event: KeyboardEvent) => event.stopPropagation();
  const removeHostKeyboardListeners = () => {
    globalThis.removeEventListener("keydown", stopKeyEvent, true);
    globalThis.removeEventListener("keypress", stopKeyEvent, true);
    globalThis.removeEventListener("keyup", stopKeyEvent, true);
  };

  onCleanup(removeHostKeyboardListeners);

  const common = {
    ref: finalProps.inputRef,
    get class() {
      return finalProps.labelText ? undefined : "vot-show-placeholer";
    },
    get placeholder() {
      return finalProps.placeholder;
    },
    get value() {
      return value();
    },
    get disabled() {
      return finalProps.disabled;
    },
    "aria-labelledby": labelId,
    onFocus: () => {
      // ? we use global listeners for compatibility with other extensions like SponsorBlock that have own global listeners
      globalThis.addEventListener("keydown", stopKeyEvent, { capture: true });
      globalThis.addEventListener("keypress", stopKeyEvent, { capture: true });
      globalThis.addEventListener("keyup", stopKeyEvent, { capture: true });
    },
    onBlur: removeHostKeyboardListeners,
    onInput: (
      event: InputEvent & {
        currentTarget: HTMLInputElement | HTMLTextAreaElement;
      },
    ) => {
      const next = event.currentTarget.value;
      setValue(next);
      finalProps.onInput?.(next);
    },
    onChange: (
      event: Event & {
        currentTarget: HTMLInputElement | HTMLTextAreaElement;
      },
    ) => {
      const next = event.currentTarget.value;
      setValue(next);
      finalProps.onChange?.(next);
    },
  };

  return (
    <vot-block ref={finalProps.ref} class="vot-textfield">
      <Show when={finalProps.multiline} fallback={<input {...common} />}>
        <textarea {...common} />
      </Show>
      <vot-block
        ref={finalProps.labelRef}
        id={labelId}
        class="vot-textfield__label"
      >
        {finalProps.labelText}
      </vot-block>
    </vot-block>
  );
}
