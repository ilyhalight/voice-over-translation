import { createSignal, type JSX } from "solid-js";
import type { CheckboxProps } from "../../types/components/checkbox";
import { mountComponent } from "../solid/mountComponent";
import { UIComponentWithEvents } from "./componentShared";

type CheckboxApi = {
  checked: () => boolean;
  setChecked: (value: boolean, emit?: boolean) => void;
  disabled: () => boolean;
  setDisabled: (value: boolean) => void;
};

function CheckboxView(
  props: CheckboxProps & {
    bind: (api: CheckboxApi) => void;
    rootRef: (el: HTMLLabelElement) => void;
    inputRef: (el: HTMLInputElement) => void;
    labelRef: (el: HTMLSpanElement) => void;
    onChange: (value: boolean) => void;
  },
): JSX.Element {
  const [checked, setCheckedState] = createSignal(props.checked ?? false);
  const [disabled, setDisabled] = createSignal(false);
  const setChecked = (value: boolean, emit = true) => {
    if (checked() === value) return;
    setCheckedState(value);
    if (emit) props.onChange(value);
  };
  props.bind({ checked, setChecked, disabled, setDisabled });
  return (
    <label
      ref={props.rootRef}
      class="vot-checkbox"
      classList={{ "vot-checkbox-sub": props.isSubCheckbox === true }}
    >
      <input
        ref={props.inputRef}
        type="checkbox"
        checked={checked()}
        disabled={disabled()}
        onChange={(event) => setChecked(event.currentTarget.checked)}
      />
      <span ref={props.labelRef}>{props.labelHtml}</span>
    </label>
  );
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
    const mounted = mountComponent<HTMLLabelElement>((rootRef) => (
      <CheckboxView
        {...props}
        rootRef={rootRef}
        inputRef={(el) => (this.input = el)}
        labelRef={(el) => (this.label = el)}
        bind={(api) => (this.api = api)}
        onChange={(value) => this.dispatch("change", value)}
      />
    ));
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
