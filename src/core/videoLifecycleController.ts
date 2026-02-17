import type { VideoDataSubtitle } from "@vot.js/core/types/client";
import type { ServiceConf, VideoService } from "@vot.js/ext/types/service";
import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";

import type { StorageData } from "../types/storage";
import debug from "../utils/debug";
import { containsCrossShadow } from "../utils/dom";
import type { VideoData } from "../videoHandler/shared";
import { findConnectedContainerBySelector } from "./containerResolution";
import { hideLifecycleOverlay, resetAndHideLifecycle } from "./lifecycleShared";

interface LifecycleOverlayView {
  votButton: { container: HTMLElement; opacity: number };
  votMenu: { container: HTMLElement; hidden: boolean };
}

interface LifecycleUIManager {
  votOverlayView: LifecycleOverlayView;
}

interface VideoLifecycleHost {
  video: HTMLVideoElement;
  site: ServiceConf<VideoService>;
  container: HTMLElement;
  firstPlay: boolean;
  stopTranslation(): void | Promise<void>;
  resetSubtitlesWidget(): void;
  uiManager: LifecycleUIManager;
  getVideoData(): Promise<VideoData | undefined>;
  cacheManager: {
    getSubtitles(key: string): VideoDataSubtitle[] | undefined;
  };
  updateSubtitlesLangSelect(): Promise<void>;
  setSelectMenuValues(from: RequestLang, to: ResponseLang): void;
  translateToLang: ResponseLang | string;
  data: Partial<StorageData>;
  subtitles: VideoDataSubtitle[];
  videoData?: VideoData;
  actionsAbortController?: AbortController;
  resetActionsAbortController?(reason?: unknown): void;
  getSubtitlesCacheKey(
    videoId: string,
    detectedLanguage: RequestLang,
    responseLanguage: ResponseLang,
  ): string;
  translationOrchestrator: {
    runAutoTranslationIfEligible(): Promise<void>;
  };
  enableSubtitlesForCurrentLangPair(): Promise<unknown>;
  queueOverlayAutoHide?(): void;
}

export class VideoLifecycleController {
  private readonly host: VideoLifecycleHost;
  private lifecycleGeneration = 0;
  private lastSetCanPlaySourceKey = "";
  private activeSetCanPlaySourceKey = "";
  private setCanPlayRequested = false;
  private setCanPlayLoopPromise?: Promise<void>;

  constructor(host: VideoLifecycleHost) {
    this.host = host;
  }

  private isStale(generation: number) {
    return generation !== this.lifecycleGeneration;
  }

  private resetActions(reason: string): void {
    if (typeof this.host.resetActionsAbortController === "function") {
      this.host.resetActionsAbortController(reason);
      return;
    }
    this.host.actionsAbortController?.abort(reason);
  }

  private invalidateActiveSession(reason: string): void {
    if (this.lifecycleGeneration === 0) return;
    this.lifecycleGeneration += 1;
    this.resetActions(`[VideoLifecycle] ${reason}`);
    debug.log(
      `[VideoLifecycle] cancelled active session (active: ${this.lifecycleGeneration})`,
      { reason },
    );
  }

  private startSession(reason: string): number {
    this.lifecycleGeneration += 1;
    const sessionId = this.lifecycleGeneration;
    this.resetActions(`[VideoLifecycle][session:${sessionId}] ${reason}`);
    debug.log(`[VideoLifecycle][session:${sessionId}] started`, { reason });
    return sessionId;
  }

  private shouldAbortHandleSrcChanged(callId: number, stage: string): boolean {
    if (!this.isStale(callId)) {
      return false;
    }

    debug.log(
      `[VideoLifecycle][session:${callId}] handleSrcChanged aborted at ${stage} (active: ${this.lifecycleGeneration})`,
    );
    return true;
  }

  teardown() {
    this.setCanPlayRequested = false;
    this.invalidateActiveSession("teardown");
  }

  private getCurrentSourceKey(): string {
    const hasSrcObject = this.host.video.srcObject ? "1" : "0";
    if (this.host.site.host === "youtube") {
      const path = globalThis.location.pathname;
      if (path.startsWith("/shorts/")) {
        // Shorts frequently rotate blob src values for the same logical video.
        // Use pathname to keep lifecycle keys stable and avoid duplicate runs.
        return `${globalThis.location.origin}${path}||${hasSrcObject}`;
      }
    }

    const src = this.host.video.currentSrc || this.host.video.src || "";
    return `${globalThis.location.href}||${src}||${hasSrcObject}`;
  }

  private resolveContainer(): HTMLElement {
    const { site, video, container } = this.host;

    if (!site.selector) {
      return video.parentElement ?? container;
    }

    const matched = findConnectedContainerBySelector(video, site.selector);
    if (matched) {
      return matched;
    }

    // Selector mismatch should not force an arbitrary container jump.
    if (container.isConnected && containsCrossShadow(container, video)) {
      return container;
    }

    return video.parentElement ?? container;
  }

  async setCanPlay() {
    this.setCanPlayRequested = true;
    if (this.setCanPlayLoopPromise !== undefined) {
      const incomingSourceKey = this.getCurrentSourceKey();
      if (
        this.activeSetCanPlaySourceKey &&
        incomingSourceKey !== this.activeSetCanPlaySourceKey
      ) {
        this.invalidateActiveSession(
          "setCanPlay source changed while previous trigger is running",
        );
      } else {
        debug.log("[VideoLifecycle] setCanPlay deduplicated for same source", {
          sourceKey: incomingSourceKey,
        });
      }
      return await this.setCanPlayLoopPromise;
    }

    const loopPromise = (async () => {
      while (this.setCanPlayRequested) {
        this.setCanPlayRequested = false;
        await this.runSetCanPlayOnce();
      }
    })();

    this.setCanPlayLoopPromise = loopPromise;
    try {
      await loopPromise;
    } finally {
      if (this.setCanPlayLoopPromise === loopPromise) {
        this.setCanPlayLoopPromise = undefined;
      }
    }
  }

