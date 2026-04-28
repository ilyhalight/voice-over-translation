export type TextSegment = {
  text: string;
  index: number;
  isWordLike: boolean;
};

export type SentenceSegment = {
  text: string;
  index: number;
};

const DEFAULT_CACHE_LOCALE = "und";
const wordSegmenterCache = new Map<string, Intl.Segmenter>();
const sentenceSegmenterCache = new Map<string, Intl.Segmenter>();
const resolvedLocaleCache = new Map<string, string | undefined>();

const canonicalizeLocale = (locale?: string): string | undefined => {
  if (!locale) return undefined;

  try {
    return Intl.getCanonicalLocales(locale)[0];
  } catch {
    return undefined;
  }
};

const resolveSegmenterLocale = (locale?: string): string | undefined => {
  const cacheKey = locale ?? DEFAULT_CACHE_LOCALE;
  if (resolvedLocaleCache.has(cacheKey)) {
    return resolvedLocaleCache.get(cacheKey);
  }

  const canonicalLocale = canonicalizeLocale(locale);
  if (!canonicalLocale) {
    resolvedLocaleCache.set(cacheKey, undefined);
    return undefined;
  }

  const resolvedLocale = Intl.Segmenter.supportedLocalesOf([
    canonicalLocale,
  ])[0];
  resolvedLocaleCache.set(cacheKey, resolvedLocale);
  return resolvedLocale;
};

const getSegmenter = (
  locale: string | undefined,
  granularity: Intl.SegmenterOptions["granularity"],
): Intl.Segmenter => {
  const resolvedLocale = resolveSegmenterLocale(locale);
  const cacheKey = `${granularity}:${resolvedLocale ?? DEFAULT_CACHE_LOCALE}`;
  const segmenterCache =
    granularity === "sentence" ? sentenceSegmenterCache : wordSegmenterCache;
  const cached = segmenterCache.get(cacheKey);
  if (cached) return cached;

  const segmenter = new Intl.Segmenter(resolvedLocale, { granularity });
  segmenterCache.set(cacheKey, segmenter);
  return segmenter;
};

export const segmentText = (text: string, locale?: string): TextSegment[] => {
  if (!text) return [];

  return Array.from(getSegmenter(locale, "word").segment(text), (part) => ({
    text: part.segment,
    index: part.index,
    isWordLike: Boolean(part.isWordLike),
  }));
};

export const segmentSentences = (
  text: string,
  locale?: string,
): SentenceSegment[] => {
  if (!text) return [];

  return Array.from(getSegmenter(locale, "sentence").segment(text), (part) => ({
    text: part.segment,
    index: part.index,
  }));
};
