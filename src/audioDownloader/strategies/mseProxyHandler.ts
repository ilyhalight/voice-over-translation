const MESSAGE_TYPE = "get-audio-chunks-by-mse-in-main-world";
const READY_MESSAGE_TYPE = "vot-mse-proxy-ready";
const IFRAME_HASH = "ya_iframe";
const MIN_CHUNK_SIZE = 5_295_308;
const BOOT_KEY = "__VOT_MSE_PROXY_HANDLER__";
const STORE_KEY = "__VOT_MSE_CAPTURE_STORE__";

type YouTubePlayer = Element & {
  loadVideoById?: (videoId: string) => void;
  playVideo: () => void;
  mute: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getPlayerState?: () => number;
};

type MseWindow = Window & {
  ManagedMediaSource?: typeof MediaSource;
  [BOOT_KEY]?: boolean;
  [STORE_KEY]?: MseCaptureStore;
};

type MseMessage = {
  messageId: string;
  messageType: string;
  messageDirection: "request" | "response";
  payload?: unknown;
  error?: string;
  isAborted?: boolean;
  isStreamFinished?: boolean;
};

const topSessions = new Map<
  string,
  { iframe: HTMLIFrameElement; cleanup: () => void }
>();

function getVideoId(message: MseMessage): string | undefined {
  if (!message.payload || typeof message.payload !== "object") return;
  const videoId = (message.payload as { pureVideoId?: unknown }).pureVideoId;
  return typeof videoId === "string" ? videoId : undefined;
}

async function getEncryptedEmbedConfig(
  targetWindow: Window,
  videoId: string,
): Promise<string | undefined> {
  if (!/(?:^|\.)youtube\.com$/.test(targetWindow.location.hostname)) return;

  const bytes = new Uint8Array(2 + videoId.length);
  bytes[0] = 10;
  bytes[1] = videoId.length;
  for (let index = 0; index < videoId.length; index++) {
    bytes[index + 2] = videoId.charCodeAt(index);
  }

  try {
    const response = await targetWindow.fetch(
      "https://www.youtube.com/youtubei/v1/share/get_share_panel",
      {
        method: "POST",
        body: JSON.stringify({
          context: {
            client: {
              clientName: "WEB",
              clientVersion: "2.20251006.01.00",
            },
          },
          serializedSharedEntity: encodeURIComponent(
            targetWindow.btoa(String.fromCharCode(...bytes)),
          ),
        }),
      },
    );
    const match = (await response.text()).match(
      /"encryptedEmbedConfig"\s*:\s*("[^"]+")/,
    );
    return match ? `{"enc":${match[1]}}` : undefined;
  } catch {
    return;
  }
}

type CapturedEvent =
  | { type: "append"; buffer: Uint8Array; sourceBuffer: SourceBuffer }
  | { type: "end" }
  | { type: "close" };

function concatBuffers(buffers: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(
    buffers.reduce((length, buffer) => length + buffer.byteLength, 0),
  );
  let offset = 0;
  for (const buffer of buffers) {
    result.set(buffer, offset);
    offset += buffer.byteLength;
  }
  return result;
}

function waitFor<T>(
  getValue: () => T | null,
  timeoutMs: number,
  label: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const startedAt = performance.now();
    const interval = setInterval(() => {
      const value = getValue();
      if (value) {
        clearInterval(interval);
        resolve(value);
      } else if (performance.now() - startedAt >= timeoutMs) {
        clearInterval(interval);
        reject(new Error(`Audio downloader. ${label} timed out`));
      }
    }, 100);
  });
}

class CapturedMediaSource {
  readonly mediaSource: MediaSource;
  readonly createdAt = performance.now();
  private readonly queuedEvents: CapturedEvent[] = [];
  private readonly listeners = new Set<(event: CapturedEvent) => void>();

