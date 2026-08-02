import { render } from "lit-html";

import type { CheckboxProps } from "../../types/components/checkbox";
import type { LitHtml } from "../../types/components/shared";
import UI from "../../ui";
import { UIComponentWithEvents } from "./componentShared";

export default class Checkbox extends UIComponentWithEvents<{
  change: [checked: boolean];
}> {
  input: HTMLInputElement;
  label: HTMLSpanElement;

  private readonly _labelHtml: LitHtml;
  private _checked: boolean;
  private readonly _isSubCheckbox: boolean;

  constructor({
    labelHtml,
    checked = false,
    isSubCheckbox = false,
  }: CheckboxProps) {
    super(["change"]);
    this._labelHtml = labelHtml;
    this._checked = checked;
    this._isSubCheckbox = isSubCheckbox;

    const { container, input, label } = this.createElements();
    this.container = container;
    this.input = input;
    this.label = label;
  }

  protected createElements() {
    const container = UI.createEl("label", ["vot-checkbox"]);
    if (this._isSubCheckbox) {
      container.classList.add("vot-checkbox-sub");
    }

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = this._checked;
    input.addEventListener("change", () => {
      this._checked = input.checked;
      this.dispatch("change", this._checked);
    });

    const label = UI.createEl("span");
    render(this._labelHtml, label);

    container.append(input, label);
    return { container, input, label };
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
    this.dispatch("change", this._checked);
  }
}
