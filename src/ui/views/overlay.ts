import { availableLangs, availableTTS } from "@vot.js/shared/consts";
import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";

import ui from "../../ui";

import LanguagePairSelect from "../components/languagePairSelect";
import Select from "../components/select";
import Slider from "../components/slider";
import SliderLabel from "../components/sliderLabel";
import Tooltip from "../components/tooltip";
import VOTButton from "../components/votButton";
import VOTMenu from "../components/votMenu";
import { SETTINGS_ICON, SUBTITLES_ICON } from "./../icons";

import type { VideoHandler } from "../..";
import { maxAudioVolume } from "../../config/config";
import { EventImpl } from "../../core/eventImpl";
import { localizationProvider } from "../../localization/localizationProvider";
import type { LanguageSelectKey } from "../../types/components/select";
import type { Direction, Position } from "../../types/components/votButton";
import type { StorageData } from "../../types/storage";
import type { ButtonLayout } from "../../types/uiManager";
import type { OverlayViewProps } from "../../types/views/overlay";
import { votStorage } from "../../utils/storage";
import { isPiPAvailable } from "../../utils/utils";
import DownloadButton from "../components/downloadButton";
import Label from "../components/label";

export class OverlayView {
  root: HTMLElement;
  tooltipLayoutRoot: HTMLElement;
  portalContainer: HTMLElement;
  globalPortal: HTMLElement;

  private dragging = false;
  private initialized = false;
  private data: Partial<StorageData>;
  private videoHandler?: VideoHandler;
  private cancelDraggingEvents = ["pointercancel", "touchcancel"];

  // events
  private onClickSettings = new EventImpl();
  private onClickPiP = new EventImpl();
  private onClickTranslate = new EventImpl();
  private onClickDownloadTranslation = new EventImpl();
  private onClickDownloadSubtitles = new EventImpl();
  private onSelectFromLanguage = new EventImpl();
  private onSelectToLanguage = new EventImpl();
  private onSelectSubtitles = new EventImpl();
  private onInputVideoVolume = new EventImpl();
  private onInputTranslationVolume = new EventImpl();

  // shared
  votOverlayPortal?: HTMLElement;
  // button
  votButton?: VOTButton;
  votButtonTooltip?: Tooltip;
  // menu
  votMenu?: VOTMenu;
  downloadTranslationButton?: DownloadButton;
  downloadSubtitlesButton?: HTMLElement;
  openSettingsButton?: HTMLElement;
  languagePairSelect?: LanguagePairSelect<RequestLang, ResponseLang>;
  subtitlesSelectLabel?: Label;
  subtitlesSelect?: Select;
  videoVolumeSliderLabel?: SliderLabel;
  videoVolumeSlider?: Slider;
  tranlsationVolumeSliderLabel?: SliderLabel;
  translationVolumeSlider?: Slider;

  constructor({
    root,
    portalContainer,
    tooltipLayoutRoot,
    globalPortal,
    data = {},
    videoHandler,
  }: OverlayViewProps) {
    this.root = root;
    this.portalContainer = portalContainer;
    this.tooltipLayoutRoot = tooltipLayoutRoot;
    this.globalPortal = globalPortal;
    this.data = data;
    this.videoHandler = videoHandler;
  }

  isInitialized(): this is {
    // #region Shared type
    votOverlayPortal: HTMLElement;
    // #endregion Shared type
    // #region Button type
    votButton: VOTButton;
    votButtonTooltip: Tooltip;
    // #endregion Button type
    // #region Menu type
    votMenu: VOTMenu;
    downloadTranslationButton: DownloadButton;
    downloadSubtitlesButton: HTMLElement;
    openSettingsButton: HTMLElement;
    languagePairSelect: LanguagePairSelect<RequestLang, ResponseLang>;
    subtitlesSelectLabel: Label;
    subtitlesSelect: Select;
    videoVolumeSliderLabel: SliderLabel;
    videoVolumeSlider: Slider;
    tranlsationVolumeSliderLabel: SliderLabel;
    translationVolumeSlider: Slider;
    // #endregion Menu type
  } {
    return this.initialized;
  }

  calcButtonLayout(position: Position): ButtonLayout {
    if (this.isBigContainer && ["left", "right"].includes(position)) {
      return {
        direction: "column",
        position,
      };
    }

    return {
      direction: "row",
      position: "default",
    };
  }

