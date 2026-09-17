import { describe, expect, test } from "bun:test";

(globalThis as unknown as { DEBUG_MODE: boolean }).DEBUG_MODE = false;
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  },
});

const { VOTTranslationHandler } = await import(
  "../src/core/translationHandler"
);
const { requestTranslationAudio } = await import(
  "../src/videoHandler/modules/translationShared"
);
const { pauseVideoForTranslation, resumeVideoAfterTranslation } = await import(
  "../src/videoHandler/modules/translationPlayback"
);

function createFakeVideo() {
  const playListeners = new Map<() => void, boolean>();
  const video = {
    paused: false,
    ended: false,
    pauseCalls: 0,
    playCalls: 0,
    addEventListener(
      type: string,
      listener: () => void,
      options?: { once?: boolean },
    ) {
      if (type !== "play") return;
      playListeners.set(listener, Boolean(options?.once));
    },
    removeEventListener(type: string, listener: () => void) {
      if (type !== "play") return;
      playListeners.delete(listener);
    },
    pause() {
      video.pauseCalls += 1;
      video.paused = true;
    },
    play() {
      video.playCalls += 1;
      video.paused = false;
      return Promise.resolve();
    },
    emit(type: string) {
      if (type !== "play") return;
      for (const [listener, once] of [...playListeners]) {
        if (once) playListeners.delete(listener);
        listener();
      }
    },
  };
  return video;
}

function createPlaybackHandler() {
  return {
    data: { autoPauseOnTranslate: true },
    video: createFakeVideo(),
    pausedByTranslation: false,
    hasActiveSource: () => true,
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
    getRequestLangForTranslation: () => "en",
    isLivelyVoiceAllowed: () => false,
    isYouTubeHosts: () => false,
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
