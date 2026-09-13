/**
 * Streams the YouTube audio track from a realm that can talk to youtube.com.
 *
 * For the direct-URL strategy the page realm is preferred, because `ytcfg`,
 * cookies and the player functions are already there and no extra document has
 * to be loaded. When the page cannot do it (foreign host, or a CSP that blocks
 * the challenge solver), a hidden youtube.com iframe is used as a JS realm
 * only: its player stays paused, so no video content is requested.
 *
 * The MediaSource strategy always needs a fresh realm, because the capture
 * proxy has to be installed before a player boots. It is installed here, in
 * the hidden realm only, so the player the user is watching is never touched.
 */
import debug from "../../utils/debug";
import {
  isAbortError,
  makeAbortError,
  toErrorMessage,
} from "../../utils/errors";
import { PROGRESS_INTERVAL_MS } from "../internal/constants";
import { isYouTubeHost } from "../internal/hosts";
import type { AudioChunk } from "./audioChunks";
import {
  AudioDownloadType,
  type AvailableAudioDownloadType,
  getAudioRealmIframeId,
  IFRAME_HASH,
  isAudioDownloadType,
  MESSAGE_TYPE,
  READY_MESSAGE_TYPE,
} from "./bridgeProtocol";
import {
  getEncryptedEmbedConfig,
  getMseProxyAudioChunks,
  installAudioCaptureProxy,
} from "./mseProxy";
import { installPlayerResponseFilter } from "./playerResponseFilter";
import {
  AudioRealmError,
  canSolveChallengesInRealm,
  getWebAbrAudioChunks,
} from "./webAbr";

const REALM_LOAD_TIMEOUT_MS = 15_000;

type BridgeMessage = {
  messageId?: unknown;
  messageType?: unknown;
  messageDirection?: unknown;
  isAborted?: unknown;
  isStreamFinished?: unknown;
  error?: unknown;
  payload?: { pureVideoId?: unknown; audioDownloadType?: unknown } | null;
};

type HandlerWindow = Window & { __VOT_AUDIO_STREAM_HANDLER__?: boolean };

type Requester = { window: Window; origin: string; messageId: string };

function getVideoId(message: BridgeMessage): string | undefined {
  const videoId = message.payload?.pureVideoId;
  return typeof videoId === "string" && videoId ? videoId : undefined;
}

function getAudioDownloadType(
  message: BridgeMessage,
): AvailableAudioDownloadType | undefined {
  const audioDownloadType = message.payload?.audioDownloadType;
  return isAudioDownloadType(audioDownloadType) ? audioDownloadType : undefined;
}

function postResponse(
  requester: Requester,
  data: Record<string, unknown>,
): void {
  requester.window.postMessage(
    {
      messageId: requester.messageId,
      messageType: MESSAGE_TYPE,
      messageDirection: "response",
      ...data,
    },
    requester.origin,
  );
}

/**
 * @returns `true` when the requester got a final answer, `false` when the
 * caller should retry in a youtube.com realm.
 */
async function streamToRequester(
  realm: Window,
  requester: Requester,
  videoId: string,
  audioDownloadType: AvailableAudioDownloadType,
  signal: AbortSignal,
  allowFallback: boolean,
): Promise<boolean> {
  let emitted = false;
  // The bridge drops silent streams, so keep it awake between chunks.
  const sendProgress = () => postResponse(requester, { isProgress: true });
  const progress = setInterval(sendProgress, PROGRESS_INTERVAL_MS);
  const chunks: AsyncIterable<AudioChunk> =
    audioDownloadType === AudioDownloadType.WEB_ABR
      ? getWebAbrAudioChunks(realm, videoId, signal)
      : getMseProxyAudioChunks(realm, videoId, signal, sendProgress);
  try {
    for await (const chunk of chunks) {
      emitted = true;
      postResponse(requester, {
        payload: { buffer: chunk.buffer, isLastChunk: chunk.isLastChunk },
      });
    }
    postResponse(requester, { isStreamFinished: true });
    return true;
  } catch (error) {
    const aborted = isAbortError(error) || signal.aborted;
    const message = error instanceof Error ? error.message : String(error);
    // Retry in a youtube.com realm only when this realm is the problem.
    // YouTube answers a playability status the same way in every realm, so
    // repeating the whole client ladder inside a hidden iframe would only
    // double the requests and the wait before the server-side fallback.
    if (
      allowFallback &&
      !aborted &&
      !emitted &&
      error instanceof AudioRealmError
    ) {
      debug.log("Audio downloader. Page realm can not stream audio", {
        videoId,
        audioDownloadType,
        error: message,
      });
      return false;
    }
    postResponse(requester, {
      error: message,
      isAborted: aborted || undefined,
      isStreamFinished: true,
    });
    return true;
  } finally {
    clearInterval(progress);
  }
}

