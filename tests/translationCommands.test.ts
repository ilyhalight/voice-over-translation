import { beforeEach, describe, expect, test } from "bun:test";

type StoredValues = Record<string, string>;
type OpenCall = {
  url?: string;
  target?: string;
  features?: string;
};

const storedValues: StoredValues = {};
const sessionStoredValues: StoredValues = {};
const openCalls: OpenCall[] = [];

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

Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => sessionStoredValues[key] ?? null,
    setItem: (key: string, value: string) => {
      sessionStoredValues[key] = value;
    },
    removeItem: (key: string) => {
      delete sessionStoredValues[key];
    },
  },
});

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

const { handleTranslationButtonCommand } = await import(
  "../src/ui/translationCommands"
);

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
  beforeEach(() => {
    openCalls.length = 0;
    for (const key of Object.keys(storedValues)) {
      delete storedValues[key];
    }
    for (const key of Object.keys(sessionStoredValues)) {
      delete sessionStoredValues[key];
    }
  });

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
    expect(storedValues.useLivelyVoice).toBeUndefined();
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
    expect(storedValues.useLivelyVoice).toBeUndefined();
    expect(openCalls).toEqual([]);
    expect(buttonStates).toEqual([]);
    expect(videoHandler.calls.ensureDetectedLanguage).toBe(1);
    expect(videoHandler.calls.translateFunc).toBe(1);
  });

  test("an idle error click retries in the same click without stopping", async () => {
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

    // Reset to idle, but do not abort the background preparation.
    expect(buttonStates.map(([status]) => status)).toEqual(["none"]);
    expect(videoHandler.actionsAbortController.signal.aborted).toBe(false);
    expect(stops).toBe(0);
    expect(videoHandler.calls.ensureDetectedLanguage).toBe(1);
    expect(videoHandler.calls.translateFunc).toBe(1);
  });

  test("an active/loading click still aborts and stops", async () => {
    const videoHandler = createVideoHandler();
    let stops = 0;
    videoHandler.stopTranslation = async () => {
      stops += 1;
    };

    await handleTranslationButtonCommand({
      videoHandler: videoHandler as any,
      currentStatus: "loading",
      currentLoading: true,
      transformBtn: () => undefined,
    });

    expect(videoHandler.actionsAbortController.signal.aborted).toBe(true);
    expect(stops).toBe(1);
    expect(videoHandler.calls.translateFunc).toBe(0);
  });
});
