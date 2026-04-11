import { html, nothing, render, type TemplateResult } from "lit-html";
import { defaultTranslationService } from "../config/config";
import { localizationProvider } from "../localization/localizationProvider";
import type {
  ProcessedSubtitles,
  SubtitleFontFamily,
  SubtitleInlineStyle,
  SubtitleLine,
  SubtitlePositionPreset,
  SubtitleToken,
} from "../types/subtitles";
import UI from "../ui";
import Tooltip from "../ui/components/tooltip";
import {
  createShadowMount,
  destroyShadowMount,
  reparentShadowMount,
  type ShadowMount,
} from "../ui/shadowMount";
import type { IntervalIdleChecker } from "../utils/intervalIdleChecker";
import { votStorage } from "../utils/storage";
import { translate } from "../utils/translateApis";
import { buildActiveSubtitleRenderLine } from "./activeCues";
import {
  ensureGoogleSubtitleFontLoaded,
  getSubtitleFontFamilyCssValue,
} from "./fonts";
import { FullscreenLayerController } from "./fullscreenLayerController";
import { buildSubtitleInlineStyleCssText } from "./inlineStyle";
import {
  type CapturedVerticalAnchorState,
  captureCustomVerticalAnchorState,
  clampAnchorWithinBox,
  clampToRange,
  hasDragThresholdBeenExceeded,
  resolveCustomVerticalAnchor,
  snapValueToNearestCandidate,
} from "./positionController";
import {
  buildSubtitleRenderPlan,
  type SubtitleRenderPlanPart,
} from "./renderPlan";
import {
  computeSmartLayoutForBox as computeSmartLayoutForBoxUtil,
  type SmartCssMetrics,
} from "./smartLayout";
import {
  buildWordSlices,
  computeTokenWrapPlan as computeTokenWrapPlanUtil,
  computeTwoLineSegments as computeTwoLineSegmentsUtil,
  type LineMeasureMemo,
  measureWordSlices,
  type TimedTokenSegment,
  type TokenPrecomputeInput,
  type TokenPrecomputeMemo,
  type TokenProcessingMemo,
} from "./smartWrap";

