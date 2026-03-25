export function clampToRange(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function hasDragThresholdBeenExceeded(
  startClientX: number,
  startClientY: number,
  nextClientX: number,
  nextClientY: number,
  thresholdPx: number,
): boolean {
  const dx = nextClientX - startClientX;
  const dy = nextClientY - startClientY;
  return dx * dx + dy * dy >= thresholdPx * thresholdPx;
}

type AnchorClampInput = {
  anchorX: number;
  anchorY: number;
  elementWidth: number;
  elementHeight: number;
  boxWidth: number;
  boxHeight: number;
  bottomInset: number;
};

type VerticalAnchorBoundsInput = {
  elementHeight: number;
  boxHeight: number;
  bottomInset: number;
};

export type CapturedVerticalAnchorState = {
  offsetFromBaselinePx: number;
  travelPx: number;
};

export function getVerticalAnchorBounds({
  elementHeight,
  boxHeight,
  bottomInset,
}: VerticalAnchorBoundsInput): {
  minAnchorY: number;
  baselineAnchorY: number;
  travelPx: number;
} {
  const minAnchorY = Math.max(0, elementHeight || 0);
  const baselineAnchorY = Math.max(minAnchorY, boxHeight - bottomInset);
  const travelPx = Math.max(0, baselineAnchorY - minAnchorY);
  return { minAnchorY, baselineAnchorY, travelPx };
}

export function captureCustomVerticalAnchorState({
  anchorY,
  elementHeight,
  boxHeight,
  bottomInset,
}: VerticalAnchorBoundsInput & {
  anchorY: number;
}): CapturedVerticalAnchorState {
  const { minAnchorY, baselineAnchorY, travelPx } = getVerticalAnchorBounds({
    elementHeight,
    boxHeight,
    bottomInset,
  });
  const clampedAnchorY = clampToRange(anchorY, minAnchorY, baselineAnchorY);
  return {
    offsetFromBaselinePx: clampedAnchorY - baselineAnchorY,
    travelPx,
  };
}

export function resolveCustomVerticalAnchor({
  state,
  elementHeight,
  boxHeight,
  bottomInset,
}: VerticalAnchorBoundsInput & {
  state: CapturedVerticalAnchorState | null;
}): number {
  const { minAnchorY, baselineAnchorY, travelPx } = getVerticalAnchorBounds({
    elementHeight,
    boxHeight,
    bottomInset,
  });
  if (!state || travelPx <= 0) {
    return baselineAnchorY;
  }

  const storedTravelPx = Math.max(0, state.travelPx || 0);
  const storedLiftPx = Math.max(0, -(state.offsetFromBaselinePx || 0));
  if (storedTravelPx <= 0 || storedLiftPx <= 0) {
    return baselineAnchorY;
  }

  const ratioLiftPx = (storedLiftPx / storedTravelPx) * travelPx;
  // When the box grows (for example entering fullscreen), keep small manual
  // lifts from turning into much larger ones. When the box shrinks, preserve
  // the relative placement instead of forcing a hard pixel clamp.
  const nextLiftPx =
    travelPx >= storedTravelPx
      ? Math.min(storedLiftPx, ratioLiftPx)
      : Math.min(travelPx, ratioLiftPx);

  return clampToRange(
    baselineAnchorY - nextLiftPx,
    minAnchorY,
    baselineAnchorY,
  );
}

export function clampAnchorWithinBox({
  anchorX,
  anchorY,
  elementWidth,
  elementHeight,
  boxWidth,
  boxHeight,
  bottomInset,
}: AnchorClampInput): { anchorX: number; anchorY: number } {
  let nextAnchorX = anchorX;
  let nextAnchorY = anchorY;

  const maxAnchorY = Math.max(0, boxHeight - bottomInset);
  const minAnchorY = elementHeight || 0;

  if (elementWidth) {
    let leftPx = nextAnchorX - elementWidth / 2;
    const maxLeftPx = boxWidth - elementWidth;

    if (maxLeftPx >= 0) {
      leftPx = clampToRange(leftPx, 0, maxLeftPx);
    } else {
      leftPx = maxLeftPx / 2;
    }

    nextAnchorX = leftPx + elementWidth / 2;
  }

  nextAnchorY = clampToRange(nextAnchorY, minAnchorY, maxAnchorY);
  return { anchorX: nextAnchorX, anchorY: nextAnchorY };
}

type SnapAxisInput = {
  current: number;
  candidates: number[];
  thresholdPx: number;
};

export function snapValueToNearestCandidate({
  current,
  candidates,
  thresholdPx,
}: SnapAxisInput): { snapped: boolean; value: number } {
  let closestValue = current;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const distance = Math.abs(candidate - current);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestValue = candidate;
    }
  }

  if (!Number.isFinite(closestDistance) || closestDistance > thresholdPx) {
    return { snapped: false, value: current };
  }

  return { snapped: true, value: closestValue };
}
