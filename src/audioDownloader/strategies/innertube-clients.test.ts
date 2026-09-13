import { expect, test } from "bun:test";

const {
  applyClientContextPolicy,
  findInnertubeClient,
  getClientPlayerContext,
  INNERTUBE_CLIENTS,
  isGvsPoTokenExemptItag,
  recommendsGvsPoToken,
  requiresGvsPoToken,
  selectPlayerClients,
} = await import("./innertubeClients");

const client = (name: string) => {
  const found = findInnertubeClient(name);
  if (!found) throw new Error(`unknown client: ${name}`);
  return found;
};

test("mints no token for a client that authorizes without one", () => {
  for (const name of [
    "visionos",
    "web_embedded",
    "tv",
    "tv_downgraded",
    "tv_embedded",
  ]) {
    // Nothing is minted for these clients, so the happy path of an anonymous
    // download pays for no BotGuard round trip...
    expect(recommendsGvsPoToken(client(name), "https")).toBe(false);
    expect(recommendsGvsPoToken(client(name), "hls")).toBe(false);
    // ...and a missing token is never fatal for them either. A token that is
    // available anyway is still attached, the way yt-dlp attaches it.
    expect(requiresGvsPoToken(client(name), "https")).toBe(false);
  }
});

test("keeps itag 18 token-exempt, as yt-dlp does", () => {
  expect(isGvsPoTokenExemptItag(18)).toBe(true);
  expect(isGvsPoTokenExemptItag(249)).toBe(false);
  expect(isGvsPoTokenExemptItag(undefined)).toBe(false);
});

test("mirrors the yt-dlp policy: HTTPS needs a token, HLS does not", () => {
  for (const name of ["mweb", "web_safari", "web_creator"]) {
    expect(requiresGvsPoToken(client(name), "https")).toBe(true);
    expect(requiresGvsPoToken(client(name), "hls")).toBe(false);
    expect(recommendsGvsPoToken(client(name), "hls")).toBe(true);
  }
});

test("tries the token-free client first", () => {
  const { clients } = selectPlayerClients({
    loggedIn: false,
    protocol: "https",
  });

  // yt-dlp's `_DEFAULT_CLIENTS` for a logged-out session starts with
  // `visionos`, which needs neither a token nor the player JS.
  expect(clients[0]?.name).toBe("visionos");
  expect(clients[1]?.name).toBe("web_embedded");
});

test("skips signed-in-only clients in an anonymous session", () => {
  const { clients, skipped } = selectPlayerClients({
    loggedIn: false,
    protocol: "https",
  });

  expect(clients.map((entry) => entry.name)).not.toContain("web_creator");
  expect(clients.map((entry) => entry.name)).not.toContain("tv_embedded");
  expect(skipped).toContainEqual({
    client: "web_creator",
    reason: "anonymous session",
  });
});

test("keeps every client of the matrix for a signed-in session", () => {
  const { clients } = selectPlayerClients({
    loggedIn: true,
    protocol: "https",
  });

  expect(clients).toHaveLength(INNERTUBE_CLIENTS.length);
});

test("drops token-requiring clients only when no token is available", () => {
  const withoutToken = selectPlayerClients({
    loggedIn: false,
    hasPoToken: false,
    protocol: "https",
  });

  expect(withoutToken.clients.map((entry) => entry.name)).toEqual([
    "visionos",
    "web_embedded",
    "tv",
    "tv_downgraded",
  ]);
  expect(withoutToken.skipped).toContainEqual({
    client: "mweb",
    reason: "no GVS PO token",
  });

  // The same session still reaches those clients over HLS, which is exactly
  // why the anonymous download works: HLS asks for no token.
  const overHls = selectPlayerClients({
    loggedIn: false,
    hasPoToken: false,
    protocol: "hls",
  });

  expect(overHls.clients.map((entry) => entry.name)).toEqual([
    "web_embedded",
    "tv",
    "tv_downgraded",
    "mweb",
    "web_safari",
  ]);
});

test("mirrors yt-dlp's tv_downgraded fallback", () => {
  const downgraded = client("tv_downgraded");

  expect(downgraded.clientName).toBe("TVHTML5");
  expect(downgraded.clientVersion).toBe("5.20260707");
  expect(downgraded.id).toBe("7");
  expect(downgraded.requiresAuth).toBeUndefined();
});

test("does not ask a client GVS refused a moment ago", () => {
  const { clients, skipped } = selectPlayerClients({
    loggedIn: false,
    protocol: "https",
    isRefused: (name) => name === "web_embedded",
  });

  expect(clients.map((entry) => entry.name)).not.toContain("web_embedded");
  expect(skipped).toContainEqual({
    client: "web_embedded",
    reason: "GVS refused it in this session",
  });
});

