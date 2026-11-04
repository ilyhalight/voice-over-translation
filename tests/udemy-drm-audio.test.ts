import { describe, expect, test } from "bun:test";
import { VOTJSError } from "@vot.js/core/client";
import { VOTTranslationHandler } from "../src/core/translationHandler";
import {
  CapturePosition,
  encodeWav,
  getUdemyLectureKey,
  getUdemyRequestVideoId,
  isProtectedUdemyLecture,
  StreamingWavUploader,
  TimelineWriter,
} from "../src/core/udemyDrmAudio";

const encrypted = "https://hls-enc-c.udemycdn.com/cmaf/1/abc/cbcs/master.m3u8";

function memoryStore() {
  const data = new Map<string, unknown>();
  let writes = 0;
  return {
    async getRaw<T>(name: string, def?: T): Promise<T> {
      return (data.has(name) ? structuredClone(data.get(name)) : def) as T;
    },
    async setRaw<T>(name: string, value: T): Promise<void> {
      writes++;
      data.set(name, structuredClone(value));
    },
    writes: () => writes,
  };
}

describe("protected Udemy lecture detection", () => {
  test("only Udemy with an encrypted Udemy CDN stream", () => {
    const help = [{ target: "video_file_url" as const, targetUrl: encrypted }];
    expect(isProtectedUdemyLecture("udemy", help)).toBe(true);
    expect(isProtectedUdemyLecture("youtube", help)).toBe(false);
    expect(
      isProtectedUdemyLecture("udemy", [
        {
          target: "video_file_url",
          targetUrl: "https://mp4-c.udemycdn.com/a.mp4",
        },
      ]),
    ).toBe(false);
    expect(
      isProtectedUdemyLecture("udemy", [
        {
          target: "video_file_url",
          targetUrl: "https://hls-enc-c.udemycdn.com.evil.test/cbcs/x.m3u8",
        },
      ]),
    ).toBe(false);
    expect(isProtectedUdemyLecture("udemy", null)).toBe(false);
  });
});

describe("lecture key", () => {
  const videoId = "course/intro-to-agents/learn/lecture/1234567";
  test("uses the numeric course id when known, the slug otherwise", () => {
    expect(getUdemyLectureKey(videoId, "4242")).toBe(
      "course-4242|lecture-1234567",
    );
    expect(getUdemyLectureKey(videoId, undefined)).toBe(
      "course-intro-to-agents|lecture-1234567",
    );
  });
  test("the same lecture id in another course is a different key", () => {
    expect(getUdemyLectureKey(videoId, "1")).not.toBe(
      getUdemyLectureKey(videoId, "2"),
    );
  });
});

describe("request video id", () => {
  test("is deterministic per key and install, renewable after failure", async () => {
    const store = memoryStore();
    const a = await getUdemyRequestVideoId("k1", { store });
    expect(a).toMatch(/^[\w-]{11}$/);
    expect(await getUdemyRequestVideoId("k1", { store })).toBe(a);
    expect(await getUdemyRequestVideoId("k2", { store })).not.toBe(a);
    expect(store.writes()).toBe(1);

    const renewed = await getUdemyRequestVideoId("k1", { store, renew: true });
    expect(renewed).not.toBe(a);
    expect(await getUdemyRequestVideoId("k1", { store })).toBe(renewed);
  });

  test("another install (salt) gets other ids for the same lecture", async () => {
    const a = await getUdemyRequestVideoId("k1", { store: memoryStore() });
    const b = await getUdemyRequestVideoId("k1", { store: memoryStore() });
    expect(a).not.toBe(b);
  });
});

function zeroCrossFreq(samples: Int16Array, rate: number) {
  let crossings = 0;
  for (let i = 1; i < samples.length; i++)
    if ((samples[i - 1] ?? 0) < 0 && (samples[i] ?? 0) >= 0) crossings++;
  return crossings / (samples.length / rate);
}

describe("timeline writer", () => {
  // 440 Hz tone played at 4x with preservesPitch=false, captured at 48 kHz,
  // with buffering stalls (clock does not move) every 7th block.
  test("undoes speed, keeps pitch, leaves stalls out without shifting", () => {
    const duration = 20;
    const writer = new TimelineWriter(duration);
    let media = 0;
    let block = 0;
    while (media < duration) {
      const stalled = block % 7 === 6;
      const pcm = new Float32Array(2048);
      const next = stalled ? media : media + (2048 / 48000) * 4;
      if (!stalled) {
        for (let i = 0; i < pcm.length; i++)
          pcm[i] =
            0.5 * Math.sin(2 * Math.PI * 440 * (media + (i / 48000) * 4));
      }
      writer.write(pcm, media, next);
      media = next;
      block++;
    }
    expect(writer.samples.length).toBe(duration * 16000);
    expect(writer.coveredSeconds).toBeGreaterThan(duration * 0.98);
    expect(Math.abs(zeroCrossFreq(writer.samples, 16000) - 440)).toBeLessThan(
      5,
    );
  });

  test("ignores empty and jumped intervals", () => {
    const writer = new TimelineWriter(10);
    expect(writer.write(new Float32Array(10), 1, 1)).toBe(false);
    expect(writer.write(new Float32Array(10), 1, 5)).toBe(false);
    expect(writer.write(new Float32Array(10), 9.99, 12)).toBe(false);
  });
});

