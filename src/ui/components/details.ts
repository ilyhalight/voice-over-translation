import type { DetailsProps } from "../../types/components/details";
import UI from "../../ui";
import { appendTemplate } from "../appendTemplate";
import { CHEVRON_ICON } from "../icons";
import { UIComponentWithEvents } from "./componentShared";

export default class Details extends UIComponentWithEvents<{
  click: [];
}> {
  header: HTMLElement;
  arrowIcon: HTMLElement;

  private readonly _titleHtml: HTMLElement | string;

  constructor({ titleHtml }: DetailsProps) {
    super(["click"]);
    this._titleHtml = titleHtml;

    const { container, header, arrowIcon } = this.createElements();
    this.container = container;
    this.header = header;
    this.arrowIcon = arrowIcon;
  }

  protected createElements() {
    const container = UI.createEl("vot-block", ["vot-details"]);

    // A11y: make the custom element keyboard-accessible.
    UI.makeButtonLike(container);

    const header = UI.createEl("vot-block");
    header.append(this._titleHtml);

    const arrowIcon = UI.createEl("vot-block", ["vot-details-arrow-icon"]);
    appendTemplate(CHEVRON_ICON, arrowIcon);
    container.append(header, arrowIcon);
    container.addEventListener("click", () => {
      this.dispatch("click");
    });

    return {
      container,
      header,
      arrowIcon,
    };
  }
}
