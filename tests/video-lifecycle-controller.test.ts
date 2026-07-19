import { describe, expect, test } from "bun:test";

async function loadGetYouTubeSourceKey() {
  (globalThis as unknown as { DEBUG_MODE: boolean }).DEBUG_MODE = false;
  const { getYouTubeSourceKey } = await import(
    "../src/core/videoLifecycleController"
  );
  return getYouTubeSourceKey;
}

describe("getYouTubeSourceKey", () => {
  test("ignores timestamp parameters", async () => {
    const getYouTubeSourceKey = await loadGetYouTubeSourceKey();
    const beforeSeek = getYouTubeSourceKey(
      new URL("https://www.youtube.com/watch?v=video-id&t=60"),
      "0",
    );
    const afterSeek = getYouTubeSourceKey(
      new URL(
        "https://www.youtube.com/watch?v=video-id&t=120&start=120&time_continue=120",
      ),
      "0",
    );

    expect(afterSeek).toBe(beforeSeek);
  });

  test("changes when the video changes", async () => {
    const getYouTubeSourceKey = await loadGetYouTubeSourceKey();
    const firstVideo = getYouTubeSourceKey(
      new URL("https://www.youtube.com/watch?v=first-video"),
      "0",
    );
    const secondVideo = getYouTubeSourceKey(
      new URL("https://www.youtube.com/watch?v=second-video"),
      "0",
    );

    expect(secondVideo).not.toBe(firstVideo);
  });
});
