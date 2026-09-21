import { expect, test } from "bun:test";
import { makeAbortError } from "../src/utils/errors";

(globalThis as unknown as { DEBUG_MODE: boolean }).DEBUG_MODE = false;

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const tick = (ms = 10) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const { AudioDownloader } = await import("../src/audioDownloader/index");
const { strategies, WEB_ABR_STRATEGY, WEB_MSE_PROXY_STRATEGY } = await import(
  "../src/audioDownloader/strategies/index"
);

type RecordedChunk = {
  index: number;
  amount: number;
  size: number;
};

const bytes = (size: number): Uint8Array => new Uint8Array(size).fill(1);

async function* streamOf(
  chunks: { size: number; last: boolean }[],
): AsyncGenerator<{ buffer: Uint8Array; isLastChunk: boolean }> {
  for (const chunk of chunks) {
    yield { buffer: bytes(chunk.size), isLastChunk: chunk.last };
  }
}

async function runWithChunks(
  chunks: { size: number; last: boolean }[],
  sourceLanguage?: string,
): Promise<{
  partials: RecordedChunk[];
  errors: number;
  seenLanguage: unknown;
}> {
  const partials: RecordedChunk[] = [];
  let errors = 0;
  let seenLanguage: unknown;
  const downloader = new AudioDownloader(WEB_ABR_STRATEGY);
  downloader.addEventListener("downloadedPartialAudio", (_id, data) => {
    partials.push({
      index: data.index,
      amount: data.amount,
      size: data.audioData.byteLength,
    });
  });
  downloader.addEventListener("downloadAudioError", () => {
    errors++;
  });

  const table = strategies as unknown as Record<
    string,
    (options: {
      videoId: string;
      signal: AbortSignal;
      sourceLanguage?: string;
    }) => Promise<{
      fileId: string;
      mediaPartsLength: null;
      getMediaBuffers: () => AsyncGenerator<{
        buffer: Uint8Array;
        isLastChunk: boolean;
      }>;
    }>
  >;
  const prevAbr = table[WEB_ABR_STRATEGY];
  const prevMse = table[WEB_MSE_PROXY_STRATEGY];
  table[WEB_ABR_STRATEGY] = async (options) => {
    seenLanguage = options.sourceLanguage;
    return {
      fileId: "test-file",
      mediaPartsLength: null,
      getMediaBuffers: () => streamOf(chunks),
    };
  };
  table[WEB_MSE_PROXY_STRATEGY] = async (options) => {
    seenLanguage ??= options.sourceLanguage;
    return {
      fileId: "test-file",
      mediaPartsLength: null,
      getMediaBuffers: () => streamOf(chunks),
    };
  };
  try {
    await downloader.runAudioDownload(
      "video-id",
      "translation-id",
      new AbortController().signal,
      sourceLanguage,
    );
  } finally {
    table[WEB_ABR_STRATEGY] = prevAbr;
    table[WEB_MSE_PROXY_STRATEGY] = prevMse;
  }
  return { partials, errors, seenLanguage };
}

test("terminal empty marker is absorbed into the last real chunk", async () => {
  const { partials, errors } = await runWithChunks([
    { size: 10, last: false },
    { size: 10, last: false },
    { size: 0, last: true },
  ]);
  expect(errors).toBe(0);
  expect(partials).toEqual([
    { index: 0, amount: 0, size: 10 },
    { index: 1, amount: 2, size: 10 },
  ]);
});

test("normal final real chunk is sent once with the total", async () => {
  const { partials, errors } = await runWithChunks([
    { size: 10, last: false },
    { size: 10, last: true },
  ]);
  expect(errors).toBe(0);
  expect(partials).toEqual([
    { index: 0, amount: 0, size: 10 },
    { index: 1, amount: 2, size: 10 },
  ]);
});

test("single terminal real chunk works", async () => {
  const { partials, errors } = await runWithChunks([{ size: 10, last: true }]);
  expect(errors).toBe(0);
  expect(partials).toEqual([{ index: 0, amount: 1, size: 10 }]);
});

test("empty-only streams fail instead of reporting success", async () => {
  for (const chunks of [
    [],
    [{ size: 0, last: true }],
    [{ size: 0, last: false }],
  ] as { size: number; last: boolean }[][]) {
    const { partials, errors } = await runWithChunks(chunks);
    expect(partials).toEqual([]);
    expect(errors).toBe(1);
  }
});

test("source language is forwarded to the download strategy", async () => {
  const { errors, seenLanguage } = await runWithChunks(
    [{ size: 10, last: true }],
    "ru",
  );
  expect(errors).toBe(0);
  expect(seenLanguage).toBe("ru");
});

