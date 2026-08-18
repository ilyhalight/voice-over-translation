import type { SubtitleInlineStyle, SubtitleToken } from "../types/subtitles";

export type SubtitleRenderPlanPartWord = {
  kind: "word";
  text: string;
  style?: SubtitleInlineStyle;
  highlightIndex: number;
};

export type SubtitleRenderPlanPartText = {
  kind: "text";
  text: string;
  style?: SubtitleInlineStyle;
  highlightIndex?: number;
};

export type SubtitleRenderPlanPartBreak = {
  kind: "break";
};

export type SubtitleRenderPlanSpanPart =
  | SubtitleRenderPlanPartWord
  | SubtitleRenderPlanPartText;

export type SubtitleRenderPlanPart =
  | SubtitleRenderPlanSpanPart
  | SubtitleRenderPlanPartBreak;

const PUNCTUATION_OR_SYMBOL_RE = /^[\p{P}\p{S}]$/u;
const TEXT_TOKEN_SLICE_RE = /\s+|[\p{P}\p{S}]+|[^\s\p{P}\p{S}]+/gu;
const LEADING_PUNCTUATION_RE = /^[\p{P}\p{S}]+/u;
const TRAILING_PUNCTUATION_RE = /[\p{P}\p{S}]+$/u;
const PUNCTUATION_ONLY_RE = /^[\p{P}\p{S}]+$/u;
const LEADING_WHITESPACE_RE = /^\s+/u;

const _isPunctuationOrSymbol = (char: string): boolean =>
  PUNCTUATION_OR_SYMBOL_RE.test(char);

/**
 * Consolidated from a per-character `for..of` scan. A single anchored regex is
 * equivalent for the same input class (Unicode `\p{P}`/`\p{S}` runs) and avoids
 * one regex `test()` per code point.
 */
const getLeadingPunctuation = (value: string): string =>
  LEADING_PUNCTUATION_RE.exec(value)?.[0] ?? "";

/**
 * Consolidated from `Array.from(value)` + reverse scan, which allocated a code
 * point array for every word token on every render.
 */
const getTrailingPunctuation = (value: string): string =>
  TRAILING_PUNCTUATION_RE.exec(value)?.[0] ?? "";

const isPunctuationOnly = (value: string): boolean =>
  value.length > 0 && PUNCTUATION_ONLY_RE.test(value);

/**
 * Precomputes "is there a token at or after index i that contributes a real
 * word", replacing the previous `hasFutureWordToken()` forward rescan that made
 * plan building O(n^2) for punctuation-heavy cues.
 */
const buildWordLookahead = (
  tokens: SubtitleToken[],
  renderEndTokenIndex: number,
): Uint8Array => {
  const size = Math.max(0, renderEndTokenIndex + 2);
  const lookahead = new Uint8Array(size);
  for (let index = renderEndTokenIndex; index >= 0; index -= 1) {
    let hasWord = lookahead[index + 1] === 1;
    if (!hasWord) {
      const token = tokens[index];
      const tokenText = token?.text ?? "";
      if (token?.isWordLike && tokenText.trim()) {
        const withoutLeadingWhitespace = tokenText.trimStart();
        const leadingPunctuation = getLeadingPunctuation(
          withoutLeadingWhitespace,
        );
        const withoutLeadingPunctuation = withoutLeadingWhitespace.slice(
          leadingPunctuation.length,
        );
        const trailingPunctuation = getTrailingPunctuation(
          withoutLeadingPunctuation,
        );
        hasWord = withoutLeadingPunctuation.length > trailingPunctuation.length;
      }
    }
    lookahead[index] = hasWord ? 1 : 0;
  }
  return lookahead;
};

const pushTextPart = (
  plan: SubtitleRenderPlanPart[],
  text: string,
  style?: SubtitleInlineStyle,
  options: {
    highlightIndex?: number;
    withBreak?: boolean;
  } = {},
): void => {
  plan.push({
    kind: "text",
    text,
    style,
    highlightIndex: options.highlightIndex,
  });
  if (options.withBreak) {
    plan.push({ kind: "break" });
  }
};

const skipWhitespaceTokens = (
  tokens: SubtitleToken[],
  startIndex: number,
  renderEndTokenIndex: number,
): number => {
  let index = startIndex;
  while (
    index <= renderEndTokenIndex &&
    !tokens[index]?.isWordLike &&
    !tokens[index]?.text.trim()
  ) {
    index += 1;
  }

  return index;
};