type DraggingState = {
  /** active pointer id while the pointer is down inside the subtitles */
  pointerId: number | null;
  /** pointer is currently down inside the widget */
  candidate: boolean;
  /** actual drag has started (passed movement threshold) */
  active: boolean;
  /** drag has moved at least once (used to suppress clicks after drag) */
  moved: boolean;
  startClientX: number;
  startClientY: number;
  offset: {
    x: number;
    y: number;
  };
};
type ClearRenderedContentOptions = {
  releaseTooltip?: boolean;
};
type AnchorBoxLayout = {
  /** Left of the anchor box in *layout* pixels relative to the widget container */
  left: number;
  /** Top of the anchor box in *layout* pixels relative to the widget container */
  top: number;
  /** Width of the anchor box in *layout* pixels */
  w: number;
  /** Height of the anchor box in *layout* pixels */
  h: number;
};
type LayoutMetrics = {
  w: number;
  h: number;
  rect: DOMRect;
  /** visual px / layout px */
  scaleX: number;
  /** visual px / layout px */
  scaleY: number;
};
const WRAP_WIDTH_GUARD_PX = 8;
const WRAP_WIDTH_GUARD_RATIO = 0.97;
const MIN_EFFECTIVE_WRAP_WIDTH_PX = 24;
function applyWrapWidthGuard(maxWidthPx: number): number {
  if (!Number.isFinite(maxWidthPx) || maxWidthPx <= 0) return 0;
  const byPixelGuard = maxWidthPx - WRAP_WIDTH_GUARD_PX;
  const byRatioGuard = maxWidthPx * WRAP_WIDTH_GUARD_RATIO;
  const guarded = Math.min(byPixelGuard, byRatioGuard);
  return Math.max(MIN_EFFECTIVE_WRAP_WIDTH_PX, guarded);
}
export class SubtitlesWidget {
  private readonly video?: HTMLVideoElement;
  private container: HTMLElement;
  private readonly fullscreenLayerController: FullscreenLayerController;
  private tooltipMount?: ShadowMount;
  private subtitlesContainer: HTMLElement | null = null;
  private subtitlesBlock: HTMLElement | null = null;
  private renderedHighlightEls: HTMLSpanElement[] = [];
  private readonly passedFlagsBuffer: boolean[] = [];
  private subtitles: ProcessedSubtitles | null = null;
  private subtitleLang?: string;
  private lastRenderKey: string | null = null;
  private lastActiveLineKey: string | null = null;
  private maxActiveCueLookbackMs = 0;
  private highlightWords = false;
  private fontSize = 20;
  private fontSizeOverridden = false;
  private fontFamily: SubtitleFontFamily = "default-sans";
  private maxLength = 300;
  private smartLayoutEnabled = true;
  private smartFontSizePx = 0;
  private smartMaxWidthPx = 0;
  private smartAnchorWidthPx = 0;
  private smartAnchorHeightPx = 0;
  private lastSmartLayoutKey: string | null = null;
  private lastSmartLayoutCheckTs = 0;
  private opacity = "0.2";
  private repositionPending = false;
  private positionRefreshPending = false;
  private updatePending = false;
  private lastUpdateRequestTs = 0;
  private readonly updateMinIntervalMs = 100;
  private readonly updateMinIntervalHighlightMs = 33;
  private readonly useVideoFrameCallbacks: boolean;
  private videoFrameRequestId: number | null = null;
  private lastPlaybackTimeMs: number | null = null;
  private dragDocListenersAttached = false;
  private lastPositionRefreshTs = 0;
  private readonly positionRefreshIntervalMs = 250;
  private subtitleMaxWidthPx = 0;
  private breakAfterTokenIndices: number[] = [];
  private breakAfterTokenIndexSet: Set<number> | null = null;
  private wrapPending = false;
  private lastWrapKey: string | null = null;
  private lastWrapTokens: SubtitleToken[] | null = null;
  private measureCanvas: HTMLCanvasElement | null = null;
  private measureCtx: CanvasRenderingContext2D | null = null;
  private tokenProcessingMemo: TokenProcessingMemo | null = null;
  private tokenPrecomputeMemo: TokenPrecomputeMemo | null = null;
  private lineMeasureMemo: LineMeasureMemo | null = null;
  private lastSegmentIndex = 0;
  private lastAppliedLeftPct: number | null = null;
  private lastAppliedTopPct: number | null = null;
  private readonly position = {
    left: 50,
    top: 100,
  };
  private customVerticalAnchorState: CapturedVerticalAnchorState | null = null;
  private positionPreset: SubtitlePositionPreset = "bottom-center";
  private readonly dragging: DraggingState = {
    pointerId: null,
    candidate: false,
    active: false,
    moved: false,
    startClientX: 0,
    startClientY: 0,
    offset: {
      x: 0,
      y: 0,
    },
  };
  private readonly dragStartThresholdPx = 4;
  private readonly snapThresholdPx = 18;
  private suppressTokenClicksUntil = 0;
  private readonly abortController = new AbortController();
  private resizeObserver?: ResizeObserver;
  private tokenTooltip?: Tooltip;
  private tooltipTranslationRequestId = 0;
  private readonly intervalIdleChecker: IntervalIdleChecker;
  private checkerUnsubscribe: (() => void) | null = null;
  private readonly edgePunctuationTrimRe =
    /(?:^[\p{P}\p{S}]+|[\p{P}\p{S}]+$)/gu;
  private strTokens = "";
  private strTranslatedTokens = "";
  private passedStateKey: string | null = null;
  private readonly passedThresholds: number[] = [];
  private normalizeTokenTextForTranslation(raw: string): string {
    return raw.trim().replace(this.edgePunctuationTrimRe, "");
  }
  private bottomInsetCachedPx = 0; // layout px
  private safeAreaBottomInsetCachedPx = 0;
  private containerPaddingBottomCachedPx = 0;
  private insetCacheReady = false;
  private readonly bottomInsetByMode = {
    normal: {
      ratio: 0.1,
      minPx: 56,
      maxPx: 220,
      gapPx: 10,
    },
    fullscreen: {
      ratio: 0.07,
      minPx: 44,
      maxPx: 140,
      gapPx: 9,
    },
  } as const;
  private safeAreaProbeEl: HTMLDivElement | null = null;
  private guidesLayer: HTMLElement | null = null;
  private verticalGuide: HTMLElement | null = null;
  private horizontalGuide: HTMLElement | null = null;
  private readonly onPointerDownBound: (event: PointerEvent) => void;
  private readonly onPointerUpBound: (event: PointerEvent) => void;
  private readonly onPointerMoveBound: (event: PointerEvent) => void;
  private readonly onPlaybackStateChangeBound: () => void;
  private readonly onVisualViewportChangeBound: () => void;
  constructor(
    video: HTMLVideoElement | undefined,
    container: HTMLElement,
    intervalIdleChecker: IntervalIdleChecker,
  ) {
    this.video = video;
    this.container = container;
    this.fullscreenLayerController = new FullscreenLayerController({
      container,
    });
    this.intervalIdleChecker = intervalIdleChecker;
    this.useVideoFrameCallbacks =
      !!this.video &&
      typeof this.video.requestVideoFrameCallback === "function";
    this.onPointerDownBound = (event) => this.onPointerDown(event);
    this.onPointerUpBound = (event) => this.onPointerUp(event);
    this.onPointerMoveBound = (event) => this.onPointerMove(event);
    this.onPlaybackStateChangeBound = () => this.handlePlaybackStateChange();
    this.onVisualViewportChangeBound = () => this.scheduleReposition();
    this.checkerUnsubscribe = this.intervalIdleChecker.subscribe(() => {
      this.onCheckerTick();
    });
    this.bindEvents();
  }
  public updateMount({ container }: { container: HTMLElement }): void {
    const containerChanged = this.container !== container;

    this.container = container;
    this.fullscreenLayerController.updateContainer(container);

    this.syncWidgetMount();

    if (containerChanged) {
      const parentElement = this.getTokenTooltipParentElement();
      this.tokenTooltip?.updateMount({
        parentElement,
        layoutRoot: this.tooltipMount?.host,
      });
    }

    if (this.subtitles) {
      this.insetCacheReady = false;
      this.lastAppliedLeftPct = null;
      this.lastAppliedTopPct = null;
      this.updateContainerRect();
      this.requestUpdate();
    }
  }
  public resetTranslationContext(releaseTooltip = false): void {
    this.strTranslatedTokens = "";
    if (releaseTooltip) {
      this.releaseTooltip();
    }
  }
  private resetSegmentationMemo(): void {
    this.tokenProcessingMemo = null;
    this.tokenPrecomputeMemo = null;
    this.lineMeasureMemo = null;
    this.lastSegmentIndex = 0;
  }
  private resetWrapMemo(): void {
    this.setBreakAfterTokenIndices([]);
    this.lastWrapKey = null;
  }
  private resetRenderMemo(): void {
    this.lastRenderKey = null;
  }
  private computeAnchorBoxLayout(layout: LayoutMetrics): AnchorBoxLayout {
    const fallback: AnchorBoxLayout = {
      left: 0,
      top: 0,
      w: layout.w,
      h: layout.h,
    };
    const video = this.video;
    if (!video) return fallback;
    const videoRect = video.getBoundingClientRect();
    if (!(videoRect.width > 0 && videoRect.height > 0)) return fallback;
    const containerRect = layout.rect;
    const intersects =
      videoRect.right > containerRect.left &&
      videoRect.left < containerRect.right &&
      videoRect.bottom > containerRect.top &&
      videoRect.top < containerRect.bottom;
    if (!intersects) return fallback;
    const w = videoRect.width / layout.scaleX;
    const h = videoRect.height / layout.scaleY;
    if (!(w > 0 && h > 0)) return fallback;
    const rawLeft = (videoRect.left - containerRect.left) / layout.scaleX;
    const rawTop = (videoRect.top - containerRect.top) / layout.scaleY;
    const maxLeft = layout.w - w;
    const maxTop = layout.h - h;
    const left =
      maxLeft >= 0 ? clampToRange(rawLeft, 0, maxLeft) : (layout.w - w) / 2;
    const top =
      maxTop >= 0 ? clampToRange(rawTop, 0, maxTop) : (layout.h - h) / 2;
    return { left, top, w, h };
  }
  private readSmartCssMetrics(): SmartCssMetrics | null {
    const block = this.subtitlesBlock;
    if (!block) return null;
    const cs = getComputedStyle(block);
    const fontSizePx = Number.parseFloat(cs.fontSize);
    const maxWidthRawPx = Number.parseFloat(cs.maxWidth);
    if (
      !Number.isFinite(fontSizePx) ||
      !Number.isFinite(maxWidthRawPx) ||
      fontSizePx <= 0 ||
      maxWidthRawPx <= 0
    ) {
      return null;
    }
    this.subtitleMaxWidthPx = maxWidthRawPx;
    const paddingLeft = Number.parseFloat(cs.paddingLeft) || 0;
    const paddingRight = Number.parseFloat(cs.paddingRight) || 0;
    const maxWidthPx = Math.max(0, maxWidthRawPx - paddingLeft - paddingRight);
    if (maxWidthPx <= 0) return null;
    return { fontSizePx, maxWidthPx };
  }
  private ensureSmartLayout(anchorBox: AnchorBoxLayout): {
    maxWidthPx: number | null;
  } | null {
    if (!this.smartLayoutEnabled) {
      return null;
    }
    const cssMetrics = this.readSmartCssMetrics();
    const nextFontSizePx = cssMetrics?.fontSizePx ?? this.smartFontSizePx;
    const next = computeSmartLayoutForBoxUtil(anchorBox, cssMetrics);
    const nextMaxWidthPx = next.maxWidthPx ?? this.smartMaxWidthPx;
    const nextKey = `${Math.round(nextFontSizePx)}|${Math.round(
      nextMaxWidthPx,
    )}|${Math.round(next.maxWidthPx ?? 0)}`;
    const fontChanged = Math.abs(nextFontSizePx - this.smartFontSizePx) > 0.5;
    const widthChanged = Math.abs(nextMaxWidthPx - this.smartMaxWidthPx) > 0.5;
    if (nextKey !== this.lastSmartLayoutKey) {
      this.lastSmartLayoutKey = nextKey;
      this.smartFontSizePx = nextFontSizePx;
      this.smartMaxWidthPx = nextMaxWidthPx;
      this.resetRenderMemo();
    }
    this.setSubtitlesContainerVar(
      "--vot-subtitles-max-width",
      next.maxWidthPx && next.maxWidthPx > 0 ? `${next.maxWidthPx}px` : null,
    );
    if ((fontChanged || widthChanged) && this.lastWrapTokens) {
      this.lastWrapKey = null;
      this.resetSegmentationMemo();
      this.scheduleWrapRecompute();
    }
    return next;
  }
  private scheduleReposition(): void {
    if (this.abortController.signal.aborted) return;
    if (!this.subtitles) return;
    this.repositionPending = true;
    this.intervalIdleChecker.markActivity("subtitles-reposition");
    this.intervalIdleChecker.requestImmediateTick();
  }
  private setSubtitlesContainerVar(name: string, value: string | null): void {
    const container = this.subtitlesContainer;
    if (!container) return;
    if (value === null) {
      container.style.removeProperty(name);
      return;
    }
    container.style.setProperty(name, value);
  }
  private applyOpacityStyle(): void {
    this.setSubtitlesContainerVar("--vot-subtitles-opacity", this.opacity);
  }
  private applyManualFontSizeStyle(): void {
    if (!this.smartLayoutEnabled && this.fontSizeOverridden) {
      this.setSubtitlesContainerVar(
        "--vot-subtitles-font-size",
        `${this.fontSize}px`,
      );
      return;
    }
    this.setSubtitlesContainerVar("--vot-subtitles-font-size", null);
  }
  private applyFontFamilyStyle(): void {
    const fontFamily = this.fontFamily;
    this.setSubtitlesContainerVar(
      "--vot-subtitles-font-family-custom",
      getSubtitleFontFamilyCssValue(fontFamily),
    );
    void ensureGoogleSubtitleFontLoaded(fontFamily, {
      forceGmXhr: true,
      onLoaded: () => {
        if (this.fontFamily !== fontFamily) {
          return;
        }

        this.lastWrapKey = null;
        this.resetSegmentationMemo();
        this.scheduleWrapRecompute();
        this.scheduleReposition();
      },
    });
  }
  private syncVisualStyleVars(): void {
    this.applyOpacityStyle();
    this.applyManualFontSizeStyle();
    this.applyFontFamilyStyle();
  }
  private ensureGuidesLayer(): HTMLElement {
    if (this.guidesLayer) {
      return this.guidesLayer;
    }
    const layer = document.createElement("vot-block");
    layer.classList.add("vot-subtitles-guides");
    const verticalGuide = document.createElement("vot-block");
    verticalGuide.classList.add(
      "vot-subtitles-guide",
      "vot-subtitles-guide--vertical",
    );
    const horizontalGuide = document.createElement("vot-block");
    horizontalGuide.classList.add(
      "vot-subtitles-guide",
      "vot-subtitles-guide--horizontal",
    );
    layer.append(verticalGuide, horizontalGuide);
    this.guidesLayer = layer;
    this.verticalGuide = verticalGuide;
    this.horizontalGuide = horizontalGuide;
    this.hideSnapGuides();
    return layer;
  }
  private hideSnapGuides(): void {
    this.verticalGuide?.removeAttribute("data-visible");
    this.horizontalGuide?.removeAttribute("data-visible");
  }
  private updateSnapGuides(
    anchorBox: AnchorBoxLayout,
    options: {
      showVerticalCenter?: boolean;
      showHorizontalCenter?: boolean;
    },
  ): void {
    const { showVerticalCenter = false, showHorizontalCenter = false } =
      options;
    const layer = this.ensureGuidesLayer();
    if (!layer.isConnected) {
      this.syncGuideLayerMount();
    }
    if (this.verticalGuide) {
      this.verticalGuide.style.left = `${anchorBox.left + anchorBox.w / 2}px`;
      this.verticalGuide.style.top = `${anchorBox.top}px`;
      this.verticalGuide.style.height = `${anchorBox.h}px`;
      if (showVerticalCenter) {
        this.verticalGuide.dataset.visible = "true";
      } else {
        delete this.verticalGuide.dataset.visible;
      }
    }
    if (this.horizontalGuide) {
      this.horizontalGuide.style.left = `${anchorBox.left}px`;
      this.horizontalGuide.style.top = `${anchorBox.top + anchorBox.h / 2}px`;
      this.horizontalGuide.style.width = `${anchorBox.w}px`;
      if (showHorizontalCenter) {
        this.horizontalGuide.dataset.visible = "true";
      } else {
        delete this.horizontalGuide.dataset.visible;
      }
    }
  }
  private syncGuideLayerMount(): void {
    const guidesLayer = this.ensureGuidesLayer();
    if (guidesLayer.parentElement !== this.container) {
      this.container.appendChild(guidesLayer);
    }
  }
  private syncWidgetMount(): void {
    this.fullscreenLayerController.syncWidgetContainer(null);
    if (
      this.subtitlesContainer &&
      this.subtitlesContainer.parentElement !== this.container
    ) {
      this.container.appendChild(this.subtitlesContainer);
    }
    if (this.tooltipMount) {
      reparentShadowMount(this.tooltipMount, this.container);
    }
    this.syncGuideLayerMount();
  }
  private ensureTooltipMount(): ShadowMount {
    if (!this.tooltipMount) {
      this.tooltipMount = createShadowMount({
        parent: this.container,
        rootClasses: ["vot-portal-local"],
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
    } else {
      reparentShadowMount(this.tooltipMount, this.container);
    }

    return this.tooltipMount;
  }
  private getTokenTooltipParentElement(): HTMLElement {
    return this.ensureTooltipMount().root;
  }
  private createSubtitlesContainer(): HTMLElement {
    if (this.subtitlesContainer) {
      return this.subtitlesContainer;
    }
    const container = document.createElement("vot-block");
    container.classList.add("vot-subtitles-widget");
    this.subtitlesContainer = container;
    this.syncWidgetMount();
    container.addEventListener("pointerdown", this.onPointerDownBound, {
      signal: this.abortController.signal,
      passive: false,
      capture: true,
    });
    this.syncVisualStyleVars();
    this.insetCacheReady = false;
    this.updateContainerRect();
    return container;
  }
  private bindEvents(): void {
    const { signal } = this.abortController;
    const opts = { signal } as AddEventListenerOptions;
    this.video?.addEventListener("play", this.onPlaybackStateChangeBound, opts);
    this.video?.addEventListener(
      "pause",
      this.onPlaybackStateChangeBound,
      opts,
    );
    this.video?.addEventListener(
      "seeking",
      this.onPlaybackStateChangeBound,
      opts,
    );
    this.video?.addEventListener(
      "seeked",
      this.onPlaybackStateChangeBound,
      opts,
    );
    this.video?.addEventListener(
      "ended",
      this.onPlaybackStateChangeBound,
      opts,
    );
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.container);
    if (this.video) this.resizeObserver.observe(this.video);
    globalThis.visualViewport?.addEventListener(
      "resize",
      this.onVisualViewportChangeBound,
      opts,
    );
    globalThis.visualViewport?.addEventListener(
      "scroll",
      this.onVisualViewportChangeBound,
      opts,
    );
  }
  private getUpdateMinIntervalMs(): number {
    return this.highlightWords
      ? this.updateMinIntervalHighlightMs
      : this.updateMinIntervalMs;
  }
  private requestUpdate(
    playbackTimeMs?: number,
    now: number = performance.now(),
  ): void {
    if (this.abortController.signal.aborted) return;
    if (!this.subtitles) return;
    if (typeof playbackTimeMs === "number" && Number.isFinite(playbackTimeMs)) {
      this.lastPlaybackTimeMs = Math.max(0, playbackTimeMs);
    } else if (this.video) {
      this.lastPlaybackTimeMs = Math.max(0, this.video.currentTime * 1000);
    }
    const minInterval = this.getUpdateMinIntervalMs();
    if (now - this.lastUpdateRequestTs < minInterval) return;
    this.lastUpdateRequestTs = now;
    this.updatePending = true;
    this.intervalIdleChecker.requestImmediateTick();
  }
  private resolvePlaybackTimeMs(): number {
    if (
      typeof this.lastPlaybackTimeMs === "number" &&
      Number.isFinite(this.lastPlaybackTimeMs)
    ) {
      return this.lastPlaybackTimeMs;
    }
    return this.video ? Math.max(0, this.video.currentTime * 1000) : 0;
  }
  private handlePlaybackStateChange(): void {
    if (!this.subtitles) {
      this.stopVideoFrameLoop();
      return;
    }
    this.scheduleReposition();
    this.requestUpdate(
      this.video ? Math.max(0, this.video.currentTime * 1000) : 0,
    );
    this.syncVideoFrameLoop();
  }
  private syncVideoFrameLoop(): void {
    if (!this.useVideoFrameCallbacks) return;
    const video = this.video;
    if (!video) return;
    if (!this.subtitles || video.paused || video.ended) {
      this.stopVideoFrameLoop();
      return;
    }
    this.startVideoFrameLoop();
  }
  private startVideoFrameLoop(): void {
    if (!this.useVideoFrameCallbacks) return;
    const video = this.video;
    if (!video) return;
    if (this.videoFrameRequestId !== null) return;
    this.videoFrameRequestId = video.requestVideoFrameCallback(
      this.onVideoFrame,
    );
  }
  private stopVideoFrameLoop(): void {
    if (!this.useVideoFrameCallbacks) return;
    const video = this.video;
    if (!video) return;
    if (this.videoFrameRequestId === null) return;
    try {
      video.cancelVideoFrameCallback(this.videoFrameRequestId);
    } catch {}
    this.videoFrameRequestId = null;
  }
  private readonly onVideoFrame = (
    now: DOMHighResTimeStamp,
    metadata: VideoFrameCallbackMetadata,
  ): void => {
    this.videoFrameRequestId = null;
    if (this.abortController.signal.aborted) return;
    const video = this.video;
    if (!video || video.paused || video.ended) return;
    if (!this.subtitles) return;
    const playbackTimeMs =
      typeof metadata.mediaTime === "number" &&
      Number.isFinite(metadata.mediaTime)
        ? metadata.mediaTime * 1000
        : undefined;
    this.requestUpdate(playbackTimeMs, now);
    this.startVideoFrameLoop();
  };
  private onCheckerTick(): void {
    if (this.abortController.signal.aborted) return;
    if (this.repositionPending) {
      this.repositionPending = false;
      this.updateContainerRect();
      this.updatePending = true;
    }
    if (this.wrapPending) {
      this.wrapPending = false;
      this.recomputeWrapNow();
    }
    if (this.positionRefreshPending) {
      this.positionRefreshPending = false;
      this.applySubtitlePosition();
    }
    if (this.updatePending) {
      this.updatePending = false;
      this.update();
    }
  }
  private attachDragDocumentListeners(): void {
    if (this.dragDocListenersAttached) return;
    this.dragDocListenersAttached = true;
    document.addEventListener("pointermove", this.onPointerMoveBound, {
      passive: false,
      capture: true,
    });
    document.addEventListener("pointerup", this.onPointerUpBound, true);
    document.addEventListener("pointercancel", this.onPointerUpBound, true);
  }
  private detachDragDocumentListeners(): void {
    if (!this.dragDocListenersAttached) return;
    this.dragDocListenersAttached = false;
    document.removeEventListener("pointermove", this.onPointerMoveBound, true);
    document.removeEventListener("pointerup", this.onPointerUpBound, true);
    document.removeEventListener("pointercancel", this.onPointerUpBound, true);
  }
  private onResize(): void {
    this.syncWidgetMount();
    this.scheduleReposition();
  }
  private updateContainerRect(): void {
    const layout = this.getLayoutSize();
    if (!layout.w || !layout.h) return;
    const anchorBox = this.computeAnchorBoxLayout(layout);
    if (!anchorBox.w || !anchorBox.h) return;
    this.refreshBottomInsetNow(layout, anchorBox);
    this.applySubtitlePositionWithLayout(layout, anchorBox);
  }
  private getLayoutSize(): LayoutMetrics {
    const layoutRoot = this.fullscreenLayerController.getLayoutRootElement();
    const rect = layoutRoot.getBoundingClientRect();
    const w = layoutRoot.clientWidth || rect.width;
    const h = layoutRoot.clientHeight || rect.height;
    const scaleX = rect.width && w ? rect.width / w : 1;
    const scaleY = rect.height && h ? rect.height / h : 1;
    return { w, h, rect, scaleX, scaleY };
  }
  private ensureSafeAreaProbe(): void {
    if (this.safeAreaProbeEl) return;
    const el = document.createElement("div");
    el.style.position = "fixed";
    el.style.left = "0";
    el.style.right = "0";
    el.style.bottom = "0";
    el.style.height = "env(safe-area-inset-bottom, 0px)";
    el.style.pointerEvents = "none";
    el.style.opacity = "0";
    el.style.zIndex = "-1";
    document.documentElement.appendChild(el);
    this.safeAreaProbeEl = el;
  }
  private getSafeAreaBottomInsetPx(): number {
    this.ensureSafeAreaProbe();
    if (!this.safeAreaProbeEl) return 0;
    const h = this.safeAreaProbeEl.offsetHeight || 0;
    return h;
  }
  private refreshInsetCache(): void {
    const layoutRoot = this.fullscreenLayerController.getLayoutRootElement();
    this.safeAreaBottomInsetCachedPx = this.getSafeAreaBottomInsetPx();
    this.containerPaddingBottomCachedPx =
      Number.parseFloat(getComputedStyle(layoutRoot).paddingBottom || "0") || 0;
    this.insetCacheReady = true;
  }
  private isMobileViewport(): boolean {
    if (typeof globalThis.matchMedia !== "function") return false;
    return globalThis.matchMedia("(max-width: 900px) and (pointer: coarse)")
      .matches;
  }
  private getBottomInsetPreset() {
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
    };
    const fullscreenEl = doc.fullscreenElement ?? doc.webkitFullscreenElement;
    if (!(fullscreenEl instanceof Element)) {
      return this.bottomInsetByMode.normal;
    }
    const { container, video } = this;
    const fullscreenContainsContainer =
      fullscreenEl === container ||
      fullscreenEl.contains(container) ||
      container.contains(fullscreenEl);
    if (fullscreenContainsContainer) {
      return this.bottomInsetByMode.fullscreen;
    }
    if (
      video &&
      (fullscreenEl === video ||
        fullscreenEl.contains(video) ||
        video.contains(fullscreenEl))
    ) {
      return this.bottomInsetByMode.fullscreen;
    }
    return this.bottomInsetByMode.normal;
  }
  private computeReservedBottomInsetPx(
    anchorBoxH: number,
    preset = this.getBottomInsetPreset(),
  ): number {
    const raw = anchorBoxH * preset.ratio;
    return clampToRange(raw, preset.minPx, preset.maxPx);
  }
  private refreshBottomInsetNow(
    layout?: LayoutMetrics,
    anchorBox?: AnchorBoxLayout,
  ): void {
    this.refreshInsetCache();
    const anchorH =
      anchorBox?.h ??
      this.computeAnchorBoxLayout(layout ?? this.getLayoutSize()).h;
    if (!anchorH) {
      this.bottomInsetCachedPx = 0;
      return;
    }
    const preset = this.getBottomInsetPreset();
    this.bottomInsetCachedPx = this.computeReservedBottomInsetPx(
      anchorH,
      preset,
    );
  }
  private getBottomInsetPx(
    layout?: LayoutMetrics,
    anchorBox?: AnchorBoxLayout,
  ): number {
    if (!this.insetCacheReady) {
      this.refreshInsetCache();
    }
    const preset = this.getBottomInsetPreset();
    const safeAreaBottom = this.safeAreaBottomInsetCachedPx;
    const paddingBottom = this.containerPaddingBottomCachedPx;
    if (this.isMobileViewport()) {
      return Math.max(paddingBottom, safeAreaBottom);
    }
    const anchorH =
      anchorBox?.h ??
      this.computeAnchorBoxLayout(layout ?? this.getLayoutSize()).h;
    const reserved = anchorH
      ? this.computeReservedBottomInsetPx(anchorH, preset)
      : preset.minPx;
    const stableInset = Math.max(this.bottomInsetCachedPx, reserved);
    return Math.max(paddingBottom, safeAreaBottom, stableInset) + preset.gapPx;
  }
  private onPointerDown(event: PointerEvent): void {
    const subtitlesContainer = this.subtitlesContainer;
    if (!subtitlesContainer) return;
    const target = event.target;
    if (!(target instanceof Node) || !subtitlesContainer.contains(target))
      return;
    if (!event.isPrimary) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.stopPropagation();
    const layout = this.getLayoutSize();
    const { rect: containerRect, w, h, scaleX, scaleY } = layout;
    if (!w || !h) return;
    const anchorBox = this.computeAnchorBoxLayout(layout);
    if (!anchorBox.w || !anchorBox.h) return;
    this.lastPositionRefreshTs = performance.now();
    const subRect = subtitlesContainer.getBoundingClientRect();
    const pointerX =
      (event.clientX - containerRect.left) / scaleX - anchorBox.left;
    const pointerY =
      (event.clientY - containerRect.top) / scaleY - anchorBox.top;
    const anchorX =
      (subRect.left - containerRect.left + subRect.width / 2) / scaleX -
      anchorBox.left;
    const anchorY =
      (subRect.top - containerRect.top + subRect.height) / scaleY -
      anchorBox.top;
    this.dragging.pointerId = event.pointerId;
    this.dragging.candidate = true;
    this.dragging.active = false;
    this.dragging.moved = false;
    this.dragging.startClientX = event.clientX;
    this.dragging.startClientY = event.clientY;
    this.dragging.offset.x = anchorX - pointerX;
    this.dragging.offset.y = anchorY - pointerY;
    this.hideSnapGuides();
    this.attachDragDocumentListeners();
  }
  private onPointerUp(event: PointerEvent): void {
    if (this.dragging.pointerId === null) return;
    if (event.pointerId !== this.dragging.pointerId) return;
    if (this.dragging.moved) {
      this.suppressTokenClicksUntil = performance.now() + 450;
    }
    this.dragging.pointerId = null;
    this.dragging.candidate = false;
    this.dragging.active = false;
    this.dragging.moved = false;
    this.hideSnapGuides();
    this.detachDragDocumentListeners();
  }
  private onPointerMove(event: PointerEvent): void {
    if (!this.dragging.candidate || this.dragging.pointerId === null) return;
    if (event.pointerId !== this.dragging.pointerId) return;
    if (!this.dragging.active) {
      const thresholdExceeded = hasDragThresholdBeenExceeded(
        this.dragging.startClientX,
        this.dragging.startClientY,
        event.clientX,
        event.clientY,
        this.dragStartThresholdPx,
      );
      if (!thresholdExceeded) {
        return;
      }
      this.dragging.active = true;
      this.dragging.moved = true;
      this.suppressTokenClicksUntil = performance.now() + 450;
      this.releaseTooltip();
      try {
        this.subtitlesContainer?.setPointerCapture(event.pointerId);
      } catch {}
    } else {
      this.dragging.moved = true;
    }
    event.preventDefault();
    event.stopPropagation();
    const layout = this.getLayoutSize();
    const { rect: containerRect, w, h, scaleX, scaleY } = layout;
    if (!w || !h) return;
    const anchorBox = this.computeAnchorBoxLayout(layout);
    if (!anchorBox.w || !anchorBox.h) return;
    const pointerX =
      (event.clientX - containerRect.left) / scaleX - anchorBox.left;
    const pointerY =
      (event.clientY - containerRect.top) / scaleY - anchorBox.top;
    let anchorX = pointerX + this.dragging.offset.x;
    let anchorY = pointerY + this.dragging.offset.y;
    const elW = this.subtitlesContainer?.offsetWidth ?? 0;
    const elH = this.subtitlesContainer?.offsetHeight ?? 0;
    const bottomInset = this.getBottomInsetPx(layout, anchorBox);
    const snappedX = snapValueToNearestCandidate({
      current: anchorX,
      candidates: [anchorBox.w / 2],
      thresholdPx: this.snapThresholdPx,
    });
    if (snappedX.snapped) {
      anchorX = snappedX.value;
    }
    const verticalCenterAnchor = anchorBox.h / 2 + elH / 2;
    const snappedY = snapValueToNearestCandidate({
      current: anchorY,
      candidates: [verticalCenterAnchor],
      thresholdPx: this.snapThresholdPx,
    });
    if (snappedY.snapped) {
      anchorY = snappedY.value;
    }
    ({ anchorX, anchorY } = clampAnchorWithinBox({
      anchorX,
      anchorY,
      elementWidth: elW,
      elementHeight: elH,
      boxWidth: anchorBox.w,
      boxHeight: anchorBox.h,
      bottomInset,
    }));
    this.positionPreset = "custom";
    this.customVerticalAnchorState = captureCustomVerticalAnchorState({
      anchorY,
      elementHeight: elH,
      boxHeight: anchorBox.h,
      bottomInset,
    });
    this.position.left = (anchorX / anchorBox.w) * 100;
    this.position.top = (anchorY / anchorBox.h) * 100;
    this.updateSnapGuides(anchorBox, {
      showVerticalCenter: snappedX.snapped,
      showHorizontalCenter: snappedY.snapped,
    });
    this.applySubtitlePositionWithLayout(layout, anchorBox);
  }
  private applySubtitlePosition(): void {
    const subtitlesContainer = this.subtitlesContainer;
    if (!subtitlesContainer) return;
    const layout = this.getLayoutSize();
    if (!layout.w || !layout.h) return;
    const anchorBox = this.computeAnchorBoxLayout(layout);
    if (!anchorBox.w || !anchorBox.h) return;
    this.applySubtitlePositionWithLayout(layout, anchorBox);
  }
  private applySubtitlePositionWithLayout(
    layout: LayoutMetrics,
    anchorBox: AnchorBoxLayout,
  ): void {
    const subtitlesContainer = this.subtitlesContainer;
    if (!subtitlesContainer) return;
    this.applyScaleCompensation(subtitlesContainer, layout);
    this.syncAnchorDimensions(subtitlesContainer, anchorBox);
    if (this.smartLayoutEnabled) this.ensureSmartLayout(anchorBox);
    const elW = subtitlesContainer.offsetWidth;
    const elH = subtitlesContainer.offsetHeight;
    const bottomInset = this.getBottomInsetPx(layout, anchorBox);
    const anchorPosition = this.resolveCurrentAnchorPosition(
      anchorBox,
      elW,
      elH,
      bottomInset,
    );
    const containerPosition = this.clampContainerPosition(
      anchorBox,
      anchorPosition.anchorX,
      anchorPosition.anchorY,
      elW,
      elH,
      bottomInset,
    );
    const anchorX = containerPosition.anchorX;
    const anchorY = containerPosition.anchorY;
    const containerAnchorX = anchorBox.left + anchorX;
    const containerAnchorY = anchorBox.top + anchorY;
    const leftPct = (containerAnchorX / layout.w) * 100;
    const topPct = (containerAnchorY / layout.h) * 100;
    this.updateContainerPosition(subtitlesContainer, leftPct, topPct);
    this.tokenTooltip?.updatePos();
  }

