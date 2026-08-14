import { localizationProvider } from "../../localization/localizationProvider";
import type {
  Direction,
  Position,
  Status,
  VOTButtonProps,
} from "../../types/components/votButton";
import UI from "../../ui";
import { appendTemplate } from "../appendTemplate";
import {
  CHEVRON_ICON,
  MENU_ICON,
  PIP_ICON_SVG,
  SUBTITLES_ICON,
  TRANSLATE_ICON_SVG,
} from "../icons";
import { setInteractiveHiddenState, UIComponent } from "./componentShared";

function isSidePosition(position: Position): boolean {
  return (
    position === "left" ||
    position === "right" ||
    position === "leftCenter" ||
    position === "rightCenter"
  );
}

export default class VOTButton extends UIComponent {
  translateButton: HTMLElement;
  dropdownArrow: HTMLElement;
  separator: HTMLElement;
  subtitlesButton: HTMLElement;
  separator3: HTMLElement;
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
  private _subtitlesActive = false;
  /** Text shown next to the translate icon (plain text, not HTML). */
  private _labelText: string;

  constructor({
    position = "default",
    direction = "default",
    status = "none",
    labelHtml = "",
  }: VOTButtonProps) {
    super();
    this._position = position;
    this._direction = direction;
    this._status = status;
    this._labelText = labelHtml;

    const {
      container,
      translateButton,
      dropdownArrow,
      separator,
      subtitlesButton,
      separator3,
      pipButton,
      separator2,
      menuButton,
      label,
    } = this.createElements();
    this.container = container;
    this.translateButton = translateButton;
    this.dropdownArrow = dropdownArrow;
    this.separator = separator;
    this.subtitlesButton = subtitlesButton;
    this.separator3 = separator3;
    this.pipButton = pipButton;
    this.separator2 = separator2;
    this.menuButton = menuButton;
    this.label = label;
  }

  protected createElements() {
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
    appendTemplate(TRANSLATE_ICON_SVG, translateButton);

    const label = UI.createEl("span", ["vot-segment-label"]);
    label.textContent = this._labelText;
    // Inline dropdown arrow. It must be visually part of the translate segment,
    // not a detached segment in the segmented toolbar.
    const dropdownArrow = UI.createEl("span", ["vot-dropdown-arrow"]);
    dropdownArrow.setAttribute("role", "button");
    dropdownArrow.tabIndex = 0;
    dropdownArrow.setAttribute(
      "aria-label",
      localizationProvider.get("VOTVoiceSelection"),
    );
    dropdownArrow.setAttribute("aria-haspopup", "menu");
    dropdownArrow.setAttribute("aria-expanded", "false");
    appendTemplate(CHEVRON_ICON, dropdownArrow);
    translateButton.append(label, dropdownArrow);

    const separator = UI.createEl("vot-block", ["vot-separator"]);

    const subtitlesButton = UI.createEl("vot-block", [
      "vot-segment-only-icon",
      "vot-subtitles-button",
    ]);
    subtitlesButton.setAttribute("role", "button");
    subtitlesButton.tabIndex = 0;
    const subtitlesLabelText = localizationProvider.get("VOTSubtitles");
    subtitlesButton.setAttribute("aria-label", subtitlesLabelText);
    subtitlesButton.setAttribute("aria-pressed", "false");
    subtitlesButton.dataset.active = "false";
    appendTemplate(SUBTITLES_ICON, subtitlesButton);
    const separator3 = UI.createEl("vot-block", ["vot-separator"]);

    const pipButton = UI.createEl("vot-block", ["vot-segment-only-icon"]);
    pipButton.setAttribute("role", "button");
    pipButton.tabIndex = 0;
    pipButton.setAttribute("aria-label", "Picture in picture");
    appendTemplate(PIP_ICON_SVG, pipButton);

    const separator2 = UI.createEl("vot-block", ["vot-separator"]);
    const menuButton = UI.createEl("vot-block", ["vot-segment-only-icon"]);
    menuButton.setAttribute("role", "button");
    menuButton.tabIndex = 0;
    menuButton.setAttribute("aria-label", "Menu");
    // Opens a quick-settings popover (non-modal dialog).
    menuButton.setAttribute("aria-haspopup", "dialog");
    menuButton.setAttribute("aria-expanded", "false");
    appendTemplate(MENU_ICON, menuButton);

    container.append(
      translateButton,
      separator,
      subtitlesButton,
      separator3,
      pipButton,
      separator2,
      menuButton,
    );
    return {
      container,
      translateButton,
      dropdownArrow,
      separator,
      subtitlesButton,
      separator3,
      pipButton,
      separator2,
      menuButton,
      label,
    };
  }

  /**
   * Toggles an optional segment (button + its separator).
   *
   * `showSubtitlesButton` and `showPiPButton` were byte-identical apart from the
   * two elements they touched; they now share one implementation and route
   * through `setInteractiveHiddenState`, the same helper every other component
   * uses, so a hidden segment is consistently removed from the a11y tree and
   * from hit-testing instead of only being visually hidden.
   */
  private setSegmentVisible(
    button: HTMLElement,
    separator: HTMLElement,
    visible: boolean,
  ) {
    setInteractiveHiddenState(button, !visible);
    setInteractiveHiddenState(separator, !visible);
    return this;
  }

  showSubtitlesButton(visible: boolean) {
    return this.setSegmentVisible(
      this.subtitlesButton,
      this.separator3,
      visible,
    );
  }

  showPiPButton(visible: boolean) {
    return this.setSegmentVisible(this.pipButton, this.separator2, visible);
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
      case "leftCenter":
        return "right";
      case "right":
      case "rightCenter":
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

  get subtitlesActive() {
    return this._subtitlesActive;
  }

  set subtitlesActive(isActive: boolean) {
    this._subtitlesActive = isActive;
    this.subtitlesButton.dataset.active = isActive.toString();
    this.subtitlesButton.setAttribute("aria-pressed", isActive.toString());
  }

  setVoiceMenuOpen(isOpen: boolean): this {
    this.dropdownArrow.setAttribute("aria-expanded", isOpen.toString());
    this.dropdownArrow.classList.toggle("vot-dropdown-arrow--open", isOpen);
    this.translateButton.classList.toggle(
      "vot-translate-button--voice-menu-open",
      isOpen,
    );
    return this;
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

  /**
   * Voice popover chevron is shown only in the centered horizontal layout.
   * In side layout the whole translate icon is the voice-popover handle.
   */
  syncDropdownArrowPlacement(): void {
    const onSide = isSidePosition(this._position);
    this.dropdownArrow.hidden = onSide;
    this.dropdownArrow.setAttribute("aria-hidden", onSide.toString());
    this.dropdownArrow.tabIndex = onSide ? -1 : 0;
    if (this.dropdownArrow.parentElement !== this.translateButton) {
      this.translateButton.appendChild(this.dropdownArrow);
    }
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
