import { describe, expect, test } from "bun:test";
import { emptyStorage } from "./helpers/storage";

(globalThis as unknown as { DEBUG_MODE: boolean }).DEBUG_MODE = false;
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: emptyStorage(),
});

const { VOTTranslationHandler } = await import(
  "../src/core/translationHandler"
);
const { requestTranslationAudio } = await import(
  "../src/videoHandler/modules/translationShared"
);
const {
  cancelDeferredTranslationResume,
  pauseVideoForTranslation,
  resumeVideoAfterTranslation,
} = await import("../src/videoHandler/modules/translationPlayback");

type FakeListenerOptions = { once?: boolean; signal?: AbortSignal };

function createFakeEventTarget() {
  const listeners = new Map<string, Map<() => void, boolean>>();
  const forType = (type: string) => {
    let map = listeners.get(type);
    if (!map) {
      map = new Map();
      listeners.set(type, map);
    }
    return map;
  };
  return {
    addEventListener(
      type: string,
      listener: () => void,
      options?: FakeListenerOptions,
    ) {
      if (options?.signal?.aborted) return;
      forType(type).set(listener, Boolean(options?.once));
      options?.signal?.addEventListener("abort", () =>
        forType(type).delete(listener),
      );
    },
    removeEventListener(type: string, listener: () => void) {
      forType(type).delete(listener);
    },
    emit(type: string) {
      for (const [listener, once] of [...forType(type)]) {
        if (once) forType(type).delete(listener);
        listener();
      }
    },
    listenerCount(type: string) {
      return forType(type).size;
    },
  };
}

function createFakeVideo() {
  const target = createFakeEventTarget();
  const video = {
    ...target,
    paused: false,
    ended: false,
    pauseCalls: 0,
    playCalls: 0,
    pause() {
      video.pauseCalls += 1;
      video.paused = true;
    },
    play() {
      video.playCalls += 1;
      video.paused = false;
      return Promise.resolve();
    },
  };
  return video;
}

function createPlaybackHandler() {
  return {
    data: { autoPauseOnTranslate: true },
    video: createFakeVideo(),
    pausedByTranslation: false,
    cancelDeferredTranslationResume: null as (() => void) | null,
    hasActiveSource: () => true,
  };
}

function installFakeDocument(visibilityState: "visible" | "hidden") {
  const target = createFakeEventTarget();
  const fakeDocument = Object.assign(target, {
    visibilityState,
    pictureInPictureElement: undefined as unknown,
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: fakeDocument,
  });
  return {
    document: fakeDocument,
    setVisibility(next: "visible" | "hidden") {
      fakeDocument.visibilityState = next;
      fakeDocument.emit("visibilitychange");
    },
    restore() {
      Reflect.deleteProperty(globalThis, "document");
    },
  };
}

function createTranslationHandlerForResponse(
  response: Record<string, unknown>,
) {
  const controller = new AbortController();
  const handler = {
    autoRetry: undefined as ReturnType<typeof setTimeout> | undefined,
    data: { useLivelyVoice: false },
    votClient: { translateVideo: async () => response },
    isLivelyVoiceAllowed: () => false,
    isYouTubeHosts: () => false,
    ensureProxySettingsResolved: async () => undefined,
    updateTranslationErrorMsg: async () => undefined,
    hadAsyncWait: false,
    notifier: { translationFailed: () => undefined },
  };
  return { handler, controller };
}

const videoData = { videoId: "video", duration: 10 };

