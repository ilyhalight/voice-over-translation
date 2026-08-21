import { FullscreenHelper } from "../../core/fullscreenHelper";
import { localizationProvider } from "../../localization/localizationProvider";
import { setSettings, settings } from "../../stores/settings";
import type { Direction, Position } from "../../types/components/votButton";
import type { StorageData } from "../../types/storage";
import type { ButtonLayout, OverlayMount } from "../../types/uiManager";
import type {
  OverlayViewEventMap,
  OverlayViewProps,
} from "../../types/views/overlay";
import ui from "../../ui";
import { containsCrossShadow, getDeepActiveElement } from "../../utils/dom";
import { EventImpl } from "../../utils/eventImpl";
import { hasTouchScreen, isTouchFirstInput } from "../../utils/inputDevice";
import type { IntervalIdleChecker } from "../../utils/intervalIdleChecker";
import { votStorage } from "../../utils/storage";
import type { VideoHandler } from "../../VideoHandler";
import {
  OverlayView as OverlayViewComponent,
  type OverlayViewControls,
} from "../../views/OverlayView";
import {
  normalizeButtonPosition,
  resolveButtonLayout,
} from "../buttonPlacement";
import VOTButton from "../components/votButton";
import VOTMenu from "../components/votMenu";
import { SETTINGS_ICON } from "./../icons";
import {
  createShadowMount,
  destroyShadowMount,
  reparentShadowMount,
  type ShadowMount,
} from "../shadowMount";
import { type MountedComponent, mountComponent } from "../solid/mountComponent";

export class OverlayView {
  private static readonly BIG_CONTAINER_WIDTH_PX = 550;
  private resizeObserver?: ResizeObserver;
  private lastIsBigContainer = false;
  private readonly fullscreenHelper: FullscreenHelper;

  mount: OverlayMount;
  private abortController: AbortController | null = null;
  private defaultVolumePersistTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly defaultVolumePersistDelayMs = 250;

  private initialized = false;
  private readonly data: Partial<StorageData>;
  private readonly videoHandler?: VideoHandler;
  private readonly intervalIdleChecker: IntervalIdleChecker;
  private overlayMount?: ShadowMount;
  overlayViewControls?: OverlayViewControls;
  private overlayViewComponent?: MountedComponent<HTMLDivElement>;

  private readonly events: {
    [K in keyof OverlayViewEventMap]: EventImpl<OverlayViewEventMap[K]>;
  } = {
    "click:settings": new EventImpl<OverlayViewEventMap["click:settings"]>(),
    "click:pip": new EventImpl<OverlayViewEventMap["click:pip"]>(),
    "click:subtitles": new EventImpl<OverlayViewEventMap["click:subtitles"]>(),
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
    "select:voiceType": new EventImpl<
      OverlayViewEventMap["select:voiceType"]
    >(),
  };

  // button
  votButton?: VOTButton;
  // menu
  votMenu?: VOTMenu;
  openSettingsButton?: HTMLElement;

  constructor({
    mount,
    data = {},
    videoHandler,
    intervalIdleChecker,
  }: OverlayViewProps) {
    this.mount = mount;
    this.data = data;
    this.videoHandler = videoHandler;
    this.intervalIdleChecker = intervalIdleChecker;

    this.fullscreenHelper = new FullscreenHelper({
      container: videoHandler?.container || (mount.root as HTMLElement),
      video: videoHandler?.video,
    });
  }

  get root(): HTMLElement | ShadowRoot {
    return this.overlayMount?.root ?? this.mount.root;
  }

  get portalContainer(): HTMLElement {
    return this.mount.portalContainer;
  }

  /**
   * Update mount points when the player container changes.
   * Moves already-mounted UI nodes and rebinds root-bound listeners (dragging).
   */
  updateMount(nextMount: OverlayMount): this {
    const prevRoot = this.mount.root;
    const nextRoot = nextMount.root;

    this.mount = nextMount;

    if (!this.isInitialized()) {
      return this;
    }

    if (prevRoot !== nextRoot && this.overlayMount) {
      reparentShadowMount(this.overlayMount, nextRoot);
    }

    return this;
  }

  isInitialized(): this is {
    // #region Button type
    votButton: VOTButton;
    // voicePopover: VoicePopover;
    // #endregion Button type
    // #region Menu type
    votMenu: VOTMenu;
    openSettingsButton: HTMLElement;
    // #endregion Menu type
  } {
    return this.initialized;
  }

