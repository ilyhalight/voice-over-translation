/**
 * InnerTube client matrix of the audio downloader.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The ladder used to be three hardcoded clients (`web_embedded`, `mweb`,
 * `web_creator`) plus one boolean per client ("needs a PO token"), and the
 * token was appended to *every* media URL the strategy built. That is not how
 * GVS authorizes a stream:
 *
 * - a PO token is scoped (GVS / player / subs) *and* bound to one session
 *   (visitor data when logged out, the datasync id when signed in) or to the
 *   video id,
 * - the requirement is per client **and** per streaming protocol: the HTTPS
 *   (DASH-style `videoplayback`) URLs of `mweb` need one, its HLS manifest
 *   does not,
 * - and the policy only says whether a *missing* token is fatal: yt-dlp asks
 *   its provider for a token whenever the policy requires or recommends one
 *   and then attaches whatever it got (`if po_token: fmt_url =
 *   update_url_query(fmt_url, {'pot': po_token})`), for every client. There
 *   is no branch that strips a `pot`, so a client whose policy reads "not
 *   required" is never *denied* a token that is already available.
 *
 * A previous revision read `required: false` as "a token turns these URLs
 * into a 403" and deleted the `pot` for `web_embedded`, `tv` and
 * `tv_embedded`. The anonymous session log disproves it: `web_embedded` was
 * refused on its very first media request, before any token had been minted,
 * and the token minted afterwards was then withheld from every client that
 * could still have used it.
 *
 * The table below mirrors yt-dlp's `INNERTUBE_CLIENTS` /
 * `GVS_PO_TOKEN_POLICY` for the clients a browser realm can actually speak
 * for, so the policy questions have exactly one answer each:
 * {@link requiresGvsPoToken} and {@link recommendsGvsPoToken}.
 *
 * Clients deliberately left out, and why:
 * - `web` / `web_safari` HTTPS formats: SABR-only since 2025, so their
 *   `adaptiveFormats` carry no URL at all. `web_safari` is still kept for its
 *   HLS manifest, which is served without a PO token.
 * - `android*`, `ios`: their contexts are tied to an app user agent a page
 *   cannot send (`User-Agent` is a forbidden header name), and since
 *   2026.08.17 yt-dlp reports blanket 403s for every `android_vr` format.
 * - `visionos` is *not* left out any more: it is yt-dlp's first default
 *   client for an anonymous session (`_DEFAULT_CLIENTS = ('visionos',
 *   'web')`), was added upstream to fix exactly these endless 403s, needs
 *   no PO token and no player JS, and its context is a device descriptor
 *   the page can send in the request body.
 * - `tv_simply`: needs a GVS token that the web BotGuard VM does not mint for
 *   it.
 */

/** The two transports of a YouTube stream this downloader can read. */
export type StreamingProtocol = "https" | "hls";

/**
 * yt-dlp's `GvsPoTokenPolicy`, reduced to the two facts a browser needs.
 *
 * `required`: GVS answers 403 without a token.
 * `recommended`: the token is accepted and improves the odds, but the URLs
 * are authorized without it as well.
 */
export type GvsPoTokenPolicy = {
  readonly required: boolean;
  readonly recommended: boolean;
  /** yt-dlp `not_required_for_premium`: a Premium session needs no token. */
  readonly notRequiredForPremium?: boolean;
  /** yt-dlp `not_required_with_player_token`. */
  readonly notRequiredWithPlayerToken?: boolean;
};

/**
 * The client authorizes its URLs without a token. yt-dlp leaves the GVS
 * policy out entirely for `visionos`, `web_embedded`, `tv`, `tv_downgraded`
 * and `tv_embedded`, which defaults to `required=False, recommended=False`.
 *
 * "Not required" is not "must not be attached": no token is minted for such
 * a client, but one that is already available is attached anyway, which is
 * what yt-dlp does.
 */
const POT_NEVER: GvsPoTokenPolicy = { required: false, recommended: false };
/** GVS refuses the URLs without a token. */
const POT_REQUIRED: GvsPoTokenPolicy = { required: true, recommended: true };
/** Accepted, not demanded (every HLS manifest of the web family). */
const POT_OPTIONAL: GvsPoTokenPolicy = { required: false, recommended: true };

