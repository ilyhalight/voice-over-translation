// Extension reloads leave orphaned isolated worlds running. A lifecycle port
// detects context loss; takeover retires old worlds when a new bridge arrives.
import debug from "../../utils/debug";
import {
  BRIDGE_RESTART_ERROR_CODE,
  BRIDGE_TAKEOVER_EVENT,
  isOurMessage,
  LIFECYCLE_PORT_NAME,
  TYPE_BRIDGE_DOWN,
  TYPE_BRIDGE_PING,
  TYPE_BRIDGE_READY,
} from "../shared/constants";
import { isSameWindowBridgeEvent, postToPage } from "../shared/transport";
import {
  ext,
  isContextInvalidatedError,
  lastErrorMessage,
} from "../shared/webext";

export type BridgeRetireReason =
  | "context-invalidated"
  | "takeover"
  | (string & {});

export type BridgeRetireCallback = (reason: BridgeRetireReason) => void;

export interface BridgeLifecycle {
  readonly instanceId: string;
  /** Aborted on retire(); bind every bridge listener to it. */
  readonly signal: AbortSignal;
  isAlive(): boolean;
  /** Runs `cb` once on retire (immediately if already retired). */
  onRetire(cb: BridgeRetireCallback): void;
  start(): void;
  retire(reason: BridgeRetireReason): void;
  /** Retires with "context-invalidated" when the context is lost; returns whether it was. */
  retireIfContextLost(error?: unknown): boolean;
}

type LifecyclePort = {
  onDisconnect: { addListener: (fn: () => void) => void };
  disconnect: () => void;
};

const RECONNECT_BASE_DELAY_MS = 250;
const RECONNECT_MAX_DELAY_MS = 30_000;
/** A port that stayed connected this long resets the reconnect backoff. */
const HEALTHY_PORT_LIFETIME_MS = 5_000;

/** Error string the page understands as "retry via the next bridge". */
export function formatBridgeRestartError(detail?: string): string {
  return detail
    ? `${BRIDGE_RESTART_ERROR_CODE}: ${detail}`
    : BRIDGE_RESTART_ERROR_CODE;
}

function createInstanceId(): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === "function") {
    try {
      return cryptoApi.randomUUID();
    } catch {
      // randomUUID is unavailable in insecure contexts
    }
  }
  if (typeof cryptoApi?.getRandomValues === "function") {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getTakeoverInstanceId(event: Event): string | null {
  // `detail` may be unreadable (null) when dispatched from another world.
  const detail = (event as CustomEvent<unknown>).detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    const id = (detail as { instanceId?: unknown }).instanceId;
    return typeof id === "string" ? id : null;
  }
  return null;
}

