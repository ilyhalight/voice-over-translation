import type { Position } from "../../types/components/votButton";
import type { VOTMenuProps } from "../../types/components/votMenu";
import UI from "../../ui";

export default class VOTMenu {
  container: HTMLElement;
  contentWrapper: HTMLElement;
  headerContainer: HTMLElement;
  bodyContainer: HTMLElement;
  footerContainer: HTMLElement;
  titleContainer: HTMLElement;
  title: HTMLElement;

  private _position: Position;
  private _titleHtml: string;

  constructor({ position = "default", titleHtml = "" }: VOTMenuProps) {
    this._position = position;
    this._titleHtml = titleHtml;

    const elements = this.createElements();
    this.container = elements.container;
    this.contentWrapper = elements.contentWrapper;
    this.headerContainer = elements.headerContainer;
    this.bodyContainer = elements.bodyContainer;
    this.footerContainer = elements.footerContainer;
    this.titleContainer = elements.titleContainer;
    this.title = elements.title;
  }

  private createElements() {
    const container = UI.createEl("vot-block", ["vot-menu"]);
    container.hidden = true;
    container.dataset.position = this._position;

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
    title.append(this._titleHtml);
    titleContainer.appendChild(title);

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

  set hidden(isHidden: boolean) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }

  get position() {
    return this._position;
  }

  set position(position: Position) {
    this._position = this.container.dataset.position = position;
  }
}
