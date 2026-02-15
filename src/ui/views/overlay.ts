import { availableLangs, availableTTS } from "@vot.js/shared/consts";
import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";
import type { VideoHandler } from "../..";
import { maxAudioVolume } from "../../config/config";
import { EventImpl } from "../../core/eventImpl";
import { localizationProvider } from "../../localization/localizationProvider";
import type { Direction, Position } from "../../types/components/votButton";
import type { StorageData } from "../../types/storage";
import type { ButtonLayout, OverlayMount } from "../../types/uiManager";
import type {
  OverlayViewEventMap,
  OverlayViewProps,
} from "../../types/views/overlay";
import ui from "../../ui";
import type { IntervalIdleChecker } from "../../utils/intervalIdleChecker";
import { votStorage } from "../../utils/storage";
import { isPiPAvailable } from "../../utils/utils";
import DownloadButton from "../components/downloadButton";
import Label from "../components/label";
import LanguagePairSelect from "../components/languagePairSelect";
import Select from "../components/select";
import Slider from "../components/slider";
import SliderLabel from "../components/sliderLabel";
import Tooltip from "../components/tooltip";
import VOTButton from "../components/votButton";
import VOTMenu from "../components/votMenu";
import { SETTINGS_ICON, SUBTITLES_ICON } from "./../icons";

export class OverlayView {
  mount: OverlayMount;
  globalPortal: HTMLElement;
  private abortController: AbortController | null = null;
  private defaultVolumePersistTimer: number | undefined;
  private readonly defaultVolumePersistDelayMs = 250;

  private dragging = false;
  private dragCandidate = false;
  private dragDirty = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private currentClientX = 0;
  private readonly dragThresholdPx = 6;
  private containerRect: DOMRect | null = null;
  private dragIsBigContainer: boolean | null = null;
  private checkerUnsubscribe: (() => void) | null = null;

  private initialized = false;
  private readonly data: Partial<StorageData>;
  private readonly videoHandler?: VideoHandler;
  private readonly intervalIdleChecker: IntervalIdleChecker;

  private readonly events: {
    [K in keyof OverlayViewEventMap]: EventImpl<OverlayViewEventMap[K]>;
  } = {
    "click:settings": new EventImpl<OverlayViewEventMap["click:settings"]>(),
    "click:pip": new EventImpl<OverlayViewEventMap["click:pip"]>(),
    "click:downloadTranslation": new EventImpl<
      OverlayViewEventMap["click:downloadTranslation"]
    >(),
    "click:downloadSubtitles": new EventImpl<
      OverlayViewEventMap["click:downloadSubtitles"]
    >(),
    "click:translate": new EventImpl<OverlayViewEventMap["click:translate"]>(),
    "input:videoVolume": new EventImpl<
      OverlayViewEventMap["input:videoVolume"]
    >(),
    "input:translationVolume": new EventImpl<
      OverlayViewEventMap["input:translationVolume"]
    >(),
    "select:fromLanguage": new EventImpl<
      OverlayViewEventMap["select:fromLanguage"]
    >(),
    "select:toLanguage": new EventImpl<
      OverlayViewEventMap["select:toLanguage"]
    >(),
    "select:subtitles": new EventImpl<
      OverlayViewEventMap["select:subtitles"]
    >(),
  };

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
  translationVolumeSliderLabel?: SliderLabel;
  translationVolumeSlider?: Slider;

  constructor({
    mount,
    globalPortal,
    data = {},
    videoHandler,
    intervalIdleChecker,
  }: OverlayViewProps) {
    this.mount = mount;
    this.globalPortal = globalPortal;
    this.data = data;
    this.videoHandler = videoHandler;
    this.intervalIdleChecker = intervalIdleChecker;
  }

  get root(): HTMLElement {
    return this.mount.root;
  }

  get portalContainer(): HTMLElement {
    return this.mount.portalContainer;
  }

  get tooltipLayoutRoot(): HTMLElement | undefined {
    return this.mount.tooltipLayoutRoot;
  }

