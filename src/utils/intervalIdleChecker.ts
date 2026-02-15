export type IntervalIdleMode = "active" | "idle" | "hidden";

export type IntervalIdleTickSource = "start" | "interval" | "immediate";

export type IntervalIdleTickContext = {
  nowMs: number;
  mode: IntervalIdleMode;
  source: IntervalIdleTickSource;
};

export type IntervalIdleProfile = {
  activeIntervalMs: number;
  idleIntervalMs: number;
  hiddenIntervalMs: number;
  idleAfterMs: number;
};

type IntervalIdleSubscriber = (ctx: IntervalIdleTickContext) => void;

type IntervalIdleRuntime = {
  nowMs: () => number;
  setInterval: typeof setInterval;
  clearInterval: typeof clearInterval;
  queueMicrotask: (fn: () => void) => void;
  isDocumentHidden: () => boolean;
};

type IntervalIdleCheckerOptions = {
  profile?: Partial<IntervalIdleProfile>;
  runtime?: Partial<IntervalIdleRuntime>;
};

const DEFAULT_PROFILE: IntervalIdleProfile = {
  activeIntervalMs: 16,
  idleIntervalMs: 120,
  hiddenIntervalMs: 250,
  idleAfterMs: 180,
};

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
      if (typeof queueMicrotask === "function") {
        queueMicrotask(fn);
        return;
      }
      Promise.resolve().then(fn);
    },
    isDocumentHidden: () =>
      typeof document !== "undefined" && typeof document.hidden === "boolean"
        ? document.hidden
        : false,
  };
}

export class IntervalIdleChecker {
  private readonly profile: IntervalIdleProfile;
  private readonly runtime: IntervalIdleRuntime;
  private readonly subscribers = new Set<IntervalIdleSubscriber>();

  private timerId: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private destroyed = false;
  private immediateQueued = false;
  private currentMode: IntervalIdleMode = "active";
  private lastActivityAt: number;

  constructor(options: IntervalIdleCheckerOptions = {}) {
    this.profile = {
      ...DEFAULT_PROFILE,
      ...options.profile,
    };
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
    this.runTick("start");
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.clearTimer();
    this.immediateQueued = false;
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
    if (nextMode !== this.currentMode) {
      this.currentMode = nextMode;
      this.restartTimer(nextMode);
    }
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
    if (this.runtime.isDocumentHidden()) {
      return "hidden";
    }
    const inactiveFor = nowMs - this.lastActivityAt;
    return inactiveFor >= this.profile.idleAfterMs ? "idle" : "active";
  }

  private intervalForMode(mode: IntervalIdleMode): number {
    if (mode === "hidden") return this.profile.hiddenIntervalMs;
    if (mode === "idle") return this.profile.idleIntervalMs;
    return this.profile.activeIntervalMs;
  }

  private clearTimer(): void {
    if (this.timerId === null) return;
    this.runtime.clearInterval(this.timerId);
    this.timerId = null;
  }

  private restartTimer(mode: IntervalIdleMode): void {
    this.clearTimer();
    const intervalMs = Math.max(1, this.intervalForMode(mode));
    this.timerId = this.runtime.setInterval(() => {
      this.runTick("interval");
    }, intervalMs);
  }

  private runTick(source: IntervalIdleTickSource): void {
    const nowMs = this.runtime.nowMs();
    const nextMode = this.resolveMode(nowMs);
    if (nextMode !== this.currentMode || this.timerId === null) {
      this.currentMode = nextMode;
      this.restartTimer(nextMode);
    }

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
}

export function createIntervalIdleChecker(
  profile?: Partial<IntervalIdleProfile>,
): IntervalIdleChecker {
  return new IntervalIdleChecker({ profile });
}
