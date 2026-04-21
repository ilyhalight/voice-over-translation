import { EventImpl } from "../core/eventImpl";
import debug from "./debug";
import {
  type ShadowTreeTraversalAdapter,
  someComposedAncestor,
  walkShadowIncludingSubtree,
} from "./domTraversal";
import {
  createIntervalIdleChecker,
  type IntervalIdleChecker,
} from "./intervalIdleChecker";

const AD_ATTRS = ["class", "id", "title"] as const;
const AD_KEYWORDS = [
  "advertise",
  "advertisement",
  "promo",
  "sponsor",
  "banner",
  "commercial",
  "preroll",
  "midroll",
  "postroll",
  "ad-container",
  "sponsored",
] as const;
const AD_KEYWORD_PATTERN = new RegExp(
  AD_KEYWORDS.map((keyword) =>
    keyword.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`),
  ).join("|"),
);

type HTMLVideoWithAudioMetadata = HTMLVideoElement & {
  audioTracks?: { length: number };
  mozHasAudio?: boolean;
  webkitAudioDecodedByteCount?: number;
};

type HTMLVideoWithCaptureStream = HTMLVideoElement & {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
};

type AttachShadowSubscriber = (root: ShadowRoot) => void;

type AttachShadowHookState = {
  descriptor: PropertyDescriptor;
  subscribers: Set<AttachShadowSubscriber>;
};

const ATTACH_SHADOW_HOOK_KEY = Symbol.for("vot.attachShadowHook");

function getAttachShadowDescriptor(): PropertyDescriptor | null {
  const descriptor = Object.getOwnPropertyDescriptor(
    Element.prototype,
    "attachShadow",
  );
  if (!descriptor || typeof descriptor.value !== "function") {
    return null;
  }
  return descriptor;
}

function getOrInstallAttachShadowHook(): AttachShadowHookState | null {
  const g = globalThis as Record<PropertyKey, unknown>;
  const existing = g[ATTACH_SHADOW_HOOK_KEY] as
    | AttachShadowHookState
    | undefined;
  if (existing?.descriptor && existing.subscribers instanceof Set) {
    return existing;
  }

  const descriptor = getAttachShadowDescriptor();
  if (!descriptor) return null;
  const original = descriptor.value as Element["attachShadow"];

  const state: AttachShadowHookState = {
    descriptor,
    subscribers: new Set<AttachShadowSubscriber>(),
  };

  const patchedAttachShadow: Element["attachShadow"] = function (
    this: Element,
    init: ShadowRootInit,
  ): ShadowRoot {
    const root = original.call(this, init);
    // Notify subscribers about every created ShadowRoot (open & closed).
    for (const sub of state.subscribers) {
      try {
        sub(root);
      } catch (error) {
        // Never break page code if an observer throws.
        debug.error("attachShadow subscriber failed", error);
      }
    }
    return root;
  };

  try {
    Object.defineProperty(Element.prototype, "attachShadow", {
      ...descriptor,
      value: patchedAttachShadow,
    });
  } catch {
    // If patching isn't possible in this context, bail out gracefully.
    return null;
  }

  g[ATTACH_SHADOW_HOOK_KEY] = state;
  return state;
}

function removeAttachShadowSubscriber(
  subscriber: AttachShadowSubscriber,
): void {
  const g = globalThis as Record<PropertyKey, unknown>;
  const state = g[ATTACH_SHADOW_HOOK_KEY] as AttachShadowHookState | undefined;
  if (!state) return;

  state.subscribers.delete(subscriber);
  if (state.subscribers.size > 0) return;

  // Last subscriber removed - restore native attachShadow.
  try {
    Object.defineProperty(Element.prototype, "attachShadow", state.descriptor);
  } catch {
    // Fallback.
    const original = state.descriptor.value;
    if (typeof original === "function") {
      Element.prototype.attachShadow = original as Element["attachShadow"];
    }
  }

  delete g[ATTACH_SHADOW_HOOK_KEY];
}

export class VideoObserver {
  private seenVideos = new WeakSet<HTMLVideoElement>();
  private activeVideos = new WeakSet<HTMLVideoElement>();
  private observedRoots = new WeakSet<Node>();
  private readonly videoListenerControllers = new Map<
    HTMLVideoElement,
    AbortController
  >();

  private readonly pendingAdded = new Set<Node>();
  private readonly pendingRemoved = new Set<Node>();
  private flushPending = false;

  private static readonly MAX_FLUSH_BUDGET_MS = 6;
  private static readonly MAX_NODES_PER_SLICE = 120;

  readonly onVideoAdded = new EventImpl<[HTMLVideoElement]>();
  readonly onVideoRemoved = new EventImpl<[HTMLVideoElement]>();

  private readonly observer = new MutationObserver((muts) =>
    this.onMutations(muts),
  );
  private readonly intervalIdleChecker: IntervalIdleChecker;
  private checkerUnsubscribe: (() => void) | null = null;

  private enabled = false;

  private attachShadowSubscriber: AttachShadowSubscriber | null = null;

  private onDocumentReady: (() => void) | null = null;

  private readonly onPageShow = () => {
    const root = document.documentElement;
    if (!root) return;
    this.pendingAdded.add(root);
    this.scheduleFlush();
  };

  constructor(
    intervalIdleChecker: IntervalIdleChecker = createIntervalIdleChecker(),
  ) {
    this.intervalIdleChecker = intervalIdleChecker;
  }

  private static containsAdKeyword(value: string): boolean {
    return value.length > 0 && AD_KEYWORD_PATTERN.test(value);
  }

  private isAdRelated(element: Element): boolean {
    for (const attr of AD_ATTRS) {
      const rawValue = element.getAttribute(attr);
      if (!rawValue) continue;

      if (VideoObserver.containsAdKeyword(rawValue.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  private isInsideAd(video: HTMLVideoElement): boolean {
    return someComposedAncestor(video, (p) => this.isAdRelated(p as Element));
  }

  private getCapturedAudioTrackCount(video: HTMLVideoElement): number | null {
    const candidate = video as HTMLVideoWithCaptureStream;
    const captureStream = candidate.captureStream ?? candidate.mozCaptureStream;
    if (typeof captureStream !== "function") return null;

    try {
      const stream = captureStream.call(video);
      return stream.getAudioTracks().length;
    } catch {
      // Some platforms restrict captureStream for media elements.
      return null;
    }
  }

  private isLikelySilentDecorativeVideo(video: HTMLVideoElement): boolean {
    // We only apply this filter to autoplaying muted loops, a common pattern for
    // decorative/background videos that are not meant for translation.
    if (!(video.muted || video.defaultMuted)) return false;
    if (!video.autoplay || !video.loop) return false;
    if (video.controls) return false;

    const v = video as HTMLVideoWithAudioMetadata;

    if (typeof v.mozHasAudio === "boolean") {
      return !v.mozHasAudio;
    }

    if ("audioTracks" in v && typeof v.audioTracks?.length === "number") {
      if (v.audioTracks.length > 0) return false;
      const capturedTrackCount = this.getCapturedAudioTrackCount(video);
      if (capturedTrackCount !== null) {
        return capturedTrackCount === 0;
      }
      // If browser explicitly reports zero audio tracks and we can't probe
      // further, treat as likely silent for this narrow decorative pattern.
      return true;
    }

    const capturedTrackCount = this.getCapturedAudioTrackCount(video);
    if (capturedTrackCount !== null) {
      return capturedTrackCount === 0;
    }

    return false;
  }

  private hasAudio(video: HTMLVideoElement): boolean {
    const v = video as HTMLVideoWithAudioMetadata;

    // MediaStream-backed videos expose audio tracks explicitly.
    if (video.srcObject instanceof MediaStream) {
      return video.srcObject.getAudioTracks().length > 0;
    }

    if (typeof v.mozHasAudio === "boolean") return v.mozHasAudio;

    if (
      typeof v.webkitAudioDecodedByteCount === "number" &&
      v.webkitAudioDecodedByteCount > 0
    ) {
      return true;
    }

    if ("audioTracks" in v && typeof v.audioTracks?.length === "number") {
      if (v.audioTracks.length > 0) {
        return true;
      }
    }

    if (this.isLikelySilentDecorativeVideo(video)) {
      return false;
    }

    // `muted` / `defaultMuted` only reflect playback state, not whether media
    // has an audio track. Keep unknown cases eligible to avoid false negatives.
    return true;
  }

  private isValidVideo(video: HTMLVideoElement): boolean {
    if (this.isAdRelated(video)) return false;
    if (this.isInsideAd(video)) return false;

    if (!this.hasAudio(video)) {
      debug.log("Ignoring video without audio:", video);
      return false;
    }

    return true;
  }

  private observeRoot(root: Node): void {
    if (this.observedRoots.has(root)) return;
    this.observedRoots.add(root);

    this.observer.observe(root, { childList: true, subtree: true });
  }

  private static readonly domAdapter: ShadowTreeTraversalAdapter<Node> = {
    getChildren: (node) => Array.from((node as Element).children ?? []),
    getShadowRoot: (node) => (node as HTMLElement).shadowRoot as Node | null,
  };

  private scan(root: Node): void {
    if (root instanceof HTMLVideoElement) {
      this.trackVideo(root);
      return;
    }

    if (
      root.nodeType !== Node.ELEMENT_NODE &&
      root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE &&
      root.nodeType !== Node.DOCUMENT_NODE
    ) {
      return;
    }

    const elementRoot = root as Element;

    walkShadowIncludingSubtree(elementRoot, VideoObserver.domAdapter, (el) => {
      if (el instanceof HTMLVideoElement) {
        this.trackVideo(el);
        return;
      }

      const sr = (el as HTMLElement).shadowRoot;
      if (sr) {
        this.observeRoot(sr);
      }
    });
  }

  private getVideoListenerSignal(video: HTMLVideoElement): AbortSignal {
    const existingController = this.videoListenerControllers.get(video);
    if (existingController) {
      existingController.abort();
    }

    const controller = new AbortController();
    this.videoListenerControllers.set(video, controller);
    return controller.signal;
  }

  private cleanupVideoListeners(video: HTMLVideoElement): void {
    const controller = this.videoListenerControllers.get(video);
    if (!controller) return;
    controller.abort();
    this.videoListenerControllers.delete(video);
  }

  private cleanupAllVideoListeners(): void {
    for (const controller of this.videoListenerControllers.values()) {
      controller.abort();
    }
    this.videoListenerControllers.clear();
  }

  private trackVideo(video: HTMLVideoElement): void {
    if (this.seenVideos.has(video)) return;
    this.seenVideos.add(video);
    const listenerSignal = this.getVideoListenerSignal(video);

    const tryValidate = () => {
      if (this.isValidVideo(video)) {
        if (!this.activeVideos.has(video)) {
          this.activeVideos.add(video);
          this.onVideoAdded.dispatch(video);
        }
      }
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      tryValidate();
    } else {
      video.addEventListener("loadeddata", tryValidate, {
        once: true,
        signal: listenerSignal,
      });

      const handlePlay = () => {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          tryValidate();
        }
      };
      video.addEventListener("play", handlePlay, {
        once: true,
        passive: true,
        signal: listenerSignal,
      });
    }

    video.addEventListener(
      "emptied",
      () => {
        if (!video.isConnected) {
          this.untrackVideo(video);
        }
      },
      { passive: true, signal: listenerSignal },
    );
  }

  private untrackVideo(video: HTMLVideoElement): void {
    this.cleanupVideoListeners(video);

    if (this.activeVideos.has(video)) {
      this.onVideoRemoved.dispatch(video);
      this.activeVideos.delete(video);
    }
    this.seenVideos.delete(video);
  }

  private collectVideos(node: Node): HTMLVideoElement[] {
    const set = new Set<HTMLVideoElement>();

    if (node instanceof HTMLVideoElement) {
      set.add(node);
    }

    if (
      node.nodeType !== Node.ELEMENT_NODE &&
      node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE &&
      node.nodeType !== Node.DOCUMENT_NODE
    ) {
      return Array.from(set);
    }

    const elementNode = node as Element;

    walkShadowIncludingSubtree(elementNode, VideoObserver.domAdapter, (el) => {
      if (el instanceof HTMLVideoElement) {
        set.add(el);
      }
    });

    return Array.from(set);
  }

  private getNowMs(): number {
    if (
      typeof performance !== "undefined" &&
      typeof performance.now === "function"
    ) {
      return performance.now();
    }
    return Date.now();
  }

  private isSliceBudgetReached(startMs: number, processed: number): boolean {
    if (processed >= VideoObserver.MAX_NODES_PER_SLICE) return true;
    return this.getNowMs() - startMs >= VideoObserver.MAX_FLUSH_BUDGET_MS;
  }

  private processPendingAdded(startMs: number): number {
    let processed = 0;

    while (this.pendingAdded.size > 0) {
      const next = this.pendingAdded.values().next();
      if (next.done) break;

      this.pendingAdded.delete(next.value);
      this.scan(next.value);
      processed += 1;

      if (this.isSliceBudgetReached(startMs, processed)) {
        break;
      }
    }

    return processed;
  }

  private processPendingRemoved(startMs: number, processed: number): number {
    let processedCount = processed;

    while (this.pendingRemoved.size > 0) {
      if (this.isSliceBudgetReached(startMs, processedCount)) {
        break;
      }

      const next = this.pendingRemoved.values().next();
      if (next.done) break;

      this.pendingRemoved.delete(next.value);
      for (const video of this.collectVideos(next.value)) {
        if (!video.isConnected) this.untrackVideo(video);
      }
      processedCount += 1;
    }

    return processedCount;
  }

  private readonly flushSlice = () => {
    // A pending flush can run after `disable()` or when the page is restored
    // from bfcache. In those cases we simply drop the queued nodes.
    if (!this.enabled) {
      this.pendingAdded.clear();
      this.pendingRemoved.clear();
      this.flushPending = false;
      return;
    }

    const startMs = this.getNowMs();
    const processedAdded = this.processPendingAdded(startMs);
    this.processPendingRemoved(startMs, processedAdded);

    this.flushPending =
      this.pendingAdded.size > 0 || this.pendingRemoved.size > 0;
    if (this.flushPending) {
      this.intervalIdleChecker.requestImmediateTick();
    }
  };

  private readonly onCheckerTick = () => {
    if (!this.flushPending) return;
    this.flushSlice();
  };

  private readonly scheduleFlush = () => {
    if (!this.enabled) return;
    this.flushPending = true;
    this.intervalIdleChecker.requestImmediateTick();
  };

  private installAttachShadowHook() {
    if (this.attachShadowSubscriber) return;
    const state = getOrInstallAttachShadowHook();
    if (!state) return;

    const subscriber: AttachShadowSubscriber = (root) => {
      if (!this.enabled) return;
      this.observeRoot(root);
      this.pendingAdded.add(root);
      this.scheduleFlush();
    };

    state.subscribers.add(subscriber);
    this.attachShadowSubscriber = subscriber;
  }

  private uninstallAttachShadowHook() {
    if (!this.attachShadowSubscriber) return;
    removeAttachShadowSubscriber(this.attachShadowSubscriber);
    this.attachShadowSubscriber = null;
  }

  private enqueueAddedNode(node: Node): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const shadowRoot = (node as HTMLElement).shadowRoot;
      if (shadowRoot) this.observeRoot(shadowRoot);
    }
    this.pendingAdded.add(node);
  }

  private enqueueMutation(mutation: MutationRecord): void {
    for (const node of mutation.addedNodes) {
      this.enqueueAddedNode(node);
    }

    for (const node of mutation.removedNodes) {
      this.pendingRemoved.add(node);
    }
  }

  private onMutations(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      this.enqueueMutation(mutation);
    }

    if (this.pendingAdded.size > 0 || this.pendingRemoved.size > 0)
      this.scheduleFlush();
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    this.checkerUnsubscribe?.();
    this.checkerUnsubscribe = this.intervalIdleChecker.subscribe(
      this.onCheckerTick,
    );
    this.intervalIdleChecker.start();
    this.intervalIdleChecker.markActivity("video-observer-enable");

    this.installAttachShadowHook();
    globalThis.addEventListener("pageshow", this.onPageShow, { passive: true });

    const root = document.documentElement;
    if (root) {
      this.observeRoot(root);
      this.scan(root);
      return;
    }

    // In very early `document_start` runs, `document.documentElement` might not
    // exist yet. Observe once it does.
    const onReady = () => {
      const r = document.documentElement;
      if (!r) return;
      document.removeEventListener("readystatechange", onReady);
      this.onDocumentReady = null;
      if (!this.enabled) return;
      this.observeRoot(r);
      this.scan(r);
    };

    this.onDocumentReady = onReady;
    document.addEventListener("readystatechange", onReady);
    if (typeof queueMicrotask === "function") queueMicrotask(onReady);
    else void Promise.resolve().then(onReady);
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;

    globalThis.removeEventListener("pageshow", this.onPageShow);

    if (this.onDocumentReady) {
      document.removeEventListener("readystatechange", this.onDocumentReady);
      this.onDocumentReady = null;
    }

    this.uninstallAttachShadowHook();
    this.observer.disconnect();
    this.cleanupAllVideoListeners();
    this.flushPending = false;
    this.checkerUnsubscribe?.();
    this.checkerUnsubscribe = null;
    this.intervalIdleChecker.stop();

    this.pendingAdded.clear();
    this.pendingRemoved.clear();

    this.seenVideos = new WeakSet();
    this.activeVideos = new WeakSet();
    this.observedRoots = new WeakSet();
  }
}
