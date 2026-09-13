import { expect, test } from "bun:test";

(globalThis as unknown as { DEBUG_MODE: boolean }).DEBUG_MODE = false;

const {
  cloneFormat,
  filterPlayerResponseFormats,
  filterPlayerResponseJson,
  selectSinglePlayerFormat,
} = await import("../src/audioDownloader/strategies/playerResponseFilter");

const { isPoTokenRejection, mintPagePoToken, selectGvsPoTokenBinding } =
  await import("../src/audioDownloader/strategies/webAbr");

const opus249 = {
  itag: 249,
  url: "https://gvs/249",
  mimeType: 'audio/webm; codecs="opus"',
  bitrate: 50_000,
  contentLength: "100",
  audioTrack: { id: "ru.3", displayName: "Russian" },
};

const opus251 = {
  itag: 251,
  url: "https://gvs/251",
  mimeType: 'audio/webm; codecs="opus"',
  bitrate: 128_000,
  contentLength: "300",
};

const aac140 = {
  itag: 140,
  url: "https://gvs/140",
  mimeType: 'audio/mp4; codecs="mp4a.40.2"',
  bitrate: 128_000,
};

const video160 = {
  itag: 160,
  url: "https://gvs/160",
  mimeType: 'video/mp4; codecs="avc1.4d400c"',
  bitrate: 110_000,
  height: 144,
  qualityLabel: "144p",
};

const video360 = {
  itag: 134,
  url: "https://gvs/134",
  mimeType: 'video/mp4; codecs="avc1.4d401e"',
  height: 360,
  qualityLabel: "360p",
};

function buildResponse(adaptiveFormats: unknown[]) {
  return {
    responseContext: { visitorData: "visitor" },
    playabilityStatus: { status: "OK" },
    playerConfig: { audioConfig: { loudnessDb: 1.5 } },
    videoDetails: { videoId: "TVmV3-pEXss", lengthSeconds: "120" },
    storyboards: { playerStoryboardSpecRenderer: { spec: "spec" } },
    microformat: { playerMicroformatRenderer: { category: "Music" } },
    trackingParams: "tracking",
    annotations: [{ playerAnnotationsUrlsRenderer: {} }],
    streamingData: {
      expiresInSeconds: "21540",
      formats: [{ itag: 18, url: "https://gvs/18" }],
      adaptiveFormats,
      serverAbrStreamingUrl: "https://gvs/abr",
    },
    captions: { playerCaptionsTracklistRenderer: { audioTracks: [{}] } },
  };
}

test("keeps only the minimal Opus format", () => {
  const response = buildResponse([opus251, aac140, opus249, video160]);
  const filtered = filterPlayerResponseFormats(response);

  expect(filtered).not.toBe(response);
  expect(filtered.streamingData.adaptiveFormats).toHaveLength(1);
  expect(filtered.streamingData.adaptiveFormats[0]).toMatchObject({
    itag: 249,
    url: "https://gvs/249",
  });
});

test("falls back to the 144p video format without Opus", () => {
  const filtered = filterPlayerResponseFormats(
    buildResponse([aac140, video360, video160]),
  );

  expect(filtered.streamingData.adaptiveFormats).toHaveLength(1);
  expect(filtered.streamingData.adaptiveFormats[0]).toMatchObject({
    itag: 160,
  });
});

test("never touches the service branches of the player config", () => {
  const response = buildResponse([opus251, opus249]);
  const filtered = filterPlayerResponseFormats(response);

  for (const key of [
    "responseContext",
    "playabilityStatus",
    "playerConfig",
    "videoDetails",
    "storyboards",
    "microformat",
    "trackingParams",
    "annotations",
    "captions",
  ] as const) {
    expect(filtered[key]).toBe(response[key]);
  }
  // Only streamingData is re-created, and only its adaptiveFormats change.
  expect(filtered.streamingData.formats).toBe(response.streamingData.formats);
  expect(filtered.streamingData.expiresInSeconds).toBe("21540");
  expect(filtered.streamingData.serverAbrStreamingUrl).toBe("https://gvs/abr");
  expect(Object.keys(filtered.streamingData)).toEqual(
    Object.keys(response.streamingData),
  );
  // The source response stays untouched for every other consumer.
  expect(response.streamingData.adaptiveFormats).toHaveLength(2);
});

test("deep clones the kept format and drops storage-invalid values", () => {
  const format = {
    ...opus249,
    initRange: { start: "0", end: "259" },
    approxDurationMs: undefined,
    loudnessDb: Number.NaN,
    onTap: () => "nope",
  };
  const filtered = filterPlayerResponseFormats(buildResponse([format]));
  const kept = filtered.streamingData.adaptiveFormats[0] as Record<
    string,
    unknown
  >;

  expect(kept).not.toBe(format);
  expect(kept.initRange).not.toBe(format.initRange);
  expect(kept.initRange).toEqual({ start: "0", end: "259" });
  expect("approxDurationMs" in kept).toBe(false);
  expect("loudnessDb" in kept).toBe(false);
  expect("onTap" in kept).toBe(false);
  expect(JSON.stringify(kept)).toBeTruthy();
});

