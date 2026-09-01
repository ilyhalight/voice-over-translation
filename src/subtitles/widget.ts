import {
  mountSolidSubtitlesOverlay,
  mountSolidSubtitlesWidget,
  type SolidSubtitlesWidgetHandle,
} from "../components/SubtitlesWidget/SubtitlesWidget";
import {
  mountSubtitleTokenTooltip,
  type SubtitleTokenTooltipHandle,
} from "../components/SubtitlesWidget/SubtitleTokenTooltip";
import { DEFAULT_TRANSLATION_SERVICE } from "../config/config";
import { translate } from "../core/translateApis";
import { localizationProvider } from "../localization/localizationProvider";
import type {
  ProcessedSubtitles,
  SubtitleFontFamily,
  SubtitleLine,
  SubtitlePositionPreset,
  SubtitleToken,
} from "../types/subtitles";
import {
  createShadowMount,
  destroyShadowMount,
  reparentShadowMount,
  type ShadowMount,
} from "../ui/shadowMount";
import type { IntervalIdleChecker } from "../utils/intervalIdleChecker";
import { votStorage } from "../utils/storage";
import { buildActiveSubtitleRenderLine } from "./activeCues";
import {
  ensureGoogleSubtitleFontLoaded,
  getSubtitleFontFamilyCssValue,
} from "./fonts";
import { FullscreenLayerController } from "./fullscreenLayerController";
import {
  applyPassedState,
  clearPassedState,
  createHighlightState,
  type HighlightState,
  syncHighlightState,
} from "./highlightState";
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
  LEADING_PUNCTUATION_RE,
  TRAILING_PUNCTUATION_RE,
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
import { computeNextWakeMs } from "./wakeSchedule";
import "../shims/rvfc-polyfill";

const trimEdgePunctuation = (value: string): string =>
  value
    .trim()
    .replace(LEADING_PUNCTUATION_RE, "")
    .replace(TRAILING_PUNCTUATION_RE, "");

type LayoutMetrics = {
  w: number;
  h: number;
  rect: DOMRect;
  /** visual px / layout px */
  scaleX: number;
  /** visual px / layout px */
  scaleY: number;
};
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
  offset: { x: number; y: number };
};
const WRAP_WIDTH_GUARD_PX = 8;
const WRAP_WIDTH_GUARD_RATIO = 0.97;
const MIN_EFFECTIVE_WRAP_WIDTH_PX = 24;
function applyWrapWidthGuard(maxWidthPx: number): number {
  if (!Number.isFinite(maxWidthPx) || maxWidthPx <= 0) return 0;
  return Math.max(
    MIN_EFFECTIVE_WRAP_WIDTH_PX,
    Math.min(
      maxWidthPx - WRAP_WIDTH_GUARD_PX,
      maxWidthPx * WRAP_WIDTH_GUARD_RATIO,
    ),
  );
}
function isDocumentHidden(): boolean {
  return typeof document !== "undefined" && document.hidden === true;
}