const consumeWordToken = (
  plan: SubtitleRenderPlanPart[],
  tokens: SubtitleToken[],
  startIndex: number,
  renderEndTokenIndex: number,
  breakAfterTokenIndexSet: Set<number> | null,
  highlightIndex: number,
): { consumedWord: boolean; nextTokenIndex: number } => {
  const token = tokens[startIndex];
  const leadingWhitespace = LEADING_WHITESPACE_RE.exec(token.text)?.[0] ?? "";
  const body = token.text.slice(leadingWhitespace.length);
  if (leadingWhitespace) {
    pushTextPart(plan, leadingWhitespace, token.style);
  }

  const leadingPunctuation = getLeadingPunctuation(body);
  const bodyWithoutLeadingPunctuation = body.slice(leadingPunctuation.length);
  const trailingPunctuation = getTrailingPunctuation(
    bodyWithoutLeadingPunctuation,
  );
  const wordText = trailingPunctuation
    ? bodyWithoutLeadingPunctuation.slice(
        0,
        bodyWithoutLeadingPunctuation.length - trailingPunctuation.length,
      )
    : bodyWithoutLeadingPunctuation;

  if (!wordText) {
    if (body) {
      pushTextPart(plan, body, token.style);
    }
    if (!breakAfterTokenIndexSet?.has(startIndex)) {
      return {
        consumedWord: false,
        nextTokenIndex: startIndex + 1,
      };
    }

    plan.push({ kind: "break" });
    return {
      consumedWord: false,
      nextTokenIndex: skipWhitespaceTokens(
        tokens,
        startIndex + 1,
        renderEndTokenIndex,
      ),
    };
  }

  if (leadingPunctuation) {
    pushTextPart(plan, leadingPunctuation, token.style, {
      highlightIndex,
    });
  }

  plan.push({
    kind: "word",
    text: wordText,
    style: token.style,
    highlightIndex,
  });

  if (trailingPunctuation) {
    pushTextPart(plan, trailingPunctuation, token.style, {
      highlightIndex,
    });
  }

  if (!breakAfterTokenIndexSet?.has(startIndex)) {
    return {
      consumedWord: true,
      nextTokenIndex: startIndex + 1,
    };
  }

  plan.push({ kind: "break" });
  return {
    consumedWord: true,
    nextTokenIndex: skipWhitespaceTokens(
      tokens,
      startIndex + 1,
      renderEndTokenIndex,
    ),
  };
};

const consumeTextToken = (
  plan: SubtitleRenderPlanPart[],
  tokenIndex: number,
  tokens: SubtitleToken[],
  renderEndTokenIndex: number,
  options: {
    token: SubtitleToken;
    tokenText: string;
    hasBreakAfter: boolean;
    lastWordHighlightIndex: number | null;
    nextWordHighlightIndex: number;
    hasWordAfter: boolean;
  },
): number => {
  const {
    token,
    tokenText,
    hasBreakAfter,
    lastWordHighlightIndex,
    nextWordHighlightIndex,
    hasWordAfter,
  } = options;

  const fallbackHighlightIndex =
    lastWordHighlightIndex ??
    (hasWordAfter ? nextWordHighlightIndex : undefined);

  const textParts = tokenText.match(TEXT_TOKEN_SLICE_RE) ?? [tokenText];
  for (const textPart of textParts) {
    pushTextPart(plan, textPart, token.style, {
      highlightIndex: isPunctuationOnly(textPart)
        ? fallbackHighlightIndex
        : undefined,
    });
  }

  if (hasBreakAfter) {
    plan.push({ kind: "break" });
    return skipWhitespaceTokens(tokens, tokenIndex + 1, renderEndTokenIndex);
  }

  return tokenIndex + 1;
};

/**
 * Build a render plan for subtitle tokens preserving existing grouping rules.
 *
 * Important detail: leading punctuation before a word (for example "(" or "\"")
 * should be visually highlighted together with that word.
 */
export function buildSubtitleRenderPlan(
  tokens: SubtitleToken[],
  renderEndTokenIndex: number,
  breakAfterTokenIndexSet: Set<number> | null,
): SubtitleRenderPlanPart[] {
  const plan: SubtitleRenderPlanPart[] = [];
  let wordHighlightIndex = 0;
  let lastWordHighlightIndex: number | null = null;
  let wordLookahead: Uint8Array | null = null;

  for (let i = 0; i <= renderEndTokenIndex; ) {
    const token = tokens[i];
    const tokenText = token?.text ?? "";
    if (!tokenText) {
      i += 1;
      continue;
    }

    if (tokenText === "\n") {
      plan.push({ kind: "break" });
      i += 1;
      continue;
    }

    if (token.isWordLike) {
      const result = consumeWordToken(
        plan,
        tokens,
        i,
        renderEndTokenIndex,
        breakAfterTokenIndexSet,
        wordHighlightIndex,
      );
      i = result.nextTokenIndex;
      if (result.consumedWord) {
        lastWordHighlightIndex = wordHighlightIndex;
        wordHighlightIndex += 1;
      }
      continue;
    }

    const hasBreakAfter = Boolean(breakAfterTokenIndexSet?.has(i));
    if (lastWordHighlightIndex === null && wordLookahead === null) {
      wordLookahead = buildWordLookahead(tokens, renderEndTokenIndex);
    }
    i = consumeTextToken(plan, i, tokens, renderEndTokenIndex, {
      token,
      tokenText,
      hasBreakAfter,
      lastWordHighlightIndex,
      nextWordHighlightIndex: wordHighlightIndex,
      hasWordAfter: wordLookahead ? wordLookahead[i + 1] === 1 : false,
    });
  }

  return plan;
}
