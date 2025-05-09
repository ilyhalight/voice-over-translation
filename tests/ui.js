import { svg } from "lit-html";
import ui from "../src/ui.js";
import Tooltip from "../src/ui/components/tooltip.ts";
import Select from "../src/ui/components/select.ts";
import Checkbox from "../src/ui/components/checkbox.ts";
import Slider from "../src/ui/components/slider.ts";
import SliderLabel from "../src/ui/components/sliderLabel.ts";
import Textfield from "../src/ui/components/textfield.ts";
import VOTButton from "../src/ui/components/votButton.ts";
import VOTMenu from "../src/ui/components/votMenu.ts";
import Dialog from "../src/ui/components/dialog.ts";
import HotkeyButton from "../src/ui/components/hotkeyButton.ts";
import Details from "../src/ui/components/details.ts";
import LanguagePairSelect from "../src/ui/components/languagePairSelect.ts";
import Label from "../src/ui/components/label.ts";

class TestUI {
  initUI() {
    this.testDialog = new Dialog({
      titleHtml: "Test Dialog",
    });

    // Header
    this.h1 = ui.createHeader("H1 Lorem ipsum dolor", 1);
    this.h2 = ui.createHeader("H2 Lorem ipsum dolor", 2);
    this.h3 = ui.createHeader("H3 Lorem ipsum dolor", 3);
    this.h4 = ui.createHeader("H4 Lorem ipsum dolor", 4);
    this.h5 = ui.createHeader("H5 Lorem ipsum dolor", 5);
    this.h6 = ui.createHeader("H6 Lorem ipsum dolor", 6);
    this.testHTML = document.createElement("vot-block");
    this.testHTML.style = "font-weight:bold; color: skyblue;";
    this.testHTML.textContent = "Lorem HTML ipsum dolor";
    this.h3WithHTML = ui.createHeader(this.testHTML.cloneNode(true), 3);
    console.log(this.h3WithHTML.outerHTML);
    this.testDialog.bodyContainer.append(
      this.h1,
      this.h2,
      this.h3,
      this.h4,
      this.h5,
      this.h6,
      this.h3WithHTML,
    );

    // Information
    this.info = ui.createInformation(
      "Information Lorem ipsum dolor:",
      "Neque porro quisquam est qui",
    );
    this.infoWithHTML = ui.createInformation(
      this.testHTML.cloneNode(true),
      this.testHTML.cloneNode(true),
    );

    this.testDialog.bodyContainer.append(
      this.info.container,
      this.infoWithHTML.container,
    );

    // Button
    this.button = ui.createButton("Button Lorem ipsum dolor");
    this.buttonDisabled = ui.createButton("Button Disabled Lorem ipsum dolor");
    this.buttonDisabled.setAttribute("disabled", "true");
    this.buttonWithHTML = ui.createButton(this.testHTML.cloneNode(true));
    this.testDialog.bodyContainer.append(
      this.button,
      this.buttonDisabled,
      this.buttonWithHTML,
    );

    // TextButton
    this.textButton = ui.createTextButton("TextButton Lorem ipsum dolor");
    this.textButtonDisabled = ui.createTextButton(
      "TextButton Disabled Lorem ipsum dolor",
    );
    this.textButtonDisabled.setAttribute("disabled", "true");
    this.textButtonWithHTML = ui.createTextButton(
      this.testHTML.cloneNode(true),
    );
    this.testDialog.bodyContainer.append(
      this.textButton,
      this.textButtonDisabled,
      this.textButtonWithHTML,
    );

    // OutlinedButton
    this.outlinedButton = ui.createOutlinedButton(
      "OutlinedButton Lorem ipsum dolor",
    );
    this.outlinedButtonDisabled = ui.createOutlinedButton(
      "OutlinedButton Disabled Lorem ipsum dolor",
    );
    this.outlinedButtonDisabled.setAttribute("disabled", "true");
    this.outlinedButtonWithHTML = ui.createOutlinedButton(
      this.testHTML.cloneNode(true),
    );
    this.testDialog.bodyContainer.append(
      this.outlinedButton,
      this.outlinedButtonDisabled,
      this.outlinedButtonWithHTML,
    );

    const downloadIcon = svg`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="100%" viewBox="0 0 24 24" class="vot-loader" id="vot-loader-download">
            <path class="vot-loader-main" d="M12 15.575C11.8667 15.575 11.7417 15.5542 11.625 15.5125C11.5083 15.4708 11.4 15.4 11.3 15.3L7.7 11.7C7.5 11.5 7.40417 11.2667 7.4125 11C7.42083 10.7333 7.51667 10.5 7.7 10.3C7.9 10.1 8.1375 9.99583 8.4125 9.9875C8.6875 9.97917 8.925 10.075 9.125 10.275L11 12.15V5C11 4.71667 11.0958 4.47917 11.2875 4.2875C11.4792 4.09583 11.7167 4 12 4C12.2833 4 12.5208 4.09583 12.7125 4.2875C12.9042 4.47917 13 4.71667 13 5V12.15L14.875 10.275C15.075 10.075 15.3125 9.97917 15.5875 9.9875C15.8625 9.99583 16.1 10.1 16.3 10.3C16.4833 10.5 16.5792 10.7333 16.5875 11C16.5958 11.2667 16.5 11.5 16.3 11.7L12.7 15.3C12.6 15.4 12.4917 15.4708 12.375 15.5125C12.2583 15.5542 12.1333 15.575 12 15.575ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V16C4 15.7167 4.09583 15.4792 4.2875 15.2875C4.47917 15.0958 4.71667 15 5 15C5.28333 15 5.52083 15.0958 5.7125 15.2875C5.90417 15.4792 6 15.7167 6 16V18H18V16C18 15.7167 18.0958 15.4792 18.2875 15.2875C18.4792 15.0958 18.7167 15 19 15C19.2833 15 19.5208 15.0958 19.7125 15.2875C19.9042 15.4792 20 15.7167 20 16V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z"/>
            <path class="vot-loader-helper" d=""/>
         </svg>`;

    // IconButton
    this.iconButton = ui.createIconButton(downloadIcon);
    this.iconButtonWithProgress = ui.createIconButton(downloadIcon);
    this.iconButtonDisabled = ui.createIconButton(downloadIcon);
    this.iconButtonDisabled.setAttribute("disabled", "true");
    this.testDialog.bodyContainer.append(
      this.iconButton,
      this.iconButtonWithProgress,
      this.iconButtonDisabled,
    );

    // Checkbox
    this.checkbox = new Checkbox({
      labelHtml: "Checkbox Lorem ipsum dolor",
      checked: true,
    });
    this.checkboxDisabledWithHtml = new Checkbox({
      labelHtml: this.testHTML.cloneNode(true),
      checked: true,
    });
    this.checkboxDisabledWithHtml.disabled = true;

    this.testDialog.bodyContainer.append(
      this.checkbox.container,
      this.checkboxDisabledWithHtml.container,
    );

    // Slider
    const sliderValue = 100;
    this.sliderLabel = new SliderLabel({
      labelText: "SliderLabel Lorem ipsum dolor",
      labelEOL: ":",
      value: sliderValue,
      symbol: " thousands",
    });
    this.slider = new Slider({
      labelHtml: this.sliderLabel.container,
      value: sliderValue,
    });
    this.slider.addEventListener("input", (newValue) => {
      this.sliderLabel.value = newValue;
    });

    this.sliderWithHTML = new Slider({
      labelHtml: this.testHTML.cloneNode(true),
      min: 0,
      max: 300,
      value: 123,
    });

    this.testDialog.bodyContainer.append(
      this.slider.container,
      this.sliderWithHTML.container,
    );

    // Textfield
    this.textfield = new Textfield({
      labelHtml: "Textfield Lorem ipsum dolor",
      placeholder: "",
      value: "test",
    });
    this.textfieldWithoutLabel = new Textfield({
      labelHtml: "",
      placeholder: "",
      value: "test",
    });
    this.textfieldWithoutValue = new Textfield({
      labelHtml: "Textfield Without Value",
      placeholder: "",
      value: "",
    });
    this.textfieldMultiline = new Textfield({
      labelHtml: "Textfield multi line",
      placeholder: "hello world",
      value: "",
      multiline: true,
    });
    this.textfieldWithHTML = new Textfield({
      labelHtml: this.testHTML.cloneNode(true),
      placeholder: "lorem ipsum dolor",
      value: "lorem ipsum 1231",
      multiline: true,
    });

    this.hotkeyButton = new HotkeyButton({
      labelHtml: "HotkeyButton Lorem ipsum dolor",
      key: "KeyL",
    });

    this.details = new Details({
      titleHtml: "Read more...",
    });

    this.testDialog.bodyContainer.append(
      this.textfield.container,
      this.textfieldWithoutLabel.container,
      this.textfieldWithoutValue.container,
      this.textfieldMultiline.container,
      this.textfieldWithHTML.container,
      this.hotkeyButton.container,
    );

    // VOTButton
    this.votButton = new VOTButton({
      position: "default",
      direction: VOTButton.calcDirection("default"),
      status: "none",
      labelHtml: this.testHTML.cloneNode(true),
    });
    this.votButton.menuButton.addEventListener("click", () => {
      this.testDialog.open();
    });
    this.votButtonSuccessLeft = new VOTButton({
      position: "left",
      direction: VOTButton.calcDirection("left"),
      status: "success",
    });
    this.votButtonErrorRight = new VOTButton({
      position: "right",
      direction: VOTButton.calcDirection("right"),
      status: "error",
    });

    // tooltip
    // ! Now vot code doesn't have portal
    this.votPortal = ui.createPortal();
    document.documentElement.appendChild(this.votPortal);

    this.testTooltipContent = ui.createEl("p", [], "Use logical sides too 👍🏻");
    this.testTooltipLContent = this.testTooltipContent.cloneNode(true);
    this.testTooltipRContent = this.testTooltipContent.cloneNode(true);
    this.testTooltipBContent = ui.createEl(
      "p",
      [],
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis ",
    );
    this.tooltipEl = new Tooltip({
      target: this.votButton.translateButton,
      content: this.testTooltipContent,
      position: "top",
      parentElement: this.votPortal,
      bordered: false,
    });
    this.tooltipLEl = new Tooltip({
      target: this.votButtonErrorRight.translateButton,
      content: this.testTooltipLContent,
      position: "left",
      parentElement: this.votPortal,
      bordered: false,
    });
    this.tooltipREl = new Tooltip({
      target: this.votButtonSuccessLeft.translateButton,
      content: this.testTooltipRContent,
      position: "right",
      parentElement: this.votPortal,
      bordered: false,
    });
    this.tooltipBEl = new Tooltip({
      target: this.votButton.translateButton,
      content: this.testTooltipBContent,
      position: "bottom",
      trigger: "click",
      parentElement: this.votPortal,
      bordered: true,
    });

    // VOTMenu
    this.votMenu = new VOTMenu({
      position: "default",
      titleHtml: this.testHTML.cloneNode(true),
    });
    this.votMenu.hidden = false;
    this.languagePair = new LanguagePairSelect({
      from: {
        items: [
          {
            label: "English",
            value: "en",
            selected: true,
          },
          {
            label: "Russian",
            value: "ru",
          },
        ],
      },
      to: {
        items: [
          {
            label: "Spanish",
            value: "es",
            selected: true,
          },
          {
            label: "French",
            value: "fr",
          },
        ],
      },
      dialogParent: this.votPortal,
    });
    this.votMenu.bodyContainer.appendChild(this.languagePair.container);

    // VOTSelectLabel
    this.votSelectLabel = new Label({
      labelText: "VOTSubtitles",
    });
    this.subtitlesSelect = new Select({
      selectTitle: "VOTSubtitles",
      dialogTitle: "VOTSubtitles",
      multiSelect: false,
      labelElement: this.votSelectLabel.container,
      dialogParent: this.votGlobalPortal,
      items: [
        {
          label: "VOTSubtitlesDisabled",
          value: "disabled",
          selected: true,
        },
      ],
    });
    this.subtitlesSelect.addEventListener("beforeOpen", async (data) => {
      const loadingEl = ui.createInlineLoader();
      loadingEl.style.margin = "0 auto";
      data.footerContainer.appendChild(loadingEl);
      this.votButton.loading = true;
      await new Promise((resolve) => setTimeout(resolve, 3000));
      this.subtitlesSelect.updateItems([
        {
          label: "VOTSubtitlesDisabled",
          value: "disabled",
          selected: true,
        },
        {
          label: "hello world",
          value: "hello_world",
          selected: false,
        },
      ]);
      this.votButton.loading = false;
      data.footerContainer.removeChild(loadingEl);
    });

    this.testDialog.bodyContainer.append(this.subtitlesSelect.container);

    this.votPortal.append(
      this.votButton.container,
      this.votButtonErrorRight.container,
      this.votButtonSuccessLeft.container,
      this.votMenu.container,
      this.testDialog.container,
    );
  }
}

new TestUI().initUI();
