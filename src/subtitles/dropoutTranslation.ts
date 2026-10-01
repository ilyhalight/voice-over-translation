import { normalizeLang } from "@vot.js/shared/utils/utils";
import { translate } from "../core/translateApis";
import type {
  SubtitleDescriptor,
  VideoDataForSubtitles,
} from "../types/subtitles";
import debug from "../utils/debug";
import { GM_fetch } from "../utils/gm";

/**
 * Dropout (Vimeo) has no `tlang`-like url for translated captions as YouTube
 * does. The original VTT is translated line by line and kept in memory, so the
 * subtitles menu can show it as a separate track next to the original one.
 */

type TranslateFunction = (
  text: string[],
  fromLang: string,
  toLang: string,
) => Promise<unknown>;

export type DropoutTranslationDeps = {
  translate: TranslateFunction;
  fetchText: (url: string) => Promise<string>;
};

const defaultDeps: DropoutTranslationDeps = {
  translate,
  fetchText: async (url) => (await GM_fetch(url, { timeout: 7000 })).text(),
};

const LOCAL_SUBTITLES_PREFIX = "vot-dropout-subtitles:";
const MAX_BATCH_LENGTH = 7500;
const TIMING_LINE_RE =
  /^\s*(?:(?:\d{2,}:)?\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})\s+-->/u;
