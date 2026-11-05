import YoutubeHelper from "@vot.js/ext/helpers/youtube";
import { describe, expect, test } from "vitest";
import { VOTVideoManager } from "../src/core/videoManager.ts";

const YOUTUBE_PLAYER_VOLUME_STORAGE_KEY = "yt-player-volume";

describe("VOTVideoManager YouTube volume writes", () => {
  test("preserves YouTube storage only for auto-volume writes", async () => {
    const originalSetVolume = YoutubeHelper.setVolume;

    try {
      YoutubeHelper.setVolume = ((volume: number) => {
        localStorage.setItem(
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
      expect(localStorage.getItem(YOUTUBE_PLAYER_VOLUME_STORAGE_KEY)).toBe(
        "written:0.2",
      );

      localStorage.setItem(YOUTUBE_PLAYER_VOLUME_STORAGE_KEY, "user-volume");
      manager.setVideoVolume(0.1, { preserveYoutubeVolumeStorage: true });
      expect(localStorage.getItem(YOUTUBE_PLAYER_VOLUME_STORAGE_KEY)).toBe(
        "user-volume",
      );
    } finally {
      YoutubeHelper.setVolume = originalSetVolume;
    }
  });

  test("treats a numeric zero from YouTube as a successful volume write", async () => {
    const originalSetVolume = YoutubeHelper.setVolume;
    const video = { volume: 0.75, muted: false };

    try {
      YoutubeHelper.setVolume = (() =>
        0) as unknown as typeof YoutubeHelper.setVolume;
      const manager = new VOTVideoManager({
        site: { host: "youtube" },
        video,
      } as any);

      manager.setVideoVolume(0);
      expect(video.volume).toBe(0.75);
    } finally {
      YoutubeHelper.setVolume = originalSetVolume;
    }
  });
});