export class SubtitlesWidget {
  private readonly video?: HTMLVideoElement;
  private container: HTMLElement | ShadowRoot;
  private readonly fullscreenLayerController: FullscreenLayerController;
  private tooltipMount?: ShadowMount;
  private subtitlesContainer: HTMLElement | null = null;
  private subtitleView: SolidSubtitlesWidgetHandle | null = null;
  private subtitleOverlayHost: HTMLElement | null = null;
  private subtitlesBlock: HTMLElement | null = null;
  private renderedHighlightEls: HTMLSpanElement[] = [];
  /** Parsed highlight indices + last applied class state (see `highlightState.ts`). */
  private readonly highlightState: HighlightState = createHighlightState();
  private sourceEpoch = 0;
  private contentEpoch = 0;
  private styleEpoch = 0;
  /** Monotonic tick counter used to cache layout reads within a single tick. */
  private tickSeq = 0;
  private layoutSizeCache: { tick: number; value: LayoutMetrics } | null = null;
  private smartCssMetricsCache: {
    key: string;
    value: SmartCssMetrics | null;
  } | null = null;
  private tokenLayoutInputsCache: {
    key: string;
    value: { fontKey: string; maxWidthPx: number };
  } | null = null;
  private elementMetricsCache: { key: string; w: number; h: number } | null =
    null;
  private lastPositionApplyKey: string | null = null;
  private lastScaleCompensation: string | null = null;
  private readonly containerVarValues = new Map<string, string>();
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
  private readonly onVisibilityChangeBound: () => void;
  private lastPlaybackTimeMs: number | null = null;
  private dragAbortController: AbortController | null = null;
  private lastPositionRefreshTs = 0;
  private readonly positionRefreshIntervalMs = 250;
  /** Media time before which nothing in the pipeline can change. */
  private nextWakeAtMs: number | null = null;
  /** Media time the current deadline was computed from (seek detection). */
  private wakeBaseTimeMs = 0;
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
    offset: { x: 0, y: 0 },
  };
  private dragLayoutCache: LayoutMetrics | null = null;
  /** Newest un-applied pointer sample; older samples in the same frame are dropped. */
  private pendingDragPoint: { clientX: number; clientY: number } | null = null;
  private dragFrameId: number | null = null;
  private readonly dragStartThresholdPx = 4;
  private readonly snapThresholdPx = 18;
  private suppressTokenClicksUntil = 0;
  private readonly abortController = new AbortController();
  private resizeObserver?: ResizeObserver;
  private resizeTarget?: Element;
  private tokenTooltip?: SubtitleTokenTooltipHandle;
  private tokenTooltipTarget?: HTMLElement;
  private subtitleOverlayDispose?: () => void;
  private tooltipTranslationRequestId = 0;
  private readonly intervalIdleChecker: IntervalIdleChecker;
  private checkerUnsubscribe: (() => void) | null = null;
  private strTokens = "";
  private strTranslatedTokens = "";
  private passedStateKey: string | null = null;
  private readonly passedThresholds: number[] = [];
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
  private safeAreaProbeEl: HTMLElement | null = null;
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
    container: HTMLElement | ShadowRoot,
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
    this.onVisibilityChangeBound = () => this.handleDocumentVisibilityChange();
    this.checkerUnsubscribe = this.intervalIdleChecker.subscribe(
      () => {
        this.onCheckerTick();
      },
      { hasPendingWork: () => this.hasPendingWork() },
    );
    this.bindEvents();
  }
  public updateMount({
    container,
  }: {
    container: HTMLElement | ShadowRoot;
  }): void {
    const containerChanged = this.container !== container;

    this.container = container;
    this.fullscreenLayerController.updateContainer(container);

    this.syncWidgetMount();

    if (containerChanged) {
      this.syncResizeTarget();
      this.dragLayoutCache = null;
      this.invalidateLayoutCache();
      this.invalidateStyleCaches();
      if (this.tokenTooltip) {
        this.tokenTooltip.updateMount(this.getTokenTooltipParentElement());
      }
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
    this.invalidateWakeDeadline();
  }
  private readSmartCssMetrics(): SmartCssMetrics | null {
    const block = this.subtitlesBlock;
    if (!block) return null;
    const cacheKey = `${this.contentEpoch}|${this.styleEpoch}`;
    const cached = this.smartCssMetricsCache;
    if (cached && cached.key === cacheKey) return cached.value;
    const value = this.readSmartCssMetricsNow(block);
    this.smartCssMetricsCache = { key: cacheKey, value };
    return value;
  }

  private readSmartCssMetricsNow(block: HTMLElement): SmartCssMetrics | null {
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
  private ensureSmartLayout(anchorBox: LayoutMetrics): {
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
    const previous = this.containerVarValues.get(name);
    if (value === null) {
      if (previous === undefined) return;
      this.containerVarValues.delete(name);
      container.style.removeProperty(name);
      this.invalidateStyleCaches();
      return;
    }
    if (previous === value) return;
    this.containerVarValues.set(name, value);
    container.style.setProperty(name, value);
    this.invalidateStyleCaches();
  }

  /** Invalidate every cache derived from computed style or element geometry. */
  private invalidateStyleCaches(): void {
    this.styleEpoch += 1;
    this.smartCssMetricsCache = null;
    this.tokenLayoutInputsCache = null;
    this.elementMetricsCache = null;
    this.lastPositionApplyKey = null;
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
    anchorBox: LayoutMetrics,
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
      this.verticalGuide.style.left = `${anchorBox.w / 2}px`;
      this.verticalGuide.style.top = "0px";
      this.verticalGuide.style.height = `${anchorBox.h}px`;
      if (showVerticalCenter) {
        this.verticalGuide.dataset.visible = "true";
      } else {
        delete this.verticalGuide.dataset.visible;
      }
    }
    if (this.horizontalGuide) {
      this.horizontalGuide.style.left = "0px";
      this.horizontalGuide.style.top = `${anchorBox.h / 2}px`;
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
      this.subtitleOverlayHost &&
      this.subtitleOverlayHost.parentNode !== this.container
    ) {
      this.container.appendChild(this.subtitleOverlayHost);
    }
    if (this.tooltipMount) {
      reparentShadowMount(this.tooltipMount, this.container);
    }
    this.syncGuideLayerMount();
  }
  private ensureTooltipMount(): ShadowMount {
    if (this.tooltipMount) {
      reparentShadowMount(this.tooltipMount, this.container);
    } else {
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
    const overlayMount = mountSolidSubtitlesOverlay(this.onPointerDownBound);
    this.subtitleOverlayDispose = overlayMount.dispose;
    this.subtitleOverlayHost = overlayMount.host;
    const container = overlayMount.overlay;
    this.subtitlesContainer = container;
    // A new element carries none of the previously written custom properties,
    // so the write-if-changed bookkeeping must start from scratch.
    this.containerVarValues.clear();
    this.lastScaleCompensation = null;
    this.smartAnchorWidthPx = 0;
    this.smartAnchorHeightPx = 0;
    this.invalidateLayoutCache();
    this.invalidateStyleCaches();
    this.syncWidgetMount();
    this.syncVisualStyleVars();
    this.insetCacheReady = false;
    this.updateContainerRect();
    return container;
  }
  private readonly onGlobalPointerDown = (event: PointerEvent): void => {
    if (
      this.tokenTooltip &&
      this.tooltipMount &&
      event.composedPath().includes(this.tooltipMount.host)
    ) {
      return;
    }

    if (
      this.subtitlesContainer &&
      !this.subtitlesContainer.contains(event.target as Node)
    ) {
      this.releaseTooltip();
    }
  };

  private bindEvents(): void {
    const { signal } = this.abortController;
    const opts = { signal } as AddEventListenerOptions;
    for (const eventName of [
      "play",
      "pause",
      "seeking",
      "seeked",
      "ended",
    ] as const) {
      this.video?.addEventListener(
        eventName,
        this.onPlaybackStateChangeBound,
        opts,
      );
    }
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.syncResizeTarget();
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
    globalThis.addEventListener("pointerdown", this.onGlobalPointerDown, opts);
    document.addEventListener(
      "visibilitychange",
      this.onVisibilityChangeBound,
      opts,
    );
  }
  private syncResizeTarget(): void {
    const nextTarget =
      this.container instanceof ShadowRoot
        ? this.container.host
        : this.container;
    if (nextTarget === this.resizeTarget) return;
    if (this.resizeTarget) this.resizeObserver?.unobserve(this.resizeTarget);
    this.resizeTarget = nextTarget;
    this.resizeObserver?.observe(nextTarget);
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
    // Deadline gate: between two boundaries (cue start, cue end + lookback,
    // next highlight threshold) no state can change, so a per-frame wake costs
    // two comparisons instead of the whole update path.
    if (this.canSkipWake(this.lastPlaybackTimeMs)) {
      return;
    }
    const minInterval = this.getUpdateMinIntervalMs();
    if (now - this.lastUpdateRequestTs < minInterval) return;
    this.lastUpdateRequestTs = now;
    this.updatePending = true;
    this.intervalIdleChecker.requestImmediateTick();
  }
  /** True when `timeMs` has not yet reached the next boundary. */
  private canSkipWake(timeMs: number | null): boolean {
    if (this.updatePending || this.repositionPending || this.wrapPending) {
      return false;
    }
    if (this.nextWakeAtMs === null) return false;
    if (typeof timeMs !== "number" || !Number.isFinite(timeMs)) return false;
    // A seek (in either direction) invalidates the deadline.
    if (timeMs < this.wakeBaseTimeMs) return false;
    return timeMs < this.nextWakeAtMs;
  }
  private invalidateWakeDeadline(): void {
    this.nextWakeAtMs = null;
  }
  private recomputeWakeDeadline(timeMs: number): void {
    if (!this.subtitles) {
      this.invalidateWakeDeadline();
      return;
    }
    this.wakeBaseTimeMs = timeMs;
    this.nextWakeAtMs = computeNextWakeMs({
      timeMs,
      lines: this.subtitles.subtitles,
      lookbackMs: this.maxActiveCueLookbackMs,
      thresholds: this.highlightWords ? this.passedThresholds : undefined,
      maxSleepMs: this.positionRefreshIntervalMs,
    });
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
    // play/pause/seek/ratechange all move the timeline under the deadline.
    this.invalidateWakeDeadline();
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
    if (!this.subtitles || video.paused || video.ended || isDocumentHidden()) {
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
    if (!video || video.paused || video.ended || !this.subtitles) return;

    const mediaTime = Number.isFinite(metadata.mediaTime)
      ? metadata.mediaTime
      : null;
    const rawTime =
      mediaTime === 0 && video.currentTime > 0 ? video.currentTime : mediaTime; // #1657
    const playbackTimeMs = rawTime == null ? undefined : rawTime * 1000;

    this.requestUpdate(playbackTimeMs, now);
    this.startVideoFrameLoop();
  };
  /**
   * Whether a periodic tick would actually do something.
   *
   * A wake loop is not free: a 60 Hz callback that does nothing still measures
   * ~1% main-thread CPU, and a 250 ms poll keeps the thread from ever settling.
   * Reporting `false` lets the scheduler go fully dormant until playback, a
   * pointer, a resize, or a visibility change wakes it.
   */
  private hasPendingWork(): boolean {
    if (this.abortController.signal.aborted) return false;
    if (
      this.repositionPending ||
      this.wrapPending ||
      this.positionRefreshPending ||
      this.updatePending
    ) {
      return true;
    }
    // Nothing queued: only keep polling while subtitles are actually playing.
    if (!this.subtitles || !this.video) return false;
    if (isDocumentHidden()) return false;
    return !this.video.paused && !this.video.ended;
  }

  private handleDocumentVisibilityChange(): void {
    if (isDocumentHidden()) {
      // A background tab paints nothing; rVFC would keep firing on some
      // platforms and the deadline gate would still run per frame.
      this.stopVideoFrameLoop();
      return;
    }
    this.invalidateWakeDeadline();
    this.scheduleReposition();
    this.syncVideoFrameLoop();
  }

  private onCheckerTick(): void {
    if (this.abortController.signal.aborted) return;
    this.tickSeq += 1;
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
    if (this.dragAbortController) return;
    const dragAbortController = new AbortController();
    const { signal } = dragAbortController;
    document.addEventListener("pointermove", this.onPointerMoveBound, {
      signal,
      passive: false,
      capture: true,
    });
    document.addEventListener("pointerup", this.onPointerUpBound, {
      signal,
      capture: true,
    });
    document.addEventListener("pointercancel", this.onPointerUpBound, {
      signal,
      capture: true,
    });
    this.dragAbortController = dragAbortController;
  }
  private detachDragDocumentListeners(): void {
    this.dragAbortController?.abort();
    this.dragAbortController = null;
  }
  private onResize(): void {
    this.dragLayoutCache = null;
    this.invalidateLayoutCache();
    this.invalidateStyleCaches();
    this.syncWidgetMount();
    this.scheduleReposition();
  }
  private updateContainerRect(): void {
    const layout = this.getLayoutSize();
    if (!layout.w || !layout.h) return;
    this.refreshBottomInsetNow(layout);
    this.applySubtitlePositionWithLayout(layout);
  }
  private getLayoutSize(): LayoutMetrics {
    const cached = this.layoutSizeCache;
    if (cached && cached.tick === this.tickSeq) return cached.value;
    const value = this.readLayoutSize();
    this.layoutSizeCache = { tick: this.tickSeq, value };
    return value;
  }

  private invalidateLayoutCache(): void {
    this.layoutSizeCache = null;
    this.elementMetricsCache = null;
    this.lastPositionApplyKey = null;
  }

  private readLayoutSize(): LayoutMetrics {
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
    const el = document.createElement("vot-block");
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
    return (
      globalThis.matchMedia?.("(max-width: 900px) and (pointer: coarse)")
        ?.matches ?? false
    );
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
  private refreshBottomInsetNow(layout = this.getLayoutSize()): void {
    this.refreshInsetCache();
    if (!layout.h) {
      this.bottomInsetCachedPx = 0;
      return;
    }
    this.bottomInsetCachedPx = this.computeReservedBottomInsetPx(
      layout.h,
      this.getBottomInsetPreset(),
    );
  }
  private getBottomInsetPx(layout = this.getLayoutSize()): number {
    if (!this.insetCacheReady) {
      this.refreshInsetCache();
    }
    const preset = this.getBottomInsetPreset();
    const safeAreaBottom = this.safeAreaBottomInsetCachedPx;
    const paddingBottom = this.containerPaddingBottomCachedPx;
    if (this.isMobileViewport()) {
      return Math.max(paddingBottom, safeAreaBottom);
    }
    const reserved = layout.h
      ? this.computeReservedBottomInsetPx(layout.h, preset)
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
    this.lastPositionRefreshTs = performance.now();
    const subRect = subtitlesContainer.getBoundingClientRect();
    const pointerX = (event.clientX - containerRect.left) / scaleX;
    const pointerY = (event.clientY - containerRect.top) / scaleY;
    const anchorX =
      (subRect.left - containerRect.left + subRect.width / 2) / scaleX;
    const anchorY = (subRect.top - containerRect.top + subRect.height) / scaleY;
    this.dragging.pointerId = event.pointerId;
    this.dragging.candidate = true;
    this.dragging.active = false;
    this.dragging.moved = false;
    this.dragging.startClientX = event.clientX;
    this.dragging.startClientY = event.clientY;
    this.dragging.offset.x = anchorX - pointerX;
    this.dragging.offset.y = anchorY - pointerY;
    this.hideSnapGuides();
    // Cache the gesture-invariant layout metrics; they only change on resize,
    // fullscreen transitions or reposition, all of which invalidate the cache.
    this.dragLayoutCache = layout;
    this.attachDragDocumentListeners();
  }
  private scheduleDragFrame(): void {
    if (this.dragFrameId !== null) return;
    this.dragFrameId = requestAnimationFrame(() => {
      this.dragFrameId = null;
      this.flushDragFrame();
    });
  }

  private cancelDragFrame(): void {
    if (this.dragFrameId === null) return;
    cancelAnimationFrame(this.dragFrameId);
    this.dragFrameId = null;
  }

  private flushDragFrame(): void {
    const point = this.pendingDragPoint;
    this.pendingDragPoint = null;
    if (!point) return;
    if (this.abortController.signal.aborted) return;
    if (!this.dragging.active) return;
    this.applyDragPosition(point.clientX, point.clientY);
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
    // Apply the last pointer sample synchronously so the released position is
    // exactly the position the user let go at (no dropped final frame).
    this.cancelDragFrame();
    const pending = this.pendingDragPoint;
    this.pendingDragPoint = null;
    if (pending) {
      this.applyDragPosition(pending.clientX, pending.clientY);
    }
    this.dragLayoutCache = null;
    this.hideSnapGuides();
    this.detachDragDocumentListeners();
  }
  private onPointerMove(event: PointerEvent): void {
    if (!this.dragging.candidate || this.dragging.pointerId === null) return;
    if (event.pointerId !== this.dragging.pointerId) return;
    if (this.dragging.active) {
      this.dragging.moved = true;
    } else {
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
      try {
        this.subtitlesContainer?.setPointerCapture(event.pointerId);
      } catch {}
    }
    event.preventDefault();
    event.stopPropagation();
    this.pendingDragPoint = { clientX: event.clientX, clientY: event.clientY };
    this.scheduleDragFrame();
  }

  /**
   * Applies a pointer sample to the subtitle anchor position.
   */
  private applyDragPosition(clientX: number, clientY: number): void {
    const layout = this.dragLayoutCache ?? this.getLayoutSize();
    const { rect: containerRect, w, h, scaleX, scaleY } = layout;
    if (!w || !h) return;
    const pointerX = (clientX - containerRect.left) / scaleX;
    const pointerY = (clientY - containerRect.top) / scaleY;
    let anchorX = pointerX + this.dragging.offset.x;
    let anchorY = pointerY + this.dragging.offset.y;
    // Layout read: route through the epoch-keyed cache used by the static
    // position path so a drag frame does not force an extra synchronous layout
    // while the pointer stream is being flushed inside rAF.
    const containerBox = this.subtitlesContainer
      ? this.measureContainerBox(this.subtitlesContainer)
      : { w: 0, h: 0 };
    const elW = containerBox.w;
    const elH = containerBox.h;
    // Custom (dragged) placement intentionally ignores the safe-area inset:
    // the user picked an absolute anchor, so the inset must not push it back.
    // Mirrors `applySubtitlePositionWithLayout`, which uses 0 for "custom".
    const bottomInset = 0;
    const snappedX = snapValueToNearestCandidate({
      current: anchorX,
      candidates: [layout.w / 2],
      thresholdPx: this.snapThresholdPx,
    });
    if (snappedX.snapped) {
      anchorX = snappedX.value;
    }
    const verticalCenterAnchor = layout.h / 2 + elH / 2;
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
      boxWidth: layout.w,
      boxHeight: layout.h,
      bottomInset,
    }));
    this.positionPreset = "custom";
    this.customVerticalAnchorState = captureCustomVerticalAnchorState({
      anchorY,
      elementHeight: elH,
      boxHeight: layout.h,
      bottomInset,
    });
    this.position.left = (anchorX / layout.w) * 100;
    this.position.top = (anchorY / layout.h) * 100;
    this.updateSnapGuides(layout, {
      showVerticalCenter: snappedX.snapped,
      showHorizontalCenter: snappedY.snapped,
    });
    this.applySubtitlePositionWithLayout(layout);
  }
  private applySubtitlePosition(): void {
    const subtitlesContainer = this.subtitlesContainer;
    if (!subtitlesContainer) return;
    const layout = this.getLayoutSize();
    if (!layout.w || !layout.h) return;
    this.applySubtitlePositionWithLayout(layout);
  }
  private buildPositionApplyKey(layout: LayoutMetrics): string {
    return `${Math.round(layout.w)}x${Math.round(layout.h)}|${layout.scaleX.toFixed(3)}x${layout.scaleY.toFixed(3)}|${this.positionPreset}|${this.position.left.toFixed(3)},${this.position.top.toFixed(3)}|${this.contentEpoch}|${this.styleEpoch}`;
  }

  private applySubtitlePositionWithLayout(layout: LayoutMetrics): void {
    const subtitlesContainer = this.subtitlesContainer;
    if (!subtitlesContainer) return;
    const applyKey = this.buildPositionApplyKey(layout);
    if (applyKey === this.lastPositionApplyKey) return;

    this.applyScaleCompensation(subtitlesContainer, layout);
    this.syncAnchorDimensions(subtitlesContainer, layout);
    if (this.smartLayoutEnabled) this.ensureSmartLayout(layout);
    const { w: elW, h: elH } = this.measureContainerBox(subtitlesContainer);
    const bottomInset =
      this.positionPreset === "custom" ? 0 : this.getBottomInsetPx(layout);
    const anchorPosition = this.resolveCurrentAnchorPosition(
      layout,
      elW,
      elH,
      bottomInset,
    );
    const containerPosition = this.clampContainerPosition(
      layout,
      anchorPosition.anchorX,
      anchorPosition.anchorY,
      elW,
      elH,
      bottomInset,
    );
    const anchorX = containerPosition.anchorX;
    const anchorY = containerPosition.anchorY;
    const leftPct = (anchorX / layout.w) * 100;
    const topPct = (anchorY / layout.h) * 100;
    this.updateContainerPosition(subtitlesContainer, leftPct, topPct);
    this.tokenTooltip?.update();
    // Recompute the key: the writes above may have bumped `styleEpoch`.
    this.lastPositionApplyKey = this.buildPositionApplyKey(layout);
  }

  private measureContainerBox(subtitlesContainer: HTMLElement): {
    w: number;
    h: number;
  } {
    const key = `${this.contentEpoch}|${this.styleEpoch}`;
    const cached = this.elementMetricsCache;
    if (cached && cached.key === key) return { w: cached.w, h: cached.h };
    const w = subtitlesContainer.offsetWidth;
    const h = subtitlesContainer.offsetHeight;
    this.elementMetricsCache = { key, w, h };
    return { w, h };
  }

  private applyScaleCompensation(
    subtitlesContainer: HTMLElement,
    layout: LayoutMetrics,
  ): void {
    const visualScale = Math.min(layout.scaleX || 1, layout.scaleY || 1);
    const compensate =
      visualScale > 0 && visualScale < 0.999 ? Math.min(1 / visualScale, 3) : 1;
    const nextValue =
      Math.abs(compensate - 1) < 0.001 ? null : compensate.toFixed(3);
    if (nextValue === this.lastScaleCompensation) return;
    this.lastScaleCompensation = nextValue;
    if (nextValue === null) {
      subtitlesContainer.style.removeProperty(
        "--vot-subtitles-scale-compensation",
      );
    } else {
      subtitlesContainer.style.setProperty(
        "--vot-subtitles-scale-compensation",
        nextValue,
      );
    }
    this.invalidateStyleCaches();
  }

  private syncAnchorDimensions(
    subtitlesContainer: HTMLElement,
    anchorBox: LayoutMetrics,
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
    layout: LayoutMetrics,
    elementWidth: number,
    elementHeight: number,
    bottomInset: number,
  ): { anchorX: number; anchorY: number } {
    let anchorX = (this.position.left / 100) * layout.w;
    let anchorY = (this.position.top / 100) * layout.h;
    if (this.positionPreset === "custom") {
      anchorY = resolveCustomVerticalAnchor({
        state: this.customVerticalAnchorState,
        elementHeight,
        boxHeight: layout.h,
        bottomInset,
      });
      return { anchorX, anchorY };
    }

    const presetPosition = this.resolvePresetAnchorPosition({
      preset: this.positionPreset,
      anchorBox: layout,
      elementWidth,
      elementHeight,
      bottomInset,
    });
    anchorX = presetPosition.anchorX;
    anchorY = presetPosition.anchorY;
    if (layout.w > 0) {
      this.position.left = (anchorX / layout.w) * 100;
    }
    if (layout.h > 0) {
      this.position.top = (anchorY / layout.h) * 100;
    }
    return { anchorX, anchorY };
  }

  private clampContainerPosition(
    layout: LayoutMetrics,
    anchorX: number,
    anchorY: number,
    elementWidth: number,
    elementHeight: number,
    bottomInset: number,
  ): { anchorX: number; anchorY: number } {
    let leftPx = anchorX - elementWidth / 2;
    let topPx = anchorY - elementHeight;
    const maxLeftPx = layout.w - elementWidth;
    const maxTopPx = layout.h - bottomInset - elementHeight;
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
    anchorBox: LayoutMetrics;
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
    this.updateContainerRect();
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
    const cacheKey = `${this.contentEpoch}|${this.styleEpoch}|${this.fontSizeOverridden ? this.fontSize : "auto"}|${this.fontFamily}`;
    const cached = this.tokenLayoutInputsCache;
    if (cached && cached.key === cacheKey) {
      ctx.font = cached.value.fontKey;
      return cached.value;
    }
    const value = this.readTokenLayoutInputs(ctx);
    this.tokenLayoutInputsCache = { key: cacheKey, value };
    return value;
  }

  private readTokenLayoutInputs(ctx: CanvasRenderingContext2D): {
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
    const length = segmentRanges.length;
    if (idx >= length) idx = 0;
    while (idx < length - 1 && time >= segmentRanges[idx].endMs) {
      idx += 1;
    }
    while (idx > 0 && time < segmentRanges[idx].startMs) {
      idx -= 1;
    }
    if (
      idx >= 0 &&
      time >= segmentRanges[idx].startMs &&
      time < segmentRanges[idx].endMs
    ) {
      this.lastSegmentIndex = idx;
      return idx;
    }
    const found = segmentRanges.findIndex(
      (s) => time >= s.startMs && time < s.endMs,
    );
    const resolved =
      found >= 0 ? found : time < segmentRanges[0].startMs ? 0 : length - 1;
    this.lastSegmentIndex = resolved;
    return resolved;
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
    return [context, current];
  }
  private findTokenSpan(
    candidate: EventTarget | null,
    root: HTMLElement,
  ): HTMLSpanElement | null {
    let element: Element | null = null;
    if (candidate instanceof Element) {
      element = candidate;
    } else if (candidate instanceof Text) {
      element = candidate.parentElement;
    }
    const token = element?.closest<HTMLSpanElement>('span[data-vot-token="1"]');
    return token instanceof HTMLSpanElement && root.contains(token)
      ? token
      : null;
  }
  private resolveTokenSpanFromEvent(
    event: MouseEvent | KeyboardEvent,
  ): HTMLSpanElement | null {
    const root: HTMLElement | null =
      this.subtitlesBlock ?? this.subtitlesContainer;
    if (!root) return null;
    const fromTarget = this.findTokenSpan(event.target, root);
    if (fromTarget) {
      return fromTarget;
    }
    const path =
      typeof event.composedPath === "function" ? event.composedPath() : [];
    for (const node of path) {
      const fromPath = this.findTokenSpan(node, root);
      if (fromPath) {
        return fromPath;
      }
    }
    if (!(event instanceof MouseEvent)) return null;
    return Number.isFinite(event.clientX) && Number.isFinite(event.clientY)
      ? this.findTokenSpan(
          document.elementFromPoint(event.clientX, event.clientY),
          root,
        )
      : null;
  }
  releaseTooltip(): this {
    this.tooltipTranslationRequestId += 1;
    this.tokenTooltipTarget?.classList.remove("selected");
    this.tokenTooltipTarget = undefined;
    this.tokenTooltip?.dispose();
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
  clearRenderedContent(releaseTooltip = false): void {
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
    if (this.subtitleView) {
      this.subtitleView.dispose();
      this.subtitleView = null;
    } else if (this.subtitlesContainer) {
      this.subtitlesContainer.textContent = "";
    }
  }
  onClick = async (event: MouseEvent | KeyboardEvent): Promise<void> => {
    if (performance.now() < this.suppressTokenClicksUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const target = this.resolveTokenSpanFromEvent(event);
    if (!target) {
      this.releaseTooltip();
      return;
    }
    if (this.toggleCurrentTooltipTarget(target)) {
      return;
    }
    this.releaseTooltip();
    const requestId = this.tooltipTranslationRequestId;
    const text = trimEdgePunctuation(target.textContent ?? "");
    if (!text) return;
    try {
      const service = await votStorage.get(
        "translationService",
        DEFAULT_TRANSLATION_SERVICE,
      );
      if (requestId !== this.tooltipTranslationRequestId) return;
      target.classList.add("selected");
      const tooltip = this.createTokenTooltip(target, {
        source: text,
        context: this.strTranslatedTokens || this.strTokens,
        translationService: service,
      });
      this.tokenTooltip = tooltip;
      this.tokenTooltipTarget = target;
      tooltip.show();
      const strTokens = this.strTokens;
      const translated = await this.translateStrTokens(text);
      if (this.shouldSkipTooltipUpdate(requestId, tooltip, target, strTokens)) {
        return;
      }
      this.strTranslatedTokens = translated[0];
      tooltip.setTranslation(translated[1], translated[0]);
    } catch (error) {
      if (requestId !== this.tooltipTranslationRequestId) return;
      console.error("[VOT] Failed to translate subtitle token:", error);
      if (this.tokenTooltip && this.tokenTooltipTarget === target) {
        this.tokenTooltip.setTranslation(
          localizationProvider.get("requestTranslationFailed"),
          this.strTranslatedTokens || this.strTokens,
        );
      } else {
        this.releaseTooltip();
      }
    }
  };
  private toggleCurrentTooltipTarget(target: HTMLElement): boolean {
    if (this.tokenTooltipTarget !== target || !this.tokenTooltip) {
      return false;
    }

    target.classList.toggle("selected", this.tokenTooltip.isOpen());
    return true;
  }
  private createTokenTooltip(
    target: HTMLElement,
    content: {
      source: string;
      context: string;
      translationService: string;
    },
  ): SubtitleTokenTooltipHandle {
    const viewportWidth = Math.max(320, globalThis.innerWidth || 0);
    const preferredWidth = Math.max(
      360,
      this.subtitlesContainer?.offsetWidth ?? 0,
      this.subtitlesBlock?.offsetWidth ?? 0,
      Math.min(this.subtitleMaxWidthPx || 0, 720),
    );
    const tooltipMaxWidth = Math.min(viewportWidth - 24, preferredWidth, 720);

    return mountSubtitleTokenTooltip({
      target,
      anchor: this.subtitlesBlock ?? target,
      parentElement: this.ensureTooltipMount().root,
      maxWidth: tooltipMaxWidth,
      source: content.source,
      context: content.context,
      translationService: content.translationService,
    });
  }
  private shouldSkipTooltipUpdate(
    requestId: number,
    tooltip: SubtitleTokenTooltipHandle,
    target: HTMLElement,
    strTokens: string,
  ): boolean {
    return (
      requestId !== this.tooltipTranslationRequestId ||
      strTokens !== this.strTokens ||
      this.tokenTooltip !== tooltip ||
      this.tokenTooltipTarget !== target ||
      !tooltip.isOpen()
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
  private updatePassedClasses(passedFlags: boolean[]): void {
    applyPassedState(
      this.highlightState,
      this.renderedHighlightEls,
      passedFlags,
    );
  }
  private clearPassedClasses(): void {
    clearPassedState(this.highlightState, this.renderedHighlightEls);
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
      this.subtitleLang ?? undefined,
    );
    const breaksChanged =
      next.breakAfterTokenIndices.length !==
        this.breakAfterTokenIndices.length ||
      next.breakAfterTokenIndices.some(
        (value, index) => value !== this.breakAfterTokenIndices[index],
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
    this.sourceEpoch += 1;
    this.strTokens = "";
    this.resetTranslationContext();
    this.resetRenderMemo();
    this.resetWrapMemo();
    this.resetSegmentationMemo();
    this.lastWrapTokens = null;
    this.passedStateKey = null;
    this.passedThresholds.length = 0;
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
    return tokens.map((token) => token.text).join("");
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
      this.clearRenderedContent(true);
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

    this.ensureSmartLayout(layout);
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
    // One persistent Solid root per container: created lazily, then fed a new
    // render plan. Solid updates only the parts whose text/attributes changed.
    this.subtitleView ??= mountSolidSubtitlesWidget(this.subtitlesContainer, {
      lang: () => this.subtitleLang ?? "",
      onClick: this.onClick,
    });
    this.subtitleView.setParts(
      buildSubtitleRenderPlan(
        tokens,
        tokens.length - 1,
        this.breakAfterTokenIndexSet,
      ),
    );

    this.subtitlesBlock = this.subtitleView.block();
    // Spans come from Solid refs, so the former
    // querySelectorAll("span[data-vot-highlight-index]") + Array.from pass on
    // every content render is gone.
    this.renderedHighlightEls = this.subtitleView.highlightEls();
    // Content changed: cached measurements and computed-style reads are stale.
    this.contentEpoch += 1;
    this.elementMetricsCache = null;
    this.smartCssMetricsCache = null;
    this.tokenLayoutInputsCache = null;
    this.lastPositionApplyKey = null;
    this.syncHighlightIndexCache();
  }

  private syncHighlightIndexCache(): void {
    syncHighlightState(this.highlightState, this.renderedHighlightEls);
  }
  update(): void {
    if (!this.video || !this.subtitles) return;
    const time = this.resolvePlaybackTimeMs();
    const subtitlesList = this.subtitles.subtitles;
    const activeLine = this.resolveActiveLine(time, subtitlesList);
    if (!activeLine) {
      this.clearInactiveLineState();
      this.recomputeWakeDeadline(time);
      return;
    }

    const activeLineKey = `${this.sourceEpoch}:${activeLine.lineKey}`;
    this.lastActiveLineKey = activeLineKey;
    this.refreshSmartLayoutIfNeeded();
    const renderState = this.getRenderState(
      activeLine.line,
      activeLineKey,
      time,
    );
    const { tokens, tokensChanged, passedFlags, renderKey } = renderState;
    if (renderKey === this.lastRenderKey) {
      if (this.highlightWords && !tokensChanged && passedFlags) {
        this.updatePassedClasses(passedFlags);
      }
      this.maybeRefreshPosition();
      this.recomputeWakeDeadline(time);
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
    this.recomputeWakeDeadline(time);
  }
  release(): void {
    this.cancelDragFrame();
    this.pendingDragPoint = null;
    this.dragLayoutCache = null;
    this.detachDragDocumentListeners();
    this.stopVideoFrameLoop();
    this.abortController.abort();
    this.resizeObserver?.disconnect();
    this.clearPendingSchedulerState();
    this.checkerUnsubscribe?.();
    this.checkerUnsubscribe = null;
    this.releaseTooltip();
    this.subtitleView?.dispose();
    this.subtitleView = null;
    this.subtitlesBlock = null;
    this.renderedHighlightEls = [];
    this.subtitleOverlayDispose?.();
    this.subtitleOverlayDispose = undefined;
    this.subtitleOverlayHost?.remove();
    this.subtitleOverlayHost = null;
    this.subtitlesContainer = null;
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
    this.resizeTarget = undefined;
    this.lastAppliedLeftPct = null;
    this.lastAppliedTopPct = null;
    this.passedStateKey = null;
    this.passedThresholds.length = 0;
    this.insetCacheReady = false;
  }
}
