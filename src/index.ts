import VOTClient, { VOTWorkerClient } from "@vot.js/ext/client";
import type { ServiceConf } from "@vot.js/ext/types/service";
import { getService } from "@vot.js/ext/utils/videoData";
import { availableTTS } from "@vot.js/shared/consts";
import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";
import Chaimu from "chaimu/client";
import { initAudioContext } from "chaimu/player";
import { initAudioDownloaderIframe } from "./audioDownloader/iframe";
import { getOrCreateBootState } from "./bootstrap/bootState";
import { ensureRuntimeActivated } from "./bootstrap/runtimeActivation";
import { bindObserverListeners } from "./bootstrap/videoObserverBinding";
import {
  minLongWaitingCount,
  proxyWorkerHost,
  votBackendUrl,
  workerHost,
} from "./config/config";
import { resolveBootstrapMode } from "./core/bootstrapPolicy";
import { CacheManager } from "./core/cacheManager";
import { findConnectedContainerBySelector } from "./core/containerResolution";
import { VOTTranslationHandler } from "./core/translationHandler";
import { TranslationOrchestrator } from "./core/translationOrchestrator";
import { VideoLifecycleController } from "./core/videoLifecycleController";
import { VOTVideoManager } from "./core/videoManager";
import { localizationProvider } from "./localization/localizationProvider";
import type { ProcessedSubtitles } from "./subtitles/processor";
import { SubtitlesWidget } from "./subtitles/widget";
import type { StorageData } from "./types/storage";
import type { OverlayMount } from "./types/uiManager";
import { UIManager } from "./ui/manager";
import { OverlayVisibilityController } from "./ui/overlayVisibilityController";
import debug from "./utils/debug";
import { resolveInteractiveMount } from "./utils/dom";
import { getEnvironmentInfo as getEnvironmentInfoImpl } from "./utils/environment";
import { GM_fetch } from "./utils/gm";
import { IFRAME_HASH, isIframe } from "./utils/iframeConnector";
import {
  createIntervalIdleChecker,
  type IntervalIdleChecker,
} from "./utils/intervalIdleChecker";
import { Notifier } from "./utils/notify";
import { translate } from "./utils/translateApis";
import {
  calculatedResLang,
  fnv1a32ToKeyPart,
  stableStringify,
} from "./utils/utils";
import { VideoObserver } from "./utils/VideoObserver";
import VOTLocalizedError from "./utils/VOTLocalizedError";
import {
  clampInt,
  clampPercentInt,
  snapVolume01,
  volume01ToPercent,
} from "./utils/volume";
import {
  getAutoHideDelay as getAutoHideDelayImpl,
  initExtraEvents as initExtraEventsImpl,
  isOverlayInteractiveNode as isOverlayInteractiveNodeImpl,
  rebindOverlayVisibilityTargets as rebindOverlayVisibilityTargetsImpl,
  releaseExtraEvents as releaseExtraEventsImpl,
} from "./videoHandler/modules/events";
// VideoHandler is large; keep the public API but move big feature areas into
// dedicated modules for cohesion.
import { init as initVideoHandler } from "./videoHandler/modules/init";
import {
  changeSubtitlesLang as changeSubtitlesLangImpl,
  enableSubtitlesForCurrentLangPair as enableSubtitlesForCurrentLangPairImpl,
  loadSubtitles as loadSubtitlesImpl,
  toggleSubtitlesForCurrentLangPair as toggleSubtitlesForCurrentLangPairImpl,
  updateSubtitlesLangSelect as updateSubtitlesLangSelectImpl,
} from "./videoHandler/modules/subtitles";
import {
  handleProxySettingsChanged as handleProxySettingsChangedImpl,
  isMultiMethodS3 as isMultiMethodS3Impl,
  isYouTubeHosts as isYouTubeHostsImpl,
  proxifyAudio as proxifyAudioImpl,
  refreshTranslationAudio as refreshTranslationAudioImpl,
  scheduleTranslationRefresh as scheduleTranslationRefreshImpl,
  setupAudioSettings as setupAudioSettingsImpl,
  stopSmartVolumeDucking as stopSmartVolumeDuckingImpl,
  translateFunc as translateFuncImpl,
  unproxifyAudio as unproxifyAudioImpl,
  updateTranslation as updateTranslationImpl,
  validateAudioUrl as validateAudioUrlImpl,
} from "./videoHandler/modules/translation";

import type { VideoData } from "./videoHandler/shared";

// VideoData and countryCode are shared across the runtime (UI/settings + handler logic)
// and are re-exported from src/videoHandler/shared.ts.
export { getEnvironmentInfo } from "./utils/environment";
export type { VideoData } from "./videoHandler/shared";
export { countryCode } from "./videoHandler/shared";

const RESPONSE_LANG_SET = new Set<string>(availableTTS as readonly string[]);
const isResponseLang = (value: string): value is ResponseLang =>
  RESPONSE_LANG_SET.has(value);

/*─────────────────────────────────────────────────────────────*/
/*                        Main class: VideoHandler             */
/*  Composes the helper classes and retains full functionality.  */
/*─────────────────────────────────────────────────────────────*/

export class VideoHandler {
  video!: HTMLVideoElement;
  container!: HTMLElement;
  site!: ServiceConf;

  // Public API / core state
  translateFromLang: RequestLang = "auto";
  translateToLang: ResponseLang = calculatedResLang;

  data?: Partial<StorageData>;
  videoData?: VideoData;

  firstPlay = true;
  audioContext?: AudioContext;

  votClient!: VOTClient | VOTWorkerClient;
  audioPlayer!: Chaimu;

  abortController!: AbortController;
  actionsAbortController!: AbortController;

  /** Increments whenever we reset/abort translation actions to invalidate stale async work */
  actionsGeneration = 0;

  notifier: Notifier = new Notifier();

  cacheManager!: CacheManager;
  /**
   * In-flight subtitles list requests, keyed by subtitles cache key.
   *
   * Prevents duplicate parallel requests when the subtitles hotkey is spammed
   * before the first request resolves.
   */
  subtitlesLoadPromises = new Map<string, Promise<any[]>>();
  downloadTranslationUrl: string | null = null;

