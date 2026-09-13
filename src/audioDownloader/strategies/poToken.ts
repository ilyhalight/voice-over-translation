/**
 * GVS PO token of the page: selection of its binding and every way to get it.
 *
 * GVS answers 403 for the signed URLs of most InnerTube clients unless the
 * request carries a `pot` parameter, and the token is minted by the BotGuard
 * VM the web player already booted — no network request is spent on it
 * (`web`, `web_safari`, `web_music`, `web_creator`, `mweb` and `tv_simply`
 * all need one; `web_embedded`, `tv` and `tv_embedded` do not).
 *
 * The VM lives in the page realm, so where this code runs decides whether a
 * token can be minted at all:
 *
 * - the extension build runs its prelude in the MAIN world, so the BotGuard
 *   globals are own properties of its own `globalThis` and
 *   {@link mintPagePoToken} finds them,
 * - a userscript build runs in a sandboxed realm whenever the manager cannot
 *   inject into the page (Tampermonkey `@sandbox JavaScript`/`DOM`,
 *   Violentmonkey, a page CSP that blocks the raw injection). That realm has
 *   its own globals, so the very same scan finds nothing, every PO token
 *   client is skipped and the download ends on a 403 — which is exactly the
 *   difference the userscript build used to show against the extension one.
 *
 * Three sources are tried, cheapest first:
 *
 * 1. the BotGuard VM of a realm this code can read ({@link mintPagePoToken}),
 *    including `unsafeWindow`, the page realm a userscript manager hands out,
 * 2. the `pot` parameter of the media requests the page player already sent
 *    ({@link harvestGvsPoToken}) — the same token, for free, and readable
 *    from any realm,
 * 3. a short script injected into the document, which mints the token in the
 *    page realm and posts it back behind a random nonce
 *    ({@link mintPageWorldPoToken}).
 */
import { createAbortableDelay } from "../../utils/abort";
import debug from "../../utils/debug";
import { makeAbortError } from "../../utils/errors";
import { isGooglevideoHost } from "../internal/hosts";
import {
  createTrustedScript,
  enumerateRealms,
  type RealmWindow,
} from "../internal/realms";

/** Globals the BotGuard VM of the web player publishes. */
const BOTGUARD_GLOBAL = "bevasrsg";
const BOTGUARD_PREFIX = "havuokmhhs-";
/** BotGuard answers `SDF:notready` until its VM finished booting. */
const MINT_ATTEMPTS = 10;
const MINT_RETRY_DELAY_MS = 500;
/** A page realm that never answers costs the ladder this much, once. */
const PAGE_REALM_TIMEOUT_MS = 15_000;
/**
 * A GVS token stays valid for hours, so one mint is shared by every download
 * of the session instead of paying the page realm roundtrip again. Kept well
 * below the server side lifetime so a rotated session is picked up anyway.
 */
const TOKEN_TTL_MS = 30 * 60_000;

type BotguardHost = { bevasrs?: { wpc?: unknown } };

/** The page realm a userscript manager exposes to a sandboxed script. */
function getUnsafeWindow(): Window | undefined {
  const realm = (globalThis as unknown as { unsafeWindow?: Window })
    .unsafeWindow;
  return realm && realm !== (globalThis as unknown as Window)
    ? realm
    : undefined;
}

/** The realms one document can reach, deduplicated. */
/**
 * The realms one document can reach, deduplicated.
 *
 * CONSOLIDATION: the self/parent/top walk is
 * `internal/realms.enumerateRealms` (shared with `webAbr.resolveTrustedRealm`).
 * Both entry points are still unioned, because BotGuard may be installed in
 * either the userscript realm or the page realm.
 */
function collectRealms(pageWindow: Window): Set<Window> {
  const realms = new Set<Window>();
  for (const entry of [pageWindow, getUnsafeWindow()]) {
    if (!entry) continue;
    for (const realm of enumerateRealms(entry as RealmWindow)) {
      realms.add(realm as Window);
    }
  }
  return realms;
}

function isBotguardKey(key: string): boolean {
  return key === BOTGUARD_GLOBAL || key.startsWith(BOTGUARD_PREFIX);
}

/**
 * GVS binds a PO token to the session (the datasync ID when signed in, the
 * visitor data otherwise) unless the page announces the video-id binding
 * experiment. Exactly one binding is selected per attempt: a token GVS
 * refuses is a verdict on the whole client, and the caller rotates to the
 * video-id binding only after a refusal instead of guessing upfront.
 */
export function selectGvsPoTokenBinding(
  videoId: string,
  options: {
    loggedIn: boolean;
    dataSyncId: unknown;
    visitorData: unknown;
    experimentFlags: string[];
  },
): { kind: "video" | "datasync" | "visitor"; value: string } {
  const prefersVideoId = options.experimentFlags.some(
    (flags) =>
      new URLSearchParams(flags)
        .getAll("html5_generate_content_po_token")
        .at(-1) === "true",
  );
  // Authenticated GVS uses the full datasync ID, including the || separator.
  const session = options.loggedIn ? options.dataSyncId : options.visitorData;
  if (prefersVideoId || typeof session !== "string" || !session) {
    return { kind: "video", value: videoId };
  }
  return { kind: options.loggedIn ? "datasync" : "visitor", value: session };
}

