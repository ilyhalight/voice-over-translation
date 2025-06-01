import type { SliderLabelProps } from "../../types/components/sliderLabel";
import UI from "../../ui";

export default class SliderLabel {
  container: HTMLSpanElement;
  strong: HTMLElement;

  private _labelText: string;
  private _labelEOL: string;
  private _value: number;
  private _symbol: string;

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
  }

  private createElements() {
    const container = UI.createEl("vot-block", ["vot-slider-label"]);
    container.textContent = this.labelText;

    const strong = UI.createEl("strong", ["vot-slider-label-value"]);
    strong.textContent = this.valueText;

    container.append(strong);

    return {
      container,
      strong,
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
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }
}
