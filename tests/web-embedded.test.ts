import { expect, test } from "bun:test";

(globalThis as unknown as { DEBUG_MODE: boolean }).DEBUG_MODE = false;

const {
  buildMediaRanges,
  buildSidAuthorization,
  buildTvDowngradedPlayerRequest,
  buildWebCreatorPlayerRequest,
  buildWebEmbeddedPlayerRequest,
  buildWebPlayerRequest,
  mintPagePoToken,
  selectWebEmbeddedAudioFormat,
  solveWithPagePlayer,
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

test("builds the yt-dlp web_embedded request and selects direct Opus audio", async () => {
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

  expect(
    selectWebEmbeddedAudioFormat([
      {
        itag: 140,
        url: "https://example.com/140",
        mimeType: "audio/mp4",
        bitrate: 129_000,
        contentLength: "200",
      },
      {
        itag: 251,
        url: "https://example.com/251",
        mimeType: "audio/webm",
        bitrate: 128_000,
        contentLength: "100",
      },
    ]).itag,
  ).toBe(251);
  expect(
    selectWebEmbeddedAudioFormat([
      {
        itag: 250,
        url: "https://example.com/250",
        mimeType: "audio/webm",
        bitrate: 70_000,
        contentLength: "100",
      },
      {
        itag: 140,
        url: "https://example.com/140",
        mimeType: "audio/mp4",
        bitrate: 129_000,
        contentLength: "200",
      },
    ]).itag,
  ).toBe(140);

  expect(
    selectWebEmbeddedAudioFormat([
      {
        itag: 251,
        signatureCipher: "s=sig&sp=sig&url=https%3A%2F%2Fexample.com%2F251",
        mimeType: 'audio/webm; codecs="opus"',
        bitrate: 128_000,
        contentLength: "100",
      },
    ]).signatureCipher,
  ).toBeDefined();

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

  expect(
    selectWebEmbeddedAudioFormat([
      {
        itag: 18,
        url: "https://example.com/18",
        mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"',
        bitrate: 256_000,
        contentLength: "300",
      },
    ]).itag,
  ).toBe(18);

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

  const sha1Hex = async (value: string) => {
    const digest = await crypto.subtle.digest(
      "SHA-1",
      new TextEncoder().encode(value),
    );
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  };
  expect(
    await buildSidAuthorization(
      "SAPISIDHASH",
      "sid",
      "https://www.youtube.com",
      "123",
    ),
  ).toBe(`SAPISIDHASH 123_${await sha1Hex("123 sid https://www.youtube.com")}`);
  expect(
    await buildSidAuthorization(
      "SAPISIDHASH",
      "sid",
      "https://www.youtube.com",
      "123",
      "uid",
    ),
  ).toBe(
    `SAPISIDHASH 123_${await sha1Hex("uid 123 sid https://www.youtube.com")}_u`,
  );

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
  // Lazily-transformed URL class (base.js style): constructor stores,
  // a proto method decodes.
  class LazyYtUrl {
    url: string;
    params = new URLSearchParams();
    constructor(url: string, _trusted?: boolean) {
      this.url = url;
      for (const [key, value] of new URL(url).searchParams) {
        this.params.set(key, value);
      }
    }
    set(key: string, value: string) {
      this.params.set(key, value);
    }
    get(key: string) {
      return this.params.get(key);
    }
    clone() {
      return new LazyYtUrl(this.url);
    }
    decipher() {
      for (const [key, value] of [...this.params]) {
        this.params.set(key, decode(value));
      }
    }
  }
  // Eagerly-transformed URL class (page runtime style): constructor decodes.
  class EagerYtUrl {
    params = new URLSearchParams();
    constructor(url: string) {
      for (const [key, value] of new URL(url).searchParams) {
        this.params.set(key, decode(value));
      }
    }
    set(key: string, value: string) {
      this.params.set(key, decode(value));
    }
    get(key: string) {
      return this.params.get(key);
    }
    clone() {
      return new EagerYtUrl("https://example.com/");
    }
    decipher() {
      for (const [key, value] of [...this.params]) {
        this.params.set(key, decode(value));
      }
    }
  }
  const pageWindow = {
    _yt_player: { LazyYtUrl, EagerYtUrl },
  } as any;
  const challenge = {
    url: `https://example.com/videoplayback?n=enc(nnn)&sp=sig&s=enc(${longSig})`,
    sp: "sig",
    signature: `enc(${longSig})`,
    n: "enc(nnn)",
  };
  // LazyYtUrl matches first: constructor stores, transform decodes once.
  expect(solveWithPagePlayer(pageWindow, challenge)).toEqual({
    signature: decodedSig,
    n: decodedN,
  });
  // Eager class first: already decoded, transform must not run twice.
  expect(
    solveWithPagePlayer({ _yt_player: { EagerYtUrl } } as any, challenge),
  ).toEqual({ signature: decodedSig, n: decodedN });
  expect(() => solveWithPagePlayer({} as any, challenge)).toThrow(
    "page challenge solve incomplete",
  );
  // A bogus transform producing invalid output is filtered, the valid one wins.
  class NoisyYtUrl {
    params = new URLSearchParams();
    constructor(url: string) {
      for (const [key, value] of new URL(url).searchParams) {
        this.params.set(key, value);
      }
    }
    set(key: string, value: string) {
      this.params.set(key, value);
    }
    get(key: string) {
      return this.params.get(key);
    }
    clone() {
      return new NoisyYtUrl("https://example.com/");
    }
    decipher() {
      for (const [key, value] of [...this.params]) {
        this.params.set(key, decode(value));
      }
    }
    garbage() {
      this.params.set("n", "YY=garbage");
      this.params.set("sig", "YY=garbage");
    }
  }
  expect(
    solveWithPagePlayer({ _yt_player: { NoisyYtUrl } } as any, challenge),
  ).toEqual({ signature: decodedSig, n: decodedN });
  // Two valid but disagreeing transforms are an error, not a guess.
  class FlipYtUrl {
    params = new URLSearchParams();
    constructor(url: string) {
      for (const [key, value] of new URL(url).searchParams) {
        this.params.set(key, value);
      }
    }
    set(key: string, value: string) {
      this.params.set(key, value);
    }
    get(key: string) {
      return this.params.get(key);
    }
    clone() {
      return new FlipYtUrl("https://example.com/");
    }
    flip() {
      this.params.set("n", "decFIRSTVALIDSTRING000000000000000001");
      this.params.set("sig", "decFIRSTVALIDSTRING000000000000000002");
    }
    flop() {
      this.params.set("n", "decSECONDVALIDSTRING0000000000000001");
      this.params.set("sig", "decSECONDVALIDSTRING0000000000000002");
    }
  }
  expect(() =>
    solveWithPagePlayer({ _yt_player: { FlipYtUrl } } as any, challenge),
  ).toThrow("ambiguous page challenge solutions");

  // The sig factory (EJS protocol): solves s at construction like Ix does.
  class FactoryUrl {
    params = new URLSearchParams();
    constructor(url: string) {
      for (const [key, value] of new URL(url).searchParams) {
        this.params.set(key, value);
      }
    }
    set(key: string, value: string) {
      this.params.set(key, value);
    }
    get(key: string) {
      return this.params.get(key);
    }
    clone() {
      return new FactoryUrl("https://example.com/");
    }
    decipher() {
      for (const [key, value] of [...this.params]) {
        this.params.set(key, decode(value));
      }
    }
  }
  const ns = { FactoryUrl };
  const SigFactory = (url: any, sp: string, s: string) => {
    url = new ns.FactoryUrl(url, !0);
    url.set("alr", "yes");
    if (s) url.set(sp, decode(s));
    return url;
  };
  expect(
    solveWithPagePlayer({ _yt_player: { SigFactory } } as any, challenge),
  ).toEqual({ signature: decodedSig, n: decodedN });

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
