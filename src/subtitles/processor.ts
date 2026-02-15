import YoutubeHelper from "@vot.js/ext/helpers/youtube";
import { convertSubs } from "@vot.js/shared/utils/subs";
import { timeout } from "../utils/async";
import debug from "../utils/debug";
import { GM_fetch } from "../utils/gm";
import { lang } from "../utils/localization";
import { segmentText } from "./segmenter";
import type {
  ProcessedSubtitles,
  SubtitleDescriptor,
  SubtitleLine,
  SubtitlesClient,
  SubtitlesRequestPayload,
  SubtitlesResponsePayload,
  SubtitleToken,
  VideoDataForSubtitles,
} from "./types";

export type {
  ProcessedSubtitles,
  SubtitleDescriptor,
  SubtitleLine,
  SubtitlesClient,
  SubtitleToken,
  VideoDataForSubtitles,
} from "./types";

type ProcessedSubtitlesInput = Partial<ProcessedSubtitles>;

type YoutubeSubtitleSegment = {
  utf8: string;
  tOffsetMs?: number;
};

type YoutubeSubtitleEvent = {
  segs?: YoutubeSubtitleSegment[];
  tStartMs: number;
  dDurationMs: number;
};

type YoutubeSubtitlesResponse = {
  events?: YoutubeSubtitleEvent[];
};

type SegmentTiming = {
  startMs: number;
  durationMs: number;
};

type RankedSubtitle = {
  descriptor: SubtitleDescriptor;
  index: number;
};

type SubtitleFormat = SubtitleDescriptor["format"];

const isSubtitleDescriptor = (arg: unknown): arg is SubtitleDescriptor =>
  Boolean(
    arg &&
      typeof arg === "object" &&
      "format" in arg &&
      "source" in arg &&
      "url" in arg,
  );

const pickDescriptorFromVideoData = (
  videoData: VideoDataForSubtitles,
  requestLang?: string,
  spokenLang?: string,
): SubtitleDescriptor | null => {
  const list = videoData.subtitles;
  if (!Array.isArray(list) || list.length === 0) return null;

  const desiredLang = requestLang ?? spokenLang;

  if (desiredLang) {
    const translated = list.find(
      (subtitle) =>
        subtitle.language === desiredLang &&
        typeof subtitle.translatedFromLanguage === "string",
    );
    if (translated) return translated;

    const original = list.find((subtitle) => subtitle.language === desiredLang);
    if (original) return original;
  }

  return list[0] ?? null;
};

const appendYoutubePoTokenParams = (inputUrl: string): string => {
  const poToken = YoutubeHelper.getPoToken();
  if (!poToken) return inputUrl;

  const deviceParamsRaw = YoutubeHelper.getDeviceParams();
  const normalizedDeviceParams = deviceParamsRaw.replace(/^[?&]+/u, "");

  try {
    const parsed = new URL(inputUrl);
    parsed.searchParams.set("potc", "1");
    parsed.searchParams.set("pot", poToken);

    if (normalizedDeviceParams) {
      const deviceParams = new URLSearchParams(normalizedDeviceParams);
      for (const [key, value] of deviceParams.entries()) {
        parsed.searchParams.set(key, value);
      }
    }

    return parsed.toString();
  } catch {
    const separator = inputUrl.includes("?") ? "&" : "?";
    const serializedDeviceParams = normalizedDeviceParams
      ? `&${normalizedDeviceParams}`
      : "";

    return `${inputUrl}${separator}potc=1&pot=${encodeURIComponent(poToken)}${serializedDeviceParams}`;
  }
};

const compareNumbers = (left: number, right: number): number => left - right;

const compareStrings = (left: string, right: string): number => {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
};

const compareRankArrays = (left: number[], right: number[]): number => {
  const length = Math.min(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    const diff = left[i] - right[i];
    if (diff !== 0) return diff;
  }
  if (left.length !== right.length) {
    return left.length - right.length;
  }
  return 0;
};

const getYandexTranslationKindRank = (
  isYandex: boolean,
  requestLanguageRank: number,
  isTranslated: boolean,
): number => {
  if (!isYandex) return 0;
  if (requestLanguageRank === 0) {
    return isTranslated ? 1 : 0;
  }
  return isTranslated ? 0 : 1;
};