export function createBridgeLifecycle(): BridgeLifecycle {
  const instanceId = createInstanceId();
  const controller = new AbortController();
  const { signal } = controller;
  const retireCallbacks: BridgeRetireCallback[] = [];

  let retiredReason: BridgeRetireReason | null = null;
  let started = false;
  let dispatchingOwnTakeover = false;
  let port: LifecyclePort | null = null;
  let portConnectedAt = 0;
  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const isAlive = (): boolean => retiredReason === null;

  function announceReady(): void {
    postToPage({ type: TYPE_BRIDGE_READY, instanceId });
  }

  function clearReconnectTimer(): void {
    if (reconnectTimer === null) return;
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  function scheduleReconnect(): void {
    if (!isAlive() || reconnectTimer !== null) return;
    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempts,
      RECONNECT_MAX_DELAY_MS,
    );
    reconnectAttempts += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connectLifecyclePort();
    }, delay);
  }

  function handlePortDisconnect(disconnected: LifecyclePort): void {
    // Always read lastError so Chromium doesn't log "Unchecked runtime.lastError".
    const lastError = lastErrorMessage();
    if (port !== disconnected) return;
    port = null;
    if (!isAlive() || retireIfContextLost()) return;

    // Context still valid: the service worker restarted (or the page left
    // bfcache). Re-establish the port with a small backoff.
    if (Date.now() - portConnectedAt >= HEALTHY_PORT_LIFETIME_MS) {
      reconnectAttempts = 0;
    }
    debug.log("[VOT EXT][bridge] lifecycle port disconnected, reconnecting", {
      instanceId,
      lastError,
      attempt: reconnectAttempts,
    });
    scheduleReconnect();
  }

  function connectLifecyclePort(): void {
    if (!isAlive() || port || retireIfContextLost()) return;

    let connected: unknown;
    try {
      connected = ext?.runtime?.connect?.({ name: LIFECYCLE_PORT_NAME });
    } catch (error) {
      if (retireIfContextLost(error)) return;
      debug.warn("[VOT EXT][bridge] lifecycle port connect failed", error);
      scheduleReconnect();
      return;
    }

    if (!connected || typeof connected !== "object") {
      debug.warn("[VOT EXT][bridge] lifecycle port is not available");
      return;
    }

    const next = connected as LifecyclePort;
    port = next;
    portConnectedAt = Date.now();
    next.onDisconnect.addListener(() => handlePortDisconnect(next));
  }

  function handleTakeover(event: Event): void {
    if (dispatchingOwnTakeover || !isAlive()) return;
    const otherId = getTakeoverInstanceId(event);
    if (otherId === instanceId) return;
    debug.log("[VOT EXT][bridge] taken over by a newer bridge", {
      instanceId,
      by: otherId,
    });
    retire("takeover");
  }

  function handlePing(event: MessageEvent): void {
    if (!isAlive() || !isSameWindowBridgeEvent(event)) return;
    const data: unknown = event.data;
    if (!isOurMessage(data)) return;
    if (data.type !== TYPE_BRIDGE_PING) return;

    // An orphan may be pinged before its lifecycle port notices.
    if (retireIfContextLost()) return;
    announceReady();
  }

  function retire(reason: BridgeRetireReason): void {
    if (!isAlive()) return;
    retiredReason = reason;

    clearReconnectTimer();
    controller.abort(reason);

    const currentPort = port;
    port = null;
    if (currentPort) {
      try {
        currentPort.disconnect();
      } catch {
        // ignore: the port is already dead in an invalidated context
      }
    }

    try {
      postToPage({ type: TYPE_BRIDGE_DOWN, instanceId, reason });
    } catch (error) {
      debug.warn("[VOT EXT][bridge] failed to announce DOWN", error);
    }

    for (const cb of retireCallbacks.splice(0)) {
      notifyRetired(cb, reason);
    }
  }

  function retireIfContextLost(error?: unknown): boolean {
    if (!isContextInvalidatedError(error)) return false;
    retire("context-invalidated");
    return true;
  }

  function notifyRetired(
    cb: BridgeRetireCallback,
    reason: BridgeRetireReason,
  ): void {
    try {
      cb(reason);
    } catch (error) {
      debug.warn("[VOT EXT][bridge] onRetire callback failed", error);
    }
  }

  function onRetire(cb: BridgeRetireCallback): void {
    if (typeof cb !== "function") return;
    if (retiredReason !== null) {
      notifyRetired(cb, retiredReason);
      return;
    }
    retireCallbacks.push(cb);
  }

  function start(): void {
    if (started || !isAlive()) return;
    started = true;
    if (retireIfContextLost()) return;

    const doc = globalThis.document;
    doc?.addEventListener(BRIDGE_TAKEOVER_EVENT, handleTakeover, { signal });
    globalThis.addEventListener("message", handlePing, { signal });

    // Retire bridges orphaned by a previous extension context in this frame.
    dispatchingOwnTakeover = true;
    try {
      doc?.dispatchEvent(
        new CustomEvent(BRIDGE_TAKEOVER_EVENT, { detail: { instanceId } }),
      );
    } finally {
      dispatchingOwnTakeover = false;
    }

    connectLifecyclePort();
    if (isAlive()) announceReady();
  }

  return {
    instanceId,
    signal,
    isAlive,
    onRetire,
    start,
    retire,
    retireIfContextLost,
  };
}
