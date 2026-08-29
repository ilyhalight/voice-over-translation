import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";
import {
  createEffect,
  createMemo,
  createSignal,
  type JSX,
  mergeProps,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import type { SelectOption } from "../components/Control/Select";
import { PreviewSegmentedButtonOverlay } from "../components/SegmentedButton/PreviewSegmentedButtonOverlay";
import type { SegmentedButtonControls } from "../components/SegmentedButton/SegmentedButton";
import type { SegmentedButtonMenuControls } from "../components/SegmentedButton/SegmentedButtonMenu";
import {
  SegmentedButtonMenuOverlay,
  type SegmentedButtonMenuOverlayProps,
} from "../components/SegmentedButton/SegmentedButtonMenuOverlay";
import {
  SegmentedButtonOverlay,
  type SegmentedButtonOverlayProps,
} from "../components/SegmentedButton/SegmentedButtonOverlay";
import { localizationProvider } from "../localization/localizationProvider";
import { setSettings, settings } from "../stores/settings";
import type { Position, Status } from "../types/components/votButton";
import {
  getButtonDirection,
  isSideButtonPosition,
  normalizeButtonPosition,
  resolveButtonPositionFromPointer,
} from "../ui/buttonPlacement";
import { votStorage } from "../utils/storage";
import { isPiPAvailable } from "../utils/utils";

type ButtonDragState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  clientX: number;
  clientY: number;
  grabOffsetX: number;
  grabOffsetY: number;
  buttonWidth: number;
  buttonHeight: number;
  targetPosition: Position;
  frameId: number | null;
};

export type OverlayViewControls = {
  setStatus: (status: Status) => void;
  getStatus: () => Status;
  setIsLoading: (isLoading: boolean) => void;
  getIsLoading: () => boolean;
  setLabelText: (text: string) => void;
  setSubtitlesOptions: (options: SelectOption[]) => void;
  setSelectedSubtitles: (value: string) => void;
  getSelectedSubtitles: () => string;
  setButtonHidden: (hidden: boolean) => void;
  getButtonHidden: () => boolean;
  setMenuHidden: (hidden: boolean) => void;
  getMenuHidden: () => boolean;
  setButtonOpacity: (opacity: number) => void;
  getButtonOpacity: () => number;
  setContainerSize: (width: number, height: number) => void;
  closeVoicePopover: () => void;
  getButtonOverlayEl: () => HTMLElement | undefined;
  getMenuOverlayEl: () => HTMLElement | undefined;
  getShowTranslationVolume: () => boolean;
  setShowTranslationVolume: (show: boolean) => void;
  getShowDownloadTranslation: () => boolean;
  setShowDownloadTranslation: (show: boolean) => void;
  getShowDownloadSubtitles: () => boolean;
  setShowDownloadSubtitles: (show: boolean) => void;
  setDetectedLanguage: (language: RequestLang) => void;
  setResponseLanguage: (language: ResponseLang) => void;
} & Pick<SegmentedButtonControls, "getVoicePopoverEl" | "isVoicePopoverOpen"> &
  Pick<
    SegmentedButtonMenuControls,
    | "setVideoVolume"
    | "getVideoVolume"
    | "getTranslationVolume"
    | "setTranslationVolume"
    | "getMaxTranslationVolume"
    | "setShowTranslationProgress"
    | "setTranslationProgress"
  >;

export type OverlayViewProps = {
  ref?: (element: HTMLElement) => void;
  controlsRef?: (controls: OverlayViewControls) => void;
  isBigContainer?: boolean;
  /**
   * used only for testing purposes, to set the initial opacity of the button overlay
   */
  baseOpacity?: number;
  detectedLanguage?: RequestLang;
  responseLanguage?: ResponseLang;
  onButtonDragActivity?: (source: string) => void;
  onButtonDragEnd?: () => void;
  onButtonDragStart?: () => void;
  onButtonPositionChange?: (position: Position) => void;
} & Partial<
  Pick<
    SegmentedButtonOverlayProps,
    | "status"
    | "onTranslateClick"
    | "onVoiceChange"
    | "onPiPClick"
    | "onSubtitlesClick"
  >
> &
  Partial<
    Pick<
      SegmentedButtonMenuOverlayProps,
      | "videoVolume"
      | "onVideoVolumeInput"
      | "onTranslationVolumeInput"
      | "onDownloadTranslationClick"
      | "onDownloadSubtitlesClick"
      | "onSettingsClick"
      | "onDetectedLanguageSelect"
      | "onResponseLanguageSelect"
      | "onSubtitlesOpen"
      | "onSubtitlesSelect"
    >
  >;

