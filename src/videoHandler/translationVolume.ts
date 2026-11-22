import { clamp } from "../utils/number";

type MediaElementLike = {
  volume: number;
  muted?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
};

type GainBackedPlayer = {
  volume: number;
  gainNode?: GainNode;
  audio?: MediaElementLike;
  audioElement?: MediaElementLike;
};

const guardedMediaElements = new WeakSet<object>();

// Infinity must not reach AudioParam (TypeError) or saturate to max volume.
function normalizeMediaElementVolume(volume: number): number {
  return clamp(Number.isFinite(volume) ? volume : 0, 0, 1);
}

function normalizeGainVolume(volume: number): number {
  return clamp(Number.isFinite(volume) ? volume : 0, 0, Infinity);
}

function setAudioParamInstant(
  param: AudioParam,
  value: number,
  context: BaseAudioContext | undefined,
): void {
  const now = context?.currentTime;
  const hasNow = typeof now === "number" && Number.isFinite(now);

  try {
    if (typeof param.cancelScheduledValues === "function") {
      param.cancelScheduledValues(0);
    } else if (hasNow && typeof param.cancelAndHoldAtTime === "function") {
      param.cancelAndHoldAtTime(now);
    }
  } catch {
    // Some engines reject canceling when no automation exists yet.
  }

  param.value = value;

  if (hasNow && typeof param.setValueAtTime === "function") {
    try {
      param.setValueAtTime(value, now);
    } catch {
      // Intrinsic param.value is already updated above.
    }
  }
}

/**
 * Keeps the underlying media element at unity gain while a GainNode drives
 * translation volume. Third-party volume-control extensions often hook
 * `HTMLMediaElement.prototype.volume` and mirror the video's volume onto the
 * hidden translation `<audio>`, causing double attenuation (`video * gain`).
 */
function ensureUnityMediaVolumeGuard(
  player: GainBackedPlayer,
  media: MediaElementLike,
): void {
  if (
    guardedMediaElements.has(media) ||
    typeof media.addEventListener !== "function"
  ) {
    return;
  }

  guardedMediaElements.add(media);

  let restoring = false;
  let burstStartMs = 0;
  let burstCount = 0;
  const BURST_WINDOW_MS = 100;
  const MAX_RESTORES_PER_WINDOW = 60;

  media.addEventListener("volumechange", () => {
    if (restoring || !player.gainNode?.gain || media.volume === 1) {
      return;
    }

    const now = Date.now();
    if (now - burstStartMs > BURST_WINDOW_MS) {
      burstStartMs = now;
      burstCount = 0;
    }
    if (burstCount >= MAX_RESTORES_PER_WINDOW) {
      return;
    }

    burstCount += 1;
    restoring = true;
    try {
      media.volume = 1;
    } finally {
      restoring = false;
    }
  });
}

// #1650
export function safeSetPlayerVolume(
  player: GainBackedPlayer,
  volume: number,
): void {
  const gainNode = player.gainNode;
  if (gainNode?.gain) {
    const normalizedGain = normalizeGainVolume(volume);
    setAudioParamInstant(gainNode.gain, normalizedGain, gainNode.context);
    if ("storedVolume" in player) {
      (player as GainBackedPlayer & { storedVolume?: number }).storedVolume =
        normalizedGain;
    }
    const media = player.audio ?? player.audioElement;
    if (media) {
      ensureUnityMediaVolumeGuard(player, media);
      if ("muted" in media) {
        media.muted = normalizedGain === 0;
      }
      if (media.volume !== 1) {
        media.volume = 1;
      }
    }
    return;
  }

  const normalizedVolume = normalizeMediaElementVolume(volume);
  player.volume = normalizedVolume;
  const media = player.audio ?? player.audioElement;
  if (media && "muted" in media) {
    media.muted = normalizedVolume === 0;
  }
}

export function applyTranslationPlaybackVolume(
  player: GainBackedPlayer | undefined,
  volumePercent: number | undefined,
  fallbackVolumePercent: number | undefined,
): void {
  const nextVolume =
    typeof volumePercent === "number" && Number.isFinite(volumePercent)
      ? volumePercent
      : fallbackVolumePercent;

  if (
    !player ||
    typeof nextVolume !== "number" ||
    !Number.isFinite(nextVolume)
  ) {
    return;
  }

  safeSetPlayerVolume(player, nextVolume / 100);
}
