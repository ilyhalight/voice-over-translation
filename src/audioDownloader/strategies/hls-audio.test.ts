import { expect, test } from "bun:test";

const {
  applyHlsPoToken,
  describeHlsRendition,
  isHlsMasterPlaylist,
  parseHlsAttributeList,
  parseHlsAudioRenditions,
  parseHlsMediaPlaylist,
  readHlsItag,
  selectHlsAudioRendition,
} = await import("./hlsAudio");

const MANIFEST_URL =
  "https://manifest.googlevideo.com/api/manifest/hls_variant/expire/123/" +
  "playlist/index.m3u8";

/** Shape of a real YouTube HLS master playlist, trimmed to what is read. */
const MASTER_PLAYLIST = [
  "#EXTM3U",
  "#EXT-X-INDEPENDENT-SEGMENTS",
  '#EXT-X-MEDIA:URI="https://r2.googlevideo.com/videoplayback/itag/233/' +
    'file/index.m3u8",TYPE=AUDIO,GROUP-ID="233",LANGUAGE="en-US",' +
    'NAME="American English original (original)",DEFAULT=YES,AUTOSELECT=YES',
  '#EXT-X-MEDIA:URI="https://r2.googlevideo.com/videoplayback/itag/234/' +
    'file/index.m3u8",TYPE=AUDIO,GROUP-ID="234",LANGUAGE="en-US",' +
    'NAME="American English original (original)",DEFAULT=NO,AUTOSELECT=YES',
  '#EXT-X-MEDIA:URI="../videoplayback/itag/233-ru/file/index.m3u8",' +
    'TYPE=AUDIO,GROUP-ID="233-ru",LANGUAGE="ru",' +
    'NAME="Russian dubbed-auto",DEFAULT=NO,AUTOSELECT=NO',
  '#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="sub",LANGUAGE="en",NAME="English",' +
    'URI="https://r2.googlevideo.com/api/timedtext/index.m3u8"',
  '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="muxed",NAME="muxed, no URI"',
  '#EXT-X-STREAM-INF:BANDWIDTH=221000,CODECS="avc1.4D4015,mp4a.40.2",' +
    'AUDIO="233"',
  "https://r2.googlevideo.com/videoplayback/itag/229/file/index.m3u8",
].join("\n");

test("parses an attribute list with commas inside quotes", () => {
  const attributes = parseHlsAttributeList(
    '#EXT-X-STREAM-INF:BANDWIDTH=221000,CODECS="avc1.4D4015,mp4a.40.2",' +
      'AUDIO="233"',
  );

  expect(attributes.get("BANDWIDTH")).toBe("221000");
  expect(attributes.get("CODECS")).toBe("avc1.4D4015,mp4a.40.2");
  expect(attributes.get("AUDIO")).toBe("233");
});

test("reads the itag out of a GVS path", () => {
  expect(
    readHlsItag("https://r2.googlevideo.com/videoplayback/itag/233/file"),
  ).toBe(233);
  expect(readHlsItag("https://r2.googlevideo.com/videoplayback/file")).toBe(
    undefined,
  );
});

test("recognizes a master playlist", () => {
  expect(isHlsMasterPlaylist(MASTER_PLAYLIST)).toBe(true);
  expect(isHlsMasterPlaylist("#EXTM3U\n#EXTINF:5,\nseg.ts")).toBe(false);
});

test("keeps only audio renditions that carry their own playlist", () => {
  const renditions = parseHlsAudioRenditions(MASTER_PLAYLIST, MANIFEST_URL);

  // The subtitle track and the URI-less muxed audio group are both dropped.
  expect(renditions.map((rendition) => rendition.itag)).toEqual([
    233, 234, 233,
  ]);
  // A relative URI is resolved against the manifest it was listed in.
  expect(renditions[2]?.uri).toBe(
    "https://manifest.googlevideo.com/api/manifest/hls_variant/expire/123/" +
      "videoplayback/itag/233-ru/file/index.m3u8",
  );
  expect(renditions[0]?.isDefault).toBe(true);
  expect(renditions[1]?.isDefault).toBe(false);
});

