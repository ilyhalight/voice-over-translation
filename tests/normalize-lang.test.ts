import { describe, expect, test } from "bun:test";

// Set DEBUG_MODE before importing — required by utils/debug.ts.
(globalThis as unknown as { DEBUG_MODE: boolean }).DEBUG_MODE = false;

describe("normalizeToRequestLang via resolveDetectedLanguageForVideo", () => {
  // Yandex's translation API only accepts the primary language subtag.
  // `availableLangs` contains `zh` but not `zh-Hant` or `zh-Hans`, so all
  // script/region-tagged Chinese inputs must collapse to `zh`. The same
  // applies to other script-tagged languages.

  test("collapses zh-Hant (Traditional Chinese) to zh", async () => {
    const { resolveDetectedLanguageForVideo } = await import(
      "../src/core/videoManager.ts"
    );

    const result = await resolveDetectedLanguageForVideo({
      isStream: false,
      host: "youtube",
      possibleLanguage: "zh-Hant",
      title: "",
      description: "",
      allowTextLanguageDetection: false,
      detectLanguage: async () => undefined,
    });

    expect(result.detectedLanguage).toBe("zh");
    expect(result.cacheLanguage).toBe("zh");
  });

  test("collapses zh-Hans (Simplified Chinese) to zh", async () => {
    const { resolveDetectedLanguageForVideo } = await import(
      "../src/core/videoManager.ts"
    );

    const result = await resolveDetectedLanguageForVideo({
      isStream: false,
      host: "youtube",
      possibleLanguage: "zh-Hans",
      title: "",
      description: "",
      allowTextLanguageDetection: false,
      detectLanguage: async () => undefined,
    });

    expect(result.detectedLanguage).toBe("zh");
  });

  test("collapses lowercase zh-hant to zh", async () => {
    const { resolveDetectedLanguageForVideo } = await import(
      "../src/core/videoManager.ts"
    );

    const result = await resolveDetectedLanguageForVideo({
      isStream: false,
      host: "youtube",
      possibleLanguage: "zh-hant",
      title: "",
      description: "",
      allowTextLanguageDetection: false,
      detectLanguage: async () => undefined,
    });

    expect(result.detectedLanguage).toBe("zh");
  });

  test("collapses underscore separator zh_Hant to zh", async () => {
    const { resolveDetectedLanguageForVideo } = await import(
      "../src/core/videoManager.ts"
    );

    const result = await resolveDetectedLanguageForVideo({
      isStream: false,
      host: "youtube",
      possibleLanguage: "zh_Hant",
      title: "",
      description: "",
      allowTextLanguageDetection: false,
      detectLanguage: async () => undefined,
    });

    expect(result.detectedLanguage).toBe("zh");
  });

  test("collapses region tag zh-CN to zh", async () => {
    const { resolveDetectedLanguageForVideo } = await import(
      "../src/core/videoManager.ts"
    );

    const result = await resolveDetectedLanguageForVideo({
      isStream: false,
      host: "youtube",
      possibleLanguage: "zh-CN",
      title: "",
      description: "",
      allowTextLanguageDetection: false,
      detectLanguage: async () => undefined,
    });

    expect(result.detectedLanguage).toBe("zh");
  });

  test("normalizes simple language codes (en, ru, ja)", async () => {
    const { resolveDetectedLanguageForVideo } = await import(
      "../src/core/videoManager.ts"
    );

    for (const lang of ["en", "ru", "ja", "de", "fr"]) {
      const result = await resolveDetectedLanguageForVideo({
        isStream: false,
        host: "youtube",
        possibleLanguage: lang,
        title: "",
        description: "",
        allowTextLanguageDetection: false,
        detectLanguage: async () => undefined,
      });
      expect(result.detectedLanguage).toBe(lang);
    }
  });

  test("normalizes uppercase language codes (EN, RU)", async () => {
    const { resolveDetectedLanguageForVideo } = await import(
      "../src/core/videoManager.ts"
    );

    for (const [input, expected] of [
      ["EN", "en"],
      ["RU", "ru"],
      ["JA", "ja"],
    ] as const) {
      const result = await resolveDetectedLanguageForVideo({
        isStream: false,
        host: "youtube",
        possibleLanguage: input,
        title: "",
        description: "",
        allowTextLanguageDetection: false,
        detectLanguage: async () => undefined,
      });
      expect(result.detectedLanguage).toBe(expected);
    }
  });

  test("returns 'auto' for unrecognized language", async () => {
    const { resolveDetectedLanguageForVideo } = await import(
      "../src/core/videoManager.ts"
    );

    const result = await resolveDetectedLanguageForVideo({
      isStream: false,
      host: "youtube",
      possibleLanguage: "xx-YY",
      title: "",
      description: "",
      allowTextLanguageDetection: false,
      detectLanguage: async () => undefined,
    });

    expect(result.detectedLanguage).toBe("auto");
  });

  test("returns 'auto' for non-string input", async () => {
    const { resolveDetectedLanguageForVideo } = await import(
      "../src/core/videoManager.ts"
    );

    const result = await resolveDetectedLanguageForVideo({
      isStream: false,
      host: "youtube",
      possibleLanguage: 123,
      title: "",
      description: "",
      allowTextLanguageDetection: false,
      detectLanguage: async () => undefined,
    });

    expect(result.detectedLanguage).toBe("auto");
  });
});
