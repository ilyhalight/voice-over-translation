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

const handlerCtor = VOTTranslationHandler as unknown as {
  AUDIO_UPLOAD_RETRY_DELAY_MS: number;
};

function makeHandler(calls: unknown[][], impl: (...args: never[]) => unknown) {
  const provider = {
    fetch: () => undefined,
    fetchOpts: { keepalive: true },
    requestVtransAudio: async (...args: never[]) => {
      calls.push(args);
      return impl(...args);
    },
    requestVtransFailAudio: async () => undefined,
  };
  const videoHandler: any = {
    data: {},
    site: { host: "youtube" },
    votClient: { provider },
    updateTranslationErrorMsg: async () => undefined,
  };
  const handler = new VOTTranslationHandler(videoHandler) as any;
  handler.downloading = true;
  return { handler, provider };
}

function primeRun(handler: any, translationId: string) {
  handler.audioRunSeq = (handler.audioRunSeq ?? 0) + 1;
  handler.audioRunTranslationId = translationId;
}

async function withZeroRetryDelay(fn: () => Promise<void>) {
  const prevDelay = handlerCtor.AUDIO_UPLOAD_RETRY_DELAY_MS;
  handlerCtor.AUDIO_UPLOAD_RETRY_DELAY_MS = 0;
  try {
    await fn();
  } finally {
    handlerCtor.AUDIO_UPLOAD_RETRY_DELAY_MS = prevDelay;
  }
}

describe("audio upload progressive timeouts", () => {
  const cases = [
    {
      name: "full audio: 2 failures then success use 15k,20k,30k",
      kind: "full",
      failures: 2,
      expectedTimeouts: [15_000, 20_000, 30_000],
    },
    {
      name: "partial chunks: 2 failures then success use 15k,20k,30k",
      kind: "partial",
      amount: 1,
      failures: 2,
      expectedTimeouts: [15_000, 20_000, 30_000],
    },
    {
      name: "partial chunks: all 6 failures clamp at 30s",
      kind: "partial",
      amount: 2,
      failures: Number.POSITIVE_INFINITY,
      expectedTimeouts: [15_000, 20_000, 30_000, 30_000, 30_000, 30_000],
    },
  ] as const;

  for (const [index, entry] of cases.entries()) {
    test(entry.name, async () => {
      await withZeroRetryDelay(async () => {
        const calls: unknown[][] = [];
        let n = 0;
        const { handler, provider } = makeHandler(calls, () => {
          n += 1;
          if (n <= entry.failures) throw new Error("PUT failed");
          return undefined;
        });
        const origFetch = provider.fetch;
        const origFetchOpts = provider.fetchOpts;
        const translationId = `tr-${index}`;
        primeRun(handler, translationId);
        if (entry.kind === "full") {
          await handler.onDownloadedAudio(translationId, {
            videoId: "v",
            fileId: "f",
            audioData: new Uint8Array([1]),
          });
        } else {
          await handler.onDownloadedPartialAudio(translationId, {
            videoId: "v",
            fileId: "f",
            audioData: new Uint8Array([1]),
            version: 1,
            index: 0,
            amount: entry.amount,
          });
        }
        expect(calls.length).toBe(entry.expectedTimeouts.length);
        expect(calls.map((c) => (c[5] as any)?.timeout)).toEqual(
          entry.expectedTimeouts,
        );
        for (const call of calls) {
          if (entry.kind === "full") expect(call[3]).toBeUndefined();
          expect(call[4]).toEqual({});
        }
        expect(provider.fetch).toBe(origFetch);
        expect(provider.fetchOpts).toBe(origFetchOpts);
        expect(provider.fetchOpts).toEqual({ keepalive: true });
      });
    });
  }
});
