import { beforeEach, describe, expect, test } from "bun:test";
import { authLoginUrl } from "../src/config/config";
import { localizationProvider } from "../src/localization/localizationProvider";
import { handleTranslationButtonCommand } from "../src/ui/translationCommands";

type StoredValues = Record<string, string>;

const storedValues: StoredValues = {};
const openedUrls: string[] = [];

Object.defineProperty(globalThis, "DEBUG_MODE", {
  configurable: true,
  writable: true,
  value: false,
});

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => storedValues[key] ?? null,
    setItem: (key: string, value: string) => {
      storedValues[key] = value;
    },
    removeItem: (key: string) => {
      delete storedValues[key];
    },
  },
});

Object.defineProperty(globalThis, "open", {
  configurable: true,
  writable: true,
  value: (url: string) => {
    openedUrls.push(url);
    return {
      focus() {
        return undefined;
      },
    };
  },
});

function createVideoHandler(account?: { token?: string; expires?: number }) {
  return {
    data: {
      account,
      useLivelyVoice: true,
    },
    votClient: {
      apiToken: account?.token,
    },
    uiManager: {
      votOverlayView: {
        syncVoicePopoverStateCalls: 0,
        syncVoicePopoverState() {
          this.syncVoicePopoverStateCalls += 1;
        },
      },
    },
    actionsAbortController: new AbortController(),
    hasActiveSource: () => false,
    videoData: {
      videoId: "video",
      isStream: false,
      detectedLanguage: "en",
      responseLanguage: "ru",
    },
    getVideoData: async () => {
      throw new Error("getVideoData should not run");
    },
    translateFunc: async () => {
      throw new Error("translateFunc should not run");
    },
    videoManager: {
      ensureDetectedLanguageForTranslation: async () => {
        throw new Error("ensureDetectedLanguageForTranslation should not run");
      },
    },
  };
}

describe("translation auth command", () => {
  beforeEach(() => {
    openedUrls.length = 0;
    for (const key of Object.keys(storedValues)) {
      delete storedValues[key];
    }
  });

  test("expires live voice auth, falls back to standard voice and opens auth", async () => {
    const videoHandler = createVideoHandler({
      token: "token",
      expires: Date.now() - 1,
    });
    const buttonStates: Array<[string, string]> = [];

    await handleTranslationButtonCommand({
      videoHandler: videoHandler as any,
      currentStatus: "none",
      currentLoading: false,
      transformBtn: (status, text) => {
        buttonStates.push([status, text]);
      },
    });

    expect(videoHandler.data.useLivelyVoice).toBe(false);
    expect(videoHandler.data.account).toEqual({});
    expect(videoHandler.votClient.apiToken).toBeUndefined();
    expect(storedValues.useLivelyVoice).toBe("false");
    expect(openedUrls).toEqual([authLoginUrl]);
    expect(buttonStates).toEqual([
      ["error", localizationProvider.get("VOTYandexTokenExpired")],
    ]);
    expect(
      videoHandler.uiManager.votOverlayView.syncVoicePopoverStateCalls,
    ).toBe(1);
  });

  test("requires auth for live voice without token and opens auth", async () => {
    const videoHandler = createVideoHandler();
    const buttonStates: Array<[string, string]> = [];

    await handleTranslationButtonCommand({
      videoHandler: videoHandler as any,
      currentStatus: "none",
      currentLoading: false,
      transformBtn: (status, text) => {
        buttonStates.push([status, text]);
      },
    });

    expect(videoHandler.data.useLivelyVoice).toBe(false);
    expect(storedValues.useLivelyVoice).toBe("false");
    expect(openedUrls).toEqual([authLoginUrl]);
    expect(buttonStates).toEqual([
      ["error", localizationProvider.get("VOTAccountRequired")],
    ]);
    expect(
      videoHandler.uiManager.votOverlayView.syncVoicePopoverStateCalls,
    ).toBe(1);
  });
});