  constructor(mediaSource: MediaSource) {
    this.mediaSource = mediaSource;
    const addSourceBuffer = mediaSource.addSourceBuffer;
    mediaSource.addSourceBuffer = new Proxy(addSourceBuffer, {
      apply: (target, thisArg, args: [string]) => {
        const sourceBuffer = Reflect.apply(target, thisArg, args);
        if (args[0].includes("audio/webm")) this.capture(sourceBuffer);
        return sourceBuffer;
      },
    });

    const endOfStream = mediaSource.endOfStream;
    mediaSource.endOfStream = new Proxy(endOfStream, {
      apply: (target, thisArg, args) => {
        const result = Reflect.apply(target, thisArg, args);
        this.emit({ type: "end" });
        return result;
      },
    });
    mediaSource.addEventListener("sourceclose", () =>
      this.emit({ type: "close" }),
    );
  }

  get isReady(): boolean {
    return this.mediaSource.readyState === "open";
  }

  listen(listener: (event: CapturedEvent) => void): () => void {
    this.listeners.add(listener);
    for (const event of this.queuedEvents.splice(0)) listener(event);
    return () => this.listeners.delete(listener);
  }

  private capture(sourceBuffer: SourceBuffer): void {
    const appendBuffer = sourceBuffer.appendBuffer;
    sourceBuffer.appendBuffer = new Proxy(appendBuffer, {
      apply: (target, thisArg, args: [BufferSource]) => {
        const input = args[0];
        const view = ArrayBuffer.isView(input)
          ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
          : new Uint8Array(input);
        const copy = new Uint8Array(view);
        const result = Reflect.apply(target, thisArg, args);
        this.emit({ type: "append", buffer: copy, sourceBuffer });
        return result;
      },
    });
  }

  private emit(event: CapturedEvent): void {
    if (this.listeners.size === 0) this.queuedEvents.push(event);
    for (const listener of this.listeners) listener(event);
  }
}

class MseCaptureStore {
  readonly captures: CapturedMediaSource[] = [];
  private readonly listeners = new Set<
    (capture: CapturedMediaSource) => void
  >();

  add(mediaSource: MediaSource): void {
    const capture = new CapturedMediaSource(mediaSource);
    this.captures.push(capture);
    for (const listener of this.listeners) listener(capture);
  }

  async pick(): Promise<CapturedMediaSource> {
    try {
      return await waitFor(
        () => {
          const capture = this.captures.at(-1);
          return capture?.isReady &&
            performance.now() - capture.createdAt >= 4_000
            ? capture
            : null;
        },
        10_000,
        "MSE capture wait",
      );
    } catch (error) {
      const newest = this.captures.at(-1);
      throw new Error(
        `Audio downloader. MSE capture wait timed out (captures: ${this.captures.length}, ` +
          `newestReady: ${newest?.isReady ?? "none"})`,
        { cause: error },
      );
    }
  }