  private applyScaleCompensation(
    subtitlesContainer: HTMLElement,
    layout: LayoutMetrics,
  ): void {
    const visualScale = Math.min(layout.scaleX || 1, layout.scaleY || 1);
    const compensate =
      visualScale > 0 && visualScale < 0.999 ? Math.min(1 / visualScale, 3) : 1;
    if (Math.abs(compensate - 1) < 0.001) {
      subtitlesContainer.style.removeProperty(
        "--vot-subtitles-scale-compensation",
      );
      return;
    }

    subtitlesContainer.style.setProperty(
      "--vot-subtitles-scale-compensation",
      compensate.toFixed(3),
    );
  }

  private syncAnchorDimensions(
    subtitlesContainer: HTMLElement,
    anchorBox: AnchorBoxLayout,
  ): void {
    const anchorWidthPx = Math.max(1, Math.round(anchorBox.w));
    const anchorHeightPx = Math.max(1, Math.round(anchorBox.h));
    const anchorDimsChanged =
      anchorWidthPx !== this.smartAnchorWidthPx ||
      anchorHeightPx !== this.smartAnchorHeightPx;
    if (!anchorDimsChanged) {
      return;
    }

    this.smartAnchorWidthPx = anchorWidthPx;
    this.smartAnchorHeightPx = anchorHeightPx;
    subtitlesContainer.style.setProperty(
      "--vot-subtitles-anchor-width",
      `${anchorWidthPx}px`,
    );
    subtitlesContainer.style.setProperty(
      "--vot-subtitles-anchor-height",
      `${anchorHeightPx}px`,
    );
    if (this.lastWrapTokens) {
      this.lastWrapKey = null;
      this.resetSegmentationMemo();
      this.scheduleWrapRecompute();
    }
  }

