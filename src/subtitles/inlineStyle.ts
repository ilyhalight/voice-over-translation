import type { SubtitleInlineStyle } from "../types/subtitles";

const SAFE_CSS_COLOR_NAME_RE = /^[a-z]+$/iu;
const SAFE_HEX_COLOR_RE =
  /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/iu;
const SAFE_CSS_FUNCTION_COLOR_RE = /^(?:rgba?|hsla?)\([\d.,%\s/+_-]+\)$/iu;
const SAFE_CLASS_NAME_RE = /^[a-z0-9_-]+$/iu;

/**
 * Bounded memo for color validation. Subtitle tracks reuse a very small set of
 * distinct colors, so a tiny cache removes 3 regex tests per styled token per
 * render without unbounded growth.
 */
const COLOR_CACHE_LIMIT = 256;
const colorCache = new Map<string, string | undefined>();

/**
 * Memo for normalization / css-text derivation keyed by the *style object*.
 *
 * Contract: `SubtitleInlineStyle` values produced by the parsers are treated as
 * immutable (they are created once per token and never mutated). A `WeakMap`
 * keeps the memo tied to the token lifetime, so it cannot leak.
 */
const normalizedCache = new WeakMap<object, SubtitleInlineStyle | undefined>();
const cssTextCache = new WeakMap<object, string>();

const normalizeClassNames = (
  classes: readonly string[] | undefined,
): string[] | undefined => {
  if (!classes?.length) return undefined;

  const normalized = Array.from(
    new Set(
      classes
        .map((value) => value.trim())
        .filter((value) => value && SAFE_CLASS_NAME_RE.test(value)),
    ),
  ).sort((left, right) => left.localeCompare(right));

  return normalized.length ? normalized : undefined;
};

export const normalizeCssColorValue = (value: string): string | undefined => {
  const cached = colorCache.get(value);
  if (cached !== undefined || colorCache.has(value)) return cached;

  const result = computeNormalizedCssColorValue(value);
  if (colorCache.size >= COLOR_CACHE_LIMIT) colorCache.clear();
  colorCache.set(value, result);
  return result;
};

const computeNormalizedCssColorValue = (value: string): string | undefined => {
  const normalized = value.trim();
  if (!normalized) return undefined;

  if (SAFE_HEX_COLOR_RE.test(normalized)) {
    return normalized.toLowerCase();
  }

  if (SAFE_CSS_COLOR_NAME_RE.test(normalized)) {
    return normalized.toLowerCase();
  }

  if (SAFE_CSS_FUNCTION_COLOR_RE.test(normalized)) {
    return normalized;
  }

  return undefined;
};

const computeNormalizedSubtitleInlineStyle = (
  style: Partial<SubtitleInlineStyle>,
): SubtitleInlineStyle | undefined => {
  const normalized: SubtitleInlineStyle = {};
  if (style.italic) normalized.italic = true;
  if (style.bold) normalized.bold = true;
  if (style.underline) normalized.underline = true;

  const normalizedColor =
    typeof style.color === "string"
      ? normalizeCssColorValue(style.color)
      : undefined;
  if (normalizedColor) {
    normalized.color = normalizedColor;
  }

  const normalizedClasses = normalizeClassNames(style.classes);
  if (normalizedClasses) {
    normalized.classes = normalizedClasses;
  }

  return Object.keys(normalized).length ? normalized : undefined;
};

export const normalizeSubtitleInlineStyle = (
  style: Partial<SubtitleInlineStyle> | undefined,
): SubtitleInlineStyle | undefined => {
  if (!style) return undefined;

  const cached = normalizedCache.get(style);
  if (cached !== undefined || normalizedCache.has(style)) return cached;

  const normalized = computeNormalizedSubtitleInlineStyle(style);
  normalizedCache.set(style, normalized);
  return normalized;
};

export const sanitizeSubtitleInlineStyle = (
  value: unknown,
): SubtitleInlineStyle | undefined => {
  if (!value || typeof value !== "object") return undefined;

  const raw = value as Record<string, unknown>;
  return normalizeSubtitleInlineStyle({
    italic: raw.italic === true,
    bold: raw.bold === true,
    underline: raw.underline === true,
    color: typeof raw.color === "string" ? raw.color : undefined,
    classes: Array.isArray(raw.classes)
      ? raw.classes.filter(
          (entry): entry is string => typeof entry === "string",
        )
      : undefined,
  });
};

export const subtitleInlineStylesEqual = (
  left: SubtitleInlineStyle | undefined,
  right: SubtitleInlineStyle | undefined,
): boolean => {
  if (left === right) return true;

  const leftNormalized = normalizeSubtitleInlineStyle(left);
  const rightNormalized = normalizeSubtitleInlineStyle(right);
  if (leftNormalized === rightNormalized) return true;

  const leftClasses = leftNormalized?.classes ?? [];
  const rightClasses = rightNormalized?.classes ?? [];

  return (
    Boolean(leftNormalized?.italic) === Boolean(rightNormalized?.italic) &&
    Boolean(leftNormalized?.bold) === Boolean(rightNormalized?.bold) &&
    Boolean(leftNormalized?.underline) ===
      Boolean(rightNormalized?.underline) &&
    (leftNormalized?.color ?? "") === (rightNormalized?.color ?? "") &&
    leftClasses.length === rightClasses.length &&
    leftClasses.every((value, index) => value === rightClasses[index])
  );
};

export const buildSubtitleInlineStyleCssText = (
  style: SubtitleInlineStyle | undefined,
): string => {
  if (!style) return "";

  const cached = cssTextCache.get(style);
  if (cached !== undefined) return cached;

  const normalized = normalizeSubtitleInlineStyle(style);
  const cssText = normalized?.color
    ? `--vot-subtitles-inline-color:${normalized.color};`
    : "";
  cssTextCache.set(style, cssText);
  return cssText;
};
