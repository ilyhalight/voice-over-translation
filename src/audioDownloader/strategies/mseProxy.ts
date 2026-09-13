/**
 * Copies the audio track out of the YouTube player itself.
 *
 * Since April 2025 the `WEB` client is answered with SABR-only formats: the
 * `adaptiveFormats` of the `player` response carry no `url` at all, so there
 * is nothing to request directly. The player still receives plain audio-only
 * segments and pushes them into a MediaSource audio buffer, so proxying
 * `appendBuffer` yields exactly the audio track (itag 251/140) and costs no
 * media request of our own.
 *
 * The proxy is installed only inside our own hidden youtube.com realm, so the
 * player the user is watching is never touched, and the video track is pinned
 * to the smallest available quality: only the audio stream is needed here.
 *
 * If an upload has no audio-only stream at all, the player opens a single
 * muxed buffer. That buffer is mirrored as the last resort of this strategy,
 * at the 144p quality the player was pinned to.
 */
import { config } from "@vot.js/shared";
import debug from "../../utils/debug";
import { toErrorMessage } from "../../utils/errors";
import { createAsyncQueue } from "../internal/asyncQueue";
import { createChunkAccumulator } from "../internal/chunkAccumulator";
import { PROGRESS_INTERVAL_MS } from "../internal/constants";
import { getYtcfgValue, type RealmWindow } from "../internal/realms";
import { waitForValue } from "../internal/settle";
import { type AudioChunk, concatBuffers } from "./audioChunks";
import { hasAudioCodec } from "./formatSelection";
import {
  installPlayerResponseFilter,
  PLAYER_FILTER_MODES,
  patchPlayerVarsMethods,
  type PlayerFormatFilter,
} from "./playerResponseFilter";

const STORE_KEY = "__VOT_AUDIO_CAPTURE_STORE__";
const PLAYER_TIMEOUT_MS = 30_000;
const PLAYBACK_TIMEOUT_MS = 30_000;
const CAPTURE_TIMEOUT_MS = 20_000;
const STALL_TIMEOUT_MS = 60_000;
/**
 * A seek makes the player request the next segments at once instead of at
 * playback speed, so it is debounced only long enough to answer a burst of
 * appends with a single seek.
 */
const SEEK_DELAY_MS = 200;
/**
 * The player only requests what it is about to play, so a hidden playback at
 * 1x would download a 25-minute track in 25 minutes. Chrome accepts rates up
 * to 16x and throws (or silently clamps) above that, so the highest rate the
 * element actually accepts is used.
 */
const FAST_PLAYBACK_RATES = [16, 8, 4, 2];
/** Used only when the page keeps its client version out of `ytcfg`. */
const FALLBACK_CLIENT_VERSION = "2.20260908.01.00";

/** YouTube player states: -1 unstarted, 1 playing, 2 paused, 5 cued. */
const UNSTARTED = -1;
const PLAYING = 1;

type YouTubePlayer = Element & {
  loadVideoById?: (videoId: string) => void;
  playVideo?: () => void;
  mute?: () => void;
  seekTo?: (seconds: number, allowSeekAhead?: boolean) => void;
  getPlayerState?: () => number;
  setPlaybackQualityRange?: (min: string, max?: string) => void;
  setPlaybackRate?: (rate: number) => void;
};

type YtcfgWindow = Window & {
  ytcfg?: { data_?: Record<string, unknown>; get?: (key: string) => unknown };
};

type CaptureWindow = Window & {
  MediaSource?: typeof MediaSource;
  ManagedMediaSource?: typeof MediaSource;
  [STORE_KEY]?: AudioCaptureStore;
};

type CaptureEvent =
  | {
      type: "append";
      /** `video` is only emitted for muxed buffers, as a last resort. */
      kind: "audio" | "video";
      buffer: Uint8Array;
      bufferedEnd: number;
    }
  | { type: "end" }
  | { type: "close" };

type CaptureListener = (event: CaptureEvent) => void;

/** Mirrors the audio buffers of a single MediaSource instance. */
class AudioCapture {
  private readonly listeners = new Set<CaptureListener>();
  private readonly queued: CaptureEvent[] = [];
  /** Set as soon as the player opens an audio-only buffer. */
  hasAudioBuffer = false;

