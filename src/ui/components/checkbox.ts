import { render } from "lit-html";

import { EventImpl } from "../../core/eventImpl";
import type { CheckboxProps } from "../../types/components/checkbox";
import type { LitHtml } from "../../types/components/shared";
import UI from "../../ui";

export default class Checkbox {
  container: HTMLElement;
  input: HTMLInputElement;
  label: HTMLSpanElement;

  private onChange = new EventImpl();

  private _labelHtml: LitHtml;
  private _checked: boolean;
  private _isSubCheckbox: boolean;

  constructor({
    labelHtml,
    checked = false,
    isSubCheckbox = false,
  }: CheckboxProps) {
    this._labelHtml = labelHtml;
    this._checked = checked;
    this._isSubCheckbox = isSubCheckbox;

    const elements = this.createElements();
    this.container = elements.container;
    this.input = elements.input;
    this.label = elements.label;
  }

  private createElements() {
    const container = UI.createEl("label", ["vot-checkbox"]);
    if (this._isSubCheckbox) {
      container.classList.add("vot-checkbox-sub");
    }

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = this._checked;
    input.addEventListener("change", () => {
      this._checked = input.checked;
      this.onChange.dispatch(this._checked);
    });

    const label = UI.createEl("span");
    render(this._labelHtml, label);

    container.append(input, label);
    return { container, input, label };
  }

  addEventListener(type: "change", listener: (checked: boolean) => void): this {
    this.onChange.addListener(listener);

    return this;
  }

  removeEventListener(
    type: "change",
    listener: (checked: boolean) => void,
  ): this {
    this.onChange.removeListener(listener);

    return this;
  }

  set hidden(isHidden: boolean) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }

  get disabled() {
    return this.input.disabled;
  }

  set disabled(isDisabled: boolean) {
    this.input.disabled = isDisabled;
  }

  get checked() {
    return this._checked;
  }

  /**
   * If you set a different new value, it will trigger the change event
   */
  set checked(isChecked: boolean) {
    if (this._checked === isChecked) {
      return;
    }

    this._checked = this.input.checked = isChecked;
    this.onChange.dispatch(this._checked);
  }
}
