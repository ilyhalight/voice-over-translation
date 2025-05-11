import UI from "../../ui";
import { EventImpl } from "../../core/eventImpl";
import { DOWNLOAD_ICON } from "../icons";

export default class DownloadButton {
  button: HTMLElement;
  loaderMain: SVGPathElement;
  loaderText: SVGTextElement;

  private onClick = new EventImpl();
  private _progress = 0;

  constructor() {
    const elements = this.createElements();
    this.button = elements.button;
    this.loaderMain = elements.loaderMain;
    this.loaderText = elements.loaderText;
  }

  private createElements() {
    const button = UI.createIconButton(DOWNLOAD_ICON);
    const loaderMain =
      button.querySelector<SVGPathElement>(".vot-loader-main")!;
    const loaderText =
      button.querySelector<SVGTextElement>(".vot-loader-text")!;
    button.addEventListener("click", () => {
      this.onClick.dispatch();
    });
    return { button, loaderMain, loaderText };
  }

  addEventListener(type: "click", listener: () => void): this {
    this.onClick.addListener(listener);

    return this;
  }

  removeEventListener(type: "click", listener: () => void): this {
    this.onClick.removeListener(listener);

    return this;
  }

  get progress() {
    return this._progress;
  }

  set progress(value: number) {
    this._progress = value;
    this.loaderText.textContent = value === 0 ? "" : value.toString();
    if (value > 1) {
      return;
    }

    this.loaderMain.style.opacity = value === 0 ? "1" : "0";
  }

  set hidden(isHidden: boolean) {
    this.button.hidden = isHidden;
  }

  get hidden() {
    return this.button.hidden;
  }
}
