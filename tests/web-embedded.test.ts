import { expect, test } from "bun:test";

(globalThis as unknown as { DEBUG_MODE: boolean }).DEBUG_MODE = false;

const {
  buildMediaRanges,
  buildSidAuthorization,
  buildTvDowngradedPlayerRequest,
  buildWebCreatorPlayerRequest,
  buildWebEmbeddedPlayerRequest,
  buildWebPlayerRequest,
  collectPageSolutions,
  downloadMediaRanges,
  mintPagePoToken,
  selectWebEmbeddedAudioFormat,
} = await import("../src/audioDownloader/strategies/webAbr");

test("builds YouTube's ramped media ranges", () => {
  expect(buildMediaRanges(1_080_001)).toEqual([
    { start: 0, end: 59_999 },
    { start: 60_000, end: 139_999 },
    { start: 140_000, end: 289_999 },
    { start: 290_000, end: 619_999 },
    { start: 620_000, end: 1_079_999 },
    { start: 1_080_000, end: 1_080_000 },
  ]);
});

test("mints a page GVS PO token", async () => {
  let receivedBinding = "";
  const bevasrs = {
    async wpc(this: unknown) {
      expect(this).toBe(bevasrs);
      return {
        async mws({ c }: { c: string }) {
          receivedBinding = c;
          return "po-token";
        },
      };
    },
  };
  const realm: any = { "havuokmhhs-0": { bevasrs } };
  realm.parent = realm;
  realm.top = realm;
  expect(
    await mintPagePoToken(realm, "data-sync-id", new AbortController().signal),
  ).toBe("po-token");
  expect(receivedBinding).toBe("data-sync-id");
});

test("builds the yt-dlp web_embedded request", async () => {
  const request = buildWebEmbeddedPlayerRequest(
    {
      data_: {
        INNERTUBE_CLIENT_VERSION: "2.20260908.01.00",
        STS: 20702,
        INNERTUBE_CONTEXT: {
          client: { visitorData: "visitor" },
          thirdParty: {
            embeddedPlayerContext: {
              embeddedPlayerEncryptedContext: "encrypted-context",
            },
          },
        },
        WEB_PLAYER_CONTEXT_CONFIGS: {
          WEB_PLAYER_CONTEXT_CONFIG_ID_EMBEDDED_PLAYER: {
            encryptedHostFlags: "encrypted-host-flags",
          },
        },
      },
    },
    "TVmV3-pEXss",
  ) as any;

  expect(request.context.client.clientName).toBe("WEB_EMBEDDED_PLAYER");
  expect(request.context.thirdParty.embedUrl).toBe("https://www.reddit.com/");
  expect(
    request.context.thirdParty.embeddedPlayerContext
      .embeddedPlayerEncryptedContext,
  ).toBe("encrypted-context");
  expect(
    request.playbackContext.contentPlaybackContext.encryptedHostFlags,
  ).toBe("encrypted-host-flags");
  expect(
    request.playbackContext.contentPlaybackContext.signatureTimestamp,
  ).toBe(20702);

  const tvRequest = buildTvDowngradedPlayerRequest("TVmV3-pEXss", {
    visitorData: "visitor",
    signatureTimestamp: 20702,
  }) as any;
  expect(tvRequest.context.client.clientName).toBe("TVHTML5");
  expect(tvRequest.context.client.clientVersion).toBe("5.20260707");
  expect(
    tvRequest.playbackContext.contentPlaybackContext.signatureTimestamp,
  ).toBe(20702);
  expect(
    (
      buildTvDowngradedPlayerRequest("TVmV3-pEXss", {
        clientVersion: "5.20260101",
      }) as any
    ).context.client.clientVersion,
  ).toBe("5.20260101");

  const webRequest = buildWebPlayerRequest(
    {
      data_: {
        INNERTUBE_CLIENT_VERSION: "2.20260908.01.00",
        STS: 20702,
        INNERTUBE_CONTEXT: {
          client: { visitorData: "visitor" },
          thirdParty: { embedUrl: "https://www.reddit.com/" },
        },
      },
    },
    "TVmV3-pEXss",
  ) as any;
  expect(webRequest.context.client.clientName).toBe("WEB");
  expect(webRequest.context.thirdParty).toBeUndefined();
  expect(
    webRequest.playbackContext.contentPlaybackContext.encryptedHostFlags,
  ).toBeUndefined();
  expect(
    webRequest.playbackContext.contentPlaybackContext.signatureTimestamp,
  ).toBe(20702);

  expect(
    await buildSidAuthorization(
      "SAPISIDHASH",
      "sid",
      "https://www.youtube.com",
      "123",
    ),
  ).toBe("SAPISIDHASH 123_9f7b839a9037086c827e7212ab185e652786244e");
  expect(
    await buildSidAuthorization(
      "SAPISIDHASH",
      "sid",
      "https://www.youtube.com",
      "123",
      "uid",
    ),
  ).toBe("SAPISIDHASH 123_f3aae25f0759efdc6d8be91f09dbd17fa4a2fd94_u");

  const stsOverride = buildWebEmbeddedPlayerRequest(
    {
      data_: {
        STS: null,
        INNERTUBE_CONTEXT: { client: {} },
      },
    },
    "TVmV3-pEXss",
    20702,
  ) as any;
  expect(
    stsOverride.playbackContext.contentPlaybackContext.signatureTimestamp,
  ).toBe(20702);
});

