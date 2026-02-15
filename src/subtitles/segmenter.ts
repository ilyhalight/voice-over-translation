export type TextSegment = {
  text: string;
  index: number;
  isWordLike: boolean;
};

const DEFAULT_LOCALE = "und";
const segmenterCache = new Map<string, Intl.Segmenter>();

const hasNativeSegmenter = (): boolean =>
  typeof Intl !== "undefined" && typeof Intl.Segmenter === "function";

const splitTextRegexp = /[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu;

const wordLikeRegexp = /[\p{L}\p{N}]/u;

const canonicalizeLocale = (locale?: string): string => {
  if (typeof Intl === "undefined") return DEFAULT_LOCALE;
  if (!locale) return DEFAULT_LOCALE;

  try {
    const canonical = Intl.getCanonicalLocales(locale)[0];
    return canonical || DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
};

const resolveSegmenterLocale = (locale?: string): string | undefined => {
  const canonicalLocale = canonicalizeLocale(locale);
  if (canonicalLocale === DEFAULT_LOCALE) return undefined;

  const supported = Intl.Segmenter.supportedLocalesOf([canonicalLocale]);
  return supported[0];
};

const getSegmenter = (locale?: string): Intl.Segmenter | null => {
  if (!hasNativeSegmenter()) return null;

  const resolvedLocale = resolveSegmenterLocale(locale);
  const cacheKey = resolvedLocale ?? DEFAULT_LOCALE;
  const cached = segmenterCache.get(cacheKey);
  if (cached) return cached;

  const segmenter = new Intl.Segmenter(resolvedLocale, { granularity: "word" });
  segmenterCache.set(cacheKey, segmenter);
  return segmenter;
};

const segmentTextFallback = (text: string): TextSegment[] => {
  const result: TextSegment[] = [];
  splitTextRegexp.lastIndex = 0;

  for (const match of text.matchAll(splitTextRegexp)) {
    const segment = match[0];
    if (!segment) continue;

    result.push({
      text: segment,
      index: match.index ?? 0,
      isWordLike: wordLikeRegexp.test(segment),
    });
  }

  return result;
};

export const segmentText = (text: string, locale?: string): TextSegment[] => {
  if (!text) return [];

  const segmenter = getSegmenter(locale);
  if (!segmenter) {
    return segmentTextFallback(text);
  }

  const segments = segmenter.segment(text);
  const result: TextSegment[] = [];

  for (const part of segments) {
    result.push({
      text: part.segment,
      index: part.index,
      isWordLike: Boolean(part.isWordLike),
    });
  }

  return result;
};
