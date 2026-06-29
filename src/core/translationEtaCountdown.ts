import { localizationProvider } from "../localization/localizationProvider";
import { formatTranslationEta } from "../utils/timeFormatting";
import VOTLocalizedError from "../utils/VOTLocalizedError";

type TimeoutId = ReturnType<typeof setTimeout>;

type TranslationEtaCountdownMessage = string | VOTLocalizedError;

type TranslationEtaCountdownUpdateOptions = {
  /**
   * Countdown ticks are local UI refreshes, not fresh server responses, so they
   * must not affect the repeated-long-wait detector.
   */
  countLongWait?: boolean;
};

type TranslationEtaCountdownUpdate = (
  message: TranslationEtaCountdownMessage,
  signal: AbortSignal,
  options?: TranslationEtaCountdownUpdateOptions,
) => void | Promise<void>;

type TranslationEtaCountdownSyncOptions = {
  /**
   * The first render after `sync()` corresponds to a fresh backend response.
   * Later renders are local ticks and always disable long-wait counting.
   */
  countLongWaitOnFirstRender?: boolean;
};

const COUNTDOWN_TICK_MS = 1_000;

function normalizeRemainingTime(remainingTimeSeconds: number): number {
  if (!Number.isFinite(remainingTimeSeconds)) {
    return 0;
  }

  return Math.max(0, Math.ceil(remainingTimeSeconds));
}

function createEtaMessage(
  remainingSeconds: number,
): TranslationEtaCountdownMessage {
  if (remainingSeconds <= 0) {
    return new VOTLocalizedError("TranslationDelayed");
  }

  return formatTranslationEta(remainingSeconds, (key) =>
    localizationProvider.get(key),
  );
}

function getMessageIdentity(message: TranslationEtaCountdownMessage): string {
  return message instanceof VOTLocalizedError
    ? `${message.name}:${message.unlocalizedMessage}`
    : message;
}

/**
 * Keeps the visible translation ETA moving between polling requests.
 *
 * Server responses still remain the source of truth: every call to `sync()`
 * recalculates the deadline from the latest `remainingTime`. Timer ticks only
 * render the local wall-clock countdown to avoid stale UI while the next poll is
 * still waiting.
 */
export class TranslationEtaCountdown {
  private deadlineMs = 0;
  private generation = 0;
  private lastMessageIdentity: string | null = null;
  private signal?: AbortSignal;
  private timeoutId?: TimeoutId;

  constructor(private readonly updateMessage: TranslationEtaCountdownUpdate) {}

  async sync(
    remainingTimeSeconds: number,
    signal: AbortSignal,
    options: TranslationEtaCountdownSyncOptions = {},
  ): Promise<void> {
    this.stop();

    const remainingSeconds = normalizeRemainingTime(remainingTimeSeconds);
    if (remainingSeconds <= 0 || signal.aborted) {
      return;
    }

    const generation = ++this.generation;
    this.deadlineMs = Date.now() + remainingSeconds * 1000;
    this.signal = signal;

    await this.tick(generation, Boolean(options.countLongWaitOnFirstRender));
  }

  stop(): void {
    this.generation += 1;
    this.deadlineMs = 0;
    this.lastMessageIdentity = null;
    this.signal = undefined;

    if (this.timeoutId !== undefined) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }

  private async tick(generation: number, countLongWait = false): Promise<void> {
    if (generation !== this.generation) {
      return;
    }

    const signal = this.signal;
    if (!signal || signal.aborted) {
      this.stop();
      return;
    }

    const remainingSeconds = Math.max(
      0,
      Math.ceil((this.deadlineMs - Date.now()) / 1000),
    );
    const message = createEtaMessage(remainingSeconds);
    const messageIdentity = getMessageIdentity(message);

    if (messageIdentity !== this.lastMessageIdentity) {
      this.lastMessageIdentity = messageIdentity;
      await this.updateMessage(message, signal, { countLongWait });
    }

    if (generation !== this.generation || signal.aborted) {
      return;
    }

    if (remainingSeconds <= 0) {
      this.timeoutId = undefined;
      return;
    }

    this.timeoutId = setTimeout(() => {
      void this.tick(generation);
    }, COUNTDOWN_TICK_MS);
  }
}
