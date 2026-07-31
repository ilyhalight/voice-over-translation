import { createMemo, createSignal, type JSX } from "solid-js";
import type { SliderLabelProps } from "../../types/components/sliderLabel";
import { mountComponent } from "../solid/mountComponent";
import { UIComponent } from "./componentShared";

type Api = { value: () => number; setValue: (value: number) => void };
function SliderLabelView(
  props: SliderLabelProps & {
    rootRef: (el: HTMLDivElement) => void;
    strongRef: (el: HTMLSpanElement) => void;
    textRef: (el: HTMLSpanElement) => void;
    bind: (api: Api) => void;
  },
): JSX.Element {
  const [value, setValue] = createSignal(props.value ?? 50);
  const valueText = createMemo(() => `${value()}${props.symbol ?? "%"}`);
  props.bind({ value, setValue });
  return (
    <div ref={props.rootRef} class="vot-slider-label">
      <span ref={props.textRef} class="vot-slider-label-text">
        {props.labelText}
        {props.labelEOL ?? ""}
      </span>
      <span ref={props.strongRef} class="vot-slider-label-value">
        {valueText()}
      </span>
    </div>
  );
}
export default class SliderLabel extends UIComponent {
  strong!: HTMLElement;
  text!: HTMLElement;
  private api!: Api;
  private dispose: () => void;
  constructor(props: SliderLabelProps) {
    super();
    const mounted = mountComponent<HTMLDivElement>((rootRef) => (
      <SliderLabelView
        {...props}
        rootRef={rootRef}
        strongRef={(el) => (this.strong = el)}
        textRef={(el) => (this.text = el)}
        bind={(api) => (this.api = api)}
      />
    ));
    this.container = mounted.root;
    this.dispose = mounted.dispose;
  }
  protected createElements(): never {
    throw new Error("Solid component");
  }
  get value() {
    return this.api.value();
  }
  set value(value: number) {
    this.api.setValue(value);
  }
  remove() {
    this.dispose();
    this.container.remove();
  }
}
