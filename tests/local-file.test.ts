import { describe, expect, test } from "vitest";
import {
  allowLocalFileUpload,
  consumeLocalFileFailure,
  encodeWav,
  getLocalFileKey,
  getLocalFileRequestId,
  getLocalFileRequestUrl,
  isLocalFileUrl,
  LOCAL_FILE_MAX_UPLOADS,
  type LocalFileIdentityStore,
  markLocalFileRequestFailed,
  mixToMonoPcm16,
  registerLocalFileSource,
  resetLocalFileUploads,
  splitIntoChunks,
  toLocalFileRequestUrl,
} from "../src/core/localFile";
import { isRequestUrlAllowed } from "../src/extension/background/fileAccess";

function createStore(): LocalFileIdentityStore {
  const values = new Map<string, unknown>();
  return {
    getRaw: async <T>(name: string, def?: T) =>
      (values.has(name) ? values.get(name) : def) as T,
    setRaw: async (name: string, value: unknown) => {
      values.set(name, value);
    },
  };
}

describe("local file request id", () => {
  test("is stable for one file and shaped like a youtu.be id", async () => {
    const store = createStore();
    const first = await getLocalFileRequestId("a.mp4|189|en|ru", { store });
    const second = await getLocalFileRequestId("a.mp4|189|en|ru", { store });
    expect(first).toMatch(/^[\w-]{11}$/);
    expect(second).toBe(first);
    expect(toLocalFileRequestUrl(first)).toBe(`https://youtu.be/${first}`);
  });

  test("differs per file, per salt and after renew", async () => {
    const store = createStore();
    const id = await getLocalFileRequestId("a.mp4|189|en|ru", { store });
    expect(await getLocalFileRequestId("b.mp4|189|en|ru", { store })).not.toBe(
      id,
    );
    expect(
      await getLocalFileRequestId("a.mp4|189|en|ru", { store: createStore() }),
    ).not.toBe(id);

    const renewed = await getLocalFileRequestId("a.mp4|189|en|ru", {
      renew: true,
      store,
    });
    expect(renewed).not.toBe(id);
    expect(await getLocalFileRequestId("a.mp4|189|en|ru", { store })).toBe(
      renewed,
    );
  });

  test("key uses the decoded path, so same names in two folders differ", () => {
    const a = getLocalFileKey(
      "file:///Users/a/Downloads/%5Bx%5D%20001%20Intro.mp4",
      189.4,
      "en",
      "ru",
    );
    const b = getLocalFileKey(
      "file:///Volumes/disk/%5Bx%5D%20001%20Intro.mp4",
      189.4,
      "en",
      "ru",
    );
    expect(a).toBe("/Users/a/Downloads/[x] 001 Intro.mp4|189|en|ru");
    expect(b).not.toBe(a);
  });
});

describe("local file request url", () => {
  test("is unknown before a translation and follows the latest request", () => {
    const file = "file:///videos/a.mp4";
    expect(getLocalFileRequestUrl(file)).toBeUndefined();
    registerLocalFileSource("AAAAAAAAAAA", file, "a.mp4|189|en|ru");
    expect(getLocalFileRequestUrl(file)).toBe("https://youtu.be/AAAAAAAAAAA");
    registerLocalFileSource("BBBBBBBBBBB", file, "a.mp4|189|en|de");
    expect(getLocalFileRequestUrl(file)).toBe("https://youtu.be/BBBBBBBBBBB");
  });
});

