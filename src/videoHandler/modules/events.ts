import YoutubeHelper from "@vot.js/ext/helpers/youtube";
import { getVideoID } from "@vot.js/ext/utils/videoData";
import { defaultAutoHideDelay } from "../../config/config";
import {
  isDesktopYouTubeLikeSite,
  isMuteSyncDisabledHost,
  isYouTubeLikeHost,
} from "../../core/hostPolicies";
import { resetAndHideLifecycle } from "../../core/lifecycleShared";
import type { VideoHandler } from "../../index";
import { formatKeysCombo } from "../../ui/components/hotkeyButton";
import debug from "../../utils/debug";
import { GM_fetch } from "../../utils/gm";
import { getPlatformEventConfig } from "../../utils/platformEvents";
import { clampPercentInt } from "../../utils/volume";

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
function createScopedListeners(signal: AbortSignal): {
  add: ScopedAddListener;
  addMany: ScopedAddListeners;
} {
  const add: ScopedAddListener = (element, event, handler, options) => {
    element.addEventListener(event, handler, { signal, ...options });
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
  addMany(target, ["pointerenter", "focusin"], (event) =>
    overlayVisibility.handleOverlayInteraction(event),
  );
  addMany(
    target,
    ["pointermove"],
    (event) => overlayVisibility.handleOverlayInteraction(event),
    { passive: true },
  );
  addMany(target, ["pointerleave", "focusout"], (event) =>
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
  if (typeof self.smartVolumeDuckingInterval === "number") return;
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
function isHotkeyMatch(
  userPressedKeys: Set<string>,
  hotkey?: string | null,
): boolean {
  if (!hotkey) return false;
  const pressedParts = formatKeysCombo(userPressedKeys)
    .split("+")
    .filter(Boolean);
  const hotkeyParts = hotkey.split("+").filter(Boolean);
  if (pressedParts.length !== hotkeyParts.length) return false;
  const pressedSet = new Set(pressedParts);
  return hotkeyParts.every((key) => pressedSet.has(key));
}
function bindOverlayLayoutEvents(ctx: ExtraEventsContext): void {
  const { self, overlayView, addMany } = ctx;
  self.resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      applyOverlayLayout(self, overlayView, entry.contentRect.height);
    }
  });
  self.resizeObserver.observe(self.video);
  applyOverlayLayout(self, overlayView);
  addMany(document, ["fullscreenchange", "webkitfullscreenchange"], () =>
    applyOverlayLayout(self, overlayView),
  );
}
function bindYouTubeVolumeSync(ctx: ExtraEventsContext): void {
  const { self } = ctx;
  if (!isDesktopYouTubeLikeSite(self.site)) return;
  self.syncVolumeObserver = new MutationObserver((mutations) => {
    if (!self.audioPlayer?.player?.src) return;
    let hasVolumeMutation = false;
    let lastObservedAriaValue: number | null = null;
    for (const mutation of mutations) {
      if (
        mutation.type !== "attributes" ||
        mutation.attributeName !== "aria-valuenow"
      ) {
        continue;
      }
      hasVolumeMutation = true;
      const ariaValueNow =
        mutation.target instanceof Element
          ? mutation.target.getAttribute("aria-valuenow")
          : null;
      const parsedAriaValue =
        ariaValueNow != null ? Number.parseFloat(ariaValueNow) : Number.NaN;
      if (Number.isFinite(parsedAriaValue)) {
        lastObservedAriaValue = parsedAriaValue;
      }
    }
    if (!hasVolumeMutation) return;
    let videoPercent: number;
    if (lastObservedAriaValue != null) {
      videoPercent = toPercentInt(lastObservedAriaValue);
    } else {
      const fallbackVolume = self.isMuted() ? 0 : self.getVideoVolume();
      videoPercent = toPercentInt(fallbackVolume * 100);
    }
    self.syncVideoVolumeSlider();
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
    if (!self.videoData) return;
    const player = YoutubeHelper.getPlayer();
    const availableTracks = player?.getAvailableAudioTracks?.() ?? null;
    if (!Array.isArray(availableTracks) || availableTracks.length <= 1) return;
    const currentTrackInfo = player?.getAudioTrack?.()?.getLanguageInfo?.();
    const currentTrackId = currentTrackInfo?.id ?? undefined;
    const currentLanguage =
      currentTrackId && currentTrackId !== "und"
        ? currentTrackId.toLowerCase().split(/[-_.]/)[0]
        : YoutubeHelper.getLanguage();
    if (!currentLanguage) return;
    if (currentLanguage === self.videoData.detectedLanguage) return;
    self.setSelectMenuValues(currentLanguage, self.videoData.responseLanguage);
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
    const tempDialog = document.querySelector(".vot-dialog-temp");
    const isButton = target && button ? button.contains(target) : false;
    const isMenu = target && menu ? menu.contains(target) : false;
    const isVideo = target ? self.container.contains(target) : false;
    const isSettings = target && settings ? settings.contains(target) : false;
    const isTempDialog = target
      ? (tempDialog?.contains(target) ?? false)
      : false;
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
  const clearUserPressedKeys = () => userPressedKeys.clear();
  add(document, "keydown", async (event) => {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.repeat) return;
    userPressedKeys.add(keyboardEvent.code);
    const activeElement = document.activeElement as HTMLElement | null;
    const activeTag = activeElement?.tagName?.toLowerCase?.() ?? "";
    const isInputElement =
      ["input", "textarea"].includes(activeTag) ||
      Boolean(activeElement?.isContentEditable);
    if (isInputElement) return;
    if (isHotkeyMatch(userPressedKeys, self.data?.translationHotkey)) {
      clearUserPressedKeys();
      await self.uiManager.handleTranslationBtnClick();
      return;
    }
    if (isHotkeyMatch(userPressedKeys, self.data?.subtitlesHotkey)) {
      clearUserPressedKeys();
      await self.toggleSubtitlesForCurrentLangPair();
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
    addMany(eventContainer, ["pointerenter", "pointerdown"], (event) =>
      self.overlayVisibility.handleHostInteraction(event),
    );
    add(
      eventContainer,
      "pointermove",
      (event) => self.overlayVisibility.handleHostInteraction(event),
      { passive: true },
    );
    add(eventContainer, "pointerleave", (event) =>
      self.overlayVisibility.scheduleHide(event),
    );
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
  add(self.video, "emptied", async () => {
    let videoId: string | undefined;
    try {
      videoId = await getVideoID(self.site, {
        fetchFn: GM_fetch,
        video: self.video,
      });
    } catch {}
    if (
      self.video.src &&
      self.videoData &&
      videoId &&
      videoId === self.videoData.videoId
    ) {
      return;
    }
    debug.log("lipsync mode is emptied");
    resetAndHideLifecycle(self, overlayView, {
      clearVideoData: true,
      hideMenu: true,
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
    (buttonContainer instanceof Node && buttonContainer.contains(node)) ||
    (menuContainer instanceof Node && menuContainer.contains(node))
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