const getTranslatedFromRequestRank = (
  isYandex: boolean,
  isTranslated: boolean,
  translatedFromLanguage: string | undefined,
  requestLang: string | undefined,
): number => {
  if (!isYandex || !isTranslated) return 0;
  return translatedFromLanguage === requestLang ? 0 : 1;
};

const buildSubtitleRank = (
  descriptor: SubtitleDescriptor,
  requestLang?: string,
): number[] => {
  const isYandex = descriptor.source === "yandex";
  const sourceRank = isYandex ? 0 : 1;
  const uiLanguageRank = descriptor.language === lang ? 0 : 1;
  const isTranslated = Boolean(descriptor.translatedFromLanguage);
  const requestLanguageRank =
    requestLang && descriptor.language === requestLang ? 0 : 1;

  // For Yandex subtitles:
  // - Prefer original subtitles when language already matches requestLang.
  // - Otherwise prefer translated variants when available.
  const translationKindRank = getYandexTranslationKindRank(
    isYandex,
    requestLanguageRank,
    isTranslated,
  );
  const translatedFromRequestRank = getTranslatedFromRequestRank(
    isYandex,
    isTranslated,
    descriptor.translatedFromLanguage,
    requestLang,
  );
  const originalRequestLanguageRank =
    isYandex && !isTranslated ? requestLanguageRank : 0;
  const nonYandexAutogeneratedRank = isYandex
    ? 0
    : Number(Boolean(descriptor.isAutoGenerated));

  return [
    sourceRank,
    uiLanguageRank,
    translationKindRank,
    translatedFromRequestRank,
    originalRequestLanguageRank,
    nonYandexAutogeneratedRank,
  ];
};

const sortSubtitles = (
  subtitles: SubtitleDescriptor[],
  requestLang?: string,
): SubtitleDescriptor[] => {
  const ranked: RankedSubtitle[] = subtitles.map((descriptor, index) => ({
    descriptor,
    index,
  }));

  ranked.sort((left, right) => {
    const leftRank = buildSubtitleRank(left.descriptor, requestLang);
    const rightRank = buildSubtitleRank(right.descriptor, requestLang);
    const rankDiff = compareRankArrays(leftRank, rightRank);
    if (rankDiff !== 0) return rankDiff;

    const descriptorOrder =
      compareStrings(left.descriptor.language, right.descriptor.language) ||
      compareStrings(
        left.descriptor.translatedFromLanguage ?? "",
        right.descriptor.translatedFromLanguage ?? "",
      ) ||
      compareStrings(left.descriptor.source, right.descriptor.source) ||
      compareStrings(left.descriptor.url, right.descriptor.url) ||
      compareNumbers(
        Number(Boolean(left.descriptor.isAutoGenerated)),
        Number(Boolean(right.descriptor.isAutoGenerated)),
      );
    if (descriptorOrder !== 0) return descriptorOrder;

    return compareNumbers(left.index, right.index);
  });

  return ranked.map((entry) => entry.descriptor);
};

const resolveTokenWordLike = (value: unknown, text: string): boolean => {
  if (typeof value === "boolean") return value;
  return Boolean(text.trim());
};

const sanitizeToken = (token: unknown): SubtitleToken => {
  if (!token || typeof token !== "object") {
    return {
      text: "",
      startMs: 0,
      durationMs: 0,
      isWordLike: false,
    };
  }

  const raw = token as Record<string, unknown>;
  const text = typeof raw.text === "string" ? raw.text : "";

  return {
    text,
    startMs: typeof raw.startMs === "number" ? raw.startMs : 0,
    durationMs: typeof raw.durationMs === "number" ? raw.durationMs : 0,
    isWordLike: resolveTokenWordLike(raw.isWordLike, text),
  };
};

const sanitizeLine = (line: unknown): SubtitleLine => {
  if (!line || typeof line !== "object") {
    return {
      text: "",
      startMs: 0,
      durationMs: 0,
      speakerId: "0",
      tokens: [],
    };
  }

  const raw = line as Record<string, unknown>;
  const tokens = Array.isArray(raw.tokens)
    ? (raw.tokens as unknown[]).map(sanitizeToken)
    : [];

  return {
    text: typeof raw.text === "string" ? raw.text : "",
    startMs: typeof raw.startMs === "number" ? raw.startMs : 0,
    durationMs: typeof raw.durationMs === "number" ? raw.durationMs : 0,
    speakerId: typeof raw.speakerId === "string" ? raw.speakerId : "0",
    tokens,
  };
};

