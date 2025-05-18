import { render } from "lit-html";
import "./styles/main.scss";
import { localizationProvider } from "./localization/localizationProvider.ts";

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export default class UI {
  /**
   * Auxiliary method for creating HTML elements
   *
   * @param {string} tag - Element tag
   * @param {string[]} classes - List of classes for element
   * @param {HTMLElement|string|null} content - Internal content (optional)
   * @return {HTMLElement} Created element
   */
  static createEl(tag, classes = [], content = null) {
    const el = document.createElement(tag);
    if (classes.length) el.classList.add(...classes);
    if (content !== null) el.append(content);
    return el;
  }

  /**
   * Create header element
   *
   * @param {HTMLElement|string} html - header content
   * @param {1|2|3|4|5|6} level - header level
   * @return {HTMLElement} HTML header element
   */
  static createHeader(html, level = 4) {
    const header = UI.createEl("vot-block", [
      "vot-header",
      `vot-header-level-${level}`,
    ]);
    header.append(html);
    return header;
  }

  /**
   * Create information element
   *
   * @param {HTMLElement|string} labelHtml - label content
   * @param {import("./types/components/shared").LitHtml} valueHtml - value content
   * @return {{
   *  container: HTMLElement,
   *  header: HTMLElement,
   *  value: HTMLElement
   * }} information elements
   */
  static createInformation(labelHtml, valueHtml) {
    const container = UI.createEl("vot-block", ["vot-info"]);
    const header = UI.createEl("vot-block");
    render(labelHtml, header);
    const value = UI.createEl("vot-block");
    render(valueHtml, value);
    container.append(header, value);
    return { container, header, value };
  }

  /**
   * Create button
   *
   * @param {HTMLElement|string} html - button content
   * @return {HTMLElement} HTML button element
   */
  static createButton(html) {
    const button = UI.createEl("vot-block", ["vot-button"]);
    button.append(html);
    return button;
  }

  /**
   * Create text button
   *
   * @param {HTMLElement|string} html - button content
   * @return {HTMLElement} HTML text button element
   */
  static createTextButton(html) {
    const button = UI.createEl("vot-block", ["vot-text-button"]);
    button.append(html);
    return button;
  }

  /**
   * Create outlined button
   *
   * @param {HTMLElement|string} html - button content
   * @return {HTMLElement} HTML outlined button element
   */
  static createOutlinedButton(html) {
    const button = UI.createEl("vot-block", ["vot-outlined-button"]);
    button.append(html);
    return button;
  }

  /**
   * Create icon button
   *
   * @param {TemplateResult} templateHtml - icon svg lit template
   * @return {HTMLElement} HTML icon button element
   */
  static createIconButton(templateHtml) {
    const button = UI.createEl("vot-block", ["vot-icon-button"]);
    render(templateHtml, button);
    return button;
  }

  static createInlineLoader() {
    return UI.createEl("vot-block", ["vot-inline-loader"]);
  }

  static createPortal(local = false) {
    return UI.createEl("vot-block", [`vot-portal${local ? "-local" : ""}`]);
  }

  static createSubtitleInfo(word, desc, translationService) {
    const container = UI.createEl("vot-block", ["vot-subtitles-info"]);
    container.id = "vot-subtitles-info";
    const translatedWith = UI.createEl(
      "vot-block",
      ["vot-subtitles-info-service"],
      localizationProvider
        .get("VOTTranslatedBy")
        .replace("{0}", translationService),
    );
    const header = UI.createEl(
      "vot-block",
      ["vot-subtitles-info-header"],
      word,
    );
    const context = UI.createEl(
      "vot-block",
      ["vot-subtitles-info-context"],
      desc,
    );

    container.append(translatedWith, header, context);

    return {
      container,
      translatedWith,
      header,
      context,
    };
  }
}
