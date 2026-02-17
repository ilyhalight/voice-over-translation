import { clampInt, clampPercentInt } from "./volume";

export type VolumeLinkState = {
  initialized: boolean;
  lastVideoPercent: number;
  lastTranslationPercent: number;
};

export type VolumeLinkDirection = "translation" | "video";

type ApplyVolumeLinkDeltaInput = {
  state: VolumeLinkState;
  fromType: VolumeLinkDirection;
  newVolume: number;
  currentVideo: number;
  currentTranslation: number;
  translationMin: number;
  translationMax: number;
};

export type ApplyVolumeLinkDeltaResult = {
  nextVideo?: number;
  nextTranslation?: number;
};

export function syncVideoLinkSnapshot(
  state: VolumeLinkState,
  volumePercent: number,
): void {
  const normalized = clampPercentInt(volumePercent);
  state.lastVideoPercent = normalized;
}

export function syncTranslationLinkSnapshot(
  state: VolumeLinkState,
  volumePercent: number,
): void {
  const numeric = Number(volumePercent);
  if (!Number.isFinite(numeric)) {
    return;
  }
  const normalized = Math.max(0, Math.round(numeric));
  state.lastTranslationPercent = normalized;
}

/**
 * Applies delta-based volume linking and mutates `state` in place.
 *
 * Rules:
 * - "video" initiator: translation changes by the same delta as video.
 * - "translation" initiator: video changes by the same delta as translation.
 *
 * This preserves relative offset between sliders (until clamped by bounds),
 * instead of forcing a 1:1 mirror.
 */
export function applyVolumeLinkDelta({
  state,
  fromType,
  newVolume,
  currentVideo,
  currentTranslation,
  translationMin,
  translationMax,
}: ApplyVolumeLinkDeltaInput): ApplyVolumeLinkDeltaResult {
  if (!state.initialized) {
    state.lastVideoPercent = Number(currentVideo);
    state.lastTranslationPercent = Number(currentTranslation);
    state.initialized = true;
  }

  if (fromType === "video") {
    const normalizedVideo = clampPercentInt(newVolume);
    const delta = normalizedVideo - clampPercentInt(state.lastVideoPercent);
    state.lastVideoPercent = normalizedVideo;
    const nextTranslation = clampInt(
      state.lastTranslationPercent + delta,
      translationMin,
      translationMax,
    );
    state.lastTranslationPercent = nextTranslation;
    return { nextTranslation };
  }

  const normalizedTranslation = clampInt(
    Number.isFinite(newVolume) ? newVolume : currentTranslation,
    translationMin,
    translationMax,
  );
  const delta = normalizedTranslation - state.lastTranslationPercent;
  state.lastTranslationPercent = normalizedTranslation;
  const nextVideo = clampPercentInt(state.lastVideoPercent + delta);
  state.lastVideoPercent = nextVideo;

  return { nextVideo };
}
