import { describe, expect, test } from "bun:test";
import { VideoTranslationStatus } from "@vot.js/core/types/providers/yandex";

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
const { strategies, WEB_ABR_STRATEGY, WEB_MSE_PROXY_STRATEGY } = await import(
  "../src/audioDownloader/strategies/index"
);

const tick = (ms = 10) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("fatal audio upload failure keeps preparing source", () => {
  test("no later chunk is uploaded but preparation completes and caches", async () => {
    const handlerCtor = VOTTranslationHandler as unknown as {
      AUDIO_UPLOAD_RETRY_DELAY_MS: number;
    };
    const prevDelay = handlerCtor.AUDIO_UPLOAD_RETRY_DELAY_MS;
    handlerCtor.AUDIO_UPLOAD_RETRY_DELAY_MS = 0;

    type Strategy = (typeof strategies)[keyof typeof strategies];
    const table = strategies as unknown as Record<string, Strategy>;
    const prevAbr = table[WEB_ABR_STRATEGY];
    const prevMse = table[WEB_MSE_PROXY_STRATEGY];

    let uploadCalls = 0;
    const errorArgs: unknown[] = [];
    let yieldedChunks = 0;
    let producerSignal: AbortSignal | null = null;
    const producerDone = deferred<void>();

    table[WEB_ABR_STRATEGY] = async (options: {
      videoId: string;
      signal: AbortSignal;
    }) => {
      producerSignal = options.signal;
      return {
        fileId: "test-file",
        mediaPartsLength: null,
        getMediaBuffers: async function* () {
          try {
            const chunks = [
              { size: 10, last: false },
              { size: 10, last: false },
              { size: 10, last: true },
            ];
            for (const chunk of chunks) {
              yieldedChunks += 1;
              yield {
                buffer: new Uint8Array(chunk.size).fill(1),
                isLastChunk: chunk.last,
              };
            }
          } finally {
            producerDone.resolve();
          }
        },
      };
    };
    table[WEB_MSE_PROXY_STRATEGY] = async () => {
      throw new Error("fallback should not run");
    };

    const videoHandler: any = {
      data: { useAudioDownload: true, useLivelyVoice: false },
      site: { host: "youtube" },
      votClient: {
        translateVideo: async () => ({
          status: VideoTranslationStatus.AUDIO_REQUESTED,
          translated: false,
          remainingTime: 0,
          translationId: "tr1",
        }),
        provider: {
          requestVtransAudio: async () => {
            uploadCalls += 1;
            throw new Error("PUT failed");
          },
          requestVtransFailAudio: async () => undefined,
        },
      },
      getRequestLangForTranslation: () => "en",
      isLivelyVoiceAllowed: () => false,
      isYouTubeHosts: () => true,
      updateTranslationErrorMsg: async (message: unknown) => {
        errorArgs.push(message);
      },
      hadAsyncWait: false,
      notifier: { translationFailed: () => undefined },
      actionsAbortController: { signal: { aborted: false } },
    };

    try {
      const handler = new VOTTranslationHandler(videoHandler);
      const external = new AbortController();
      const result = await handler.translateVideoImpl(
        { videoId: "vid-fatal", duration: 10 } as never,
        "en" as never,
        "ru" as never,
        null,
        false,
        external.signal,
      );

      expect(result).toBeNull();
      expect((handler as any).downloading).toBe(false);
      // The PUT failure must reach the normal failure UI path as a real Error,
      // not be misclassified as a user cancellation by an AbortError race.
      const uiError = errorArgs.find(
        (arg): arg is Error => arg instanceof Error,
      );
      expect(uiError).toBeDefined();
      expect(uiError?.name).not.toBe("AbortError");
      // First chunk: initial attempt + 5 retries (= 6 attempts), then stop.
      expect(uploadCalls).toBe(6);

      // The producer is not aborted: it finishes collecting every chunk and
      // populates the single-entry cache for a same-video retry.
      await producerDone.promise;
      await tick();
      expect(producerSignal).not.toBeNull();
      expect((producerSignal as unknown as AbortSignal).aborted).toBe(false);
      expect(yieldedChunks).toBe(3);
      const cached = (handler as any).audioDownloader.completedAudioCache;
      expect(cached?.videoId).toBe("vid-fatal");
      expect(cached?.fileId).toBe("test-file");
      expect(cached?.chunks.length).toBe(3);
      // Caller's external signal is untouched.
      expect(external.signal.aborted).toBe(false);
    } finally {
      handlerCtor.AUDIO_UPLOAD_RETRY_DELAY_MS = prevDelay;
      table[WEB_ABR_STRATEGY] = prevAbr;
      table[WEB_MSE_PROXY_STRATEGY] = prevMse;
    }
  });

  test("stale run failure cannot affect a newer run", async () => {
    const videoHandler: any = {
      data: {},
      site: { host: "youtube" },
      votClient: { provider: {} },
      updateTranslationErrorMsg: async () => undefined,
    };
    const handler = new VOTTranslationHandler(videoHandler) as any;
    const external = new AbortController();

    const first = handler.startAudioRun(external.signal, "tr-old", "v-old");
    expect(first.signal.aborted).toBe(false);
    const second = handler.startAudioRun(external.signal, "tr-new", "v-new");
    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(false);

    handler.downloading = true;
    handler.finishDownloadFailure(new Error("stale"), first.runId);
    expect(second.signal.aborted).toBe(false);
    expect(handler.downloading).toBe(true);

    // A current-run failure reports the error without killing the source
    // preparation; only an external/user abort stops the shared signal.
    handler.finishDownloadFailure(new Error("current"), second.runId);
    expect(handler.downloading).toBe(false);
    expect(second.signal.aborted).toBe(false);
    external.abort();
    expect(second.signal.aborted).toBe(true);
  });

  test("stale translation events are ignored by the active run", async () => {
    let uploadCalls = 0;
    const failAudioCalls: string[] = [];
    const videoHandler: any = {
      data: { useAudioDownload: false },
      site: { host: "youtube" },
      votClient: {
        provider: {
          requestVtransAudio: async () => {
            uploadCalls += 1;
          },
          requestVtransFailAudio: async (url: string) => {
            failAudioCalls.push(url);
          },
        },
      },
      updateTranslationErrorMsg: async () => undefined,
    };
    const handler = new VOTTranslationHandler(videoHandler) as any;
    const external = new AbortController().signal;

    const stale = handler.startAudioRun(external, "tr-old", "v-old");
    const active = handler.startAudioRun(external, "tr-new", "v-new");
    expect(stale.signal.aborted).toBe(true);
    handler.downloading = true;

    await handler.onDownloadedAudio("tr-old", {
      videoId: "v",
      fileId: "f",
      audioData: new Uint8Array([1]),
    });
    await handler.onDownloadedPartialAudio("tr-old", {
      videoId: "v",
      fileId: "f",
      audioData: new Uint8Array([1]),
      version: 1,
      index: 0,
      amount: 1,
    });
    await handler.onDownloadAudioError("tr-old", "v");

    expect(uploadCalls).toBe(0);
    expect(failAudioCalls).toEqual([]);
    expect(handler.downloading).toBe(true);
    expect(active.signal.aborted).toBe(false);

    // The newer run state survived the stale events and still accepts its own.
    await handler.onDownloadedAudio("tr-new", {
      videoId: "v",
      fileId: "f",
      audioData: new Uint8Array([1]),
    });
    expect(uploadCalls).toBe(1);
  });

  test("external abort clears download waiters and resets the run", async () => {
    type Strategy = (typeof strategies)[keyof typeof strategies];
    const table = strategies as unknown as Record<string, Strategy>;
    const prevAbr = table[WEB_ABR_STRATEGY];
    let producerSignal: AbortSignal | null = null;

    table[WEB_ABR_STRATEGY] = async (options: {
      videoId: string;
      signal: AbortSignal;
    }) => {
      producerSignal = options.signal;
      return {
        fileId: "abort-file",
        mediaPartsLength: null,
        getMediaBuffers: async function* () {
          await new Promise<void>((resolve) => {
            if (options.signal.aborted) return resolve();
            options.signal.addEventListener("abort", () => resolve(), {
              once: true,
            });
          });
        },
      };
    };

    const videoHandler: any = {
      data: { useAudioDownload: true, useLivelyVoice: false },
      site: { host: "youtube" },
      votClient: {
        translateVideo: async () => ({
          status: VideoTranslationStatus.AUDIO_REQUESTED,
          translated: false,
          remainingTime: 0,
          translationId: "tr-abort",
        }),
        provider: {
          requestVtransAudio: async () => undefined,
          requestVtransFailAudio: async () => undefined,
        },
      },
      getRequestLangForTranslation: () => "en",
      isLivelyVoiceAllowed: () => false,
      isYouTubeHosts: () => true,
      updateTranslationErrorMsg: async () => undefined,
      hadAsyncWait: false,
      notifier: { translationFailed: () => undefined },
      actionsAbortController: { signal: { aborted: false } },
    };

    try {
      const handler = new VOTTranslationHandler(videoHandler) as any;
      const external = new AbortController();
      const operation = handler.translateVideoImpl(
        { videoId: "vid-abort", duration: 10 },
        "en",
        "ru",
        null,
        false,
        external.signal,
      );

      while (!producerSignal) await tick(0);
      external.abort();

      expect(await operation).toBeNull();
      expect((producerSignal as unknown as AbortSignal).aborted).toBe(true);
      expect(handler.downloading).toBe(false);
      expect(handler.downloadSettlers.size).toBe(0);
    } finally {
      table[WEB_ABR_STRATEGY] = prevAbr;
    }
  });

  test("immediate same-video retry waits for preparation and replays cache", async () => {
    const handlerCtor = VOTTranslationHandler as unknown as {
      AUDIO_UPLOAD_RETRY_DELAY_MS: number;
    };
    const prevDelay = handlerCtor.AUDIO_UPLOAD_RETRY_DELAY_MS;
    handlerCtor.AUDIO_UPLOAD_RETRY_DELAY_MS = 0;

    type Strategy = (typeof strategies)[keyof typeof strategies];
    const table = strategies as unknown as Record<string, Strategy>;
    const prevAbr = table[WEB_ABR_STRATEGY];
    const prevMse = table[WEB_MSE_PROXY_STRATEGY];

    const release = deferred<void>();
    const blocked = deferred<void>();
    const producerFinished = deferred<void>();
    let strategyCalls = 0;
    let index5Attempts = 0;
    let translateCalls = 0;
    const uploads: {
      translationId: string;
      chunkId: number;
      fileId: string;
    }[] = [];

    table[WEB_ABR_STRATEGY] = async () => {
      strategyCalls += 1;
      return {
        fileId: "orig-file",
        mediaPartsLength: null,
        getMediaBuffers: async function* () {
          try {
            for (let index = 0; index < 12; index++) {
              if (index === 7) {
                blocked.resolve();
                await release.promise;
              }
              yield {
                buffer: new Uint8Array(10).fill(1),
                isLastChunk: index === 11,
              };
            }
          } finally {
            producerFinished.resolve();
          }
        },
      };
    };
    table[WEB_MSE_PROXY_STRATEGY] = async () => {
      throw new Error("fallback should not run");
    };

    const videoHandler: any = {
      data: { useAudioDownload: true, useLivelyVoice: false },
      site: { host: "youtube" },
      votClient: {
        translateVideo: async () => {
          translateCalls += 1;
          if (translateCalls <= 2) {
            return {
              status: VideoTranslationStatus.AUDIO_REQUESTED,
              translated: false,
              remainingTime: 0,
              translationId: translateCalls === 1 ? "tr-1" : "tr-2",
            };
          }
          return {
            status: VideoTranslationStatus.TRANSLATED,
            translated: true,
            remainingTime: 0,
            translationId: "tr-2",
            url: "https://example.com/audio.mp3",
          };
        },
        provider: {
          requestVtransAudio: async (
            _url: string,
            translationId: string,
            data: { chunkId?: number },
            opts: { fileId?: string },
          ) => {
            const chunkId = data.chunkId ?? -1;
            uploads.push({
              translationId,
              chunkId,
              fileId: opts?.fileId ?? "",
            });
            if (chunkId === 5 && index5Attempts < 6) {
              index5Attempts += 1;
              throw new Error("PUT failed");
            }
          },
          requestVtransFailAudio: async () => undefined,
        },
      },
      getRequestLangForTranslation: () => "en",
      isLivelyVoiceAllowed: () => false,
      isYouTubeHosts: () => true,
      updateTranslationErrorMsg: async () => undefined,
      hadAsyncWait: false,
      notifier: { translationFailed: () => undefined },
      actionsAbortController: { signal: { aborted: false } },
    };

    try {
      const handler = new VOTTranslationHandler(videoHandler);
      const external = new AbortController();
      const videoData = { videoId: "vid-retry", duration: 10 } as never;

      const first = handler.translateVideoImpl(
        videoData,
        "en" as never,
        "ru" as never,
        null,
        false,
        external.signal,
      );
      await blocked.promise;
      expect(await first).toBeNull();

      // Retry while the source producer is still blocked: it must queue behind
      // the in-flight preparation, not start a second download.
      const second = handler.translateVideoImpl(
        videoData,
        "en" as never,
        "ru" as never,
        null,
        false,
        external.signal,
      );
      await tick();
      expect(strategyCalls).toBe(1);

      release.resolve();
      await producerFinished.promise;
      await second;

      expect(strategyCalls).toBe(1);
      expect(translateCalls).toBe(3);

      const firstRunUploads = uploads.filter((u) => u.translationId === "tr-1");
      const retryUploads = uploads.filter((u) => u.translationId === "tr-2");
      // First run: chunks 0-4 succeeded and chunk 5 exhausted its 6 attempts.
      expect(firstRunUploads.map((u) => u.chunkId)).toEqual([
        0, 1, 2, 3, 4, 5, 5, 5, 5, 5, 5,
      ]);
      // No first-run upload past the failed chunk.
      expect(firstRunUploads.some((u) => u.chunkId > 5)).toBe(false);
      // Retry replays the cache with the original fileId, skipping 0-4.
      expect(retryUploads.map((u) => u.chunkId)).toEqual([
        5, 6, 7, 8, 9, 10, 11,
      ]);
      expect(retryUploads.every((u) => u.fileId === "orig-file")).toBe(true);
      expect((handler as any).audioDownloader.completedAudioCache).toBeNull();
    } finally {
      handlerCtor.AUDIO_UPLOAD_RETRY_DELAY_MS = prevDelay;
      table[WEB_ABR_STRATEGY] = prevAbr;
      table[WEB_MSE_PROXY_STRATEGY] = prevMse;
    }
  });

  test("same-video reuse links each external signal and unlinks on cleanup", () => {
    const videoHandler: any = {
      data: {},
      site: { host: "youtube" },
      votClient: { provider: {} },
      updateTranslationErrorMsg: async () => undefined,
    };
    const handler = new VOTTranslationHandler(videoHandler) as any;
    const first = new AbortController();
    const second = new AbortController();

    const run = handler.startAudioRun(first.signal, "tr-1", "v");
    handler.startAudioRun(second.signal, "tr-2", "v");
    expect(handler.audioRunExternalUnlinks.size).toBe(2);

    handler.cleanupAudioRun();
    expect(handler.audioRunExternalUnlinks.size).toBe(0);
    expect(run.signal.aborted).toBe(false);

    first.abort();
    second.abort();
    // Listeners were removed, so post-cleanup aborts don't touch the run.
    expect(run.signal.aborted).toBe(false);
  });

  test("reuse with an already-aborted external signal aborts preparation", () => {
    const videoHandler: any = {
      data: {},
      site: { host: "youtube" },
      votClient: { provider: {} },
      updateTranslationErrorMsg: async () => undefined,
    };
    const handler = new VOTTranslationHandler(videoHandler) as any;
    const first = new AbortController();
    const run = handler.startAudioRun(first.signal, "tr-1", "v");
    expect(run.signal.aborted).toBe(false);

    const second = new AbortController();
    second.abort();
    handler.startAudioRun(second.signal, "tr-2", "v");
    expect(run.signal.aborted).toBe(true);
  });

  test("external abort during retry delay stops further uploads without failure state", async () => {
    const handlerCtor = VOTTranslationHandler as unknown as {
      AUDIO_UPLOAD_RETRY_DELAY_MS: number;
    };
    const prevDelay = handlerCtor.AUDIO_UPLOAD_RETRY_DELAY_MS;
    handlerCtor.AUDIO_UPLOAD_RETRY_DELAY_MS = 1000;

    let uploadCalls = 0;
    const videoHandler: any = {
      data: {},
      site: { host: "youtube" },
      votClient: {
        provider: {
          requestVtransAudio: async () => {
            uploadCalls += 1;
            throw new Error("PUT failed");
          },
        },
      },
      updateTranslationErrorMsg: async () => undefined,
    };

    try {
      const handler = new VOTTranslationHandler(videoHandler) as any;
      const external = new AbortController();
      const run = handler.startAudioRun(
        external.signal,
        "tr-abort-retry",
        "v-abort-retry",
      );
      handler.downloading = true;

      const pending = handler.onDownloadedPartialAudio("tr-abort-retry", {
        videoId: "v-abort-retry",
        fileId: "f",
        audioData: new Uint8Array([1]),
        version: 1,
        index: 0,
        amount: 2,
      });
      await tick();
      expect(uploadCalls).toBe(1);
      external.abort();
      await pending;
      await tick(20);

      expect(uploadCalls).toBe(1);
      expect(run.signal.aborted).toBe(true);
      expect(handler.uploadResumeState).toBeNull();
      expect(handler.downloading).toBe(true);
    } finally {
      handlerCtor.AUDIO_UPLOAD_RETRY_DELAY_MS = prevDelay;
    }
  });
});
