/** Smart subtitle layout helpers. */

type AnchorBoxLayout = {
  w: number;
  h: number;
};

export type SmartCssMetrics = {
  fontSizePx: number;
  maxWidthPx: number;
};

type SmartLayout = {
  maxLength: number;
};

// Note: character width varies by font and language. We keep this as a
// conservative average for proportional sans fonts.
const EST_CHAR_WIDTH_RATIO = 0.55;

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function targetCharsPerLine(aspect: number): number {
  // Common caption/subtitle guidance uses ~32 chars/line for 4:3 and ~42 for
  // widescreen. Portrait layouts need shorter lines to avoid tall blocks.
  if (aspect < 1) return 28;
  if (aspect < 1.4) return 32;
  return 42;
}

export function computeSmartLayoutForBox(
  anchorBox: AnchorBoxLayout,
  cssMetrics?: SmartCssMetrics | null,
): SmartLayout {
  const w = Math.max(1, anchorBox.w);
  const h = Math.max(1, anchorBox.h);
  const aspect = w / h;

  let computedCPL = targetCharsPerLine(aspect);

  if (cssMetrics) {
    const { fontSizePx, maxWidthPx } = cssMetrics;
    if (
      Number.isFinite(fontSizePx) &&
      Number.isFinite(maxWidthPx) &&
      fontSizePx > 0 &&
      maxWidthPx > 0
    ) {
      const estCharW = fontSizePx * EST_CHAR_WIDTH_RATIO;
      if (estCharW > 0) {
        computedCPL = maxWidthPx / estCharW;
      }
    }
  }

  const maxLength = clamp(Math.round(computedCPL * 2), 50, 180);
  return { maxLength };
}