/**
 * Mints the token with the BotGuard instance of a realm this code can read.
 *
 * @returns the token, or `undefined` when no reachable realm carries a
 * BotGuard VM.
 */
export async function mintPagePoToken(
  pageWindow: Window,
  binding: string,
  signal: AbortSignal,
): Promise<string | undefined> {
  for (const realm of collectRealms(pageWindow)) {
    let keys: string[];
    try {
      keys = Object.getOwnPropertyNames(realm).filter(isBotguardKey);
    } catch {
      continue;
    }
    for (const key of keys) {
      let bevasrs: { wpc?: unknown } | undefined;
      try {
        bevasrs = (
          (realm as unknown as Record<string, unknown>)[key] as
            | BotguardHost
            | undefined
        )?.bevasrs;
      } catch {
        continue;
      }
      const wpc = bevasrs?.wpc;
      if (typeof wpc !== "function") continue;
      for (let attempt = 0; attempt < MINT_ATTEMPTS; attempt++) {
        // DEFECT FIX (F-7): wrap the raw reason in the canonical
        // AbortError so `isAbortError()` in `runAudioDownload` classifies
        // this as an abort instead of a failed strategy. The reason is
        // preserved as the error message.
        if (signal.aborted) throw makeAbortError(signal.reason);
        try {
          const minter = await wpc.call(bevasrs);
          const token = await minter?.mws?.({
            c: binding,
            mc: false,
            me: false,
          });
          if (typeof token === "string" && token) return token;
        } catch (error) {
          if (!String(error).includes("SDF:notready")) break;
        }
        await createAbortableDelay(MINT_RETRY_DELAY_MS, signal);
      }
    }
  }
}

/**
 * Reads the token off the media requests the page player already sent.
 *
 * The player signs its own `videoplayback` URLs with the very same GVS token
 * (yt-dlp documents the `pot` parameter of those URLs as a source of it), and
 * resource timings are readable from every realm, so this works where neither
 * BotGuard nor an injected script can be reached. A SABR request carries the
 * token in its protobuf body instead, so those URLs are skipped.
 */
export function harvestGvsPoToken(realm: Window): string | undefined {
  let entries: ReadonlyArray<{ name?: unknown }> = [];
  try {
    entries = realm.performance?.getEntriesByType?.("resource") ?? [];
  } catch {
    return undefined;
  }
  // The newest request carries the freshest token.
  for (let index = entries.length - 1; index >= 0; index--) {
    const name = entries[index]?.name;
    if (typeof name !== "string" || !name.includes("/videoplayback")) continue;
    let url: URL;
    try {
      url = new URL(name);
    } catch {
      continue;
    }
    if (!isGooglevideoHost(url.hostname)) continue;
    if (url.searchParams.get("sabr") === "1") continue;
    const token = url.searchParams.get("pot");
    if (token) return token;
  }
  return undefined;
}

/**
 * The same scan, written for the page realm: it is injected as plain source,
 * so it cannot share anything with this module.
 */
function buildPageRealmSource(nonce: string, binding: string): string {
  return `(() => {
  const nonce = ${JSON.stringify(nonce)};
  const binding = ${JSON.stringify(binding)};
  const reply = (token, error) => {
    try {
      window.postMessage({ votPoTokenNonce: nonce, token: token, error: error }, "*");
    } catch (ignored) {}
  };
  const realms = new Set([window]);
  try {
    realms.add(window.parent);
    realms.add(window.top);
  } catch (crossOrigin) {}
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  (async () => {
    for (const realm of realms) {
      let keys = [];
      try {
        keys = Object.getOwnPropertyNames(realm).filter(
          (key) =>
            key === ${JSON.stringify(BOTGUARD_GLOBAL)} ||
            key.indexOf(${JSON.stringify(BOTGUARD_PREFIX)}) === 0,
        );
      } catch (denied) {
        continue;
      }
      for (const key of keys) {
        let bevasrs;
        try {
          bevasrs = realm[key] && realm[key].bevasrs;
        } catch (denied) {
          continue;
        }
        const wpc = bevasrs && bevasrs.wpc;
        if (typeof wpc !== "function") continue;
        for (let attempt = 0; attempt < ${MINT_ATTEMPTS}; attempt++) {
          try {
            const minter = await wpc.call(bevasrs);
            const token =
              minter &&
              minter.mws &&
              (await minter.mws({ c: binding, mc: false, me: false }));
            if (typeof token === "string" && token) {
              reply(token);
              return;
            }
          } catch (error) {
            if (String(error).indexOf("SDF:notready") < 0) break;
          }
          await wait(${MINT_RETRY_DELAY_MS});
        }
      }
    }
    reply(undefined, "no BotGuard instance in the page realm");
  })().catch((error) => reply(undefined, String(error)));
})();`;
}

