import type { StorageData } from "../types/storage";

export function hasAccountToken(account?: Partial<StorageData["account"]>) {
  return typeof account?.token === "string" && account.token.length > 0;
}

export function isAccountExpired(
  account?: Partial<StorageData["account"]>,
  now = Date.now(),
) {
  return (
    hasAccountToken(account) &&
    typeof account?.expires === "number" &&
    Number.isFinite(account.expires) &&
    account.expires <= now
  );
}

export function hasValidAccountToken(
  account?: Partial<StorageData["account"]>,
  now = Date.now(),
) {
  return hasAccountToken(account) && !isAccountExpired(account, now);
}
