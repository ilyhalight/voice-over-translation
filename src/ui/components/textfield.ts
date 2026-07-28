import type { TextfieldProps } from "../../types/components/textfield";
import UI from "../../ui";
import { UIComponentWithEvents } from "./componentShared";

export default class Textfield extends UIComponentWithEvents<{
  input: [value: string];
  change: [value: string];
}> {
  input: HTMLInputElement | HTMLTextAreaElement;
  label: HTMLSpanElement;

  private readonly _labelHtml: HTMLElement | string;
  private readonly _multiline: boolean;
  private _placeholder: string;
  private _value: string;

  constructor({
    labelHtml = "",
    placeholder = "",
    value = "",
    multiline = false,
  }: TextfieldProps) {
    super(["input", "change"]);
    this._labelHtml = labelHtml;
    this._multiline = multiline;
    this._placeholder = placeholder;
    this._value = value;

    const { container, input, label } = this.createElements();
    this.container = container;
    this.input = input;
    this.label = label;
  }

  protected createElements() {
    const container = UI.createEl("vot-block", ["vot-textfield"]);
    const input = document.createElement(
      this._multiline ? "textarea" : "input",
    );
    if (!this._labelHtml) {
      // Backwards-compatible typo + correct class name.
      input.classList.add("vot-show-placeholer", "vot-show-placeholder");
    }
    input.placeholder = this._placeholder;
    input.value = this._value;

    const label = UI.createEl("span");
    label.append(this._labelHtml);
    container.append(input, label);
    input.addEventListener("input", () => {
      this._value = this.input.value;
      this.dispatch("input", this._value);
    });
    input.addEventListener("change", () => {
      this._value = this.input.value;
      this.dispatch("change", this._value);
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
   * If you set a different new value, it will trigger the change event
   */
  set value(val: string) {
    if (this._value === val) {
      return;
    }

    this.input.value = this._value = val;
    this.dispatch("change", this._value);
  }

  get placeholder() {
    return this._placeholder;
  }

  set placeholder(text: string) {
    this.input.placeholder = this._placeholder = text;
  }

  get disabled() {
    return this.input.disabled;
  }

  set disabled(isDisabled: boolean) {
    this.input.disabled = isDisabled;
  }
}
