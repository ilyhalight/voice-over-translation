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
  mintPagePoToken,
  selectAudioFormat: selectSabrAudioFormat,
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

test("selects SABR audio by smallest contentLength, bitrate, then first", () => {
  // Smallest valid contentLength wins regardless of array order; zero is skipped.
  expect(
    selectSabrAudioFormat([
      {
        itag: 251,
        url: "https://example.com/251",
        audioQuality: "AUDIO_QUALITY_MEDIUM",
        contentLength: "200",
      },
      {
        itag: 140,
        url: "https://example.com/140",
        audioQuality: "AUDIO_QUALITY_LOW",
        contentLength: 100,
      },
      {
        itag: 249,
        url: "https://example.com/249",
        audioQuality: "AUDIO_QUALITY_LOW",
        contentLength: "0",
      },
    ]).itag,
  ).toBe(140);

  // No usable contentLength -> smallest averageBitrate.
  expect(
    selectSabrAudioFormat([
      {
        itag: 251,
        url: "https://example.com/251",
        audioQuality: "AUDIO_QUALITY_MEDIUM",
        averageBitrate: 90_000,
      },
      {
        itag: 140,
        url: "https://example.com/140",
        audioQuality: "AUDIO_QUALITY_LOW",
        averageBitrate: 70_000,
      },
    ]).itag,
  ).toBe(140);

  // No contentLength or bitrate -> first remaining format.
  expect(
    selectSabrAudioFormat([
      {
        itag: 251,
        url: "https://example.com/251",
        audioQuality: "AUDIO_QUALITY_MEDIUM",
      },
      {
        itag: 140,
        url: "https://example.com/140",
        audioQuality: "AUDIO_QUALITY_LOW",
      },
    ]).itag,
  ).toBe(251);
});

test("wires SABR eligibility to direct URLs and content length priority", () => {
  // A format without url/signatureCipher is not eligible.
  expect(
    selectSabrAudioFormat([
      { itag: 251, audioQuality: "AUDIO_QUALITY_MEDIUM", averageBitrate: 10 },
      {
        itag: 140,
        url: "https://example.com/140",
        audioQuality: "AUDIO_QUALITY_LOW",
        averageBitrate: 999,
      },
    ]).itag,
  ).toBe(140);

  // signatureCipher also makes a format eligible.
  expect(
    selectSabrAudioFormat([
      {
        itag: 251,
        signatureCipher: "url=https%3A%2F%2Fexample.com%2F251",
        audioQuality: "AUDIO_QUALITY_MEDIUM",
      },
    ]).itag,
  ).toBe(251);
});

test("prefers dedicated audio over a smaller muxed format", () => {
  // Muxed itag 18 is smaller, but audio-only adaptive formats win outright.
  expect(
    selectSabrAudioFormat([
      {
        itag: 18,
        url: "https://example.com/18",
        mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"',
        contentLength: 50,
      },
      {
        itag: 140,
        url: "https://example.com/140",
        mimeType: "audio/mp4",
        contentLength: "200",
      },
    ]).itag,
  ).toBe(140);
});

test("falls back to regular/muxed formats without dedicated audio", () => {
  // itag 18 wins over a smaller video-only regular format.
  expect(
    selectSabrAudioFormat([
      {
        itag: 137,
        url: "https://example.com/137",
        mimeType: 'video/mp4; codecs="avc1.640028"',
        contentLength: 10,
      },
      {
        itag: 18,
        url: "https://example.com/18",
        mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"',
        contentLength: "300",
      },
    ]).itag,
  ).toBe(18);

  // Otherwise the lowest-bitrate mp4a/opus regular format wins.
  expect(
    selectSabrAudioFormat([
      {
        itag: 22,
        url: "https://example.com/22",
        mimeType: 'video/mp4; codecs="avc1.64001F, mp4a.40.2"',
        bitrate: 500_000,
      },
      {
        itag: 37,
        url: "https://example.com/37",
        mimeType: 'video/mp4; codecs="avc1.64001F, mp4a.40.2"',
        bitrate: 300_000,
      },
    ]).itag,
  ).toBe(37);
});

