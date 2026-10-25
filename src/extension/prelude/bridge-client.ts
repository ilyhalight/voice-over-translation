import debug from "../../utils/debug";
import {
  BRIDGE_RESTART_ERROR_CODE,
  isOurMessage,
  TYPE_BRIDGE_DOWN,
  TYPE_BRIDGE_PING,
  TYPE_BRIDGE_READY,
} from "../shared/constants";
import { isSameWindowBridgeEvent, postToPage } from "../shared/transport";

/**
 * MAIN-world view of the isolated-world bridge lifecycle.
 *
 * - "unknown": no READY/DOWN seen yet (old bridge or READY missed) – optimistic.
 * - "ready":   a live bridge announced itself (READY {instanceId}).
 * - "down":    the current bridge announced its context died (DOWN {instanceId});
 *              work should wait for the next READY.
 */
export type BridgeState = "unknown" | "ready" | "down";

export const DEFAULT_BRIDGE_READY_TIMEOUT_MS = 15_000;

let state: BridgeState = "unknown";
let currentInstanceId: string | null = null;
let installed = false;
const deadInstances = new Set<string>();
const stateListeners = new Set<() => void>();

export function getBridgeState(): BridgeState {
  return state;
}

/** Instance id of the last bridge that announced READY (null if none yet). */
export function getBridgeInstanceId(): string | null {
  return currentInstanceId;
}

function toInstanceId(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function notifyStateListeners(): void {
  for (const listener of stateListeners) {
    try {
      listener();
    } catch {
      // ignore listener failures
    }
  }
}

function handleBridgeReady(instanceId: string | null): void {
  if (instanceId && deadInstances.has(instanceId)) return; // late READY of a dead bridge
  state = "ready";
  currentInstanceId = instanceId;
  debug.log("[VOT EXT][prelude] bridge ready", { instanceId });
  notifyStateListeners();
}

function handleBridgeDown(instanceId: string | null): void {
  if (instanceId) deadInstances.add(instanceId);
  // A newer bridge already announced itself; this DOWN is from a stale orphan.
  if (
    state === "ready" &&
    instanceId &&
    currentInstanceId &&
    instanceId !== currentInstanceId
  ) {
    return;
  }
  state = "down";
  debug.warn("[VOT EXT][prelude] bridge down", { instanceId });
  notifyStateListeners();
}

function isBridgeUsable(staleInstanceId?: string | null): boolean {
  if (state === "ready") {
    return !(staleInstanceId && currentInstanceId === staleInstanceId);
  }
  return state === "unknown";
}

/**
 * Resolves immediately when the bridge is ready (or unknown and never seen
 * down); otherwise waits for the next READY. Rejects after `timeoutMs`.
 *
 * `staleInstanceId` (optional): a bridge instance known to have failed a
 * request; a READY from that same instance does not count as "ready".
 */
export function whenBridgeReady(
  timeoutMs: number = DEFAULT_BRIDGE_READY_TIMEOUT_MS,
  staleInstanceId?: string | null,
  signal?: AbortSignal,
): Promise<void> {
  if (signal?.aborted)
    return Promise.reject(new Error("VOT bridge wait aborted"));
  if (isBridgeUsable(staleInstanceId)) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const cleanup = () => {
      stateListeners.delete(listener);
      signal?.removeEventListener("abort", onAbort);
      if (timeoutId !== null) clearTimeout(timeoutId);
      timeoutId = null;
    };
    const onAbort = () => {
      cleanup();
      reject(new Error("VOT bridge wait aborted"));
    };
    const listener = () => {
      if (!isBridgeUsable(staleInstanceId)) return;
      cleanup();
      resolve();
    };
    stateListeners.add(listener);
    signal?.addEventListener("abort", onAbort, { once: true });

    const ms = Number(timeoutMs);
    if (Number.isFinite(ms) && ms >= 0) {
      timeoutId = globalThis.setTimeout(() => {
        cleanup();
        reject(new Error(`VOT bridge did not become ready within ${ms}ms`));
      }, ms);
    }
  });
}

/** True when an error / error string / XHR error payload carries the restart code. */
export function isBridgeRestartError(err: unknown, depth = 0): boolean {
  if (err == null || depth > 3) return false;
  if (typeof err === "string") return err.includes(BRIDGE_RESTART_ERROR_CODE);
  if (typeof err !== "object") return false;
  const rec = err as Record<string, unknown>;
  for (const key of ["code", "message", "error", "statusText", "reason"]) {
    const value = rec[key];
    if (
      typeof value === "string" &&
      value.includes(BRIDGE_RESTART_ERROR_CODE)
    ) {
      return true;
    }
    if (
      value !== err &&
      typeof value === "object" &&
      isBridgeRestartError(value, depth + 1)
    ) {
      return true;
    }
  }
  return false;
}

/** Idempotent: listens for READY/DOWN and asks a live bridge to announce itself once. */
export function installBridgeClient(): void {
  if (installed) return;
  installed = true;

  globalThis.addEventListener("message", (event: MessageEvent) => {
    if (!isSameWindowBridgeEvent(event)) return;
    const data = event.data;
    if (!isOurMessage(data)) return;
    const type = data.type;
    if (type !== TYPE_BRIDGE_READY && type !== TYPE_BRIDGE_DOWN) return;
    const instanceId = toInstanceId(
      (data as Record<string, unknown>).instanceId ??
        (data as { payload?: Record<string, unknown> }).payload?.instanceId,
    );
    if (type === TYPE_BRIDGE_READY) handleBridgeReady(instanceId);
    else handleBridgeDown(instanceId);
  });

  try {
    postToPage({ type: TYPE_BRIDGE_PING });
  } catch {
    // The bridge may not be available yet; READY can still arrive later.
  }
}
