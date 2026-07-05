import type {
  SubtitleInlineStyle,
  SubtitleStyledSpan,
} from "../types/subtitles";
import {
  normalizeCssColorValue,
  normalizeSubtitleInlineStyle,
  subtitleInlineStylesEqual,
} from "./inlineStyle";

type StyledTextSegment = {
  text: string;
  style?: SubtitleInlineStyle;
};

type MutableInlineStyle = {
  italic: boolean;
  bold: boolean;
  underline: boolean;
  color?: string;
  classes: string[];
};

type HtmlStyleFrame = {
  tagName: string;
  previousStyle: MutableInlineStyle;
};

type HtmlTagToken = {
  tagName: string;
  attrsRaw: string;
  isClosing: boolean;
  length: number;
};

const LEADING_SPEAKER_MARKER_RE = /^(\s*)>>\s*/u;
const ATTACHED_TIME_WORD_RE = /(\d{1,2}:\d{2}(?::\d{2})?)(?=[\p{L}\p{M}])/gu;
const LETTER_OR_MARK_RUN_RE = /[\p{L}\p{M}]+/uy;
const DIGIT_RUN_RE = /\d+/y;
const ASS_DIRECTIVE_RE = /\\[^\\]+/gu;
const ASS_STYLE_TOGGLE_RE = /^\\([ibu])([01])$/u;
const ASS_PRIMARY_COLOR_RE = /^\\(?:1?c|c)&H([0-9a-f]{6,8})&$/iu;
const ASS_STYLE_RESET_RE = /^\\r[^\\}]*$/u;
const COMPLEX_DISPLAY_CONTROL_RE = /[<{\\]/u;

const cloneMutableInlineStyle = (
  style: MutableInlineStyle,
): MutableInlineStyle => ({
  italic: style.italic,
  bold: style.bold,
  underline: style.underline,
  color: style.color,
  classes: [...style.classes],
});

const assignMutableInlineStyle = (
  target: MutableInlineStyle,
  source: MutableInlineStyle,
): void => {
  target.italic = source.italic;
  target.bold = source.bold;
  target.underline = source.underline;
  target.color = source.color;
  target.classes = [...source.classes];
};

const resetMutableInlineStyle = (style: MutableInlineStyle): void => {
  style.italic = false;
  style.bold = false;
  style.underline = false;
  style.color = undefined;
  style.classes = [];
};

const toTokenStyle = (
  style: MutableInlineStyle,
): SubtitleInlineStyle | undefined =>
  normalizeSubtitleInlineStyle({
    italic: style.italic,
    bold: style.bold,
    underline: style.underline,
    color: style.color,
    classes: style.classes,
  });

const pushSegment = (
  segments: StyledTextSegment[],
  text: string,
  style: MutableInlineStyle,
) => {
  if (!text) return;

  const tokenStyle = toTokenStyle(style);
  const previous = segments.at(-1);
  if (previous && subtitleInlineStylesEqual(previous.style, tokenStyle)) {
    previous.text += text;
    return;
  }

  segments.push({
    text,
    style: tokenStyle,
  });
};

const isHtmlTagSpace = (char: string): boolean => char === " " || char === "\t";

const isAsciiAlphaNumeric = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122)
  );
};

const parseHtmlTagToken = (text: string): HtmlTagToken | null => {
  if (!text.startsWith("<")) {
    return null;
  }

  let index = 1;
  while (isHtmlTagSpace(text[index] ?? "")) {
    index += 1;
  }

  const isClosing = text[index] === "/";
  if (isClosing) {
    index += 1;
    while (isHtmlTagSpace(text[index] ?? "")) {
      index += 1;
    }
  }

  const tagNameStart = index;
  while (isAsciiAlphaNumeric(text[index] ?? "")) {
    index += 1;
  }

  if (index === tagNameStart) {
    return null;
  }

  const tagEndIndex = text.indexOf(">", index);
  if (tagEndIndex < 0) {
    return null;
  }

  return {
    tagName: text.slice(tagNameStart, index).toLowerCase(),
    attrsRaw: text.slice(index, tagEndIndex),
    isClosing,
    length: tagEndIndex + 1,
  };
};