  private resolveCurrentAnchorPosition(
    anchorBox: AnchorBoxLayout,
    elementWidth: number,
    elementHeight: number,
    bottomInset: number,
  ): { anchorX: number; anchorY: number } {
    let anchorX = (this.position.left / 100) * anchorBox.w;
    let anchorY = (this.position.top / 100) * anchorBox.h;
    if (this.positionPreset === "custom") {
      anchorY = resolveCustomVerticalAnchor({
        state: this.customVerticalAnchorState,
        elementHeight,
        boxHeight: anchorBox.h,
        bottomInset,
      });
      return { anchorX, anchorY };
    }

    const presetPosition = this.resolvePresetAnchorPosition({
      preset: this.positionPreset,
      anchorBox,
      elementWidth,
      elementHeight,
      bottomInset,
    });
    anchorX = presetPosition.anchorX;
    anchorY = presetPosition.anchorY;
    if (anchorBox.w > 0) {
      this.position.left = (anchorX / anchorBox.w) * 100;
    }
    if (anchorBox.h > 0) {
      this.position.top = (anchorY / anchorBox.h) * 100;
    }
    return { anchorX, anchorY };
  }

  private clampContainerPosition(
    anchorBox: AnchorBoxLayout,
    anchorX: number,
    anchorY: number,
    elementWidth: number,
    elementHeight: number,
    bottomInset: number,
  ): { anchorX: number; anchorY: number } {
    let leftPx = anchorX - elementWidth / 2;
    let topPx = anchorY - elementHeight;
    const maxLeftPx = anchorBox.w - elementWidth;
    const maxTopPx = anchorBox.h - bottomInset - elementHeight;
    leftPx =
      maxLeftPx >= 0 ? clampToRange(leftPx, 0, maxLeftPx) : maxLeftPx / 2;
    topPx = maxTopPx >= 0 ? clampToRange(topPx, 0, maxTopPx) : 0;

    return {
      anchorX: leftPx + elementWidth / 2,
      anchorY: topPx + elementHeight,
    };
  }

