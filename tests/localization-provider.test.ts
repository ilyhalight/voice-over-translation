import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import { captureGlobal } from "./helpers/globals";
import { memoryStorage } from "./helpers/storage";

const restoreGlobals = ["DEBUG_MODE", "VOT_VERSION", "localStorage"].map(
  captureGlobal,
);

(globalThis as unknown as { DEBUG_MODE: boolean }).DEBUG_MODE = false;
(globalThis as unknown as { VOT_VERSION: string }).VOT_VERSION = "1.0.0";

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: memoryStorage(),
});

const { localizationProvider } = await import(
  "../src/localization/localizationProvider"
);
const { votStorage } = await import("../src/utils/storage");

const originalFetch = globalThis.fetch;
const originalLang = localizationProvider.lang;
const LANG = "ru";
const PHRASES = JSON.stringify({ hello: "privet" });
let requestedUrls: string[] = [];

function stubFetch() {
  globalThis.fetch = (async (url: unknown) => {
    const href = String(url);
    requestedUrls.push(href);
    return href.includes("hashes.json")
      ? new Response(JSON.stringify({ [LANG]: "hash-ru" }))
      : new Response(PHRASES);
  }) as typeof fetch;
}

async function seedCache(cache: Record<string, string>) {
  await Promise.all(
    Object.entries(cache).map(([key, value]) =>
      votStorage.set(key as "localeVersion", value),
    ),
  );
}

beforeEach(async () => {
  requestedUrls = [];
  localizationProvider.lang = LANG;
  await localizationProvider.reset();
  stubFetch();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  localizationProvider.lang = originalLang;
});

afterAll(async () => {
  // init() with empty storage restores the provider's default language,
  // override and phrases; it must run while the in-memory storage is installed.
  await localizationProvider.reset();
  await localizationProvider.init();
  for (const restore of restoreGlobals) restore();
});

describe("localizationProvider.checkUpdates", () => {
  test("fetches when version matches but phrases are empty", async () => {
    await seedCache({ localeVersion: "1.0.0", localeLang: LANG });

    expect(await localizationProvider.checkUpdates()).toBe("hash-ru");
    expect(requestedUrls).toHaveLength(1);
  });

  test("fetches when version matches but cached language differs", async () => {
    await seedCache({
      localeVersion: "1.0.0",
      localeLang: "de",
      localePhrases: PHRASES,
    });

    expect(await localizationProvider.checkUpdates()).toBe("hash-ru");
    expect(requestedUrls).toHaveLength(1);
  });

  test("skips the network when version, language and phrases match", async () => {
    await seedCache({
      localeVersion: "1.0.0",
      localeLang: LANG,
      localePhrases: PHRASES,
    });

    expect(await localizationProvider.checkUpdates()).toBe(false);
    expect(requestedUrls).toHaveLength(0);
  });

  test("does not treat an equal hash as up to date without phrases", async () => {
    await seedCache({ localeHash: "hash-ru", localeLang: LANG });

    expect(await localizationProvider.checkUpdates()).toBe("hash-ru");
  });
});

describe("localizationProvider.hasUsableCache", () => {
  test("is false when phrases are empty", async () => {
    await seedCache({ localeLang: LANG, localePhrases: "  " });

    expect(await localizationProvider.hasUsableCache()).toBe(false);
  });

  test("is false when the cached language differs", async () => {
    await seedCache({ localeLang: "de", localePhrases: PHRASES });

    expect(await localizationProvider.hasUsableCache()).toBe(false);
  });

  test("is true when language and phrases match", async () => {
    await seedCache({ localeLang: LANG, localePhrases: PHRASES });

    expect(await localizationProvider.hasUsableCache()).toBe(true);
  });
});

describe("localizationProvider.update", () => {
  test("downloads the locale when the cache has no phrases", async () => {
    await seedCache({ localeVersion: "1.0.0", localeLang: LANG });

    await localizationProvider.update();

    expect(requestedUrls.some((url) => url.includes("/ru.json"))).toBe(true);
    expect(await votStorage.get("localePhrases", "")).toBe(PHRASES);
  });
});
