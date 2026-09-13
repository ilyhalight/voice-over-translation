Extracts the audio track of a YouTube video to send it to Yandex. Used only
when the server explicitly requests audio.

## How it works

1. `webAudioBridge` (userscript realm) posts a request for a video id and a
   strategy, then waits for audio chunks. Answers are matched by the random
   message id and by origin, not by the identity of `event.source`, because
   a sandboxed userscript realm posts through the page window. The handler
   answers every request at once, so a realm that never received one fails
   the strategy in seconds instead of holding the download open.
2. `pageAudioHandler` (page realm) answers it. For the direct-URL strategy it
   streams the audio itself when the realm can talk to youtube.com, otherwise
   it loads a hidden youtube.com iframe and uses it as a JS realm only (the
   player stays paused, so no video content is requested).
3. `webAbr` (`web_abr`) asks the InnerTube `player` endpoint once per client,
   picks the track and the format with `formatSelection` (English audio
   first, cheapest Opus stream of that track), solves the `sig`/`n`
   challenges (page player functions first, the AST solver from
   `ytPlayerSolver.js` as a fallback) and streams the selected format with
   one request. If no client answers a usable audio-only stream, the same
   `player` answers are reused for the 144p video last resort.
4. `mseProxy` (`web_mse_proxy`) is the fallback that cannot be refused: it
   proxies `MediaSource.addSourceBuffer`/`appendBuffer` inside the hidden realm
   and copies the audio segments the embedded player downloads anyway. Only
   `audio/*` buffers are mirrored and the video track is pinned to `tiny`, so
   the video content is never collected. What the player downloads is decided
   by `playerResponseFilter`, which trims its `player` response to a single
   audio format before it can boot, so the mirrored bytes are the cheapest
   Opus stream and not the `itag 251` its adaptive ladder would pick. An
   upload without any audio-only stream opens a single muxed buffer; that
   buffer is mirrored as the last resort, at the same `tiny` quality.

The strategies run in that order (`AUDIO_DOWNLOAD_TYPES`), each under its own
file id, so a failed attempt never leaves a half-uploaded file behind.

## Format selection

`formatSelection.ts` is the only place that decides what is downloaded. It
answers two questions, in this order.

**Which track.** A multi-language upload repeats its formats once per audio
track, described by `xtags` (`acont=original|dubbed|dubbed-auto|descriptive`,
`lang=en-US`) and by `audioTrack` (`id`, `displayName`, `audioIsDefault`).
English wins over every other language: the original English audio first, then
a dub, then an automatic dub. Without any English audio the original track of
the upload wins (`acont=original`, or the `audioIsDefault` / `isDefaultAudio`
/ `default` flag). An audio description is the last variant of a language,
because it talks over the content.