  translationRefreshTimeout?: ReturnType<typeof setTimeout>;
  isRefreshingTranslation = false;

  autoRetry?: ReturnType<typeof setTimeout>;
  // streamPing?: ReturnType<typeof setInterval>;
  votOpts?: Record<string, unknown>;
  volumeOnStart?: number;

  /**
   * syncVolume (link translation and video volume) runtime state.
   * We keep last-known slider values to apply deltas reliably.
   */
  volumeLinkState = {
    initialized: false,
    lastVideoPercent: 0,
    lastTranslationPercent: 0,
  };

  /**
   * Used to ignore our own programmatic video-volume updates when observing
   * external UIs (e.g. YouTube volume panel aria mutations).
   */
  internalVideoVolumeSetAt = 0;
  internalVideoVolumeSetPercent: number | null = null;
  internalVideoVolumeSuppressionMs = 250;

  // Smart auto-volume ducking state. Used to lower the original video volume
  // only while the translated track has audible sound (not during silence).
  smartVolumeDuckingInterval?: number;
  smartVolumeDuckingTarget = 0.2;
  smartVolumeDuckingBaseline?: number;
  smartVolumeLastApplied?: number;

  // Internal smoothing state for Smart Auto-Volume ducking.
  smartVolumeLastTickAt = 0;
  smartVolumeLastSoundAt = 0;
  smartVolumeRmsMissingSinceAt: number | null = null;

  /** Smoothed translated-track RMS envelope (0..1). */
  smartVolumeRmsEnvelope = 0;

  /**
   * Internal speech gate state for Smart Auto-Volume ducking.
   *
   * This is a debounced/hysteresis-based boolean that tracks whether the
   * translated track is considered "audible" for the purpose of ducking.
   */
  smartVolumeSpeechGateOpen = false;
  smartVolumeIsDucked = false;
  longWaitingResCount = 0;
  hadAsyncWait = false;

  // Available subtitle tracks for the current video. The subtitles UI widget
  // maintains its own internal line/token representation.
  subtitles: any[] = [];
  subtitlesWidget?: SubtitlesWidget;

  activeTranslation: { key: string; promise: Promise<unknown> } | null = null;

  // Managers
  interactionChecker!: IntervalIdleChecker;
  uiManager!: UIManager;
  overlayVisibility!: OverlayVisibilityController;
  overlayVisibilityTargetsAbortController?: AbortController;
  translationOrchestrator!: TranslationOrchestrator;
  lifecycleController!: VideoLifecycleController;
  translationHandler!: VOTTranslationHandler;
  videoManager!: VOTVideoManager;

  // Subtitles received directly from API (Yandex) when available
  yandexSubtitles: ProcessedSubtitles | null = null;

  // Observers / listeners
  resizeObserver?: ResizeObserver;
  syncVolumeObserver?: MutationObserver;

  // Init guard
  initialized = false;

  /**
   * Cached overlay mount points (root/portal). Recomputed when container changes.
   * Avoids doing the same DOM/style walks multiple times per lifecycle update.
   */
  private mountCache?: {
    container: HTMLElement;
    base: HTMLElement;
    root: HTMLElement;
    portalContainer: HTMLElement;
  };

  /**
   * In-memory cache for translated error strings (RU -> UI language).
   * This avoids repeated translation API calls during retry loops when the
   * same backend message is emitted multiple times.
   */
  private readonly errorTranslationCache = new Map<string, string>();

  private getOverlayMountPoints(container: HTMLElement = this.container): {
    root: HTMLElement;
    portalContainer: HTMLElement;
  } {
    const base =
      this.site.host === "youtube" && this.site.additionalData !== "mobile"
        ? (container.parentElement ?? container)
        : container;

    const cache = this.mountCache;
    if (
      cache?.container === container &&
      cache.base === base &&
      (cache.root.isConnected ?? document.documentElement.contains(cache.root))
    ) {
      return { root: cache.root, portalContainer: cache.portalContainer };
    }

    const root = resolveInteractiveMount(base);
    const portalContainer = root;

    this.mountCache = { container, base, root, portalContainer };
    return { root, portalContainer };
  }

  private getOverlayMount(
    container: HTMLElement = this.container,
  ): OverlayMount {
    const { root, portalContainer } = this.getOverlayMountPoints(container);
    return {
      root,
      portalContainer,
      tooltipLayoutRoot: this.tooltipLayoutRoot,
    };
  }

  /**
   * Builds a stable cache key for translations.
   *
   * NOTE: Keep this in sync with CacheManager expectations.
   * @param {string} videoId
   * @param {string} from
   * @param {string} to
   */
  getTranslationCacheKey(
    videoId: string,
    from: string,
    to: string,
    translationHelp?: unknown,
  ): string {
    const requestLangForApi = this.getRequestLangForTranslation(
      from as RequestLang,
      to as ResponseLang,
    );
    const useLivelyVoice =
      this.isLivelyVoiceAllowed(requestLangForApi, to as ResponseLang) &&
      this.data?.useLivelyVoice;
    // `translationHelp` can change the output, so include it in the cache key.
    // Keep this compact by hashing a stable JSON representation.
    const helpStr =
      translationHelp === undefined || translationHelp === null
        ? ""
        : stableStringify(translationHelp);
    const helpHash = helpStr ? fnv1a32ToKeyPart(helpStr) : "0";
    return `${videoId}_${requestLangForApi}_${to}_${useLivelyVoice}_${helpHash}`;
  }

  /**
   * Builds a stable cache key for subtitles.
   *
   * Bugfix: subtitles cache key must match the key used by loadSubtitles().
   * @param {string} videoId
   * @param {string} detectedLanguage
   * @param {string} responseLanguage
   */
  getSubtitlesCacheKey(
    videoId: string,
    detectedLanguage: string,
    responseLanguage: string,
  ): string {
    return `${videoId}_${detectedLanguage}_${responseLanguage}_${Boolean(this.data?.useLivelyVoice)}`;
  }

