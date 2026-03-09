const MAX_TEXT_LENGTH = 450;

const REMOVABLE_TOKEN_FILTER = new RegExp(
  [
    // URLs.
    String.raw`(?:https?:\/\/|www\.)\S+`,
    String.raw`#[^\s#]+`,
    String.raw`auto-generated\s+by\s+youtube`,
    String.raw`provided\s+to\s+youtube\s+by`,
    String.raw`released\s+on`,
    String.raw`\bpaypal\b`,
    String.raw`\b0x[a-f0-9]{40}\b`,
    // Bitcoin legacy Base58 (mainnet P2PKH/P2SH).
    String.raw`\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b`,
    // Bitcoin Bech32 / Bech32m.
    String.raw`\b(?:bc1|tb1|bcrt1)[ac-hj-np-z02-9]{11,71}\b`,
    // TON raw format.
    String.raw`\b(?:-1|0):[a-f0-9]{64}\b`,
  ].join("|"),
  "giu",
);

const NOISE_CHARACTER_FILTER = /[\p{N}\p{P}\p{S}]+/gu;
const WHITESPACE_FILTER = /\s+/g;
const LETTER_FILTER = /\p{L}/u;

function trimToMaxLength(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd();
}

export function cleanText(title: string, description?: string): string {
  const raw = `${title ?? ""} ${description ?? ""}`.trim();
  if (!raw) return "";

  const cleaned = raw
    .normalize("NFKC")
    .replace(REMOVABLE_TOKEN_FILTER, " ")
    .replace(NOISE_CHARACTER_FILTER, " ")
    .replace(WHITESPACE_FILTER, " ")
    .trim();

  if (!LETTER_FILTER.test(cleaned)) {
    return "";
  }

  return trimToMaxLength(cleaned, MAX_TEXT_LENGTH);
}
