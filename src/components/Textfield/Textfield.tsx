import {
  createEffect,
  createSignal,
  createUniqueId,
  type JSX,
  mergeProps,
  Show,
} from "solid-js";

import "./Textfield.scss";

export type TextfieldProps = {
  labelText: JSX.Element;
  placeholder?: string;
  value?: string;
  multiline?: boolean;
  disabled?: boolean;
  ref?: (element: HTMLDivElement) => void;
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
    <div ref={finalProps.ref} class="vot-textfield">
      <Show when={finalProps.multiline} fallback={<input {...common} />}>
        <textarea {...common} />
      </Show>
      <span ref={finalProps.labelRef} id={labelId}>
        {finalProps.labelText}
      </span>
    </div>
  );
}