test("solves sig/n through the page player without eval", () => {
  const longSig = "s".repeat(40);
  const pad = "0".repeat(24);
  const decode = (value: string) => {
    const match = /^enc\((.*)\)$/.exec(value);
    return match ? `${match[1]}${pad}` : value;
  };
  const decodedSig = `${longSig}${pad}`;
  const decodedN = `nnn${pad}`;
  const expected = { signature: decodedSig, n: decodedN };
  const challenge = {
    url: `https://example.com/videoplayback?n=enc(nnn)&sp=sig&s=enc(${longSig})`,
    sp: "sig",
    signature: `enc(${longSig})`,
    n: "enc(nnn)",
  };

  class YtUrl {
    params: URLSearchParams;
    constructor(url: string, _trusted?: boolean) {
      this.params = new URL(url).searchParams;
    }
    set(key: string, value: string) {
      this.params.set(key, value);
    }
    get(key: string) {
      return this.params.get(key);
    }
    clone() {
      return new YtUrl("https://example.com/");
    }
    decipher() {
      for (const [key, value] of [...this.params]) {
        this.params.set(key, decode(value));
      }
    }
  }
  class EagerYtUrl extends YtUrl {
    constructor(url: string) {
      super(url);
      this.decipher();
    }
    set(key: string, value: string) {
      this.params.set(key, decode(value));
    }
  }

  expect(
    collectPageSolutions(
      { _yt_player: { YtUrl, EagerYtUrl } } as any,
      challenge,
    ),
  ).toEqual([expected]);
  expect(
    collectPageSolutions({ _yt_player: { EagerYtUrl } } as any, challenge),
  ).toEqual([expected]);
  expect(collectPageSolutions({} as any, challenge)).toEqual([]);

  class NoisyYtUrl extends YtUrl {
    garbage() {
      this.params.set("n", "YY=garbage");
      this.params.set("sig", "YY=garbage");
    }
  }
  expect(
    collectPageSolutions({ _yt_player: { NoisyYtUrl } } as any, challenge),
  ).toEqual([expected]);

  const ns = { FactoryUrl: YtUrl };
  const SigFactory = (url: any, sp: string, s: string) => {
    url = new ns.FactoryUrl(url, !0);
    url.set("alr", "yes");
    if (s) url.set(sp, decode(s));
    return url;
  };
  expect(
    collectPageSolutions({ _yt_player: { SigFactory } } as any, challenge),
  ).toEqual([expected]);

  const creatorRequest = buildWebCreatorPlayerRequest("TVmV3-pEXss", {
    visitorData: "visitor",
    signatureTimestamp: 20702,
  }) as any;
  expect(creatorRequest.context.client.clientName).toBe("WEB_CREATOR");
  expect(creatorRequest.context.client.clientVersion).toBe("1.20260708.06.00");
  expect(
    creatorRequest.playbackContext.contentPlaybackContext.signatureTimestamp,
  ).toBe(20702);
});

