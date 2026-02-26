# ytAudio

Browser-only YouTube audio downloader.

What it does:
- calls InnerTube endpoints directly,
- prefers direct adaptive audio streams (first `audio/mp4; codecs="mp4a.*"`,
  then `audio/webm; codecs="opus"`),
- does not use progressive video fallback.

## Public API

Use `AudioDownloader.downloadAudioToUint8Array(...)`:

```ts
const downloader = new AudioDownloader({ fetchImplementation });
const result = await downloader.downloadAudioToUint8Array({
  videoId: "memM8flkwrA",
  client: "ANDROID",
  videoQuality: "144p",
  signal,
});

// result.bytes -> Uint8Array AAC bytes
```

The module is intended to run in browser context and returns audio bytes for
further chunking/upload by the parent audio downloader strategy.
