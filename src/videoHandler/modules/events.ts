import YoutubeHelper from "@vot.js/ext/helpers/youtube";
import { getVideoID } from "@vot.js/ext/utils/videoData";
import { availableLangs } from "@vot.js/shared/consts";
import type { RequestLang } from "@vot.js/shared/types/data";
import { defaultAutoHideDelay } from "../../config/config";
import {
  isDesktopYouTubeLikeSite,
  isMuteSyncDisabledHost,
  isYouTubeLikeHost,
} from "../../core/hostPolicies";
import { resetAndHideLifecycle } from "../../core/lifecycleShared";
import type { VideoHandler } from "../../index";
import debug from "../../utils/debug";
import { containsCrossShadow, getDeepActiveElement } from "../../utils/dom";
import { GM_fetch } from "../../utils/gm";
import { isIframe } from "../../utils/iframeConnector";
import { getPlatformEventConfig } from "../../utils/platformEvents";
import { clampPercentInt } from "../../utils/volume";
import { handlePlaybackResumedTranslationRefresh } from "./translation";

type ScopedAddListener = (
  element: EventTarget,
  event: string,
  handler: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions,
) => void;
type ScopedAddListeners = (
  element: EventTarget,
  events: Iterable<string>,
  handler: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions,
) => void;
type ExtraEventsContext = {
  self: VideoHandler;
  overlayView: NonNullable<VideoHandler["uiManager"]["votOverlayView"]>;
  platformConfig: ReturnType<typeof getPlatformEventConfig>;
  add: ScopedAddListener;
  addMany: ScopedAddListeners;
};

function mergeListenerSignals(
  primary: AbortSignal,
  secondary?: AbortSignal,
): AbortSignal {
  if (!secondary || secondary === primary) {
    return primary;
  }

  if (primary.aborted) {
    return primary;
  }

  if (secondary.aborted) {
    return secondary;
  }

  const canCombine = typeof AbortSignal !== "undefined" && "any" in AbortSignal;
  if (canCombine) {
    return (AbortSignal as any).any([primary, secondary]) as AbortSignal;
  }

  const controller = new AbortController();

  const cleanup = () => {
    primary.removeEventListener("abort", onPrimaryAbort);
    secondary.removeEventListener("abort", onSecondaryAbort);
  };

  const onPrimaryAbort = () => {
    cleanup();
    controller.abort(primary.reason);
  };
  const onSecondaryAbort = () => {
    cleanup();
    controller.abort(secondary.reason);
  };

  primary.addEventListener("abort", onPrimaryAbort, { once: true });
  secondary.addEventListener("abort", onSecondaryAbort, { once: true });

  return controller.signal;
}

function createScopedListeners(signal: AbortSignal): {
  add: ScopedAddListener;
  addMany: ScopedAddListeners;
} {
  const add: ScopedAddListener = (element, event, handler, options) => {
    const mergedSignal = mergeListenerSignals(signal, options?.signal);
    if (!options) {
      element.addEventListener(event, handler, { signal: mergedSignal });
      return;
    }

    const { signal: _ignoredSignal, ...restOptions } = options;
    element.addEventListener(event, handler, {
      ...restOptions,
      signal: mergedSignal,
    });
  };
  const addMany: ScopedAddListeners = (element, events, handler, options) => {
    for (const event of events) {
      add(element, event, handler, options);
    }
  };
  return { add, addMany };
}
function bindOverlayHoverFocusEvents(
  addMany: ScopedAddListeners,
  target: EventTarget,
  overlayVisibility: NonNullable<VideoHandler["overlayVisibility"]>,
): void {
  addMany(target, ["focusin"], (event) =>
    overlayVisibility.handleOverlayInteraction(event),
  );
  addMany(target, ["focusout"], (event) =>
    overlayVisibility.scheduleHide(event),
  );

  if (isIframe() && typeof globalThis.window !== "undefined") {
    return;
  }

  addMany(target, ["pointerenter"], (event) =>
    overlayVisibility.handleOverlayInteraction(event),
  );
  addMany(
    target,
    ["pointermove"],
    (event) => overlayVisibility.handleOverlayInteraction(event),
    { passive: true },
  );
  addMany(target, ["pointerleave"], (event) =>
    overlayVisibility.scheduleHide(event),
  );
}