// WEB_EMBEDDED selection intentionally differs from SABR: it never falls back
// to muxed formats and deprioritizes DRC tracks.
test("web_embedded selects only dedicated audio formats", () => {
  const base = {
    url: "https://example.com/audio",
    audioQuality: "AUDIO_QUALITY_LOW",
  };
  // Muxed format is ignored even when it is smaller/preferred.
  expect(
    selectWebEmbeddedAudioFormat([
      {
        ...base,
        itag: 18,
        mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"',
        contentLength: 50,
      },
      { ...base, itag: 140, mimeType: "audio/mp4", contentLength: 200 },
    ]).itag,
  ).toBe(140);
  // Video-only and no-url formats are unusable -> throws, never muxed fallback.
  expect(() =>
    selectWebEmbeddedAudioFormat([
      {
        ...base,
        itag: 137,
        mimeType: 'video/mp4; codecs="avc1.640028"',
        contentLength: 10,
      },
      {
        ...base,
        itag: 251,
        mimeType: "audio/webm",
        contentLength: 100,
        url: undefined,
      },
    ]),
  ).toThrow("no direct audio-only formats");
  expect(() =>
    selectWebEmbeddedAudioFormat([
      { ...base, itag: 251, mimeType: "audio/webm", url: undefined },
    ]),
  ).toThrow("no direct audio-only formats");
});

test("web_embedded deprioritizes DRC tracks", () => {
  const base = {
    url: "https://example.com/audio",
    audioQuality: "AUDIO_QUALITY_LOW",
  };
  expect(
    selectWebEmbeddedAudioFormat([
      {
        ...base,
        itag: 251,
        mimeType: "audio/webm",
        xtags: "drc=1",
        contentLength: 10,
      },
      { ...base, itag: 140, mimeType: "audio/mp4", contentLength: 500 },
    ]).itag,
  ).toBe(140);
  expect(
    selectWebEmbeddedAudioFormat([
      {
        ...base,
        itag: 251,
        mimeType: "audio/webm",
        url: "https://example.com/audio?xtags=drc%3D1",
        contentLength: 10,
      },
      { ...base, itag: 140, mimeType: "audio/mp4", contentLength: 500 },
    ]).itag,
  ).toBe(140);
  expect(
    selectWebEmbeddedAudioFormat([
      { ...base, itag: 251, mimeType: "audio/webm", xtags: "drc=1" },
      { ...base, itag: 140, mimeType: "audio/mp4", xtags: "drc=1" },
    ]).itag,
  ).toBe(251);
});

test("web_embedded prefers requested and base languages", () => {
  const base = {
    url: "https://example.com/audio",
    audioQuality: "AUDIO_QUALITY_LOW",
  };
  expect(
    selectWebEmbeddedAudioFormat(
      [
        {
          ...base,
          itag: 251,
          mimeType: "audio/webm",
          audioTrack: { id: "en" },
        },
        { ...base, itag: 140, mimeType: "audio/mp4", audioTrack: { id: "ru" } },
      ],
      "ru",
    ).itag,
  ).toBe(140);
  expect(
    selectWebEmbeddedAudioFormat(
      [
        { ...base, itag: 140, mimeType: "audio/mp4", audioTrack: { id: "ru" } },
        {
          ...base,
          itag: 251,
          mimeType: "audio/webm",
          audioTrack: { id: "en" },
        },
      ],
      "en-US",
    ).itag,
  ).toBe(251);
  expect(
    selectWebEmbeddedAudioFormat(
      [
        { ...base, itag: 140, mimeType: "audio/mp4", audioTrack: { id: "ru" } },
        {
          ...base,
          itag: 249,
          mimeType: "audio/webm",
          audioTrack: { id: "en.4" },
        },
      ],
      "en",
    ).itag,
  ).toBe(249);
  expect(
    selectWebEmbeddedAudioFormat(
      [
        {
          ...base,
          itag: 251,
          mimeType: "audio/webm",
          audioTrack: { id: "ru" },
        },
        {
          ...base,
          itag: 140,
          mimeType: "audio/mp4",
          audioTrack: { id: "de", audioIsDefault: true },
        },
      ],
      "ru",
    ).itag,
  ).toBe(251);
  expect(
    selectWebEmbeddedAudioFormat(
      [
        {
          ...base,
          itag: 140,
          mimeType: "audio/mp4",
          audioTrack: { languageCode: "en" },
        },
        {
          ...base,
          itag: 251,
          mimeType: "audio/webm",
          audioTrack: { languageCode: "ru" },
        },
      ],
      "ru",
    ).itag,
  ).toBe(251);
});

test("web_embedded falls back to default tracks then smallest metadata", () => {
  const base = {
    url: "https://example.com/audio",
    audioQuality: "AUDIO_QUALITY_LOW",
  };
  expect(
    selectWebEmbeddedAudioFormat(
      [
        {
          ...base,
          itag: 251,
          mimeType: "audio/webm",
          audioTrack: { id: "ru" },
          contentLength: 100,
        },
        {
          ...base,
          itag: 140,
          mimeType: "audio/mp4",
          audioTrack: { id: "de", audioIsDefault: true },
          contentLength: 500,
        },
      ],
      "fr",
    ).itag,
  ).toBe(140);
});