  constructor(readonly mediaSource: MediaSource) {
    mediaSource.addSourceBuffer = new Proxy(mediaSource.addSourceBuffer, {
      apply: (target, thisArg, args: [string]) => {
        const sourceBuffer = Reflect.apply(target, thisArg, args);
        const mimeType = args[0] ?? "";
        if (mimeType.includes("audio/")) {
          this.hasAudioBuffer = true;
          this.captureBuffer(sourceBuffer, "audio");
        } else if (hasAudioCodec(mimeType)) {
          // A muxed buffer is the only video buffer worth mirroring: it is the
          // last resort for uploads without an audio-only stream.
          this.captureBuffer(sourceBuffer, "video");
        }
        return sourceBuffer;
      },
    });
    mediaSource.endOfStream = new Proxy(mediaSource.endOfStream, {
      apply: (target, thisArg, args: []) => {
        const result = Reflect.apply(target, thisArg, args);
        this.emit({ type: "end" });
        return result;
      },
    });
    mediaSource.addEventListener("sourceclose", () =>
      this.emit({ type: "close" }),
    );
  }

  get isOpen(): boolean {
    return this.mediaSource.readyState === "open";
  }

  listen(listener: CaptureListener): () => void {
    this.listeners.add(listener);
    for (const event of this.queued.splice(0)) listener(event);
    return () => this.listeners.delete(listener);
  }

  private captureBuffer(
    sourceBuffer: SourceBuffer,
    kind: "audio" | "video",
  ): void {
    sourceBuffer.appendBuffer = new Proxy(sourceBuffer.appendBuffer, {
      apply: (target, thisArg, args: [BufferSource]) => {
        const input = args[0];
        const view = ArrayBuffer.isView(input)
          ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
          : new Uint8Array(input);
        // The player reuses its transfer buffer, so the bytes are copied
        // before they are handed over.
        const buffer = new Uint8Array(view);
        const result = Reflect.apply(target, thisArg, args);
        const { buffered } = sourceBuffer;
        this.emit({
          type: "append",
          kind,
          buffer,
          bufferedEnd: buffered.length
            ? Math.floor(buffered.end(buffered.length - 1))
            : 0,
        });
        return result;
      },
    });
  }

  private emit(event: CaptureEvent): void {
    if (!this.listeners.size) {
      this.queued.push(event);
      return;
    }
    for (const listener of this.listeners) listener(event);
  }
}

class AudioCaptureStore {
  readonly captures: AudioCapture[] = [];
  private readonly listeners = new Set<(capture: AudioCapture) => void>();

  add(mediaSource: MediaSource): void {
    const capture = new AudioCapture(mediaSource);
    this.captures.push(capture);
    for (const listener of this.listeners) listener(capture);
  }

