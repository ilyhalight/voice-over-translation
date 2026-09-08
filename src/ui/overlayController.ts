import {
  OverlayView as OverlayViewComponent,
  type OverlayViewControls,
} from "../components/OverlayView/OverlayView";
import { FullscreenHelper } from "../core/fullscreenHelper";
import { setSettings } from "../stores/settings";
import type { LanguageSelectKey } from "../types/components/select";
import type { StorageData } from "../types/storage";
import type { OverlayMount } from "../types/uiManager";
import { containsCrossShadow, getDeepActiveElement } from "../utils/dom";
import { EventImpl } from "../utils/eventImpl";
import { hasTouchScreen, isTouchFirstInput } from "../utils/inputDevice";
import type { IntervalIdleChecker } from "../utils/intervalIdleChecker";
import { votStorage } from "../utils/storage";
import type { VideoHandler } from "../VideoHandler";
import {
  createShadowMount,
  destroyShadowMount,
  reparentShadowMount,
  type ShadowMount,
} from "./shadowMount";
import { render } from "./solid/renderer";

type OverlayControllerProps = {
  mount: OverlayMount;
  data?: Partial<StorageData>;
  videoHandler?: VideoHandler;
  intervalIdleChecker: IntervalIdleChecker;
};

type OverlayControllerEventMap = {
  "click:settings": [];
  "click:pip": [];
  "click:subtitles": [];
  "click:downloadTranslation": [];
  "click:downloadSubtitles": [];
  "click:translate": [];
  "input:videoVolume": [volume: number];
  "input:translationVolume": [volume: number];
  "select:fromLanguage": [item: LanguageSelectKey];
  "select:toLanguage": [item: LanguageSelectKey];
  "select:subtitles": [item: string];
  "select:voiceType": [useLive: boolean];
};

export class OverlayController {
  private static readonly BIG_CONTAINER_WIDTH_PX = 550;
  private resizeObserver?: ResizeObserver;
  private readonly fullscreenHelper: FullscreenHelper;

  mount: OverlayMount;
  private defaultVolumePersistTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly defaultVolumePersistDelayMs = 250;

  private initialized = false;
  private readonly data: Partial<StorageData>;
  private readonly videoHandler?: VideoHandler;
  private readonly intervalIdleChecker: IntervalIdleChecker;
  private overlayMount?: ShadowMount;
  overlayViewControls?: OverlayViewControls;
  private disposeOverlay?: () => void;

  private readonly events: {
    [K in keyof OverlayControllerEventMap]: EventImpl<
      OverlayControllerEventMap[K]
    >;
  } = {
    "click:settings": new EventImpl<
      OverlayControllerEventMap["click:settings"]
    >(),
    "click:pip": new EventImpl<OverlayControllerEventMap["click:pip"]>(),
    "click:subtitles": new EventImpl<
      OverlayControllerEventMap["click:subtitles"]
    >(),
    "click:downloadTranslation": new EventImpl<
      OverlayControllerEventMap["click:downloadTranslation"]
    >(),
    "click:downloadSubtitles": new EventImpl<
      OverlayControllerEventMap["click:downloadSubtitles"]
    >(),
    "click:translate": new EventImpl<
      OverlayControllerEventMap["click:translate"]
    >(),
    "input:videoVolume": new EventImpl<
      OverlayControllerEventMap["input:videoVolume"]
    >(),
    "input:translationVolume": new EventImpl<
      OverlayControllerEventMap["input:translationVolume"]
    >(),
    "select:fromLanguage": new EventImpl<
      OverlayControllerEventMap["select:fromLanguage"]
    >(),
    "select:toLanguage": new EventImpl<
      OverlayControllerEventMap["select:toLanguage"]
    >(),
    "select:subtitles": new EventImpl<
      OverlayControllerEventMap["select:subtitles"]
    >(),
    "select:voiceType": new EventImpl<
      OverlayControllerEventMap["select:voiceType"]
    >(),
  };

  constructor({
    mount,
    data = {},
    videoHandler,
    intervalIdleChecker,
  }: OverlayControllerProps) {
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
    this.setupResizeObserver();

    return this;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  addEventListener<K extends keyof OverlayControllerEventMap>(
    type: K,
    listener: (...data: OverlayControllerEventMap[K]) => void,
  ): this {
    this.events[type].addListener(listener);
    return this;
  }

  removeEventListener<K extends keyof OverlayControllerEventMap>(
    type: K,
    listener: (...data: OverlayControllerEventMap[K]) => void,
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

  initUI() {
    if (this.isInitialized()) {
      throw new Error("[VOT] OverlayController is already initialized");
    }

    this.initialized = true;
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

    // #region VOT Button
    const videoVolume = this.videoHandler
      ? this.videoHandler.getVideoVolume() * 100
      : 100;

    this.disposeOverlay = render(
      () =>
        OverlayViewComponent({
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
          onSettingsClick: () => {
            this.events["click:settings"].dispatch();
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
        }) as Node,
      this.root,
    );
    this.setupResizeObserver();
    // #endregion VOT Menu
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
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.disposeOverlay?.();
    this.disposeOverlay = undefined;
    this.overlayViewControls = undefined;

    this.fullscreenHelper.destroy();

    destroyShadowMount(this.overlayMount);
    this.overlayMount = undefined;
  }

  private doReleaseUIEvents(): void {
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
      OverlayController.BIG_CONTAINER_WIDTH_PX,
    );
  }

  private setupResizeObserver(): void {
    this.resizeObserver?.disconnect();
    const target = this.fullscreenHelper.getResizeObserverTarget();
    const video = this.videoHandler?.video;
    const syncContainerSize = () => {
      const targetRect = target.getBoundingClientRect();
      const videoRect = video?.getBoundingClientRect();
      const width =
        videoRect?.width &&
        (targetRect.width <= 0 || videoRect.width < targetRect.width)
          ? videoRect.width
          : targetRect.width;
      const height =
        videoRect?.height &&
        (targetRect.height <= 0 || videoRect.height < targetRect.height)
          ? videoRect.height
          : targetRect.height;
      this.overlayViewControls?.setContainerSize(width, height);
    };

    this.resizeObserver = new ResizeObserver(syncContainerSize);
    this.resizeObserver.observe(target);
    if (video && video !== target) {
      this.resizeObserver.observe(video);
    }
    syncContainerSize();
  }
}
