import { createEffect, createSignal } from "solid-js";
import type { SliderLabelProps } from "../../types/components/sliderLabel";
import { mountComponent } from "../solid/mountComponent";
import { UIComponent } from "./componentShared";

type Api = { value: () => number; setValue: (value: number) => void };
type ViewProps = SliderLabelProps & {
  rootRef: (el: HTMLDivElement) => void;
  strongRef: (el: HTMLSpanElement) => void;
  textRef: (el: HTMLSpanElement) => void;
  bind: (api: Api) => void;
};

function SliderLabelView(props: ViewProps): HTMLDivElement {
  const [value, setValue] = createSignal(props.value ?? 50);
  const root = document.createElement("div");
  const text = document.createElement("span");
  const strong = document.createElement("span");
  root.className = "vot-slider-label";
  text.className = "vot-slider-label-text";
  strong.className = "vot-slider-label-value";
  text.textContent = `${props.labelText}${props.labelEOL ?? ""}`;
  createEffect(() => {
    strong.textContent = `${value()}${props.symbol ?? "%"}`;
  });
  root.append(text, strong);
  props.bind({ value, setValue });
  props.rootRef(root);
  props.strongRef(strong);
  props.textRef(text);
  return root;
}

export default class SliderLabel extends UIComponent {
  strong!: HTMLElement;
  text!: HTMLElement;
  private api!: Api;
  private dispose: () => void;
  constructor(props: SliderLabelProps) {
    super();
    const mounted = mountComponent<HTMLDivElement>((rootRef) =>
      SliderLabelView({
        ...props,
        rootRef,
        strongRef: (el) => (this.strong = el),
        textRef: (el) => (this.text = el),
        bind: (api) => (this.api = api),
      }),
    );
    this.container = mounted.root;
    this.dispose = mounted.dispose;
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