const ensureProcessedSubtitles = (input: unknown): ProcessedSubtitles => {
  if (!input || typeof input !== "object") {
    return { subtitles: [] };
  }

  const payload = input as ProcessedSubtitlesInput;
  const subtitles = Array.isArray(payload.subtitles)
    ? payload.subtitles.map(sanitizeLine)
    : [];

  return { subtitles };
};

const stripHtmlToText = (value: string): string => {
  if (!value.includes("<")) return value;
  if (typeof document === "undefined") return value;

  const template = document.createElement("template");
  template.innerHTML = value;
  return template.content.textContent ?? "";
};

const getYoutubeEventDurationMs = (
  event: YoutubeSubtitleEvent,
  nextEvent: YoutubeSubtitleEvent | undefined,
): number => {
  if (!nextEvent) return Math.max(0, event.dDurationMs);
  if (event.tStartMs + event.dDurationMs <= nextEvent.tStartMs) {
    return Math.max(0, event.dDurationMs);
  }
  return Math.max(0, nextEvent.tStartMs - event.tStartMs);
};

const buildYoutubeSourceTokens = (
  event: YoutubeSubtitleEvent,
  segs: YoutubeSubtitleSegment[],
  durationMs: number,
): { text: string; sourceTokens: SubtitleToken[] } => {
  const sourceTokens: SubtitleToken[] = [];
  let text = "";
  let remainingDuration = durationMs;

  for (let j = 0; j < segs.length; j += 1) {
    const segment = segs[j];
    const rawText = typeof segment.utf8 === "string" ? segment.utf8 : "";
    if (!rawText) continue;

    const offset = Math.max(0, segment.tOffsetMs ?? 0);
    let segmentDuration = durationMs;
    const nextSegment = segs[j + 1];

    if (nextSegment?.tOffsetMs !== undefined) {
      const nextOffset = Math.max(offset, nextSegment.tOffsetMs);
      segmentDuration = Math.max(0, nextOffset - offset);
      remainingDuration = Math.max(remainingDuration - segmentDuration, 0);
    }

    let tokenDuration = Math.max(0, remainingDuration);
    if (nextSegment) {
      tokenDuration = Math.max(0, segmentDuration);
    }

    sourceTokens.push({
      text: rawText,
      startMs: event.tStartMs + offset,
      durationMs: tokenDuration,
      isWordLike: Boolean(rawText.trim()),
    });
    text += rawText;
  }

  return { text, sourceTokens };
};

const hasPositiveDuration = (token: SubtitleToken): boolean =>
  token.durationMs > 0;

const normalizeLineText = (line: SubtitleLine): string => {
  if (line.text) return line.text;
  if (!line.tokens.length) return "";
  return line.tokens.map((token) => token.text).join("");
};

const allocateTimingsByLength = (
  texts: string[],
  startMs: number,
  durationMs: number,
): SegmentTiming[] => {
  if (!texts.length) return [];

  const safeDuration = Math.max(0, durationMs);
  const weights = texts.map((text) => Math.max(text.length, 1));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const prefixWeights = new Array(weights.length + 1).fill(0);

  for (let i = 0; i < weights.length; i += 1) {
    prefixWeights[i + 1] = prefixWeights[i] + weights[i];
  }

  const timings: SegmentTiming[] = [];
  for (let i = 0; i < texts.length; i += 1) {
    const from = Math.round((safeDuration * prefixWeights[i]) / totalWeight);
    const to =
      i === texts.length - 1
        ? safeDuration
        : Math.round((safeDuration * prefixWeights[i + 1]) / totalWeight);

    timings.push({
      startMs: startMs + from,
      durationMs: Math.max(0, to - from),
    });
  }

  return timings;
};

const collectSourceTimedWords = (
  sourceTokens: SubtitleToken[],
  locale: string,
): SegmentTiming[] => {
  const timedWords: SegmentTiming[] = [];

  for (const token of sourceTokens) {
    if (!token.text || !hasPositiveDuration(token)) continue;

    const segmentedWords = segmentText(token.text, locale).filter(
      (segment) => segment.isWordLike && segment.text.trim(),
    );
    if (!segmentedWords.length) continue;

    const segmentTimings = allocateTimingsByLength(
      segmentedWords.map((segment) => segment.text),
      token.startMs,
      token.durationMs,
    );
    timedWords.push(...segmentTimings);
  }

  return timedWords;
};

