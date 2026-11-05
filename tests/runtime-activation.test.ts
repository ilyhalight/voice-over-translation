import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import { localizationProvider } from "../src/localization/localizationProvider";
import { votStorage } from "../src/utils/storage";

const originalFetch = globalThis.fetch;
const originalTop = Object.getOwnPropertyDescriptor(globalThis, "top");
const LANG = "ru";
const PHRASES = JSON.stringify({ hello: "privet" });
let requestedUrls: string[] = [];

async function activateRuntime() {
  const { ensureRuntimeActivated } = await import(
    "../src/bootstrap/runtimeActivation.ts"
  );
  await ensureRuntimeActivated("test", () => {});
}

function setIframe(value: boolean) {
  Object.defineProperty(globalThis, "top", {
    configurable: true,
    value: value ? {} : globalThis.self,
  });
}

beforeEach(async () => {
  requestedUrls = [];
  localizationProvider.lang = LANG;
  await localizationProvider.reset();
  // init() recomputes the language from this override.
  await votStorage.set("localeLangOverride", LANG);
  globalThis.fetch = (async (url: unknown) => {
    const href = String(url);
    requestedUrls.push(href);
    return href.includes("hashes.json")
      ? new Response(JSON.stringify({ [LANG]: "hash-ru" }))
      : new Response(PHRASES);
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalTop) {
    Object.defineProperty(globalThis, "top", originalTop);
  } else {
    Reflect.deleteProperty(globalThis, "top");
  }
});

afterAll(async () => {
  // init() with empty storage restores the provider's default language,
  // override and phrases; it must run while the in-memory storage is installed.
  await localizationProvider.reset();
  await localizationProvider.init();
});

describe("runtime activation locale update", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("iframe with a usable cache skips update", async () => {
    await votStorage.set("localeLang", LANG);
    await votStorage.set("localePhrases", PHRASES);
    setIframe(true);

    await activateRuntime();

    expect(requestedUrls).toHaveLength(0);
  });

  test("iframe with an empty cache downloads the locale", async () => {
    setIframe(true);

    await activateRuntime();

    expect(requestedUrls.some((url) => url.includes("/ru.json"))).toBe(true);
    expect(await votStorage.get("localePhrases", "")).toBe(PHRASES);
  });

  test("top frame always calls update", async () => {
    await votStorage.set("localeLang", LANG);
    await votStorage.set("localePhrases", PHRASES);
    await votStorage.set("localeVersion", "0.0.1");
    setIframe(false);

    await activateRuntime();

    expect(requestedUrls.some((url) => url.includes("hashes.json"))).toBe(true);
  });
});
