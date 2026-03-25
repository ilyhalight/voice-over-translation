import type { SubtitleInlineStyle } from "../types/subtitles";

const SAFE_CSS_COLOR_NAME_RE = /^[a-z]+$/iu;
const SAFE_HEX_COLOR_RE =
  /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/iu;
const SAFE_CSS_FUNCTION_COLOR_RE =
  /^(?:rgb|rgba|hsl|hsla)\(\s*[0-9.,%\s/+-]+\)$/iu;
const SAFE_CLASS_NAME_RE = /^[a-z0-9_-]+$/iu;

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

export const normalizeSubtitleInlineStyle = (
  style: Partial<SubtitleInlineStyle> | undefined,
): SubtitleInlineStyle | undefined => {
  if (!style) return undefined;

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
  const leftNormalized = normalizeSubtitleInlineStyle(left);
  const rightNormalized = normalizeSubtitleInlineStyle(right);
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
  const normalized = normalizeSubtitleInlineStyle(style);
  if (!normalized?.color) return "";
  return `--vot-subtitles-inline-color:${normalized.color};`;
};
