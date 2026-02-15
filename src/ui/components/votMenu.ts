import type { Position } from "../../types/components/votButton";
import type { VOTMenuProps } from "../../types/components/votMenu";
import UI from "../../ui";
import { getHiddenState, setHiddenState } from "./componentShared";

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

  // A11y: stable ids for aria-controls / aria-labelledby.
  private readonly menuId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `vot-menu-${crypto.randomUUID()}`
      : `vot-menu-${Math.random().toString(36).slice(2)}`;

  private readonly titleId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `vot-menu-title-${crypto.randomUUID()}`
      : `vot-menu-title-${Math.random().toString(36).slice(2)}`;

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
    container.id = this.menuId;
    container.dataset.position = this._position;

    // Treat the quick settings menu as a non-modal dialog/popover.
    container.setAttribute("role", "dialog");
    container.setAttribute("aria-modal", "false");
    container.setAttribute("aria-hidden", "true");
    // Prevent keyboard focus from reaching hidden content.
    container.toggleAttribute("inert", true);

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

  set hidden(isHidden: boolean) {
    setHiddenState(this.container, isHidden);
    this.container.setAttribute("aria-hidden", isHidden ? "true" : "false");
    // `inert` prevents focus & interaction when hidden.
    this.container.toggleAttribute("inert", isHidden);
  }

  get hidden() {
    return getHiddenState(this.container);
  }

  get position() {
    return this._position;
  }

  set position(position: Position) {
    this._position = this.container.dataset.position = position;
  }
}
