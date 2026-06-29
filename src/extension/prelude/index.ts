import debug from "../../utils/debug";
import type { AnyObject } from "../shared/constants";
import { installPageGmPolyfills, request } from "./gm-polyfills";
import { wireMessageHandlers } from "./message-handlers";

const PRELUDE_BOOT_KEY = "__VOT_EXT_PRELUDE_BOOTED__";
/**
 * Set on globalThis synchronously after GM polyfills are installed.
 * Content scripts poll this flag before bootstrapping to guarantee
 * that GM_* / GM.* globals are available (CRXJS loads prelude and content
 * as separate async modules which can race).
 */
const PRELUDE_READY_KEY = "__VOT_PRELUDE_READY__";

/**
 * Installs GM polyfills and message handlers **synchronously**.
 *
 * In CRXJS builds the prelude and content scripts are loaded as separate
 * async modules (each via `await import()`). Deferring the polyfill
 * installation to a microtask (e.g. inside an `async () => {}` IIFE)
 * creates a race where the content module may evaluate before the
 * polyfills are on `globalThis`.  By running this synchronously at module
 * top-level we guarantee the GM_* / GM.* globals exist the moment the
 * prelude module finishes evaluation — before any later module can use
 * them.
 *
 * Also sets `globalThis.__VOT_PRELUDE_READY__ = true` so that the
 * content script (`index.ts`) can await this flag before bootstrapping.
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

  // Signal readiness immediately — content scripts poll this.
  preludeGlobal[PRELUDE_READY_KEY] = true;
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
  void performHandshake();
}

bootstrapExtensionPrelude();
