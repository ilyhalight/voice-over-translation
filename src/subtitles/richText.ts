import type {
  SubtitleFormat,
  SubtitleInlineStyle,
  SubtitleStyledSpan,
} from "./types";

type StyledFragment = {
  text: string;
  style?: SubtitleInlineStyle;
};

type AssStyleState = {
  italic: boolean;
  bold: boolean;
  underline: boolean;
};

const LEADING_SPEAKER_MARKER_RE = /^\s*>>\s*/u;
const HTML_TAG_RE = /<[^>]+>/gu;
const ASS_OVERRIDE_TAG_RE = /\{[^}]*\}/gu;
const ASS_HARD_BREAK_RE = /\\[Nn]/gu;
const ASS_HARD_SPACE_RE = /\\h/gu;

const cloneStyle = (style: SubtitleInlineStyle): SubtitleInlineStyle => ({
  italic: style.italic,
  bold: style.bold,
  underline: style.underline,
});

const hasStyle = (style: SubtitleInlineStyle | undefined): boolean =>
  Boolean(style?.italic || style?.bold || style?.underline);

const sameStyle = (
  left: SubtitleInlineStyle | undefined,
  right: SubtitleInlineStyle | undefined,
): boolean =>
  Boolean(left?.italic) === Boolean(right?.italic) &&
  Boolean(left?.bold) === Boolean(right?.bold) &&
  Boolean(left?.underline) === Boolean(right?.underline);

const pushStyledFragment = (
  fragments: StyledFragment[],
  text: string,
  style: SubtitleInlineStyle | undefined,
): void => {
  if (!text) return;

  const normalizedStyle = hasStyle(style)
    ? cloneStyle(style as SubtitleInlineStyle)
    : undefined;
  const previous = fragments.at(-1);
  if (previous && sameStyle(previous.style, normalizedStyle)) {
    previous.text += text;
    return;
  }

  fragments.push({
    text,
    style: normalizedStyle,
  });
};

const normalizeSpeakerMarker = (
  fragments: StyledFragment[],
): StyledFragment[] => {
  const normalized: StyledFragment[] = [];
  let markerHandled = false;

  for (const fragment of fragments) {
    if (!fragment.text) continue;

    if (!markerHandled) {
      const nextText = fragment.text.replace(LEADING_SPEAKER_MARKER_RE, "");
      markerHandled = true;
      if (!nextText) {
        continue;
      }
      pushStyledFragment(normalized, nextText, fragment.style);
      continue;
    }

    pushStyledFragment(normalized, fragment.text, fragment.style);
  }

  return normalized;
};

const parseHtmlLikeStyledText = (rawText: string): StyledFragment[] => {
  const fragments: StyledFragment[] = [];
  let cursor = 0;
  const styleStack: SubtitleInlineStyle[] = [];

  const currentStyle = (): SubtitleInlineStyle | undefined => {
    if (!styleStack.length) return undefined;
    return styleStack.reduce<SubtitleInlineStyle>(
      (acc, item) => ({
        italic: acc.italic || item.italic,
        bold: acc.bold || item.bold,
        underline: acc.underline || item.underline,
      }),
      {},
    );
  };

  for (const match of rawText.matchAll(HTML_TAG_RE)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      pushStyledFragment(
        fragments,
        rawText.slice(cursor, index),
        currentStyle(),
      );
    }

    const tag = match[0];
    const closing = /^<\//u.test(tag);
    const tagName = /^<\/?([a-z0-9]+)/iu.exec(tag)?.[1]?.toLowerCase();

    if (tagName === "br") {
      pushStyledFragment(fragments, "\n", currentStyle());
      cursor = index + tag.length;
      continue;
    }

    if (tagName === "i" || tagName === "b" || tagName === "u") {
      if (closing) {
        for (let i = styleStack.length - 1; i >= 0; i -= 1) {
          const style = styleStack[i];
          if (
            (tagName === "i" && style.italic) ||
            (tagName === "b" && style.bold) ||
            (tagName === "u" && style.underline)
          ) {
            styleStack.splice(i, 1);
            break;
          }
        }
      } else {
        styleStack.push({
          italic: tagName === "i",
          bold: tagName === "b",
          underline: tagName === "u",
        });
      }
    }

    cursor = index + tag.length;
  }

  if (cursor < rawText.length) {
    pushStyledFragment(fragments, rawText.slice(cursor), currentStyle());
  }

  return normalizeSpeakerMarker(fragments);
};

