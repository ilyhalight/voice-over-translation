type GainBackedPlayer = {
  volume: number;
  gainNode?: GainNode;
};

function normalizeMediaElementVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 0;
  return Math.max(0, Math.min(1, volume));
}

function normalizeGainVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 0;
  return Math.max(0, volume);
}

function setAudioParamInstant(
  param: AudioParam,
  value: number,
  context: BaseAudioContext | undefined,
): void {
  const now = context?.currentTime;
  const hasNow = typeof now === "number" && Number.isFinite(now);

  if (hasNow) {
    try {
      if (typeof param.cancelAndHoldAtTime === "function") {
        param.cancelAndHoldAtTime(now);
      } else if (typeof param.cancelScheduledValues === "function") {
        param.cancelScheduledValues(now);
      }
    } catch {
      // Some engines reject canceling when no automation exists yet.
    }

    if (typeof param.setValueAtTime === "function") {
      param.setValueAtTime(value, now);
      return;
    }
  }

  param.value = value;
}

// #1650
export function safeSetPlayerVolume(
  player: GainBackedPlayer,
  volume: number,
): void {
  const gainNode = player.gainNode;
  if (gainNode?.gain) {
    setAudioParamInstant(
      gainNode.gain,
      normalizeGainVolume(volume),
      gainNode.context,
    );
    return;
  }

  player.volume = normalizeMediaElementVolume(volume);
}

export function applyTranslationPlaybackVolume(
  player: { volume: number; gainNode?: GainNode } | undefined,
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
