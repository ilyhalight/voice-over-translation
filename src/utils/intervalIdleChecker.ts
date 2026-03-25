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
};

type IntervalIdleSubscriber = (ctx: IntervalIdleTickContext) => void;

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
      if (typeof globalThis.queueMicrotask === "function") {
        globalThis.queueMicrotask(fn);
        return;
      }
      Promise.resolve().then(fn);
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
  private readonly subscribers = new Set<IntervalIdleSubscriber>();

  private intervalId: ReturnType<typeof setInterval> | null = null;
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

  subscribe(fn: IntervalIdleSubscriber): () => void {
    if (this.destroyed) {
      return () => undefined;
    }
    this.subscribers.add(fn);
    return () => {
      this.subscribers.delete(fn);
    };
  }

  markActivity(_source?: string): void {
    if (this.destroyed) return;
    this.lastActivityAt = this.runtime.nowMs();
    if (!this.running) return;

    const nextMode = this.resolveMode(this.lastActivityAt);
    if (nextMode !== this.currentMode) this.currentMode = nextMode;
  }

  requestImmediateTick(): void {
    if (this.destroyed || !this.running || this.immediateQueued) return;
    this.immediateQueued = true;
    this.runtime.queueMicrotask(() => {
      this.immediateQueued = false;
      if (this.destroyed || !this.running) return;
      this.runTick("immediate");
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
  }

  private armInterval(): void {
    if (this.intervalId !== null) return;
    this.intervalId = this.runtime.setInterval(() => {
      this.runTick("interval");
    }, this.profile.checkIntervalMs);
  }

  private runTick(source: IntervalIdleTickSource): void {
    if (this.destroyed || !this.running) return;
    if (this.subscribers.size === 0) return;

    const nowMs = this.runtime.nowMs();
    const nextMode = this.resolveMode(nowMs);
    if (nextMode !== this.currentMode) this.currentMode = nextMode;

    const ctx: IntervalIdleTickContext = {
      nowMs,
      mode: nextMode,
      source,
    };

    for (const sub of this.subscribers) {
      try {
        sub(ctx);
      } catch {
        // Never allow one subscriber to break the scheduler loop.
      }
    }
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
