import type { UiTemplate } from "../../types/components/shared";
import type { SliderProps } from "../../types/components/slider";
import UI from "../../ui";
import { clampNumber } from "../../utils/number";
import { render } from "../solid/render";
import { UIComponentWithEvents } from "./componentShared";

export default class Slider extends UIComponentWithEvents<{
  input: [value: number, fromSetter: boolean];
}> {
  input: HTMLInputElement;
  label: HTMLSpanElement;

  private readonly _labelHtml: UiTemplate;
  private _value: number;
  private _min: number;
  private _max: number;
  private _step: number;

  constructor({
    labelHtml,
    value = 50,
    min = 0,
    max = 100,
    step = 1,
  }: SliderProps) {
    super(["input"]);
    this._labelHtml = labelHtml;
    this._value = value;
    this._min = min;
    this._max = max;
    this._step = step;

    const { container, input, label } = this.createElements();
    this.container = container;
    this.input = input;
    this.label = label;
    this.update();
  }

  private updateProgress() {
    const range = this._max - this._min;
    const raw = range <= 0 ? 0 : (this._value - this._min) / range;
    const progress = clampNumber(raw, 0, 1);
    this.container.style.setProperty("--vot-progress", progress.toString());
    return this;
  }

  private update() {
    this._value = this.input.valueAsNumber;
    this._min = +this.input.min;
    this._max = +this.input.max;
    this.updateProgress();
    return this;
  }

  protected createElements() {
    const container = UI.createEl("vot-block", ["vot-slider"]);
    const input = document.createElement("input");
    input.type = "range";
    input.min = this._min.toString();
    input.max = this._max.toString();
    input.step = this._step.toString();
    input.value = this._value.toString();

    const label = UI.createEl("span");
    render(this._labelHtml, label);

    container.append(input, label);
    input.addEventListener("input", () => {
      this.update();
      this.dispatch("input", this._value, false);
    });

    return {
      container,
      label,
      input,
    };
  }

  get value() {
    return this._value;
  }

  /**
   * If you set a different new value, it will trigger the input event
   */
  set value(val: number) {
    // Keep the value in range to avoid NaN progress.
    this._value = clampNumber(val, this._min, this._max);
    this.input.value = this._value.toString();
    this.updateProgress();
    this.dispatch("input", this._value, true);
  }

  get min() {
    return this._min;
  }

  set min(val: number) {
    this._min = val;
    this.input.min = this._min.toString();
    this._value = clampNumber(this._value, this._min, this._max);
    this.input.value = this._value.toString();
    this.updateProgress();
  }

  get max() {
    return this._max;
  }

  set max(val: number) {
    this._max = val;
    this.input.max = this._max.toString();
    this._value = clampNumber(this._value, this._min, this._max);
    this.input.value = this._value.toString();
    this.updateProgress();
  }

  get step() {
    return this._step;
  }

  set step(val: number) {
    this._step = val;
    this.input.step = this._step.toString();
  }

  get disabled() {
    return this.input.disabled;
  }

  set disabled(isDisabled: boolean) {
    this.input.disabled = isDisabled;
  }
}
