import { render } from "lit-html";
import type { LabelProps } from "../../types/components/label";
import type { LitHtml } from "../../types/components/shared";
import UI from "../../ui";
import { UIComponent } from "./componentShared";

export default class Label extends UIComponent {
  icon: HTMLElement;
  text: HTMLElement;

  private readonly _labelText: string;
  private readonly _icon?: LitHtml;

  constructor({ labelText, icon }: LabelProps) {
    super();
    this._labelText = labelText;
    this._icon = icon;

    const { container, icon: iconEl, text } = this.createElements();
    this.container = container;
    this.icon = iconEl;
    this.text = text;
  }

  protected createElements() {
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
}
