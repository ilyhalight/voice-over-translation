import { render } from "lit-html";
import type { LabelProps } from "../../types/components/label";
import type { LitHtml } from "../../types/components/shared";
import UI from "../../ui";
import { getHiddenState, setHiddenState } from "./componentShared";

export default class Label {
  container: HTMLElement;
  icon: HTMLElement;
  text: HTMLElement;

  private readonly _labelText: string;
  private readonly _icon?: LitHtml;

  constructor({ labelText, icon }: LabelProps) {
    this._labelText = labelText;
    this._icon = icon;

    const elements = this.createElements();
    this.container = elements.container;
    this.icon = elements.icon;
    this.text = elements.text;
  }

  private createElements() {
    const container = UI.createEl("vot-block", ["vot-label"]);

    // IMPORTANT:
    // Do NOT set `container.textContent` directly.
    // A text node becomes an anonymous flex/grid item in some layouts and can
    // push the icon to the far edge ("detached help icon" bug).
    // Wrap the text in a real element so we can style/wrap it predictably.
    const text = UI.createEl("span", ["vot-label-text"]);
    text.textContent = this._labelText;

    const icon = UI.createEl("span", ["vot-label-icon"]);
    if (this._icon) {
      render(this._icon, icon);
    } else {
      // Avoid reserving space for an icon when none is provided.
      icon.hidden = true;
    }

    container.append(text, icon);

    return {
      container,
      icon,
      text,
    };
  }

  set hidden(isHidden: boolean) {
    setHiddenState(this.container, isHidden);
  }

  get hidden() {
    return getHiddenState(this.container);
  }
}