const parseAssColorToCssHex = (value: string): string | undefined => {
  const normalized = value.trim();
  if (!/^[0-9a-f]{6,8}$/iu.test(normalized)) {
    return undefined;
  }

  const bgr = normalized.slice(-6);
  const blue = bgr.slice(0, 2);
  const green = bgr.slice(2, 4);
  const red = bgr.slice(4, 6);
  return normalizeCssColorValue(`#${red}${green}${blue}`);
};

const applyAssStyleDirective = (
  directive: string,
  style: MutableInlineStyle,
) => {
  const toggleMatch = ASS_STYLE_TOGGLE_RE.exec(directive.trim());
  if (toggleMatch) {
    const enabled = toggleMatch[2] === "1";
    if (toggleMatch[1] === "i") {
      style.italic = enabled;
      return;
    }
    if (toggleMatch[1] === "b") {
      style.bold = enabled;
      return;
    }
    if (toggleMatch[1] === "u") {
      style.underline = enabled;
      return;
    }
  }

  if (ASS_STYLE_RESET_RE.test(directive.trim())) {
    resetMutableInlineStyle(style);
    return;
  }

  const colorMatch = ASS_PRIMARY_COLOR_RE.exec(directive.trim());
  if (colorMatch) {
    style.color = parseAssColorToCssHex(colorMatch[1]);
  }
};

