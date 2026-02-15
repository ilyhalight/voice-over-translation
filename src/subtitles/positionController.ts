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