test("builds a client context from the matrix", () => {
  const tv = getClientPlayerContext(client("tv"), {
    videoId: "P8nJq8S9tNw",
    pageClientVersion: "2.20260911.01.00",
  });

  // A client that does not ship with the page keeps its own version.
  expect(tv.clientName).toBe("TVHTML5");
  expect(tv.clientVersion).toBe("7.20260707.07.00");
  expect(String(tv.userAgent)).toContain("Cobalt");

  const embedded = getClientPlayerContext(client("web_embedded"), {
    videoId: "P8nJq8S9tNw",
    pageClientVersion: "2.20260911.01.00",
  });

  // A web client has to speak the page's release, or InnerTube answers an
  // outdated-client error.
  expect(embedded.clientVersion).toBe("2.20260911.01.00");
  expect(embedded.clientScreen).toBe("EMBED");
  expect(String(embedded.originalUrl)).toContain("/embed/P8nJq8S9tNw");
});

/** The cloned watch page context, reduced to the fields that matter here. */
const pageClientContext = () => ({
  clientName: "TVHTML5",
  clientVersion: "7.20260707.07.00",
  clientScreen: "WATCH",
  browserName: "Chrome",
  browserVersion: "153.0.0.0",
  deviceMake: "",
  osName: "Windows",
  platform: "DESKTOP",
  screenWidthPoints: 1280,
  visitorData: "CgtfaXAzQUpBczQzTg%3D%3D",
  hl: "ru",
  gl: "RU",
  configInfo: {
    appInstallData: "CJmJv8kGEJ3PsAUQ",
    coldConfigData: "CJmJv8kGGjJBT2pGb3g",
  },
});

test("strips the browser context of a tv client, as yt-dlp does", () => {
  const context = applyClientContextPolicy(pageClientContext(), client("tv"), {
    loggedIn: false,
  });

  // The `appInstallData` of the watch page is what makes an anonymous TVHTML5
  // request answer `UNPLAYABLE: Please reload the page` (yt-dlp issue 12563).
  expect(context.configInfo).toEqual({ coldConfigData: "CJmJv8kGGjJBT2pGb3g" });
  expect(context.browserName).toBeUndefined();
  expect(context.platform).toBeUndefined();
  expect(context.screenWidthPoints).toBeUndefined();
  expect(context.clientScreen).toBeUndefined();

  // The session identity has to survive: it binds the guest cookie and, for
  // the clients that do need one, the PO token.
  expect(context.visitorData).toBe("CgtfaXAzQUpBczQzTg%3D%3D");
  expect(context.hl).toBe("ru");
  expect(context.gl).toBe("RU");
  expect(context.clientVersion).toBe("7.20260707.07.00");
});

test("keeps appInstallData for a signed-in session, as yt-dlp does", () => {
  const context = applyClientContextPolicy(pageClientContext(), client("tv"), {
    loggedIn: true,
  });

  expect(context.configInfo).toEqual({
    appInstallData: "CJmJv8kGEJ3PsAUQ",
    coldConfigData: "CJmJv8kGGjJBT2pGb3g",
  });
});

test("keeps the embed screen of tv_embedded and the whole web context", () => {
  const embedded = applyClientContextPolicy(
    { ...pageClientContext(), clientScreen: "EMBED" },
    client("tv_embedded"),
    { loggedIn: true },
  );
  expect(embedded.clientScreen).toBe("EMBED");

  const web = applyClientContextPolicy(
    pageClientContext(),
    client("web_embedded"),
    { loggedIn: false },
  );
  // A web client speaks for this very browser, so nothing is stripped.
  expect(web.browserName).toBe("Chrome");
  expect(web.configInfo).toEqual({
    appInstallData: "CJmJv8kGEJ3PsAUQ",
    coldConfigData: "CJmJv8kGGjJBT2pGb3g",
  });
});

test("mirrors yt-dlp's visionos client", () => {
  const visionos = client("visionos");

  expect(visionos.clientName).toBe("VISIONOS");
  expect(visionos.clientVersion).toBe("1.02");
  expect(visionos.id).toBe("101");
  expect(visionos.deviceModel).toBe("RealityDevice17,1");
  expect(visionos.requiresJsPlayer).toBe(false);
  // Its HTTPS formats carry plain URLs; it answers no HLS manifest.
  expect(visionos.supportsHls).toBeUndefined();
});

test("sends a device context for visionos, not the browser's", () => {
  const merged = {
    ...pageClientContext(),
    ...getClientPlayerContext(client("visionos"), {
      videoId: "P8nJq8S9tNw",
      pageClientVersion: "2.20260911.01.00",
    }),
  };
  const context = applyClientContextPolicy(merged, client("visionos"), {
    loggedIn: false,
  });

  expect(context.clientName).toBe("VISIONOS");
  expect(context.clientVersion).toBe("1.02");
  expect(context.deviceMake).toBe("Apple");
  expect(context.osName).toBe("visionOS");
  // The keep-list drops every desktop field, including the ones the old
  // block-list did not know about.
  expect(context.browserName).toBeUndefined();
  expect(context.platform).toBeUndefined();
  expect(context.clientScreen).toBeUndefined();
  // yt-dlp forces the timezone on every context it builds.
  expect(context.timeZone).toBe("UTC");
  expect(context.utcOffsetMinutes).toBe(0);
  // The session identity survives: it binds the guest cookie.
  expect(context.visitorData).toBe("CgtfaXAzQUpBczQzTg%3D%3D");
});
