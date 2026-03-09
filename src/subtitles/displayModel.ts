import type { SubtitleInlineStyle, SubtitleStyledSpan } from "./types";

type StyledTextSegment = {
  text: string;
  style?: SubtitleInlineStyle;
};

type MutableInlineStyle = {
  italic: boolean;
  bold: boolean;
  underline: boolean;
};

const HTML_TAG_RE = /^<\s*(\/?)\s*([a-z0-9]+)(?:[.\s][^>]*)?>/iu;
const ASS_OVERRIDE_RE = /^\{([^}]*)\}/u;
const LEADING_SPEAKER_MARKER_RE = /^(\s*)>>\s*/u;

const toTokenStyle = (
  style: MutableInlineStyle,
): SubtitleInlineStyle | undefined => {
  const tokenStyle: SubtitleInlineStyle = {};
  if (style.italic) tokenStyle.italic = true;
  if (style.bold) tokenStyle.bold = true;
  if (style.underline) tokenStyle.underline = true;
  return Object.keys(tokenStyle).length > 0 ? tokenStyle : undefined;
};

const stylesEqual = (
  left: SubtitleInlineStyle | undefined,
  right: SubtitleInlineStyle | undefined,
): boolean =>
  Boolean(left?.italic) === Boolean(right?.italic) &&
  Boolean(left?.bold) === Boolean(right?.bold) &&
  Boolean(left?.underline) === Boolean(right?.underline);

const pushSegment = (
  segments: StyledTextSegment[],
  text: string,
  style: MutableInlineStyle,
) => {
  if (!text) return;

  const tokenStyle = toTokenStyle(style);
  const previous = segments.at(-1);
  if (previous && stylesEqual(previous.style, tokenStyle)) {
    previous.text += text;
    return;
  }

  segments.push({
    text,
    style: tokenStyle,
  });
};

const applyAssStyleDirective = (
  directive: string,
  style: MutableInlineStyle,
) => {
  const match = /^\\([ibu])([01])$/u.exec(directive.trim());
  if (!match) return;

  const enabled = match[2] === "1";
  if (match[1] === "i") {
    style.italic = enabled;
    return;
  }
  if (match[1] === "b") {
    style.bold = enabled;
    return;
  }
  if (match[1] === "u") {
    style.underline = enabled;
  }
};

const normalizeLeadingSpeakerMarker = (segments: StyledTextSegment[]) => {
  for (const segment of segments) {
    if (!segment.text) continue;

    const normalized = segment.text.replace(LEADING_SPEAKER_MARKER_RE, "$1");
    segment.text = normalized;
    if (normalized.length > 0) {
      break;
    }
  }

  while (segments[0]?.text === "") {
    segments.shift();
  }
};

export const buildStyledDisplayModel = (
  rawText: string,
): {
  text: string;
  styledSpans: SubtitleStyledSpan[];
} => {
  const segments: StyledTextSegment[] = [];
  const activeStyle: MutableInlineStyle = {
    italic: false,
    bold: false,
    underline: false,
  };

  let cursor = 0;
  while (cursor < rawText.length) {
    const remainder = rawText.slice(cursor);

    if (remainder.startsWith("\\N") || remainder.startsWith("\\n")) {
      pushSegment(segments, "\n", activeStyle);
      cursor += 2;
      continue;
    }

    if (remainder.startsWith("\\h")) {
      pushSegment(segments, " ", activeStyle);
      cursor += 2;
      continue;
    }

    if (remainder[0] === "\n") {
      pushSegment(segments, "\n", activeStyle);
      cursor += 1;
      continue;
    }

    const assMatch = ASS_OVERRIDE_RE.exec(remainder);
    if (assMatch) {
      const directives = assMatch[1].match(/\\[ibu][01]/gu) ?? [];
      for (const directive of directives) {
        applyAssStyleDirective(directive, activeStyle);
      }
      cursor += assMatch[0].length;
      continue;
    }

    const htmlMatch = HTML_TAG_RE.exec(remainder);
    if (htmlMatch) {
      const isClosing = htmlMatch[1] === "/";
      const tagName = htmlMatch[2].toLowerCase();
      if (tagName === "br") {
        pushSegment(segments, "\n", activeStyle);
      } else if (tagName === "i") {
        activeStyle.italic = !isClosing;
      } else if (tagName === "b") {
        activeStyle.bold = !isClosing;
      } else if (tagName === "u") {
        activeStyle.underline = !isClosing;
      }
      cursor += htmlMatch[0].length;
      continue;
    }

    pushSegment(segments, remainder[0], activeStyle);
    cursor += 1;
  }

  normalizeLeadingSpeakerMarker(segments);

  const styledSpans: SubtitleStyledSpan[] = [];
  let text = "";
  for (const segment of segments) {
    if (!segment.text) continue;
    const start = text.length;
    text += segment.text;
    const end = text.length;
    styledSpans.push({
      start,
      end,
      style: segment.style,
    });
  }

  const normalizedText = text.replaceAll("\u00A0", " ");
  const leadingTrim = /^\s*/u.exec(normalizedText)?.[0].length ?? 0;
  const trailingTrim = /\s*$/u.exec(normalizedText)?.[0].length ?? 0;
  const trimmedEnd = Math.max(
    leadingTrim,
    normalizedText.length - trailingTrim,
  );
  const finalText = normalizedText.slice(leadingTrim, trimmedEnd);
  const finalSpans = styledSpans
    .map((span) => ({
      start: Math.max(0, span.start - leadingTrim),
      end: Math.max(0, span.end - leadingTrim),
      style: span.style,
    }))
    .filter((span) => span.end > span.start && span.start < finalText.length)
    .map((span) => ({
      ...span,
      end: Math.min(span.end, finalText.length),
    }));

  return {
    text: finalText,
    styledSpans: finalSpans,
  };
};

export const getStyleForRange = (
  styledSpans: SubtitleStyledSpan[] | undefined,
  start: number,
  end: number,
): SubtitleInlineStyle | undefined => {
  if (!styledSpans?.length || end <= start) {
    return undefined;
  }

  const overlap = styledSpans.find(
    (span) => start < span.end && end > span.start && span.style,
  );
  return overlap?.style;
};
