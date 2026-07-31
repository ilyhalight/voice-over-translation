import { createEffect, createSignal, onCleanup } from "solid-js";
import type { TextfieldProps } from "../../types/components/textfield";
import { mountComponent } from "../solid/mountComponent";
import { render } from "../solid/render";
import { UIComponentWithEvents } from "./componentShared";

type Api = {
  value: () => string;
  setValue: (value: string, emit?: boolean) => void;
  placeholder: () => string;
  setPlaceholder: (value: string) => void;
  disabled: () => boolean;
  setDisabled: (value: boolean) => void;
};
type ViewProps = TextfieldProps & {
  rootRef: (el: HTMLDivElement) => void;
  inputRef: (el: HTMLInputElement | HTMLTextAreaElement) => void;
  labelRef: (el: HTMLSpanElement) => void;
  bind: (api: Api) => void;
  onInput: (value: string) => void;
  onChange: (value: string) => void;
};

function TextfieldView(props: ViewProps): HTMLDivElement {
  const [value, setValueState] = createSignal(props.value ?? "");
  const [placeholder, setPlaceholder] = createSignal(props.placeholder ?? "");
  const [disabled, setDisabled] = createSignal(false);
  const root = document.createElement("div");
  const input = document.createElement(props.multiline ? "textarea" : "input");
  const label = document.createElement("span");
  root.className = "vot-textfield";
  if (!props.labelHtml)
    input.classList.add("vot-show-placeholer", "vot-show-placeholder");
  render(props.labelHtml, label);
  root.append(input, label);

  const setValue = (next: string, emit = true) => {
    if (value() === next) return;
    setValueState(next);
    if (emit) props.onChange(next);
  };
  const handleInput = () => {
    setValueState(input.value);
    props.onInput(input.value);
  };
  const handleChange = () => {
    setValueState(input.value);
    props.onChange(input.value);
  };
  input.addEventListener("input", handleInput);
  input.addEventListener("change", handleChange);
  onCleanup(() => {
    input.removeEventListener("input", handleInput);
    input.removeEventListener("change", handleChange);
  });
  createEffect(() => {
    if (input.value !== value()) input.value = value();
  });
  createEffect(() => {
    input.placeholder = placeholder();
  });
  createEffect(() => {
    input.disabled = disabled();
  });
  props.bind({
    value,
    setValue,
    placeholder,
    setPlaceholder,
    disabled,
    setDisabled,
  });
  props.rootRef(root);
  props.inputRef(input);
  props.labelRef(label);
  return root;
}

export default class Textfield extends UIComponentWithEvents<{
  input: [value: string];
  change: [value: string];
}> {
  input!: HTMLInputElement | HTMLTextAreaElement;
  label!: HTMLSpanElement;
  private api!: Api;
  private dispose: () => void;
  constructor(props: TextfieldProps) {
    super(["input", "change"]);
    const mounted = mountComponent<HTMLDivElement>((rootRef) =>
      TextfieldView({
        ...props,
        rootRef,
        inputRef: (el) => (this.input = el),
        labelRef: (el) => (this.label = el),
        bind: (api) => (this.api = api),
        onInput: (value) => this.dispatch("input", value),
        onChange: (value) => this.dispatch("change", value),
      }),
    );
    this.container = mounted.root;
    this.dispose = mounted.dispose;
  }
  get value() {
    return this.api.value();
  }
  set value(value: string) {
    this.api.setValue(value);
  }
  get placeholder() {
    return this.api.placeholder();
  }
  set placeholder(value: string) {
    this.api.setPlaceholder(value);
  }
  get disabled() {
    return this.api.disabled();
  }
  set disabled(value: boolean) {
    this.api.setDisabled(value);
  }
  remove() {
    this.dispose();
    this.container.remove();
  }
}