export type InnertubeClient = {
  /** yt-dlp client name. Used in every log line and as the cache key. */
  readonly name: string;
  /** `x-youtube-client-name` / `INNERTUBE_CONTEXT_CLIENT_NAME`. */
  readonly id: string;
  /** `context.client.clientName`. */
  readonly clientName: string;
  /** Fixed version, for a client that does not ship with the page. */
  readonly clientVersion?: string;
  /** `context.client.clientScreen`. */
  readonly clientScreen?: string;
  /**
   * Context user agent. A page cannot set the real `User-Agent` header, so
   * this is only the value InnerTube reads out of the context — enough for
   * the client to be recognized, not enough to fake a native app.
   */
  readonly contextUserAgent?: string;
  /** The client is only answered for a signed-in session. */
  readonly requiresAuth?: boolean;
  /** The client has to declare the page that hosts the player. */
  readonly requiresEmbedUrl?: boolean;
  /** `context.client.originalUrl`, built from the video id. */
  readonly originalUrl?: (videoId: string) => string;
  /** GVS PO token policy per streaming protocol (yt-dlp's table). */
  readonly gvsPoToken: Readonly<Record<StreamingProtocol, GvsPoTokenPolicy>>;
  /**
   * The client answers an `hlsManifestUrl`. HLS is the only YouTube transport
   * that is still served to a logged-out browser session without a PO token,
   * so it is the backbone of the anonymous path.
   */
  readonly supportsHls?: boolean;
  /** The page release version is the correct version for this client. */
  readonly usesPageVersion?: boolean;
  /**
   * Context family of the client.
   *
   * yt-dlp never reuses the watch page context for a non-web client: it
   * builds `INNERTUBE_CONTEXT` from that client's own entry
   * (`_get_default_ytcfg(client)`) and only forces `hl`, `timeZone: 'UTC'`
   * and `utcOffsetMinutes: 0` on top of it. A browser realm has to start
   * from the page context, because that is where `visitorData` and the guest
   * session live, so for a non-web family only the session fields and the
   * client's own descriptor are kept — see {@link applyClientContextPolicy}.
   */
  readonly contextFamily?: "web" | "tv" | "device";
  /** `context.client.deviceMake` (yt-dlp's `visionos` entry). */
  readonly deviceMake?: string;
  /** `context.client.deviceModel`. */
  readonly deviceModel?: string;
  /** `context.client.osName`. */
  readonly osName?: string;
  /** `context.client.osVersion`. */
  readonly osVersion?: string;
  /**
   * yt-dlp's `REQUIRE_JS_PLAYER`. A client that needs no player JS answers
   * plain `url` formats, so neither `sig`/`n` nor the player JS variant of
   * that client (TVHTML5 ships its own `tv-player-ias` since 2026) can go
   * wrong for it.
   */
  readonly requiresJsPlayer?: boolean;
};

/**
 * Ordered ladder, cheapest and most likely first.
 *
 * 1. `visionos` — yt-dlp's first default client for an anonymous session.
 *    No PO token, no account, no player JS, and its `adaptiveFormats` carry
 *    plain URLs, so nothing signed can be wrong with them.
 * 2. `web_embedded` — no token, no account, answers direct URLs, and speaks
 *    the page release, so it is the cheapest web client of the ladder.
 * 3. `tv` — no token either, and not embed-restricted, so it covers uploads
 *    that forbid embedding. Its context is built the way yt-dlp builds it
 *    (the client's own descriptor plus the session fields, and no
 *    `configInfo.appInstallData` for an anonymous session), without which
 *    InnerTube answers `UNPLAYABLE: Please reload the page`.
 * 4. `tv_downgraded` — yt-dlp's fallback for `tv`: the same client name on an
 *    older Cobalt release, answered without a token as well.
 * 5. `mweb` — needs a token for its HTTPS URLs, which the page BotGuard mints
 *    for the same session; its HLS manifest needs none.
 * 6. `web_safari` — HTTPS formats are SABR-only, but its HLS manifest is
 *    served token-free and carries the audio-only renditions (itag 233/234).
 *    Since 2026.07 YouTube only answers it for trusted or signed-in
 *    sessions, so an anonymous run reads it as "no HLS manifest".
 * 7. `tv_embedded` / `web_creator` — signed-in only, kept for age-restricted
 *    uploads where the anonymous clients answer `LOGIN_REQUIRED`.
 */
