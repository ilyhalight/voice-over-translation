const URL_FILTER = /\b(?:https?:\/\/|www\.)\S+/gi;
const HASHTAG_FILTER = /#[^\s#]+/g;
const YOUTUBE_META_FILTER =
  /auto-generated\s+by\s+youtube|provided\s+to\s+youtube\s+by|released\s+on/gi;
const PAYPAL_FILTER = /paypal?/gi;
const ETH_ADDRESS_FILTER = /0x[\da-f]{40}/gi;
const BTC_ADDRESS_FILTER = /[13][1-9a-z]{25,34}/gi;
const BTC_BECH32_FILTER = /4[\dab][1-9a-z]{93}/gi;
const TON_ADDRESS_FILTER = /t[1-9a-z]{33}/gi;
const TEXT_FILTERS = [
  URL_FILTER,
  HASHTAG_FILTER,
  YOUTUBE_META_FILTER,
  PAYPAL_FILTER,
  ETH_ADDRESS_FILTER,
  BTC_ADDRESS_FILTER,
  BTC_BECH32_FILTER,
  TON_ADDRESS_FILTER,
] as const;

export function cleanText(title: string, description?: string) {
  const raw = `${title ?? ""} ${description ?? ""}`.trim();
  if (!raw) return "";

  let cleaned = raw;
  for (const filter of TEXT_FILTERS) {
    cleaned = cleaned.replaceAll(filter, "");
  }

  return cleaned
    .replaceAll(/[\p{P}\p{S}]+/gu, " ")
    .replaceAll(/\s+/g, " ")
    .trim()
    .slice(0, 450);
}