  isActionStale(actionContext?: { gen: number; videoId: string }): boolean {
    if (!actionContext) return false;
    return (
      this.actionsGeneration !== actionContext.gen ||
      this.videoData?.videoId !== actionContext.videoId
    );
  }

  resetActionsAbortController(reason?: any): void {
    try {
      this.actionsAbortController?.abort(reason);
    } catch {
      // ignore
    }
    this.actionsAbortController = new AbortController();
    this.actionsGeneration++;
    // VOT client embeds the signal in its fetch options, so refresh it.
    if (this.data) {
      this.initVOTClient();
    }
  }

  /**
   * Constructs a new VideoHandler instance.
   * @param {HTMLVideoElement} video The video element to handle.
   * @param {HTMLElement} container The container element for the video.
   * @param {Object} site The site object associated with the video.
   */
  constructor(
    video: HTMLVideoElement,
    container: HTMLElement,
    site: ServiceConf,
  ) {
    debug.log(
      "[VideoHandler] add video:",
      video,
      "container:",
      container,
      this,
    );
    this.video = video;
    this.container = container;
    this.site = site;
    this.abortController = new AbortController();
    this.actionsAbortController = new AbortController();
    this.cacheManager = new CacheManager();
    this.interactionChecker = createIntervalIdleChecker();
    this.interactionChecker.start();
    const self = () => this;
    // Create helper instances
    const mount = this.getOverlayMount(container);
    this.uiManager = new UIManager({
      mount,
      data: this.data,
      videoHandler: this,
      intervalIdleChecker: this.interactionChecker,
    });
    this.overlayVisibility = new OverlayVisibilityController({
      checker: this.interactionChecker,
      getOverlayView: () => this.uiManager.votOverlayView ?? null,
      getAutoHideDelay: () => this.getAutoHideDelay(),
      isInteractiveNode: (node: Node) => this.isOverlayInteractiveNode(node),
    });
    this.translationOrchestrator = new TranslationOrchestrator({
      isFirstPlay: () => this.firstPlay,
      setFirstPlay: (next: boolean) => {
        this.firstPlay = next;
      },
      isAutoTranslateEnabled: () => Boolean(this.data?.autoTranslate),
      getVideoId: () => this.videoData?.videoId,
      scheduleAutoTranslate: () => this.runAutoTranslate(),
      isMobileYouTubeMuted: () =>
        this.site.host === "youtube" &&
        this.site.additionalData === "mobile" &&
        this.video.muted,
      setMuteWatcher: (callback: () => void) => {
        // Mobile YouTube typically starts autoplay muted. We defer auto-translate
        // until the user unmutes. `volumechange` fires when `muted` or `volume`
        // changes on HTMLMediaElement.
        let done = false;
        const fireOnce = () => {
          if (done) return;
          done = true;
          this.video.removeEventListener("volumechange", onVolumeChange);
          callback();
        };

        const onVolumeChange = () => {
          if (!this.video.muted) {
            fireOnce();
          }
        };

        this.video.addEventListener("volumechange", onVolumeChange, {
          signal: this.abortController.signal,
        });

        // Handle a potential race where the video becomes unmuted before the
        // listener is attached.
        queueMicrotask(() => {
          if (!this.video.muted) {
            fireOnce();
          }
        });
      },
    });
    const lifecycleHost = {
      get video() {
        return self().video;
      },
      get site() {
        return self().site;
      },
      get container() {
        return self().container;
      },
      set container(value: HTMLElement) {
        self().container = value;
        self().uiManager.updateMount(self().getOverlayMount(value));
      },
      get firstPlay() {
        return self().firstPlay;
      },
      set firstPlay(value: boolean) {
        self().firstPlay = value;
      },
      stopTranslation: () => this.stopTranslation(),
      get uiManager() {
        return self().uiManager as any;
      },
      getVideoData: () => this.getVideoData(),
      cacheManager: {
        getSubtitles: (key: string) =>
          self().cacheManager.getSubtitles(key) ?? [],
      },
      getSubtitlesCacheKey: (
        videoId: string,
        detectedLanguage: string,
        responseLanguage: string,
      ) =>
        this.getSubtitlesCacheKey(videoId, detectedLanguage, responseLanguage),
      updateSubtitlesLangSelect: () => this.updateSubtitlesLangSelect(),
      enableSubtitlesForCurrentLangPair: () =>
        this.enableSubtitlesForCurrentLangPair(),
      setSelectMenuValues: (from: string, to: string) =>
        this.setSelectMenuValues(from, to),
      get translateToLang() {
        return self().translateToLang;
      },
      set translateToLang(value: string) {
        if (isResponseLang(value)) self().translateToLang = value;
      },
      get data() {
        return self().data ?? {};
      },
      get subtitles() {
        return self().subtitles;
      },
      set subtitles(value: any[]) {
        self().subtitles = value;
      },
      get videoData() {
        return self().videoData;
      },
      set videoData(value: any) {
        self().videoData = value;
      },
      get actionsAbortController() {
        return self().actionsAbortController;
      },
      set actionsAbortController(value: AbortController) {
        self().actionsAbortController = value;
      },
      resetActionsAbortController: (reason?: unknown) =>
        this.resetActionsAbortController(reason),
      initVOTClient: () => this.initVOTClient(),
      translationOrchestrator: this.translationOrchestrator,
      resetSubtitlesWidget: () => this.resetSubtitlesWidget(),
      queueOverlayAutoHide: () => this.overlayVisibility?.queueAutoHide(),
    };
    this.lifecycleController = new VideoLifecycleController(lifecycleHost);
    this.translationHandler = new VOTTranslationHandler(this);
    this.videoManager = new VOTVideoManager(this);
  }