type StrategyFn = (options: {
  videoId: string;
  signal: AbortSignal;
  sourceLanguage?: string;
}) => Promise<{
  fileId: string;
  mediaPartsLength: null;
  getMediaBuffers: () => AsyncGenerator<{
    buffer: Uint8Array;
    isLastChunk: boolean;
  }>;
}>;

function patchStrategies(abr: StrategyFn, mse: StrategyFn) {
  const table = strategies as unknown as Record<string, StrategyFn>;
  const prevAbr = table[WEB_ABR_STRATEGY];
  const prevMse = table[WEB_MSE_PROXY_STRATEGY];
  table[WEB_ABR_STRATEGY] = abr;
  table[WEB_MSE_PROXY_STRATEGY] = mse;
  return () => {
    table[WEB_ABR_STRATEGY] = prevAbr;
    table[WEB_MSE_PROXY_STRATEGY] = prevMse;
  };
}

function singleChunk(): AsyncGenerator<{
  buffer: Uint8Array;
  isLastChunk: boolean;
}> {
  return streamOf([{ size: 10, last: true }]);
}

function abrSucceeds(
  onEnter?: (options: { sourceLanguage?: string }) => void,
): StrategyFn {
  return async (options) => {
    onEnter?.(options);
    return {
      fileId: "test-file",
      mediaPartsLength: null,
      getMediaBuffers: () => streamOf([{ size: 10, last: true }]),
    };
  };
}

// Each click on DebugYTAudioComponent creates a new AudioDownloader, so every
// queue test below uses separate instances for the same videoId.
test("same videoId across instances is FIFO and never overlaps", async () => {
  const gate = deferred<void>();
  const entered = deferred<void>();
  const events: string[] = [];
  let active = 0;
  let maxActive = 0;
  const restore = patchStrategies(
    async () => ({
      fileId: "test-file",
      mediaPartsLength: null,
      getMediaBuffers: async function* () {
        active++;
        maxActive = Math.max(maxActive, active);
        try {
          events.push("enter");
          if (events.length === 1) {
            entered.resolve();
            await gate.promise;
          }
          yield { buffer: bytes(10), isLastChunk: true };
        } finally {
          active--;
        }
      },
    }),
    abrSucceeds(),
  );
  try {
    const first = new AudioDownloader(WEB_ABR_STRATEGY);
    const second = new AudioDownloader(WEB_ABR_STRATEGY);
    const signal = new AbortController().signal;
    const firstRun = first.runAudioDownload("q-fifo", "t-a", signal);
    const secondRun = second.runAudioDownload("q-fifo", "t-b", signal);
    await entered.promise;
    await tick();
    expect(events).toEqual(["enter"]);
    gate.resolve();
    await Promise.all([firstRun, secondRun]);
    expect(events).toEqual(["enter", "enter"]);
    expect(maxActive).toBe(1);
  } finally {
    restore();
  }
});

test("different video IDs remain concurrent", async () => {
  const gate = deferred<void>();
  const bothEntered = deferred<void>();
  const entered: string[] = [];
  const blocking: StrategyFn = async (options) => ({
    fileId: "test-file",
    mediaPartsLength: null,
    getMediaBuffers: async function* () {
      entered.push(options.videoId);
      if (entered.length === 2) bothEntered.resolve();
      await gate.promise;
      yield { buffer: bytes(10), isLastChunk: true };
    },
  });
  const restore = patchStrategies(blocking, abrSucceeds());
  try {
    const signal = new AbortController().signal;
    const firstRun = new AudioDownloader(WEB_ABR_STRATEGY).runAudioDownload(
      "q-con-a",
      "t-a",
      signal,
    );
    const secondRun = new AudioDownloader(WEB_ABR_STRATEGY).runAudioDownload(
      "q-con-b",
      "t-b",
      signal,
    );
    await bothEntered.promise;
    expect([...entered].sort()).toEqual(["q-con-a", "q-con-b"]);
    gate.resolve();
    await Promise.all([firstRun, secondRun]);
  } finally {
    restore();
  }
});