async function buildAudioRealmUrl(
  realm: Window,
  videoId: string,
  audioDownloadType: AvailableAudioDownloadType,
  signal: AbortSignal,
): Promise<string> {
  const url = new URL(
    `/embed/${encodeURIComponent(videoId)}`,
    "https://www.youtube.com",
  );
  url.searchParams.set("html5", "1");
  url.searchParams.set("mute", "1");
  const needsPlayback = audioDownloadType === AudioDownloadType.WEB_MSE_PROXY;
  // Playback is started through the player API instead: embed autoplay is
  // blocked without a user gesture in a hidden frame, and it would start
  // before the capture proxy is installed.
  url.searchParams.set("autoplay", "0");
  if (needsPlayback) {
    // Uploads that forbid embedding only play in an embed that carries the
    // encrypted config of the watch page. Requested for playback only, so the
    // direct-URL strategy stays at its two-request budget.
    const embedConfig = await getEncryptedEmbedConfig(realm, videoId, signal);
    if (embedConfig) url.searchParams.set("embed_config", embedConfig);
  }
  url.hash = IFRAME_HASH;
  return url.toString();
}

/**
 * Loads a hidden youtube.com realm and lets it answer the bridge directly, so
 * audio chunks are never copied twice.
 */
async function relayThroughAudioRealm(
  realm: Window,
  requester: Requester,
  videoId: string,
  audioDownloadType: AvailableAudioDownloadType,
  request: BridgeMessage,
  signal: AbortSignal,
): Promise<void> {
  const src = await buildAudioRealmUrl(
    realm,
    videoId,
    audioDownloadType,
    signal,
  );
  return new Promise<void>((resolve) => {
    const iframe = realm.document.createElement("iframe");
    iframe.id = getAudioRealmIframeId(requester.messageId);
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    // `display:none` iframes have no layout box and YouTube defers media
    // loading for players that are not rendered, so the realm stays rendered
    // but invisible and out of the visual path.
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:2px;height:2px;border:0;" +
      "padding:0;margin:0;opacity:0;visibility:hidden;pointer-events:none;";

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(loadTimeout);
      realm.removeEventListener("message", onRealmMessage);
      signal.removeEventListener("abort", onAbort);
      iframe.remove();
      resolve();
    };
    const onRealmMessage = (event: MessageEvent) => {
      const message = event.data as BridgeMessage | null;
      if (!message || event.source !== iframe.contentWindow) return;
      if (message.messageType === READY_MESSAGE_TYPE) {
        // DEFECT FIX (F-3): re-arm instead of disarming. READY only says
        // the realm booted; the request is posted right after, so the
        // watchdog now covers the first real answer as well.
        clearTimeout(loadTimeout);
        loadTimeout = setTimeout(onLoadTimeout, REALM_LOAD_TIMEOUT_MS);
        iframe.contentWindow?.postMessage(request, "*");
        return;
      }
      if (
        message.messageType !== MESSAGE_TYPE ||
        message.messageDirection !== "response" ||
        message.messageId !== requester.messageId
      ) {
        return;
      }
      // DEFECT FIX (F-3): the realm answered, so the watchdog is done. A
      // slow first chunk can no longer be mistaken for a dead realm.
      clearTimeout(loadTimeout);
      // The realm replies to the bridge itself; only its lifetime is managed here.
      if (message.isStreamFinished || message.error || message.isAborted) {
        finish();
      }
    };
    const onAbort = () => {
      iframe.contentWindow?.postMessage(
        {
          messageId: requester.messageId,
          messageType: MESSAGE_TYPE,
          messageDirection: "request",
          isAborted: true,
          isStreamFinished: true,
        },
        "*",
      );
      finish();
    };
    // DEFECT FIX (F-3): extracted and held in a reassignable binding so the
    // watchdog can be re-armed after READY.
    const onLoadTimeout = () => {
      postResponse(requester, {
        error: "Audio downloader. Audio realm loading timed out",
        isStreamFinished: true,
      });
      finish();
    };
    let loadTimeout = setTimeout(onLoadTimeout, REALM_LOAD_TIMEOUT_MS);

    realm.addEventListener("message", onRealmMessage);
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) {
      onAbort();
      return;
    }
    iframe.src = src;
    (realm.document.body ?? realm.document.documentElement).append(iframe);
  });
}