  onCapture(listener: (capture: CapturedMediaSource) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

function installMediaSourceProxy(targetWindow: MseWindow): MseCaptureStore {
  if (targetWindow[STORE_KEY]) return targetWindow[STORE_KEY];

  const store = new MseCaptureStore();
  const key = targetWindow.ManagedMediaSource
    ? "ManagedMediaSource"
    : "MediaSource";
  const MediaSourceConstructor = targetWindow[key];
  if (!MediaSourceConstructor) throw new Error("MediaSource is not available");

  // Subclassing survives Firefox quirks with Proxy-constructed DOM
  // classes; instanceof checks and the prototype chain stay intact.
  class ProxiedMediaSource extends MediaSourceConstructor {
    constructor() {
      super();
      // The union base type confuses structural typing; the runtime
      // instance is a genuine MediaSource.
      store.add(this as unknown as MediaSource);
    }
  }
  targetWindow[key] = ProxiedMediaSource;
  targetWindow[STORE_KEY] = store;
  return store;
}

async function getPlayer(targetWindow: Window): Promise<YouTubePlayer> {
  return await waitFor(
    () => {
      const player =
        targetWindow.document.querySelector<YouTubePlayer>("#movie_player");
      return player &&
        typeof player.playVideo === "function" &&
        typeof player.mute === "function" &&
        typeof player.seekTo === "function"
        ? player
        : null;
    },
    10_000,
    "MSE player wait",
  );
}

function createAudioChunkStream(
  targetWindow: MseWindow,
  videoId: string,
  signal: AbortSignal,
): ReadableStream<{ buffer: Uint8Array; isLastChunk: boolean }> {
  let cleanup = () => {};

  return new ReadableStream({
    async start(controller) {
      try {
        const player = await getPlayer(targetWindow);
        try {
          player.loadVideoById?.(videoId);
        } catch {
          // Fall back to the video already cued by the embed URL.
        }
        player.mute();
        player.playVideo();

        const getPlayerState = () => {
          try {
            return player.getPlayerState?.() ?? null;
          } catch {
            return null;
          }
        };
        const listVideos = () => [
          ...targetWindow.document.querySelectorAll("video"),
        ];
        let readyVideo: HTMLVideoElement;
        let playReject: string | null = null;
        try {
          readyVideo = await waitFor(
            () => {
              // YT states: -1 unstarted, 0 ended, 1 playing, 2 paused,
              // 3 buffering, 5 cued. Re-press play while cued or paused:
              // the initial playVideo() is easily dropped before the player
              // is ready or blocked without user activation.
              const videos = listVideos();
              const state = getPlayerState();
              if (
                videos.length > 0 &&
                (state === 5 || state === 2 || state === -1)
              ) {
                try {
                  if (state === -1) player.loadVideoById?.(videoId);
                  player.playVideo();
                } catch {
                  // Play retries are best-effort only.
                }
                // Probe the element directly: a rejected play() (e.g.
                // NotAllowedError) proves autoplay blocking by the browser.
                const element = videos[0];
                try {
                  element.muted = true;
                  const attempt = element.play();
                  if (attempt && typeof attempt.catch === "function") {
                    attempt.catch((playError: unknown) => {
                      playReject ??=
                        playError instanceof Error
                          ? playError.name
                          : String(playError);
                    });
                  }
                } catch (playError) {
                  playReject ??=
                    playError instanceof Error
                      ? playError.name
                      : String(playError);
                }
              }
              return (
                videos.find((video) => video.readyState >= 3) ??
                (state === 1 && videos.length > 0 ? videos[0] : null)
              );
            },
            15_000,
            "MSE media wait",
          );
        } catch (error) {
          const videos = listVideos();
          const video = videos[0];
          // The proxy is installed at handler init, so captures collected
          // before/during the wait are visible here even though pick()
          // runs later.
          const earlyStore = targetWindow[STORE_KEY];
          const earlyNewest = earlyStore?.captures.at(-1);
          throw new Error(
            `Audio downloader. MSE media wait timed out (videos: ${videos.length}, ` +
              `readyState: ${video?.readyState ?? "none"}, ` +
              `playerState: ${getPlayerState() ?? "unknown"}, paused: ${video?.paused ?? "unknown"}, ` +
              `networkState: ${video?.networkState ?? "none"}, buffered: ${video?.buffered.length ?? "none"}, ` +
              `hasSrc: ${Boolean(video?.currentSrc)}, mediaError: ${video?.error?.code ?? "none"}, ` +
              `playReject: ${playReject ?? "none"}, ` +
              `captures: ${earlyStore?.captures.length ?? "none"}, ` +
              `newestMS: ${earlyNewest?.mediaSource.readyState ?? "none"})`,
            { cause: error },
          );
        }
        try {
          readyVideo.playbackRate = 2;
        } catch {
          // Playback rate boost is best-effort only.
        }

        const store = installMediaSourceProxy(targetWindow);
        let capture = await store.pick();
        let removeCaptureListener = () => {};
        let pending: Uint8Array[] = [];
        let pendingSize = 0;
        let heldChunk: Uint8Array | undefined;
        let seekTimeout: ReturnType<typeof setTimeout> | undefined;
        let closed = false;

        const promotePendingChunk = () => {
          if (heldChunk) {
            controller.enqueue({ buffer: heldChunk, isLastChunk: false });
          }
          heldChunk = concatBuffers(pending);
          pending = [];
          pendingSize = 0;
        };
        const close = () => {
          if (closed) return;
          closed = true;
          if (pendingSize > 0) promotePendingChunk();
          if (!heldChunk?.byteLength) {
            controller.error(new Error("Audio downloader. Empty MSE stream"));
          } else {
            controller.enqueue({ buffer: heldChunk, isLastChunk: true });
            controller.close();
          }
          cleanup();
        };
        const onCapturedEvent = (event: CapturedEvent) => {
          if (closed) return;
          if (event.type === "end") {
            close();
            return;
          }
          if (event.type === "close") {
            closed = true;
            controller.error(new Error("Audio downloader. MSE source closed"));
            cleanup();
            return;
          }

          pending.push(event.buffer);
          pendingSize += event.buffer.byteLength;
          if (pendingSize >= MIN_CHUNK_SIZE) promotePendingChunk();

          const { buffered } = event.sourceBuffer;
          const bufferedEnd =
            buffered.length > 0
              ? Math.floor(buffered.end(buffered.length - 1))
              : 0;
          clearTimeout(seekTimeout);
          if (bufferedEnd > 0) {
            seekTimeout = setTimeout(
              () => player.seekTo(bufferedEnd, true),
              1000,
            );
          }
        };
        let stopCapture = () => {};
        const onAbort = () => {
          if (closed) return;
          closed = true;
          controller.error(new Error(String(signal.reason ?? "Aborted")));
          cleanup();
        };
        cleanup = () => {
          clearTimeout(seekTimeout);
          stopCapture();
          removeCaptureListener();
          signal.removeEventListener("abort", onAbort);
        };
        stopCapture = capture.listen(onCapturedEvent);
        if (closed) return;
        removeCaptureListener = store.onCapture((nextCapture) => {
          stopCapture();
          capture = nextCapture;
          stopCapture = capture.listen(onCapturedEvent);
        });
        signal.addEventListener("abort", onAbort, { once: true });
        if (signal.aborted) onAbort();
      } catch (error) {
        controller.error(error);
        cleanup();
      }
    },
    cancel() {
      cleanup();
    },
  });
}

function postResponse(
  target: MessageEventSource,
  targetOrigin: string,
  message: MseMessage,
): void {
  (target as Window).postMessage(message, targetOrigin || "*");
}

async function handleIframeRequest(
  event: MessageEvent<MseMessage>,
  targetWindow: MseWindow,
): Promise<void> {
  const message = event.data;
  const source = event.source;
  if (!source) return;
  const controller = new AbortController();
  const abort = (abortEvent: MessageEvent<MseMessage>) => {
    const data = abortEvent.data;
    if (data.messageId === message.messageId && data.isAborted) {
      controller.abort(data.payload);
    }
  };
  targetWindow.addEventListener("message", abort);

  try {
    const videoId = getVideoId(message);
    if (!videoId) throw new Error("Audio downloader. Missing video id");
    const stream = createAudioChunkStream(
      targetWindow,
      videoId,
      controller.signal,
    );
    await stream.pipeTo(
      new WritableStream({
        write(chunk) {
          postResponse(source, event.origin, {
            ...message,
            messageDirection: "response",
            payload: chunk,
          });
        },
        close() {
          postResponse(source, event.origin, {
            ...message,
            messageDirection: "response",
            payload: undefined,
            isStreamFinished: true,
          });
        },
      }),
    );
  } catch (error) {
    postResponse(source, event.origin, {
      ...message,
      messageDirection: "response",
      payload: undefined,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    targetWindow.removeEventListener("message", abort);
  }
}

async function handleTopRequest(
  event: MessageEvent<MseMessage>,
  targetWindow: MseWindow,
): Promise<void> {
  const message = event.data;
  const source = event.source;
  if (!source) return;

  if (message.isAborted) {
    const session = topSessions.get(message.messageId);
    session?.iframe.contentWindow?.postMessage(message, "*");
    session?.cleanup();
    return;
  }

  const videoId = getVideoId(message);
  if (!videoId) return;

  const iframe = targetWindow.document.createElement("iframe");
  // display:none iframes have no layout box, and YouTube defers media
  // loading for non-rendered players (no src is ever assigned). Keep the
  // frame rendered but invisible: 2x2px, off the visual path.
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:2px;height:2px;border:0;" +
    "padding:0;margin:0;opacity:0;visibility:hidden;pointer-events:none;";
  iframe.tabIndex = -1;
  iframe.setAttribute("aria-hidden", "true");
  iframe.id = `vot-mse-proxy-${message.messageId}`;
  const url = new URL(`/embed/${videoId}`, "https://www.youtube.com");
  url.searchParams.set("autoplay", "0");
  url.searchParams.set("mute", "1");
  const embedConfig = await getEncryptedEmbedConfig(targetWindow, videoId);
  if (embedConfig) url.searchParams.set("embed_config", embedConfig);
  url.hash = IFRAME_HASH;

  const cleanup = () => {
    clearTimeout(timeout);
    targetWindow.removeEventListener("message", onMessage);
    topSessions.delete(message.messageId);
    iframe.remove();
  };
  let ready = false;
  const onMessage = (responseEvent: MessageEvent<MseMessage>) => {
    const response = responseEvent.data;
    if (responseEvent.source !== iframe.contentWindow) return;
    if (response.messageType === READY_MESSAGE_TYPE) {
      if (ready) return;
      ready = true;
      clearTimeout(timeout);
      iframe.contentWindow?.postMessage(message, "*");
    } else if (
      response.messageId === message.messageId &&
      (response.error || response.isStreamFinished)
    ) {
      queueMicrotask(cleanup);
    }
  };
  const timeout = setTimeout(() => {
    postResponse(source, event.origin, {
      ...message,
      messageDirection: "response",
      error: "Audio downloader. MSE iframe loading timed out",
    });
    cleanup();
  }, 15_000);

  topSessions.set(message.messageId, { iframe, cleanup });
  targetWindow.addEventListener("message", onMessage);
  iframe.src = url.toString();
  (
    targetWindow.document.body ?? targetWindow.document.documentElement
  ).appendChild(iframe);
}

export function initMseProxyHandler(): void {
  const pageWindow = globalThis as unknown as MseWindow;
  if (
    pageWindow[BOOT_KEY] ||
    !pageWindow.location ||
    pageWindow.navigator.userAgent.includes("YaBrowser/")
  ) {
    return;
  }
  pageWindow[BOOT_KEY] = true;

  const isServiceIframe =
    pageWindow.self !== pageWindow.top &&
    /(?:youtube(?:-nocookie)?\.com|youtubekids\.com)$/.test(
      pageWindow.location.hostname,
    ) &&
    pageWindow.location.hash.includes(IFRAME_HASH);
  if (isServiceIframe) installMediaSourceProxy(pageWindow);

  pageWindow.addEventListener("message", (event: MessageEvent<MseMessage>) => {
    const message = event.data;
    if (
      message?.messageType !== MESSAGE_TYPE ||
      message.messageDirection !== "request"
    ) {
      return;
    }
    if (!isServiceIframe && event.origin !== pageWindow.location.origin) {
      return;
    }
    if (isServiceIframe) {
      if (!message.isAborted) void handleIframeRequest(event, pageWindow);
    } else {
      void handleTopRequest(event, pageWindow);
    }
  });

  if (isServiceIframe) {
    pageWindow.parent.postMessage(
      {
        messageType: READY_MESSAGE_TYPE,
        messageDirection: "response",
      },
      "*",
    );
  }
}

initMseProxyHandler();