function toPercentInt(value: unknown, fallback = 0): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? clampPercentInt(numeric) : fallback;
}
function syncAudioTranslationVolumeFromVideo(
  self: VideoHandler,
  videoPercent: number,
  options: {
    skipYouTubeLikeHosts?: boolean;
  } = {},
): void {
  if (options.skipYouTubeLikeHosts && isYouTubeLikeHost(self.site.host)) {
    return;
  }
  // While smart ducking is active, the script drives video volume itself.
  // Ignore observer-driven sync to avoid feedback loops/jitter.
  if (self.smartVolumeDuckingInterval !== undefined) return;
  if (!self.data?.syncVolume || !self.audioPlayer?.player?.src) return;
  if (self.isLikelyInternalVideoVolumeChange(videoPercent)) return;
  self.syncVolumeWrapper("video", videoPercent);
}
function applyOverlayLayout(
  self: VideoHandler,
  overlayView: NonNullable<VideoHandler["uiManager"]["votOverlayView"]>,
  heightPx?: number,
): void {
  const menu = overlayView.votMenu?.container;
  if (menu) {
    const height = heightPx ?? self.video.getBoundingClientRect().height;
    menu.style.setProperty("--vot-container-height", `${height}px`);
  }
  const { position, direction } = overlayView.calcButtonLayout(
    self.data?.buttonPos ?? "default",
  );
  overlayView.updateButtonLayout(position, direction);
}
type ParsedHotkey = {
  parts: readonly string[];
  partsSet: ReadonlySet<string>;
};
function normalizeHotkeyPart(value: string): string {
  return value.replace("Key", "").replace("Digit", "");
}
function buildPressedHotkeyPartsSet(
  userPressedKeys: Iterable<string>,
): Set<string> {
  const pressedParts = new Set<string>();
  for (const key of userPressedKeys) {
    pressedParts.add(normalizeHotkeyPart(key));
  }
  return pressedParts;
}
function getParsedHotkey(
  hotkey: string | null | undefined,
  cache: Map<string, ParsedHotkey>,
): ParsedHotkey | null {
  if (!hotkey) return null;
  const cached = cache.get(hotkey);
  if (cached) return cached;
  const parts = hotkey.split("+").filter(Boolean).map(normalizeHotkeyPart);
  const parsed: ParsedHotkey = {
    parts,
    partsSet: new Set(parts),
  };
  cache.set(hotkey, parsed);
  return parsed;
}
function isHotkeyMatch(
  pressedParts: ReadonlySet<string>,
  hotkey: ParsedHotkey | null,
): boolean {
  if (!hotkey) return false;
  if (pressedParts.size !== hotkey.parts.length) return false;
  for (const key of hotkey.partsSet) {
    if (!pressedParts.has(key)) return false;
  }
  return true;
}
function bindOverlayLayoutEvents(ctx: ExtraEventsContext): void {
  const { self, overlayView, addMany } = ctx;
  const syncMountAndLayout = () => {
    self.refreshOverlayMount();
    applyOverlayLayout(self, overlayView);
  };
  self.resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      applyOverlayLayout(self, overlayView, entry.contentRect.height);
    }
  });
  self.resizeObserver.observe(self.video);
  syncMountAndLayout();
  addMany(document, ["fullscreenchange", "webkitfullscreenchange"], () =>
    syncMountAndLayout(),
  );
  addMany(self.video, ["webkitbeginfullscreen", "webkitendfullscreen"], () =>
    syncMountAndLayout(),
  );
}
function bindYouTubeVolumeSync(ctx: ExtraEventsContext): void {
  const { self } = ctx;
  if (!isDesktopYouTubeLikeSite(self.site)) return;
  self.syncVolumeObserver = new MutationObserver((mutations) => {
    if (!self.audioPlayer?.player?.src) return;
    let hasVolumeMutation = false;
    for (const mutation of mutations) {
      if (
        mutation.type !== "attributes" ||
        mutation.attributeName !== "aria-valuenow"
      ) {
        continue;
      }
      hasVolumeMutation = true;
    }
    if (!hasVolumeMutation) return;
    self.syncVideoVolumeSlider();
    const activeOverlayView = self.uiManager.votOverlayView;
    if (!activeOverlayView?.isInitialized()) return;
    const videoPercent = toPercentInt(
      activeOverlayView.videoVolumeSlider.value,
    );
    syncAudioTranslationVolumeFromVideo(self, videoPercent);
  });
  const ytpVolumePanel = document.querySelector(".ytp-volume-panel");
  if (!ytpVolumePanel) return;
  self.syncVolumeObserver.observe(ytpVolumePanel, {
    attributes: true,
    subtree: true,
    attributeFilter: ["aria-valuenow"],
  });
}
function bindAudioTrackLanguageSync(ctx: ExtraEventsContext): void {
  const { self } = ctx;
  if (self.site.host !== "youtube" || self.site.additionalData === "mobile")
    return;
  const syncAudioTrackLanguage = async () => {
    try {
      if (!self.videoData) return;
      const player = YoutubeHelper.getPlayer();
      const availableTracks = player?.getAvailableAudioTracks?.() ?? null;
      if (!Array.isArray(availableTracks) || availableTracks.length <= 1)
        return;
      const currentTrackInfo = player?.getAudioTrack?.()?.getLanguageInfo?.();
      const currentTrackId = currentTrackInfo?.id;
      const currentLanguageCode =
        currentTrackId && currentTrackId !== "und"
          ? currentTrackId.toLowerCase().split(/[-_.]/)[0]
          : undefined;
      if (!currentLanguageCode) return;
      if (!availableLangs.includes(currentLanguageCode as RequestLang)) return;
      const currentLanguage = currentLanguageCode as RequestLang;
      if (currentLanguage === self.videoData.detectedLanguage) return;
      self.videoManager.rememberDetectedLanguage(
        self.videoData.videoId,
        currentLanguage,
      );
      self.setSelectMenuValues(
        currentLanguage,
        self.videoData.responseLanguage,
      );
      if (
        self.data?.autoTranslate &&
        currentLanguage !== self.videoData.responseLanguage
      ) {
        debug.log(
          `[VOT] Audio track language changed to ${currentLanguage}, triggering auto-translation`,
        );
        try {
          await self.uiManager.handleTranslationBtnClick();
        } catch (error) {
          debug.log(
            "[VOT] Failed to trigger auto-translation on audio track change:",
            error,
          );
        }
      }
    } catch (error) {
      debug.log("[VOT] Failed to sync audio track language", error);
    }
  };
  const player = YoutubeHelper.getPlayer();
  const listeners = ["onApiChange", "onStateChange"] as const;
  if (player?.addEventListener) {
    for (const eventName of listeners) {
      try {
        player.addEventListener(eventName, syncAudioTrackLanguage);
      } catch (error) {
        debug.log(`[VOT] Failed to bind ${eventName}`, error);
      }
    }
  }
  void syncAudioTrackLanguage();
  self.abortController.signal.addEventListener(
    "abort",
    () => {
      if (!player?.removeEventListener) return;
      for (const eventName of listeners) {
        try {
          player.removeEventListener(eventName, syncAudioTrackLanguage);
        } catch (error) {
          debug.log(`[VOT] Failed to unbind ${eventName}`, error);
        }
      }
    },
    { once: true },
  );
}
function bindGlobalDismissAndHotkeys(ctx: ExtraEventsContext): void {
  const { self, overlayView, add, addMany, platformConfig } = ctx;
  add(document, "click", (event) => {
    const target = event.target as Node | null;
    const button = overlayView.votButton?.container;
    const menu = overlayView.votMenu?.container;
    const settings = self.uiManager.votSettingsView?.dialog?.container;
    const isButton = target && button ? button.contains(target) : false;
    const isMenu = target && menu ? menu.contains(target) : false;
    const isVideo = target ? self.container.contains(target) : false;
    const isSettings = target && settings ? settings.contains(target) : false;
    const isTempDialog =
      target instanceof Element &&
      target.closest(".vot-dialog-temp") instanceof Element;
    debug.log(
      `[document click] ${isButton} ${isMenu} ${isVideo} ${isSettings} ${isTempDialog}`,
    );
    if (isButton || isMenu || isSettings || isTempDialog) return;
    if (!isVideo) overlayView.updateButtonOpacity(0);
    if (menu && !menu.hidden) {
      menu.hidden = true;
      self.overlayVisibility?.queueAutoHide();
    }
  });
  const userPressedKeys = new Set<string>();
  const hotkeyCache = new Map<string, ParsedHotkey>();
  const clearUserPressedKeys = () => userPressedKeys.clear();
  const runHotkeyAction = (
    action: () => Promise<unknown>,
    actionName: string,
  ) => {
    void action().catch((error) => {
      debug.log(`[VOT] ${actionName} hotkey action failed`, error);
    });
  };
  add(document, "keydown", (event) => {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.repeat) return;
    userPressedKeys.add(keyboardEvent.code);
    const activeElement = getDeepActiveElement(document) as HTMLElement | null;
    const activeTag = activeElement?.tagName?.toLowerCase?.() ?? "";
    const isInputElement =
      ["input", "textarea"].includes(activeTag) ||
      Boolean(activeElement?.isContentEditable);
    if (isInputElement) return;
    const pressedParts = buildPressedHotkeyPartsSet(userPressedKeys);
    if (
      isHotkeyMatch(
        pressedParts,
        getParsedHotkey(self.data?.translationHotkey, hotkeyCache),
      )
    ) {
      clearUserPressedKeys();
      runHotkeyAction(
        () => self.uiManager.handleTranslationBtnClick(),
        "Translation",
      );
      return;
    }
    if (
      isHotkeyMatch(
        pressedParts,
        getParsedHotkey(self.data?.subtitlesHotkey, hotkeyCache),
      )
    ) {
      clearUserPressedKeys();
      runHotkeyAction(
        () => self.toggleSubtitlesForCurrentLangPair(),
        "Subtitles",
      );
    }
  });
  add(document, "keyup", (event) =>
    userPressedKeys.delete((event as KeyboardEvent).code),
  );
  add(document, "blur", clearUserPressedKeys);
  add(document, "visibilitychange", () => {
    if (document.hidden) clearUserPressedKeys();
  });
  add(globalThis, "blur", clearUserPressedKeys);
  const eventContainer = self.getEventContainer();
  if (eventContainer) {
    const useWindowEvents =
      isIframe() && typeof globalThis.window !== "undefined";
    const interactionTarget = useWindowEvents
      ? globalThis.window
      : eventContainer;

    if (useWindowEvents) {
      addMany(
        interactionTarget,
        ["pointermove", "pointerdown"],
        (event) => self.overlayVisibility.handleHostInteraction(event),
        { passive: true },
      );
      add(interactionTarget, "blur", () =>
        self.overlayVisibility.scheduleHide(),
      );
    } else {
      addMany(interactionTarget, ["pointerenter", "pointerdown"], (event) =>
        self.overlayVisibility.handleHostInteraction(event),
      );
      add(
        interactionTarget,
        "pointermove",
        (event) => self.overlayVisibility.handleHostInteraction(event),
        { passive: true },
      );
      add(interactionTarget, "pointerleave", (event) =>
        self.overlayVisibility.scheduleHide(event),
      );
    }
  }
  self.rebindOverlayVisibilityTargets();
  if (platformConfig.allowTouchMoveHandler) {
    add(
      document,
      "touchmove",
      (event) => self.overlayVisibility.handleHostInteraction(event),
      { passive: true },
    );
  }
  if (platformConfig.disableContainerDrag) {
    self.container.draggable = false;
  }
}
export function bindPlaybackRefreshOnResume(ctx: ExtraEventsContext): void {
  const { self, add } = ctx;
  let wasPausedSinceLastPlay = false;

  const resetPauseState = () => {
    wasPausedSinceLastPlay = false;
  };

  add(self.video, "pause", () => {
    wasPausedSinceLastPlay = true;
  });

  add(self.video, "playing", () => {
    if (!wasPausedSinceLastPlay) return;
    wasPausedSinceLastPlay = false;
    handlePlaybackResumedTranslationRefresh.call(self).catch((error) => {
      debug.log(
        "[VOT] Failed to refresh translation after playback resumed",
        error,
      );
    });
  });

  add(self.video, "loadstart", resetPauseState);
  add(self.video, "emptied", resetPauseState);
}
function bindVideoLifecycleEvents(ctx: ExtraEventsContext): void {
  const { self, overlayView, add } = ctx;
  const safeSetCanPlay = async () => {
    try {
      await self.setCanPlay();
    } catch (err) {
      debug.log("[VOT] setCanPlay() failed", err);
    }
  };
  let setCanPlayQueued = false;
  const queueSetCanPlay = () => {
    if (setCanPlayQueued) return;
    setCanPlayQueued = true;
    queueMicrotask(async () => {
      setCanPlayQueued = false;
      await safeSetCanPlay();
    });
  };
  add(self.video, "canplay", () => {
    if (self.site.host === "rutube" && self.video.src) return;
    queueSetCanPlay();
  });
  const handleVideoEmptied = async () => {
    let videoId: string | undefined;
    try {
      videoId = await getVideoID(self.site, {
        fetchFn: GM_fetch,
        video: self.video,
      });
    } catch (error) {
      debug.log("[VOT] Failed to resolve video id on emptied", error);
    }
    if (self.videoData && videoId && videoId === self.videoData.videoId) {
      // Quality changes can trigger media reload (`emptied`) for the same
      // logical video. Keep translation state intact in this case.
      return;
    }
    debug.log("lipsync mode is emptied");
    resetAndHideLifecycle(self, overlayView, {
      clearVideoData: true,
      hideMenu: true,
    });
  };
  add(self.video, "emptied", () => {
    void handleVideoEmptied().catch((error) => {
      debug.log("[VOT] Failed to handle emptied lifecycle event", error);
    });
  });
  if (!isMuteSyncDisabledHost(self.site.host)) {
    add(self.video, "volumechange", () => {
      self.syncVideoVolumeSlider();
      const activeOverlayView = self.uiManager.votOverlayView;
      if (!activeOverlayView?.isInitialized()) return;
      const videoPercent = toPercentInt(
        activeOverlayView.videoVolumeSlider.value,
      );
      syncAudioTranslationVolumeFromVideo(self, videoPercent, {
        skipYouTubeLikeHosts: true,
      });
    });
  }
  if (self.site.host === "youtube" && !self.site.additionalData) {
    add(document, "yt-page-data-updated", () => {
      debug.log("yt-page-data-updated");
      if (!globalThis.location.pathname.startsWith("/shorts/")) return;
      queueSetCanPlay();
    });
  }
}
export function initExtraEvents(this: VideoHandler) {
  const overlayView = this.uiManager.votOverlayView;
  if (!overlayView?.subtitlesSelect) return;
  const { add, addMany } = createScopedListeners(this.abortController.signal);
  const ctx: ExtraEventsContext = {
    self: this,
    overlayView,
    platformConfig: getPlatformEventConfig(this.site.host),
    add,
    addMany,
  };
  bindPlaybackRefreshOnResume(ctx);
  bindOverlayLayoutEvents(ctx);
  bindYouTubeVolumeSync(ctx);
  bindAudioTrackLanguageSync(ctx);
  bindGlobalDismissAndHotkeys(ctx);
  bindVideoLifecycleEvents(ctx);
}
export function rebindOverlayVisibilityTargets(this: VideoHandler) {
  this.overlayVisibilityTargetsAbortController?.abort();
  this.overlayVisibilityTargetsAbortController = new AbortController();
  const { signal } = this.overlayVisibilityTargetsAbortController;
  const overlayButton = this.uiManager?.votOverlayView?.votButton?.container;
  const overlayMenu = this.uiManager?.votOverlayView?.votMenu?.container;
  if (!overlayButton || !overlayMenu || !this.overlayVisibility) return;
  const overlayVisibility = this.overlayVisibility;
  const { addMany } = createScopedListeners(signal);
  bindOverlayHoverFocusEvents(addMany, overlayButton, overlayVisibility);
  bindOverlayHoverFocusEvents(addMany, overlayMenu, overlayVisibility);
}
export function isOverlayInteractiveNode(
  this: VideoHandler,
  node: unknown,
): boolean {
  if (!(node instanceof Node)) return false;
  const overlayView = this.uiManager?.votOverlayView;
  const buttonContainer = overlayView?.votButton?.container;
  const menuContainer = overlayView?.votMenu?.container;
  return (
    (buttonContainer instanceof Node &&
      containsCrossShadow(buttonContainer, node)) ||
    (menuContainer instanceof Node && containsCrossShadow(menuContainer, node))
  );
}
export function getAutoHideDelay(this: VideoHandler): number {
  const delay = this.data?.autoHideButtonDelay;
  return typeof delay === "number" && Number.isFinite(delay)
    ? delay
    : defaultAutoHideDelay;
}
export function releaseExtraEvents(this: VideoHandler) {
  this.resizeObserver?.disconnect();
  this.overlayVisibilityTargetsAbortController?.abort();
  this.overlayVisibilityTargetsAbortController = undefined;
  if (isDesktopYouTubeLikeSite(this.site)) {
    this.syncVolumeObserver?.disconnect();
  }
}
