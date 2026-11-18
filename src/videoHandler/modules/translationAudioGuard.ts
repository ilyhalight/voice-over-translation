import debug from "../../utils/debug";

const HAVE_FUTURE_DATA = 3;
const BASE_CHECK_INTERVAL_MS = 1000;
const MAX_BACKOFF_STEPS = 4;

type GuardedMedia = Pick<HTMLMediaElement, "paused" | "ended" | "duration">;

type GuardedPlayer = {
  audio?: GuardedMedia;
  audioElement?: GuardedMedia;
  lipSync(mode: "playing"): unknown;
};

type GuardedAudioContext = {
  state: string;
  resume(): Promise<void>;
};

export type TranslationAudioGuardHost = {
  video: Pick<
    HTMLVideoElement,
    "paused" | "ended" | "readyState" | "currentTime"
  >;
  hasActiveSource(): boolean;
  audioPlayer?: {
    audioContext?: GuardedAudioContext;
    player?: GuardedPlayer;
  };
};

export type TranslationAudioRecovery =
  | "not-needed"
  | "resuming-context"
  | "resynced";

export type TranslationAudioGuard = {
  tick(): void;
  force(): void;
};

function getAudibleTranslation(
  host: TranslationAudioGuardHost,
): { player: GuardedPlayer; media: GuardedMedia } | undefined {
  const { video } = host;
  if (
    !host.hasActiveSource() ||
    video.paused ||
    video.ended ||
    video.readyState < HAVE_FUTURE_DATA
  ) {
    return undefined;
  }

  const player = host.audioPlayer?.player;
  const media = player?.audio ?? player?.audioElement;
  if (!player || !media || media.ended) {
    return undefined;
  }
  if (Number.isFinite(media.duration) && video.currentTime >= media.duration) {
    return undefined;
  }

  return { player, media };
}

function resyncPausedTranslation(host: TranslationAudioGuardHost): boolean {
  const translation = getAudibleTranslation(host);
  if (!translation?.media.paused) {
    return false;
  }

  debug.log("[translationAudioGuard] translation audio is paused, resyncing");
  try {
    translation.player.lipSync("playing");
  } catch (error) {
    debug.log("[translationAudioGuard] resync failed", error);
  }
  return true;
}

const pendingResumeStates = new WeakMap<GuardedAudioContext, string>();

/**
 * Asks the context to resume without stacking requests: a resume blocked by
 * the autoplay policy stays pending, so it is repeated only when the context
 * state has changed since or when a user gesture can unblock it.
 */
function resumeContext(
  host: TranslationAudioGuardHost,
  context: GuardedAudioContext,
  fromUserGesture: boolean,
): void {
  const pendingState = pendingResumeStates.get(context);
  const isPending = pendingState !== undefined;
  if (isPending && pendingState === context.state && !fromUserGesture) {
    return;
  }

  debug.log(
    `[translationAudioGuard] AudioContext is ${context.state}, resuming`,
  );
  const logFailure = (error: unknown) => {
    debug.log("[translationAudioGuard] AudioContext resume failed", error);
  };
  pendingResumeStates.set(context, context.state);
  const resumed = context.resume();
  if (isPending) {
    resumed.catch(logFailure);
    return;
  }

  resumed.then(
    () => {
      pendingResumeStates.delete(context);
      resyncPausedTranslation(host);
    },
    (error: unknown) => {
      pendingResumeStates.delete(context);
      logFailure(error);
    },
  );
}

/**
 * Restores translation audio that stopped while the video keeps playing.
 *
 * iOS Safari pauses other media elements and interrupts the AudioContext on
 * its own (rotation, fullscreen, the video restarting playback) without any
 * event on the video, so the lip sync driven by video events never resumes it.
 */
export function recoverStalledTranslationAudio(
  host: TranslationAudioGuardHost,
  fromUserGesture = false,
): TranslationAudioRecovery {
  if (!getAudibleTranslation(host)) {
    return "not-needed";
  }

  const context = host.audioPlayer?.audioContext;
  if (context && context.state !== "running" && context.state !== "closed") {
    resumeContext(host, context, fromUserGesture);
    return "resuming-context";
  }

  return resyncPausedTranslation(host) ? "resynced" : "not-needed";
}

/**
 * Creates a throttled watchdog around {@link recoverStalledTranslationAudio}.
 * `tick` is meant for frequent video events, `force` for user gestures.
 */
export function createTranslationAudioGuard(
  host: TranslationAudioGuardHost,
  now: () => number = Date.now,
): TranslationAudioGuard {
  let nextCheckAt = 0;
  let consecutiveRecoveries = 0;

  const run = (fromUserGesture: boolean) => {
    const result = recoverStalledTranslationAudio(host, fromUserGesture);
    if (result === "not-needed") {
      consecutiveRecoveries = 0;
      nextCheckAt = now() + BASE_CHECK_INTERVAL_MS;
      return;
    }

    const backoffStep = Math.min(consecutiveRecoveries, MAX_BACKOFF_STEPS);
    consecutiveRecoveries += 1;
    nextCheckAt = now() + BASE_CHECK_INTERVAL_MS * 2 ** backoffStep;
  };

  return {
    tick() {
      if (now() < nextCheckAt) return;
      run(false);
    },
    force() {
      consecutiveRecoveries = 0;
      run(true);
    },
  };
}