const applyAssOverride = (
  state: AssStyleState,
  overrideText: string,
): AssStyleState => {
  const next = { ...state };
  const commands = overrideText.match(/\\[ibu][01]|\\r/giu) ?? [];

  for (const command of commands) {
    const normalized = command.toLowerCase();
    if (normalized === "\\r") {
      next.italic = false;
      next.bold = false;
      next.underline = false;
      continue;
    }
    if (normalized.startsWith("\\i")) {
      next.italic = normalized.endsWith("1");
      continue;
    }
    if (normalized.startsWith("\\b")) {
      next.bold = normalized.endsWith("1");
      continue;
    }
    if (normalized.startsWith("\\u")) {
      next.underline = normalized.endsWith("1");
    }
  }

  return next;
};

const parseAssStyledText = (rawText: string): StyledFragment[] => {
  const fragments: StyledFragment[] = [];
  let cursor = 0;
  let styleState: AssStyleState = {
    italic: false,
    bold: false,
    underline: false,
  };

  for (const match of rawText.matchAll(ASS_OVERRIDE_TAG_RE)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      const text = rawText
        .slice(cursor, index)
        .replaceAll(ASS_HARD_BREAK_RE, "\n")
        .replaceAll(ASS_HARD_SPACE_RE, " ");
      pushStyledFragment(fragments, text, styleState);
    }

    styleState = applyAssOverride(styleState, match[0]);
    cursor = index + match[0].length;
  }

  if (cursor < rawText.length) {
    pushStyledFragment(
      fragments,
      rawText
        .slice(cursor)
        .replaceAll(ASS_HARD_BREAK_RE, "\n")
        .replaceAll(ASS_HARD_SPACE_RE, " "),
      styleState,
    );
  }

  return normalizeSpeakerMarker(fragments);
};

const fragmentsToStyledText = (
  fragments: StyledFragment[],
): {
  text: string;
  styledSpans: SubtitleStyledSpan[];
} => {
  let text = "";
  const styledSpans: SubtitleStyledSpan[] = [];

  for (const fragment of fragments) {
    if (!fragment.text) continue;

    const start = text.length;
    text += fragment.text;
    const end = text.length;

    if (hasStyle(fragment.style)) {
      styledSpans.push({
        start,
        end,
        style: cloneStyle(fragment.style as SubtitleInlineStyle),
      });
    }
  }

  return {
    text,
    styledSpans,
  };
};

export const parseStyledSubtitleText = (
  rawText: string,
  format: SubtitleFormat | "generic",
): {
  text: string;
  styledSpans: SubtitleStyledSpan[];
} => {
  const fragments =
    format === "ass"
      ? parseAssStyledText(rawText)
      : parseHtmlLikeStyledText(rawText);

  return fragmentsToStyledText(fragments);
};

export const buildStyledFragmentsFromText = (
  text: string,
  styledSpans: SubtitleStyledSpan[] | undefined,
): StyledFragment[] => {
  if (!styledSpans?.length) {
    return [{ text }];
  }

  const fragments: StyledFragment[] = [];
  let cursor = 0;

  for (const span of styledSpans) {
    if (span.start > cursor) {
      pushStyledFragment(fragments, text.slice(cursor, span.start), undefined);
    }
    pushStyledFragment(fragments, text.slice(span.start, span.end), span.style);
    cursor = span.end;
  }

  if (cursor < text.length) {
    pushStyledFragment(fragments, text.slice(cursor), undefined);
  }

  return fragments;
};