  /**
   * Update mount points (root/portal/tooltipLayoutRoot) when the player container changes.
   * Moves already-mounted UI nodes and rebinds root-bound listeners (dragging).
   */
  updateMount(nextMount: OverlayMount): this {
    const prevRoot = this.mount.root;
    const nextRoot = nextMount.root;
    const prevPortal = this.mount.portalContainer;
    const nextPortal = nextMount.portalContainer;
    const prevTooltipRoot = this.mount.tooltipLayoutRoot;
    const nextTooltipRoot = nextMount.tooltipLayoutRoot;

    this.mount = nextMount;

    if (!this.isInitialized()) {
      return this;
    }

    // Move mounted nodes to new containers.
    if (this.votOverlayPortal && prevPortal !== nextPortal) {
      nextPortal.appendChild(this.votOverlayPortal);
    }

    if (prevRoot !== nextRoot) {
      if (this.votButton) {
        nextRoot.appendChild(this.votButton.container);
      }
      if (this.votMenu) {
        nextRoot.appendChild(this.votMenu.container);
      }
    }

    // Tooltip layout may depend on a different root when container changes.
    if (this.votButtonTooltip && prevTooltipRoot !== nextTooltipRoot) {
      // If tooltipLayoutRoot becomes undefined, fall back to documentElement.
      this.votButtonTooltip.updateMount({
        layoutRoot: nextTooltipRoot ?? document.documentElement,
      });
    }

    return this;
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
    translationVolumeSliderLabel: SliderLabel;
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

  addEventListener<K extends keyof OverlayViewEventMap>(
    type: K,
    listener: (...data: OverlayViewEventMap[K]) => void,
  ): this {
    this.events[type].addListener(listener);
    return this;
  }

  removeEventListener<K extends keyof OverlayViewEventMap>(
    type: K,
    listener: (...data: OverlayViewEventMap[K]) => void,
  ): this {
    this.events[type].removeListener(listener);
    return this;
  }

  private scheduleDefaultVolumePersist(): void {
    if (this.defaultVolumePersistTimer !== undefined) {
      globalThis.clearTimeout(this.defaultVolumePersistTimer);
    }

    this.defaultVolumePersistTimer = globalThis.setTimeout(() => {
      this.defaultVolumePersistTimer = undefined;
      this.flushDefaultVolumePersist();
    }, this.defaultVolumePersistDelayMs);
  }

  private flushDefaultVolumePersist(): void {
    if (this.defaultVolumePersistTimer !== undefined) {
      globalThis.clearTimeout(this.defaultVolumePersistTimer);
      this.defaultVolumePersistTimer = undefined;
    }

    if (typeof this.data.defaultVolume !== "number") {
      return;
    }

    void votStorage.set("defaultVolume", this.data.defaultVolume);
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

    // A11y: link the menu toggle button to the popover.
    this.votButton.menuButton.setAttribute(
      "aria-controls",
      this.votMenu.container.id,
    );

    // #region VOT Menu Header
    this.downloadTranslationButton = new DownloadButton();
    this.downloadTranslationButton.hidden = true;

    this.downloadSubtitlesButton = ui.createIconButton(SUBTITLES_ICON, {
      ariaLabel: "Download subtitles",
    });
    this.downloadSubtitlesButton.hidden = true;

    this.openSettingsButton = ui.createIconButton(SETTINGS_ICON, {
      ariaLabel: localizationProvider.get("VOTSettings"),
    });

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
        // `detectedLanguage` is dynamic and may include codes that aren't in
        // the compile-time Phrase union.
        selectTitle: localizationProvider.get(
          `langs.${detectedLanguage}` as any,
        ),
        items: Select.genLanguageItems(availableLangs, detectedLanguage),
      },
      to: {
        selectTitle: localizationProvider.get(
          `langs.${responseLanguage}` as any,
        ),
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
    this.translationVolumeSliderLabel = new SliderLabel({
      labelText: localizationProvider.get("VOTVolumeTranslation"),
      value: defaultVolume,
    });

    this.translationVolumeSlider = new Slider({
      labelHtml: this.translationVolumeSliderLabel.container,
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

    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    this.checkerUnsubscribe?.();
    this.checkerUnsubscribe = this.intervalIdleChecker.subscribe(() => {
      this.onCheckerTick();
    });

    // #region [Events] VOT Button
    // Prevent button click events from propagating.
    this.votButton.container.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      },
      { signal },
    );

    // Keyboard support for custom elements.
    const activateOnKey = (handler: () => void) => (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handler();
      }
    };

    // Quick settings popover state helpers.
    const setMenuOpen = (
      open: boolean,
      { returnFocusToToggle = false }: { returnFocusToToggle?: boolean } = {},
    ) => {
      if (!this.isInitialized()) return;

      this.votMenu.hidden = !open;
      this.votButton.menuButton.setAttribute("aria-expanded", open.toString());

      // The translate button tooltip is helpful when the menu is closed, but
      // becomes visual noise when the menu is open.
      if (this.votButtonTooltip) {
        this.votButtonTooltip.hidden =
          open || this.votButton.direction === "row";
      }

      if (open) {
        queueMicrotask(() => this.openSettingsButton?.focus?.());
      } else if (returnFocusToToggle) {
        queueMicrotask(() => this.votButton.menuButton.focus?.());
      } else {
        this.votButton.menuButton.blur();
      }
    };

    const toggleMenu = () => setMenuOpen(this.votMenu.hidden);
    const closeMenu = (returnFocusToToggle = false) =>
      setMenuOpen(false, { returnFocusToToggle });

    this.votButton.translateButton.addEventListener(
      "pointerdown",
      () => {
        closeMenu();
        this.events["click:translate"].dispatch();
      },
      { signal },
    );

    this.votButton.translateButton.addEventListener(
      "keydown",
      activateOnKey(() => {
        closeMenu();
        this.events["click:translate"].dispatch();
      }),
      { signal },
    );

    this.votButton.pipButton.addEventListener(
      "pointerdown",
      () => {
        closeMenu();
        this.events["click:pip"].dispatch();
      },
      { signal },
    );
    this.votButton.pipButton.addEventListener(
      "keydown",
      activateOnKey(() => {
        closeMenu();
        this.events["click:pip"].dispatch();
      }),
      { signal },
    );

    this.votButton.menuButton.addEventListener(
      "pointerdown",
      (e) => {
        e.preventDefault();
        toggleMenu();
      },
      { signal },
    );
    this.votButton.menuButton.addEventListener(
      "keydown",
      activateOnKey(toggleMenu),
      { signal },
    );

    // #region [Events] VOT Button Dragging
    // Enable cross-platform dragging:
    // - Pointer Events on desktop/pen
    // - Touch Events fallback on mobile
    // Also set `touch-action: none` so browsers don't treat the gesture as a
    // scroll/pinch action.
    const touchAction = "none";
    this.votButton.container.style.touchAction = touchAction;
    // `touch-action` is not inherited, so ensure child segments are also covered.
    this.votButton.translateButton.style.touchAction = touchAction;
    this.votButton.pipButton.style.touchAction = touchAction;
    this.votButton.menuButton.style.touchAction = touchAction;

    this.votButton.container.addEventListener("pointerdown", this.onDragStart, {
      signal,
    });
    this.votButton.container.addEventListener(
      "touchstart",
      this.onTouchDragStart,
      { signal, passive: false },
    );

    // #endregion [Events] VOT Button Dragging
    // #endregion [Events] VOT Button
    // #region [Events] VOT Menu
    this.votMenu.container.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      },
      { signal },
    );

    // don't change mousedown, otherwise it may break on youtube
    for (const event of ["pointerdown", "mousedown"]) {
      this.votMenu.container.addEventListener(
        event,
        (e) => {
          e.stopImmediatePropagation();
        },
        { signal },
      );
    }

    // Close the quick-settings menu when clicking outside.
    // Capture phase ensures we run even if the host page stops bubbling.
    document.addEventListener(
      "pointerdown",
      (e) => {
        if (this.votMenu.hidden) return;

        const target = e.target as Node | null;
        const path =
          typeof e.composedPath === "function"
            ? (e.composedPath() as unknown as EventTarget[])
            : [];

        const isInsideMenu =
          (target && this.votMenu.container.contains(target)) ||
          path.includes(this.votMenu.container);
        const isInsideToggle =
          (target && this.votButton.menuButton.contains(target)) ||
          path.includes(this.votButton.menuButton);
        const isInsideButton =
          (target && this.votButton.container.contains(target)) ||
          path.includes(this.votButton.container);

        // Keep menu open while interacting with dialogs spawned from it
        // (language picker, etc.).
        const isInsideDialog =
          target instanceof HTMLElement &&
          !!target.closest(".vot-dialog-container");

        if (
          isInsideMenu ||
          isInsideToggle ||
          isInsideButton ||
          isInsideDialog
        ) {
          return;
        }

        closeMenu(false);
      },
      { signal, capture: true, passive: true },
    );

    // Escape closes the menu when focused inside it.
    // NOTE: We keep the WAI-ARIA pattern (return focus to the toggle) only
    // when the user is in *keyboard navigation* mode (Tab). Otherwise, ESC is
    // treated as a quick-dismiss and we blur the toggle so the auto-hide timer
    // can work as expected.
    //
    // This fixes: "ESC close doesn't auto-hide after delay; works only when
    // using the close button".
    this.votMenu.container.addEventListener(
      "keydown",
      (e) => {
        if (e.key !== "Escape") return;

        const keyboardNav =
          document.documentElement.classList.contains("vot-keyboard-nav");

        e.preventDefault();
        e.stopPropagation();

        closeMenu(keyboardNav);

        // Closing via keyboard doesn't trigger pointerleave/focusout reliably,
        // so we manually queue overlay auto-hide when the overlay isn't hovered.
        const hovered =
          this.votButton.container.matches(":hover") ||
          this.votMenu.container.matches(":hover");

        if (!hovered) {
          this.videoHandler?.overlayVisibility?.queueAutoHide?.();
        }
      },
      { signal },
    );

    // #region [Events] VOT Menu Header
    this.downloadTranslationButton.addEventListener("click", () => {
      this.events["click:downloadTranslation"].dispatch();
    });

    this.downloadSubtitlesButton.addEventListener(
      "click",
      () => {
        this.events["click:downloadSubtitles"].dispatch();
      },
      { signal },
    );

    this.openSettingsButton.addEventListener(
      "click",
      () => {
        closeMenu();
        this.events["click:settings"].dispatch();
      },
      { signal },
    );

    // #endregion [Events] VOT Menu Header
    // #region [Events] VOT Menu Body
    this.languagePairSelect.fromSelect.addEventListener(
      "selectItem",
      (language) => {
        if (this.videoHandler?.videoData) {
          this.videoHandler.videoData.detectedLanguage = language;
        }
        this.events["select:fromLanguage"].dispatch(language);
      },
    );

    this.languagePairSelect.toSelect.addEventListener(
      "selectItem",
      async (language) => {
        if (this.videoHandler?.videoData) {
          this.videoHandler.translateToLang =
            this.videoHandler.videoData.responseLanguage = language;
        }
        const prevResponseLanguage = this.data.responseLanguage;
        this.data.responseLanguage = language;
        await votStorage.set("responseLanguage", this.data.responseLanguage);

        // UX: keep the "Don't translate from selected languages" list in sync
        // with the selected response language, but only while the list still
        // looks like the old default.
        if (
          this.data.enabledDontTranslateLanguages &&
          Array.isArray(this.data.dontTranslateLanguages) &&
          this.data.dontTranslateLanguages.length === 1 &&
          typeof prevResponseLanguage === "string" &&
          this.data.dontTranslateLanguages[0] === prevResponseLanguage
        ) {
          this.data.dontTranslateLanguages = [language];
          await votStorage.set(
            "dontTranslateLanguages",
            this.data.dontTranslateLanguages,
          );
        }
        this.events["select:toLanguage"].dispatch(language);
      },
    );

    this.subtitlesSelect.addEventListener("beforeOpen", async (dialog) => {
      if (!this.videoHandler?.videoData) {
        return;
      }

      const cacheKey = this.videoHandler.getSubtitlesCacheKey(
        this.videoHandler.videoData.videoId,
        this.videoHandler.videoData.detectedLanguage,
        this.videoHandler.videoData.responseLanguage,
      );
      if (this.videoHandler.cacheManager.getSubtitles(cacheKey)) {
        return;
      }

      if (this.votButton) {
        this.votButton.loading = true;
      }
      const loadingEl = ui.createInlineLoader();
      loadingEl.style.margin = "0 auto";
      dialog.footerContainer.appendChild(loadingEl);
      await this.videoHandler.loadSubtitles();
      loadingEl.remove();
      if (this.votButton) {
        this.votButton.loading = false;
      }
    });

    this.subtitlesSelect.addEventListener("selectItem", (data) => {
      this.events["select:subtitles"].dispatch(data);
    });

    this.videoVolumeSlider.addEventListener("input", (value, fromSetter) => {
      if (this.videoVolumeSliderLabel) {
        this.videoVolumeSliderLabel.value = value;
      }
      if (fromSetter) {
        return;
      }

      this.events["input:videoVolume"].dispatch(value);
    });

    this.translationVolumeSlider.addEventListener(
      "input",
      (value, fromSetter) => {
        if (this.translationVolumeSliderLabel) {
          this.translationVolumeSliderLabel.value = value;
        }
        this.data.defaultVolume = value;
        this.scheduleDefaultVolumePersist();
        if (fromSetter) {
          return;
        }

        this.events["input:translationVolume"].dispatch(value);
      },
    );

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

  moveButton(percentX: number) {
    if (!this.isInitialized()) {
      return this;
    }

    const isBigContainer = this.dragIsBigContainer ?? this.isBigContainer;
    const position = VOTButton.calcPosition(percentX, isBigContainer);
    if (position === this.votButton.position) {
      return this;
    }

    const direction = VOTButton.calcDirection(position);
    this.data.buttonPos = position;
    this.updateButtonLayout(position, direction);

    return this;
  }

  onDragStart = (event: PointerEvent) => {
    // Only start drag on the primary pointer and the "primary" button.
    // (For touch pointers, `button` is 0.)
    if (!event.isPrimary || event.button !== 0) return;

    // On touch devices we prefer Touch Events for dragging (better compatibility
    // with browser gesture handling and passive listener defaults).
    if (event.pointerType === "touch") return;

    event.preventDefault();

    this.dragCandidate = true;
    this.dragging = false;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.currentClientX = event.clientX;

    this.containerRect = this.root.getBoundingClientRect();
    this.dragIsBigContainer = this.isBigContainer;
    this.dragDirty = false;
    this.intervalIdleChecker.markActivity("overlay-pointer-down");
    this.intervalIdleChecker.requestImmediateTick();

    document.addEventListener("pointermove", this.onGlobalPointerMove);
    document.addEventListener("pointerup", this.onDragEnd);
    document.addEventListener("pointercancel", this.onDragEnd);
  };

  // Touch fallback for browsers/environments that don't deliver Pointer Events
  // reliably on mobile. We only use the first active touch.
  onTouchDragStart = (event: TouchEvent) => {
    if (!event.touches || event.touches.length === 0) return;

    this.dragCandidate = true;
    this.dragging = false;

    const t = event.touches[0];
    this.dragStartX = t.clientX;
    this.dragStartY = t.clientY;
    this.currentClientX = t.clientX;

    this.containerRect = this.root.getBoundingClientRect();
    this.dragIsBigContainer = this.isBigContainer;
    this.dragDirty = false;
    this.intervalIdleChecker.markActivity("overlay-touch-start");
    this.intervalIdleChecker.requestImmediateTick();

    // Register non-passive move listener so we can call preventDefault()
    // once we detect an actual drag.
    document.addEventListener("touchmove", this.onGlobalTouchMove, {
      passive: false,
    });
    document.addEventListener("touchend", this.onDragEnd);
    document.addEventListener("touchcancel", this.onDragEnd);
  };

  onGlobalTouchMove = (event: TouchEvent) => {
    if (!event.touches || event.touches.length === 0) return;
    const t = event.touches[0];

    this.currentClientX = t.clientX;
    const clientY = t.clientY;

    if (!this.dragCandidate) return;

    if (!this.dragging) {
      const dx = Math.abs(this.currentClientX - this.dragStartX);
      const dy = Math.abs(clientY - this.dragStartY);
      if (dx + dy >= this.dragThresholdPx) {
        this.dragging = true;
      }
    }

    // Only prevent page scrolling once we're sure the user is dragging.
    if (this.dragging) {
      event.preventDefault();
    }

    if (this.dragging) {
      this.dragDirty = true;
      this.intervalIdleChecker.markActivity("overlay-touch-move");
      this.intervalIdleChecker.requestImmediateTick();
    }
  };

  onGlobalPointerMove = (event: PointerEvent) => {
    this.currentClientX = event.clientX;
    const clientY = event.clientY;

    if (!this.dragCandidate) return;

    if (!this.dragging) {
      const dx = Math.abs(this.currentClientX - this.dragStartX);
      const dy = Math.abs(clientY - this.dragStartY);
      if (dx + dy >= this.dragThresholdPx) {
        this.dragging = true;
      }
    }

    if (this.dragging) {
      this.dragDirty = true;
      this.intervalIdleChecker.markActivity("overlay-pointer-move");
      this.intervalIdleChecker.requestImmediateTick();
    }
  };

  private readonly applyDragFromState = () => {
    if (!this.dragging || !this.dragDirty || !this.containerRect) return;

    this.dragDirty = false;
    const x = this.currentClientX - this.containerRect.left;
    const clampedX = Math.max(0, Math.min(x, this.containerRect.width));
    const percentX = (clampedX / this.containerRect.width) * 100;

    this.moveButton(percentX);
  };

  private readonly onCheckerTick = () => {
    this.applyDragFromState();
  };

  onDragEnd = () => {
    document.removeEventListener("pointermove", this.onGlobalPointerMove);
    document.removeEventListener("pointerup", this.onDragEnd);
    document.removeEventListener("pointercancel", this.onDragEnd);

    document.removeEventListener("touchmove", this.onGlobalTouchMove);
    document.removeEventListener("touchend", this.onDragEnd);
    document.removeEventListener("touchcancel", this.onDragEnd);
    this.applyDragFromState();

    const isBigContainer = this.dragIsBigContainer ?? this.isBigContainer;
    if (this.dragging && isBigContainer && this.data.buttonPos) {
      void votStorage.set("buttonPos", this.data.buttonPos);
    }

    this.dragging = false;
    this.dragCandidate = false;
    this.dragDirty = false;
    this.containerRect = null;
    this.dragIsBigContainer = null;
  };

  updateButtonOpacity(opacity: number) {
    if (!this.isInitialized() || !this.votMenu.hidden) {
      return this;
    }

    // Avoid redundant style writes on high-frequency interaction events.
    if (Math.abs(this.votButton.opacity - opacity) > 0.01) {
      this.votButton.opacity = opacity;
    }
    return this;
  }

  private doReleaseUI(): void {
    this.votButton?.remove();
    this.votMenu?.remove();
    this.votButtonTooltip?.release();
    this.votOverlayPortal?.remove();
  }

  private doReleaseUIEvents(): void {
    this.abortController?.abort();
    this.abortController = null;
    this.checkerUnsubscribe?.();
    this.checkerUnsubscribe = null;

    this.onDragEnd();
    this.flushDefaultVolumePersist();

    for (const event of Object.values(this.events)) {
      event.clear();
    }
  }

  releaseUI(initialized = false) {
    if (!this.isInitialized()) {
      throw new Error("[VOT] OverlayView isn't initialized");
    }

    this.doReleaseUI();

    this.initialized = initialized;
    return this;
  }

  releaseUIEvents(initialized = false) {
    if (!this.isInitialized()) {
      throw new Error("[VOT] OverlayView isn't initialized");
    }

    this.doReleaseUIEvents();

    this.initialized = initialized;
    return this;
  }

  release() {
    if (!this.isInitialized()) {
      return this;
    }

    // Release events first to prevent late handlers from touching removed DOM.
    this.doReleaseUIEvents();
    this.doReleaseUI();

    this.initialized = false;
    return this;
  }

  get isBigContainer() {
    const widthFromVideo =
      this.videoHandler?.video?.getBoundingClientRect?.().width;
    if (typeof widthFromVideo === "number" && Number.isFinite(widthFromVideo)) {
      return widthFromVideo > 550;
    }

    const widthFromContainer =
      this.videoHandler?.container?.getBoundingClientRect?.().width;
    if (
      typeof widthFromContainer === "number" &&
      Number.isFinite(widthFromContainer)
    ) {
      return widthFromContainer > 550;
    }

    return this.root.clientWidth > 550;
  }

  get pipButtonVisible() {
    return isPiPAvailable() && !!this.data.showPiPButton;
  }
}
