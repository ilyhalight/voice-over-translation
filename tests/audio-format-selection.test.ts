import { expect, test } from "bun:test";

const {
  describeTrack,
  parseXtags,
  selectAudioFormat,
  selectVideoFallbackFormat,
} = await import("../src/audioDownloader/strategies/formatSelection");

const OPUS = 'audio/webm; codecs="opus"';
const AAC = 'audio/mp4; codecs="mp4a.40.2"';
const MUXED = 'video/mp4; codecs="avc1.42001E, mp4a.40.2"';

/** One audio-only entry of an `adaptiveFormats` list. */
function audio(
  itag: number,
  bitrate: number,
  mimeType: string,
  xtags?: string,
  audioTrack?: Record<string, unknown>,
  isDrc?: boolean,
) {
  return {
    itag,
    url: `https://example.com/${itag}`,
    mimeType,
    bitrate,
    contentLength: String(bitrate),
    ...(xtags ? { xtags } : {}),
    ...(audioTrack ? { audioTrack } : {}),
    ...(isDrc ? { isDrc } : {}),
  };
}

test("reads the language and the content of an audio track", () => {
  // `xtags` arrives percent-encoded in some client answers.
  const tags = parseXtags("acont%3Ddubbed-auto%3Alang%3Den-US");
  expect(tags.get("acont")).toBe("dubbed-auto");
  expect(tags.get("lang")).toBe("en-us");

  expect(
    describeTrack(audio(249, 50_000, OPUS, "acont=dubbed-auto:lang=en-US")),
  ).toMatchObject({ language: "en", content: "dubbed-auto" });
  expect(
    describeTrack(
      audio(140, 128_000, AAC, undefined, {
        id: "ru-RU.4",
        displayName: "Russian original",
        audioIsDefault: true,
      }),
    ),
  ).toMatchObject({ language: "ru", content: "original", isDefault: true });
});

test("prefers English audio, dubbed or not, over every other language", () => {
  const dubbed = selectAudioFormat([
    audio(249, 50_000, OPUS, "acont=original:lang=ja"),
    audio(251, 128_000, OPUS, "acont=dubbed-auto:lang=en"),
  ]);
  expect(dubbed.track?.language).toBe("en");
  expect(dubbed.track?.content).toBe("dubbed-auto");

  // Inside English the untouched original wins over a dub of the same video.
  const original = selectAudioFormat([
    audio(249, 50_000, OPUS, "acont=dubbed:lang=en"),
    audio(251, 128_000, OPUS, "acont=original:lang=en"),
  ]);
  expect(original.track?.content).toBe("original");
  expect(original.format.itag).toBe(251);

  // An audio description talks over the content, so a dub is preferred.
  const described = selectAudioFormat([
    audio(249, 50_000, OPUS, "acont=descriptive:lang=en"),
    audio(251, 128_000, OPUS, "acont=dubbed:lang=en"),
  ]);
  expect(described.track?.content).toBe("dubbed");
});

test("falls back to the original track when no English audio exists", () => {
  const byXtags = selectAudioFormat([
    audio(249, 50_000, OPUS, "acont=dubbed:lang=de"),
    audio(251, 128_000, OPUS, "acont=original:lang=ja"),
  ]);
  expect(byXtags.track?.language).toBe("ja");

  // Older answers only mark the default track instead of naming `acont`.
  const byFlag = selectAudioFormat([
    audio(249, 50_000, OPUS, undefined, { id: "de.3", displayName: "German" }),
    audio(251, 128_000, OPUS, undefined, {
      id: "ja.4",
      displayName: "Japanese",
      audioIsDefault: true,
    }),
  ]);
  expect(byFlag.track?.language).toBe("ja");
  expect(byFlag.track?.isDefault).toBe(true);
});

test("picks the cheapest stream of the selected track", () => {
  const opus = selectAudioFormat([
    audio(251, 128_000, OPUS),
    audio(250, 70_000, OPUS),
    audio(249, 50_000, OPUS),
    audio(140, 128_000, AAC),
  ]);
  expect(opus.format.itag).toBe(249);
  expect(opus.reason).toBe("lowest-bitrate opus");

  // Without Opus the cheapest separate audio stream wins (AAC-HE, ~48 kbps).
  const aac = selectAudioFormat([
    audio(140, 128_000, AAC),
    audio(139, 48_000, AAC),
  ]);
  expect(aac.format.itag).toBe(139);
  expect(aac.reason).toBe("lowest-bitrate audio");

  // Both reported rates are read, the lower of the two counts.
  const byAverage = selectAudioFormat([
    { ...audio(251, 128_000, OPUS), averageBitrate: 130_000 },
    { ...audio(250, 70_000, OPUS), averageBitrate: 49_000 },
  ]);
  expect(byAverage.format.itag).toBe(250);

  // A "stable volume" duplicate is only taken when nothing else is left.
  const drc = selectAudioFormat([
    audio(249, 50_000, OPUS, undefined, undefined, true),
    audio(249, 50_000, OPUS),
  ]);
  expect(drc.format.isDrc).toBeUndefined();
});

test("never selects a video stream as the audio stream", () => {
  expect(() =>
    selectAudioFormat([
      { itag: 18, url: "https://example.com/18", mimeType: MUXED },
    ]),
  ).toThrow("no direct audio formats");

  // A SABR-only client answers formats without any URL.
  expect(() =>
    selectAudioFormat([{ itag: 251, mimeType: OPUS, bitrate: 128_000 }]),
  ).toThrow("no direct audio formats");
});

test("falls back to the smallest video stream as a last resort", () => {
  const muxed = selectVideoFallbackFormat([
    {
      itag: 18,
      url: "https://example.com/18",
      mimeType: MUXED,
      qualityLabel: "360p",
      bitrate: 600_000,
    },
    {
      itag: 91,
      url: "https://example.com/91",
      mimeType: MUXED,
      qualityLabel: "144p",
      bitrate: 200_000,
    },
    {
      itag: 278,
      url: "https://example.com/278",
      mimeType: 'video/webm; codecs="vp9"',
      height: 144,
      bitrate: 76_000,
    },
  ]);
  // 144p, and muxed so the picture still arrives with its audio.
  expect(muxed.format.itag).toBe(91);
  expect(muxed.reason).toBe("lowest-quality muxed video");

  const videoOnly = selectVideoFallbackFormat([
    {
      itag: 133,
      url: "https://example.com/133",
      mimeType: 'video/mp4; codecs="avc1.4d400d"',
      height: 240,
      bitrate: 200_000,
    },
    {
      itag: 160,
      url: "https://example.com/160",
      mimeType: 'video/mp4; codecs="avc1.4d400c"',
      height: 144,
      bitrate: 100_000,
    },
  ]);
  expect(videoOnly.format.itag).toBe(160);
  expect(videoOnly.reason).toBe("lowest-quality video-only");

  expect(() => selectVideoFallbackFormat([])).toThrow(
    "no video fallback format",
  );
});