describe("local file audio", () => {
  test("mixes channels to mono pcm16 and clips", () => {
    const mono = mixToMonoPcm16([
      new Float32Array([1, -1, 0.5, 2]),
      new Float32Array([1, -1, -0.5, 2]),
    ]);
    expect(Array.from(mono)).toEqual([32767, -32768, 0, 32767]);
  });

  test("writes a 44-byte wav header", () => {
    const wav = encodeWav(new Int16Array([1, -2, 3]), 16000);
    const view = new DataView(wav.buffer);
    const text = (offset: number) =>
      String.fromCharCode(...wav.subarray(offset, offset + 4));
    expect(wav.length).toBe(44 + 6);
    expect(text(0)).toBe("RIFF");
    expect(text(8)).toBe("WAVE");
    expect(text(36)).toBe("data");
    expect(view.getUint32(4, true)).toBe(36 + 6);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint32(28, true)).toBe(32000);
    expect(view.getUint16(32, true)).toBe(2);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(6);
    expect(view.getInt16(46, true)).toBe(-2);
  });

  test("splits into chunks without losing bytes", () => {
    const bytes = Uint8Array.from({ length: 10 }, (_, i) => i);
    const chunks = splitIntoChunks(bytes, 4);
    expect(chunks.map((chunk) => chunk.length)).toEqual([4, 4, 2]);
    expect(chunks.flatMap((chunk) => Array.from(chunk))).toEqual(
      Array.from(bytes),
    );
  });
});

describe("local file access from the background", () => {
  const file = "file:///Users/me/Videos/My%20Course/001%20Intro.mp4";

  test("serves only the file opened in the requesting tab", () => {
    expect(isRequestUrlAllowed(file, file, true)).toBe(true);
    expect(
      isRequestUrlAllowed(
        "file:///Users/me/Videos/My Course/001 Intro.mp4",
        `${file}#t=10`,
        true,
      ),
    ).toBe(true);
  });

  test("refuses another file, a web page sender and a disabled build", () => {
    expect(
      isRequestUrlAllowed("file:///Users/me/.ssh/id_rsa", file, true),
    ).toBe(false);
    expect(isRequestUrlAllowed(file, "https://evil.example/x.mp4", true)).toBe(
      false,
    );
    expect(isRequestUrlAllowed(file, undefined, true)).toBe(false);
    expect(isRequestUrlAllowed(file, file, false)).toBe(false);
    expect(isRequestUrlAllowed("FILE:///etc/passwd", file, true)).toBe(false);
  });

  test("does not touch web requests", () => {
    expect(
      isRequestUrlAllowed("https://api.example/x", "https://a.example/", false),
    ).toBe(true);
  });
});

describe("local file build flag", () => {
  test("isLocalFileUrl follows the build flag", () => {
    const scope = globalThis as { VOT_LOCAL_FILE?: boolean };
    try {
      scope.VOT_LOCAL_FILE = true;
      expect(isLocalFileUrl("file:///a.mp4")).toBe(true);
      expect(isLocalFileUrl("https://youtu.be/abc")).toBe(false);
      scope.VOT_LOCAL_FILE = false;
      expect(isLocalFileUrl("file:///a.mp4")).toBe(false);
    } finally {
      delete scope.VOT_LOCAL_FILE;
    }
  });
});

describe("local file request bookkeeping", () => {
  test("parallel first requests share one salt", async () => {
    const store = createStore();
    const [first, second] = await Promise.all([
      getLocalFileRequestId("a.mp4|189|en|ru", { store }),
      getLocalFileRequestId("a.mp4|189|en|ru", { store }),
    ]);
    expect(first).toBe(second);
    expect(await getLocalFileRequestId("a.mp4|189|en|ru", { store })).toBe(
      first,
    );
  });

  test("a failed request is renewed once", () => {
    registerLocalFileSource("failedId0001", "file:///a/f.mp4", "f|1|en|ru");
    expect(consumeLocalFileFailure("f|1|en|ru")).toBe(false);
    markLocalFileRequestFailed("failedId0001");
    expect(consumeLocalFileFailure("f|1|en|ru")).toBe(true);
    expect(consumeLocalFileFailure("f|1|en|ru")).toBe(false);
  });

  test("repeated audio requests for one id are capped", () => {
    for (let i = 0; i < LOCAL_FILE_MAX_UPLOADS; i++) {
      expect(allowLocalFileUpload("loopId00001")).toBe(true);
    }
    expect(allowLocalFileUpload("loopId00001")).toBe(false);
    resetLocalFileUploads("loopId00001");
    expect(allowLocalFileUpload("loopId00001")).toBe(true);
  });
});