test("aborting a queued run never enters a strategy and keeps later callers queued", async () => {
  const gate = deferred<void>();
  const aEntered = deferred<void>();
  const entered: string[] = [];
  const restore = patchStrategies(
    async (options) => ({
      fileId: "test-file",
      mediaPartsLength: null,
      getMediaBuffers: async function* () {
        entered.push(String(options.sourceLanguage));
        if (options.sourceLanguage === "lang-a") {
          aEntered.resolve();
          await gate.promise;
        }
        yield { buffer: bytes(10), isLastChunk: true };
      },
    }),
    abrSucceeds(),
  );
  try {
    const controllerB = new AbortController();
    const videoId = "q-abort";
    const runA = new AudioDownloader(WEB_ABR_STRATEGY).runAudioDownload(
      videoId,
      "t-a",
      new AbortController().signal,
      "lang-a",
    );
    const runB = new AudioDownloader(WEB_ABR_STRATEGY).runAudioDownload(
      videoId,
      "t-b",
      controllerB.signal,
      "lang-b",
    );
    const runC = new AudioDownloader(WEB_ABR_STRATEGY).runAudioDownload(
      videoId,
      "t-c",
      new AbortController().signal,
      "lang-c",
    );
    await aEntered.promise;
    await tick();
    expect(entered).toEqual(["lang-a"]);
    controllerB.abort();
    await Promise.race([
      runB,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("queued abort did not resolve promptly")),
          1000,
        ),
      ),
    ]);
    // B aborted while queued: it never entered a strategy and did not release
    // C past the still-active A.
    expect(entered).toEqual(["lang-a"]);
    gate.resolve();
    await Promise.all([runA, runB, runC]);
    expect(entered).toEqual(["lang-a", "lang-c"]);
  } finally {
    restore();
  }
});

test("an already-aborted signal never enters a strategy", async () => {
  let entered = false;
  const restore = patchStrategies(
    abrSucceeds(() => {
      entered = true;
    }),
    abrSucceeds(),
  );
  try {
    const controller = new AbortController();
    controller.abort();
    let errors = 0;
    const downloader = new AudioDownloader(WEB_ABR_STRATEGY);
    downloader.addEventListener("downloadAudioError", () => {
      errors++;
    });
    await downloader.runAudioDownload("q-preabort", "t", controller.signal);
    expect(entered).toBe(false);
    expect(errors).toBe(0);
  } finally {
    restore();
  }
});

test("aborting the active run releases the slot for the queued run", async () => {
  const gate = deferred<void>();
  const aEntered = deferred<void>();
  const entered: string[] = [];
  const restore = patchStrategies(
    async (options) => ({
      fileId: "test-file",
      mediaPartsLength: null,
      getMediaBuffers: async function* () {
        entered.push(String(options.sourceLanguage));
        if (options.sourceLanguage === "lang-a") {
          aEntered.resolve();
          await new Promise<void>((resolve, reject) => {
            if (options.signal.aborted) {
              reject(makeAbortError());
              return;
            }
            const onAbort = () => reject(makeAbortError());
            options.signal.addEventListener("abort", onAbort, { once: true });
            gate.promise.then(() => {
              options.signal.removeEventListener("abort", onAbort);
              resolve();
            });
          });
        }
        yield { buffer: bytes(10), isLastChunk: true };
      },
    }),
    abrSucceeds(),
  );
  try {
    const controllerA = new AbortController();
    const videoId = "q-cancel";
    const runA = new AudioDownloader(WEB_ABR_STRATEGY).runAudioDownload(
      videoId,
      "t-a",
      controllerA.signal,
      "lang-a",
    );
    const runB = new AudioDownloader(WEB_ABR_STRATEGY).runAudioDownload(
      videoId,
      "t-b",
      new AbortController().signal,
      "lang-b",
    );
    await aEntered.promise;
    await tick();
    expect(entered).toEqual(["lang-a"]);
    controllerA.abort();
    await Promise.all([runA, runB]);
    expect(entered).toEqual(["lang-a", "lang-b"]);
  } finally {
    restore();
  }
});

test("a failed run releases the slot for the next same-video run", async () => {
  const calls: string[] = [];
  const restore = patchStrategies(
    async (options) => {
      calls.push(`abr:${options.sourceLanguage}`);
      throw new Error("abr boom");
    },
    async (options) => {
      calls.push(`mse:${options.sourceLanguage}`);
      throw new Error("mse boom");
    },
  );
  try {
    const errors: string[] = [];
    const videoId = "q-fail";
    const first = new AudioDownloader(WEB_ABR_STRATEGY);
    first.addEventListener("downloadAudioError", (_id, id) => {
      errors.push(id);
    });
    const second = new AudioDownloader(WEB_ABR_STRATEGY);
    second.addEventListener("downloadAudioError", (_id, id) => {
      errors.push(id);
    });
    const signal = new AbortController().signal;
    await Promise.all([
      first.runAudioDownload(videoId, "t-a", signal, "lang-a"),
      second.runAudioDownload(videoId, "t-b", signal, "lang-b"),
    ]);
    expect(calls).toEqual([
      "abr:lang-a",
      "mse:lang-a",
      "abr:lang-b",
      "mse:lang-b",
    ]);
    expect(errors).toEqual([videoId, videoId]);
  } finally {
    restore();
  }
});

