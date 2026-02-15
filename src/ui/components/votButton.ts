import { render } from "lit-html";

import type {
  Direction,
  Position,
  Status,
  VOTButtonProps,
} from "../../types/components/votButton";
import UI from "../../ui";
import { MENU_ICON, PIP_ICON_SVG, TRANSLATE_ICON_SVG } from "../icons";
import { getHiddenState, setHiddenState } from "./componentShared";

export default class VOTButton {
  container: HTMLElement;
  translateButton: HTMLElement;
  separator: HTMLElement;
  pipButton: HTMLElement;
  separator2: HTMLElement;
  menuButton: HTMLElement;
  label: HTMLElement;

  // Opacity is driven by a CSS class so host pages cannot break visibility by
  // writing inline `style="opacity:0; pointer-events:none"`.
  private _opacity = 1;

  private _position: Position;
  private _direction: Direction;
  private _status: Status;
  /** Text shown next to the translate icon (plain text, not HTML). */
  private _labelText: string;

  constructor({
    position = "default",
    direction = "default",
    status = "none",
    labelHtml = "",
  }: VOTButtonProps) {
    this._position = position;
    this._direction = direction;
    this._status = status;
    this._labelText = labelHtml;

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

    if (percentX <= 44) {
      return "left";
    }
    if (percentX >= 66) {
      return "right";
    }
    return "default";
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
    // A11y: make custom elements keyboard-accessible.
    translateButton.setAttribute("role", "button");
    translateButton.tabIndex = 0;
    translateButton.setAttribute("aria-label", this._labelText || "Translate");
    render(TRANSLATE_ICON_SVG, translateButton);

    const label = UI.createEl("span", ["vot-segment-label"]);
    label.textContent = this._labelText;
    translateButton.appendChild(label);

    const separator = UI.createEl("vot-block", ["vot-separator"]);
    const pipButton = UI.createEl("vot-block", ["vot-segment-only-icon"]);
    pipButton.setAttribute("role", "button");
    pipButton.tabIndex = 0;
    pipButton.setAttribute("aria-label", "Picture in picture");
    render(PIP_ICON_SVG, pipButton);

    const separator2 = UI.createEl("vot-block", ["vot-separator"]);
    const menuButton = UI.createEl("vot-block", ["vot-segment-only-icon"]);
    menuButton.setAttribute("role", "button");
    menuButton.tabIndex = 0;
    menuButton.setAttribute("aria-label", "Menu");
    // Opens a quick-settings popover (non-modal dialog).
    menuButton.setAttribute("aria-haspopup", "dialog");
    menuButton.setAttribute("aria-expanded", "false");
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
    this._labelText = labelText;
    this.label.textContent = labelText;
    this.translateButton.setAttribute("aria-label", labelText || "Translate");
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
    setHiddenState(this.container, isHidden);
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

  get direction() {
    return this._direction;
  }

  set direction(direction: Direction) {
    this._direction = this.container.dataset.direction = direction;
  }

  set opacity(opacity: number) {
    const o = Number.isFinite(opacity) ? opacity : 1;
    this._opacity = o;

    const isHidden = o <= 0.01;
    this.container.classList.toggle("vot-segmented-button--hidden", isHidden);
  }

  get opacity() {
    return this._opacity;
  }
}
