import { describe, expect, test } from "bun:test";
import {
  createTranslationPollState,
  getTranslationPollDelayMs,
  isTranslationEtaStale,
} from "../src/core/translationPollScheduler";

const mid = () => 0.5; // jitter factor = 1

describe("getTranslationPollDelayMs", () => {
  test("keeps the legacy ETA/unknown schedule without new fields", () => {
    expect(getTranslationPollDelayMs({ retryAttempt: 0, remainingTimeSeconds: 100, random: mid })).toBe(80_000);
    expect(getTranslationPollDelayMs({ retryAttempt: 0, remainingTimeSeconds: 5, random: mid })).toBe(10_000);
    expect(getTranslationPollDelayMs({ retryAttempt: 2, remainingTimeSeconds: null, random: mid })).toBe(33_750);
  });

  test("stale ETA backs off exponentially up to the 60s cap", () => {
    const delays = [1, 2, 3, 4, 5, 6].map((staleCount) =>
      getTranslationPollDelayMs({ retryAttempt: staleCount, remainingTimeSeconds: 10, staleCount, random: mid }),
    );
    expect(delays).toEqual([15_000, 22_500, 33_750, 50_625, 60_000, 60_000]);
  });

  test("previousRemainingTimeSeconds equal to the ETA counts as stale", () => {
    expect(
      getTranslationPollDelayMs({ retryAttempt: 1, remainingTimeSeconds: 10, previousRemainingTimeSeconds: 10, random: mid }),
    ).toBe(15_000);
  });

  test("stale backoff never polls more often than the ETA schedule", () => {
    expect(getTranslationPollDelayMs({ retryAttempt: 1, remainingTimeSeconds: 100, staleCount: 1, random: mid })).toBe(80_000);
  });

  test("jitter is deterministic and bounded to ±10%", () => {
    expect(getTranslationPollDelayMs({ retryAttempt: 2, remainingTimeSeconds: 10, staleCount: 2, random: () => 0 })).toBe(20_250);
    expect(getTranslationPollDelayMs({ retryAttempt: 2, remainingTimeSeconds: 10, staleCount: 2, random: () => 1 })).toBe(24_750);
    expect(getTranslationPollDelayMs({ retryAttempt: 9, remainingTimeSeconds: 10, staleCount: 9, random: () => 1 })).toBe(60_000);
  });
});

describe("createTranslationPollState", () => {
  test("backs off on repeated ETA and resets on ETA/status change", () => {
    const state = createTranslationPollState();
    const next = (retryAttempt: number, eta: number, status = 2) =>
      state.nextDelayMs({ retryAttempt, remainingTimeSeconds: eta, status, random: mid });
    expect(next(0, 10)).toBe(10_000);
    expect(next(1, 10)).toBe(15_000);
    expect(next(2, 10)).toBe(22_500);
    expect(state.staleCount).toBe(2);
    expect(next(3, 20)).toBe(16_000); // ETA went up -> fresh estimate
    expect(state.staleCount).toBe(0);
    next(4, 20);
    expect(state.staleCount).toBe(1);
    next(5, 20, 6); // status changed
    expect(state.staleCount).toBe(0);
  });

  test("follows a plausibly decreasing ETA", () => {
    const state = createTranslationPollState();
    expect(state.nextDelayMs({ retryAttempt: 0, remainingTimeSeconds: 100, random: mid })).toBe(80_000);
    expect(state.nextDelayMs({ retryAttempt: 1, remainingTimeSeconds: 20, random: mid })).toBe(16_000);
    expect(state.staleCount).toBe(0);
  });

  test("reset clears stale history for a new translation", () => {
    const state = createTranslationPollState();
    state.nextDelayMs({ retryAttempt: 0, remainingTimeSeconds: 10, random: mid });
    state.nextDelayMs({ retryAttempt: 1, remainingTimeSeconds: 10, random: mid });
    state.reset();
    expect(state.staleCount).toBe(0);
    expect(state.nextDelayMs({ retryAttempt: 0, remainingTimeSeconds: 10, random: mid })).toBe(10_000);
  });

  test("isTranslationEtaStale requires progress proportional to the wait", () => {
    expect(isTranslationEtaStale(60, 60, 10_000)).toBe(true);
    expect(isTranslationEtaStale(60, 59, 20_000)).toBe(true);
    expect(isTranslationEtaStale(60, 45, 20_000)).toBe(false);
    expect(isTranslationEtaStale(60, 90, 20_000)).toBe(false);
  });
});