  private updateContainerPosition(
    subtitlesContainer: HTMLElement,
    leftPct: number,
    topPct: number,
  ): void {
    if (
      this.lastAppliedLeftPct === null ||
      Math.abs(leftPct - this.lastAppliedLeftPct) >= 0.01
    ) {
      subtitlesContainer.style.left = `${leftPct}%`;
      this.lastAppliedLeftPct = leftPct;
    }
    if (
      this.lastAppliedTopPct === null ||
      Math.abs(topPct - this.lastAppliedTopPct) >= 0.01
    ) {
      subtitlesContainer.style.top = `${topPct}%`;
      this.lastAppliedTopPct = topPct;
    }
  }
  private resolvePresetAnchorPosition({
    preset,
    anchorBox,
    elementWidth,
    elementHeight,
    bottomInset,
  }: {
    preset: SubtitlePositionPreset;
    anchorBox: AnchorBoxLayout;
    elementWidth: number;
    elementHeight: number;
    bottomInset: number;
  }): { anchorX: number; anchorY: number } {
    let anchorX = anchorBox.w / 2;
    let anchorY = anchorBox.h - bottomInset;
    switch (preset) {
      case "top-center":
        anchorY = elementHeight;
        break;
      case "center":
        anchorY = anchorBox.h / 2 + elementHeight / 2;
        break;
      case "bottom-left":
        anchorX = elementWidth / 2;
        break;
      case "bottom-right":
        anchorX = anchorBox.w - elementWidth / 2;
        break;
      case "bottom-center":
      case "custom":
        break;
    }
    return clampAnchorWithinBox({
      anchorX,
      anchorY,
      elementWidth,
      elementHeight,
      boxWidth: anchorBox.w,
      boxHeight: anchorBox.h,
      bottomInset,
    });
  }
  private applyPositionAfterContentRender(): void {
    const layout = this.getLayoutSize();
    if (layout.w && layout.h) {
      const anchorBox = this.computeAnchorBoxLayout(layout);
      if (anchorBox.w && anchorBox.h) {
        this.refreshBottomInsetNow(layout, anchorBox);
        this.applySubtitlePositionWithLayout(layout, anchorBox);
        return;
      }
      this.refreshBottomInsetNow(layout);
      this.applySubtitlePosition();
      return;
    }
    this.refreshBottomInsetNow();
    this.applySubtitlePosition();
  }
  private trimEdgeWhitespaceTokens(tokens: SubtitleToken[]): SubtitleToken[] {
    if (!tokens.length) return tokens;
    let s = 0;
    let e = tokens.length;
    while (s < e && !tokens[s]?.text.trim()) s += 1;
    while (e > s && !tokens[e - 1]?.text.trim()) e -= 1;
    if (s === 0 && e === tokens.length) return tokens;
    return s >= e ? [] : tokens.slice(s, e);
  }
  private selectTokensByMaxLength(
    tokens: SubtitleToken[],
    time: number,
  ): SubtitleToken[] {
    if (!tokens.length) return tokens;
    let start = 0;
    let length = 0;
    let overflowed = false;
    let chosenStart = 0;
    let chosenEnd = tokens.length;
    let hasChosenRange = false;
    let matchedByTime = false;
    const considerRange = (rangeStart: number, rangeEnd: number): void => {
      if (rangeEnd <= rangeStart) return;
      if (!hasChosenRange) {
        chosenStart = rangeStart;
        chosenEnd = rangeEnd;
        hasChosenRange = true;
      }
      if (matchedByTime) return;
      const first = tokens[rangeStart];
      const last = tokens[rangeEnd - 1];
      if (!first || !last) return;
      const nextStartMs =
        rangeEnd < tokens.length ? tokens[rangeEnd]?.startMs : undefined;
      const endMs = nextStartMs ?? last.startMs + (last.durationMs ?? 0);
      if (first.startMs <= time && time < endMs) {
        chosenStart = rangeStart;
        chosenEnd = rangeEnd;
        matchedByTime = true;
      }
    };
    for (const [index, token] of tokens.entries()) {
      const nextLength = length + token.text.length;
      if (nextLength > this.maxLength && index > start) {
        overflowed = true;
        considerRange(start, index);
        start = index;
        length = token.text.length;
        continue;
      }
      length = nextLength;
    }
    if (!overflowed) {
      return this.trimEdgeWhitespaceTokens(tokens);
    }
    considerRange(start, tokens.length);
    return this.trimEdgeWhitespaceTokens(tokens.slice(chosenStart, chosenEnd));
  }
  private buildTokenPrecomputeInput(
    tokens: SubtitleToken[],
  ): TokenPrecomputeInput {
    const cached = this.tokenPrecomputeMemo;
    if (cached?.tokens === tokens) {
      return cached.value;
    }
    const { slices, key } = buildWordSlices(tokens);
    const value: TokenPrecomputeInput = {
      wordSlices: slices,
      normalizedWordsKey: key,
    };
    this.tokenPrecomputeMemo = {
      tokens,
      value,
    };
    return value;
  }
  private getTokenLayoutInputs(ctx: CanvasRenderingContext2D): {
    fontKey: string;
    maxWidthPx: number;
  } {
    const block = this.subtitlesBlock;
    if (block) {
      const cs = getComputedStyle(block);
      const fontKey = `${cs.fontStyle} ${cs.fontVariant} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      ctx.font = fontKey;
      const cssMaxWidth = Number.parseFloat(cs.maxWidth);
      const paddingLeft = Number.parseFloat(cs.paddingLeft) || 0;
      const paddingRight = Number.parseFloat(cs.paddingRight) || 0;
      const baseMaxWidth = Number.isFinite(cssMaxWidth)
        ? cssMaxWidth
        : this.subtitleMaxWidthPx || globalThis.innerWidth * 0.8;
      if (Number.isFinite(baseMaxWidth) && baseMaxWidth > 0) {
        this.subtitleMaxWidthPx = baseMaxWidth;
      }
      return {
        fontKey,
        maxWidthPx: Math.max(0, baseMaxWidth - paddingLeft - paddingRight),
      };
    }
    const remPx =
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
      16;
    const maxRem = 52;
    const cssFallbackVw = 0.8;
    const baseMaxWidth = Math.min(
      remPx * maxRem,
      this.subtitleMaxWidthPx || globalThis.innerWidth * cssFallbackVw,
    );
    const fontSizePx = this.fontSizeOverridden
      ? this.fontSize
      : Math.min(24, Math.max(14, globalThis.innerWidth * 0.016));
    const fontKey = `normal normal 500 ${fontSizePx}px ${getSubtitleFontFamilyCssValue(this.fontFamily)}`;
    ctx.font = fontKey;
    return {
      fontKey,
      maxWidthPx: Math.max(0, baseMaxWidth - fontSizePx),
    };
  }
  private getActiveLineKey(tokens: SubtitleToken[]): string {
    if (this.lastActiveLineKey !== null) {
      return this.lastActiveLineKey;
    }
    return `${tokens[0]?.startMs ?? 0}:${tokens[0]?.durationMs ?? 0}:${tokens.length}`;
  }
  private getLineMeasureMemo(
    tokens: SubtitleToken[],
    activeLineKey: string,
  ): LineMeasureMemo | null {
    const { wordSlices, normalizedWordsKey } =
      this.buildTokenPrecomputeInput(tokens);
    if (!wordSlices.length) return null;
    const ctx = this.getMeasureContext();
    if (!ctx) return null;
    const { fontKey, maxWidthPx } = this.getTokenLayoutInputs(ctx);
    if (!Number.isFinite(maxWidthPx) || maxWidthPx < 24) {
      return null;
    }
    const key = `${activeLineKey}|${fontKey}|${Math.round(
      maxWidthPx,
    )}|${normalizedWordsKey}`;
    if (this.lineMeasureMemo?.key === key) {
      return this.lineMeasureMemo;
    }
    const metrics = measureWordSlices(
      wordSlices,
      (text) => ctx.measureText(text).width,
    );
    const memo: LineMeasureMemo = {
      key,
      metrics,
      maxWidthPx,
    };
    this.lineMeasureMemo = memo;
    return memo;
  }
  private buildTokenProcessingMemo(
    tokens: SubtitleToken[],
    activeLineKey: string,
  ): TokenProcessingMemo | null {
    const lineMeasure = this.getLineMeasureMemo(tokens, activeLineKey);
    if (!lineMeasure) return null;
    const memoKey = `${lineMeasure.key}|${this.maxLength}`;
    if (this.tokenProcessingMemo?.key === memoKey) {
      return this.tokenProcessingMemo;
    }
    const safeMaxWidthPx = applyWrapWidthGuard(lineMeasure.maxWidthPx);
    const segmentRanges = computeTwoLineSegmentsUtil(
      tokens,
      lineMeasure.metrics,
      safeMaxWidthPx,
      this.maxLength,
    );
    const memo: TokenProcessingMemo = {
      key: memoKey,
      segmentRanges,
    };
    this.tokenProcessingMemo = memo;
    this.lastSegmentIndex = 0;
    return memo;
  }
  private selectSegmentIndexFromRanges(
    segmentRanges: TimedTokenSegment[],
    time: number,
  ): number {
    if (!segmentRanges.length) return -1;
    let idx = this.lastSegmentIndex;
    if (idx >= segmentRanges.length) idx = 0;
    while (idx < segmentRanges.length - 1 && time >= segmentRanges[idx].endMs) {
      idx += 1;
    }
    while (idx > 0 && time < segmentRanges[idx].startMs) {
      idx -= 1;
    }
    if (
      !(time >= segmentRanges[idx].startMs && time < segmentRanges[idx].endMs)
    ) {
      const found = segmentRanges.findIndex(
        (s) => time >= s.startMs && time < s.endMs,
      );
      if (found >= 0) {
        idx = found;
      } else {
        idx = time < segmentRanges[0].startMs ? 0 : segmentRanges.length - 1;
      }
    }
    this.lastSegmentIndex = idx;
    return idx;
  }
  private processTokens(
    tokens: SubtitleToken[],
    time: number,
  ): SubtitleToken[] {
    if (!tokens.length) return tokens;
    const activeLineKey = this.getActiveLineKey(tokens);
    const memo = this.buildTokenProcessingMemo(tokens, activeLineKey);
    if (!memo) {
      return this.selectTokensByMaxLength(tokens, time);
    }
    const { segmentRanges } = memo;
    if (!segmentRanges.length) {
      return this.trimEdgeWhitespaceTokens(tokens);
    }
    const segmentIndex = this.selectSegmentIndexFromRanges(segmentRanges, time);
    if (segmentIndex < 0) {
      return this.trimEdgeWhitespaceTokens(tokens);
    }
    const seg = segmentRanges[segmentIndex];
    return this.trimEdgeWhitespaceTokens(
      tokens.slice(seg.startToken, seg.endToken),
    );
  }
  private async translateStrTokens(text: string): Promise<[string, string]> {
    const fromLang = this.subtitleLang ?? "";
    const toLang = localizationProvider.lang;
    if (this.strTranslatedTokens) {
      const translated = await translate(text, fromLang, toLang);
      return [
        this.strTranslatedTokens,
        typeof translated === "string" ? translated : "",
      ];
    }
    const translated = await translate(
      [this.strTokens, text],
      fromLang,
      toLang,
    );
    const pair = Array.isArray(translated)
      ? translated
      : [translated, translated];
    const context = typeof pair[0] === "string" ? pair[0] : "";
    const current = typeof pair[1] === "string" ? pair[1] : "";
    this.strTranslatedTokens = context;
    return [context, current];
  }
  private isTokenSpanElement(el: unknown): el is HTMLSpanElement {
    return el instanceof HTMLSpanElement && el.dataset.votToken === "1";
  }
  private findTokenSpanInPath(
    path: EventTarget[],
    root: HTMLElement,
  ): HTMLSpanElement | null {
    for (const node of path) {
      if (this.isTokenSpanElement(node) && root.contains(node)) {
        return node;
      }
    }
    return null;
  }
  private findTokenSpanByPoint(
    x: number,
    y: number,
    root: HTMLElement,
  ): HTMLSpanElement | null {
    const hit = document.elementFromPoint(x, y);
    if (this.isTokenSpanElement(hit) && root.contains(hit)) {
      return hit;
    }
    if (!(hit instanceof Element)) return null;
    const closest = hit.closest('span[data-vot-token="1"]');
    if (closest instanceof HTMLSpanElement && root.contains(closest)) {
      return closest;
    }
    return null;
  }
  private resolveTokenSpanFromClick(event: MouseEvent): HTMLSpanElement | null {
    const root: HTMLElement | null =
      this.subtitlesBlock ?? this.subtitlesContainer;
    if (!root) return null;
    if (this.isTokenSpanElement(event.target) && root.contains(event.target)) {
      return event.target;
    }
    const path =
      typeof event.composedPath === "function" ? event.composedPath() : [];
    const fromPath = this.findTokenSpanInPath(path, root);
    if (fromPath) {
      return fromPath;
    }
    const x = event.clientX;
    const y = event.clientY;
    if (Number.isFinite(x) && Number.isFinite(y)) {
      return this.findTokenSpanByPoint(x, y, root);
    }
    return null;
  }
  releaseTooltip(): this {
    this.tooltipTranslationRequestId += 1;
    if (this.tokenTooltip?.target) {
      this.tokenTooltip.target.classList.remove("selected");
    }
    this.tokenTooltip?.release();
    this.tokenTooltip = undefined;
    destroyShadowMount(this.tooltipMount);
    this.tooltipMount = undefined;
    return this;
  }
  private clearPendingSchedulerState(): void {
    this.repositionPending = false;
    this.updatePending = false;
    this.wrapPending = false;
    this.positionRefreshPending = false;
  }
  clearRenderedContent({
    releaseTooltip = false,
  }: ClearRenderedContentOptions = {}): void {
    if (releaseTooltip) this.releaseTooltip();
    this.resetRenderMemo();
    this.lastActiveLineKey = null;
    this.strTokens = "";
    this.resetTranslationContext();
    this.subtitlesBlock = null;
    this.renderedHighlightEls = [];
    this.resetWrapMemo();
    this.lastWrapTokens = null;
    this.subtitleMaxWidthPx = 0;
    this.smartAnchorWidthPx = 0;
    this.smartAnchorHeightPx = 0;
    this.smartFontSizePx = 0;
    this.smartMaxWidthPx = 0;
    this.lastAppliedLeftPct = null;
    this.lastAppliedTopPct = null;
    this.passedStateKey = null;
    this.passedThresholds.length = 0;
    this.insetCacheReady = false;
    this.hideSnapGuides();
    this.resetSegmentationMemo();
    this.clearPendingSchedulerState();
    if (this.subtitlesContainer) {
      render(null, this.subtitlesContainer);
    }
  }
  onClick = async (event: MouseEvent): Promise<void> => {
    if (performance.now() < this.suppressTokenClicksUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const target = this.resolveTokenSpanFromClick(event);
    if (!target) return;
    if (this.toggleCurrentTooltipTarget(target)) {
      return;
    }
    this.releaseTooltip();
    const requestId = this.tooltipTranslationRequestId;
    const text = this.normalizeTokenTextForTranslation(
      target.textContent ?? "",
    );
    if (!text) return;
    const service = await votStorage.get(
      "translationService",
      defaultTranslationService,
    );
    if (requestId !== this.tooltipTranslationRequestId) return;
    target.classList.add("selected");
    const subtitlesInfo = UI.createSubtitleInfo(
      text,
      this.strTranslatedTokens || this.strTokens,
      service,
    );
    const tooltip = this.createTokenTooltip(target, subtitlesInfo.container);
    this.tokenTooltip = tooltip;
    tooltip.onClick();
    const strTokens = this.strTokens;
    const translated = await this.translateStrTokens(text);
    if (requestId !== this.tooltipTranslationRequestId) return;
    if (this.shouldSkipTooltipUpdate(requestId, tooltip, target, strTokens)) {
      return;
    }
    subtitlesInfo.header.textContent = translated[1];
    subtitlesInfo.context.textContent = translated[0];
    tooltip.setContent(subtitlesInfo.container);
  };
  private toggleCurrentTooltipTarget(target: HTMLElement): boolean {
    if (this.tokenTooltip?.target !== target || !this.tokenTooltip?.container) {
      return false;
    }

    if (this.tokenTooltip.showed) {
      target.classList.add("selected");
    } else {
      target.classList.remove("selected");
    }
    return true;
  }
  private createTokenTooltip(
    target: HTMLElement,
    content: HTMLElement,
  ): Tooltip {
    const tooltipMaxWidth = Math.max(
      this.subtitleMaxWidthPx,
      this.subtitlesContainer?.offsetWidth ?? 0,
      this.subtitlesBlock?.offsetWidth ?? 0,
      Math.min(globalThis.innerWidth * 0.6, 320),
    );
    const tooltipMount = this.ensureTooltipMount();

    return new Tooltip({
      target,
      anchor: this.subtitlesBlock ?? target,
      content,
      parentElement: tooltipMount.root,
      layoutRoot: tooltipMount.host,
      offset: { x: 4, y: 12 },
      maxWidth: tooltipMaxWidth,
      borderRadius: 12,
      bordered: false,
      position: "top",
      trigger: "click",
    });
  }
  private shouldSkipTooltipUpdate(
    requestId: number,
    tooltip: Tooltip,
    target: HTMLElement,
    strTokens: string,
  ): boolean {
    return (
      requestId !== this.tooltipTranslationRequestId ||
      strTokens !== this.strTokens ||
      this.tokenTooltip !== tooltip ||
      tooltip.target !== target ||
      !tooltip.showed
    );
  }
  private buildPassedState(
    tokens: SubtitleToken[],
    time: number,
    stateKey: string,
  ): boolean[] {
    if (this.passedStateKey !== stateKey) {
      this.passedStateKey = stateKey;
      this.passedThresholds.length = 0;
      for (const token of tokens) {
        if (!token.isWordLike) continue;
        const halfway = token.startMs + token.durationMs / 2;
        const earlyPassThreshold = Math.max(token.startMs - 100, halfway - 275);
        this.passedThresholds.push(Math.min(halfway, earlyPassThreshold));
      }
    }

    const flags = this.passedFlagsBuffer;
    const thresholds = this.passedThresholds;
    for (let i = 0; i < thresholds.length; i += 1) {
      flags[i] = time > thresholds[i];
    }
    flags.length = thresholds.length;
    return flags;
  }
  private renderTokens(
    tokens: SubtitleToken[],
  ): Array<TemplateResult | string> {
    return buildSubtitleRenderPlan(
      tokens,
      tokens.length - 1,
      this.breakAfterTokenIndexSet,
    ).map((part) => this.renderPlanPart(part));
  }

  private renderStyledSpan(
    text: string,
    style: SubtitleInlineStyle | undefined,
    isWordToken = false,
    highlightIndex?: number,
  ): TemplateResult | string {
    if (!style && !isWordToken && highlightIndex === undefined) {
      return text;
    }

    return html`<span
      data-vot-token=${isWordToken ? "1" : nothing}
      data-vot-highlight-index=${highlightIndex ?? nothing}
      data-vot-style-italic=${style?.italic ? "1" : "0"}
      data-vot-style-bold=${style?.bold ? "1" : "0"}
      data-vot-style-underline=${style?.underline ? "1" : "0"}
      data-vot-style-color=${style?.color ? "1" : "0"}
      style=${buildSubtitleInlineStyleCssText(style)}
      >${text}</span
    >`;
  }

  private renderPlanPart(
    part: SubtitleRenderPlanPart,
  ): TemplateResult | string {
    if (part.kind === "break") {
      return html`<br class="vot-subtitles-br" />`;
    }
    return this.renderStyledSpan(
      part.text,
      part.style,
      part.kind === "word",
      part.highlightIndex,
    );
  }
  private updatePassedClasses(passedFlags: boolean[]): void {
    for (const tokenEl of this.renderedHighlightEls) {
      const highlightIndex = Number.parseInt(
        tokenEl.dataset.votHighlightIndex ?? "",
        10,
      );
      const isPassed =
        Number.isInteger(highlightIndex) &&
        highlightIndex >= 0 &&
        highlightIndex < passedFlags.length
          ? passedFlags[highlightIndex]
          : false;
      tokenEl.classList.toggle("passed", isPassed);
    }
  }
  private clearPassedClasses(): void {
    for (const tokenEl of this.renderedHighlightEls) {
      tokenEl.classList.remove("passed");
    }
  }
  private setBreakAfterTokenIndices(indices: number[]): void {
    this.breakAfterTokenIndices = indices;
    this.breakAfterTokenIndexSet = indices.length ? new Set(indices) : null;
  }
  private scheduleWrapRecompute(tokens: SubtitleToken[] | null = null): void {
    if (tokens) {
      this.lastWrapTokens = tokens;
    }
    const shouldRequestTick = !this.wrapPending;
    this.wrapPending = true;
    if (shouldRequestTick) {
      this.intervalIdleChecker.requestImmediateTick();
    }
  }
  private maybeRefreshPosition(force = false): void {
    if (this.abortController.signal.aborted) return;
    if (!this.subtitlesContainer) return;
    const now = performance.now();
    if (
      !force &&
      now - this.lastPositionRefreshTs < this.positionRefreshIntervalMs
    )
      return;
    this.lastPositionRefreshTs = now;
    this.positionRefreshPending = true;
    this.intervalIdleChecker.requestImmediateTick();
  }
  private getMeasureContext(font?: string): CanvasRenderingContext2D | null {
    if (!this.measureCanvas) {
      this.measureCanvas = document.createElement("canvas");
      this.measureCanvas.width = 1;
      this.measureCanvas.height = 1;
    }
    if (!this.measureCtx) {
      this.measureCtx =
        this.measureCanvas.getContext("2d", { alpha: false }) ??
        this.measureCanvas.getContext("2d");
    }
    if (!this.measureCtx) return null;
    if (typeof font === "string" && font) {
      this.measureCtx.font = font;
    }
    return this.measureCtx;
  }
  private arraysEqual(a: number[], b: number[]): boolean {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  private recomputeWrapNow(): void {
    const tokens = this.lastWrapTokens;
    const block = this.subtitlesBlock;
    if (!tokens || !block) return;
    const ctx = this.getMeasureContext();
    if (!ctx) return;
    const { fontKey, maxWidthPx } = this.getTokenLayoutInputs(ctx);
    if (!Number.isFinite(maxWidthPx) || maxWidthPx < 50) return;
    const safeMaxWidthPx = applyWrapWidthGuard(maxWidthPx);
    if (safeMaxWidthPx < 50) return;
    const wrapKey = `${this.getActiveLineKey(tokens)}|${fontKey}|${Math.round(
      safeMaxWidthPx,
    )}|${this.stringifyTokens(tokens)}`;
    if (wrapKey === this.lastWrapKey) return;
    this.lastWrapKey = wrapKey;

    const next = computeTokenWrapPlanUtil(
      tokens,
      (text) => ctx.measureText(text).width,
      safeMaxWidthPx,
    );
    const breaksChanged = !this.arraysEqual(
      next.breakAfterTokenIndices,
      this.breakAfterTokenIndices,
    );
    if (breaksChanged) {
      this.setBreakAfterTokenIndices(next.breakAfterTokenIndices);
      this.resetRenderMemo();
      this.update();
    }
  }
  setContent(
    subtitles: ProcessedSubtitles | null,
    lang: string | undefined = undefined,
  ): void {
    this.releaseTooltip();
    this.subtitleLang = lang;
    if (!subtitles || !this.video) {
      this.clearRenderedContent();
      this.subtitles = null;
      this.maxActiveCueLookbackMs = 0;
      this.lastPlaybackTimeMs = null;
      this.clearPendingSchedulerState();
      this.stopVideoFrameLoop();
      this.detachDragDocumentListeners();
      return;
    }
    this.createSubtitlesContainer();
    this.subtitles = subtitles;
    this.maxActiveCueLookbackMs = subtitles.subtitles.reduce(
      (maxDurationMs, line) =>
        Math.max(maxDurationMs, Math.max(0, line.durationMs)),
      0,
    );
    this.lastPlaybackTimeMs = Math.max(0, this.video.currentTime * 1000);
    this.lastActiveLineKey = null;
    this.syncVideoFrameLoop();
    this.updateContainerRect();
    this.update();
    this.intervalIdleChecker.requestImmediateTick();
  }
  setMaxLength(len: number): void {
    if (typeof len === "number" && len > 0) {
      this.maxLength = len;
      this.resetSegmentationMemo();
      this.update();
      this.scheduleReposition();
    }
  }
  setHighlightWords(value: unknown): void {
    const wasEnabled = this.highlightWords;
    this.highlightWords = Boolean(value);
    if (wasEnabled && !this.highlightWords) {
      this.clearPassedClasses();
    }
    this.update();
  }
  setSmartLayout(enabled: boolean): void {
    const next = enabled !== false;
    if (next === this.smartLayoutEnabled) return;
    this.smartLayoutEnabled = next;
    this.subtitlesContainer?.style.removeProperty("--vot-subtitles-max-width");
    this.lastSmartLayoutKey = null;
    this.resetWrapMemo();
    this.resetRenderMemo();
    this.resetSegmentationMemo();
    this.applyManualFontSizeStyle();
    this.update();
    this.scheduleWrapRecompute();
    this.scheduleReposition();
  }
  setFontSize(size: number): void {
    this.fontSize = size;
    this.fontSizeOverridden = true;
    if (!this.smartLayoutEnabled) {
      this.applyManualFontSizeStyle();
      this.lastWrapKey = null;
      this.resetSegmentationMemo();
      this.scheduleWrapRecompute();
      this.scheduleReposition();
    }
  }
  setFontFamily(fontFamily: SubtitleFontFamily): void {
    this.fontFamily = fontFamily;
    this.applyFontFamilyStyle();
    this.lastWrapKey = null;
    this.resetSegmentationMemo();
    this.scheduleWrapRecompute();
    this.scheduleReposition();
  }
  setOpacity(rate: number): void {
    const numericRate = Number(rate);
    const clampedRate = Number.isFinite(numericRate)
      ? clampToRange(numericRate, 0, 100)
      : 0;
    this.opacity = ((100 - clampedRate) / 100).toFixed(2);
    this.applyOpacityStyle();
  }
  private stringifyTokens(tokens: SubtitleToken[]): string {
    let out = "";
    for (const token of tokens) {
      out += token.text;
    }
    return out;
  }
  private resolveActiveLine(
    time: number,
    subtitlesList: SubtitleLine[],
  ): { line: SubtitleLine; lineKey: string } | null {
    return buildActiveSubtitleRenderLine(
      time,
      subtitlesList,
      this.maxActiveCueLookbackMs,
    );
  }
  private clearInactiveLineState(): void {
    this.lastActiveLineKey = null;
    if (this.subtitlesBlock || this.lastRenderKey !== null || this.strTokens) {
      this.clearRenderedContent({ releaseTooltip: true });
      return;
    }

    this.releaseTooltip();
  }
  private refreshSmartLayoutIfNeeded(): void {
    if (!this.smartLayoutEnabled) {
      return;
    }

    const now = performance.now();
    if (
      this.lastSmartLayoutKey !== null &&
      now - this.lastSmartLayoutCheckTs <= 500
    ) {
      return;
    }

    this.lastSmartLayoutCheckTs = now;
    const layout = this.getLayoutSize();
    if (!layout.w || !layout.h) {
      return;
    }

    const anchorBox = this.computeAnchorBoxLayout(layout);
    if (anchorBox.w && anchorBox.h) {
      this.ensureSmartLayout(anchorBox);
    }
  }
  private getRenderState(
    line: SubtitleLine,
    activeLineKey: string,
    time: number,
  ): {
    tokens: SubtitleToken[];
    tokensChanged: boolean;
    passedFlags: boolean[] | null;
    renderKey: string;
  } {
    const tokens = this.processTokens(line.tokens, time);
    this.lastWrapTokens = tokens;

    const strTokens = this.stringifyTokens(tokens);
    const tokensChanged = strTokens !== this.strTokens;
    if (tokensChanged) {
      this.releaseTooltip();
      this.strTokens = strTokens;
      this.resetTranslationContext();
      this.resetWrapMemo();
    }

    const passedStateKey = `${activeLineKey}:${strTokens}`;
    const passedFlags = this.highlightWords
      ? this.buildPassedState(tokens, time, passedStateKey)
      : null;
    const wrapKey = this.breakAfterTokenIndices.join(",");

    return {
      tokens,
      tokensChanged,
      passedFlags,
      renderKey: `${activeLineKey}:${strTokens}:${wrapKey}`,
    };
  }
  private syncRenderedTokens(tokens: SubtitleToken[]): void {
    this.subtitlesContainer =
      this.subtitlesContainer ?? this.createSubtitlesContainer();
    render(
      html`<vot-block
        class="vot-subtitles"
        dir="auto"
        lang=${this.subtitleLang ?? ""}
        @click=${this.onClick}
      >
        ${this.renderTokens(tokens)}
      </vot-block>`,
      this.subtitlesContainer,
    );

    const firstChild = this.subtitlesContainer.firstElementChild;
    this.subtitlesBlock =
      firstChild instanceof HTMLElement &&
      firstChild.classList.contains("vot-subtitles")
        ? firstChild
        : null;
    this.renderedHighlightEls = this.subtitlesBlock
      ? Array.from(
          this.subtitlesBlock.querySelectorAll<HTMLSpanElement>(
            "span[data-vot-highlight-index]",
          ),
        )
      : [];
  }
  update(): void {
    if (!this.video || !this.subtitles) return;
    const time = this.resolvePlaybackTimeMs();
    const subtitlesList = this.subtitles.subtitles;
    const activeLine = this.resolveActiveLine(time, subtitlesList);
    if (!activeLine) {
      this.clearInactiveLineState();
      return;
    }

    this.lastActiveLineKey = activeLine.lineKey;
    this.refreshSmartLayoutIfNeeded();
    const renderState = this.getRenderState(
      activeLine.line,
      activeLine.lineKey,
      time,
    );
    const { tokens, tokensChanged, passedFlags, renderKey } = renderState;
    if (renderKey === this.lastRenderKey) {
      if (this.highlightWords && !tokensChanged && passedFlags) {
        this.updatePassedClasses(passedFlags);
      }
      this.maybeRefreshPosition();
      return;
    }

    this.lastRenderKey = renderKey;
    this.syncRenderedTokens(tokens);
    if (this.highlightWords && passedFlags) {
      this.updatePassedClasses(passedFlags);
    }
    if (tokensChanged) {
      this.applyPositionAfterContentRender();
      this.scheduleWrapRecompute(tokens);
      this.scheduleReposition();
    } else {
      this.maybeRefreshPosition();
    }
  }
  release(): void {
    this.detachDragDocumentListeners();
    this.stopVideoFrameLoop();
    this.abortController.abort();
    this.resizeObserver?.disconnect();
    this.clearPendingSchedulerState();
    this.checkerUnsubscribe?.();
    this.checkerUnsubscribe = null;
    this.releaseTooltip();
    if (this.subtitlesContainer) {
      this.subtitlesContainer.remove();
      this.subtitlesContainer = null;
    }
    destroyShadowMount(this.tooltipMount);
    this.tooltipMount = undefined;
    this.fullscreenLayerController.release();
    if (this.safeAreaProbeEl) {
      this.safeAreaProbeEl.remove();
      this.safeAreaProbeEl = null;
    }
    if (this.guidesLayer) {
      this.guidesLayer.remove();
      this.guidesLayer = null;
      this.verticalGuide = null;
      this.horizontalGuide = null;
    }
    this.measureCtx = null;
    this.measureCanvas = null;
    this.lastAppliedLeftPct = null;
    this.lastAppliedTopPct = null;
    this.passedStateKey = null;
    this.passedThresholds.length = 0;
    this.insetCacheReady = false;
  }
}