test("a queued run cannot interleave between WEB_ABR and its fallback", async () => {
  const events: string[] = [];
  const fallbackGate = deferred<void>();
  const fallbackEntered = deferred<void>();
  const restore = patchStrategies(
    async (options) => {
      const lang = String(options.sourceLanguage);
      events.push(`abr-start:${lang}`);
      if (lang === "lang-a") throw new Error("abr fail");
      return {
        fileId: "test-file",
        mediaPartsLength: null,
        getMediaBuffers: () => singleChunk(),
      };
    },
    async (options) => {
      const lang = String(options.sourceLanguage);
      if (lang !== "lang-a") {
        return {
          fileId: "test-file",
          mediaPartsLength: null,
          getMediaBuffers: () => singleChunk(),
        };
      }
      return {
        fileId: "test-file",
        mediaPartsLength: null,
        getMediaBuffers: async function* () {
          events.push("mse-start:a");
          fallbackEntered.resolve();
          await fallbackGate.promise;
          yield { buffer: bytes(10), isLastChunk: true };
          events.push("mse-end:a");
        },
      };
    },
  );
  try {
    const videoId = "q-fallback";
    const signal = new AbortController().signal;
    const runA = new AudioDownloader(WEB_ABR_STRATEGY).runAudioDownload(
      videoId,
      "t-a",
      signal,
      "lang-a",
    );
    const runB = new AudioDownloader(WEB_ABR_STRATEGY).runAudioDownload(
      videoId,
      "t-b",
      signal,
      "lang-b",
    );
    await fallbackEntered.promise;
    await tick();
    // A is inside its fallback; B must not have started its WEB_ABR attempt.
    expect(events).toEqual(["abr-start:lang-a", "mse-start:a"]);
    fallbackGate.resolve();
    await Promise.all([runA, runB]);
    expect(events).toEqual([
      "abr-start:lang-a",
      "mse-start:a",
      "mse-end:a",
      "abr-start:lang-b",
    ]);
  } finally {
    restore();
  }
});

test("an aborted run drops its buffered collecting chunks", async () => {
  const gate = deferred<void>();
  const entered = deferred<void>();
  const restore = patchStrategies(
    async () => ({
      fileId: "test-file",
      mediaPartsLength: null,
      getMediaBuffers: async function* () {
        entered.resolve();
        await gate.promise;
        yield { buffer: bytes(10), isLastChunk: false };
      },
    }),
    abrSucceeds(),
  );
  const collecting = (downloader: AudioDownloader) =>
    (downloader as unknown as { collectingChunks: Map<string, unknown> })
      .collectingChunks;
  try {
    const downloader = new AudioDownloader(WEB_ABR_STRATEGY);
    const controller = new AbortController();
    const run = downloader.runAudioDownload(
      "q-collect",
      "t",
      controller.signal,
    );
    await entered.promise;
    expect(collecting(downloader).has("q-collect")).toBe(true);
    controller.abort();
    gate.resolve();
    await run;
    expect(collecting(downloader).has("q-collect")).toBe(false);
  } finally {
    restore();
  }
});

test("completed audio cache keeps only the last video", async () => {
  const calls: string[] = [];
  const restore = patchStrategies(async (options) => {
    calls.push(`abr:${options.videoId}`);
    return {
      fileId: `file-${options.videoId}`,
      mediaPartsLength: null,
      getMediaBuffers: () => singleChunk(),
    };
  }, abrSucceeds());
  try {
    const downloader = new AudioDownloader(WEB_ABR_STRATEGY);
    const signal = new AbortController().signal;

    await downloader.runAudioDownload("cache-a", "t-a", signal);
    expect(calls).toEqual(["abr:cache-a"]);

    // The same video resumes from the cached chunks without re-downloading.
    await downloader.runAudioDownload("cache-a", "t-a2", signal);
    expect(calls).toEqual(["abr:cache-a"]);

    // Starting a different video evicts the single cached entry.
    await downloader.runAudioDownload("cache-b", "t-b", signal);
    expect(calls).toEqual(["abr:cache-a", "abr:cache-b"]);

    // cache-b is now the cached video and replays.
    await downloader.runAudioDownload("cache-b", "t-b2", signal);
    expect(calls).toEqual(["abr:cache-a", "abr:cache-b"]);

    // cache-a was evicted, so it must download again.
    await downloader.runAudioDownload("cache-a", "t-a3", signal);
    expect(calls).toEqual(["abr:cache-a", "abr:cache-b", "abr:cache-a"]);
  } finally {
    restore();
  }
});