export const INNERTUBE_CLIENTS: readonly InnertubeClient[] = [
  {
    // yt-dlp `INNERTUBE_CLIENTS['visionos']`: client 101, version 1.02,
    // `REQUIRE_JS_PLAYER: False`, and no GVS PO token policy at all.
    name: "visionos",
    id: "101",
    clientName: "VISIONOS",
    clientVersion: "1.02",
    contextFamily: "device",
    deviceMake: "Apple",
    deviceModel: "RealityDevice17,1",
    osName: "visionOS",
    osVersion: "26.5.23O471",
    contextUserAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_7_3) AppleWebKit/605.1.15 " +
      "(KHTML, like Gecko) Version/26.0 Safari/605.1.15",
    requiresJsPlayer: false,
    gvsPoToken: { https: POT_NEVER, hls: POT_NEVER },
  },
  {
    name: "web_embedded",
    id: "56",
    clientName: "WEB_EMBEDDED_PLAYER",
    clientScreen: "EMBED",
    usesPageVersion: true,
    requiresEmbedUrl: true,
    originalUrl: (videoId) =>
      `https://www.youtube.com/embed/${videoId}?html5=1`,
    gvsPoToken: { https: POT_NEVER, hls: POT_NEVER },
    supportsHls: true,
  },
  {
    name: "tv",
    id: "7",
    clientName: "TVHTML5",
    clientVersion: "7.20260707.07.00",
    contextFamily: "tv",
    contextUserAgent:
      "Mozilla/5.0 (ChromiumStylePlatform) Cobalt/25.lts.30.1034943-gold " +
      "(unlike Gecko), Unknown_TV_Unknown_0/Unknown (Unknown, Unknown)",
    gvsPoToken: { https: POT_NEVER, hls: POT_NEVER },
    supportsHls: true,
  },
  {
    // yt-dlp's `tv_downgraded`: the release TVHTML5 shipped before the
    // playability checks of `7.x`. Same client id, no PO token policy, and
    // cookies are supported, so it is the last token-free HTTPS client of an
    // anonymous session.
    name: "tv_downgraded",
    id: "7",
    clientName: "TVHTML5",
    clientVersion: "5.20260707",
    contextFamily: "tv",
    contextUserAgent: "Mozilla/5.0 (ChromiumStylePlatform) Cobalt/Version",
    gvsPoToken: { https: POT_NEVER, hls: POT_NEVER },
    supportsHls: true,
  },
  {
    name: "mweb",
    id: "2",
    clientName: "MWEB",
    clientScreen: "WATCH",
    usesPageVersion: true,
    originalUrl: (videoId) => `https://m.youtube.com/watch?v=${videoId}`,
    gvsPoToken: {
      // yt-dlp: `not_required_for_premium=True` on the HTTPS/DASH policy.
      https: { ...POT_REQUIRED, notRequiredForPremium: true },
      hls: POT_OPTIONAL,
    },
    supportsHls: true,
  },
  {
    name: "web_safari",
    id: "1",
    clientName: "WEB",
    clientScreen: "WATCH",
    usesPageVersion: true,
    contextUserAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 " +
      "(KHTML, like Gecko) Version/15.5 Safari/605.1.15,gzip(gfe)",
    originalUrl: (videoId) => `https://www.youtube.com/watch?v=${videoId}`,
    gvsPoToken: { https: POT_REQUIRED, hls: POT_OPTIONAL },
    supportsHls: true,
  },
  {
    name: "tv_embedded",
    id: "85",
    clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
    clientVersion: "2.0",
    clientScreen: "EMBED",
    contextFamily: "tv",
    requiresAuth: true,
    requiresEmbedUrl: true,
    originalUrl: (videoId) =>
      `https://www.youtube.com/embed/${videoId}?html5=1`,
    gvsPoToken: { https: POT_NEVER, hls: POT_NEVER },
    supportsHls: true,
  },
  {
    name: "web_creator",
    id: "62",
    clientName: "WEB_CREATOR",
    clientScreen: "WATCH",
    requiresAuth: true,
    gvsPoToken: { https: POT_REQUIRED, hls: POT_OPTIONAL },
    supportsHls: true,
  },
];