  calcButtonLayout(position: string): ButtonLayout {
    return resolveButtonLayout(this.isBigContainer, position);
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

  initUI(buttonPosition: string = "default") {
    if (this.isInitialized()) {
      throw new Error("[VOT] OverlayView is already initialized");
    }

    this.initialized = true;
    this.lastIsBigContainer = this.isBigContainer;
    this.overlayMount = createShadowMount({
      parent: this.mount.root,
      rootClasses: ["vot-overlay-root"],
      hostStyles: {
        position: "absolute",
        inset: "0",
        display: "block",
        "pointer-events": "none",
      },
      rootStyles: {
        position: "relative",
        display: "block",
        width: "100%",
        height: "100%",
        "pointer-events": "none",
      },
    });

    // #region Shared logic
    const { position, direction } = this.calcButtonLayout(buttonPosition);

    // #endregion Shared logic
    // #region VOT Button
    this.votButton = new VOTButton({
      position,
      direction,
      status: "none",
      labelHtml: localizationProvider.get("translateVideo"),
    });

    const videoVolume = this.videoHandler
      ? this.videoHandler.getVideoVolume() * 100
      : 100;

    this.overlayViewComponent = mountComponent<HTMLDivElement>((rootRef) =>
      OverlayViewComponent({
        ref: rootRef,
        controlsRef: (controls) => {
          this.overlayViewControls = controls;
        },
        isBigContainer: this.isBigContainer,
        detectedLanguage: this.videoHandler?.videoData?.detectedLanguage,
        responseLanguage: this.data.responseLanguage,
        videoVolume,
        onButtonDragActivity: (source) =>
          this.intervalIdleChecker.markActivity(source),
        onButtonDragEnd: () => this.queueButtonAutoHideAfterInteraction(),
        onButtonPositionChange: (position) => {
          this.data.buttonPos = position;
        },
        onTranslateClick: () => {
          this.events["click:translate"].dispatch();
        },
        onPiPClick: () => {
          this.events["click:pip"].dispatch();
        },
        onSubtitlesClick: () => {
          this.events["click:subtitles"].dispatch();
        },
        onSubtitlesOpen: () =>
          this.videoHandler?.ensureSubtitlesForCurrentLangPair(),
        onSubtitlesSelect: (value) => {
          this.events["select:subtitles"].dispatch(value);
        },
        onVoiceChange: (voice) => {
          const useLive = voice === "live";
          this.data.useLivelyVoice = useLive;
          void votStorage.set("useLivelyVoice", useLive);
          this.events["select:voiceType"].dispatch(useLive);
          queueMicrotask(() => this.queueButtonAutoHideAfterInteraction());
        },
        onVideoVolumeInput: (volume) => {
          this.events["input:videoVolume"].dispatch(volume);
        },
        onTranslationVolumeInput: (volume) => {
          if (this.data.defaultVolume !== volume) {
            this.data.defaultVolume = volume;
            this.scheduleDefaultVolumePersist();
          }

          this.events["input:translationVolume"].dispatch(volume);
        },
        onDownloadTranslationClick: () => {
          this.events["click:downloadTranslation"].dispatch();
        },
        onDownloadSubtitlesClick: () => {
          this.events["click:downloadSubtitles"].dispatch();
        },
        onDetectedLanguageSelect: (language) => {
          if (this.videoHandler?.videoData) {
            this.videoHandler.videoData.detectedLanguage = language;
            this.videoHandler.videoManager.rememberUserLanguageSelection(
              this.videoHandler.videoData.videoId,
              language,
            );
          }
          this.events["select:fromLanguage"].dispatch(language);
        },
        onResponseLanguageSelect: async (language) => {
          if (this.videoHandler?.videoData) {
            this.videoHandler.translateToLang =
              this.videoHandler.videoData.responseLanguage = language;
          }

          const prevResponseLanguage = this.data.responseLanguage;
          if (prevResponseLanguage !== language) {
            this.data.responseLanguage = language;
            await votStorage.set(
              "responseLanguage",
              this.data.responseLanguage,
            );
          }

          // UX: keep the "Don't translate from selected languages" list in sync
          // with the selected response language, but only while the list still
          // looks like the old default.
          // TODO: recheck it later
          if (
            Array.isArray(this.data.dontTranslateLanguages) &&
            this.data.dontTranslateLanguages.length === 1 &&
            prevResponseLanguage !== language &&
            typeof prevResponseLanguage === "string" &&
            this.data.dontTranslateLanguages[0] === prevResponseLanguage
          ) {
            setSettings("dontTranslateLanguages", [language]);
            this.data.dontTranslateLanguages = [language];
            await votStorage.set(
              "dontTranslateLanguages",
              this.data.dontTranslateLanguages,
            );
          }
          this.events["select:toLanguage"].dispatch(language);
        },
      }),
    );

    this.root.appendChild(this.overlayViewComponent.root);

    // #endregion VOT Button
    // #region VOT Menu
    this.votMenu = new VOTMenu({
      titleHtml: localizationProvider.get("VOTSettings"),
      position,
    });
    this.root.appendChild(this.votMenu.container);

    this.setupResizeObserver();

    // #region VOT Menu Header

    this.openSettingsButton = ui.createIconButton(SETTINGS_ICON, {
      ariaLabel: localizationProvider.get("VOTSettings"),
    });

    this.votMenu.headerContainer.append(this.openSettingsButton);

    // #endregion VOT Menu Header
    // #endregion VOT Menu
    return this;
  }

  initUIEvents() {
    if (!this.isInitialized()) {
      throw new Error("[VOT] OverlayView isn't initialized");
    }

    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    // #region [Events] VOT Button

    // Quick settings popover state helpers.
    const setMenuOpen = (
      open: boolean,
      { returnFocusToToggle = false }: { returnFocusToToggle?: boolean } = {},
    ) => {
      if (!this.isInitialized()) return;

      this.votMenu.hidden = !open;
      this.votButton.menuButton.setAttribute("aria-expanded", open.toString());

      if (open) {
        queueMicrotask(() => this.openSettingsButton?.focus?.());
      } else if (returnFocusToToggle) {
        queueMicrotask(() => this.votButton.menuButton.focus?.());
      } else {
        this.votButton.menuButton.blur();
      }
    };

    const closeMenu = (returnFocusToToggle = false) =>
      setMenuOpen(false, { returnFocusToToggle });

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

    for (const event of ["pointerdown"]) {
      this.votMenu.container.addEventListener(
        event,
        (e) => {
          e.stopImmediatePropagation();
        },
        { signal },
      );
    }

    // #region [Events] VOT Menu Header
    this.openSettingsButton.addEventListener(
      "click",
      () => {
        closeMenu();
        this.events["click:settings"].dispatch();
      },
      { signal },
    );

    // #endregion [Events] VOT Menu Header
    // #endregion [Events] VOT Menu
    return this;
  }

  updateButtonLayout(
    position: Position,
    direction: Direction,
    options: { keepVoicePopover?: boolean } = {},
  ) {
    if (!this.isInitialized()) {
      return this;
    }

    this.votMenu.position = position;

    this.votButton.position = position;
    this.votButton.direction = direction;
    this.votButton.syncDropdownArrowPlacement();

    if (!options.keepVoicePopover) {
      // if (!options.keepVoicePopover && this.voicePopover?.isOpen) {
      // this.voicePopover.hideNow();
      this.votButton.setVoiceMenuOpen(false);
    }

    return this;
  }

  private isElementHovered(element: HTMLElement | null | undefined): boolean {
    if (!element?.isConnected) return false;

    try {
      return element.matches(":hover");
    } catch {
      return false;
    }
  }

  private getFloatingInteractionTargets(): HTMLElement[] {
    const overlayViewControls = this.overlayViewControls;
    if (!overlayViewControls) {
      return [];
    }

    return [
      overlayViewControls.getButtonOverlayEl(),
      overlayViewControls.getMenuOverlayEl(),
      overlayViewControls.getVoicePopoverEl(),
    ].filter((element) => element.isConnected);
  }

  private isKeyboardFocusWithinFloatingUI(): boolean {
    if (
      typeof document === "undefined" ||
      typeof document.hasFocus !== "function" ||
      !document.hasFocus() ||
      !document.documentElement.classList.contains("vot-keyboard-nav")
    ) {
      return false;
    }

    const active = getDeepActiveElement(document);
    if (!(active instanceof Node)) return false;

    return this.getFloatingInteractionTargets().some((target) =>
      containsCrossShadow(target, active),
    );
  }

  shouldKeepVisibleForInteraction(): boolean {
    if (!this.isInitialized()) return false;

    const hoverActive =
      !isTouchFirstInput() &&
      this.getFloatingInteractionTargets().some((target) =>
        this.isElementHovered(target),
      );

    return (
      this.hasOpenFloatingButtonUI() ||
      hoverActive ||
      this.isKeyboardFocusWithinFloatingUI()
    );
  }

  private blurPointerFocusInsideButton(): void {
    const overlayViewControls = this.overlayViewControls;
    if (
      !overlayViewControls ||
      document.documentElement.classList.contains("vot-keyboard-nav")
    ) {
      return;
    }

    const active = getDeepActiveElement(document);
    if (
      active instanceof HTMLElement &&
      containsCrossShadow(overlayViewControls.getButtonOverlayEl(), active)
    ) {
      active.blur();
    }
  }

  private hasOpenFloatingButtonUI(): boolean {
    const overlayViewControls = this.overlayViewControls;
    if (!overlayViewControls) {
      return false;
    }

    return (
      !overlayViewControls.getMenuHidden() ||
      overlayViewControls.isVoicePopoverOpen()
    );
  }

  private queueButtonAutoHideAfterInteraction(): void {
    if (!this.isInitialized()) return;

    if (this.shouldKeepVisibleForInteraction()) {
      this.videoHandler?.overlayVisibility?.cancel?.();
      return;
    }

    this.blurPointerFocusInsideButton();

    if (this.shouldKeepVisibleForInteraction()) {
      this.videoHandler?.overlayVisibility?.cancel?.();
      return;
    }

    this.videoHandler?.overlayVisibility?.queueAutoHide?.();
  }

  updateButtonOpacity(opacity: number) {
    const overlayViewControls = this.overlayViewControls;
    if (!overlayViewControls?.getMenuHidden()) {
      return this;
    }

    const nextOpacity =
      opacity <= 0.01 &&
      overlayViewControls.isVoicePopoverOpen() &&
      hasTouchScreen()
        ? 1
        : opacity;

    // Avoid redundant style writes on high-frequency interaction events.
    if (
      Math.abs(this.overlayViewControls.getButtonOpacity() - nextOpacity) > 0.01
    ) {
      this.overlayViewControls.setButtonOpacity(nextOpacity);
      // If the button is fading out, immediately close the voice popover so it
      // doesn't float in the void after the anchor disappears. Touch screens
      // keep the button visible while the popover is open because there is no
      // stable hover state to keep the overlay alive.
      if (nextOpacity <= 0.01) {
        this.overlayViewControls.closeVoicePopover();
      }
    }
    return this;
  }

  private doReleaseUI(): void {
    this.votButton?.remove();
    this.votMenu?.remove();
    this.overlayViewComponent?.dispose();
    this.overlayViewComponent = undefined;
    this.overlayViewControls = undefined;

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }

    this.fullscreenHelper.destroy();

    destroyShadowMount(this.overlayMount);
    this.overlayMount = undefined;
  }

