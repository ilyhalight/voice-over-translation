const WHITESPACE_RE = /\s/u;
const NO_SPACE_BEFORE_RE = /^[,.:;!?%)\]}>»]/u;
const NO_SPACE_AFTER_RE = /[([{<«'"-]$/u;
const CJK_CHAR_RE =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

export const shouldInsertSpaceBetweenTextFragments = (
  leftText: string,
  rightText: string,
): boolean => {
  const leftLastChar = leftText.at(-1) ?? "";
  const rightFirstChar = rightText[0] ?? "";

  if (!leftLastChar || !rightFirstChar) return false;
  if (WHITESPACE_RE.test(leftLastChar) || WHITESPACE_RE.test(rightFirstChar)) {
    return false;
  }
  if (
    NO_SPACE_AFTER_RE.test(leftLastChar) ||
    NO_SPACE_BEFORE_RE.test(rightFirstChar)
  ) {
    return false;
  }
  if (CJK_CHAR_RE.test(leftLastChar) && CJK_CHAR_RE.test(rightFirstChar)) {
    return false;
  }

  return true;
};
