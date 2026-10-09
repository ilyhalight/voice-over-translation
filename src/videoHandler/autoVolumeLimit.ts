// Original-volume ceiling and restoration.
export type AutoVolumeLimitHandler = {
  data?: {
    enabledAutoVolume?: boolean;
    autoVolumeMode?: string;
    autoVolume?: number;
  };
  hasActiveSource(): boolean;
  getVideoVolume(): number;
  setVideoVolume(
    value: number,
    options?: { preserveYoutubeVolumeStorage?: boolean },
  ): unknown;
};
const states = new WeakMap<
  AutoVolumeLimitHandler,
  { baseline: number; target: number; mode: string }
>();
const targetOf = (handler: AutoVolumeLimitHandler) => {
  const configured = handler.data?.autoVolume;
  return (
    Math.round(
      Math.max(
        0,
        Math.min(
          100,
          typeof configured === "number" && Number.isFinite(configured)
            ? configured
            : 15,
        ),
      ),
    ) / 100
  );
};

export function stopAutoVolumeLimit(handler: AutoVolumeLimitHandler): boolean {
  const state = states.get(handler);
  if (!state) return false;
  states.delete(handler);
  handler.setVideoVolume(state.baseline, {
    preserveYoutubeVolumeStorage: true,
  });
  return true;
}

export function applyAutoVolumeLimit(handler: AutoVolumeLimitHandler): void {
  const mode = handler.data?.autoVolumeMode;
  if (
    !handler.data?.enabledAutoVolume ||
    !handler.hasActiveSource() ||
    (mode !== "hold" && mode !== "once")
  ) {
    stopAutoVolumeLimit(handler);
    return;
  }
  let state = states.get(handler);
  const target = targetOf(handler);
  if (!state) {
    state = { baseline: handler.getVideoVolume(), target, mode };
    states.set(handler, state);
    handler.setVideoVolume(Math.min(state.baseline, target), {
      preserveYoutubeVolumeStorage: true,
    });
  } else if (state.target !== target || state.mode !== mode) {
    state.target = target;
    state.mode = mode;
    handler.setVideoVolume(Math.min(handler.getVideoVolume(), target), {
      preserveYoutubeVolumeStorage: true,
    });
  }
  if (mode === "hold") enforceAutoVolumeCeiling(handler);
}

export function clampAutoVolumeRequest(
  handler: AutoVolumeLimitHandler,
  requested: number,
): number {
  if (
    !states.has(handler) ||
    !handler.data?.enabledAutoVolume ||
    handler.data.autoVolumeMode !== "hold" ||
    !handler.hasActiveSource()
  )
    return requested;
  return Math.min(requested, targetOf(handler));
}

export function enforceAutoVolumeCeiling(
  handler: AutoVolumeLimitHandler,
): boolean {
  if (
    !states.has(handler) ||
    !handler.data?.enabledAutoVolume ||
    handler.data.autoVolumeMode !== "hold" ||
    !handler.hasActiveSource()
  )
    return false;
  const target = targetOf(handler);
  if (handler.getVideoVolume() <= target + 0.00001) return false;
  handler.setVideoVolume(target, { preserveYoutubeVolumeStorage: true });
  return true;
}