const buildLineTokens = (
  line: SubtitleLine,
  descriptor: SubtitleDescriptor,
): SubtitleToken[] => {
  const lineText = normalizeLineText(line);
  if (!lineText) return [];

  const locale = descriptor.language;
  const segments = segmentText(lineText, locale);
  if (!segments.length) return [];

  const baseTimings = allocateTimingsByLength(
    segments.map((segment) => segment.text),
    line.startMs,
    line.durationMs,
  );

  const nextTokens: SubtitleToken[] = segments.map((segment, index) => ({
    text: segment.text,
    startMs: baseTimings[index]?.startMs ?? line.startMs,
    durationMs: baseTimings[index]?.durationMs ?? 0,
    isWordLike: segment.isWordLike,
  }));

  const sourceTimedWords = collectSourceTimedWords(line.tokens ?? [], locale);
  if (!sourceTimedWords.length) return nextTokens;

  const wordIndices = nextTokens.reduce<number[]>((indices, token, index) => {
    if (token.isWordLike && token.text.trim()) indices.push(index);
    return indices;
  }, []);
  if (!wordIndices.length) return nextTokens;

  const totalTargetWords = wordIndices.length;
  for (let i = 0; i < totalTargetWords; i += 1) {
    const targetIndex = wordIndices[i];
    const sourceIndex = Math.floor(
      (i * sourceTimedWords.length) / totalTargetWords,
    );
    const sourceTiming =
      sourceTimedWords[Math.min(sourceIndex, sourceTimedWords.length - 1)];

    nextTokens[targetIndex] = {
      ...nextTokens[targetIndex],
      startMs: sourceTiming.startMs,
      durationMs: sourceTiming.durationMs,
    };
  }

  return nextTokens;
};

const fetchRawSubtitles = async (
  url: string,
  format: SubtitleFormat,
): Promise<unknown> => {
  const response = await GM_fetch(url, { timeout: 7000 });
  if (format === "vtt" || format === "srt") {
    const text = await response.text();
    return convertSubs(text, "json") as unknown;
  }
  return response.json();
};

const normalizeFetchedSubtitles = (
  rawSubtitles: unknown,
  descriptor: SubtitleDescriptor,
): ProcessedSubtitles => {
  if (descriptor.source === "youtube") {
    return SubtitlesProcessor.formatYoutubeSubtitles(
      rawSubtitles as YoutubeSubtitlesResponse,
      Boolean(descriptor.isAutoGenerated),
    );
  }

  const normalized = ensureProcessedSubtitles(rawSubtitles);
  if (descriptor.source === "vk") {
    return SubtitlesProcessor.cleanJsonSubtitles(normalized);
  }
  return normalized;
};

const processFetchedSubtitles = (
  subtitles: ProcessedSubtitles,
  descriptor: SubtitleDescriptor,
): ProcessedSubtitles => ({
  subtitles: SubtitlesProcessor.processTokens(subtitles, descriptor),
});

const buildYandexSubtitles = (
  response: SubtitlesResponsePayload,
): SubtitleDescriptor[] => {
  const subtitles: SubtitleDescriptor[] = [];
  const seenOriginal = new Set<string>();

  for (const subtitle of response.subtitles ?? []) {
    if (subtitle.language && !seenOriginal.has(subtitle.language)) {
      seenOriginal.add(subtitle.language);
      subtitles.push({
        source: "yandex",
        format: "json",
        language: subtitle.language,
        url: subtitle.url,
      });
    }

    if (!subtitle.translatedLanguage) continue;

    subtitles.push({
      source: "yandex",
      format: "json",
      language: subtitle.translatedLanguage,
      translatedFromLanguage: subtitle.language,
      url: subtitle.translatedUrl ?? subtitle.url,
    });
  }

  return subtitles;
};

