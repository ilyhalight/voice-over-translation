import type { Position } from "../../types/components/votButton";
import type { VOTMenuProps } from "../../types/components/votMenu";
import UI from "../../ui";
import {
  createDomId,
  setInteractiveHiddenState,
  UIComponent,
} from "./componentShared";

export default class VOTMenu extends UIComponent {
  contentWrapper: HTMLElement;
  headerContainer: HTMLElement;
  bodyContainer: HTMLElement;
  footerContainer: HTMLElement;
  titleContainer: HTMLElement;
  title: HTMLElement;

  private _position: Position;
  private _titleHtml: string;

  // A11y: stable ids for aria-controls / aria-labelledby.
  private readonly menuId = createDomId("vot-menu");
  private readonly titleId = createDomId("vot-menu-title");

  constructor({ position = "default", titleHtml = "" }: VOTMenuProps) {
    super();
    this._position = position;
    this._titleHtml = titleHtml;

    const {
      container,
      contentWrapper,
      headerContainer,
      bodyContainer,
      footerContainer,
      titleContainer,
      title,
    } = this.createElements();
    this.container = container;
    this.contentWrapper = contentWrapper;
    this.headerContainer = headerContainer;
    this.bodyContainer = bodyContainer;
    this.footerContainer = footerContainer;
    this.titleContainer = titleContainer;
    this.title = title;
  }

  protected createElements() {
    const container = UI.createEl("vot-block", ["vot-menu"]);
    container.hidden = true;
    container.id = this.menuId;
    container.dataset.position = this._position;

    // Treat the quick settings menu as a non-modal dialog/popover.
    container.setAttribute("role", "dialog");
    container.setAttribute("aria-modal", "false");
    setInteractiveHiddenState(container, true);

    const contentWrapper = UI.createEl("vot-block", [
      "vot-menu-content-wrapper",
    ]);
    container.appendChild(contentWrapper);

    // header
    const headerContainer = UI.createEl("vot-block", [
      "vot-menu-header-container",
    ]);
    const titleContainer = UI.createEl("vot-block", [
      "vot-menu-title-container",
    ]);
    headerContainer.appendChild(titleContainer);
    const title = UI.createEl("vot-block", ["vot-menu-title"]);
    title.id = this.titleId;
    title.append(this._titleHtml);
    titleContainer.appendChild(title);

    container.setAttribute("aria-labelledby", this.titleId);

    // body & footer
    const bodyContainer = UI.createEl("vot-block", ["vot-menu-body-container"]);
    const footerContainer = UI.createEl("vot-block", [
      "vot-menu-footer-container",
    ]);

    contentWrapper.append(headerContainer, bodyContainer, footerContainer);
    return {
      container,
      contentWrapper,
      headerContainer,
      bodyContainer,
      footerContainer,
      titleContainer,
      title,
    };
  }

  setText(titleText: string) {
    this._titleHtml = this.title.textContent = titleText;
    return this;
  }

  remove() {
    this.container.remove();
    return this;
  }

  override set hidden(isHidden: boolean) {
    setInteractiveHiddenState(this.container, isHidden);
  }

  get position() {
    return this._position;
  }

  set position(position: Position) {
    this._position = this.container.dataset.position = position;
  }
}
