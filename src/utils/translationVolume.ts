// #1650
export function safeSetPlayerVolume(
  player: { volume: number; gainNode?: GainNode },
  volume: number,
): void {
  const gainNode = player.gainNode;
  if (volume > 1 && gainNode?.gain) {
    try {
      player.volume = 1;
      gainNode.gain.value = volume;
      return;
    } catch {}
  }
  try {
    player.volume = volume;
  } catch {
    player.volume = Math.max(0, Math.min(1, volume));
  }
  if (gainNode?.gain && volume <= 1) {
    try {
      gainNode.gain.value = volume;
    } catch {}
  }
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