/** Trusted Types refuse a plain string, so the policy is only built on demand. */
/**
 * Sets the source of an injected `<script>`, honouring Trusted Types.
 *
 * Returns false when the realm enforces Trusted Types and no policy could be
 * created, which is the caller's signal to give up on page-realm minting.
 *
 * CONSOLIDATION + DEFECT FIX (F-5): the policy is the cached per-realm one from
 * `internal/realms.createTrustedScript`; this used to mint a uniquely named
 * policy on every call.
 */
function setScriptSource(
  script: HTMLScriptElement,
  realm: Window,
  source: string,
): boolean {
  try {
    script.textContent = source;
    return true;
  } catch {
    // Trusted Types rejected the plain string; fall through to a policy.
  }
  try {
    const trusted = createTrustedScript(
      realm as RealmWindow,
      source,
      "vot-po-token",
    );
    // No policy could be created: the helper hands the raw source back.
    if (trusted === source) return false;
    (script as unknown as { text: unknown }).text = trusted;
    return true;
  } catch {
    return false;
  }
}

/**
 * Mints the token inside the page realm from a sandboxed userscript realm.
 *
 * @returns the token, or `undefined` when the page carries no BotGuard VM or
 * its CSP refuses the injected script.
 */
export function mintPageWorldPoToken(
  realm: Window,
  binding: string,
  signal: AbortSignal,
): Promise<string | undefined> {
  const document = realm.document;
  const host = document?.documentElement;
  if (!host || typeof document.createElement !== "function") {
    return Promise.resolve(undefined);
  }
  const nonce = `vot-po-token-${crypto.randomUUID()}`;
  const script = document.createElement("script");
  if (!setScriptSource(script, realm, buildPageRealmSource(nonce, binding))) {
    return Promise.resolve(undefined);
  }

  return new Promise<string | undefined>((resolve) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let settled = false;
    const finish = (token?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      realm.removeEventListener("message", onMessage);
      signal.removeEventListener("abort", onAbort);
      script.remove();
      resolve(token);
    };
    const onMessage = (event: MessageEvent) => {
      const data = event.data as {
        votPoTokenNonce?: unknown;
        token?: unknown;
        error?: unknown;
      } | null;
      if (!data || data.votPoTokenNonce !== nonce) return;
      if (typeof data.token === "string" && data.token) {
        finish(data.token);
        return;
      }
      debug.log("Audio downloader. page realm PO token unavailable", {
        error: String(data.error ?? "unknown"),
      });
      finish();
    };
    const onAbort = () => finish();

    realm.addEventListener("message", onMessage);
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) {
      finish();
      return;
    }
    timeout = setTimeout(finish, PAGE_REALM_TIMEOUT_MS);
    // An inline script runs while it is being inserted, so the element is only
    // needed for that one moment.
    (document.body ?? host).append(script);
  });
}

/** One token per realm and binding, reused while it is still fresh. */
const tokenCache = new WeakMap<
  Window,
  Map<string, { token: string; mintedAt: number }>
>();

function readCachedToken(realm: Window, binding: string): string | undefined {
  const cached = tokenCache.get(realm)?.get(binding);
  if (!cached) return undefined;
  if (Date.now() - cached.mintedAt < TOKEN_TTL_MS) return cached.token;
  tokenCache.get(realm)?.delete(binding);
  return undefined;
}

function cacheToken(realm: Window, binding: string, token: string): void {
  let bindings = tokenCache.get(realm);
  if (!bindings) {
    bindings = new Map();
    tokenCache.set(realm, bindings);
  }
  bindings.set(binding, { token, mintedAt: Date.now() });
}

/**
 * One token for the whole download, taken from wherever it is reachable.
 *
 * @returns the token, or `undefined` when no source of this realm can answer
 * one — the caller then skips every client whose URLs GVS would refuse.
 */
export async function mintGvsPoToken(
  realm: Window,
  binding: string,
  signal: AbortSignal,
): Promise<string | undefined> {
  const cached = readCachedToken(realm, binding);
  if (cached) return cached;

  const inRealm = await mintPagePoToken(realm, binding, signal);
  if (inRealm) {
    debug.log("Audio downloader. GVS PO token minted", { source: "realm" });
    cacheToken(realm, binding, inRealm);
    return inRealm;
  }
  // Nothing in this realm: either the page has no player (an embed document
  // before its player booted) or this realm is not the page realm at all.
  const harvested = harvestGvsPoToken(realm);
  if (harvested) {
    debug.log("Audio downloader. GVS PO token minted", { source: "player" });
    // Not cached: the player signs its URLs with the binding of its own
    // session, which is not necessarily the one that was asked for here.
    return harvested;
  }
  const pageRealm = await mintPageWorldPoToken(realm, binding, signal);
  debug.log("Audio downloader. GVS PO token minted", {
    source: pageRealm ? "page realm" : "none",
    sandboxedRealm: !(realm as unknown as Record<string, unknown>).ytcfg,
  });
  if (pageRealm) cacheToken(realm, binding, pageRealm);
  return pageRealm;
}