test("throws on empty or unusable formats", () => {
  expect(() => selectSabrAudioFormat([])).toThrow("Empty adaptive formats");
  expect(() =>
    selectSabrAudioFormat([{ itag: 18, mimeType: "video/mp4" }]),
  ).toThrow("web ABR returned no direct audio formats");
});

test("prefers the requested source language over other tracks", () => {
  const base = {
    url: "https://example.com/audio",
    audioQuality: "AUDIO_QUALITY_LOW",
  };
  // Source language beats English and a smaller size.
  expect(
    selectSabrAudioFormat(
      [
        { ...base, itag: 140, contentLength: 200, audioTrack: { id: "en-US" } },
        { ...base, itag: 251, contentLength: 100, audioTrack: { id: "ru" } },
      ],
      "ru",
    ).itag,
  ).toBe(251);
  // Explicit languageCode field is honored.
  expect(
    selectSabrAudioFormat(
      [
        {
          ...base,
          itag: 140,
          contentLength: 100,
          audioTrack: { languageCode: "en" },
        },
        {
          ...base,
          itag: 251,
          contentLength: 200,
          audioTrack: { languageCode: "ru" },
        },
      ],
      "ru",
    ).itag,
  ).toBe(251);
  // Normalized en-US request matches an en track.
  expect(
    selectSabrAudioFormat(
      [
        { ...base, itag: 140, contentLength: 100, audioTrack: { id: "ru" } },
        { ...base, itag: 251, contentLength: 200, audioTrack: { id: "en" } },
      ],
      "en-US",
    ).itag,
  ).toBe(251);
  // en.4 track id matches an en request.
  expect(
    selectSabrAudioFormat(
      [
        { ...base, itag: 140, contentLength: 100, audioTrack: { id: "ru" } },
        { ...base, itag: 249, contentLength: 200, audioTrack: { id: "en.4" } },
      ],
      "en",
    ).itag,
  ).toBe(249);
  // Within source-language matches, the default track wins.
  expect(
    selectSabrAudioFormat(
      [
        { ...base, itag: 251, contentLength: 100, audioTrack: { id: "ru" } },
        {
          ...base,
          itag: 140,
          contentLength: 200,
          audioTrack: { id: "ru", audioIsDefault: true },
        },
      ],
      "ru",
    ).itag,
  ).toBe(140);
});

test("falls back to default tracks and legacy selection", () => {
  const base = {
    url: "https://example.com/audio",
    audioQuality: "AUDIO_QUALITY_LOW",
  };
  // No language match -> default track wins over a smaller one.
  expect(
    selectSabrAudioFormat(
      [
        { ...base, itag: 251, contentLength: 100, audioTrack: { id: "ru" } },
        {
          ...base,
          itag: 140,
          contentLength: 200,
          audioTrack: { id: "de", audioIsDefault: true },
        },
      ],
      "fr",
    ).itag,
  ).toBe(140);
  // Missing source language -> default track wins.
  expect(
    selectSabrAudioFormat([
      { ...base, itag: 251, contentLength: 100, audioTrack: { id: "ru" } },
      {
        ...base,
        itag: 140,
        contentLength: 200,
        audioTrack: { id: "de", audioIsDefault: true },
      },
    ]).itag,
  ).toBe(140);
  // "auto" is not a usable source language -> default track wins.
  expect(
    selectSabrAudioFormat(
      [
        { ...base, itag: 251, contentLength: 100, audioTrack: { id: "ru" } },
        {
          ...base,
          itag: 140,
          contentLength: 200,
          audioTrack: { id: "de", audioIsDefault: true },
        },
      ],
      "auto",
    ).itag,
  ).toBe(140);
  // No track metadata -> existing size selection.
  expect(
    selectSabrAudioFormat(
      [
        { ...base, itag: 251, contentLength: 100 },
        { ...base, itag: 140, contentLength: 200 },
      ],
      "ru",
    ).itag,
  ).toBe(251);
  // No match and no defaults -> smallest wins (legacy fallback).
  expect(
    selectSabrAudioFormat(
      [
        { ...base, itag: 251, contentLength: 200, audioTrack: { id: "ru" } },
        { ...base, itag: 140, contentLength: 100, audioTrack: { id: "de" } },
      ],
      "fr",
    ).itag,
  ).toBe(140);
});
