/**
 * CONSOLIDATION — realm plumbing shared by the PO-token and web-ABR paths.
 *
 * Four separate copies of "walk self/parent/top, swallow the cross-origin
 * throw", two copies of "make a Trusted Types policy so an inline script can
 * be installed", and two copies of "read a value out of `ytcfg`" lived in
 * `poToken.ts`, `webAbr.ts` and `mseProxy.ts`.
 */

/** A window-ish object plus the realm-scoped globals the module pokes at. */
export type RealmWindow = Window &
  typeof globalThis & {
    ytcfg?: {
      get?: (key: string) => unknown;
      data_?: Record<string, unknown>;
    };
    trustedTypes?: {
      createPolicy: (
        name: string,
        rules: { createScript: (input: string) => string },
      ) => { createScript: (input: string) => string };
    };
  };

/**
 * Yields `self`, `parent` and `top` once each, in that order, skipping realms
 * that are unreachable or duplicated.
 *
 * Cross-origin access throws *on property read*, so every candidate is probed
 * inside its own try/catch; a realm that throws is simply not a realm we can
 * use. Ordering matters: the current realm is always preferred over an
 * ancestor, which is what keeps a same-origin page from being asked to mint a
 * token the local realm could mint itself.
 */
export function enumerateRealms(source: Window): RealmWindow[] {
  const realms: RealmWindow[] = [];
  const seen = new Set<unknown>();
  const candidates: Array<() => Window | null | undefined> = [
    () => source,
    () => source.parent,
    () => source.top,
  ];
  for (const read of candidates) {
    try {
      const realm = read();
      if (!realm || seen.has(realm)) continue;
      seen.add(realm);
      realms.push(realm as RealmWindow);
    } catch {
      // Opaque origin or detached frame: not usable, not an error.
    }
  }
  return realms;
}

/**
 * Wraps a script source so it can be assigned to `HTMLScriptElement.text`
 * under a `require-trusted-types-for 'script'` CSP.
 *
 * Policies are cached per realm: `createPolicy` with a fresh random name on
 * every call leaked one policy per probe in `webAbr.evalInRealm`, and each
 * policy name has to be allowed by the page's `trusted-types` directive, so
 * random names are also the *less* likely variant to be accepted.
 * Verified against the Trusted Types sink list (Research Log R-6):
 * `HTMLScriptElement.text` is a `TrustedScript` sink.
 */
const policyCache = new WeakMap<object, { createScript: (s: string) => string }>();

export function createTrustedScript(
  realm: RealmWindow,
  source: string,
  policyName = "vot-audio-downloader",
): string {
  const trustedTypes = realm.trustedTypes;
  if (!trustedTypes?.createPolicy) return source;
  try {
    let policy = policyCache.get(realm as unknown as object);
    if (!policy) {
      policy = trustedTypes.createPolicy(policyName, {
        createScript: (input: string) => input,
      });
      policyCache.set(realm as unknown as object, policy);
    }
    return policy.createScript(source) as unknown as string;
  } catch {
    // No policy could be created (duplicate name, disallowed name, or no
    // Trusted Types at all). Hand back the raw source: the assignment either
    // works because enforcement is off, or throws where it is enforced —
    // which is exactly the pre-consolidation behavior.
    return source;
  }
}

/**
 * Reads a key out of a realm's `ytcfg`, preferring the accessor and falling
 * back to the raw backing store.
 *
 * `webAbr.getConfigValue` and the inline expression in
 * `mseProxy.getEncryptedEmbedConfig` were the same two-step lookup; the
 * accessor can throw on a partially initialised page, which only one of the
 * two copies guarded.
 */
export function getYtcfgValue<T = string>(
  realm: Pick<RealmWindow, "ytcfg">,
  key: string,
): T | undefined {
  const ytcfg = realm?.ytcfg;
  if (!ytcfg) return undefined;
  try {
    const value = ytcfg.get?.(key);
    if (value !== undefined && value !== null) return value as T;
  } catch {
    // `ytcfg.get` throws while the player boots; the backing store is still
    // readable in that window.
  }
  return ytcfg.data_?.[key] as T | undefined;
}