  /**
   * Lazily creates the subtitles widget.
   * @returns {SubtitlesWidget}
   */
  getSubtitlesWidget() {
    if (!this.subtitlesWidget) {
      const overlayPortal = this.uiManager.votOverlayView?.votOverlayPortal;
      if (!overlayPortal) {
        throw new Error(
          "VOT UI is not initialized yet (missing overlay portal)",
        );
      }

      this.subtitlesWidget = new SubtitlesWidget(
        this.video,
        this.portalContainer,
        overlayPortal,
        this.interactionChecker,
        this.tooltipLayoutRoot,
      );

      if (this.data) {
        // Smart layout is enabled by default for new users.
        // When enabled, the widget will compute font-size / line length based on player size.
        this.subtitlesWidget.setSmartLayout(
          typeof this.data.subtitlesSmartLayout === "boolean"
            ? this.data.subtitlesSmartLayout
            : true,
        );
        if (typeof this.data.subtitlesMaxLength === "number") {
          this.subtitlesWidget.setMaxLength(this.data.subtitlesMaxLength);
        }
        if (typeof this.data.highlightWords === "boolean") {
          this.subtitlesWidget.setHighlightWords(this.data.highlightWords);
        }
        if (typeof this.data.subtitlesFontSize === "number") {
          this.subtitlesWidget.setFontSize(this.data.subtitlesFontSize);
        }
        if (typeof this.data.subtitlesOpacity === "number") {
          this.subtitlesWidget.setOpacity(this.data.subtitlesOpacity);
        }
      }
    }
    return this.subtitlesWidget;
  }

  /**
   * Determines whether subtitles widget is initialized\.
   * @returns {boolean}
   */
  hasSubtitlesWidget() {
    return Boolean(this.subtitlesWidget);
  }

  resetSubtitlesWidget() {
    if (this.hasSubtitlesWidget()) {
      this.subtitlesWidget?.release();
      this.subtitlesWidget = undefined;
    }
  }

  /**
   * Root element for overlay UI (buttons/menu) so it remains clickable on players
   * that disable pointer events on inner layers.
   */
  get uiRoot(): HTMLElement {
    return this.getOverlayMountPoints().root;
  }

  /**
   * Determines the DOM container used for overlay portals.
   * @returns {HTMLElement}
   */
  get portalContainer() {
    return this.getOverlayMountPoints().portalContainer;
  }

  /**
   * Determines the root element used for tooltip layout calculations.
   * @returns {HTMLElement | undefined}
   */
  get tooltipLayoutRoot() {
    switch (this.site.host) {
      case "kickstarter": {
        return document.getElementById("react-project-header") ?? undefined;
      }
      case "custom": {
        return undefined;
      }
      default: {
        return this.container;
      }
    }
  }

  /**
   * Returns the container element for event listeners.
   * @returns {HTMLElement} The event container.
   */
  getEventContainer() {
    if (!this.site.eventSelector) return this.container;
    return (
      (document.querySelector(this.site.eventSelector) as HTMLElement | null) ??
      this.container
    );
  }

  /**
   * Run auto translate using orchestrator dependencies.
   */
  async runAutoTranslate() {
    try {
      this.videoManager.videoValidator();
      await this.uiManager.handleTranslationBtnClick();
    } catch (err) {
      console.error("[VOT]", err);
      throw err;
    }
  }

  /**
   * Lazily initializes and returns the AudioContext.
   * @returns {AudioContext | undefined}
   */
  getAudioContext() {
    if (this.audioContext) return this.audioContext;
    if (!this.isAudioContextSupported) return undefined;
    try {
      this.audioContext = initAudioContext();
      return this.audioContext;
    } catch (err) {
      // Some environments expose AudioContext but still fail to initialize.
      console.warn("[VOT] Failed to init AudioContext, falling back:", err);
      return undefined;
    }
  }

  get isAudioContextSupported() {
    return (
      globalThis.AudioContext !== undefined ||
      (globalThis as any).webkitAudioContext !== undefined
    );
  }

  /**
   * Determines if audio should be preferred.
   * @returns {boolean} True if audio is preferred.
   */
  getPreferAudio() {
    // If we cannot reliably use AudioContext, prefer the legacy path.
    if (!this.getAudioContext()) return true;
    if (!this.data) return true;
    if (!this.data.newAudioPlayer) return true;
    if (this.videoData?.isStream) return true; // Prefer old player path for streams.
    if (this.data.newAudioPlayer && !this.data.onlyBypassMediaCSP) return false;
    return !this.site.needBypassCSP;
  }

  /**
   * Creates the audio player.
   * @returns {VideoHandler} The VideoHandler instance.
   */
  createPlayer() {
    const preferAudio = this.getPreferAudio();
    debug.log("preferAudio:", preferAudio);
    this.audioPlayer = new Chaimu({
      video: this.video,
      // DEBUG_MODE is injected at build-time.
      debug: Boolean(DEBUG_MODE),
      fetchFn: GM_fetch,
      fetchOpts: {
        timeout: 0,
      },
      preferAudio,
    });
    return this;
  }

  /**
   * Returns true if a detected external volume update is very likely caused by
   * our own recent programmatic setVideoVolume call.
   */
  isLikelyInternalVideoVolumeChange(observedPercent: number) {
    if (this.internalVideoVolumeSetPercent === null) return false;

    const ageMs = Date.now() - this.internalVideoVolumeSetAt;
    if (ageMs > this.internalVideoVolumeSuppressionMs) return false;

    // Allow a 1% tolerance to account for hosts that quantize volume.
    return Math.abs(observedPercent - this.internalVideoVolumeSetPercent) <= 1;
  }

  private callModule<TArgs extends unknown[], TResult>(
    impl: (this: VideoHandler, ...args: TArgs) => TResult,
    ...args: TArgs
  ): TResult {
    return impl.call(this, ...args);
  }

  private async callModuleAsync<TArgs extends unknown[], TResult>(
    impl: (this: VideoHandler, ...args: TArgs) => Promise<TResult>,
    ...args: TArgs
  ): Promise<TResult> {
    return await impl.call(this, ...args);
  }

  /**
   * Initializes the VideoHandler: loads settings, UI, video data, events, etc.
   * @returns {Promise<void>}
   */
  async init() {
    return await initVideoHandler.call(this);
  }

