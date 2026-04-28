import { describe, expect, test } from "bun:test";

const YOUTUBE_PLAYER_VOLUME_STORAGE_KEY = "yt-player-volume";

function createStorage(initialValue: string | null) {
  let value = initialValue;

  return {
    getItem(key: string) {
      return key === YOUTUBE_PLAYER_VOLUME_STORAGE_KEY ? value : null;
    },
    setItem(key: string, nextValue: string) {
      if (key === YOUTUBE_PLAYER_VOLUME_STORAGE_KEY) {
        value = nextValue;
      }
    },
    removeItem(key: string) {
      if (key === YOUTUBE_PLAYER_VOLUME_STORAGE_KEY) {
        value = null;
      }
    },
    read() {
      return value;
    },
  };
}

describe("VOTVideoManager YouTube volume writes", () => {
  test("preserves YouTube storage only for auto-volume writes", async () => {
    (globalThis as unknown as { DEBUG_MODE: boolean }).DEBUG_MODE = false;
    const { VOTVideoManager } = await import("../src/core/videoManager.ts");
    const { default: YoutubeHelper } = await import(
      "@vot.js/ext/helpers/youtube"
    );
    const originalSetVolume = YoutubeHelper.setVolume;
    const previousLocalStorage = globalThis.localStorage;
    const storage = createStorage("user-volume");

    try {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: storage,
      });
      YoutubeHelper.setVolume = ((volume: number) => {
        globalThis.localStorage.setItem(
          YOUTUBE_PLAYER_VOLUME_STORAGE_KEY,
          `written:${volume}`,
        );
        return true;
      }) as typeof YoutubeHelper.setVolume;

      const manager = new VOTVideoManager({
        site: { host: "youtube" },
        video: { volume: 0.75, muted: false },
      } as any);

      manager.setVideoVolume(0.2);
      expect(storage.read()).toBe("written:0.2");

      storage.setItem(YOUTUBE_PLAYER_VOLUME_STORAGE_KEY, "user-volume");
      manager.setVideoVolume(0.1, { preserveYoutubeVolumeStorage: true });
      expect(storage.read()).toBe("user-volume");
    } finally {
      YoutubeHelper.setVolume = originalSetVolume;
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: previousLocalStorage,
      });
    }
  });
});
