import { render } from "lit-html";

import { EventImpl } from "../../core/eventImpl";
import type { DetailsProps } from "../../types/components/details";
import UI from "../../ui";
import { CHEVRON_ICON } from "../icons";
import {
  addComponentEventListener,
  getHiddenState,
  removeComponentEventListener,
  setHiddenState,
} from "./componentShared";

export default class Details {
  container: HTMLElement;
  header: HTMLElement;
  arrowIcon: HTMLElement;

  private readonly onClick = new EventImpl();
  private readonly events = {
    click: this.onClick,
  };

  private readonly _titleHtml: HTMLElement | string;

  constructor({ titleHtml }: DetailsProps) {
    this._titleHtml = titleHtml;

    const elements = this.createElements();
    this.container = elements.container;
    this.header = elements.header;
    this.arrowIcon = elements.arrowIcon;
  }

  private createElements() {
    const container = UI.createEl("vot-block", ["vot-details"]);

    // A11y: make the custom element keyboard-accessible.
    UI.makeButtonLike(container);

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

  addEventListener(_type: "click", listener: () => void): this {
    addComponentEventListener(this.events, "click", listener);

    return this;
  }

  removeEventListener(_type: "click", listener: () => void): this {
    removeComponentEventListener(this.events, "click", listener);

    return this;
  }

  set hidden(isHidden: boolean) {
    setHiddenState(this.container, isHidden);
  }

  get hidden() {
    return getHiddenState(this.container);
  }
}
