export type SmartLayoutBox = {
  w: number;
  h: number;
};

export type SmartCssMetrics = {
  fontSizePx: number;
  maxWidthPx: number;
};

export type SmartLayoutResult = {
  fontSizePx: number;
  maxWidthPx: number | null;
};

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const roundToInt = (value: number): number => Math.round(value);

const resolveAspectBand = (
  aspect: number,
): {
  widthRatio: number;
  charsPerLine: number;
  fontHeightRatio: number;
} => {
  if (aspect < 0.8) {
    return {
      widthRatio: 0.9,
      charsPerLine: 27,
      fontHeightRatio: 0.03,
    };
  }

  if (aspect < 1.1) {
    return {
      widthRatio: 0.84,
      charsPerLine: 31,
      fontHeightRatio: 0.031,
    };
  }

  if (aspect < 1.5) {
    return {
      widthRatio: 0.76,
      charsPerLine: 36,
      fontHeightRatio: 0.033,
    };
  }

  if (aspect < 1.95) {
    return {
      widthRatio: 0.72,
      charsPerLine: 40,
      fontHeightRatio: 0.034,
    };
  }

  return {
    widthRatio: 0.68,
    charsPerLine: 44,
    fontHeightRatio: 0.035,
  };
};

const resolveWidthBoost = (
  width: number,
): {
  extraChars: number;
  widthScale: number;
} => {
  if (width >= 1920) {
    return { extraChars: 4, widthScale: 1.04 };
  }

  if (width >= 1440) {
    return { extraChars: 3, widthScale: 1.03 };
  }

  if (width >= 960) {
    return { extraChars: 2, widthScale: 1.02 };
  }

  if (width >= 640) {
    return { extraChars: 1, widthScale: 1.01 };
  }

  return { extraChars: 0, widthScale: 1 };
};

const estimateAverageGlyphWidth = (fontSizePx: number): number =>
  Math.max(7, fontSizePx * 0.56);

export function computeSmartLayoutForBox(
  box: SmartLayoutBox,
  cssMetrics: SmartCssMetrics | null = null,
): SmartLayoutResult {
  const width = Number.isFinite(box.w) ? Math.max(0, box.w) : 0;
  const height = Number.isFinite(box.h) ? Math.max(0, box.h) : 0;

  if (width <= 0 || height <= 0) {
    return {
      fontSizePx: cssMetrics?.fontSizePx ?? 20,
      maxWidthPx: cssMetrics?.maxWidthPx ?? null,
    };
  }

  const aspect = width / height;
  const { widthRatio, charsPerLine, fontHeightRatio } =
    resolveAspectBand(aspect);
  const { extraChars, widthScale } = resolveWidthBoost(width);

  const derivedFontSizePx = clampNumber(height * fontHeightRatio, 16, 42);
  const fontSizePx = cssMetrics?.fontSizePx ?? derivedFontSizePx;
  const averageGlyphWidth = estimateAverageGlyphWidth(fontSizePx);

  const minWidthPx = width * Math.min(0.92, widthRatio);
  const maxWidthPx = width * clampNumber(widthRatio * widthScale, 0.66, 0.92);
  const preferredCharsPerLine = clampNumber(charsPerLine + extraChars, 25, 48);
  const widthFromChars = preferredCharsPerLine * averageGlyphWidth;
  const resolvedMaxWidthPx = clampNumber(
    widthFromChars,
    minWidthPx,
    maxWidthPx,
  );

  return {
    fontSizePx,
    maxWidthPx: roundToInt(resolvedMaxWidthPx),
  };
}