export const SubtitlesProcessor = {
  processTokens(
    subtitles: ProcessedSubtitles,
    descriptor: SubtitleDescriptor,
  ): SubtitleLine[] {
    const lines: SubtitleLine[] = [];

    for (const line of subtitles.subtitles) {
      const text = normalizeLineText(line);
      const tokens = buildLineTokens(
        {
          ...line,
          text,
        },
        descriptor,
      );

      lines.push({
        ...line,
        text,
        tokens,
      });
    }

    return lines;
  },

  formatYoutubeSubtitles(
    subtitles: YoutubeSubtitlesResponse,
    isAsr = false,
  ): ProcessedSubtitles {
    const events = subtitles.events ?? [];
    if (!events.length) {
      console.error("[VOT] Invalid YouTube subtitles format:", subtitles);
      return { subtitles: [] };
    }

    const processed: SubtitleLine[] = [];

    for (let i = 0; i < events.length; i += 1) {
      const event = events[i];
      const segs = event.segs;
      if (!segs?.length) continue;

      const nextEvent = events[i + 1];
      const durationMs = getYoutubeEventDurationMs(event, nextEvent);
      const { text, sourceTokens } = buildYoutubeSourceTokens(
        event,
        segs,
        durationMs,
      );

      const normalizedText = text.trim();
      if (!normalizedText) continue;

      processed.push({
        text: normalizedText,
        startMs: event.tStartMs,
        durationMs,
        speakerId: "0",
        tokens: isAsr ? sourceTokens : [],
      });
    }

    return { subtitles: processed };
  },

  cleanJsonSubtitles(subtitles: ProcessedSubtitles): ProcessedSubtitles {
    return {
      subtitles: subtitles.subtitles.map((line) => ({
        ...line,
        text: stripHtmlToText(line.text),
        tokens: line.tokens.map((token) => ({
          ...token,
          text: stripHtmlToText(token.text),
        })),
      })),
    };
  },

  async fetchSubtitles(
    descriptorOrVideoData: SubtitleDescriptor | VideoDataForSubtitles,
    requestLang?: string,
    spokenLang?: string,
  ): Promise<ProcessedSubtitles> {
    const descriptor = isSubtitleDescriptor(descriptorOrVideoData)
      ? descriptorOrVideoData
      : pickDescriptorFromVideoData(
          descriptorOrVideoData,
          requestLang,
          spokenLang,
        );

    if (!descriptor) {
      return { subtitles: [] };
    }

    const { source, format } = descriptor;
    let { url } = descriptor;

    if (source === "youtube") {
      url = appendYoutubePoTokenParams(url);
    }

    try {
      const rawSubtitles = await fetchRawSubtitles(url, format);
      const normalized = normalizeFetchedSubtitles(rawSubtitles, descriptor);
      const subtitlesWithTokens = processFetchedSubtitles(
        normalized,
        descriptor,
      );

      debug.log("[VOT] Processed subtitles:", subtitlesWithTokens);
      return subtitlesWithTokens;
    } catch (error) {
      console.error("[VOT] Failed to process subtitles:", error);
      return { subtitles: [] };
    }
  },

  async getSubtitles(
    client: SubtitlesClient,
    videoData: VideoDataForSubtitles,
  ): Promise<SubtitleDescriptor[]> {
    const {
      host,
      url,
      detectedLanguage: requestLang,
      videoId,
      duration,
      subtitles: extraSubtitles = [],
    } = videoData;

    try {
      const requestPayload: SubtitlesRequestPayload = {
        videoData: {
          host: host as SubtitlesRequestPayload["videoData"]["host"],
          url,
          videoId,
          duration,
        },
        requestLang: requestLang as SubtitlesRequestPayload["requestLang"],
      };

      const response = await Promise.race([
        client.getSubtitles(requestPayload),
        timeout(5000, "Timeout"),
      ]);

      const res = response as SubtitlesResponsePayload;
      debug.log("[VOT] Subtitles response:", res);
      if (res.waiting) {
        console.error("[VOT] Failed to get Yandex subtitles");
      }

      const yandexSubs = buildYandexSubtitles(res);

      const all = [...yandexSubs, ...extraSubtitles];
      return sortSubtitles(all, requestLang);
    } catch (error) {
      let message = "Error in getSubtitles function";
      if (error instanceof Error && error.message === "Timeout") {
        message = "Failed to get Yandex subtitles: timeout";
      }
      console.error(`[VOT] ${message}`, error);
      throw error;
    }
  },
};
