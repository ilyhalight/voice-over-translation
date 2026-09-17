import { isDocumentHidden } from "./environment";

export type IntervalIdleMode = "active" | "idle" | "hidden";

export type IntervalIdleTickSource = "start" | "interval" | "immediate";

export type IntervalIdleTickContext = {
  nowMs: number;
  mode: IntervalIdleMode;
  source: IntervalIdleTickSource;
};

export type IntervalIdleProfile = {
  /**
   * Polling interval used by the checker loop.
   * Mirrors the fixed `IDLE_CHECK_INTERVAL_MS` approach from `app.js`.
   */
  checkIntervalMs: number;
  /**
   * Inactivity threshold after which mode switches to `"idle"`.
   */
  idleAfterMs: number;
  /**
   * Polling interval while idle. A idle tab-with-video still polled at the
   * active rate before this existed, which is pure background CPU.
   */
  idleIntervalMs: number;
  /**
   * Polling interval while the document is hidden. The loop is stopped
   * entirely on `visibilitychange`; this is only the floor used if a host
   * environment reports hidden without firing the event.
   */
  hiddenIntervalMs: number;
};

type IntervalIdleSubscriber = (ctx: IntervalIdleTickContext) => void;

export type IntervalIdleSubscribeOptions = {
  /**
   * Reports whether this subscriber currently has work that a periodic tick
   * could perform. When every subscriber reports `false`, the checker stops its
   * timer completely instead of waking the main thread forever: a 60 Hz wake
   * loop costs ~1% CPU by itself even when the callback does nothing, and a
   * poll loop is the same problem at lower frequency.
   *
   * Omitting the predicate keeps the old always-poll behavior.
   */
  hasPendingWork?: () => boolean;
};

type IntervalIdleSubscription = {
  fn: IntervalIdleSubscriber;
  hasPendingWork?: () => boolean;
};

type IntervalIdleRuntime = {
  nowMs: () => number;
  setInterval: typeof setInterval;
  clearInterval: typeof clearInterval;
  queueMicrotask: (fn: () => void) => void;
  onVisibilityChange: (listener: () => void) => () => void;
};

type IntervalIdleCheckerOptions = {
  profile?: Partial<IntervalIdleProfile>;
  runtime?: Partial<IntervalIdleRuntime>;
};

const DEFAULT_PROFILE: IntervalIdleProfile = {
  checkIntervalMs: 250,
  idleAfterMs: 180,
  idleIntervalMs: 1000,
  hiddenIntervalMs: 2000,
};

function normalizePositiveMs(
  value: number | undefined,
  fallback: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(1, Math.trunc(value));
}

function normalizeNonNegativeMs(
  value: number | undefined,
  fallback: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.trunc(value));
}

function normalizeProfile(
  profile: Partial<IntervalIdleProfile> = {},
): IntervalIdleProfile {
  return {
    checkIntervalMs: normalizePositiveMs(
      profile.checkIntervalMs,
      DEFAULT_PROFILE.checkIntervalMs,
    ),
    idleAfterMs: normalizeNonNegativeMs(
      profile.idleAfterMs,
      DEFAULT_PROFILE.idleAfterMs,
    ),
    idleIntervalMs: normalizePositiveMs(
      profile.idleIntervalMs,
      Math.max(
        DEFAULT_PROFILE.idleIntervalMs,
        normalizePositiveMs(
          profile.checkIntervalMs,
          DEFAULT_PROFILE.checkIntervalMs,
        ),
      ),
    ),
    hiddenIntervalMs: normalizePositiveMs(
      profile.hiddenIntervalMs,
      Math.max(
        DEFAULT_PROFILE.hiddenIntervalMs,
        normalizePositiveMs(
          profile.checkIntervalMs,
          DEFAULT_PROFILE.checkIntervalMs,
        ),
      ),
    ),
  };
}

function getDefaultRuntime(): IntervalIdleRuntime {
  return {
    nowMs: () =>
      typeof performance !== "undefined" &&
      typeof performance.now === "function"
        ? performance.now()
        : Date.now(),
    setInterval: globalThis.setInterval.bind(globalThis),
    clearInterval: globalThis.clearInterval.bind(globalThis),
    queueMicrotask: (fn) => {
      globalThis.queueMicrotask(fn);
    },
    onVisibilityChange: (listener) => {
      if (
        typeof document === "undefined" ||
        typeof document.addEventListener !== "function"
      ) {
        return () => undefined;
      }

      document.addEventListener("visibilitychange", listener);
      return () => {
        if (typeof document.removeEventListener === "function") {
          document.removeEventListener("visibilitychange", listener);
        }
      };
    },
  };
}

export class IntervalIdleChecker {
  private readonly profile: IntervalIdleProfile;
  private readonly runtime: IntervalIdleRuntime;
  private readonly subscribers = new Set<IntervalIdleSubscription>();

  private intervalId: ReturnType<typeof setInterval> | null = null;
  /** Period the live timer was armed with, so mode changes can re-arm. */
  private armedIntervalMs = 0;
  private unsubscribeVisibilityChange: (() => void) | null = null;
  private running = false;
  private destroyed = false;
  private immediateQueued = false;
  private currentMode: IntervalIdleMode = "active";
  private lastActivityAt: number;

  private readonly onVisibilityChangeHandler = (): void => {
    if (this.destroyed || !this.running) return;

    if (isDocumentHidden()) {
      this.clearIntervalTimer();
    } else {
      this.armInterval();
    }

    this.requestImmediateTick();
  };