  addEventListener(type: "click:settings", listener: () => void): this;
  addEventListener(type: "click:pip", listener: () => void): this;
  addEventListener(
    type: "click:downloadTranslation",
    listener: () => void,
  ): this;
  addEventListener(type: "click:downloadSubtitles", listener: () => void): this;
  addEventListener(type: "click:translate", listener: () => void): this;
  addEventListener(
    type: "input:videoVolume",
    listener: (volume: number) => void,
  ): this;
  addEventListener(
    type: "input:translationVolume",
    listener: (volume: number) => void,
  ): this;
  addEventListener(
    type: "select:fromLanguage",
    listener: (item: LanguageSelectKey) => void,
  ): this;
  addEventListener(
    type: "select:toLanguage",
    listener: (item: LanguageSelectKey) => void,
  ): this;
  addEventListener(
    type: "select:subtitles",
    listener: (item: string) => void,
  ): this;
  addEventListener(
    type:
      | "click:settings"
      | "click:pip"
      | "click:downloadTranslation"
      | "click:downloadSubtitles"
      | "click:translate"
      | "input:videoVolume"
      | "input:translationVolume"
      | "select:fromLanguage"
      | "select:toLanguage"
      | "select:subtitles",
    listener: (...data: any[]) => void,
  ): this {
    switch (type) {
      case "click:settings": {
        this.onClickSettings.addListener(listener);
        break;
      }
      case "click:pip": {
        this.onClickPiP.addListener(listener);
        break;
      }
      case "click:downloadTranslation": {
        this.onClickDownloadTranslation.addListener(listener);
        break;
      }
      case "click:downloadSubtitles": {
        this.onClickDownloadSubtitles.addListener(listener);
        break;
      }
      case "click:translate": {
        this.onClickTranslate.addListener(listener);
        break;
      }
      case "input:videoVolume": {
        this.onInputVideoVolume.addListener(listener);
        break;
      }
      case "input:translationVolume": {
        this.onInputTranslationVolume.addListener(listener);
        break;
      }
      case "select:fromLanguage": {
        this.onSelectFromLanguage.addListener(listener);
        break;
      }
      case "select:toLanguage": {
        this.onSelectToLanguage.addListener(listener);
        break;
      }
      case "select:subtitles": {
        this.onSelectSubtitles.addListener(listener);
        break;
      }
    }

    return this;
  }

  removeEventListener(type: "click:settings", listener: () => void): this;
  removeEventListener(type: "click:pip", listener: () => void): this;
  removeEventListener(
    type: "click:downloadTranslation",
    listener: () => void,
  ): this;
  removeEventListener(
    type: "click:downloadSubtitles",
    listener: () => void,
  ): this;
  removeEventListener(type: "click:translate", listener: () => void): this;
  removeEventListener(
    type: "input:videoVolume",
    listener: (volume: number) => void,
  ): this;
  removeEventListener(
    type: "input:translationVolume",
    listener: (volume: number) => void,
  ): this;
  removeEventListener(
    type: "select:fromLanguage",
    listener: (item: LanguageSelectKey) => void,
  ): this;
  removeEventListener(
    type: "select:toLanguage",
    listener: (item: LanguageSelectKey) => void,
  ): this;
  removeEventListener(
    type: "select:subtitles",
    listener: (item: string) => void,
  ): this;
  removeEventListener(
    type:
      | "click:settings"
      | "click:pip"
      | "click:downloadTranslation"
      | "click:downloadSubtitles"
      | "click:translate"
      | "input:videoVolume"
      | "input:translationVolume"
      | "select:fromLanguage"
      | "select:toLanguage"
      | "select:subtitles",
    listener: (...data: any[]) => void,
  ) {
    switch (type) {
      case "click:settings": {
        this.onClickSettings.removeListener(listener);
        break;
      }
      case "click:pip": {
        this.onClickPiP.removeListener(listener);
        break;
      }
      case "click:downloadTranslation": {
        this.onClickDownloadTranslation.removeListener(listener);
        break;
      }
      case "click:downloadSubtitles": {
        this.onClickDownloadSubtitles.removeListener(listener);
        break;
      }
      case "click:translate": {
        this.onClickTranslate.removeListener(listener);
        break;
      }
      case "input:videoVolume": {
        this.onInputVideoVolume.removeListener(listener);
        break;
      }
      case "input:translationVolume": {
        this.onInputTranslationVolume.removeListener(listener);
        break;
      }
      case "select:fromLanguage": {
        this.onSelectFromLanguage.removeListener(listener);
        break;
      }
      case "select:toLanguage": {
        this.onSelectToLanguage.removeListener(listener);
        break;
      }
      case "select:subtitles": {
        this.onSelectSubtitles.removeListener(listener);
        break;
      }
    }

    return this;
  }

