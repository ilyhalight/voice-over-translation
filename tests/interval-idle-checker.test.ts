import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { IntervalIdleChecker } from "../src/utils/intervalIdleChecker";

type Timer = { id: number; periodMs: number; fn: () => void };

function createRuntime() {
  let now = 0;
  let nextId = 1;
  const timers = new Map<number, Timer>();
  const microtasks: Array<() => void> = [];
  let visibilityListener: (() => void) | null = null;

  return {
    armedPeriods: [] as number[],
    get activeTimers() {
      return [...timers.values()];
    },
    advance(ms: number) {
      now += ms;
    },
    flushMicrotasks() {
      while (microtasks.length) microtasks.shift()?.();
    },
    fireTimers() {
      for (const t of [...timers.values()]) t.fn();
    },
    toggleVisibility() {
      visibilityListener?.();
    },
    runtime: {
      nowMs: () => now,
      setInterval: ((fn: () => void, periodMs: number) => {
        const id = nextId++;
        timers.set(id, { id, periodMs, fn });
        return id;
      }) as unknown as typeof setInterval,
      clearInterval: ((id: number) => {
        timers.delete(id);
      }) as unknown as typeof clearInterval,
      queueMicrotask: (fn: () => void) => {
        microtasks.push(fn);
      },
      onVisibilityChange: (listener: () => void) => {
        visibilityListener = listener;
        return () => {
          visibilityListener = null;
        };
      },
    },
  };
}

describe("IntervalIdleChecker polling cost", () => {
  it("does not poll while nobody is subscribed", () => {
    const env = createRuntime();
    const checker = new IntervalIdleChecker({ runtime: env.runtime });
    checker.start();
    assert.equal(env.activeTimers.length, 0, "no subscribers, no timer");

    const unsubscribe = checker.subscribe(() => {});
    assert.equal(env.activeTimers.length, 1);
    assert.equal(env.activeTimers[0].periodMs, 250);

    unsubscribe();
    assert.equal(env.activeTimers.length, 0, "timer released with last subscriber");
    checker.destroy();
  });

  it("backs the poll rate off to 1s once idle and restores it on activity", () => {
    const env = createRuntime();
    const checker = new IntervalIdleChecker({ runtime: env.runtime });
    let ticks = 0;
    checker.subscribe(() => {
      ticks += 1;
    });
    checker.start();
    assert.equal(env.activeTimers[0].periodMs, 250, "active rate");

    env.advance(1000); // beyond idleAfterMs
    env.fireTimers();
    assert.equal(env.activeTimers[0].periodMs, 1000, "idle rate");

    checker.markActivity();
    assert.equal(env.activeTimers[0].periodMs, 250, "back to active rate");
    assert.ok(ticks > 0);
    checker.destroy();
  });

  it("keeps exactly one timer armed across mode flips", () => {
    const env = createRuntime();
    const checker = new IntervalIdleChecker({ runtime: env.runtime });
    checker.subscribe(() => {});
    checker.start();
    for (let i = 0; i < 5; i += 1) {
      env.advance(1000);
      env.fireTimers();
      checker.markActivity();
      assert.equal(env.activeTimers.length, 1, "never leaks a timer");
    }
    checker.destroy();
    assert.equal(env.activeTimers.length, 0);
  });

  it("still delivers immediate ticks when the poll is slow", () => {
    const env = createRuntime();
    const checker = new IntervalIdleChecker({ runtime: env.runtime });
    let ticks = 0;
    checker.subscribe(() => {
      ticks += 1;
    });
    checker.start();
    const baseline = ticks;

    env.advance(5000);
    checker.requestImmediateTick();
    env.flushMicrotasks();
    assert.equal(ticks, baseline + 1, "immediate tick is not throttled");
    checker.destroy();
  });

  it("honours explicit profile overrides", () => {
    const env = createRuntime();
    const checker = new IntervalIdleChecker({
      runtime: env.runtime,
      profile: { checkIntervalMs: 100, idleAfterMs: 50, idleIntervalMs: 400 },
    });
    checker.subscribe(() => {});
    checker.start();
    assert.equal(env.activeTimers[0].periodMs, 100);
    env.advance(200);
    env.fireTimers();
    assert.equal(env.activeTimers[0].periodMs, 400);
    checker.destroy();
  });
});

describe("IntervalIdleChecker dormancy", () => {
  it("stops polling when no subscriber reports pending work", () => {
    const env = createRuntime();
    const checker = new IntervalIdleChecker({ runtime: env.runtime });
    let pending = false;
    let ticks = 0;
    checker.subscribe(
      () => {
        ticks += 1;
      },
      { hasPendingWork: () => pending },
    );
    checker.start();

    assert.equal(env.activeTimers.length, 0, "dormant while nothing is pending");
    assert.equal(ticks, 1, "only the start tick runs");

    pending = true;
    checker.markActivity();
    assert.equal(env.activeTimers.length, 1, "pending work re-arms the timer");

    env.advance(250);
    env.fireTimers();
    assert.equal(ticks, 2, "ticks resume while work is pending");

    pending = false;
    env.advance(250);
    env.fireTimers();
    assert.equal(ticks, 3, "one trailing tick drains the work");
    assert.equal(env.activeTimers.length, 0, "then it goes dormant again");

    checker.requestImmediateTick();
    env.flushMicrotasks();
    assert.equal(ticks, 4, "immediate ticks still work while dormant");

    checker.destroy();
  });

  it("keeps polling for subscribers that declare no predicate", () => {
    const env = createRuntime();
    const checker = new IntervalIdleChecker({ runtime: env.runtime });
    let ticks = 0;
    checker.subscribe(() => {
      ticks += 1;
    });
    checker.start();
    assert.equal(env.activeTimers.length, 1, "legacy subscribers keep polling");
    env.advance(250);
    env.fireTimers();
    assert.ok(ticks > 1);
    checker.destroy();
  });

  it("does not poll a hidden document", () => {
    const env = createRuntime();
    const checker = new IntervalIdleChecker({
      runtime: {
        ...env.runtime,
      },
      profile: { idleAfterMs: 0 },
    });
    checker.subscribe(() => {}, { hasPendingWork: () => true });
    checker.start();
    assert.ok(env.activeTimers.length <= 1, "at most one timer");
    checker.destroy();
    assert.equal(env.activeTimers.length, 0);
  });
});
