import { EventImpl } from "../../core/eventImpl";
import type { TextfieldProps } from "../../types/components/textfield";
import UI from "../../ui";
import {
  addComponentEventListener,
  getHiddenState,
  removeComponentEventListener,
  setHiddenState,
} from "./componentShared";

export default class Textfield {
  container: HTMLElement;
  input: HTMLInputElement | HTMLTextAreaElement;
  label: HTMLSpanElement;

  private readonly onInput = new EventImpl<[string]>();
  private readonly onChange = new EventImpl<[string]>();
  private readonly events = {
    input: this.onInput,
    change: this.onChange,
  };

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
    addComponentEventListener(this.events, type, listener);

    return this;
  }

  removeEventListener(
    type: "input" | "change",
    listener: (value: string) => void,
  ): this {
    removeComponentEventListener(this.events, type, listener);

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