  initUI(buttonPosition: Position = "default") {
    if (this.isInitialized()) {
      throw new Error("[VOT] OverlayView is already initialized");
    }

    this.initialized = true;

    // #region Shared logic
    const { position, direction } = this.calcButtonLayout(buttonPosition);

    this.votOverlayPortal = ui.createPortal(true);
    this.portalContainer.appendChild(this.votOverlayPortal);

    // #endregion Shared logic
    // #region VOT Button
    this.votButton = new VOTButton({
      position,
      direction,
      status: "none",
      labelHtml: localizationProvider.get("translateVideo"),
    });
    this.votButton.opacity = 0;
    if (!this.pipButtonVisible) {
      this.votButton.showPiPButton(false);
    }
    this.root.appendChild(this.votButton.container);
    this.votButtonTooltip = new Tooltip({
      target: this.votButton.translateButton,
      content: localizationProvider.get("translateVideo"),
      position: this.votButton.tooltipPos,
      hidden: direction === "row",
      bordered: false,
      parentElement: this.votOverlayPortal,
      layoutRoot: this.tooltipLayoutRoot,
    });

    // #endregion VOT Button
    // #region VOT Menu
    this.votMenu = new VOTMenu({
      titleHtml: localizationProvider.get("VOTSettings"),
      position,
    });
    this.root.appendChild(this.votMenu.container);

    // #region VOT Menu Header
    this.downloadTranslationButton = new DownloadButton();
    this.downloadTranslationButton.hidden = true;

    this.downloadSubtitlesButton = ui.createIconButton(SUBTITLES_ICON);
    this.downloadSubtitlesButton.hidden = true;

    this.openSettingsButton = ui.createIconButton(SETTINGS_ICON);

    this.votMenu.headerContainer.append(
      this.downloadTranslationButton.button,
      this.downloadSubtitlesButton,
      this.openSettingsButton,
    );

    // #endregion VOT Menu Header
    // #region VOT Menu Body

    const detectedLanguage =
      this.videoHandler?.videoData?.detectedLanguage ?? "en";
    const responseLanguage = this.data.responseLanguage ?? "ru";
    this.languagePairSelect = new LanguagePairSelect({
      from: {
        selectTitle: localizationProvider.get(`langs.${detectedLanguage}`),
        items: Select.genLanguageItems(availableLangs, detectedLanguage),
      },
      to: {
        selectTitle: localizationProvider.get(`langs.${responseLanguage}`),
        items: Select.genLanguageItems(availableTTS, responseLanguage),
      },
    });

    this.subtitlesSelectLabel = new Label({
      labelText: localizationProvider.get("VOTSubtitles"),
    });
    this.subtitlesSelect = new Select({
      selectTitle: localizationProvider.get("VOTSubtitlesDisabled"),
      dialogTitle: localizationProvider.get("VOTSubtitles"),
      labelElement: this.subtitlesSelectLabel.container,
      dialogParent: this.globalPortal,
      items: [
        {
          label: localizationProvider.get("VOTSubtitlesDisabled"),
          value: "disabled",
          selected: true,
        },
      ],
    });

    const videoVolume = this.videoHandler
      ? this.videoHandler.getVideoVolume() * 100
      : 100;
    this.videoVolumeSliderLabel = new SliderLabel({
      labelText: localizationProvider.get("VOTVolume"),
      value: videoVolume,
    });

    this.videoVolumeSlider = new Slider({
      labelHtml: this.videoVolumeSliderLabel.container,
      value: videoVolume,
    });
    this.videoVolumeSlider.hidden =
      !this.data.showVideoSlider || this.votButton.status !== "success";

    const defaultVolume = this.data.defaultVolume ?? 100;
    this.tranlsationVolumeSliderLabel = new SliderLabel({
      labelText: localizationProvider.get("VOTVolumeTranslation"),
      value: defaultVolume,
    });

    this.translationVolumeSlider = new Slider({
      labelHtml: this.tranlsationVolumeSliderLabel.container,
      value: defaultVolume,
      max: this.data.audioBooster ? maxAudioVolume : 100,
    });
    this.translationVolumeSlider.hidden = this.votButton.status !== "success";

    this.votMenu.bodyContainer.append(
      this.languagePairSelect.container,
      this.subtitlesSelect.container,
      this.videoVolumeSlider.container,
      this.translationVolumeSlider.container,
    );

    // #endregion VOT Menu Body
    // #endregion VOT Menu
    return this;
  }

