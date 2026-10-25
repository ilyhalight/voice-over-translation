import debug from "../../utils/debug";
import type { AnyObject } from "../shared/constants";
import { installPageGmPolyfills, request } from "./gm-polyfills";
import { wireMessageHandlers } from "./message-handlers";

const PRELUDE_BOOT_KEY = "__VOT_EXT_PRELUDE_BOOTED__";

// Transient frames still need GM globals, but a handshake would allocate a
// duplicate UUID and pollute the channel for a page that cannot run the app.
function shouldSkipHandshake(): boolean {
  try {
    const href = globalThis.location?.href;
    if (href === "about:blank" || href?.startsWith("about:srcdoc")) {
      return true;
    }
    return (
      globalThis.self !== globalThis.top &&
      globalThis.location?.origin === "null"
    );
  } catch {
    // cross-origin access to .top may throw — treat as top frame
  }
  return false;
}

// Both the Chrome IIFE and Firefox's ordered module injection need GM globals
// installed before the main content script evaluates.
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
    // Manifest metadata is optional; synchronous GM_info defaults remain usable.
  }
}

export function bootstrapExtensionPrelude(): void {
  installPreludeSynchronous();

  if (shouldSkipHandshake()) {
    debug.log("[VOT EXT][prelude] skipping handshake in transient frame");
    return;
  }

  void performHandshake();
}

