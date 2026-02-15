import { render } from "lit-html";

import { EventImpl } from "../../core/eventImpl";
import type { LitHtml } from "../../types/components/shared";
import type { SliderProps } from "../../types/components/slider";
import UI from "../../ui";
import { getHiddenState, setHiddenState } from "./componentShared";

export default class Slider {
  container: HTMLElement;
  input: HTMLInputElement;
  label: HTMLSpanElement;

  private readonly onInput = new EventImpl<[number, boolean]>();

  private readonly _labelHtml: LitHtml;
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
    this._labelHtml = labelHtml;
    this._value = value;
    this._min = min;
    this._max = max;
    this._step = step;

    const elements = this.createElements();
    this.container = elements.container;
    this.input = elements.input;
    this.label = elements.label;
    this.update();
  }

  private updateProgress() {
    const range = this._max - this._min;
    const raw = range <= 0 ? 0 : (this._value - this._min) / range;
    const progress = Math.max(0, Math.min(1, raw));
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

  private createElements() {
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
      this.onInput.dispatch(this._value, false);
    });

    return {
      container,
      label,
      input,
    };
  }

  addEventListener(
    _type: "input",
    listener: (value: number, fromSetter: boolean) => void,
  ): this {
    this.onInput.addListener(listener);

    return this;
  }

  removeEventListener(
    _type: "input",
    listener: (value: number, fromSetter: boolean) => void,
  ): this {
    this.onInput.removeListener(listener);

    return this;
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
    this.onInput.dispatch(this._value, true);
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

  set hidden(isHidden: boolean) {
    setHiddenState(this.container, isHidden);
  }

  get hidden() {
    return getHiddenState(this.container);
  }
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  if (max < min) return min;
  return Math.max(min, Math.min(max, value));
}
