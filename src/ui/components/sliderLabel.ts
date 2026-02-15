import type { SliderLabelProps } from "../../types/components/sliderLabel";
import UI from "../../ui";
import { getHiddenState, setHiddenState } from "./componentShared";

export default class SliderLabel {
  container: HTMLSpanElement;
  strong: HTMLElement;
  text: HTMLElement;

  private readonly _labelText: string;
  private readonly _labelEOL: string;
  private _value: number;
  private readonly _symbol: string;

  constructor({
    labelText,
    labelEOL = "",
    value = 50,
    symbol = "%",
  }: SliderLabelProps) {
    this._labelText = labelText;
    this._labelEOL = labelEOL;
    this._value = value;
    this._symbol = symbol;

    const elements = this.createElements();
    this.container = elements.container;
    this.strong = elements.strong;
    this.text = elements.text;
  }

  private createElements() {
    const container = UI.createEl("vot-block", ["vot-slider-label"]);

    // IMPORTANT:
    // Keep the label text in its own element.
    // A raw text node becomes an anonymous layout item in flex/grid containers
    // and can cause misalignment of the value column.
    const text = UI.createEl("span", ["vot-slider-label-text"]);
    text.textContent = this.labelText;

    // Value should not be overly bold/attention-grabbing; styling is handled in CSS.
    const strong = UI.createEl("span", ["vot-slider-label-value"]);
    strong.textContent = this.valueText;

    container.append(text, strong);

    return {
      container,
      strong,
      text,
    };
  }

  get labelText() {
    return `${this._labelText}${this._labelEOL}`;
  }

  get valueText() {
    return `${this._value}${this._symbol}`;
  }

  get value() {
    return this._value;
  }

  set value(val: number) {
    this._value = val;
    this.strong.textContent = this.valueText;
  }

  set hidden(isHidden: boolean) {
    setHiddenState(this.container, isHidden);
  }

  get hidden() {
    return getHiddenState(this.container);
  }
}