  initUIEvents() {
    if (!this.isInitialized()) {
      throw new Error("[VOT] OverlayView isn't initialized");
    }

    // #region [Events] VOT Button
    // Prevent button click events from propagating.
    this.votButton.container.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    });

    this.votButton.translateButton.addEventListener("pointerdown", async () => {
      this.onClickTranslate.dispatch();
    });

    this.votButton.pipButton.addEventListener("pointerdown", async () => {
      this.onClickPiP.dispatch();
    });

    this.votButton.menuButton.addEventListener("pointerdown", async () => {
      this.votMenu.hidden = !this.votMenu.hidden;
    });

    // #region [Events] VOT Button Dragging
    const enableDraggingByEvent = (event: Event) => {
      this.dragging = true;
      event.preventDefault();
    };

    this.votButton.container.addEventListener(
      "pointerdown",
      enableDraggingByEvent,
    );
    this.root.addEventListener("pointerup", this.disableDragging);
    this.root.addEventListener("pointermove", this.handleContainerPointerMove);

    this.votButton.container.addEventListener(
      "touchstart",
      enableDraggingByEvent,
      {
        passive: false,
      },
    );
    this.root.addEventListener("touchend", this.disableDragging);
    this.root.addEventListener("touchmove", this.handleContainerTouchMove, {
      passive: false,
    });

    for (const event of this.cancelDraggingEvents) {
      document.addEventListener(event, this.disableDragging);
    }

    // #endregion [Events] VOT Button Dragging
    // #endregion [Events] VOT Button
    // #region [Events] VOT Menu
    this.votMenu.container.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    });

    // #region [Events] VOT Menu Header
    this.downloadTranslationButton.addEventListener("click", async () => {
      this.onClickDownloadTranslation.dispatch();
    });

    this.downloadSubtitlesButton.addEventListener("click", async () => {
      this.onClickDownloadSubtitles.dispatch();
    });

    this.openSettingsButton.addEventListener("click", async () => {
      this.onClickSettings.dispatch();
    });

    // #endregion [Events] VOT Menu Header
    // #region [Events] VOT Menu Body
    this.languagePairSelect.fromSelect.addEventListener(
      "selectItem",
      (language) => {
        if (this.videoHandler?.videoData) {
          this.videoHandler.videoData.detectedLanguage = language;
        }
        this.onSelectFromLanguage.dispatch(language);
      },
    );

    this.languagePairSelect.toSelect.addEventListener(
      "selectItem",
      async (language) => {
        if (this.videoHandler?.videoData) {
          this.videoHandler.translateToLang =
            this.videoHandler.videoData.responseLanguage = language;
        }
        this.data.responseLanguage = language;
        await votStorage.set("responseLanguage", this.data.responseLanguage);
        this.onSelectToLanguage.dispatch(language);
      },
    );

    this.subtitlesSelect.addEventListener("beforeOpen", async (dialog) => {
      if (!this.videoHandler?.videoData) {
        return;
      }

      const cacheKey = `${this.videoHandler.videoData.videoId}_${this.videoHandler.videoData.detectedLanguage}_${this.videoHandler.videoData.responseLanguage}_${this.data.useLivelyVoice}`;
      if (this.videoHandler.cacheManager.getSubtitles(cacheKey)) {
        return;
      }

      this.votButton.loading = true;
      const loadingEl = ui.createInlineLoader();
      loadingEl.style.margin = "0 auto";
      dialog.footerContainer.appendChild(loadingEl);
      await this.videoHandler.loadSubtitles();
      dialog.footerContainer.removeChild(loadingEl);
      this.votButton.loading = false;
    });

    this.subtitlesSelect.addEventListener("selectItem", (data) => {
      this.onSelectSubtitles.dispatch(data);
    });

    this.videoVolumeSlider.addEventListener("input", (value) => {
      this.videoVolumeSliderLabel.value = value;
      this.onInputVideoVolume.dispatch(value);
    });

    this.translationVolumeSlider.addEventListener("input", async (value) => {
      this.tranlsationVolumeSliderLabel.value = value;
      this.data.defaultVolume = value;
      await votStorage.set("defaultVolume", this.data.defaultVolume);
      this.onInputTranslationVolume.dispatch(value);
    });

    // #endregion [Events] VOT Menu Body
    // #endregion [Events] VOT Menu
    return this;
  }

  updateButtonLayout(position: Position, direction: Direction) {
    if (!this.isInitialized()) {
      return this;
    }

    this.votMenu.position = position;

    this.votButton.position = position;
    this.votButton.direction = direction;

    this.votButtonTooltip.hidden = direction === "row";
    this.votButtonTooltip.setPosition(this.votButton.tooltipPos);

    return this;
  }

  async moveButton(percentX: number) {
    if (!this.isInitialized()) {
      return this;
    }

    const position = VOTButton.calcPosition(percentX, this.isBigContainer);
    if (position === this.votButton.position) {
      return this;
    }

    const direction = VOTButton.calcDirection(position);
    this.data.buttonPos = position;
    this.updateButtonLayout(position, direction);
    if (this.isBigContainer) {
      await votStorage.set("buttonPos", position);
    }

    return this;
  }

  async handleDragMove(
    event: MouseEvent | TouchEvent,
    clientX: number,
    rect = this.root.getBoundingClientRect(),
  ) {
    if (!this.dragging) {
      return this;
    }

    event.preventDefault();
    const x = clientX - rect.left;
    const percentX = (x / rect.width) * 100;
    await this.moveButton(percentX);
    return this;
  }

  disableDragging = () => {
    this.dragging = false;
  };

  handleContainerPointerMove = async (event: PointerEvent) => {
    void (await this.handleDragMove(event, event.clientX));
  };

  handleContainerTouchMove = async (event: TouchEvent) => {
    void (await this.handleDragMove(event, event.touches[0].clientX));
  };

  updateButtonOpacity(opacity: number) {
    if (!this.isInitialized() || !this.votMenu.hidden) {
      return this;
    }

    this.votButton.opacity = opacity;
    return this;
  }

  releaseUI(initialized = false) {
    if (!this.isInitialized()) {
      throw new Error("[VOT] OverlayView isn't initialized");
    }

    this.votButton.remove();
    this.votMenu.remove();
    this.votButtonTooltip.release();
    this.votOverlayPortal.remove();

    this.initialized = initialized;
    return this;
  }

  releaseUIEvents(initialized = false) {
    if (!this.isInitialized()) {
      throw new Error("[VOT] OverlayView isn't initialized");
    }

    this.root.removeEventListener("pointerup", this.disableDragging);
    this.root.removeEventListener(
      "pointermove",
      this.handleContainerPointerMove,
    );

    this.root.removeEventListener("touchend", this.disableDragging);
    this.root.removeEventListener("touchmove", this.handleContainerTouchMove);

    for (const event of this.cancelDraggingEvents) {
      document.removeEventListener(event, this.disableDragging);
    }

    this.onClickSettings.clear();
    this.onClickPiP.clear();
    this.onClickTranslate.clear();
    this.onClickDownloadTranslation.clear();
    this.onClickDownloadSubtitles.clear();

    this.onSelectFromLanguage.clear();
    this.onSelectToLanguage.clear();
    this.onSelectSubtitles.clear();

    this.onInputVideoVolume.clear();
    this.onInputTranslationVolume.clear();

    this.initialized = initialized;
    return this;
  }

  release() {
    this.releaseUI(true);
    this.releaseUIEvents(false);
    return this;
  }

  get isBigContainer() {
    return this.root.clientWidth > 550;
  }

  get pipButtonVisible() {
    return isPiPAvailable() && !!this.data.showPiPButton;
  }
}