const applyAssOverrideBlock = (
  rawDirectives: string,
  style: MutableInlineStyle,
): void => {
  const directives = rawDirectives.match(ASS_DIRECTIVE_RE) ?? [];
  for (const directive of directives) {
    applyAssStyleDirective(directive, style);
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

const normalizeAttachedTimeExpressions = (segments: StyledTextSegment[]) => {
  for (const segment of segments) {
    if (!segment.text) continue;
    segment.text = segment.text.replaceAll(ATTACHED_TIME_WORD_RE, "$1 ");
  }
};

const normalizeAttachedWordNumberExpressions = (
  segments: StyledTextSegment[],
) => {
  for (const segment of segments) {
    if (!segment.text) continue;

    segment.text = normalizeAttachedWordNumberExpression(segment.text);
  }
};

const isAsciiCodeLike = (letters: string): boolean =>
  /^[A-Za-z]{1,3}$/u.test(letters) ||
  (letters.length === 1 &&
    letters === letters.toLocaleUpperCase() &&
    letters !== letters.toLocaleLowerCase());

const readRunEndIndex = (
  text: string,
  startIndex: number,
  regex: RegExp,
): number => {
  regex.lastIndex = startIndex;
  const match = regex.exec(text);
  return match ? regex.lastIndex : startIndex;
};

const getNextCodePointIndex = (text: string, startIndex: number): number => {
  const codePoint = text.codePointAt(startIndex) ?? 0;
  return startIndex + (codePoint > 0xffff ? 2 : 1);
};

const formatAttachedWordNumberMatch = (
  match: string,
  letters: string,
  digits: string,
  lettersFirst: boolean,
): string => {
  if (isAsciiCodeLike(letters)) {
    return match;
  }

  return lettersFirst ? `${letters} ${digits}` : `${digits} ${letters}`;
};

const normalizeAttachedWordNumberExpression = (text: string): string => {
  const parts: string[] = [];

  for (let index = 0; index < text.length; ) {
    const lettersEnd = readRunEndIndex(text, index, LETTER_OR_MARK_RUN_RE);
    if (lettersEnd > index) {
      const digitsEnd = readRunEndIndex(text, lettersEnd, DIGIT_RUN_RE);
      if (digitsEnd > lettersEnd) {
        const letters = text.slice(index, lettersEnd);
        const digits = text.slice(lettersEnd, digitsEnd);
        const match = text.slice(index, digitsEnd);
        parts.push(formatAttachedWordNumberMatch(match, letters, digits, true));
        index = digitsEnd;
        continue;
      }

      parts.push(text.slice(index, lettersEnd));
      index = lettersEnd;
      continue;
    } else {
      const digitsEnd = readRunEndIndex(text, index, DIGIT_RUN_RE);
      if (digitsEnd > index) {
        const lettersEndAfterDigits = readRunEndIndex(
          text,
          digitsEnd,
          LETTER_OR_MARK_RUN_RE,
        );
        if (lettersEndAfterDigits > digitsEnd) {
          const digits = text.slice(index, digitsEnd);
          const letters = text.slice(digitsEnd, lettersEndAfterDigits);
          const match = text.slice(index, lettersEndAfterDigits);
          parts.push(
            formatAttachedWordNumberMatch(match, letters, digits, false),
          );
          index = lettersEndAfterDigits;
          continue;
        }

        parts.push(text.slice(index, digitsEnd));
        index = digitsEnd;
        continue;
      }
    }

    const nextIndex = getNextCodePointIndex(text, index);
    parts.push(text.slice(index, nextIndex));
    index = nextIndex;
  }

  return parts.join("");
};

const extractHtmlTagClasses = (attrsRaw: string): string[] | undefined => {
  const normalized = attrsRaw.trim();
  if (!normalized.startsWith(".")) {
    return undefined;
  }

  const classNames = normalized.split(/\s+/u, 1)[0].split(".").filter(Boolean);
  return classNames.length ? classNames : undefined;
};

const extractHtmlFontColor = (attrsRaw: string): string | undefined => {
  const match = /\bcolor\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/iu.exec(
    attrsRaw,
  );
  const rawColor = match?.[1] ?? match?.[2] ?? match?.[3];
  return rawColor ? normalizeCssColorValue(rawColor) : undefined;
};

const popHtmlStyleFrame = (
  tagName: string,
  stack: HtmlStyleFrame[],
  activeStyle: MutableInlineStyle,
): void => {
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    if (stack[i].tagName !== tagName) continue;
    const [frame] = stack.splice(i, 1);
    if (!frame) return;
    assignMutableInlineStyle(activeStyle, frame.previousStyle);
    return;
  }

  if (tagName === "b") {
    activeStyle.bold = false;
    return;
  }
  if (tagName === "i") {
    activeStyle.italic = false;
    return;
  }
  if (tagName === "u") {
    activeStyle.underline = false;
    return;
  }
  if (tagName === "font") {
    activeStyle.color = undefined;
    return;
  }
  if (tagName === "c") {
    activeStyle.classes = [];
  }
};

const applyHtmlTagStyle = (
  htmlTag: HtmlTagToken,
  segments: StyledTextSegment[],
  activeStyle: MutableInlineStyle,
  styleStack: HtmlStyleFrame[],
): void => {
  const { attrsRaw, isClosing, tagName } = htmlTag;

  if (tagName === "br") {
    pushSegment(segments, "\n", activeStyle);
    return;
  }

  if (isClosing) {
    popHtmlStyleFrame(tagName, styleStack, activeStyle);
    return;
  }

  if (!["b", "i", "u", "font", "c"].includes(tagName)) {
    return;
  }

  styleStack.push({
    tagName,
    previousStyle: cloneMutableInlineStyle(activeStyle),
  });

  if (tagName === "b") {
    activeStyle.bold = true;
    return;
  }

  if (tagName === "i") {
    activeStyle.italic = true;
    return;
  }

  if (tagName === "u") {
    activeStyle.underline = true;
    return;
  }

  if (tagName === "font") {
    const color = extractHtmlFontColor(attrsRaw);
    if (color) {
      activeStyle.color = color;
    }
    return;
  }

  const classes = extractHtmlTagClasses(attrsRaw);
  activeStyle.classes = classes ?? [];
};

const consumeDisplayControlToken = (
  rawText: string,
  cursor: number,
  segments: StyledTextSegment[],
  activeStyle: MutableInlineStyle,
  styleStack: HtmlStyleFrame[],
): number | null => {
  const remainder = rawText.slice(cursor);

  if (
    remainder.startsWith(String.raw`\N`) ||
    remainder.startsWith(String.raw`\n`)
  ) {
    pushSegment(segments, "\n", activeStyle);
    return cursor + 2;
  }

  if (remainder.startsWith(String.raw`\h`)) {
    pushSegment(segments, " ", activeStyle);
    return cursor + 2;
  }

  if (remainder.startsWith("\n")) {
    pushSegment(segments, "\n", activeStyle);
    return cursor + 1;
  }

  if (remainder.startsWith("{")) {
    const assOverrideEndIndex = remainder.indexOf("}", 1);
    if (assOverrideEndIndex > 0) {
      applyAssOverrideBlock(
        remainder.slice(1, assOverrideEndIndex),
        activeStyle,
      );
      return cursor + assOverrideEndIndex + 1;
    }
  }

  const htmlTag = parseHtmlTagToken(remainder);
  if (!htmlTag) {
    return null;
  }

  applyHtmlTagStyle(htmlTag, segments, activeStyle, styleStack);
  return cursor + htmlTag.length;
};

const buildStyledSpans = (segments: StyledTextSegment[]) => {
  const styledSpans: SubtitleStyledSpan[] = [];
  let text = "";

  for (const segment of segments) {
    if (!segment.text) continue;
    const start = text.length;
    text += segment.text;
    styledSpans.push({
      start,
      end: text.length,
      style: segment.style,
    });
  }

  return { text, styledSpans };
};

const trimStyledDisplayResult = (
  text: string,
  styledSpans: SubtitleStyledSpan[],
): {
  text: string;
  styledSpans: SubtitleStyledSpan[];
} => {
  const normalizedText = text.replaceAll("\u00A0", " ");
  const leadingTrim = normalizedText.length - normalizedText.trimStart().length;
  const trailingTrim = normalizedText.length - normalizedText.trimEnd().length;
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

const trimPlainDisplayText = (text: string): string => {
  const normalizedText = text.replaceAll("\u00A0", " ");
  const leadingTrim = normalizedText.length - normalizedText.trimStart().length;
  const trailingTrim = normalizedText.length - normalizedText.trimEnd().length;
  const trimmedEnd = Math.max(
    leadingTrim,
    normalizedText.length - trailingTrim,
  );
  return normalizedText.slice(leadingTrim, trimmedEnd);
};

const buildPlainDisplayModel = (
  rawText: string,
): {
  text: string;
  styledSpans: SubtitleStyledSpan[];
} => ({
  text: trimPlainDisplayText(
    normalizeAttachedWordNumberExpression(
      rawText
        .replace(LEADING_SPEAKER_MARKER_RE, "$1")
        .replaceAll(ATTACHED_TIME_WORD_RE, "$1 "),
    ),
  ),
  styledSpans: [],
});

export const buildStyledDisplayModel = (
  rawText: string,
): {
  text: string;
  styledSpans: SubtitleStyledSpan[];
} => {
  if (!rawText) {
    return { text: "", styledSpans: [] };
  }

  if (!COMPLEX_DISPLAY_CONTROL_RE.test(rawText)) {
    return buildPlainDisplayModel(rawText);
  }

  const segments: StyledTextSegment[] = [];
  const activeStyle: MutableInlineStyle = {
    italic: false,
    bold: false,
    underline: false,
    color: undefined,
    classes: [],
  };
  const styleStack: HtmlStyleFrame[] = [];

  let cursor = 0;
  while (cursor < rawText.length) {
    const nextCursor = consumeDisplayControlToken(
      rawText,
      cursor,
      segments,
      activeStyle,
      styleStack,
    );
    if (nextCursor !== null) {
      cursor = nextCursor;
      continue;
    }

    pushSegment(segments, rawText[cursor], activeStyle);
    cursor += 1;
  }

  normalizeLeadingSpeakerMarker(segments);
  normalizeAttachedTimeExpressions(segments);
  normalizeAttachedWordNumberExpressions(segments);
  const built = buildStyledSpans(segments);
  return trimStyledDisplayResult(built.text, built.styledSpans);
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