describe("capture position", () => {
  test("follows normal playback and small forward gap jumps", () => {
    const position = new CapturePosition();
    for (let time = 0; time <= 10; time += 0.17) position.advance(time);
    expect(position.head).toBeCloseTo(9.86, 1);
    expect(position.restoreTarget(10.5)).toBeUndefined();
    expect(position.head).toBeCloseTo(10.5, 5);
  });

  test("sends user seeks back to where capture was", () => {
    const position = new CapturePosition();
    for (let time = 0; time <= 30; time += 0.17) position.advance(time);
    const head = position.head;
    expect(position.restoreTarget(5)).toBe(head);
    expect(position.restoreTarget(head + 60)).toBe(head);
    position.advance(head + 60);
    expect(position.head).toBe(head);
  });
});

describe("streaming upload", () => {
  const samples = Int16Array.from({ length: 100 }, (_, i) => i * 300 - 15000);
  const signal = new AbortController().signal;

  test("sends final chunks early, the last one only on finish", async () => {
    const calls: {
      bytes: Uint8Array;
      index: number;
      parts: number;
      fileId: string;
    }[] = [];
    const uploader = new StreamingWavUploader(
      samples,
      16000,
      async (bytes, index, parts, fileId) => {
        calls.push({ bytes, index, parts, fileId });
      },
      { signal, chunkSize: 64 },
    );
    expect(uploader.partsLength).toBe(4); // 44 + 200 bytes
    uploader.offer(5); // 54 bytes final: no full chunk yet
    await Promise.resolve();
    expect(calls).toHaveLength(0);
    uploader.offer(60); // 164 bytes final: chunks 0 and 1
    await new Promise((r) => setTimeout(r, 0));
    expect(calls.map((c) => c.index)).toEqual([0, 1]);
    uploader.offer(100); // everything final, but the last waits for finish
    await new Promise((r) => setTimeout(r, 0));
    expect(calls.map((c) => c.index)).toEqual([0, 1, 2]);
    await uploader.finish();
    expect(calls.map((c) => [c.index, c.parts])).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 4],
    ]);
    expect(new Set(calls.map((c) => c.fileId)).size).toBe(1);
    const joined = new Uint8Array(
      calls.reduce((n, c) => n + c.bytes.length, 0),
    );
    let offset = 0;
    for (const c of calls) {
      joined.set(c.bytes, offset);
      offset += c.bytes.length;
    }
    expect(joined).toEqual(encodeWav(samples, 16000));
  });

  test("odd chunk sizes split samples across chunks correctly", async () => {
    const parts: Uint8Array[] = [];
    const uploader = new StreamingWavUploader(
      samples,
      16000,
      async (bytes) => {
        parts.push(bytes);
      },
      { signal, chunkSize: 45 },
    );
    await uploader.finish();
    const joined = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let offset = 0;
    for (const p of parts) {
      joined.set(p, offset);
      offset += p.length;
    }
    expect(joined).toEqual(encodeWav(samples, 16000));
  });

  test("retries a failing chunk, then reports the failure on finish", async () => {
    let attempts = 0;
    await new StreamingWavUploader(
      samples,
      16000,
      async () => {
        attempts++;
        if (attempts < 3) throw new Error("network");
      },
      { signal, retryDelayMs: 1 },
    ).finish();
    expect(attempts).toBe(3);

    let failures = 0;
    await expect(
      new StreamingWavUploader(
        samples,
        16000,
        async () => {
          failures++;
          throw new Error("network");
        },
        { signal, retryDelayMs: 1 },
      ).finish(),
    ).rejects.toThrow("network");
    expect(failures).toBe(3);
  });
});

function makeHandler(responses: any[], { lively = false } = {}) {
  const requests: any[] = [];
  const uploads: any[] = [];
  let captures = 0;
  const video = { duration: 600 } as HTMLVideoElement;
  const handler = new VOTTranslationHandler({
    video,
    videoData: { title: "Lecture" },
    data: { useLivelyVoice: lively },
    isLivelyVoiceAllowed: () => lively,
    updateTranslationErrorMsg: async () => undefined,
    votClient: {
      translateVideo: async (request: any) => {
        requests.push(request);
        const next = responses.length > 1 ? responses.shift() : responses[0];
        if (next instanceof Error) throw next;
        return next;
      },
      provider: {
        requestVtransAudio: async (...args: any[]) => {
          uploads.push(args);
          return { status: 2 };
        },
      },
    },
  } as never);
  const store = memoryStore();
  handler.udemyDrmAudio = {
    capture: async (_video, { onSamplesReady }) => {
      captures++;
      const samples = new Int16Array(16);
      onSamplesReady?.(samples, 8);
      return samples;
    },
    createUploader: (samples, rate, uploadChunk, options) =>
      new StreamingWavUploader(samples, rate, uploadChunk, {
        ...options,
        chunkSize: 1 << 20,
      }),
    store,
    pollIntervalMs: 1,
    pollLimitMs: 40,
  };
  const setLively = (value: boolean) => {
    (handler as any).videoHandler.data.useLivelyVoice = value;
    (handler as any).videoHandler.isLivelyVoiceAllowed = () => value;
    lively = value;
  };
  const call = () =>
    (handler as any).requestTranslationWithLivelyFallback({
      videoData: {
        host: "udemy",
        url: "https://www.udemy.com/course/c/learn/lecture/1",
        videoId: "course/c/learn/lecture/1",
        duration: 610,
      },
      requestLang: "en",
      responseLang: "ru",
      translationHelp: [{ target: "video_file_url", targetUrl: encrypted }],
      shouldSendFailedAudio: false,
      livelyDisabled: false,
      livelyVoiceAllowed: lively,
      signal: new AbortController().signal,
    });
  return { call, setLively, requests, uploads, captures: () => captures };
}

