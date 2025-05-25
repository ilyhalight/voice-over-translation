import { EventImpl } from "../../core/eventImpl";
import type { TextfieldProps } from "../../types/components/textfield";
import UI from "../../ui";

export default class Textfield {
  container: HTMLElement;
  input: HTMLInputElement | HTMLTextAreaElement;
  label: HTMLSpanElement;

  private onInput = new EventImpl();
  private onChange = new EventImpl();

  private _labelHtml: HTMLElement | string;
  private _multiline: boolean;
  private _placeholder: string;
  private _value: string;

  constructor({
    labelHtml = "",
    placeholder = "",
    value = "",
    multiline = false,
  }: TextfieldProps) {
    this._labelHtml = labelHtml;
    this._multiline = multiline;
    this._placeholder = placeholder;
    this._value = value;

    const elements = this.createElements();
    this.container = elements.container;
    this.input = elements.input;
    this.label = elements.label;
  }

  private createElements() {
    const container = UI.createEl("vot-block", ["vot-textfield"]);
    const input = document.createElement(
      this._multiline ? "textarea" : "input",
    );
    if (!this._labelHtml) {
      input.classList.add("vot-show-placeholer");
    }
    input.placeholder = this._placeholder;
    input.value = this._value;

    const label = UI.createEl("span");
    label.append(this._labelHtml);
    container.append(input, label);
    input.addEventListener("input", () => {
      this._value = this.input.value;
      this.onInput.dispatch(this._value);
    });
    input.addEventListener("change", () => {
      this._value = this.input.value;
      this.onChange.dispatch(this._value);
    });

    return {
      container,
      label,
      input,
    };
  }

  addEventListener(
    type: "input" | "change",
    listener: (value: string) => void,
  ): this {
    if (type === "change") {
      this.onChange.addListener(listener);
    } else if (type === "input") {
      this.onInput.addListener(listener);
    }

    return this;
  }

  removeEventListener(
    type: "input" | "change",
    listener: (value: string) => void,
  ): this {
    if (type === "change") {
      this.onChange.removeListener(listener);
    } else if (type === "input") {
      this.onInput.removeListener(listener);
    }

    return this;
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
    this.onChange.dispatch(this._value);
  }

  get placeholder() {
    return this._placeholder;
  }

  set placeholder(text: string) {
    this.input.placeholder = this._placeholder = text;
  }

  set hidden(isHidden: boolean) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }
}