export function findInnertubeClient(name: string): InnertubeClient | undefined {
  return INNERTUBE_CLIENTS.find((client) => client.name === name);
}

/** GVS answers 403 for this client and protocol without a token. */
export function requiresGvsPoToken(
  client: InnertubeClient,
  protocol: StreamingProtocol,
): boolean {
  return client.gvsPoToken[protocol].required;
}

/**
 * Whether minting a token for this client and protocol is worth the BotGuard
 * round trip — yt-dlp's `fetch_po_token(required=required or recommended)`.
 *
 * It is *not* a permission to attach one: a token that is already available
 * is attached to any client's URLs, exactly as yt-dlp does.
 */
export function recommendsGvsPoToken(
  client: InnertubeClient,
  protocol: StreamingProtocol,
): boolean {
  const policy = client.gvsPoToken[protocol];
  return policy.required || policy.recommended;
}

/**
 * itags GVS authorizes without a PO token whatever the client policy says.
 *
 * yt-dlp: `require_po_token = stream_id[0] not in ['18'] and
 * gvs_pot_required(...)`, so the muxed 360p format of any client is served
 * token-free. That is what keeps the video fallback of this downloader
 * usable for a client whose audio URLs were refused.
 */
export const POT_EXEMPT_ITAGS: ReadonlySet<number> = new Set([18]);

export function isGvsPoTokenExemptItag(itag: number | undefined): boolean {
  return itag !== undefined && POT_EXEMPT_ITAGS.has(itag);
}

export type ClientContextOptions = {
  readonly videoId: string;
  /** `INNERTUBE_CLIENT_VERSION` of the page, when it has one. */
  readonly pageClientVersion?: string;
};

/**
 * `context.client` overrides for one client of the matrix.
 *
 * The caller clones the page context first (so visitor data, `hl`/`gl` and
 * the screen stay the session's own) and then applies these fields.
 */
export function getClientPlayerContext(
  client: InnertubeClient,
  { videoId, pageClientVersion }: ClientContextOptions,
): Record<string, unknown> {
  const clientVersion = client.usesPageVersion
    ? (pageClientVersion ?? client.clientVersion)
    : client.clientVersion;
  return {
    ...(clientVersion ? { clientVersion } : {}),
    clientName: client.clientName,
    ...(client.clientScreen ? { clientScreen: client.clientScreen } : {}),
    ...(client.contextUserAgent ? { userAgent: client.contextUserAgent } : {}),
    // The device descriptor of a non-web client, verbatim from yt-dlp's
    // `INNERTUBE_CONTEXT` entry for that client.
    ...(client.deviceMake ? { deviceMake: client.deviceMake } : {}),
    ...(client.deviceModel ? { deviceModel: client.deviceModel } : {}),
    ...(client.osName ? { osName: client.osName } : {}),
    ...(client.osVersion ? { osVersion: client.osVersion } : {}),
    ...(client.originalUrl ? { originalUrl: client.originalUrl(videoId) } : {}),
  };
}

/**
 * Fields that belong to the session rather than to the browser, and that
 * yt-dlp carries into (or forces onto) every client context it builds —
 * `_extract_context` in `yt_dlp/extractor/youtube/_base.py`.
 */
const SESSION_CONTEXT_FIELDS: readonly string[] = [
  "hl",
  "gl",
  "visitorData",
  "remoteHost",
  "timeZone",
  "utcOffsetMinutes",
];

