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
import DownloadButton from "../src/ui/components/downloadButton.ts";

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

    // IconButton
    this.iconButton = new DownloadButton();
    this.iconButtonWithProgress = new DownloadButton();
    this.iconButtonWithProgress.addEventListener("click", () => {
      let timer = setInterval(() => {
        this.iconButtonWithProgress.progress++;
        if (this.iconButtonWithProgress.progress > 99) {
          clearInterval(timer);
          this.iconButtonWithProgress.progress = 0;
        }
      }, 150);
    });
    this.iconButtonDisabled = new DownloadButton();
    this.iconButtonDisabled.button.setAttribute("disabled", "true");
    this.testDialog.bodyContainer.append(
      this.iconButton.button,
      this.iconButtonWithProgress.button,
      this.iconButtonDisabled.button,
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
