import { AudioDownloadType } from "@vot.js/core/types/yandex";
import { config } from "@vot.js/shared";
import debug from "../../utils/debug";
import { type AudioChunk, concatBuffers } from "./audioChunks";
import { getWebAbrAudioChunks } from "./webAbr";

const MESSAGE_TYPE = "get-audio-chunks-by-mse-in-main-world";
const READY_MESSAGE_TYPE = "vot-mse-proxy-ready";
const IFRAME_HASH = "ya_iframe";
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
  isProgress?: boolean;
};

const topSessions = new Map<
  string,
  {
    iframe: HTMLIFrameElement;
    cleanup: () => void;
    source: MessageEventSource;
    origin: string;
  }
>();

function getVideoId(message: MseMessage): string | undefined {
  if (!message.payload || typeof message.payload !== "object") return;
  const videoId = (message.payload as { pureVideoId?: unknown }).pureVideoId;
  return typeof videoId === "string" ? videoId : undefined;
}

function getAudioDownloadType(
  message: MseMessage,
): AudioDownloadType.WEB_ABR | AudioDownloadType.WEB_MSE_PROXY | undefined {
  if (!message.payload || typeof message.payload !== "object") return;
  const audioDownloadType = (message.payload as { audioDownloadType?: unknown })
    .audioDownloadType;
  return audioDownloadType === AudioDownloadType.WEB_ABR ||
    audioDownloadType === AudioDownloadType.WEB_MSE_PROXY
    ? audioDownloadType
    : undefined;
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

function waitFor<T>(
  getValue: () => T | null,
  timeoutMs: number,
  label: string,
  signal: AbortSignal,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearInterval(interval);
      clearTimeout(timeout);
      signal.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      reject(signal.reason);
    };
    const interval = setInterval(() => {
      try {
        const value = getValue();
        if (value) {
          cleanup();
          resolve(value);
        }
      } catch (error) {
        cleanup();
        reject(error);
      }
    }, 100);
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Audio downloader. ${label} timed out`));
    }, timeoutMs);
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) onAbort();
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
    try {
      for (const event of this.queuedEvents.splice(0)) listener(event);
    } catch (error) {
      this.listeners.delete(listener);
      throw error;
    }
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

  async pick(signal: AbortSignal): Promise<CapturedMediaSource> {
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
        signal,
      );
    } catch (error) {
      signal.throwIfAborted();
      if ((error as { name?: string } | null)?.name === "AbortError")
        throw error;
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

async function getPlayer(
  targetWindow: Window,
  signal: AbortSignal,
): Promise<YouTubePlayer> {
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
    30_000,
    "MSE player wait",
    signal,
  );
}

export function createAudioChunkStream(
  targetWindow: MseWindow,
  videoId: string,
  signal: AbortSignal,
  onProgress?: () => void,
): ReadableStream<AudioChunk> {
  let cleanup = () => {};
  let finished = false;
  const cancellation = new AbortController();
  signal = AbortSignal.any([signal, cancellation.signal]);

  return new ReadableStream({
    async start(controller) {
      let stopMse = () => {};
      const fail = (error: unknown) => {
        if (finished) return;
        finished = true;
        cleanup();
        controller.error(error);
      };
      const onAbort = () => fail(signal.reason);
      cleanup = () => {
        stopMse();
        signal.removeEventListener("abort", onAbort);
      };
      signal.addEventListener("abort", onAbort, { once: true });

      const onMseError = (error: unknown) => {
        if (finished) return;
        stopMse();
        fail(signal.aborted ? signal.reason : error);
      };
      try {
        signal.throwIfAborted();
        debug.log("Audio downloader. MSE iframe stream started", { videoId });
        const player = await getPlayer(targetWindow, signal);
        signal.throwIfAborted();
        debug.log("Audio downloader. MSE player found", { videoId });
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
            signal,
          );
        } catch (error) {
          signal.throwIfAborted();
          if ((error as { name?: string } | null)?.name === "AbortError")
            throw error;
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
        signal.throwIfAborted();
        debug.log("Audio downloader. MSE media ready", {
          videoId,
          readyState: readyVideo.readyState,
          playerState: getPlayerState(),
          playReject,
        });
        try {
          readyVideo.playbackRate = 2;
        } catch {
          // Playback rate boost is best-effort only.
        }

        const store = installMediaSourceProxy(targetWindow);
        let capture = await store.pick(signal);
        signal.throwIfAborted();
        debug.log("Audio downloader. MSE capture picked", {
          videoId,
          captures: store.captures.length,
          readyState: capture.mediaSource.readyState,
        });
        let removeCaptureListener = () => {};
        let pending: Uint8Array[] = [];
        let pendingSize = 0;
        let totalSize = 0;
        let seekTimeout: ReturnType<typeof setTimeout> | undefined;
        let lastProgressAt = 0;

        const enqueuePendingChunk = (isLastChunk: boolean) => {
          const size = pendingSize;
          controller.enqueue({ buffer: concatBuffers(pending), isLastChunk });
          debug.log("Audio downloader. MSE chunk enqueued", {
            videoId,
            size,
            isLastChunk,
            totalSize,
          });
          pending = [];
          pendingSize = 0;
        };
        const close = () => {
          if (finished) return;
          if (totalSize === 0) {
            debug.error("Audio downloader. MSE empty stream", { videoId });
            void onMseError(new Error("Audio downloader. Empty MSE stream"));
          } else {
            debug.log("Audio downloader. MSE stream finished", {
              videoId,
              totalSize,
            });
            enqueuePendingChunk(true);
            finished = true;
            controller.close();
            cleanup();
          }
        };
        let firstAppendLogged = false;
        const onCapturedEvent = (event: CapturedEvent) => {
          if (finished) return;
          try {
            if (event.type === "end") {
              debug.log("Audio downloader. MSE end of stream", {
                videoId,
                totalSize,
                pendingSize,
              });
              close();
              return;
            }
            if (event.type === "close") {
              debug.error("Audio downloader. MSE source closed", {
                videoId,
                totalSize,
              });
              void onMseError(new Error("Audio downloader. MSE source closed"));
              return;
            }

            if (!firstAppendLogged) {
              firstAppendLogged = true;
              debug.log("Audio downloader. MSE first audio append", {
                videoId,
                size: event.buffer.byteLength,
              });
            }
            pending.push(event.buffer);
            pendingSize += event.buffer.byteLength;
            totalSize += event.buffer.byteLength;
            if (pendingSize >= config.minChunkSize) {
              enqueuePendingChunk(false);
            } else if (
              pendingSize >= config.minChunkSize / 2 &&
              performance.now() - lastProgressAt >= 30_000
            ) {
              // Half a chunk is buffered but no full chunk yet: ping the
              // main world so it extends the message timeout. Chunk sizes
              // stay strictly bound to config.minChunkSize.
              lastProgressAt = performance.now();
              debug.log("Audio downloader. MSE progress ping", {
                videoId,
                pendingSize,
                totalSize,
              });
              onProgress?.();
            }

            if (finished) return;
            const { buffered } = event.sourceBuffer;
            const bufferedEnd =
              buffered.length > 0
                ? Math.floor(buffered.end(buffered.length - 1))
                : 0;
            clearTimeout(seekTimeout);
            if (bufferedEnd > 0) {
              seekTimeout = setTimeout(() => {
                try {
                  player.seekTo(bufferedEnd, true);
                } catch (error) {
                  void onMseError(error);
                }
              }, 1000);
            }
          } catch (error) {
            void onMseError(error);
          }
        };
        let stopCapture = () => {};
        stopMse = () => {
          clearTimeout(seekTimeout);
          stopCapture();
          removeCaptureListener();
        };
        stopCapture = capture.listen(onCapturedEvent);
        // listen() replays queued events before returning its unsubscribe.
        if (finished) {
          stopCapture();
          return;
        }
        removeCaptureListener = store.onCapture((nextCapture) => {
          if (finished) return;
          try {
            stopCapture();
            capture = nextCapture;
            stopCapture = capture.listen(onCapturedEvent);
            if (finished) stopCapture();
          } catch (error) {
            void onMseError(error);
          }
        });
        if (finished) removeCaptureListener();
      } catch (error) {
        debug.error("Audio downloader. MSE iframe stream failed", {
          videoId,
          error: error instanceof Error ? error.message : String(error),
        });
        onMseError(error);
      }
    },
    cancel(reason) {
      finished = true;
      cancellation.abort(reason);
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
    if (
      abortEvent.source === source &&
      abortEvent.origin === event.origin &&
      data.messageId === message.messageId &&
      data.messageType === MESSAGE_TYPE &&
      data.messageDirection === "request" &&
      data.isAborted
    ) {
      controller.abort(data.payload);
    }
  };
  targetWindow.addEventListener("message", abort);

  let settled = false;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  try {
    const videoId = getVideoId(message);
    if (!videoId) throw new Error("Audio downloader. Missing video id");
    const audioDownloadType = getAudioDownloadType(message);
    if (!audioDownloadType) {
      throw new Error("Audio downloader. Unsupported audio download type");
    }
    debug.log("Audio downloader. iframe request started", {
      videoId,
      messageId: message.messageId,
      audioDownloadType,
    });
    const postProgress = () => {
      if (settled) return;
      postResponse(source, event.origin, {
        ...message,
        messageDirection: "response",
        payload: undefined,
        isProgress: true,
      });
    };
    const chunks: AsyncIterable<AudioChunk> =
      audioDownloadType === AudioDownloadType.WEB_ABR
        ? getWebAbrAudioChunks(targetWindow, videoId, controller.signal)
        : createAudioChunkStream(
            targetWindow,
            videoId,
            controller.signal,
            postProgress,
          );
    if (audioDownloadType === AudioDownloadType.WEB_ABR) {
      postProgress();
      heartbeat = setInterval(postProgress, 30_000);
    }

    for await (const chunk of chunks) {
      debug.log("Audio downloader. iframe chunk sent", {
        videoId,
        messageId: message.messageId,
        audioDownloadType,
        size: chunk.buffer.byteLength,
        isLastChunk: chunk.isLastChunk,
      });
      postResponse(source, event.origin, {
        ...message,
        messageDirection: "response",
        payload: chunk,
      });
    }
    settled = true;
    debug.log("Audio downloader. iframe stream closed", {
      videoId,
      messageId: message.messageId,
      audioDownloadType,
    });
    postResponse(source, event.origin, {
      ...message,
      messageDirection: "response",
      payload: undefined,
      isStreamFinished: true,
    });
  } catch (error) {
    settled = true;
    debug.error("Audio downloader. iframe request failed", {
      messageId: message.messageId,
      error: error instanceof Error ? error.message : String(error),
    });
    postResponse(source, event.origin, {
      ...message,
      messageDirection: "response",
      payload: undefined,
      error: error instanceof Error ? error.message : String(error),
      isAborted:
        controller.signal.aborted ||
        (error as { name?: string } | null)?.name === "AbortError",
    });
  } finally {
    clearInterval(heartbeat);
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
    if (session?.source === source && session.origin === event.origin) {
      session.iframe.contentWindow?.postMessage(message, "*");
      session.cleanup();
    }
    return;
  }

  const videoId = getVideoId(message);
  const audioDownloadType = getAudioDownloadType(message);
  if (!videoId || !audioDownloadType) {
    postResponse(source, event.origin, {
      ...message,
      messageDirection: "response",
      error: videoId
        ? "Audio downloader. Unsupported audio download type"
        : "Audio downloader. Missing video id",
    });
    return;
  }

  debug.log("Audio downloader. top request started", {
    videoId,
    messageId: message.messageId,
    audioDownloadType,
    host: targetWindow.location.hostname,
  });
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
  url.searchParams.set("html5", "1");
  url.searchParams.set("autoplay", "0");
  url.searchParams.set("mute", "1");
  url.hash = IFRAME_HASH;

  let active = true;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let onMessage = (_event: MessageEvent<MseMessage>) => {};
  const cleanup = () => {
    active = false;
    clearTimeout(timeout);
    targetWindow.removeEventListener("message", onMessage);
    if (topSessions.get(message.messageId)?.iframe === iframe) {
      topSessions.delete(message.messageId);
    }
    iframe.remove();
  };
  topSessions.set(message.messageId, {
    iframe,
    cleanup,
    source,
    origin: event.origin,
  });

  const embedConfig = await getEncryptedEmbedConfig(targetWindow, videoId);
  if (!active) return;
  if (embedConfig) url.searchParams.set("embed_config", embedConfig);

  let ready = false;
  onMessage = (responseEvent: MessageEvent<MseMessage>) => {
    const response = responseEvent.data;
    if (responseEvent.source !== iframe.contentWindow) return;
    if (response.messageType === READY_MESSAGE_TYPE) {
      if (ready) return;
      ready = true;
      clearTimeout(timeout);
      debug.log("Audio downloader. iframe ready", {
        videoId,
        messageId: message.messageId,
      });
      iframe.contentWindow?.postMessage(message, "*");
    } else if (
      response.messageId === message.messageId &&
      (response.error || response.isAborted || response.isStreamFinished)
    ) {
      queueMicrotask(cleanup);
    }
  };
  timeout = setTimeout(() => {
    debug.error("Audio downloader. iframe loading timed out", {
      videoId,
      messageId: message.messageId,
      ready,
    });
    postResponse(source, event.origin, {
      ...message,
      messageDirection: "response",
      error: "Audio downloader. iframe loading timed out",
    });
    cleanup();
  }, 15_000);

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