const BIG_CONTAINER_WIDTH_PX = 550;
const DRAG_ACTION_SUPPRESS_MS = 350;
const DRAG_THRESHOLD_PX = 6;

export function OverlayView(props: OverlayViewProps): JSX.Element {
  const finalProps = mergeProps(
    {
      isBigContainer: false,
      detectedLanguage: "en",
      responseLanguage: "ru",
      status: "none",
      baseOpacity: 0,
    } as Partial<OverlayViewProps>,
    props,
  );
  const [isBigContainer, setIsBigContainer] = createSignal(
    finalProps.isBigContainer,
  );
  const [dockPreviewPosition, setDockPreviewPosition] =
    createSignal<Position>();
  const [menuHidden, setMenuHiddenState] = createSignal(true);
  const [buttonHidden, setButtonHiddenState] = createSignal(false);
  const [buttonOpacity, setButtonOpacity] = createSignal(
    finalProps.baseOpacity,
  );
  const [isDragging, setIsDragging] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(false);
  const [subtitlesOptions, setSubtitlesOptions] = createSignal<SelectOption[]>([
    {
      label: localizationProvider.get("VOTSubtitlesDisabled"),
      value: "disabled",
    },
  ]);
  const [selectedSubtitles, setSelectedSubtitles] = createSignal("disabled");
  const [subtitlesLoading, setSubtitlesLoading] = createSignal(false);
  const [status, setStatus] = createSignal(finalProps.status);
  const [labelText, setLabelText] = createSignal(
    localizationProvider.get("translateVideo"),
  );
  const [showTranslationVolume, setShowTranslationVolume] = createSignal(false);
  const [showDownloadTranslation, setShowDownloadTranslation] =
    createSignal(false);
  const [showDownloadSubtitles, setShowDownloadSubtitles] = createSignal(false);
  const [detectedLanguage, setDetectedLanguage] = createSignal<RequestLang>(
    finalProps.detectedLanguage,
  );
  const [responseLanguage, setResponseLanguage] = createSignal<ResponseLang>(
    finalProps.responseLanguage,
  );

  let rootElement: HTMLElement | undefined;
  let buttonOverlay: HTMLElement | undefined;
  let menuOverlay: HTMLElement | undefined;
  let segmentedButton: HTMLElement | undefined;
  let segmentedButtonControls: SegmentedButtonControls | undefined;
  let segmentedButtonMenuControls: SegmentedButtonMenuControls | undefined;
  let dragState: ButtonDragState | null = null;
  let dragListenersAbortController: AbortController | undefined;
  let lastButtonDragEndAt = 0;
  let subtitlesLoadVersion = 0;

  const setMenuHidden = (hidden: boolean) => {
    if (hidden) {
      segmentedButtonMenuControls?.closeFloatingUI();
    }

    setMenuHiddenState(hidden);
  };

  const setButtonHidden = (hidden: boolean) => {
    if (hidden) {
      segmentedButtonControls?.closeFloatingUI();
    }

    setButtonHiddenState(hidden);
  };

  const setContainerSize = (width: number, height: number) => {
    if (width > 0) {
      setIsBigContainer(width > BIG_CONTAINER_WIDTH_PX);
    }
    const menuHeight = height > 200 ? height : globalThis.innerHeight * 0.75;
    menuOverlay?.style.setProperty("--vot-container-height", `${menuHeight}px`);
  };

  finalProps.controlsRef?.({
    setStatus,
    getStatus: status,
    setIsLoading,
    getIsLoading: isLoading,
    setLabelText,
    setSubtitlesOptions,
    setSelectedSubtitles,
    getSelectedSubtitles: selectedSubtitles,
    setButtonHidden,
    getButtonHidden: buttonHidden,
    setMenuHidden,
    getMenuHidden: menuHidden,
    setButtonOpacity,
    getButtonOpacity: buttonOpacity,
    setContainerSize,
    closeVoicePopover: () => {
      segmentedButtonControls?.closeFloatingUI();
    },
    getButtonOverlayEl: () => buttonOverlay,
    getMenuOverlayEl: () => menuOverlay,
    getVoicePopoverEl: () => {
      return segmentedButtonControls?.getVoicePopoverEl();
    },
    isVoicePopoverOpen: () => {
      return segmentedButtonControls?.isVoicePopoverOpen() ?? false;
    },
    setVideoVolume: (volume) => {
      segmentedButtonMenuControls?.setVideoVolume(volume);
    },
    getVideoVolume: () => {
      return segmentedButtonMenuControls?.getVideoVolume() ?? 100;
    },
    setTranslationVolume: (volume) => {
      segmentedButtonMenuControls?.setTranslationVolume(volume);
    },
    getTranslationVolume: () => {
      return (
        segmentedButtonMenuControls?.getTranslationVolume() ??
        settings.defaultVolume
      );
    },
    getMaxTranslationVolume: () => {
      return segmentedButtonMenuControls?.getMaxTranslationVolume() ?? 100;
    },
    getShowTranslationVolume: showTranslationVolume,
    setShowTranslationVolume,
    getShowDownloadTranslation: showDownloadTranslation,
    setShowDownloadTranslation,
    setTranslationProgress: (progress) => {
      segmentedButtonMenuControls?.setTranslationProgress(progress);
    },
    setShowTranslationProgress: (show) => {
      segmentedButtonMenuControls?.setShowTranslationProgress(show);
    },
    getShowDownloadSubtitles: showDownloadSubtitles,
    setShowDownloadSubtitles,
    setDetectedLanguage,
    setResponseLanguage,
  });

  const getLayoutRoot = (): HTMLElement =>
    rootElement?.closest<HTMLElement>(".vot-overlay-root") ??
    rootElement?.parentElement ??
    rootElement ??
    document.documentElement;

  const loadSubtitles = async () => {
    if (!finalProps.onSubtitlesOpen) return;

    const version = ++subtitlesLoadVersion;
    setSubtitlesLoading(true);
    try {
      await finalProps.onSubtitlesOpen();
    } catch (error) {
      console.error("[VOT] Failed to prepare subtitles:", error);
    } finally {
      if (version === subtitlesLoadVersion) {
        setSubtitlesLoading(false);
      }
    }
  };

  const updateDraggingButtonPosition = (): DOMRect | undefined => {
    const state = dragState;
    if (!isDragging() || !state || !buttonOverlay) {
      return;
    }

    const rootRect = getLayoutRoot().getBoundingClientRect();
    const maxLeft = Math.max(0, rootRect.width - state.buttonWidth);
    const maxTop = Math.max(0, rootRect.height - state.buttonHeight);
    const nextLeft = Math.max(
      0,
      Math.min(state.clientX - rootRect.left - state.grabOffsetX, maxLeft),
    );
    const nextTop = Math.max(
      0,
      Math.min(state.clientY - rootRect.top - state.grabOffsetY, maxTop),
    );

    buttonOverlay.style.setProperty("--vot-button-drag-left", `${nextLeft}px`);
    buttonOverlay.style.setProperty("--vot-button-drag-top", `${nextTop}px`);
    return rootRect;
  };

  const updateDragTarget = (position: Position) => {
    if (!dragState) {
      return;
    }

    dragState.targetPosition = position;
    setDockPreviewPosition(position);
  };

  const applyButtonDragFrame = () => {
    const state = dragState;
    if (!isDragging() || !state) {
      return;
    }

    state.frameId = null;
    const rootRect = updateDraggingButtonPosition();
    if (!rootRect) {
      return;
    }
    updateDragTarget(
      resolveButtonPositionFromPointer(
        state.clientX,
        state.clientY,
        rootRect,
        isBigContainer(),
      ),
    );
    finalProps.onButtonDragActivity?.("overlay-button-drag-move");
  };

  const requestButtonDragFrame = () => {
    const state = dragState;
    if (!isDragging() || !state || state.frameId !== null) {
      return;
    }

    state.frameId = requestAnimationFrame(applyButtonDragFrame);
  };

  const startButtonDrag = () => {
    const state = dragState;
    if (!isDragging() || !state || !buttonOverlay) {
      return;
    }

    setMenuHidden(true);
    segmentedButtonControls?.closeFloatingUI();
    finalProps.onButtonDragStart?.();
    finalProps.onButtonDragActivity?.("overlay-button-drag-start");
    const rootRect = updateDraggingButtonPosition();
    if (!rootRect) {
      return;
    }
    updateDragTarget(
      resolveButtonPositionFromPointer(
        state.clientX,
        state.clientY,
        rootRect,
        isBigContainer(),
      ),
    );
  };

  const finishButtonDrag = (commit: boolean, notify = true) => {
    dragListenersAbortController?.abort();
    dragListenersAbortController = undefined;

    const state = dragState;
    const wasDragging = isDragging();

    dragState = null;
    setIsDragging(false);

    if (wasDragging) {
      lastButtonDragEndAt = Date.now();
    }

    if (!state) {
      return;
    }

    if (state.frameId !== null) {
      cancelAnimationFrame(state.frameId);
    }

    try {
      if (segmentedButton?.hasPointerCapture(state.pointerId)) {
        segmentedButton.releasePointerCapture(state.pointerId);
      }
    } catch {
      // Pointer capture may already be gone during teardown.
    }

    if (buttonOverlay) {
      buttonOverlay.style.removeProperty("--vot-button-drag-left");
      buttonOverlay.style.removeProperty("--vot-button-drag-top");
    }
    setDockPreviewPosition(undefined);

    if (!wasDragging) {
      return;
    }
    if (commit) {
      setSettings("buttonPos", state.targetPosition);
      finalProps.onButtonPositionChange?.(state.targetPosition);
      void votStorage.set("buttonPos", state.targetPosition);
    }
    if (notify) {
      finalProps.onButtonDragEnd?.();
    }
  };

  const onButtonDragPointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || dragState || !buttonOverlay) {
      return;
    }

    const buttonRect = buttonOverlay.getBoundingClientRect();
    dragState = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      clientX: event.clientX,
      clientY: event.clientY,
      grabOffsetX: event.clientX - buttonRect.left,
      grabOffsetY: event.clientY - buttonRect.top,
      buttonWidth: buttonRect.width,
      buttonHeight: buttonRect.height,
      targetPosition: "default",
      frameId: null,
    };
    bindDragDocumentListeners();
  };

  const onButtonDragPointerMove = (event: PointerEvent) => {
    const state = dragState;
    if (state?.pointerId !== event.pointerId) {
      return;
    }

    state.clientX = event.clientX;
    state.clientY = event.clientY;
    let started = false;
    if (!isDragging()) {
      const moved = Math.hypot(
        event.clientX - state.startClientX,
        event.clientY - state.startClientY,
      );
      if (moved < DRAG_THRESHOLD_PX) return;

      setIsDragging(true);
      try {
        segmentedButton?.setPointerCapture(event.pointerId);
      } catch {
        // Document listeners keep the drag working without pointer capture.
      }
      startButtonDrag();
      started = true;
    }

    event.preventDefault();
    event.stopPropagation();
    if (!started) {
      requestButtonDragFrame();
    }
  };

  const onButtonDragPointerUp = (event: PointerEvent) => {
    const state = dragState;
    if (state?.pointerId !== event.pointerId) {
      return;
    }

    state.clientX = event.clientX;
    state.clientY = event.clientY;
    if (isDragging()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      applyButtonDragFrame();
    }
    finishButtonDrag(true);
  };

  const onButtonDragPointerCancel = (event: PointerEvent) => {
    const state = dragState;
    if (state?.pointerId !== event.pointerId) return;

    if (isDragging()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    finishButtonDrag(false);
  };

  const suppressClickAfterDrag = (event: MouseEvent) => {
    if (
      isDragging() ||
      Date.now() - lastButtonDragEndAt < DRAG_ACTION_SUPPRESS_MS
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  const bindDragDocumentListeners = () => {
    dragListenersAbortController?.abort();
    dragListenersAbortController = new AbortController();
    const { signal } = dragListenersAbortController;

    document.addEventListener("pointermove", onButtonDragPointerMove, {
      capture: true,
      signal,
    });
    document.addEventListener("pointerup", onButtonDragPointerUp, {
      capture: true,
      signal,
    });
    document.addEventListener("pointercancel", onButtonDragPointerCancel, {
      capture: true,
      signal,
    });
  };

  const normalizedPosition = createMemo<Position>(() => {
    const normalizedPosition = normalizeButtonPosition(settings.buttonPos);
    return isBigContainer() || !isSideButtonPosition(normalizedPosition)
      ? normalizedPosition
      : "default";
  });
  const direction = createMemo(() => getButtonDirection(normalizedPosition()));
  const tooltipPos = createMemo(() => {
    switch (normalizedPosition()) {
      case "left":
      case "leftCenter":
        return "right";
      case "right":
      case "rightCenter":
        return "left";
      default:
        return "bottom";
    }
  });

  createEffect(() => {
    if (menuHidden() || !buttonOverlay || !menuOverlay) {
      return;
    }

    const onOutsideClickHandle = (event: MouseEvent) => {
      if (menuHidden()) {
        return;
      }

      const path = event.composedPath();
      // select_new-inner can be outside of these overlay
      const isClickInsideSelect = path.some(
        (element) =>
          element instanceof HTMLElement &&
          element.classList.contains("vot-select_new-inner"),
      );
      if (
        path.includes(buttonOverlay) ||
        path.includes(menuOverlay) ||
        isClickInsideSelect
      ) {
        return;
      }

      setMenuHidden(true);
    };

    const onEscHandle = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setMenuHidden(true);
    };

    document.addEventListener("pointerdown", onOutsideClickHandle, {
      capture: true,
      passive: true,
    });
    rootElement.addEventListener("keydown", onEscHandle);

    onCleanup(() => {
      document.removeEventListener("pointerdown", onOutsideClickHandle, {
        capture: true,
      });
      rootElement.removeEventListener("keydown", onEscHandle);
    });
  });

  onMount(() => {
    if (!segmentedButton) return;

    segmentedButton.addEventListener("pointerdown", onButtonDragPointerDown);
    segmentedButton.addEventListener("click", suppressClickAfterDrag, true);
    segmentedButton.addEventListener(
      "lostpointercapture",
      onButtonDragPointerCancel,
    );
  });

  onCleanup(() => {
    subtitlesLoadVersion += 1;
    finishButtonDrag(false, false);
    segmentedButton?.removeEventListener(
      "pointerdown",
      onButtonDragPointerDown,
    );
    segmentedButton?.removeEventListener("click", suppressClickAfterDrag, true);
    segmentedButton?.removeEventListener(
      "lostpointercapture",
      onButtonDragPointerCancel,
    );
  });

  return (
    <vot-block
      ref={(element) => {
        rootElement = element;
        finalProps.ref?.(element);
      }}
    >
      <SegmentedButtonOverlay
        controlsRef={(controls) => (segmentedButtonControls = controls)}
        overlayRef={(element) => (buttonOverlay = element)}
        opacity={buttonOpacity()}
        isDragging={isDragging()}
        position={normalizedPosition()}
        hidden={buttonHidden()}
        status={status()}
        labelText={labelText()}
        tooltipPos={tooltipPos()}
        direction={direction()}
        isLoading={isLoading()}
        isSubtitlesActive={selectedSubtitles() !== "disabled"}
        showPipButton={isPiPAvailable() && settings.showPiPButton}
        menuOpened={!menuHidden()}
        ref={(element) => (segmentedButton = element)}
        onMenuClick={() => {
          setMenuHidden(!menuHidden());
        }}
        onTranslateClick={() => {
          setMenuHidden(true);
          finalProps.onTranslateClick?.();
        }}
        onPiPClick={() => {
          setMenuHidden(true);
          finalProps.onPiPClick?.();
        }}
        onSubtitlesClick={() => {
          setMenuHidden(true);
          finalProps.onSubtitlesClick?.();
        }}
        onVoiceChange={finalProps.onVoiceChange}
      />
      <Show when={dockPreviewPosition()}>
        {(position) => (
          <PreviewSegmentedButtonOverlay
            position={position()}
            labelText={labelText()}
            direction={getButtonDirection(position())}
            showPipButton={settings.showPiPButton}
          />
        )}
      </Show>
      <SegmentedButtonMenuOverlay
        ref={(element) => (menuOverlay = element)}
        controlsRef={(controls) => (segmentedButtonMenuControls = controls)}
        buttonStatus={status()}
        position={normalizedPosition()}
        hidden={menuHidden()}
        videoVolume={finalProps.videoVolume}
        translationVolume={settings.defaultVolume}
        showTranslationVolume={showTranslationVolume()}
        showDownloadTranslation={showDownloadTranslation()}
        showDownloadSubtitles={showDownloadSubtitles()}
        detectedLanguage={detectedLanguage()}
        responseLanguage={responseLanguage()}
        subtitlesOptions={subtitlesOptions()}
        selectedSubtitles={selectedSubtitles()}
        subtitlesLoading={subtitlesLoading()}
        onVideoVolumeInput={finalProps.onVideoVolumeInput}
        onTranslationVolumeInput={finalProps.onTranslationVolumeInput}
        onDownloadTranslationClick={finalProps.onDownloadTranslationClick}
        onDownloadSubtitlesClick={() => {
          finalProps.onDownloadSubtitlesClick?.();
        }}
        onSettingsClick={() => {
          setMenuHidden(true);
          finalProps.onSettingsClick?.();
        }}
        onDetectedLanguageSelect={finalProps.onDetectedLanguageSelect}
        onResponseLanguageSelect={finalProps.onResponseLanguageSelect}
        onSubtitlesOpen={() => void loadSubtitles()}
        onSubtitlesSelect={(value) => {
          setSelectedSubtitles(value);
          finalProps.onSubtitlesSelect?.(value);
        }}
      />
    </vot-block>
  );
}
