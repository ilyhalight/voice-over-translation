// Linguistic line-break rules for two-line subtitles.
//
// Sources:
// - Netflix Timed Text Style Guide (General Requirements, "Line Treatment"):
//   break after punctuation, before conjunctions and before prepositions;
//   never separate an article/adjective from its noun, a subject pronoun from
//   its verb, a prepositional verb from its preposition, or a verb from an
//   auxiliary / reflexive pronoun / negation.
// - BBC Subtitle Guidelines, "Line breaks": break at the highest available
//   syntactic node.
// - Eye-tracking research (Szarkowska et al.) showing that breaking inside a
//   phrase increases regressions and dwell time.

export type LineBreakLexicon = {
  // Words that must not end line 1 (they bind forward to the next word).
  bindsForward: Set<string>;
  // Words that read better at the start of line 2.
  prefersLineStart: Set<string>;
};

const set = (...words: string[]): Set<string> => new Set(words);

const EN: LineBreakLexicon = {
  bindsForward: set(
    "a",
    "an",
    "the",
    "my",
    "your",
    "his",
    "her",
    "its",
    "our",
    "their",
    "this",
    "that",
    "these",
    "those",
    "of",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "from",
    "by",
    "into",
    "onto",
    "over",
    "under",
    "about",
    "between",
    "through",
    "during",
    "without",
    "within",
    "across",
    "against",
    "toward",
    "towards",
    "upon",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "am",
    "has",
    "have",
    "had",
    "will",
    "would",
    "can",
    "could",
    "should",
    "shall",
    "may",
    "might",
    "must",
    "do",
    "does",
    "did",
    "not",
    "no",
    "very",
    "more",
    "most",
    "less",
  ),
  prefersLineStart: set(
    "and",
    "but",
    "or",
    "nor",
    "so",
    "yet",
    "because",
    "although",
    "though",
    "while",
    "whereas",
    "since",
    "unless",
    "if",
    "that",
    "which",
    "who",
    "when",
    "where",
    "whether",
    "of",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "from",
    "by",
  ),
};

const RU: LineBreakLexicon = {
  bindsForward: set(
    "\u0432",
    "\u0432\u043e",
    "\u043d\u0430",
    "\u0437\u0430",
    "\u043a",
    "\u043a\u043e",
    "\u0441",
    "\u0441\u043e",
    "\u043f\u043e",
    "\u043e",
    "\u043e\u0431",
    "\u043e\u0431\u043e",
    "\u043e\u0442",
    "\u0434\u043e",
    "\u0438\u0437",
    "\u0443",
    "\u043f\u0440\u0438",
    "\u043f\u0440\u043e",
    "\u0434\u043b\u044f",
    "\u0431\u0435\u0437",
    "\u043f\u0435\u0440\u0435\u0434",
    "\u043d\u0430\u0434",
    "\u043f\u043e\u0434",
    "\u043c\u0435\u0436\u0434\u0443",
    "\u043d\u0435",
    "\u043d\u0438",
    "\u0431\u044b",
    "\u0436\u0435",
    "\u043e\u0447\u0435\u043d\u044c",
    "\u043c\u043e\u0439",
    "\u0442\u0432\u043e\u0439",
    "\u043d\u0430\u0448",
    "\u0432\u0430\u0448",
    "\u044d\u0442\u043e\u0442",
    "\u044d\u0442\u0430",
    "\u044d\u0442\u0438",
  ),
  prefersLineStart: set(
    "\u0438",
    "\u0430",
    "\u043d\u043e",
    "\u0438\u043b\u0438",
    "\u0447\u0442\u043e",
    "\u0447\u0442\u043e\u0431\u044b",
    "\u043f\u043e\u0442\u043e\u043c\u0443",
    "\u0435\u0441\u043b\u0438",
    "\u043a\u043e\u0433\u0434\u0430",
    "\u043a\u043e\u0442\u043e\u0440\u044b\u0439",
    "\u043a\u043e\u0442\u043e\u0440\u0430\u044f",
    "\u0445\u043e\u0442\u044f",
    "\u043f\u043e\u043a\u0430",
  ),
};

const DE: LineBreakLexicon = {
  bindsForward: set(
    "der",
    "die",
    "das",
    "den",
    "dem",
    "des",
    "ein",
    "eine",
    "einen",
    "einem",
    "einer",
    "eines",
    "mein",
    "dein",
    "sein",
    "ihr",
    "unser",
    "in",
    "an",
    "auf",
    "aus",
    "bei",
    "mit",
    "nach",
    "seit",
    "von",
    "zu",
    "zur",
    "zum",
    "vor",
    "\u00fcber",
    "unter",
    "durch",
    "f\u00fcr",
    "ohne",
    "um",
    "ist",
    "sind",
    "war",
    "waren",
    "hat",
    "haben",
    "wird",
    "werden",
    "kann",
    "k\u00f6nnen",
    "muss",
    "m\u00fcssen",
    "nicht",
    "sehr",
  ),
  prefersLineStart: set(
    "und",
    "aber",
    "oder",
    "denn",
    "weil",
    "dass",
    "wenn",
    "obwohl",
    "w\u00e4hrend",
    "der",
    "die",
    "das",
  ),
};

