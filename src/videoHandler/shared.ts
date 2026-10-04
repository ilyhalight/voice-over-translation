import { GM_fetch } from "../utils/gm";

let _countryCode: string | undefined;
let countryCodeRequest: Promise<void> | undefined;

export function getCountryCode(): string | undefined {
  return _countryCode;
}

export function setCountryCode(next: string | undefined) {
  _countryCode = next;
}

export function ensureCountryCode(): Promise<void> {
  if (getCountryCode()) {
    return Promise.resolve();
  }

  countryCodeRequest ??= (async () => {
    try {
      const response = await GM_fetch(
        "https://cloudflare-dns.com/cdn-cgi/trace",
        {
          timeout: 7000,
        },
      );
      const trace = await response.text();
      const loc = trace.split("\n").find((line) => line.startsWith("loc="));
      setCountryCode(loc?.slice(4, 6).toUpperCase());
    } catch (err) {
      console.error("[VOT] Error getting country:", err);
    }
  })().finally(() => {
    countryCodeRequest = undefined;
  });
  return countryCodeRequest;
}
