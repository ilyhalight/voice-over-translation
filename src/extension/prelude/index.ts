import debug from "../../utils/debug";
import type { AnyObject } from "../shared/constants";
import { installPageGmPolyfills, request } from "./gm-polyfills";
import { wireMessageHandlers } from "./message-handlers";

const PRELUDE_BOOT_KEY = "__VOT_EXT_PRELUDE_BOOTED__";

/**
 * Returns true when the content script is running inside an
 * about:blank / about:srcdoc iframe injected via match_about_blank.
 *
 * In those contexts the async handshake should not fire because
 * the iframe is not a runnable page — it exists only as a transient
 * container.  Keeping the synchronous polyfill install is fine (the
 * content script may still need GM globals), but the background
 * handshake would produce a duplicate UUID and pollute the message
 * channel.
 */
function shouldSkipFrame(): boolean {
  try {
    const href = globalThis.location?.href;
    if (href === "about:blank" || href?.startsWith("about:srcdoc")) {
      return true;
    }
    const isIframe = globalThis.self !== globalThis.top;
    if (isIframe && globalThis.location?.origin === "null") {
      return true;
    }
  } catch {
    // cross-origin access to .top may throw — treat as top frame
  }
  return false;
}

/**
 * Installs GM polyfills and message handlers **synchronously**.
 *
 * In CRXJS builds the prelude is an IIFE emitted as a standalone bundle
 * (prelude.iife.ts). Chrome runs it synchronously at document_start, so
 * GM_* / GM.* globals are on globalThis before any MAIN-world content
 * script evaluates.
 *
 * In Firefox builds the bridge injects prelude.module.js as a
 * <script type="module"> before content.module.js, giving the same
 * ordering guarantee.
 */
export function installPreludeSynchronous(): void {
  const preludeGlobal = globalThis as Record<string, unknown>;
  if (preludeGlobal[PRELUDE_BOOT_KEY]) {
    debug.log("[VOT EXT][prelude] already initialized");
    return;
  }

  preludeGlobal[PRELUDE_BOOT_KEY] = true;

  installPageGmPolyfills();
  wireMessageHandlers();
}

/**
 * Best-effort async handshake to populate GM_info with real manifest
 * metadata. Called fire-and-forget after synchronous init.
 */
async function performHandshake(): Promise<void> {
  try {
    const { manifest } = await request<{ manifest: AnyObject }>("handshake");
    const gmInfo = (globalThis as any).GM_info as AnyObject;
    if (manifest?.name) gmInfo.script.name = manifest.name;
    if (manifest?.version) {
      gmInfo.script.version = manifest.version;
      gmInfo.version = manifest.version;
    }
  } catch {
    // ignore — non-fatal
  }
}

/**
 * Main entry-point called at module top-level.
 *
 * Polyfill installation is **synchronous** so that GM globals are
 * available before the content script module starts evaluating.
 * The handshake is fire-and-forget async.
 */
export function bootstrapExtensionPrelude(): void {
  installPreludeSynchronous();

  // Skip the async handshake in about:blank / about:srcdoc iframes.
  // The polyfills are still installed synchronously above so the
  // content script can use GM globals if it needs them, but the
  // handshake would just produce a duplicate UUID in a transient frame.
  if (shouldSkipFrame()) {
    debug.log("[VOT EXT][prelude] skipping handshake in transient frame");
    return;
  }

  void performHandshake();
}

// Auto-init in non-CRXJS builds (Firefox extension).
// CRXJS (Chrome) uses prelude.iife.ts which calls bootstrapExtensionPrelude()
// directly as a synchronous IIFE — no loader, no race condition.
if (import.meta.env.VITE_CRXJS_BUILD !== "true") {
  bootstrapExtensionPrelude();
}
