import { render } from "lit-html";

import UI from "../../ui";
import { MENU_ICON, PIP_ICON_SVG, TRANSLATE_ICON_SVG } from "../icons";
import type {
  Direction,
  Position,
  Status,
  VOTButtonProps,
} from "../../types/components/votButton";

export default class VOTButton {
  container: HTMLElement;
  translateButton: HTMLElement;
  separator: HTMLElement;
  pipButton: HTMLElement;
  separator2: HTMLElement;
  menuButton: HTMLElement;
  label: HTMLElement;

  private _position: Position;
  private _direction: Direction;
  private _status: Status;
  private _labelHtml: string;

  constructor({
    position = "default",
    direction = "default",
    status = "none",
    labelHtml = "",
  }: VOTButtonProps) {
    this._position = position;
    this._direction = direction;
    this._status = status;
    this._labelHtml = labelHtml;

    const elements = this.createElements();
    this.container = elements.container;
    this.translateButton = elements.translateButton;
    this.separator = elements.separator;
    this.pipButton = elements.pipButton;
    this.separator2 = elements.separator2;
    this.menuButton = elements.menuButton;
    this.label = elements.label;
  }

  static calcPosition(percentX: number, isBigContainer: boolean): Position {
    if (!isBigContainer) {
      return "default";
    }

    return percentX <= 44 ? "left" : percentX >= 66 ? "right" : "default";
  }

  static calcDirection(position: Position) {
    return ["default", "top"].includes(position) ? "row" : "column";
  }

  private createElements() {
    const container = UI.createEl("vot-block", ["vot-segmented-button"]);
    container.dataset.position = this._position;
    container.dataset.direction = this._direction;
    container.dataset.status = this._status;
    const translateButton = UI.createEl("vot-block", [
      "vot-segment",
      "vot-translate-button",
    ]);
    render(TRANSLATE_ICON_SVG, translateButton);

    const label = UI.createEl("span", ["vot-segment-label"]);
    label.append(this._labelHtml);
    translateButton.appendChild(label);

    const separator = UI.createEl("vot-block", ["vot-separator"]);
    const pipButton = UI.createEl("vot-block", ["vot-segment-only-icon"]);
    render(PIP_ICON_SVG, pipButton);

    const separator2 = UI.createEl("vot-block", ["vot-separator"]);
    const menuButton = UI.createEl("vot-block", ["vot-segment-only-icon"]);
    render(MENU_ICON, menuButton);

    container.append(
      translateButton,
      separator,
      pipButton,
      separator2,
      menuButton,
    );
    return {
      container,
      translateButton,
      separator,
      pipButton,
      separator2,
      menuButton,
      label,
    };
  }

  showPiPButton(visible: boolean) {
    this.separator2.hidden = this.pipButton.hidden = !visible;
    return this;
  }

  setText(labelText: string) {
    this._labelHtml = this.label.textContent = labelText;
    return this;
  }

  remove() {
    this.container.remove();
    return this;
  }

  get tooltipPos() {
    switch (this.position) {
      case "left":
        return "right";
      case "right":
        return "left";
      default:
        return "bottom";
    }
  }

  set status(status: Status) {
    this._status = this.container.dataset.status = status;
  }

  get status() {
    return this._status;
  }

  set loading(isLoading: boolean) {
    this.container.dataset.loading = isLoading.toString();
  }

  get loading() {
    return this.container.dataset.loading === "true";
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

  get direction() {
    return this._direction;
  }

  set direction(direction: Direction) {
    this._direction = this.container.dataset.direction = direction;
  }

  set opacity(opacity: number) {
    this.container.style.opacity = opacity.toString();
  }

  get opacity() {
    return Number(this.container.style.opacity);
  }
}
