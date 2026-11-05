import { describe, expect, test } from "vitest";
import { handleTranslationButtonCommand } from "../src/ui/translationCommands";

type OpenCall = {
  url?: string;
  target?: string;
  features?: string;
};

const openCalls: OpenCall[] = [];
Object.defineProperty(globalThis, "open", {
  configurable: true,
  writable: true,
  value: (url?: string, target?: string, features?: string) => {
    openCalls.push({ url, target, features });
    return {
      focus() {
        return undefined;
      },
    };
  },
});

function createVideoHandler(account?: { token?: string; expires?: number }) {
  const calls = {
    ensureDetectedLanguage: 0,
    translateFunc: 0,
  };

  return {
    calls,
    data: {
      account,
      useLivelyVoice: true,
    },
    site: {
      host: "youtube",
      additionalData: undefined,
    },
    votClient: {
      provider: {
        apiToken: account?.token,
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
    stopTranslation: async () => undefined,
    stopTranslate: async () => undefined,
    translateFunc: async () => {
      calls.translateFunc += 1;
    },
    videoManager: {
      ensureDetectedLanguageForTranslation: async () => {
        calls.ensureDetectedLanguage += 1;
      },
    },
  };
}

describe("translation auth command", () => {
  test("shows expired session separately from login-required live voice state", async () => {
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

    expect(videoHandler.data.useLivelyVoice).toBe(true);
    expect(videoHandler.data.account).toEqual({});
    expect(videoHandler.votClient.provider.apiToken).toBeUndefined();
    expect(localStorage.getItem("useLivelyVoice")).toBeNull();
    expect(openCalls).toHaveLength(1);
    expect(buttonStates).toEqual([["error", "Session expired. Log in again"]]);
    expect(videoHandler.calls.ensureDetectedLanguage).toBe(0);
    expect(videoHandler.calls.translateFunc).toBe(0);
  });

  test("requests live voice translation without token and without pre-auth", async () => {
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

    expect(videoHandler.data.useLivelyVoice).toBe(true);
    expect(localStorage.getItem("useLivelyVoice")).toBeNull();
    expect(openCalls).toHaveLength(1);
    expect(buttonStates).toEqual([]);
    expect(videoHandler.calls.ensureDetectedLanguage).toBe(1);
    expect(videoHandler.calls.translateFunc).toBe(1);
  });

  test("an idle error click clears the error and stops without retrying", async () => {
    const videoHandler = createVideoHandler();
    const buttonStates: Array<[string, string]> = [];
    let stops = 0;
    videoHandler.stopTranslation = async () => {
      stops += 1;
    };

    await handleTranslationButtonCommand({
      videoHandler: videoHandler as any,
      currentStatus: "error",
      currentLoading: false,
      transformBtn: (status, text) => {
        buttonStates.push([status, text]);
      },
    });

    expect(buttonStates.map(([status]) => status)).toEqual(["none"]);
    expect(videoHandler.actionsAbortController.signal.aborted).toBe(true);
    expect(stops).toBe(1);
    expect(videoHandler.calls.ensureDetectedLanguage).toBe(0);
    expect(videoHandler.calls.translateFunc).toBe(0);
  });

  test("an active/loading click still aborts and stops", async () => {
    const videoHandler = createVideoHandler();
    let stops = 0;
    videoHandler.stopTranslation = async () => {
      stops += 1;
    };

    await handleTranslationButtonCommand({
      videoHandler: videoHandler as any,
      currentStatus: "error",
      currentLoading: true,
      transformBtn: () => undefined,
    });

    expect(videoHandler.actionsAbortController.signal.aborted).toBe(true);
    expect(stops).toBe(1);
    expect(videoHandler.calls.translateFunc).toBe(0);
  });
});
