import { clamp } from "../utils/number";

type GainBackedPlayer = {
  volume: number;
  gainNode?: GainNode;
  audio?: { volume: number; muted?: boolean };
  audioElement?: { volume: number; muted?: boolean };
};

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
    // Cancel from 0 instead of `now` so coarsened/quantized `currentTime`
    // (e.g. Firefox resistFingerprinting) cannot leave older events active.
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
    // Keep the underlying media element at unity gain so HTMLMediaElement.volume
    // and GainNode.gain do not double-attenuate, and hard-mute at 0%.
    const media = player.audio ?? player.audioElement;
    if (media) {
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