// "NAME:", "[laughs]", "(NAME)" with optional "-" / ">>" in front
const SPEAKER_PREFIX_RE =
  /^(\s*(?:[-–—]\s*)?(?:>>\s*)?(?:(?:[A-Z][A-Z0-9 .,'’_-]{1,48}:)|(?:\[[^\]\r\n]{1,48}\]\s*:?)|(?:\([^)\r\n]{1,48}\)\s*:?))\s*)/u;
const TAG_PLACEHOLDER_RE = /__VOTDROPOUTTAG(\d+)__/gu;

const translatedFiles = new Map<string, string>();
const translationPromises = new Map<
  string,
  Promise<SubtitleDescriptor | null>
>();
let translatedFilesCounter = 0;

type VttEntry = {
  index: number;
  original: string;
  speakerPrefix: string;
  tags: string[];
  text: string;
};

export function getLocalDropoutSubtitles(url: string) {
  return url.startsWith(LOCAL_SUBTITLES_PREFIX)
    ? translatedFiles.get(url.slice(LOCAL_SUBTITLES_PREFIX.length))
    : undefined;
}

function getCueTextLineIndexes(lines: string[]) {
  const indexes: number[] = [];
  let insideCue = false;
  for (const [index, line] of lines.entries()) {
    if (TIMING_LINE_RE.test(line)) {
      insideCue = true;
    } else if (!line.trim()) {
      insideCue = false;
    } else if (insideCue) {
      indexes.push(index);
    }
  }

  return indexes;
}

function prepareLine(index: number, line: string): VttEntry {
  const speakerPrefix = SPEAKER_PREFIX_RE.exec(line)?.[1] ?? "";
  const tags: string[] = [];
  // keep cue tags (<i>, <c.yellow>...) out of the translator
  const text = line
    .slice(speakerPrefix.length)
    .replace(
      /<[^>\r\n]*>/gu,
      (tag) => `__VOTDROPOUTTAG${tags.push(tag) - 1}__`,
    );
  return { index, original: line, speakerPrefix, tags, text };
}

function restoreLine(entry: VttEntry, translated: string) {
  const text = translated.replace(
    TAG_PLACEHOLDER_RE,
    (match, tagIndex: string) => entry.tags[Number(tagIndex)] ?? match,
  );
  return `${entry.speakerPrefix}${text}`;
}

function splitIntoBatches(entries: VttEntry[]) {
  const batches: VttEntry[][] = [];
  let batch: VttEntry[] = [];
  let batchLength = 0;
  for (const entry of entries) {
    if (batch.length && batchLength + entry.text.length > MAX_BATCH_LENGTH) {
      batches.push(batch);
      batch = [];
      batchLength = 0;
    }

    batch.push(entry);
    batchLength += entry.text.length;
  }

  if (batch.length) {
    batches.push(batch);
  }

  return batches;
}

export async function translateVtt(
  vttText: string,
  fromLang: string,
  toLang: string,
  translateFn: TranslateFunction = translate,
) {
  const newline = vttText.includes("\r\n") ? "\r\n" : "\n";
  const lines = vttText.split(/\r?\n/u);
  const entries = getCueTextLineIndexes(lines)
    .map((index) => prepareLine(index, lines[index]))
    .filter((entry) => entry.text.trim());
  if (!entries.length) {
    return undefined;
  }

  let changed = false;
  for (const batch of splitIntoBatches(entries)) {
    const translated = await translateFn(
      batch.map((entry) => entry.text),
      fromLang,
      toLang,
    );
    const translatedLines = Array.isArray(translated) ? translated : [];
    for (const [index, entry] of batch.entries()) {
      const translatedLine = translatedLines[index];
      if (typeof translatedLine !== "string") {
        continue;
      }

      const restoredLine = restoreLine(entry, translatedLine);
      changed ||= restoredLine !== entry.original;
      lines[entry.index] = restoredLine;
    }
  }

  return changed ? lines.join(newline) : undefined;
}

function findSourceSubtitles(subtitles: readonly SubtitleDescriptor[]) {
  const candidates = subtitles.filter(
    (subtitle) =>
      subtitle.source === "vimeo" &&
      subtitle.format === "vtt" &&
      subtitle.language &&
      !subtitle.translatedFromLanguage,
  );
  return (
    candidates.find((subtitle) => normalizeLang(subtitle.language) === "en") ??
    candidates[0]
  );
}

async function createTranslatedDescriptor(
  source: SubtitleDescriptor,
  sourceLang: string,
  targetLang: string,
  deps: DropoutTranslationDeps,
): Promise<SubtitleDescriptor | null> {
  try {
    const sourceVtt = await deps.fetchText(source.url);
    if (!/^\uFEFF?WEBVTT(?:\s|$)/iu.test(sourceVtt)) {
      throw new Error("Vimeo did not return a WebVTT subtitle file");
    }

    const translatedVtt = await translateVtt(
      sourceVtt,
      sourceLang,
      targetLang,
      deps.translate,
    );
    if (!translatedVtt) {
      return null;
    }

    const localId = String(++translatedFilesCounter);
    translatedFiles.set(localId, translatedVtt);
    return {
      source: "dropout",
      format: "vtt",
      language: targetLang,
      translatedFromLanguage: sourceLang,
      url: `${LOCAL_SUBTITLES_PREFIX}${localId}`,
      isAutoGenerated: source.isAutoGenerated === true,
    };
  } catch (err) {
    debug.warn("Failed to create translated Dropout subtitles", err);
    return null;
  }
}

/**
 * Returns a translated copy of the original Vimeo subtitles. Concurrent calls
 * for the same subtitles share one translation; failed ones can be retried.
 */
export async function getTranslatedDropoutSubtitles(
  videoData: VideoDataForSubtitles,
  targetLanguage: string,
  deps: DropoutTranslationDeps = defaultDeps,
) {
  const subtitles = Array.isArray(videoData.subtitles)
    ? videoData.subtitles
    : [];
  const source = findSourceSubtitles(subtitles);
  if (!source) {
    return null;
  }

  const sourceLang = normalizeLang(source.language);
  const targetLang = normalizeLang(targetLanguage);
  if (!sourceLang || !targetLang || sourceLang === targetLang) {
    return null;
  }

  const cacheKey = `${source.url}|${sourceLang}|${targetLang}`;
  let promise = translationPromises.get(cacheKey);
  if (!promise) {
    promise = createTranslatedDescriptor(source, sourceLang, targetLang, deps);
    translationPromises.set(cacheKey, promise);
  }

  const descriptor = await promise;
  if (!descriptor) {
    translationPromises.delete(cacheKey);
  }

  return descriptor;
}
