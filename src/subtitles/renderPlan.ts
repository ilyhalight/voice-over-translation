import type { SubtitleInlineStyle, SubtitleToken } from "../types/subtitles";

export type SubtitleRenderPlanPart =
  | {
      kind: "word";
      text: string;
      style?: SubtitleInlineStyle;
      highlightIndex: number;
    }
  | {
      kind: "text";
      text: string;
      style?: SubtitleInlineStyle;
      highlightIndex?: number;
    }
  | {
      kind: "break";
    };

const PUNCTUATION_OR_SYMBOL_RE = /^[\p{P}\p{S}]$/u;
const TEXT_TOKEN_SLICE_RE = /\s+|[\p{P}\p{S}]+|[^\s\p{P}\p{S}]+/gu;

const isPunctuationOrSymbol = (char: string): boolean =>
  PUNCTUATION_OR_SYMBOL_RE.test(char);

const getLeadingPunctuation = (value: string): string => {
  let endIndex = 0;
  for (const char of value) {
    if (!isPunctuationOrSymbol(char)) {
      break;
    }
    endIndex += char.length;
  }
  return value.slice(0, endIndex);
};

const getTrailingPunctuation = (value: string): string => {
  const chars = Array.from(value);
  let length = 0;
  for (let index = chars.length - 1; index >= 0; index -= 1) {
    const char = chars[index];
    if (!isPunctuationOrSymbol(char)) {
      break;
    }
    length += char.length;
  }
  return length > 0 ? value.slice(value.length - length) : "";
};

const isPunctuationOnly = (value: string): boolean =>
  value.length > 0 && Array.from(value).every(isPunctuationOrSymbol);

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

const hasFutureWordToken = (
  tokens: SubtitleToken[],
  startIndex: number,
  renderEndTokenIndex: number,
): boolean => {
  for (let index = startIndex; index <= renderEndTokenIndex; index += 1) {
    const tokenText = tokens[index]?.text ?? "";
    if (!tokens[index]?.isWordLike || !tokenText.trim()) {
      continue;
    }

    const withoutLeadingWhitespace = tokenText.trimStart();
    const leadingPunctuation = getLeadingPunctuation(withoutLeadingWhitespace);
    const withoutLeadingPunctuation = withoutLeadingWhitespace.slice(
      leadingPunctuation.length,
    );
    const trailingPunctuation = getTrailingPunctuation(
      withoutLeadingPunctuation,
    );
    const withoutTrailingPunctuation = trailingPunctuation
      ? withoutLeadingPunctuation.slice(0, -trailingPunctuation.length)
      : withoutLeadingPunctuation;
    if (withoutTrailingPunctuation) {
      return true;
    }
  }

  return false;
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
  const leadingWhitespace = /^\s+/u.exec(token.text)?.[0] ?? "";
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
  },
): number => {
  const {
    token,
    tokenText,
    hasBreakAfter,
    lastWordHighlightIndex,
    nextWordHighlightIndex,
  } = options;

  const fallbackHighlightIndex =
    lastWordHighlightIndex ??
    (hasFutureWordToken(tokens, tokenIndex + 1, renderEndTokenIndex)
      ? nextWordHighlightIndex
      : undefined);

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
    i = consumeTextToken(plan, i, tokens, renderEndTokenIndex, {
      token,
      tokenText,
      hasBreakAfter,
      lastWordHighlightIndex,
      nextWordHighlightIndex: wordHighlightIndex,
    });
  }

  return plan;
}
