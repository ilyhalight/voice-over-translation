import { createSignal, type JSX, Show } from "solid-js";
import type { TextfieldProps } from "../../types/components/textfield";
import { mountComponent } from "../solid/mountComponent";
import { UIComponentWithEvents } from "./componentShared";

type Api = {
  value: () => string;
  setValue: (value: string, emit?: boolean) => void;
  placeholder: () => string;
  setPlaceholder: (value: string) => void;
  disabled: () => boolean;
  setDisabled: (value: boolean) => void;
};
function TextfieldView(
  props: TextfieldProps & {
    rootRef: (el: HTMLDivElement) => void;
    inputRef: (el: HTMLInputElement | HTMLTextAreaElement) => void;
    labelRef: (el: HTMLSpanElement) => void;
    bind: (api: Api) => void;
    onInput: (value: string) => void;
    onChange: (value: string) => void;
  },
): JSX.Element {
  const [value, setValueState] = createSignal(props.value ?? "");
  const [placeholder, setPlaceholder] = createSignal(props.placeholder ?? "");
  const [disabled, setDisabled] = createSignal(false);
  const setValue = (next: string, emit = true) => {
    if (value() === next) return;
    setValueState(next);
    if (emit) props.onChange(next);
  };
  props.bind({
    value,
    setValue,
    placeholder,
    setPlaceholder,
    disabled,
    setDisabled,
  });
  const common = {
    ref: props.inputRef,
    class: !props.labelHtml
      ? "vot-show-placeholer vot-show-placeholder"
      : undefined,
    placeholder: placeholder(),
    value: value(),
    disabled: disabled(),
    onInput: (
      event: InputEvent & {
        currentTarget: HTMLInputElement | HTMLTextAreaElement;
      },
    ) => {
      const next = event.currentTarget.value;
      setValueState(next);
      props.onInput(next);
    },
    onChange: (
      event: Event & { currentTarget: HTMLInputElement | HTMLTextAreaElement },
    ) => {
      const next = event.currentTarget.value;
      setValueState(next);
      props.onChange(next);
    },
  };
  return (
    <div ref={props.rootRef} class="vot-textfield">
      <Show when={props.multiline} fallback={<input {...common} />}>
        <textarea {...common} />
      </Show>
      <span ref={props.labelRef}>{props.labelHtml}</span>
    </div>
  );
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
    const mounted = mountComponent<HTMLDivElement>((rootRef) => (
      <TextfieldView
        {...props}
        rootRef={rootRef}
        inputRef={(el) => (this.input = el)}
        labelRef={(el) => (this.label = el)}
        bind={(api) => (this.api = api)}
        onInput={(value) => this.dispatch("input", value)}
        onChange={(value) => this.dispatch("change", value)}
      />
    ));
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