  onCapture(listener: (capture: AudioCapture) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

/**
 * Has to run before the player boots, otherwise its MediaSource is created
 * without the proxy and no append can be observed.
 */
export function installAudioCaptureProxy(
  targetWindow: CaptureWindow,
): AudioCaptureStore {
  const installed = targetWindow[STORE_KEY];
  if (installed) return installed;

  const key = targetWindow.ManagedMediaSource
    ? "ManagedMediaSource"
    : "MediaSource";
  const MediaSourceConstructor = targetWindow[key];
  if (!MediaSourceConstructor) {
    throw new Error("Audio downloader. MediaSource is unavailable");
  }

  const store = new AudioCaptureStore();
  // A subclass keeps `instanceof` and the prototype chain intact, which a
  // Proxy around a DOM constructor does not guarantee in Firefox.
  targetWindow[key] = class extends MediaSourceConstructor {
    constructor() {
      super();
      store.add(this as unknown as MediaSource);
    }
  };
  targetWindow[STORE_KEY] = store;
  return store;
}

/**
 * Resolves once `read()` answers, rejecting on timeout or abort.
 *
 * CONSOLIDATION: delegates to `internal/settle.waitForValue`. The timeout text
 * (`Audio downloader. <label>`) and the abort value (`signal.reason`, rethrown
 * raw) are injected, so nothing observable here changes.
 */
function waitFor<T>(
  read: () => T | undefined,
  subscribe: (notify: () => void) => () => void,
  timeoutMs: number,
  label: string,
  signal: AbortSignal,
): Promise<T> {
  return waitForValue<T>({
    read,
    subscribe,
    timeoutMs,
    label,
    timeoutMessage: `Audio downloader. ${label}`,
    signal,
    abortReason: () => signal.reason,
  });
}

function observeDocument(targetWindow: Window, notify: () => void): () => void {
  const observer = new (
    targetWindow as Window & { MutationObserver: typeof MutationObserver }
  ).MutationObserver(notify);
  observer.observe(targetWindow.document, { childList: true, subtree: true });
  targetWindow.addEventListener("load", notify);
  return () => {
    observer.disconnect();
    targetWindow.removeEventListener("load", notify);
  };
}

function waitForPlayer(
  targetWindow: Window,
  signal: AbortSignal,
): Promise<YouTubePlayer> {
  return waitFor(
    () =>
      targetWindow.document.querySelector<YouTubePlayer>("#movie_player") ??
      undefined,
    (notify) => observeDocument(targetWindow, notify),
    PLAYER_TIMEOUT_MS,
    "MSE player wait timed out",
    signal,
  );
}

/**
 * Starts a muted playback of the smallest video quality: the audio segments
 * are the only thing that is read from the player.
 */
function startAudioPlayback(
  player: YouTubePlayer,
  videoId: string,
  load = false,
): void {
  const steps = [
    () => player.mute?.(),
    () => player.setPlaybackQualityRange?.("tiny", "tiny"),
    () => player.playVideo?.(),
  ];
  // An embed that refuses the upload still boots a player, it just boots it
  // without a video, so the first attempt always loads one through the API.
  if (load) steps.unshift(() => player.loadVideoById?.(videoId));
  for (const start of steps) {
    try {
      start();
    } catch (error) {
      debug.log("Audio downloader. MSE playback setup failed", {
        videoId,
        error: toErrorMessage(error),
      });
    }
  }
}

/**
 * Buffers the track as fast as the player can be made to: the playback of the
 * hidden video runs at the highest rate it accepts, so segments are requested
 * in seconds instead of in real time. The rate is re-applied while the
 * capture runs, because the player resets it on a format switch or a reload.
 */
function forceFastBuffering(
  targetWindow: Window,
  player: YouTubePlayer,
): void {
  // The player replaces its video element on a reload, so the current one is
  // read every time instead of being remembered.
  const video = targetWindow.document.querySelector("video");
  if (!video) return;
  // A rate above 4x mutes the element in some browsers anyway, and nothing
  // here is meant to be heard.
  video.muted = true;
  for (const rate of FAST_PLAYBACK_RATES) {
    if (video.playbackRate >= rate) return;
    try {
      video.defaultPlaybackRate = rate;
      video.playbackRate = rate;
      // A clamped rate is reported back by the element itself.
      if (video.playbackRate < rate) continue;
      // The player keeps its own rate and would restore it on the next state
      // change, so it is told about the new one as well.
      player.setPlaybackRate?.(rate);
      return;
    } catch {
      // A rate the element refuses throws `RangeError`: try a lower one.
    }
  }
}

/** Reports what the hidden player is doing when playback never starts. */
function describePlayback(
  targetWindow: Window,
  player: YouTubePlayer,
  playRejection?: string,
): string {
  const video = targetWindow.document.querySelector("video");
  let state: number | string;
  try {
    state = player.getPlayerState?.() ?? "none";
  } catch {
    state = "unavailable";
  }
  return [
    `playerState: ${state}`,
    `playerError: ${player.classList.contains("ytp-error")}`,
    `videos: ${targetWindow.document.querySelectorAll("video").length}`,
    `readyState: ${video?.readyState ?? "none"}`,
    `mediaError: ${video?.error?.code ?? "none"}`,
    `playRejection: ${playRejection ?? "none"}`,
  ].join(", ");
}

/**
 * Playback is re-pressed on every player and media state change until a video
 * element actually reports playing: the player drops a play() it received
 * before it was ready.
 */
async function waitForPlayback(
  targetWindow: Window,
  player: YouTubePlayer,
  videoId: string,
  signal: AbortSignal,
): Promise<HTMLVideoElement> {
  const MEDIA_EVENTS = [
    "loadedmetadata",
    "canplay",
    "playing",
    "progress",
    "error",
  ];
  let playRejection: string | undefined;
  const read = () => {
    const videos = [...targetWindow.document.querySelectorAll("video")];
    const playing = videos.find((video) => video.readyState >= 3);
    if (playing) return playing;
    // A player that already reported an error never starts, so the strategy
    // gives up at once instead of after the whole timeout.
    if (player.classList.contains("ytp-error")) {
      throw new Error("Audio downloader. MSE player refused the video");
    }
    const state = player.getPlayerState?.() ?? UNSTARTED;
    if (state !== PLAYING) {
      startAudioPlayback(player, videoId);
      const video = videos[0];
      if (video) {
        video.muted = true;
        // A rejected play() proves the browser blocked muted autoplay.
        void video.play().catch((error: unknown) => {
          playRejection = error instanceof Error ? error.name : String(error);
        });
      }
    }
    return state === PLAYING ? videos[0] : undefined;
  };
  try {
    return await waitFor(
      read,
      (notify) => {
        const videos = new Set<HTMLVideoElement>();
        // A player can replace its video element, so new ones are bound as the
        // document changes.
        const bindVideos = () => {
          for (const video of targetWindow.document.querySelectorAll("video")) {
            if (videos.has(video)) continue;
            videos.add(video);
            for (const name of MEDIA_EVENTS) {
              video.addEventListener(name, notify);
            }
          }
        };
        const stopObserver = observeDocument(targetWindow, () => {
          bindVideos();
          notify();
        });
        bindVideos();
        return () => {
          stopObserver();
          for (const video of videos) {
            for (const name of MEDIA_EVENTS) {
              video.removeEventListener(name, notify);
            }
          }
        };
      },
      PLAYBACK_TIMEOUT_MS,
      "MSE playback wait timed out",
      signal,
    );
  } catch (error) {
    if (signal.aborted || !(error instanceof Error)) throw error;
    error.message = `${error.message} (${describePlayback(
      targetWindow,
      player,
      playRejection,
    )})`;
    throw error;
  }
}

function waitForAudioCapture(
  store: AudioCaptureStore,
  signal: AbortSignal,
): Promise<AudioCapture> {
  return waitFor(
    () => store.captures.findLast((capture) => capture.isOpen) ?? undefined,
    (notify) => store.onCapture(notify),
    CAPTURE_TIMEOUT_MS,
    `MSE capture wait timed out (captures: ${store.captures.length})`,
    signal,
  );
}

/** The itag the player was forced onto, and what it announced for it. */
function describeForcedFormat(
  filter: PlayerFormatFilter,
): Record<string, unknown> {
  const selection = filter.getSelection();
  return {
    mode: filter.getMode(),
    itag: selection?.audioItag ?? selection?.videoItag ?? "player choice",
    reason: selection?.reason ?? "formats untouched",
    track: selection?.track ?? "single",
    expectedLength: selection?.expectedLength ?? "unknown",
  };
}

/**
 * One capture pass: loads the video, then mirrors the buffer the player fills.
 *
 * Playback is nudged forward to the end of the buffered range instead of
 * waiting in real time, so a track is collected in a few seconds without any
 * additional media request.
 */
async function* captureMseStream(
  targetWindow: CaptureWindow,
  store: AudioCaptureStore,
  filter: PlayerFormatFilter,
  videoId: string,
  signal: AbortSignal,
  onProgress?: () => void,
): AsyncGenerator<AudioChunk> {
  const player = await waitForPlayer(targetWindow, signal);
  // The last entry point of a `player` response: a player that is handed its
  // formats directly instead of fetching them.
  patchPlayerVarsMethods(player, filter);
  startAudioPlayback(player, videoId, true);
  await waitForPlayback(targetWindow, player, videoId, signal);
  // The player only downloads what it is about to play, so its playback speed
  // is the download speed: at the highest rate the element accepts the whole
  // track is requested in seconds instead of in real time.
  forceFastBuffering(targetWindow, player);
  let capture = await waitForAudioCapture(store, signal);
  debug.log("Audio downloader. MSE capture started", {
    videoId,
    captures: store.captures.length,
    ...describeForcedFormat(filter),
  });

  // CONSOLIDATION: same producer/consumer queue as the audio bridge. Abort
  // and the stall watchdog become `fail()`, which keeps the original
  // precedence exactly: buffered events are consumed before either one is
  // observed (the old loop only checked them when `events` ran dry).
  const queue = createAsyncQueue<CaptureEvent>();
  const push = (event: CaptureEvent) => queue.push(event);

  let stopCapture = capture.listen(push);
  // The player replaces its MediaSource on a format switch; the newest one
  // continues the same track.
  const stopCaptureWatch = store.onCapture((next) => {
    stopCapture();
    capture = next;
    stopCapture = capture.listen(push);
  });
  const onAbort = () => queue.fail(signal.reason);
  signal.addEventListener("abort", onAbort, { once: true });
  // `throwIfAborted()` used to cover the already-aborted case on first pull.
  if (signal.aborted) onAbort();

  let seekTimeout: ReturnType<typeof setTimeout> | undefined;
  let stallTimeout: ReturnType<typeof setTimeout> | undefined;
  const armStall = () => {
    clearTimeout(stallTimeout);
    stallTimeout = setTimeout(() => {
      queue.fail(new Error("Audio downloader. MSE capture stalled"));
    }, STALL_TIMEOUT_MS);
  };
  // The bridge drops silent streams, so it is pinged while a chunk fills up.
  const progress = setInterval(() => onProgress?.(), PROGRESS_INTERVAL_MS);

  // CONSOLIDATION: the “buffer until `config.minChunkSize`” rule is shared
  // with `webAbr.streamMediaFormat` (`internal/chunkAccumulator.ts`).
  const accumulator = createChunkAccumulator(config.minChunkSize);
  let totalSize = 0;
  /** Fixed on the first mirrored append, so the tracks are never mixed. */
  let streamKind: "audio" | "video" | undefined;
  try {
    armStall();
    for await (const event of queue.drain()) {
      if (event.type === "close") {
        if (capture.isOpen) continue;
        throw new Error(
          `Audio downloader. MSE source closed early (${totalSize} bytes)`,
        );
      }
      if (event.type === "end") {
        if (!totalSize) {
          throw new Error("Audio downloader. Empty MSE audio stream");
        }
        debug.log("Audio downloader. MSE stream finished", {
          videoId,
          kind: streamKind ?? "audio",
          totalSize,
          ...describeForcedFormat(filter),
        });
        yield {
          buffer: accumulator.flush() ?? concatBuffers([]),
          isLastChunk: true,
        };
        return;
      }

      // An audio-only buffer always wins; the muxed copy is collected only
      // when the player opened no audio buffer at all.
      streamKind ??= capture.hasAudioBuffer ? "audio" : event.kind;
      if (event.kind !== streamKind) continue;

      armStall();
      const chunk = accumulator.add(event.buffer);
      totalSize += event.buffer.byteLength;
      if (event.bufferedEnd > 0) {
        // Seeking to the edge of the buffer makes the player fetch the next
        // part immediately instead of at playback speed. It is debounced so
        // a burst of appends costs a single seek.
        clearTimeout(seekTimeout);
        seekTimeout = setTimeout(() => {
          try {
            // Both are needed: the rate makes the player read ahead, the seek
            // skips the wait between two read-aheads. The player restores its
            // own rate on a format switch, so it is pressed again here.
            forceFastBuffering(targetWindow, player);
            player.seekTo?.(event.bufferedEnd, true);
          } catch (error) {
            queue.fail(
              error instanceof Error ? error : new Error(String(error)),
            );
          }
        }, SEEK_DELAY_MS);
      }
      if (!chunk) continue;
      yield { buffer: chunk, isLastChunk: false };
    }
  } finally {
    clearTimeout(seekTimeout);
    clearTimeout(stallTimeout);
    clearInterval(progress);
    stopCaptureWatch();
    stopCapture();
    signal.removeEventListener("abort", onAbort);
  }
}

/**
 * Streams the audio track the player itself is downloading.
 *
 * The `player` response is trimmed first, so the player has exactly one audio
 * format left and buffers the cheapest Opus stream (`itag 249`, ~6 MB for a
 * long video) instead of the `itag 251` its adaptive ladder would pick.
 *
 * If that pass yields nothing (player timeout, a fatal player error, an empty
 * stream), the emergency pass reloads the same video with only the 144p
 * picture left in the manifest: the cheapest thing the player can still be
 * made to deliver.
 */
export async function* getMseProxyAudioChunks(
  targetWindow: CaptureWindow,
  videoId: string,
  signal: AbortSignal,
  onProgress?: () => void,
): AsyncGenerator<AudioChunk> {
  // Installed by `pageAudioHandler` before the player booted; this only picks
  // up the filter of the realm and sets the mode of the pass.
  const filter = installPlayerResponseFilter(targetWindow);
  const store = installAudioCaptureProxy(targetWindow);
  let lastError: unknown;
  for (const mode of PLAYER_FILTER_MODES) {
    filter.setMode(mode);
    let emitted = false;
    try {
      for await (const chunk of captureMseStream(
        targetWindow,
        store,
        filter,
        videoId,
        signal,
        onProgress,
      )) {
        emitted = true;
        yield chunk;
      }
      return;
    } catch (error) {
      signal.throwIfAborted();
      // Bytes of this pass are already uploaded; restarting would splice two
      // different streams into one file.
      if (emitted) throw error;
      lastError = error;
      debug.log("Audio downloader. MSE capture failed", {
        videoId,
        mode,
        error: toErrorMessage(error),
      });
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Audio downloader. MSE capture unavailable");
}

/**
 * Videos whose embedding is restricted only play in an embed that carries the
 * encrypted config of the watch page. One request, and it is the difference
 * between a playable hidden realm and `Video unavailable`.
 */
export async function getEncryptedEmbedConfig(
  targetWindow: Window,
  videoId: string,
  signal: AbortSignal,
): Promise<string | undefined> {
  // protobuf: field 1 (video id) as a length-prefixed string.
  const bytes = Uint8Array.from([
    10,
    videoId.length,
    ...[...videoId].map((character) => character.charCodeAt(0)),
  ]);
  // InnerTube answers a share panel only for a real client release, so the
  // version the page itself sends is reused.
  // CONSOLIDATION: the accessor-then-backing-store lookup lives in
  // `internal/realms.ts` (it was also inlined as `webAbr.getConfigValue`).
  const pageVersion = getYtcfgValue(
    targetWindow as unknown as RealmWindow,
    "INNERTUBE_CLIENT_VERSION",
  );
  const clientVersion =
    typeof pageVersion === "string" && pageVersion
      ? pageVersion
      : FALLBACK_CLIENT_VERSION;
  try {
    const response = await targetWindow.fetch(
      "https://www.youtube.com/youtubei/v1/share/get_share_panel?prettyPrint=false",
      {
        method: "POST",
        credentials: "include",
        signal,
        headers: {
          "content-type": "application/json",
          "x-youtube-client-name": "1",
          "x-youtube-client-version": clientVersion,
        },
        body: JSON.stringify({
          context: { client: { clientName: "WEB", clientVersion } },
          serializedSharedEntity: encodeURIComponent(
            targetWindow.btoa(String.fromCharCode(...bytes)),
          ),
        }),
      },
    );
    if (!response.ok) return;
    const encrypted = /"encryptedEmbedConfig"\s*:\s*("[^"]+")/.exec(
      await response.text(),
    )?.[1];
    return encrypted ? `{"enc":${encrypted}}` : undefined;
  } catch (error) {
    signal.throwIfAborted();
    debug.log("Audio downloader. Embed config unavailable", {
      videoId,
      error: toErrorMessage(error),
    });
  }
}