  /**
   * Initializes the VOT client.
   * @returns {VideoHandler} This instance.
   */
  initVOTClient() {
    this.votOpts = {
      fetchFn: GM_fetch,
      fetchOpts: {
        signal: this.actionsAbortController.signal,
      },
      apiToken: this.data?.account?.token,
      hostVOT: votBackendUrl,
      host: this.data?.translateProxyEnabled
        ? (this.data?.proxyWorkerHost ?? proxyWorkerHost)
        : workerHost,
    };
    this.votClient = new (
      this.data?.translateProxyEnabled ? VOTWorkerClient : VOTClient
    )(this.votOpts);
    return this;
  }

  /**
   * Sets the translation button state and text.
   * @param {string} status The new status.
   * @param {string} text The text to display.
   * @returns {VideoHandler} This instance.
   */
  transformBtn(
    status: "none" | "loading" | "success" | "error",
    text: string,
  ): this {
    this.uiManager.transformBtn(status, text);
    return this;
  }

  /**
   * @returns {boolean} True if the extension audio player has active audio source
   */
  hasActiveSource() {
    return !!this.audioPlayer?.player?.src;
  }

  /**
   * Initializes extra event listeners (resize, click outside, keydown, etc.).
   */
  initExtraEvents() {
    return this.callModule(initExtraEventsImpl);
  }

  /**
   * Re-attach overlayVisibility listeners to the *current* overlay button/menu elements.
   *
   * The overlay UI gets recreated in some flows (e.g. menu language change),
   * so listeners that were attached to the old DOM nodes must be re-bound.
   */
  rebindOverlayVisibilityTargets = rebindOverlayVisibilityTargetsImpl;

  /**
   * Called when the video can play.
   */
  setCanPlay() {
    return this.lifecycleController.setCanPlay();
  }

  isOverlayInteractiveNode(node: unknown): boolean {
    return this.callModule(isOverlayInteractiveNodeImpl, node);
  }

  /**
   * Schedules hiding the overlay button with guard checks for internal navigation.
   */
  getAutoHideDelay(): number {
    return this.callModule(getAutoHideDelayImpl);
  }

  /**
   * Changes subtitles language based on user selection.
   * @param {string} subs The subtitles selection value.
   */
  changeSubtitlesLang: (subs: string) => Promise<this> =
    changeSubtitlesLangImpl as unknown as (subs: string) => Promise<this>;

  /**
   * Updates the subtitles selection options.
   */
  updateSubtitlesLangSelect = updateSubtitlesLangSelectImpl;

  /**
   * Loads subtitles for the current video.
   */
  loadSubtitles = loadSubtitlesImpl;

  /**
   * Enables subtitles that match the currently selected language pair (from -> to).
   *
   * Used by the subtitles hotkey: prefers Yandex captions for the exact pair,
   * then falls back to any captions in the target language.
   */
  async enableSubtitlesForCurrentLangPair() {
    return await this.callModuleAsync(enableSubtitlesForCurrentLangPairImpl);
  }

  /**
   * Toggles subtitles for the current video.
   *
   * - If subtitles are enabled, this disables them.
   * - If subtitles are disabled, this enables the best subtitles track for the
   *   current language pair.
   */
  async toggleSubtitlesForCurrentLangPair() {
    return await this.callModuleAsync(toggleSubtitlesForCurrentLangPairImpl);
  }

  getRequestLangForTranslation(
    requestLang: RequestLang,
    responseLang: ResponseLang,
  ): RequestLang {
    if (
      this.data?.useLivelyVoice &&
      this.data?.account?.token &&
      responseLang === "ru"
    ) {
      // Keep menu selection intact, but force English in API requests
      // when lively voices are enabled.
      return "en";
    }
    return requestLang;
  }

  isLivelyVoiceAllowed(
    requestLang: RequestLang = this.videoData?.detectedLanguage ?? "auto",
    responseLang: ResponseLang = this.videoData?.responseLanguage ??
      this.translateToLang,
  ) {
    const requestLangForApi = this.getRequestLangForTranslation(
      requestLang,
      responseLang,
    );
    // allowed only en -> ru pair
    if (requestLangForApi !== "en" || responseLang !== "ru") {
      return false;
    }

    // allowed only with auth
    if (!this.data?.account?.token) {
      return false;
    }

    return true;
  }

  /**
   * Gets the video volume.
   * @returns {number} The video volume (0.0 - 1.0).
   */
  getVideoVolume() {
    return this.videoManager.getVideoVolume();
  }

  /**
   * Sets the video volume.
   * @param {number} volume A number between 0 and 1.
   * @returns {VideoHandler} This instance.
   */
  setVideoVolume(volume: number): this {
    const snapped = snapVolume01(volume);

    // Remember this programmatic update so external observers (e.g. YouTube aria
    // mutations) won't treat it as a user-driven volume change and resync volumes
    // again (which would cause drift/loops).
    this.internalVideoVolumeSetAt = Date.now();
    this.internalVideoVolumeSetPercent = volume01ToPercent(snapped);

    this.videoManager.setVideoVolume(snapped);
    return this;
  }

  /**
   * Keeps internal syncVolume state aligned with observed/programmatic video-volume changes.
   */
  onVideoVolumeSliderSynced(volumePercent: number) {
    const normalized = clampPercentInt(volumePercent);

    // If syncVolume isn't initialized yet, keep the state aligned so the first
    // delta computation won't jump.
    if (!this.volumeLinkState.initialized) {
      this.volumeLinkState.lastVideoPercent = normalized;
      return;
    }

    // When syncVolume is active during translation, ONLY update the delta baseline
    // for internal (programmatic) updates. External updates should be handled by
    // syncVolumeWrapper("video", ...) so that the delta is preserved.
    if (
      this.data?.syncVolume &&
      this.hasActiveSource() &&
      !this.isLikelyInternalVideoVolumeChange(normalized)
    ) {
      return;
    }

    this.volumeLinkState.lastVideoPercent = normalized;
  }

  /**
   * Checks if the video is muted.
   * @returns {boolean} True if muted.
   */
  isMuted() {
    return this.videoManager.isMuted();
  }

  /**
   * Syncs the video volume slider.
   */
  syncVideoVolumeSlider() {
    this.videoManager.syncVideoVolumeSlider();
  }