test("describes a rendition the way the direct path describes a format", () => {
  const [english, , russian] = parseHlsAudioRenditions(
    MASTER_PLAYLIST,
    MANIFEST_URL,
  );

  expect(describeHlsRendition(english!).language).toBe("en");
  expect(describeHlsRendition(english!).content).toBe("original");
  expect(describeHlsRendition(russian!).language).toBe("ru");
  expect(describeHlsRendition(russian!).content).toBe("dubbed-auto");
});

test("selects the cheapest rendition of the preferred track", () => {
  const renditions = parseHlsAudioRenditions(MASTER_PLAYLIST, MANIFEST_URL);
  const selected = selectHlsAudioRendition(renditions);

  // English original before an automatic dub, and itag 233 before 234.
  expect(selected?.rendition.itag).toBe(233);
  expect(selected?.track.language).toBe("en");
  expect(selected?.rendition.uri).toContain("/itag/233/");
});

test("falls back to the original track when no English audio exists", () => {
  const playlist = [
    "#EXTM3U",
    '#EXT-X-MEDIA:URI="https://r2.googlevideo.com/itag/234/file/index.m3u8",' +
      'TYPE=AUDIO,GROUP-ID="234",LANGUAGE="de-DE",NAME="German dubbed-auto"',
    '#EXT-X-MEDIA:URI="https://r2.googlevideo.com/itag/233/file/index.m3u8",' +
      'TYPE=AUDIO,GROUP-ID="233",LANGUAGE="ja",NAME="Japanese original",' +
      "DEFAULT=YES",
  ].join("\n");

  const selected = selectHlsAudioRendition(
    parseHlsAudioRenditions(playlist, MANIFEST_URL),
  );

  expect(selected?.track.language).toBe("ja");
  expect(selected?.track.content).toBe("original");
});

test("returns nothing when a manifest has no audio-only rendition", () => {
  expect(selectHlsAudioRendition([])).toBe(undefined);
});

test("parses a media playlist with an init segment and byte ranges", () => {
  const playlist = [
    "#EXTM3U",
    "#EXT-X-TARGETDURATION:5",
    '#EXT-X-MAP:URI="init.mp4"',
    "#EXTINF:5.000,",
    "#EXT-X-BYTERANGE:1000@200",
    "segment.mp4",
    "#EXTINF:5.000,",
    "#EXT-X-BYTERANGE:500",
    "segment.mp4",
    "#EXTINF:5.000,",
    "https://r2.googlevideo.com/last.mp4",
    "#EXT-X-ENDLIST",
  ].join("\n");

  const { initSegment, segments } = parseHlsMediaPlaylist(
    playlist,
    "https://r2.googlevideo.com/videoplayback/itag/233/file/index.m3u8",
  );

  expect(initSegment?.url).toBe(
    "https://r2.googlevideo.com/videoplayback/itag/233/file/init.mp4",
  );
  expect(segments).toHaveLength(3);
  expect(segments[0]?.range).toBe("bytes=200-1199");
  // An offset-less BYTERANGE continues where the previous one ended.
  expect(segments[1]?.range).toBe("bytes=1200-1699");
  expect(segments[2]).toEqual({ url: "https://r2.googlevideo.com/last.mp4" });
});

test("adds a PO token as a path segment, before the manifest suffix", () => {
  const withToken = applyHlsPoToken(MANIFEST_URL, "TOKEN==");

  expect(withToken).toBe(
    "https://manifest.googlevideo.com/api/manifest/hls_variant/expire/123/" +
      "pot/TOKEN%3D%3D/playlist/index.m3u8",
  );
  // Idempotent: a manifest that already carries a token is left alone.
  expect(applyHlsPoToken(withToken, "OTHER")).toBe(withToken);
  // HLS needs no token at all, so no token means no change.
  expect(applyHlsPoToken(MANIFEST_URL, undefined)).toBe(MANIFEST_URL);
});
