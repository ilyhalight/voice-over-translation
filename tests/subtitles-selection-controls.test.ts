import { expect, test } from "bun:test";
import type { VideoHandler } from "../src/VideoHandler";

Object.assign(globalThis, { DEBUG_MODE: false });
const { changeSubtitlesLang, ensureSubtitlesForCurrentLangPair } = await import(
  "../src/videoHandler/modules/subtitles"
);

test("invalid subtitle selection resets the overlay state", async () => {
  const selections: string[] = [];
  const handler = {
    uiManager: {
      votOverlayView: {
        overlayViewControls: {
          setSelectedSubtitles: (value: string) => selections.push(value),
          setShowDownloadSubtitles: () => {},
        },
      },
    },
    subtitles: [],
    hasSubtitlesWidget: () => false,
    yandexSubtitles: [],
  } as unknown as VideoHandler;

  await changeSubtitlesLang.call(handler, "invalid");

  expect(selections).toEqual(["invalid", "disabled"]);
  expect(handler.yandexSubtitles).toBeNull();
});

test("opening subtitles keeps an active auto-language selection", async () => {
  let loads = 0;
  const handler = {
    videoData: {
      videoId: "video",
      detectedLanguage: "auto",
      responseLanguage: "ru",
    },
    subtitles: [{}],
    subtitlesCacheKey: "video_auto_ru_true",
    getPreferredSubtitlesLanguage: () => "ru",
    getSubtitlesCacheKey: (
      videoId: string,
      detectedLanguage: string,
      subtitleLanguage: string,
    ) => `${videoId}_${detectedLanguage}_${subtitleLanguage}_true`,
    cacheManager: {
      getSubtitles: () => undefined,
    },
    loadSubtitles: async () => {
      loads += 1;
    },
  } as unknown as VideoHandler;

  await ensureSubtitlesForCurrentLangPair.call(handler);

  expect(loads).toBe(0);
});