**Which format of that track.** Every byte is paid for twice (downloaded from
GVS, uploaded to the translation backend), so the cheapest stream wins: Opus
(`audio/webm; codecs="opus"`) with the lowest `bitrate`/`averageBitrate`,
which is `itag 249` (~50 kbps) whenever YouTube offers it. The `ultralow`
Opus streams (`itag 599`/`600`, ~30 kbps) are cheaper still, but GVS answers
them with 403 for a browser session on a regular video (yt-dlp issue #14605),
so they are only taken when the upload carries nothing else. Without Opus the
cheapest other audio-only stream is taken (`itag 139`, ~48 kbps AAC-HE). Ties
prefer the untouched track over its `isDrc` ("stable volume") duplicate and
then the smaller `contentLength`. A video format is never selectable as audio,
so a muxed answer (`itag 18`) is refused instead of downloaded.

**Video as the last resort.** Only when no client answers a usable audio-only
stream (SABR-only answers, a signature GVS keeps refusing, an upload without
an audio-only track) the ladder runs a second pass over the same cached
`player` answers and takes the smallest picture available: lowest resolution
first, then lowest bitrate, so 144p whenever YouTube offers it. A muxed format
wins over a video-only one, because a video-only stream would arrive without
any audio and the download exists to deliver audio.

## Forcing the format in `web_mse_proxy`

The capture only mirrors what the player downloads, so the player decides the
cost of the download. Left alone its adaptive ladder opens the medium Opus
stream (`itag 251`, ~128 kbps, ~17 MB for a long video) and a multi-language
upload may switch tracks mid-download, which is why `playerResponseFilter.ts`
rewrites `streamingData` before the player reads it:

- the track and the format are chosen by the same `formatSelection` rules as
  `web_abr` (English audio first, then the original track, cheapest Opus of
  that track, `itag 139` AAC without Opus) — the embed manifest carries no
  `url`, so URLs are not required here,
- `adaptiveFormats` is trimmed in place to that one audio format plus the
  cheapest picture, so there is no ladder left to climb and no other language
  to switch to,
- the kept track is marked `audioIsDefault`, `formats` (progressive, played
  outside MediaSource) is emptied and `hlsManifestUrl`/`dashManifestUrl` are
  deleted, because a manifest would hand the full ladder back.

The response reaches the player through whichever entry point the embed uses,
so all of them are hooked in the hidden realm only: `ytInitialPlayerResponse`
of the document, the `/youtubei/v1/player` answer over `fetch` and
`XMLHttpRequest`, and `loadVideoByPlayerVars`/`cueVideoByPlayerVars`/
`updateVideoData` of the player element. The hooks are installed by
`pageAudioHandler` as soon as the realm document starts, because the filter is
only useful before the first buffer is requested. The player the user is
watching is never touched.

If the audio pass yields nothing (player timeout, a fatal player error, an
empty stream), the same video is reloaded with only the 144p picture left in
the manifest — the cheapest thing the player can still be made to deliver.
A pass that already emitted bytes is never restarted, so two different streams
cannot end up spliced into one upload. `MSE capture started` and `MSE stream
finished` both carry the mode, the forced `itag`, the track, the announced
`contentLength` and the captured size.

## Request budget

`web_abr` happy path: one `player` call plus one ranged media request per 4 MiB
of the track, so a 6.5 MB Opus track costs two. A single continuous body is
paced by GVS down to playback speed — 6.5 MB took ~15 minutes — while every
`Range: bytes=start-end` request is answered at the full speed of the
connection, the same trick `yt-dlp --http-chunk-size` relies on (chunks above
10 MiB are throttled again, hence 4 MiB). Up to three ranges are kept in
flight, so uploading one chunk overlaps downloading the next, and ranges are
only overlapped after one answer came back as `206`. Extras are only paid when
needed:

- the player code (~2 MB) when the page functions cannot solve `sig`/`n`, or
  when the page config carries no signature timestamp,
- one PO token for the whole download, taken from the first source that
  answers and never costing a network request: the BotGuard instance of the
  realm, else the `pot` the page player already put on its own media URLs,
  else one injected inline script that mints it in the page realm. The result
  is cached per realm and binding for 30 minutes, so the ladder, the video
  pass and the next download of that session share one mint,
- one repeat of the same range per transport error, twice at most per range
  (never for a refused signature, see below),
- a second `player` call when a signed URL expires mid-download,
- one more `player` call per fallback client, but only for clients this
  session can be answered for: a login-only client is skipped for an anonymous
  session and a PO-token-only client is skipped when the page cannot mint one,
- nothing for the video last resort: every `player` answer is cached for the
  whole download, and a client that already answered a verdict, or whose
  signature GVS refused, is never asked a second time,
- one hidden youtube.com document when the page realm itself cannot stream
  (foreign host, no `ytcfg`, no player JS, or a CSP that blocks the solver).
  That frame is loaded with `#vot_audio_realm`, which the bootstrap policy
  answers with its own `audio-realm` mode: the audio handler is installed and
  no UI, observers or translation runtime are, and the frame is never dropped
  as a "non-runnable iframe" — which is what used to leave a userscript
  download waiting for its full 30-minute timeout.

`web_mse_proxy` pays no media request of its own: the bytes are taken from the
player that is loading them anyway, and trimming its `player` response costs
nothing but the hook. Its overhead is one hidden document plus one
`get_share_panel` call, which unlocks uploads whose embedding is restricted,
and one player reload if the emergency 144p pass is needed. That call is sent with the client version of the page, because
InnerTube only answers a share panel for a real client release and answers a
placeholder version without the encrypted config, which leaves the embed
locked and the player without a video.

The hidden embed is opened with `autoplay=0` and driven through the player API
instead (`loadVideoById`, `mute`, `setPlaybackQualityRange("tiny")`,
`playVideo`), because autoplay is blocked without a user gesture and would
start before the capture proxy is installed. Playback is re-pressed on every
player and media event, a player that already reports `ytp-error` ends the
strategy immediately, and a playback timeout carries the player state, the
video `readyState`, the media error code and the `play()` rejection. Playback
itself is muted, capped to the smallest video quality, run at the highest
`playbackRate` the video element accepts (16x, falling back to 8x, 4x, 2x) and
pushed forward with `seekTo(bufferedEnd)`, so a track is collected in seconds
instead of in real time. Both are needed and both are re-applied while the
capture runs: the rate makes the player read ahead, the seek skips the wait
between two read-aheads, and the player restores its own rate on a format
switch or a reload.

A playability answer (`UNPLAYABLE`, `LOGIN_REQUIRED`, "Video unavailable") is
never retried in another realm: YouTube returns it identically everywhere, so
the direct-URL ladder ends right away and the MediaSource strategy starts
sooner. For the same reason an anonymous session stops the ladder on
`LOGIN_REQUIRED` instead of asking the remaining clients.

Outside the last resort only audio-only formats are used, and `ump`/`range`/`rn`
are stripped from the stream URL, so neither the video track nor the player's
hundreds of small range requests are ever downloaded.

## Media transport

A media range is requested through `GM_xmlhttpRequest` (userscript manager) or
through the extension background whenever the build has one, which is what
`utils/gm.ts` already does for every googlevideo.com host. The reason is not
speed: GVS answers a part of its hosts with a cross-host redirect
(`cms_redirect=yes`) and that redirected answer carries no
`Access-Control-Allow-Origin`, so a request made from the page is dropped by
the browser before the download reads its first byte (`Failed to fetch`), and
no retry can ever succeed. A privileged request is not subject to CORS, is not
touched by the page-level `fetch` wrappers of content blockers
(`ERR_BLOCKED_BY_CLIENT`) and follows the redirect itself.

When no privileged transport exists (no GM API in this realm, or a manager
that refuses the host), the download falls back to the page `fetch` once, and
rebuilds the URL with `alr=yes` — the parameter the YouTube player itself
sends, which makes GVS answer the next host as a `text/plain` body instead of
a redirect, so a page realm can follow it manually. The fallback does not cost
a retry, because it is a verdict about the realm and not about the range.
`media transport selected` and `media transport downgraded` record which
transport a download used.

## PO tokens and 403

GVS binds a PO token to the session (the datasync ID when signed in, the
visitor data otherwise) unless the page announces video-id binding through
`html5_generate_content_po_token`, so exactly one binding is used per download.
The token is minted once before the ladder starts, which is also what makes
the PO token clients cheap to skip: without a token GVS refuses every one of
their URLs, so neither their `player` request nor their media request is
sent.

Where that mint happens decides whether those clients can be used at all, and
it is the difference that made the userscript build fail where the extension
build did not. The BotGuard VM lives in the page realm, so a content script
that runs in `MAIN` finds it among its own globals, while a sandboxed
userscript realm (Tampermonkey `@sandbox JavaScript`/`DOM`, Violentmonkey's
page wrapper, or a page CSP that blocks a raw injection) sees a clean
`window` — which is why `mweb` was skipped as "no GVS PO token" and
`web_creator` collected a 403. `poToken.ts` therefore walks three sources in
order and stops at the first that answers:

1. the realm itself, plus `unsafeWindow` and the parent/top windows when the
   manager exposes them, scanned for `bevasrsg` and `havuokmhhs-*`,
2. the `pot` of a `videoplayback` URL the page player has already requested,
   read back from `performance.getEntriesByType("resource")` (a SABR request
   carries its token in the request body instead, so `sabr=1` URLs are
   skipped),
3. a short inline script that mints the token in the page realm and posts it
   back behind a random nonce.

The answer is cached per realm and binding for 30 minutes. A refusal that
happened without a token is not remembered for the session: the next download
may well be able to mint one.

A `403` with `received === 0` is a `MediaAuthError`: the verdict is about the
signature, not about the transport, so resuming the stream or trying the next
`sig`/`n` candidate cannot change it. The binding can. YouTube rolls
`html5_generate_content_po_token` out per session and the flag is only read
from the page config, so a refused session-bound token is re-minted once for
the video id and the same client is asked again with it — one more media
request and no second `player` request, because that answer is cached. Two
media requests at most per client instead of the four it used to cost, and
that retry is what keeps `web_creator` usable for a session GVS refuses the
session binding for. Once a byte has arrived, the same status means the signed
URL expired instead, so it is re-signed exactly once and the stream is resumed
by byte offset.

Nothing else can be sent from a browser realm: the signed URL authorizes
itself (`sig`, `pot`, `expire`), cookies are not part of that check and are
never sent to googlevideo.com cross-site anyway (`credentials: "omit"` says
so explicitly), and `Origin`, `Referer` and `User-Agent` are forbidden header
names a page cannot set. Once both bindings of a client are refused there is
nothing left to vary, which makes that 403 structural rather than a transient
failure, and it is treated as one: the refusal is remembered for five minutes
and the client is skipped without a request, the video pass does not start at
all once every client has answered, and the ladder reaches `web_mse_proxy`
seconds sooner.

## Clients

The ladder holds the InnerTube clients that still answer a browser session with
direct (non-SABR) stream URLs, cheapest first:

| Client | Why |
| --- | --- |
| `web_embedded` (56) | needs no GVS PO token; its `context.thirdParty.embedUrl` must name a third-party host, because with youtube.com as the embed host YouTube answers the playability verdict of its own surfaces (`ERROR: Video unavailable`) instead of the embed verdict |
| `mweb` (2) | not SABR-only, shares the page cookies and version scheme, needs a GVS PO token but no account, so it is the first client to try once a token exists |
| `web_creator` (62) | answers videos the embedded player refuses, but only with account cookies *and* a GVS PO token (yt-dlp PO Token Guide), so it is last and is skipped for an anonymous session or a realm that cannot mint a token (no request spent) |

Removed on purpose:

- `web` (1) has been SABR-only since April 2025: its `adaptiveFormats` carry
  neither `url` nor `signatureCipher`, so the `player` request was guaranteed
  to be wasted. The case it was meant to cover is now handled by
  `web_mse_proxy`, which reads the same SABR stream through the player.
- `tv_downgraded`/TVHTML5 answers `UNPLAYABLE: The page needs to be reloaded`
  and moved its `sig`/`n` code into a separate `tv-player-ias-tcl.js` variant,
  so it can no longer succeed from the page player.
- `android_vr` and `visionos` cannot send the page cookies and are not
  covered by the PO token the page mints for the web clients, so GVS answers
  their formats with 403 (`android_vr` since 2026-08-17).
- `web_safari` only offers HLS, which would mean one request per segment.
