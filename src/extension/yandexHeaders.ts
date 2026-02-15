export const YANDEX_API_HOST = "api.browser.yandex.ru";

export const ALLOWED_UA_CH_HEADERS = new Set([
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
  "sec-ch-ua-full-version-list",
]);

export const SUPPRESSED_UA_CH_HEADERS = [
  "sec-ch-ua-full-version",
  "sec-ch-ua-platform-version",
  "sec-ch-ua-arch",
  "sec-ch-ua-bitness",
  "sec-ch-ua-model",
  "sec-ch-ua-wow64",
] as const;

const SUPPRESSED_UA_CH_HEADERS_SET = new Set<string>(SUPPRESSED_UA_CH_HEADERS);

export function isYandexApiHostname(hostname: string): boolean {
  return String(hostname || "") === YANDEX_API_HOST;
}

export function normalizeHeaderName(name: string): string {
  return String(name || "").trim();
}

export function shouldStripYandexHeader(name: string): boolean {
  const normalized = normalizeHeaderName(name).toLowerCase();
  if (!normalized) return false;
  if (normalized === "origin" || normalized === "referer") return true;
  if (SUPPRESSED_UA_CH_HEADERS_SET.has(normalized)) return true;
  if (
    normalized.startsWith("sec-ch-ua") &&
    !ALLOWED_UA_CH_HEADERS.has(normalized)
  )
    return true;
  return false;
}

export function filterYandexHeadersForDnr(
  headers: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [k, v] of Object.entries(headers || {})) {
    const key = normalizeHeaderName(k);
    if (!key) continue;
    if (shouldStripYandexHeader(key)) continue;
    result[key] = String(v);
  }

  return result;
}