test("web_embedded ranks by smallest contentLength, bitrate, then first", () => {
  const base = {
    url: "https://example.com/audio",
    audioQuality: "AUDIO_QUALITY_LOW",
  };
  expect(
    selectWebEmbeddedAudioFormat([
      { ...base, mimeType: "audio/mp4", contentLength: "200" },
      { ...base, mimeType: "audio/webm", contentLength: 100 },
      { ...base, mimeType: "audio/webm", contentLength: 0 },
      { ...base, mimeType: "audio/webm", contentLength: -5 },
      { ...base, mimeType: "audio/webm", contentLength: "abc" },
      {
        ...base,
        mimeType: "audio/webm",
        contentLength: Number.POSITIVE_INFINITY,
      },
    ]).contentLength,
  ).toBe(100);
  expect(
    selectWebEmbeddedAudioFormat([
      { ...base, mimeType: "audio/webm", averageBitrate: 90_000 },
      { ...base, mimeType: "audio/mp4", averageBitrate: "70000" },
      { ...base, mimeType: "audio/mp4", averageBitrate: 0 },
      { ...base, mimeType: "audio/mp4" },
    ]).averageBitrate,
  ).toBe("70000");
  expect(
    selectWebEmbeddedAudioFormat([
      { ...base, mimeType: "audio/webm" },
      { ...base, mimeType: "audio/mp4" },
    ]).mimeType,
  ).toBe("audio/webm");
  expect(
    selectWebEmbeddedAudioFormat([
      { ...base, itag: 251, mimeType: "audio/webm", contentLength: 100 },
      { ...base, itag: 140, mimeType: "audio/mp4", contentLength: 100 },
    ]).itag,
  ).toBe(251);
  expect(
    selectWebEmbeddedAudioFormat([
      { ...base, itag: 251, mimeType: "audio/webm", averageBitrate: 10_000 },
      { ...base, itag: 140, mimeType: "audio/mp4", averageBitrate: 10_000 },
    ]).itag,
  ).toBe(251);
});

const mediaResponse = (status: number, size = 0) => ({
  ok: status >= 200 && status < 300,
  status,
  arrayBuffer: async () => new ArrayBuffer(size),
});

async function drainMediaRanges(
  gen: AsyncGenerator<{ buffer: Uint8Array }>,
): Promise<{ bytes: number; error: unknown }> {
  let bytes = 0;
  try {
    for await (const chunk of gen) bytes += chunk.buffer.byteLength;
    return { bytes, error: undefined };
  } catch (error) {
    return { bytes, error };
  }
}

test("fatal media statuses refresh once then abort the transport matrix", async () => {
  for (const status of [401, 403, 404, 410]) {
    let fetches = 0;
    let refreshes = 0;
    const targetWindow = {
      fetch: async () => {
        fetches++;
        return mediaResponse(status);
      },
    } as unknown as Window;
    const { error } = await drainMediaRanges(
      downloadMediaRanges(
        targetWindow,
        "https://example.com/audio",
        4,
        new AbortController().signal,
        async () => {
          refreshes++;
          return "https://example.com/refreshed";
        },
      ),
    );
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(`(${status},`);
    // One signed-URL refresh, then the matrix stops instead of trying the
    // remaining transports on a permanent failure.
    expect(refreshes).toBe(1);
    expect(fetches).toBe(2);
  }
});

test("transient media failures keep retrying until success", async () => {
  const failures = [
    () => mediaResponse(503),
    () => mediaResponse(429),
    () => {
      throw new TypeError("Failed to fetch");
    },
  ];
  for (const failOnce of failures) {
    let fetches = 0;
    const targetWindow = {
      fetch: async () => {
        fetches++;
        return fetches === 1 ? failOnce() : mediaResponse(200, 4);
      },
    } as unknown as Window;
    const { bytes, error } = await drainMediaRanges(
      downloadMediaRanges(
        targetWindow,
        "https://example.com/audio",
        4,
        new AbortController().signal,
        async () => "https://example.com/refreshed",
      ),
    );
    expect(error).toBeUndefined();
    expect(fetches).toBe(2);
    expect(bytes).toBe(4);
  }
});