describe("translation auto-pause", () => {
  test("ready first response never pauses playback", async () => {
    const { handler, controller } = createTranslationHandlerForResponse({
      translated: true,
      remainingTime: 0,
    });
    const translationHandler = new VOTTranslationHandler(handler as never);
    const playback = createPlaybackHandler();
    let waitingCalls = 0;

    const result = await translationHandler.translateVideoImpl(
      videoData as never,
      "en" as never,
      "ru" as never,
      null,
      false,
      controller.signal,
      {
        onTranslationWaiting: () => {
          waitingCalls += 1;
          pauseVideoForTranslation(playback as never);
        },
      },
    );

    expect(result).not.toBeNull();
    expect(waitingCalls).toBe(0);
    expect(playback.video.pauseCalls).toBe(0);
    expect(playback.pausedByTranslation).toBe(false);
  });

  test("unfinished response with zero remaining time does not pause", async () => {
    const { handler, controller } = createTranslationHandlerForResponse({
      translated: false,
      remainingTime: 0,
      message: "processing",
    });
    const translationHandler = new VOTTranslationHandler(handler as never);
    const playback = createPlaybackHandler();
    let waitingCalls = 0;
    let translateRequests = 0;
    const translateVideo = handler.votClient.translateVideo;
    handler.votClient.translateVideo = async () => {
      translateRequests += 1;
      return translateVideo();
    };

    const pending = translationHandler
      .translateVideoImpl(
        videoData as never,
        "en" as never,
        "ru" as never,
        null,
        false,
        controller.signal,
        {
          onTranslationWaiting: () => {
            waitingCalls += 1;
            pauseVideoForTranslation(playback as never);
          },
        },
      )
      .catch(() => null);

    // Let the response settle, then cancel the long retry.
    setTimeout(() => controller.abort(), 0);
    await pending;

    expect(translateRequests).toBe(1);
    expect(waitingCalls).toBe(0);
    expect(playback.video.pauseCalls).toBe(0);
    expect(playback.pausedByTranslation).toBe(false);
  });

  test("waiting response pauses once, then resume plays after readiness", async () => {
    const { handler, controller } = createTranslationHandlerForResponse({
      translated: false,
      remainingTime: 5,
      message: "processing",
    });
    const translationHandler = new VOTTranslationHandler(handler as never);
    const playback = createPlaybackHandler();
    let waitingCalls = 0;

    const pending = translationHandler
      .translateVideoImpl(
        videoData as never,
        "en" as never,
        "ru" as never,
        null,
        false,
        controller.signal,
        {
          onTranslationWaiting: () => {
            waitingCalls += 1;
            pauseVideoForTranslation(playback as never);
            // Cancel the long retry so the test settles immediately.
            controller.abort();
          },
        },
      )
      .catch(() => null);

    await pending;
    expect(waitingCalls).toBe(1);
    expect(playback.video.pauseCalls).toBe(1);
    expect(playback.pausedByTranslation).toBe(true);

    // Repeated "waiting" polls must not stack pauses.
    pauseVideoForTranslation(playback as never);
    expect(playback.video.pauseCalls).toBe(1);

    // Translation became ready -> playback resumes exactly once.
    resumeVideoAfterTranslation(playback as never);
    expect(playback.video.playCalls).toBe(1);
    expect(playback.pausedByTranslation).toBe(false);

    resumeVideoAfterTranslation(playback as never);
    expect(playback.video.playCalls).toBe(1);
  });

  test("requestTranslationAudio deduplicates waiting and respects manual play", async () => {
    const controller = new AbortController();
    const playback = createPlaybackHandler();
    let cleanupPauseListener: (() => void) | undefined;
    let callbackCalls = 0;

    const requester = {
      async translateVideoImpl(
        _videoData: unknown,
        _requestLang: unknown,
        _responseLang: unknown,
        _translationHelp: unknown,
        _shouldSendFailedAudio: unknown,
        _signal: unknown,
        options?: { onTranslationWaiting?: () => void },
      ) {
        // First waiting poll pauses the video.
        options?.onTranslationWaiting?.();
        expect(playback.video.pauseCalls).toBe(1);
        expect(playback.pausedByTranslation).toBe(true);

        // User presses Play manually while still waiting.
        playback.video.emit("play");
        expect(playback.pausedByTranslation).toBe(false);

        // Subsequent polling responses arrive: they must not re-pause.
        options?.onTranslationWaiting?.();
        options?.onTranslationWaiting?.();

        return { url: "https://example.com/audio.mp3", usedLivelyVoice: false };
      },
    };

    const result = await requestTranslationAudio(requester as never, {
      videoData: videoData as never,
      requestLang: "en" as never,
      responseLang: "ru" as never,
      translationHelp: null,
      signal: controller.signal,
      onTranslationWaiting: () => {
        callbackCalls += 1;
        cleanupPauseListener = pauseVideoForTranslation(playback as never);
      },
    });

    expect(result).not.toBeNull();
    expect(callbackCalls).toBe(1);
    expect(playback.video.pauseCalls).toBe(1);

    // translateFunc finally: cleanup is harmless after the once-listener
    // fired, and resume must not force playback over the manual play.
    cleanupPauseListener?.();
    resumeVideoAfterTranslation(playback as never);
    expect(playback.video.playCalls).toBe(0);
    expect(playback.pausedByTranslation).toBe(false);
  });

  test("cleanup removes a dangling play listener before resume", () => {
    const playback = createPlaybackHandler();

    const cleanup = pauseVideoForTranslation(playback as never);
    expect(typeof cleanup).toBe("function");

    // Remove the listener before it fires; a later manual play event must not
    // reset the paused-by-translation flag.
    cleanup?.();
    playback.video.emit("play");
    expect(playback.pausedByTranslation).toBe(true);

    // Calling cleanup again after the listener is gone is harmless.
    cleanup?.();
    expect(playback.pausedByTranslation).toBe(true);
  });
});