/** The context fields the client's own descriptor provides. */
function declaredContextFields(client: InnertubeClient): string[] {
  const fields = ["clientName", "clientVersion"];
  if (client.clientScreen) fields.push("clientScreen");
  if (client.contextUserAgent) fields.push("userAgent");
  if (client.deviceMake) fields.push("deviceMake");
  if (client.deviceModel) fields.push("deviceModel");
  if (client.osName) fields.push("osName");
  if (client.osVersion) fields.push("osVersion");
  if (client.originalUrl) fields.push("originalUrl");
  return fields;
}

/**
 * Brings a cloned page context in line with the client that will be declared.
 *
 * A web client speaks for this very browser, so its cloned context is left
 * alone. Every other family gets the context yt-dlp would have built: the
 * client's own descriptor plus the session fields, and nothing else.
 *
 * This is a keep-list on purpose. The previous revision deleted a fixed list
 * of desktop fields, so every field YouTube adds to the watch page later
 * (`rolloutToken` and `deviceExperimentId` were such additions) leaks into a
 * `TVHTML5` or `VISIONOS` request and describes a desktop Chrome window
 * running a TV client — the mismatch InnerTube answers with `UNPLAYABLE:
 * Please reload the page`, before a single media request is sent.
 *
 * `configInfo.appInstallData` is dropped for an anonymous session, which is
 * yt-dlp's workaround for that same verdict (yt-dlp issue 12563); it keeps
 * the field while signed in, where the workaround has no effect.
 */
export function applyClientContextPolicy(
  clientContext: Record<string, unknown>,
  client: InnertubeClient,
  { loggedIn }: { readonly loggedIn: boolean },
): Record<string, unknown> {
  if (!client.contextFamily || client.contextFamily === "web") {
    return clientContext;
  }

  const kept: Record<string, unknown> = {};
  for (const field of [
    ...SESSION_CONTEXT_FIELDS,
    ...declaredContextFields(client),
  ]) {
    const value = clientContext[field];
    if (value !== undefined) kept[field] = value;
  }
  // yt-dlp forces these on every context it sends, whatever the page reports.
  kept.timeZone = "UTC";
  kept.utcOffsetMinutes = 0;

  const configInfo = clientContext.configInfo;
  if (configInfo && typeof configInfo === "object") {
    const cleaned = { ...(configInfo as Record<string, unknown>) };
    if (!loggedIn) delete cleaned.appInstallData;
    kept.configInfo = cleaned;
  }

  // Rewritten in place, because the caller holds this very object.
  for (const field of Object.keys(clientContext)) delete clientContext[field];
  Object.assign(clientContext, kept);
  return clientContext;
}

export type ClientSelectionOptions = {
  readonly loggedIn: boolean;
  /**
   * Whether a GVS token is or can be obtained. Defaults to `true`, because
   * minting one is lazy: the caller only pays for BotGuard when it reaches a
   * client whose URLs GVS refuses without a token.
   */
  readonly hasPoToken?: boolean;
  readonly protocol: StreamingProtocol;
  /** Clients GVS refused in this session already. */
  readonly isRefused?: (name: string) => boolean;
};

export type ClientSelection = {
  readonly clients: readonly InnertubeClient[];
  readonly skipped: ReadonlyArray<{ client: string; reason: string }>;
};

/**
 * The clients worth a `player` request for one protocol.
 *
 * A request that can only be refused is never sent: a signed-in-only client
 * without cookies, a token-requiring client without a token, and a client GVS
 * refused a moment ago.
 */
export function selectPlayerClients({
  loggedIn,
  hasPoToken = true,
  protocol,
  isRefused,
}: ClientSelectionOptions): ClientSelection {
  const clients: InnertubeClient[] = [];
  const skipped: Array<{ client: string; reason: string }> = [];
  for (const client of INNERTUBE_CLIENTS) {
    const reason = isRefused?.(client.name)
      ? "GVS refused it in this session"
      : client.requiresAuth && !loggedIn
        ? "anonymous session"
        : protocol === "hls" && !client.supportsHls
          ? "no HLS manifest"
          : requiresGvsPoToken(client, protocol) && !hasPoToken
            ? "no GVS PO token"
            : undefined;
    if (reason) skipped.push({ client: client.name, reason });
    else clients.push(client);
  }
  return { clients, skipped };
}