  private doReleaseUIEvents(): void {
    this.abortController?.abort();
    this.abortController = null;

    this.flushDefaultVolumePersist();

    for (const event of Object.values(this.events)) {
      event.clear();
    }
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
    return this.fullscreenHelper.isBigContainer(
      OverlayView.BIG_CONTAINER_WIDTH_PX,
    );
  }

  private setupResizeObserver(): void {
    if (this.resizeObserver) {
      return;
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const currentIsBigContainer =
          width > OverlayView.BIG_CONTAINER_WIDTH_PX;

        if (this.lastIsBigContainer !== currentIsBigContainer) {
          this.lastIsBigContainer = currentIsBigContainer;
          this.handleContainerSizeChange(currentIsBigContainer);
        }

        this.updateMenuHeight(entry.contentRect.height);
      }
    });

    const target = this.fullscreenHelper.getResizeObserverTarget();
    this.resizeObserver.observe(target);
  }

  private updateMenuHeight(containerHeight?: number): void {
    if (!this.isInitialized() || !this.votMenu?.container) {
      return;
    }

    let height: number;

    if (containerHeight && containerHeight > 200) {
      height = containerHeight;
    } else {
      const target = this.fullscreenHelper.getResizeObserverTarget();
      const rect = target.getBoundingClientRect();
      height = rect.height || target.clientHeight || window.innerHeight * 0.75;
    }

    if (!height || height < 200) {
      height = window.innerHeight * 0.75;
    }

    this.votMenu.container.style.setProperty(
      "--vot-container-height",
      `${height}px`,
    );
  }

  private handleContainerSizeChange(isBigContainer: boolean): void {
    if (!this.isInitialized()) {
      return;
    }

    const preferredPosition = normalizeButtonPosition(
      this.data.buttonPos ?? settings.buttonPos,
    );
    const { position, direction } = resolveButtonLayout(
      isBigContainer,
      preferredPosition,
    );

    if (
      position !== this.votButton.position ||
      direction !== this.votButton.direction
    ) {
      this.updateButtonLayout(position, direction);
    }
  }
}
