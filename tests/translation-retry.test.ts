import { describe, expect, test } from "bun:test";
import { createAbortableDelay } from "../src/utils/abort";
import { isAbortError } from "../src/utils/errors";

describe("createAbortableDelay", () => {
  test("resolves after delay", async () => {
    const controller = new AbortController();
    await createAbortableDelay(20, controller.signal);
  });

  test("rejects when signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    let caught: unknown;
    try {
      await createAbortableDelay(20, controller.signal);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeDefined();
    expect(isAbortError(caught)).toBe(true);
  });

  test("rejects when signal aborts before delay elapses", async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10);

    let caught: unknown;
    try {
      await createAbortableDelay(5000, controller.signal);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeDefined();
    expect(isAbortError(caught)).toBe(true);
  });

  test("onScheduled receives a real timeout ID", async () => {
    const controller = new AbortController();
    let receivedId: ReturnType<typeof setTimeout> | undefined;

    await createAbortableDelay(10, controller.signal, {
      onScheduled: (id) => {
        receivedId = id;
      },
    });

    expect(receivedId).toBeDefined();
  });
});

describe("scheduleRetry disable→re-enable scenario", () => {
  test("retry fn called after delay (happy path)", async () => {
    const controller = new AbortController();
    let fnCalled = false;

    await createAbortableDelay(20, controller.signal);
    fnCalled = true;

    expect(fnCalled).toBe(true);
  });

  test("disable then re-enable: retry works with fresh signal", async () => {
    let attempts = 0;

    async function simulateScheduleRetry(
      signal: AbortSignal,
    ): Promise<"done" | "aborted"> {
      attempts++;
      try {
        await createAbortableDelay(20, signal);
        return "done";
      } catch (e) {
        if (isAbortError(e)) return "aborted";
        throw e;
      }
    }

    // Attempt 1: user disables → abort
    const controller1 = new AbortController();
    const p1 = simulateScheduleRetry(controller1.signal);
    controller1.abort();
    expect(await p1).toBe("aborted");

    // Attempt 2: user re-enables → new controller → works
    const controller2 = new AbortController();
    expect(await simulateScheduleRetry(controller2.signal)).toBe("done");
    expect(attempts).toBe(2);
  });

  test("clearTimeout via onScheduled stops the retry", async () => {
    const controller = new AbortController();
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const p = createAbortableDelay(5000, controller.signal, {
      onScheduled: (id) => {
        timerId = id;
      },
    });

    // Simulate stopTranslate clearing the timer
    expect(timerId).toBeDefined();
    clearTimeout(timerId!);

    // The delay never resolves; abort to avoid hanging the test
    controller.abort();

    let caught: unknown;
    try {
      await p;
    } catch (e) {
      caught = e;
    }
    expect(isAbortError(caught)).toBe(true);
  });
});