  /**
   * Sets language select menu values.
   * @param {string} from Source language.
   * @param {string} to Target language.
   */
  setSelectMenuValues(from: string, to: string): void {
    this.videoManager.setSelectMenuValues(
      from as RequestLang,
      to as ResponseLang,
    );
  }

  /**
   * Keeps translation and video sliders linked (syncVolume option).
   *
   * The implementation is delta-based: when the user changes one slider, the
   * other slider moves by the same delta. This preserves the relative
   * difference between volumes and works with "audio booster" (translation can
   * exceed 100%).
   */
  syncVolumeWrapper(
    fromType: "translation" | "video",
    newVolume: number,
  ): void {
    const overlayView = this.uiManager.votOverlayView;
    if (!overlayView?.isInitialized()) {
      return;
    }

    const videoSlider = overlayView.videoVolumeSlider;
    const translationSlider = overlayView.translationVolumeSlider;

    if (!videoSlider || !translationSlider) {
      return;
    }

    // Initialize state once from current slider values.
    if (!this.volumeLinkState.initialized) {
      this.volumeLinkState.lastVideoPercent = Number(videoSlider.value);
      this.volumeLinkState.lastTranslationPercent = Number(
        translationSlider.value,
      );
      this.volumeLinkState.initialized = true;
    }

    if (fromType === "video") {
      const prevVideo = this.volumeLinkState.lastVideoPercent;
      const delta = newVolume - prevVideo;

      // Always update the initiator snapshot, even if delta is 0 / invalid.
      this.volumeLinkState.lastVideoPercent = newVolume;

      if (!Number.isFinite(delta) || delta === 0) {
        return;
      }

      const currentTranslation = Number(translationSlider.value);
      const nextTranslation = clampInt(
        currentTranslation + delta,
        translationSlider.min,
        translationSlider.max,
      );

      translationSlider.value = nextTranslation;
      this.volumeLinkState.lastTranslationPercent = nextTranslation;

      if (this.audioPlayer?.player) {
        this.audioPlayer.player.volume = nextTranslation / 100;
      }

      return;
    }

    // fromType === "translation"
    const prevTranslation = this.volumeLinkState.lastTranslationPercent;
    const delta = newVolume - prevTranslation;

    this.volumeLinkState.lastTranslationPercent = newVolume;

    if (!Number.isFinite(delta) || delta === 0) {
      return;
    }

    const currentVideo = Number(videoSlider.value);
    const nextVideo = clampPercentInt(currentVideo + delta);

    videoSlider.value = nextVideo;
    this.volumeLinkState.lastVideoPercent = nextVideo;

    this.setVideoVolume(nextVideo / 100);
  }

  /**
   * Retrieves video data.
   * @returns {Promise<Object>} The video data object.
   */
  async getVideoData() {
    return await this.videoManager.getVideoData();
  }

  /**
   * Validates the video.
   * @returns {boolean} True if valid.
   */
  videoValidator() {
    return this.videoManager.videoValidator();
  }

  /**
   * Stops translation and resets UI elements.
   */
  stopTranslate() {
    if (this.audioPlayer?.player) {
      try {
        this.audioPlayer.player.removeVideoEvents();
        this.audioPlayer.player.clear();
        this.audioPlayer.player.src = "";
      } catch (err) {
        debug.log("[stopTranslate] audioPlayer cleanup error", err);
      }
      debug.log("audioPlayer after stopTranslate", this.audioPlayer);
    }
    this.activeTranslation = null;
    const overlayView = this.uiManager.votOverlayView;
    if (overlayView) {
      if (overlayView.videoVolumeSlider) {
        overlayView.videoVolumeSlider.hidden = true;
      }
      if (overlayView.translationVolumeSlider) {
        overlayView.translationVolumeSlider.hidden = true;
      }
      if (overlayView.downloadTranslationButton) {
        overlayView.downloadTranslationButton.hidden = true;
      }
    }
    this.downloadTranslationUrl = null;
    this.longWaitingResCount = 0;
    this.hadAsyncWait = false;
    this.transformBtn("none", localizationProvider.get("translateVideo"));
    debug.log(`Volume on start: ${this.volumeOnStart}`);

    // Restore the original video volume. If the user adjusted volume while
    // ducking was enabled, prefer the latest baseline volume.
    const restoreVolume =
      typeof this.smartVolumeDuckingBaseline === "number"
        ? this.smartVolumeDuckingBaseline
        : this.volumeOnStart;

    stopSmartVolumeDuckingImpl(this, { restoreVolume });
    this.volumeOnStart = undefined;
    if (this.autoRetry !== undefined) {
      clearTimeout(this.autoRetry);
      this.autoRetry = undefined;
    }
    if (this.translationRefreshTimeout !== undefined) {
      clearTimeout(this.translationRefreshTimeout);
      this.translationRefreshTimeout = undefined;
    }
    // Cancel in-flight translation work.
    this.resetActionsAbortController("stopTranslate");
  }