const FR: LineBreakLexicon = {
  bindsForward: set(
    "le",
    "la",
    "les",
    "un",
    "une",
    "des",
    "du",
    "de",
    "au",
    "aux",
    "mon",
    "ton",
    "son",
    "ma",
    "ta",
    "sa",
    "mes",
    "tes",
    "ses",
    "notre",
    "votre",
    "leur",
    "ce",
    "cet",
    "cette",
    "ces",
    "\u00e0",
    "en",
    "dans",
    "sur",
    "sous",
    "pour",
    "par",
    "avec",
    "sans",
    "est",
    "sont",
    "a",
    "ont",
    "ne",
    "pas",
    "tr\u00e8s",
    "plus",
  ),
  prefersLineStart: set(
    "et",
    "mais",
    "ou",
    "car",
    "donc",
    "que",
    "qui",
    "quand",
    "si",
    "parce",
    "bien",
    "lorsque",
  ),
};

const ES: LineBreakLexicon = {
  bindsForward: set(
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "unos",
    "unas",
    "lo",
    "mi",
    "tu",
    "su",
    "mis",
    "tus",
    "sus",
    "nuestro",
    "este",
    "esta",
    "de",
    "del",
    "a",
    "al",
    "en",
    "con",
    "sin",
    "por",
    "para",
    "sobre",
    "es",
    "son",
    "est\u00e1",
    "est\u00e1n",
    "ha",
    "han",
    "no",
    "muy",
    "m\u00e1s",
  ),
  prefersLineStart: set(
    "y",
    "e",
    "pero",
    "o",
    "u",
    "porque",
    "que",
    "si",
    "cuando",
    "aunque",
    "mientras",
    "quien",
  ),
};

const LEXICONS: Record<string, LineBreakLexicon> = {
  en: EN,
  ru: RU,
  uk: RU,
  be: RU,
  de: DE,
  fr: FR,
  es: ES,
  pt: ES,
  it: ES,
};

// Languages written without inter-word spaces. Word-count heuristics such as
// "avoid a one-word line" are meaningless there, and almost any character
// boundary is a legal break, so the lexicon penalties do not apply.
const SCRIPTIO_CONTINUA = new Set([
  "ja",
  "zh",
  "ko",
  "th",
  "lo",
  "km",
  "my",
  "bo",
]);

export const getBaseLanguage = (locale?: string): string =>
  (locale ?? "").toLowerCase().split(/[-_]/u)[0] ?? "";

export const isScriptioContinua = (locale?: string): boolean =>
  SCRIPTIO_CONTINUA.has(getBaseLanguage(locale));

const WORD_CHARS_RE = /[^\p{L}\p{N}'\u2019]+/gu;

export const normalizeLexiconWord = (value: string): string =>
  value.replaceAll(WORD_CHARS_RE, " ").trim().toLowerCase();

export const lastWordOf = (text: string): string => {
  const parts = normalizeLexiconWord(text).split(" ").filter(Boolean);
  return parts.at(-1) ?? "";
};

export const firstWordOf = (text: string): string => {
  const parts = normalizeLexiconWord(text).split(" ").filter(Boolean);
  return parts[0] ?? "";
};

export const LINE_BREAK_PENALTY = {
  bindsForward: 240,
  prefersLineStart: -60,
} as const;

/**
 * Penalty (positive = worse) for breaking a line between `beforeText` and
 * `afterText`. Returns 0 for space-less scripts, where the lexicon does not
 * apply.
 */
export function getLinguisticBreakPenalty(
  beforeText: string,
  afterText: string,
  locale?: string,
): number {
  if (isScriptioContinua(locale)) return 0;

  const lexicon = LEXICONS[getBaseLanguage(locale)] ?? EN;
  const before = lastWordOf(beforeText);
  const after = firstWordOf(afterText);
  if (!before || !after) return 0;

  let penalty = 0;
  if (lexicon.bindsForward.has(before))
    penalty += LINE_BREAK_PENALTY.bindsForward;
  if (lexicon.prefersLineStart.has(after))
    penalty += LINE_BREAK_PENALTY.prefersLineStart;
  return penalty;
}
