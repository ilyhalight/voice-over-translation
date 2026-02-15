/**
 * Smart subtitle layout helpers.
 *
 */

export type AnchorBoxLayout = {
  w: number;
  h: number;
};

export type SmartLayout = {
  fontSizePx: number;
  maxWidthPx: number;
  maxLength: number;
};

// Heuristics/constants used by the smart-layout computation.
//
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

/**
 * Caption width budget ("title safe"-like) expressed as a fraction of the
 * video width.
 *
 * This is a *ceiling* — the actual caption width is still derived from the
 * target characters-per-line and computed font size.
 */
function computeGuidelineMaxWidthRatio(aspect: number): number {
  // Caption line-length guidance commonly referenced by accessibility checklists
  // (e.g. BBC-style rules) is often expressed as a percentage of video width.
  //
  // We apply:
  // - ~16:9 and wider: ~68%
  // - ~4:3 and moderate: ~90%
  // - portrait/square: slightly wider to reduce over-wrapping while still
  //   avoiding edge-to-edge captions.
  if (!Number.isFinite(aspect) || aspect <= 0) return 0.9;

  if (aspect >= 1.4) return 0.68;
  if (aspect >= 1.2) return 0.9;
  return 0.92;
}

/**
 * Compute a smart font size in CSS pixels.
 */
function computeSmartFontSizePx(anchorBox: AnchorBoxLayout): number {
  const w = Math.max(1, anchorBox.w);
  const h = Math.max(1, anchorBox.h);
  const aspect = w / h;

  const guidelineMaxWidthRatio = computeGuidelineMaxWidthRatio(aspect);
  const guidelineMaxWidthPx = w * guidelineMaxWidthRatio;

  const targetCPL = targetCharsPerLine(aspect);

  // Baseline sizing: 36px at 1080p (landscape).
  // Scale with height (relative sizing) and flatten growth above 1080p so
  // 4K/5K doesn't become comically large.
  const targetPxAt1080 = 36;
  const baseFontRatioLandscape = targetPxAt1080 / 1080;

  const portraitScale = 0.89;
  const baseFontRatio =
    aspect < 1
      ? baseFontRatioLandscape * portraitScale
      : baseFontRatioLandscape;

  // Keep in the same ballpark as the manual font-size slider.
  const minFontPx = 18;
  const maxFontPx = 50;

  const pivotH = 1080;
  const pivotFont = pivotH * baseFontRatio;
  const flattenExponent = 0.35;

  const heightBasedPx =
    h <= pivotH
      ? h * baseFontRatio
      : pivotFont * (h / pivotH) ** flattenExponent;

  // Width guardrail: ensure the *target* characters-per-line can fit inside the
  // width budget (roughly proportional to font size via EST_CHAR_WIDTH_RATIO).
  const maxByWidthPx = guidelineMaxWidthPx / (targetCPL * EST_CHAR_WIDTH_RATIO);

  const fontSizePx = Math.round(Math.min(heightBasedPx, maxByWidthPx));
  return clamp(fontSizePx, minFontPx, maxFontPx);
}

export function computeSmartLayoutForBox(
  anchorBox: AnchorBoxLayout,
): SmartLayout {
  const w = Math.max(1, anchorBox.w);
  const h = Math.max(1, anchorBox.h);
  const aspect = w / h;

  const fontSizePx = computeSmartFontSizePx(anchorBox);

  const guidelineMaxWidthRatio = computeGuidelineMaxWidthRatio(aspect);
  const guidelineMaxWidthPx = w * guidelineMaxWidthRatio;

  const targetCPL = targetCharsPerLine(aspect);

  // Approximate average character width as a fraction of font size.
  const estCharW = fontSizePx * EST_CHAR_WIDTH_RATIO;
  const targetMaxWidth = targetCPL * estCharW;

  // Minimum width keeps captions from becoming too narrow (causing tall blocks).
  const minWidthPx = w * (aspect < 1 ? 0.8 : 0.55);

  const maxWidthPx = clamp(targetMaxWidth, minWidthPx, guidelineMaxWidthPx);
  const computedCPL = maxWidthPx / estCharW;

  // Set maxLength for the time-based segmentation feature. Bound reasonably.
  const maxLength = clamp(Math.round(computedCPL * 2), 50, 180);

  return {
    fontSizePx,
    maxWidthPx,
    maxLength,
  };
}