describe("translation auto-pause in a hidden page", () => {
  function pausedPlayback() {
    const playback = createPlaybackHandler();
    pauseVideoForTranslation(playback as never)?.();
    expect(playback.video.paused).toBe(true);
    return playback;
  }

  test("keeps the video paused until the page becomes visible", () => {
    const page = installFakeDocument("hidden");
    try {
      const playback = pausedPlayback();

      resumeVideoAfterTranslation(playback as never);
      expect(playback.video.playCalls).toBe(0);
      expect(playback.pausedByTranslation).toBe(true);

      page.setVisibility("hidden");
      expect(playback.video.playCalls).toBe(0);

      page.setVisibility("visible");
      expect(playback.video.playCalls).toBe(1);
      expect(playback.pausedByTranslation).toBe(false);
      expect(playback.cancelDeferredTranslationResume).toBeNull();
      expect(page.document.listenerCount("visibilitychange")).toBe(0);
      expect(playback.video.listenerCount("play")).toBe(0);

      page.setVisibility("hidden");
      page.setVisibility("visible");
      expect(playback.video.playCalls).toBe(1);
    } finally {
      page.restore();
    }
  });

  test("resumes immediately when the page is visible", () => {
    const page = installFakeDocument("visible");
    try {
      const playback = pausedPlayback();

      resumeVideoAfterTranslation(playback as never);
      expect(playback.video.playCalls).toBe(1);
      expect(page.document.listenerCount("visibilitychange")).toBe(0);
    } finally {
      page.restore();
    }
  });

  test("manual play cancels the deferred resume", () => {
    const page = installFakeDocument("hidden");
    try {
      const playback = pausedPlayback();
      resumeVideoAfterTranslation(playback as never);

      playback.video.emit("play");
      expect(playback.pausedByTranslation).toBe(false);
      expect(page.document.listenerCount("visibilitychange")).toBe(0);

      page.setVisibility("visible");
      expect(playback.video.playCalls).toBe(0);
    } finally {
      page.restore();
    }
  });

  test("cancelDeferredTranslationResume keeps the video paused", () => {
    const page = installFakeDocument("hidden");
    try {
      const playback = pausedPlayback();
      resumeVideoAfterTranslation(playback as never);

      cancelDeferredTranslationResume(playback as never);
      expect(playback.pausedByTranslation).toBe(false);
      expect(playback.cancelDeferredTranslationResume).toBeNull();
      expect(page.document.listenerCount("visibilitychange")).toBe(0);
      expect(playback.video.listenerCount("play")).toBe(0);

      page.setVisibility("visible");
      expect(playback.video.playCalls).toBe(0);
    } finally {
      page.restore();
    }
  });

  test("resumes immediately when the video is in Picture-in-Picture", () => {
    const page = installFakeDocument("hidden");
    try {
      const playback = pausedPlayback();
      page.document.pictureInPictureElement = playback.video;

      resumeVideoAfterTranslation(playback as never);
      expect(playback.video.playCalls).toBe(1);
      expect(playback.pausedByTranslation).toBe(false);
      expect(playback.cancelDeferredTranslationResume).toBeNull();
      expect(page.document.listenerCount("visibilitychange")).toBe(0);
    } finally {
      page.restore();
    }
  });

  test("still defers when another element is in Picture-in-Picture", () => {
    const page = installFakeDocument("hidden");
    try {
      const playback = pausedPlayback();
      page.document.pictureInPictureElement = createFakeVideo();

      resumeVideoAfterTranslation(playback as never);
      expect(playback.video.playCalls).toBe(0);
      expect(playback.pausedByTranslation).toBe(true);
      expect(page.document.listenerCount("visibilitychange")).toBe(1);
    } finally {
      page.restore();
    }
  });

  test("still defers when nothing is in Picture-in-Picture", () => {
    const page = installFakeDocument("hidden");
    try {
      const playback = pausedPlayback();
      page.document.pictureInPictureElement = null;

      resumeVideoAfterTranslation(playback as never);
      expect(playback.video.playCalls).toBe(0);
      expect(page.document.listenerCount("visibilitychange")).toBe(1);
    } finally {
      page.restore();
    }
  });

  test("does not defer when there is no active source", () => {
    const page = installFakeDocument("hidden");
    try {
      const playback = pausedPlayback();
      playback.hasActiveSource = () => false;

      resumeVideoAfterTranslation(playback as never);
      expect(playback.pausedByTranslation).toBe(false);
      expect(playback.video.playCalls).toBe(0);
      expect(page.document.listenerCount("visibilitychange")).toBe(0);
    } finally {
      page.restore();
    }
  });
});