test("returns the original response when nothing is usable", () => {
  const withoutStreaming = { videoDetails: { videoId: "id" } };
  expect(filterPlayerResponseFormats(withoutStreaming)).toBe(withoutStreaming);

  const onlyAac = buildResponse([aac140, video360]);
  expect(filterPlayerResponseFormats(onlyAac)).toBe(onlyAac);

  expect(filterPlayerResponseFormats(undefined)).toBeUndefined();
  expect(selectSinglePlayerFormat([aac140, video360])).toBeUndefined();
});

test("filters a raw player response body", () => {
  const text = JSON.stringify(buildResponse([opus251, opus249, video160]));
  const filtered = JSON.parse(filterPlayerResponseJson(text));

  expect(filtered.streamingData.adaptiveFormats).toHaveLength(1);
  expect(filtered.streamingData.adaptiveFormats[0].itag).toBe(249);
  expect(filtered.videoDetails.videoId).toBe("TVmV3-pEXss");
  expect(filterPlayerResponseJson("not json")).toBe("not json");
});

test("clones nested arrays without holes", () => {
  expect(cloneFormat([1, undefined, { a: undefined, b: 2 }])).toEqual([
    1,
    null,
    { b: 2 },
  ]);
});

test("always binds the GVS PO token to the videoId for web_creator", () => {
  expect(
    selectGvsPoTokenBinding("TVmV3-pEXss", {
      loggedIn: true,
      dataSyncId: "data-sync-id",
      visitorData: "visitor",
      experimentFlags: [],
      client: "web_creator",
    }),
  ).toEqual({ kind: "video", value: "TVmV3-pEXss" });

  expect(
    selectGvsPoTokenBinding("TVmV3-pEXss", {
      loggedIn: false,
      dataSyncId: undefined,
      visitorData: "visitor",
      experimentFlags: [],
      client: "mweb",
    }),
  ).toEqual({ kind: "video", value: "TVmV3-pEXss" });

  // No session identifiers at all: minting still happens, bound to the video.
  expect(
    selectGvsPoTokenBinding("TVmV3-pEXss", {
      loggedIn: false,
      dataSyncId: undefined,
      visitorData: undefined,
      experimentFlags: [],
    }),
  ).toEqual({ kind: "video", value: "TVmV3-pEXss" });

  expect(
    selectGvsPoTokenBinding("TVmV3-pEXss", {
      loggedIn: true,
      dataSyncId: "data-sync-id",
      visitorData: "visitor",
      experimentFlags: [],
      client: "web",
    }),
  ).toEqual({ kind: "datasync", value: "data-sync-id" });
});

test("re-mints the GVS PO token from the realm on demand", async () => {
  let mints = 0;
  const bevasrs = {
    async wpc() {
      return {
        async mws({ c }: { c: string }) {
          mints += 1;
          return `${c}-token-${mints}`;
        },
      };
    },
  };
  const realm = { bevasrsg: { bevasrs } } as unknown as Parameters<
    typeof mintPagePoToken
  >[0];
  const signal = new AbortController().signal;

  expect(
    await mintPagePoToken(realm, "TVmV3-pEXss", signal, {
      videoId: "TVmV3-pEXss",
      bindingKind: "video",
    }),
  ).toBe("TVmV3-pEXss-token-1");
  // A second pass reuses the minted token instead of hitting the realm again.
  expect(
    await mintPagePoToken(realm, "TVmV3-pEXss", signal, {
      videoId: "TVmV3-pEXss",
      bindingKind: "video",
    }),
  ).toBe("TVmV3-pEXss-token-1");
  expect(mints).toBe(1);

  // A missing or expired token is re-issued with source: "realm".
  expect(
    await mintPagePoToken(realm, "TVmV3-pEXss", signal, {
      source: "realm",
      videoId: "TVmV3-pEXss",
      bindingKind: "video",
    }),
  ).toBe("TVmV3-pEXss-token-2");
  expect(mints).toBe(2);
});

test("detects the GVS answers that require a new PO token", () => {
  expect(
    isPoTokenRejection(
      new Error("Audio downloader. Media request failed (403, range 0-100)"),
    ),
  ).toBe(true);
  expect(
    isPoTokenRejection(
      new Error("Audio downloader. web ABR media probe failed (403)"),
    ),
  ).toBe(true);
  expect(
    isPoTokenRejection(
      new Error("Audio downloader. Media request failed (500, range 0-100)"),
    ),
  ).toBe(false);
});