  /**
   * Updates the translation error message on the UI.
   * @param {string|Error} errorMessage The error message.
   */
  async updateTranslationErrorMsg(
    errorMessage: any,
    signal?: AbortSignal,
  ): Promise<void> {
    if (signal?.aborted) {
      return;
    }
    const translationTake = localizationProvider.get("translationTake");
    const lang = localizationProvider.lang;
    this.longWaitingResCount =
      errorMessage === localizationProvider.get("translationTakeAboutMinute")
        ? this.longWaitingResCount + 1
        : 0;
    debug.log("longWaitingResCount", this.longWaitingResCount);
    if (this.longWaitingResCount > minLongWaitingCount) {
      errorMessage = new VOTLocalizedError("TranslationDelayed");
    }
    debug.log("updateTranslationErrorMsg message", errorMessage);
    if (errorMessage?.name === "VOTLocalizedError") {
      this.transformBtn("error", errorMessage.localizedMessage);
    } else if (errorMessage instanceof Error) {
      this.transformBtn("error", errorMessage?.message);
    } else if (
      this.data?.translateAPIErrors &&
      lang !== "ru" &&
      !errorMessage?.includes(translationTake)
    ) {
      const overlayView = this.uiManager.votOverlayView;
      if (!overlayView?.votButton) {
        return;
      }
      const messageStr = Array.isArray(errorMessage)
        ? errorMessage.join(" ")
        : String(errorMessage);
      const cacheKey = `${lang}:${messageStr}`;
      const cached = this.errorTranslationCache.get(cacheKey);
      if (cached) {
        this.transformBtn("error", cached);
      } else {
        overlayView.votButton.loading = true;
        const translatedMessage = await translate(messageStr, "ru", lang);
        const translatedText = Array.isArray(translatedMessage)
          ? translatedMessage.join("\n")
          : String(translatedMessage);
        if (signal?.aborted) {
          return;
        }
        this.errorTranslationCache.set(cacheKey, translatedText);
        // Prevent unbounded growth.
        if (this.errorTranslationCache.size > 50) {
          const oldestKey = this.errorTranslationCache.keys().next().value;
          if (oldestKey) this.errorTranslationCache.delete(oldestKey);
        }
        this.transformBtn("error", translatedText);
      }
      if (signal?.aborted) {
        return;
      }
    } else {
      const msg = Array.isArray(errorMessage)
        ? errorMessage.join("\n")
        : String(errorMessage ?? "");
      this.transformBtn("error", msg);
    }
    if (signal?.aborted) {
      return;
    }
    if (
      [
        "Подготавливаем перевод",
        "Видео передано в обработку",
        "Ожидаем перевод видео",
        "Загружаем переведенное аудио",
      ].includes(errorMessage)
    ) {
      if (this.uiManager.votOverlayView?.votButton) {
        this.uiManager.votOverlayView.votButton.loading = true;
      }
    }
  }

  /**
   * Called after translation is updated.
   * @param {string} audioUrl The URL of the translation audio.
   */
  afterUpdateTranslation(audioUrl) {
    const overlayView = this.uiManager.votOverlayView;
    if (!overlayView?.votButton) {
      return;
    }
    const isSuccess =
      overlayView.votButton.container.dataset.status === "success";
    if (overlayView.videoVolumeSlider) {
      overlayView.videoVolumeSlider.hidden =
        !this.data?.showVideoSlider || !isSuccess;
    }
    if (overlayView.translationVolumeSlider) {
      overlayView.translationVolumeSlider.hidden = !isSuccess;
    }

    // Re-initialize delta-based syncVolume state when translation becomes active.
    if (overlayView.videoVolumeSlider && overlayView.translationVolumeSlider) {
      this.volumeLinkState.lastVideoPercent = Number(
        overlayView.videoVolumeSlider.value,
      );
      this.volumeLinkState.lastTranslationPercent = Number(
        overlayView.translationVolumeSlider.value,
      );
      this.volumeLinkState.initialized = true;
    } else {
      this.volumeLinkState.initialized = false;
    }

    if (this.videoData && !this.videoData.isStream) {
      if (overlayView.downloadTranslationButton) {
        overlayView.downloadTranslationButton.hidden = false;
      }
      this.downloadTranslationUrl = audioUrl;
    }
    debug.log(
      "afterUpdateTranslation downloadTranslationUrl",
      this.downloadTranslationUrl,
    );
    if (this.data?.sendNotifyOnComplete && this.hadAsyncWait && isSuccess) {
      this.notifier.translationCompleted(globalThis.location.hostname);
      this.hadAsyncWait = false;
    }
  }

  /**
   * Validates the audio URL by sending a request.
   * @param {string} audioUrl The audio URL to validate.
   * @returns {Promise<string>} The valid audio URL.
   */
  async validateAudioUrl(
    audioUrl: string,
    actionContext?: { gen: number; videoId: string },
  ): Promise<string> {
    return await this.callModuleAsync(
      validateAudioUrlImpl,
      audioUrl,
      actionContext,
    );
  }

  scheduleTranslationRefresh(): void {
    this.callModule(scheduleTranslationRefreshImpl);
  }

  refreshTranslationAudio = refreshTranslationAudioImpl;

  /**
   * Proxifies the audio URL if needed.
   * @param {string} audioUrl The original audio URL.
   * @returns {string} The proxified audio URL.
   */
  proxifyAudio(audioUrl: string): string {
    return this.callModule(proxifyAudioImpl, audioUrl);
  }

  /**
   * Reverts a previously proxified audio URL back to the original Yandex S3 URL.
   *
   * This allows us to re-apply proxy settings when the proxy host/mode changes
   * without permanently "locking in" the old proxy host in the current player
   * src.
   */
  unproxifyAudio(audioUrl: string): string {
    return this.callModule(unproxifyAudioImpl, audioUrl);
  }

  /**
   * Called when proxy-related settings are changed at runtime.
   *
   * - Clears in-memory caches so old failures/URLs don't persist.
   * - Cancels any in-flight translation work.
   * - Best-effort refreshes the active audio source so the new proxy host/mode
   *   takes effect immediately.
   */
  handleProxySettingsChanged = handleProxySettingsChangedImpl;

  isMultiMethodS3(url: string): boolean {
    return this.callModule(isMultiMethodS3Impl, url);
  }

  /**
   * Updates the translation audio source.
   * @param {string} audioUrl The audio URL.
   */
  updateTranslation = updateTranslationImpl;

  /**
   * Translates the video/audio.
   * @param {string} VIDEO_ID The video ID.
   * @param {boolean} isStream Whether the video is a stream.
   * @param {string} requestLang Source language.
   * @param {string} responseLang Target language.
   * @param {any} translationHelp Optional translation helper data.
   */
  async translateFunc(
    VIDEO_ID: string,
    isStream: boolean,
    requestLang: string,
    responseLang: string,
    translationHelp?: any,
  ): Promise<void> {
    return await translateFuncImpl.call(
      this,
      VIDEO_ID,
      isStream,
      requestLang,
      responseLang,
      translationHelp,
    );
  }

  /**
   * used for enable audio downloader on this hosts
   */
  isYouTubeHosts() {
    return this.callModule(isYouTubeHostsImpl);
  }

  /**
   * Configures audio settings such as volume.
   */
  setupAudioSettings() {
    return this.callModule(setupAudioSettingsImpl);
  }