export function initPageAudioHandler(): void {
  const realm = globalThis as unknown as HandlerWindow;
  if (
    realm.__VOT_AUDIO_STREAM_HANDLER__ ||
    typeof realm.addEventListener !== "function" ||
    !realm.location
  ) {
    return;
  }
  realm.__VOT_AUDIO_STREAM_HANDLER__ = true;

  const isYouTubeRealm = isYouTubeHost(realm.location.hostname);
  const isAudioRealm =
    isYouTubeRealm &&
    realm.location.hash.includes(IFRAME_HASH) &&
    realm.self !== realm.top;
  // Only our own hidden realm is proxied, and it has to happen before the
  // embedded player creates its MediaSource.
  if (isAudioRealm) {
    try {
      installAudioCaptureProxy(realm);
    } catch (error) {
      debug.log("Audio downloader. MediaSource proxy unavailable", {
        error: toErrorMessage(error),
      });
    }
    try {
      // The player must never see the whole format ladder: its `player`
      // response is trimmed to one audio stream before it can boot, so the
      // bytes it buffers are the cheapest ones the upload offers.
      installPlayerResponseFilter(realm);
    } catch (error) {
      debug.log("Audio downloader. player format filter unavailable", {
        error: toErrorMessage(error),
      });
    }
  }
  const sessions = new Map<string, AbortController>();

  const handleRequest = async (
    event: MessageEvent,
    messageId: string,
  ): Promise<void> => {
    const message = event.data as BridgeMessage;
    const source = event.source as Window | null;
    if (!source) return;
    const requester: Requester = {
      window: source,
      origin: event.origin && event.origin !== "null" ? event.origin : "*",
      messageId,
    };
    const videoId = getVideoId(message);
    const audioDownloadType = getAudioDownloadType(message);
    if (!videoId || !audioDownloadType) {
      postResponse(requester, {
        error: videoId
          ? "Audio downloader. Unsupported audio download type"
          : "Audio downloader. Video ID is unavailable",
        isStreamFinished: true,
      });
      return;
    }

    const controller = new AbortController();
    sessions.set(messageId, controller);
    // The bridge gives up quickly when nothing answers at all, so the request
    // is acknowledged before the work starts: picking a client, solving sig/n
    // and fetching the first range together take longer than that budget.
    postResponse(requester, { isProgress: true });
    try {
      // Streaming in place saves a youtube.com document load, but sig/n can
      // only be solved where the CSP allows the challenge solver to run, and
      // the MediaSource capture needs a player that boots after the proxy.
      const canStreamHere =
        isAudioRealm ||
        (audioDownloadType === AudioDownloadType.WEB_ABR &&
          isYouTubeRealm &&
          canSolveChallengesInRealm(realm));
      if (
        canStreamHere &&
        (await streamToRequester(
          realm,
          requester,
          videoId,
          audioDownloadType,
          controller.signal,
          !isAudioRealm,
        ))
      ) {
        return;
      }
      await relayThroughAudioRealm(
        realm,
        requester,
        videoId,
        audioDownloadType,
        message,
        controller.signal,
      );
    } catch (error) {
      postResponse(requester, {
        error: toErrorMessage(error),
        isStreamFinished: true,
      });
    } finally {
      sessions.delete(messageId);
    }
  };

  realm.addEventListener("message", (event: MessageEvent) => {
    const message = event.data as BridgeMessage | null;
    if (
      !message ||
      message.messageType !== MESSAGE_TYPE ||
      message.messageDirection !== "request" ||
      typeof message.messageId !== "string"
    ) {
      return;
    }
    if (message.isAborted) {
      sessions
        .get(message.messageId)
        ?.abort(makeAbortError("Audio download aborted"));
      return;
    }
    void handleRequest(event, message.messageId);
  });

  if (isAudioRealm) {
    realm.parent.postMessage(
      { messageType: READY_MESSAGE_TYPE, messageDirection: "response" },
      "*",
    );
  }
}