const finished = (id: string) => ({
  status: 1,
  translated: true,
  url: `https://a/${id}.mp3`,
  translationId: id,
  remainingTime: -1,
});
const asked = (id: string) => ({
  status: 6,
  translationId: id,
  translated: false,
  remainingTime: 70,
});
const waiting = (id: string) => ({ ...asked(id), status: 2 });

describe("protected Udemy translation flow", () => {
  test("captures, uploads, then polls often until Yandex is done", async () => {
    const { call, requests, uploads, captures } = makeHandler([
      asked("tr-1"),
      waiting("tr-1"),
      waiting("tr-1"),
      finished("tr-1"),
    ]);
    const result = await call();
    expect(result.response.url).toBe("https://a/tr-1.mp3");
    expect(result.useLivelyVoice).toBe(false);
    expect(captures()).toBe(1);
    expect(requests).toHaveLength(4);
    const url = requests[0].videoData.url;
    expect(url).toMatch(/^https:\/\/youtu\.be\/[\w-]{11}$/);
    expect(requests.every((r) => r.videoData.url === url)).toBe(true);
    expect(requests[0].videoData.duration).toBe(600);
    expect(requests[0].translationHelp).toBeNull();
    expect(requests[0].shouldSendFailedAudio).toBe(false);
    expect(uploads).toHaveLength(1);
    expect(uploads[0][0]).toBe(url);
    expect(uploads[0][1]).toBe("tr-1");
    expect(uploads[0][3]).toMatchObject({ audioPartsLength: 1, version: 1 });

    const again = await call();
    expect(again.response.url).toBe("https://a/tr-1.mp3");
    expect(captures()).toBe(1);
  });

  test("never records twice for the same Yandex task", async () => {
    const { call, captures, uploads } = makeHandler([asked("tr-1")]);
    const first = await call();
    expect(first.response.status).toBe(6);
    const second = await call();
    expect(second.response.status).toBe(6);
    expect(captures()).toBe(1);
    expect(uploads).toHaveLength(1);
  });

  test("returns a finished translation without capturing", async () => {
    const { call, captures } = makeHandler([finished("x")]);
    const result = await call();
    expect(result.response.url).toBe("https://a/x.mp3");
    expect(captures()).toBe(0);
  });

  test("uses a fresh request id after Yandex reports a failure", async () => {
    const failure = new VOTJSError("Yandex couldn't translate video", {
      status: 0,
    });
    const { call, requests } = makeHandler([failure, finished("y")]);
    await expect(call()).rejects.toBe(failure);
    await call();
    expect(requests[1].videoData.url).not.toBe(requests[0].videoData.url);
  });
});

describe("voice type for protected lectures", () => {
  test("lively and classic are separate translations sharing one recording", async () => {
    const { call, setLively, requests, uploads, captures } = makeHandler(
      [
        asked("classic"),
        waiting("classic"),
        finished("classic"),
        asked("lively"),
        finished("lively"),
      ],
      { lively: false },
    );
    const classic = await call();
    expect(classic.useLivelyVoice).toBe(false);
    expect(classic.response.url).toBe("https://a/classic.mp3");
    expect(requests[0].extraOpts.useLivelyVoice).toBe(false);

    setLively(true);
    const live = await call();
    expect(live.useLivelyVoice).toBe(true);
    expect(live.response.url).toBe("https://a/lively.mp3");
    expect(requests[3].extraOpts.useLivelyVoice).toBe(true);
    expect(requests[3].videoData.url).not.toBe(requests[0].videoData.url);
    expect(captures()).toBe(1);
    expect(uploads.map((u) => u[1])).toEqual(["classic", "lively"]);
  });

  test("falls back to classic when lively voices are unavailable", async () => {
    const { call, requests } = makeHandler(
      [
        { ...waiting("l"), message: "Доступна только обычная озвучка" },
        finished("c"),
      ],
      { lively: true },
    );
    const result = await call();
    expect(result.useLivelyVoice).toBe(false);
    expect(result.livelyDisabled).toBe(true);
    expect(requests[0].extraOpts.useLivelyVoice).toBe(true);
    expect(requests[1].extraOpts.useLivelyVoice).toBe(false);
    expect(result.response.url).toBe("https://a/c.mp3");
  });
});