  constructor(options: IntervalIdleCheckerOptions = {}) {
    this.profile = normalizeProfile(options.profile);
    this.runtime = {
      ...getDefaultRuntime(),
      ...options.runtime,
    };
    this.lastActivityAt = this.runtime.nowMs();
  }

  start(): void {
    if (this.destroyed || this.running) return;
    this.running = true;
    this.lastActivityAt = this.runtime.nowMs();
    this.subscribeVisibilityChange();
    this.armInterval();
    this.runTick("start");
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.clearIntervalTimer();
    this.immediateQueued = false;
    this.unsubscribeFromVisibilityChange();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.stop();
    this.subscribers.clear();
    this.destroyed = true;
  }

  subscribe(
    fn: IntervalIdleSubscriber,
    options: IntervalIdleSubscribeOptions = {},
  ): () => void {
    if (this.destroyed) {
      return () => undefined;
    }
    const subscription: IntervalIdleSubscription = {
      fn,
      hasPendingWork: options.hasPendingWork,
    };
    this.subscribers.add(subscription);
    if (this.running) this.armInterval();
    return () => {
      this.subscribers.delete(subscription);
      if (this.subscribers.size === 0) this.clearIntervalTimer();
    };
  }

  /**
   * True when at least one subscriber still needs periodic ticks. Subscribers
   * without a predicate always count as pending (backwards compatible).
   */
  private hasPendingWork(): boolean {
    for (const sub of this.subscribers) {
      if (!sub.hasPendingWork) return true;
      try {
        if (sub.hasPendingWork()) return true;
      } catch {
        return true;
      }
    }
    return false;
  }

  markActivity(_source?: string): void {
    if (this.destroyed) return;
    this.lastActivityAt = this.runtime.nowMs();
    if (!this.running) return;

    const nextMode = this.resolveMode(this.lastActivityAt);
    if (nextMode !== this.currentMode) {
      this.currentMode = nextMode;
    }
    // Always re-evaluate: the timer may be dormant because nothing was pending.
    this.armInterval();
  }

  requestImmediateTick(): void {
    if (this.destroyed || !this.running || this.immediateQueued) return;
    this.immediateQueued = true;
    this.runtime.queueMicrotask(() => {
      this.immediateQueued = false;
      if (this.destroyed || !this.running) return;
      this.runTick("immediate");
      this.armInterval();
    });
  }

  private resolveMode(nowMs: number): IntervalIdleMode {
    if (isDocumentHidden()) {
      return "hidden";
    }
    const inactiveFor = nowMs - this.lastActivityAt;
    return inactiveFor >= this.profile.idleAfterMs ? "idle" : "active";
  }

  private clearIntervalTimer(): void {
    if (this.intervalId === null) return;
    this.runtime.clearInterval(this.intervalId);
    this.intervalId = null;
    this.armedIntervalMs = 0;
  }

  /** Poll period for the current mode. */
  private intervalMsForMode(mode: IntervalIdleMode): number {
    if (mode === "hidden") return this.profile.hiddenIntervalMs;
    if (mode === "idle") return this.profile.idleIntervalMs;
    return this.profile.checkIntervalMs;
  }

  private armInterval(): void {
    // Decide first whether a timer should exist at all, then decide its period.
    // Doing it in this order matters: the timer must be torn down even when the
    // period for the current mode is unchanged.
    const shouldPoll =
      this.running &&
      !this.destroyed &&
      this.subscribers.size > 0 &&
      // A hidden document paints nothing, yet every wake still costs CPU.
      // `visibilitychange` re-arms it, and immediate ticks keep working.
      this.currentMode !== "hidden" &&
      // Nothing queued: go fully dormant instead of waking forever.
      this.hasPendingWork();

    if (!shouldPoll) {
      this.clearIntervalTimer();
      return;
    }

    const periodMs = this.intervalMsForMode(this.currentMode);
    if (this.intervalId !== null) {
      if (this.armedIntervalMs === periodMs) return;
      // Mode changed: re-arm at the new period instead of polling at the
      // active rate forever.
      this.runtime.clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.armedIntervalMs = periodMs;
    this.intervalId = this.runtime.setInterval(() => {
      this.runTick("interval");
    }, periodMs);
  }

  private runTick(source: IntervalIdleTickSource): void {
    if (this.destroyed || !this.running) return;
    if (this.subscribers.size === 0) return;

    const nowMs = this.runtime.nowMs();
    const nextMode = this.resolveMode(nowMs);
    if (nextMode !== this.currentMode) {
      this.currentMode = nextMode;
      if (this.running) this.armInterval();
    }

    const ctx: IntervalIdleTickContext = {
      nowMs,
      mode: nextMode,
      source,
    };

    for (const sub of this.subscribers) {
      try {
        sub.fn(ctx);
      } catch {
        // Never allow one subscriber to break the scheduler loop.
      }
    }

    // Work may have drained (stop polling) or appeared (start polling).
    if (this.running) this.armInterval();
  }

  private subscribeVisibilityChange(): void {
    if (this.unsubscribeVisibilityChange !== null) return;
    this.unsubscribeVisibilityChange = this.runtime.onVisibilityChange(
      this.onVisibilityChangeHandler,
    );
  }

  private unsubscribeFromVisibilityChange(): void {
    if (this.unsubscribeVisibilityChange === null) return;
    this.unsubscribeVisibilityChange();
    this.unsubscribeVisibilityChange = null;
  }
}

export function createIntervalIdleChecker(
  profile?: Partial<IntervalIdleProfile>,
): IntervalIdleChecker {
  return new IntervalIdleChecker({ profile });
}
