import { createEffect, createSignal, onCleanup } from "solid-js";
import type { CheckboxProps } from "../../types/components/checkbox";
import { mountComponent } from "../solid/mountComponent";
import { render } from "../solid/render";
import { UIComponentWithEvents } from "./componentShared";

type CheckboxApi = {
  checked: () => boolean;
  setChecked: (value: boolean, emit?: boolean) => void;
  disabled: () => boolean;
  setDisabled: (value: boolean) => void;
};

type CheckboxViewProps = CheckboxProps & {
  bind: (api: CheckboxApi) => void;
  rootRef: (el: HTMLLabelElement) => void;
  inputRef: (el: HTMLInputElement) => void;
  labelRef: (el: HTMLSpanElement) => void;
  onChange: (value: boolean) => void;
};

function CheckboxView(props: CheckboxViewProps): HTMLLabelElement {
  const [checked, setCheckedState] = createSignal(props.checked ?? false);
  const [disabled, setDisabled] = createSignal(false);
  const root = document.createElement("label");
  const input = document.createElement("input");
  const label = document.createElement("span");

  root.className = "vot-checkbox";
  root.classList.toggle("vot-checkbox-sub", props.isSubCheckbox === true);
  input.type = "checkbox";
  render(props.labelHtml, label);
  root.append(input, label);

  const setChecked = (value: boolean, emit = true) => {
    if (checked() === value) return;
    setCheckedState(value);
    if (emit) props.onChange(value);
  };
  const handleChange = () => setChecked(input.checked);
  input.addEventListener("change", handleChange);
  onCleanup(() => input.removeEventListener("change", handleChange));

  createEffect(() => {
    input.checked = checked();
  });
  createEffect(() => {
    input.disabled = disabled();
  });
  props.bind({ checked, setChecked, disabled, setDisabled });
  props.rootRef(root);
  props.inputRef(input);
  props.labelRef(label);
  return root;
}

export default class Checkbox extends UIComponentWithEvents<{
  change: [checked: boolean];
}> {
  input!: HTMLInputElement;
  label!: HTMLSpanElement;
  private api!: CheckboxApi;
  private dispose: () => void;

  constructor(props: CheckboxProps) {
    super(["change"]);
    const mounted = mountComponent<HTMLLabelElement>((rootRef) =>
      CheckboxView({
        ...props,
        rootRef,
        inputRef: (el) => (this.input = el),
        labelRef: (el) => (this.label = el),
        bind: (api) => (this.api = api),
        onChange: (value) => this.dispatch("change", value),
      }),
    );
    this.container = mounted.root;
    this.dispose = mounted.dispose;
  }
  get disabled() {
    return this.api.disabled();
  }
  set disabled(value: boolean) {
    this.api.setDisabled(value);
  }
  get checked() {
    return this.api.checked();
  }
  set checked(value: boolean) {
    this.api.setChecked(value);
  }
  remove() {
    this.dispose();
    this.container.remove();
  }
}
