import { EventImpl } from "../../core/eventImpl";
import type { DialogProps } from "../../types/components/dialog";
import UI from "../../ui";
import { CLOSE_ICON } from "../icons";

export default class Dialog {
  container: HTMLElement;
  backdrop: HTMLElement;
  box: HTMLElement;
  contentWrapper: HTMLElement;
  headerContainer: HTMLElement;
  titleContainer: HTMLElement;
  title: HTMLElement;
  closeButton: HTMLElement;
  bodyContainer: HTMLElement;
  footerContainer: HTMLElement;

  private onClose = new EventImpl();

  private _titleHtml: HTMLElement | string;
  private _isTemp: boolean;

  constructor({ titleHtml, isTemp = false }: DialogProps) {
    this._titleHtml = titleHtml;
    this._isTemp = isTemp;

    const elements = this.createElements();
    this.container = elements.container;
    this.backdrop = elements.backdrop;
    this.box = elements.box;

    this.contentWrapper = elements.contentWrapper;
    this.headerContainer = elements.headerContainer;
    this.titleContainer = elements.titleContainer;
    this.title = elements.title;
    this.closeButton = elements.closeButton;
    this.bodyContainer = elements.bodyContainer;
    this.footerContainer = elements.footerContainer;
  }

  private createElements() {
    const container = UI.createEl("vot-block", ["vot-dialog-container"]);
    if (this._isTemp) {
      container.classList.add("vot-dialog-temp");
    }

    container.hidden = !this._isTemp;

    const backdrop = UI.createEl("vot-block", ["vot-dialog-backdrop"]);
    const box = UI.createEl("vot-block", ["vot-dialog"]);
    const contentWrapper = UI.createEl("vot-block", [
      "vot-dialog-content-wrapper",
    ]);
    const headerContainer = UI.createEl("vot-block", [
      "vot-dialog-header-container",
    ]);
    const titleContainer = UI.createEl("vot-block", [
      "vot-dialog-title-container",
    ]);

    const title = UI.createEl("vot-block", ["vot-dialog-title"]);
    title.append(this._titleHtml);
    titleContainer.appendChild(title);

    const closeButton = UI.createIconButton(CLOSE_ICON);
    closeButton.classList.add("vot-dialog-close-button");
    backdrop.addEventListener("click", () => {
      this.close();
    });
    closeButton.addEventListener("click", () => {
      this.close();
    });

    headerContainer.append(titleContainer, closeButton);

    const bodyContainer = UI.createEl("vot-block", [
      "vot-dialog-body-container",
    ]);
    const footerContainer = UI.createEl("vot-block", [
      "vot-dialog-footer-container",
    ]);

    contentWrapper.append(headerContainer, bodyContainer, footerContainer);
    box.appendChild(contentWrapper);
    container.append(backdrop, box);

    return {
      container,
      backdrop,
      box,
      contentWrapper,
      headerContainer,
      titleContainer,
      title,
      closeButton,
      bodyContainer,
      footerContainer,
    };
  }

  addEventListener(type: "close", listener: () => void): this {
    this.onClose.addListener(listener);

    return this;
  }

  removeEventListener(type: "close", listener: () => void): this {
    this.onClose.removeListener(listener);

    return this;
  }

  open() {
    this.hidden = false;
    return this;
  }

  remove() {
    this.container.remove();
    this.onClose.dispatch();
    return this;
  }

  close() {
    if (this._isTemp) {
      return this.remove();
    }

    this.hidden = true;
    this.onClose.dispatch();
    return this;
  }

  set hidden(isHidden: boolean) {
    this.container.hidden = isHidden;
  }

  get hidden() {
    return this.container.hidden;
  }

  get isDialogOpen() {
    return !this.container.hidden;
  }
}