  private async runSetCanPlayOnce() {
    const sourceKey = this.getCurrentSourceKey();
    if (
      this.host.videoData?.videoId &&
      sourceKey === this.lastSetCanPlaySourceKey
    ) {
      debug.log("[VideoLifecycle] setCanPlay deduplicated for same source", {
        sourceKey,
      });
      return;
    }

    try {
      this.host.videoData = await this.host.getVideoData();
    } catch (err) {
      debug.log(
        `[VideoLifecycle] getVideoData failed for source ${sourceKey}`,
        err,
      );
      this.host.videoData = undefined;
      hideLifecycleOverlay(this.host.uiManager.votOverlayView, {
        hideMenu: true,
      });
      return;
    }

    this.activeSetCanPlaySourceKey = sourceKey;
    const currentId = this.startSession(`setCanPlay (source: ${sourceKey})`);
    debug.log(`[VideoLifecycle][session:${currentId}] setCanPlay started`, {
      sourceKey,
    });

    try {
      await this.handleSrcChanged(currentId, sourceKey);

      if (this.isStale(currentId)) {
        debug.log(
          `[VideoLifecycle][session:${currentId}] setCanPlay aborted after src change (active: ${this.lifecycleGeneration})`,
        );
        return;
      }

      const autoSubtitlesPromise = this.runAutoSubtitlesIfEnabled(currentId);

      await this.host.translationOrchestrator.runAutoTranslationIfEligible();
      if (this.isStale(currentId)) {
        debug.log(
          `[VideoLifecycle][session:${currentId}] auto-translation result ignored (stale session)`,
        );
        return;
      }

      await autoSubtitlesPromise;
      if (this.isStale(currentId)) {
        debug.log(
          `[VideoLifecycle][session:${currentId}] auto-subtitles result ignored (stale session)`,
        );
        return;
      }
      debug.log(`[VideoLifecycle][session:${currentId}] setCanPlay finished`);
    } finally {
      if (this.activeSetCanPlaySourceKey === sourceKey) {
        this.activeSetCanPlaySourceKey = "";
      }
    }
  }

  private async runAutoSubtitlesIfEnabled(sessionId: number): Promise<void> {
    if (!this.host.data.autoSubtitles || !this.host.videoData?.videoId) {
      return;
    }

    try {
      await this.host.enableSubtitlesForCurrentLangPair();
    } catch (err) {
      debug.log(
        `[VideoLifecycle][session:${sessionId}] auto-subtitles failed`,
        err,
      );
    }
  }

  async handleSrcChanged(callId?: number, expectedSourceKey?: string) {
    const sessionId =
      typeof callId === "number"
        ? callId
        : this.startSession("manual handleSrcChanged");
    const sourceKey =
      typeof expectedSourceKey === "string" && expectedSourceKey.length > 0
        ? expectedSourceKey
        : this.getCurrentSourceKey();

    if (this.shouldAbortHandleSrcChanged(sessionId, "before start")) {
      return;
    }

    debug.log(`[VideoLifecycle][session:${sessionId}] src changed`, {
      sourceKey,
    });
    this.host.firstPlay = true;

    const overlayView = this.host.uiManager.votOverlayView;
    resetAndHideLifecycle(this.host, overlayView, { requireVideoData: true });

    const noSrc =
      !this.host.video.src &&
      !this.host.video.currentSrc &&
      !this.host.video.srcObject;
    if (noSrc) {
      hideLifecycleOverlay(overlayView, { hideMenu: true });
    }

    const nextContainer = this.resolveContainer();
    if (nextContainer !== this.host.container) {
      this.host.container = nextContainer;
    }

    if (this.shouldAbortHandleSrcChanged(sessionId, "before getVideoData")) {
      return;
    }

    // Show the button immediately while metadata is resolving.
    overlayView.votButton.container.hidden = false;
    overlayView.votButton.opacity = 1;
    this.host.queueOverlayAutoHide?.();

    if (this.shouldAbortHandleSrcChanged(sessionId, "after getVideoData")) {
      return;
    }

    if (!this.host.videoData?.videoId) {
      debug.log(
        `[VideoLifecycle][session:${sessionId}] No videoId resolved, hiding overlay`,
      );
      hideLifecycleOverlay(overlayView, { hideMenu: true });
      return;
    }

    const cacheKey = this.host.getSubtitlesCacheKey(
      this.host.videoData.videoId,
      this.host.videoData.detectedLanguage,
      this.host.videoData.responseLanguage,
    );

    this.host.subtitles = this.host.cacheManager.getSubtitles(cacheKey) ?? [];

    await this.host.updateSubtitlesLangSelect();
    if (this.shouldAbortHandleSrcChanged(sessionId, "after subtitles update")) {
      return;
    }

    this.host.translateToLang = this.host.data.responseLanguage ?? "ru";
    this.host.setSelectMenuValues(
      this.host.videoData.detectedLanguage,
      this.host.videoData.responseLanguage,
    );

    overlayView.votButton.container.hidden = false;
    overlayView.votButton.opacity = 1;
    this.host.queueOverlayAutoHide?.();
    this.lastSetCanPlaySourceKey = sourceKey;
    debug.log(`[VideoLifecycle][session:${sessionId}] src handling finished`);
  }
}
