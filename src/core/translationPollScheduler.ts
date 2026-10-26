const MIN_POLL_DELAY_MS = 10_000;
const MAX_ETA_POLL_DELAY_MS = 180_000;
const UNKNOWN_ETA_BASE_DELAY_MS = 15_000;
const UNKNOWN_ETA_MAX_DELAY_MS = 90_000;
const UNKNOWN_ETA_BACKOFF_FACTOR = 1.5;
// Polling slightly before the reported ETA absorbs backend underestimation
// without the request storm of fixed short intervals (see research/bench).
const ETA_POLL_FRACTION = 0.8;
const JITTER_RATIO = 0.1;
// Yandex often repeats the same remainingTime for minutes. Once the ETA stops
// moving it carries no information, so we back off 10s -> 15s -> 22.5s -> ...
// up to a cap chosen in bench/translationPoll.bench.ts (requests vs latency).
export const STALE_ETA_BACKOFF_FACTOR = 1.5;
export const STALE_ETA_MAX_DELAY_MS = 60_000;
// ETA counts as progressing only if it dropped by >= this share of the wait.
const ETA_PROGRESS_RATIO = 0.25;

export type TranslationPollDelayInput = {
  retryAttempt: number;
  remainingTimeSeconds: number | null | undefined;
  /** ETA from the previous response (optional, enables stale detection). */
  previousRemainingTimeSeconds?: number | null;
  /** Consecutive responses with a non-progressing ETA (overrides previous*). */
  staleCount?: number;
  /** Override of the stale backoff cap (bench/tests). */
  staleMaxDelayMs?: number;
  random?: () => number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toEtaSeconds(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

export function getTranslationPollDelayMs({
  retryAttempt,
  remainingTimeSeconds,
  previousRemainingTimeSeconds,
  staleCount,
  staleMaxDelayMs = STALE_ETA_MAX_DELAY_MS,
  random = Math.random,
}: TranslationPollDelayInput): number {
  const eta = toEtaSeconds(remainingTimeSeconds);
  // Jitter de-synchronizes many tabs that started waiting at the same moment.
  const jitter = 1 + (random() * 2 - 1) * JITTER_RATIO;

  if (eta <= 0) {
    const baseDelayMs =
      UNKNOWN_ETA_BASE_DELAY_MS *
      UNKNOWN_ETA_BACKOFF_FACTOR ** Math.max(0, retryAttempt);
    return Math.round(
      clamp(baseDelayMs * jitter, MIN_POLL_DELAY_MS, UNKNOWN_ETA_MAX_DELAY_MS),
    );
  }

  const stale = Math.max(
    0,
    staleCount ??
      (toEtaSeconds(previousRemainingTimeSeconds) === eta ? 1 : 0),
  );
  const etaDelayMs = eta * 1000 * ETA_POLL_FRACTION;
  const staleCapMs = Math.max(MIN_POLL_DELAY_MS, staleMaxDelayMs);
  const backoffMs =
    stale > 0
      ? Math.min(staleCapMs, MIN_POLL_DELAY_MS * STALE_ETA_BACKOFF_FACTOR ** stale)
      : 0;

  // Never poll more often than the plain ETA schedule would.
  if (etaDelayMs >= backoffMs) {
    return Math.round(
      clamp(etaDelayMs * jitter, MIN_POLL_DELAY_MS, MAX_ETA_POLL_DELAY_MS),
    );
  }
  return Math.round(clamp(backoffMs * jitter, MIN_POLL_DELAY_MS, staleCapMs));
}

/** True when the ETA did not go up and did not drop plausibly for the wait. */
export function isTranslationEtaStale(
  previousEtaSeconds: number,
  etaSeconds: number,
  elapsedMs: number,
): boolean {
  if (etaSeconds > previousEtaSeconds) return false; // new estimate -> reset
  const droppedSeconds = previousEtaSeconds - etaSeconds;
  return droppedSeconds < Math.max(1, (elapsedMs / 1000) * ETA_PROGRESS_RATIO);
}

export type TranslationPollStateInput = {
  retryAttempt: number;
  remainingTimeSeconds: number | null | undefined;
  status?: unknown;
  random?: () => number;
};

export type TranslationPollState = {
  readonly staleCount: number;
  nextDelayMs(input: TranslationPollStateInput): number;
  reset(): void;
};

export function createTranslationPollState(
  options: { staleMaxDelayMs?: number } = {},
): TranslationPollState {
  let previousEta: number | null = null;
  let previousStatus: unknown;
  let lastDelayMs = 0;
  let staleCount = 0;

  return {
    get staleCount() {
      return staleCount;
    },
    reset() {
      previousEta = null;
      previousStatus = undefined;
      lastDelayMs = 0;
      staleCount = 0;
    },
    nextDelayMs({ retryAttempt, remainingTimeSeconds, status, random }) {
      const eta = toEtaSeconds(remainingTimeSeconds);
      const statusChanged =
        previousStatus !== undefined && status !== previousStatus;
      if (eta <= 0 || previousEta === null || statusChanged) {
        staleCount = 0;
      } else if (isTranslationEtaStale(previousEta, eta, lastDelayMs)) {
        staleCount += 1;
      } else {
        staleCount = 0;
      }
      const delayMs = getTranslationPollDelayMs({
        retryAttempt,
        remainingTimeSeconds,
        staleCount,
        staleMaxDelayMs: options.staleMaxDelayMs,
        random,
      });
      previousEta = eta > 0 ? eta : null;
      previousStatus = status;
      lastDelayMs = delayMs;
      return delayMs;
    },
  };
}
