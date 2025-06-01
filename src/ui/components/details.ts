import { render } from "lit-html";

import { EventImpl } from "../../core/eventImpl";
import type { DetailsProps } from "../../types/components/details";
import UI from "../../ui";
import { CHEVRON_ICON } from "../icons";

export default class Details {
  container: HTMLElement;
  header: HTMLElement;
  arrowIcon: HTMLElement;

  private onClick = new EventImpl();

  private _titleHtml: HTMLElement | string;

  constructor({ titleHtml }: DetailsProps) {
    this._titleHtml = titleHtml;

    const elements = this.createElements();
    this.container = elements.container;
    this.header = elements.header;
    this.arrowIcon = elements.arrowIcon;
  }

  private createElements() {
    const container = UI.createEl("vot-block", ["vot-details"]);

    const header = UI.createEl("vot-block");
    header.append(this._titleHtml);

    const arrowIcon = UI.createEl("vot-block", ["vot-details-arrow-icon"]);
    render(CHEVRON_ICON, arrowIcon);
    container.append(header, arrowIcon);
    container.addEventListener("click", () => {
      this.onClick.dispatch();
    });

    return {
      container,
      header,
      arrowIcon,
    };
  }

  addEventListener(type: "click", listener: () => void): this {
    this.onClick.addListener(listener);

    return this;
  }

  removeEventListener(type: "click", listener: () => void): this {
    this.onClick.removeListener(listener);

    return this;
  }

  set hidden(isHidden: boolean) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }
}