  /**
   * Stops translation and synchronizes volume.
   */
  stopTranslation = () => {
    this.translationOrchestrator?.reset();
    this.overlayVisibility?.cancel();
    this.stopTranslate();
    this.syncVideoVolumeSlider();
  };

  /**
   * Handles video source change events.
   */
  handleSrcChanged() {
    return this.lifecycleController.handleSrcChanged();
  }

  /**
   * Releases resources and removes event listeners.
   */
  async release() {
    debug.log("[VideoHandler] release");
    this.initialized = false;
    try {
      this.stopTranslation();
    } catch (err) {
      debug.log("[VideoHandler] stopTranslation failed during release", err);
    }
    this.lifecycleController?.teardown();
    this.abortController?.abort();
    this.abortController = new AbortController();
    this.overlayVisibility?.release();
    this.releaseExtraEvents();
    if (this.hasSubtitlesWidget()) {
      this.subtitlesWidget?.release();
      this.subtitlesWidget = undefined;
    }
    this.interactionChecker?.destroy();
    this.uiManager.release();
  }

  /**
   * Collects report information for bug reporting.
   * @returns {Object} Report info object.
   */
  collectReportInfo() {
    const info = getEnvironmentInfoImpl();
    const detectedLanguage = this.videoData?.detectedLanguage ?? "unknown";
    const responseLanguage = this.videoData?.responseLanguage ?? "unknown";
    const additionalInfo = `<details>
<summary>Autogenerated by VOT:</summary>
<ul>
  <li>OS: ${info.os}</li>
  <li>Browser: ${info.browser}</li>
  <li>Loader: ${info.loader}</li>
  <li>Script version: ${info.scriptVersion}</li>
  <li>URL: <code>${info.url}</code></li>
  <li>Lang: <code>${detectedLanguage}</code> -> <code>${responseLanguage}</code> (Lively voice: ${this.data?.useLivelyVoice ?? false} | Audio download: ${this.data?.useAudioDownload ?? false})</li>
  <li>Player: ${this.data?.newAudioPlayer ? "New" : "Old"} (CSP only: ${this.data?.onlyBypassMediaCSP ?? false})</li>
  <li>Proxying mode: ${this.data?.translateProxyEnabled ?? 0}</li>
</ul>
</details>`;
    const template = `1-bug-report-${localizationProvider.lang === "ru" ? "ru" : "en"}.yml`;
    return {
      assignees: "ilyhalight",
      template,
      os: info.os,
      "script-version": info.scriptVersion,
      "additional-info": additionalInfo,
    };
  }

  /**
   * Releases extra event listeners.
   */
  releaseExtraEvents = releaseExtraEventsImpl;
}

const videoObserverChecker = createIntervalIdleChecker();
const videoObserver = new VideoObserver(videoObserverChecker);
const videosWrappers = new WeakMap<HTMLVideoElement, VideoHandler>();
let servicesCache: ServiceConf[] | null = null;
const bootState = getOrCreateBootState();

function getFrameContext() {
  return {
    frame: isIframe() ? "iframe" : "top",
    host: globalThis.location.hostname || "unknown",
    path: globalThis.location.pathname || "/",
  };
}

function logBootstrap(
  message: string,
  details?: Record<string, unknown>,
): void {
  const ctx = getFrameContext();
  const payload: Record<string, unknown> = {
    host: ctx.host,
    path: ctx.path,
  };
  if (details) {
    Object.assign(payload, details);
  }

  console.log(`[VOT][bootstrap][${ctx.frame}] ${message}`, payload);
}

function getServicesCached(): ServiceConf[] {
  if (!servicesCache) {
    servicesCache = getService();
  }
  return servicesCache;
}

/**
 * Recursively finds the closest parent element matching a selector.
 * @param {SiteData} site The site data.
 * @param {HTMLElement} video The video element.
 * @returns {HTMLElement|null} The matching parent element.
 */
function findContainer(
  site: ServiceConf,
  video: HTMLVideoElement,
): HTMLElement | null {
  debug.log("findContainer", site, video);
  if (!site.selector) {
    debug.log("findContainer without selector, using parentElement");
    return video.parentElement;
  }

  const matched = findConnectedContainerBySelector(video, site.selector);

  if (site.shadowRoot) {
    debug.log("findContainer with site.shadowRoot", matched);
  } else {
    debug.log("findContainer without shadowRoot", matched);
  }

  if (matched) {
    return matched;
  }

  return null;
}

/**
 * Main function to start the extension.
 */
async function main(): Promise<void> {
  const bootstrapMode = resolveBootstrapMode({
    isIframe: isIframe(),
    href: String(globalThis.location.href || ""),
    origin: globalThis.location.origin,
    hash: globalThis.location.hash,
    iframeHash: IFRAME_HASH,
  });

  if (bootstrapMode === "iframe-helper") {
    logBootstrap("Starting iframe helper runtime");
    return initAudioDownloaderIframe();
  }
  if (bootstrapMode === "skip") {
    logBootstrap("Skipping bootstrap for non-runnable iframe");
    return;
  }

  logBootstrap("Loading extension");
  if (bootstrapMode === "top-full") {
    await ensureRuntimeActivated("top-frame", logBootstrap);
  } else {
    logBootstrap("Lazy iframe bootstrap enabled; waiting for video detection");
  }

  bindObserverListeners({
    videoObserver,
    videosWrappers,
    ensureRuntimeActivated: async (reason: string) =>
      await ensureRuntimeActivated(reason, logBootstrap),
    getServicesCached,
    findContainer,
    createVideoHandler: (video, container, site) =>
      new VideoHandler(video, container, site),
  });
  videoObserver.enable();
}

if (bootState.status === "booting" || bootState.status === "booted") {
  logBootstrap("bootstrap already initialized, skipping duplicate run", {
    status: bootState.status,
  });
} else {
  const runBootstrap = async () => {
    try {
      await main();
      bootState.status = "booted";
    } catch (e) {
      bootState.status = "failed";
      bootState.error = e;
      console.error("[VOT]", e);
    }
  };

  bootState.status = "booting";
  bootState.promise = runBootstrap();
}
