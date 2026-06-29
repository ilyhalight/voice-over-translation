import type { StorageData } from "../types/storage";
import { votStorage } from "./storage";

type AccountStateOwner = {
  data?: Partial<StorageData>;
  votClient?: {
    apiToken?: string;
  };
};

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

export function clearAccountState(owner?: AccountStateOwner): void {
  if (owner?.data) {
    owner.data.account = {};
  }
  if (owner?.votClient) {
    owner.votClient.apiToken = undefined;
  }
}

export async function deleteAccount(owner?: AccountStateOwner): Promise<void> {
  clearAccountState(owner);
  await votStorage.delete("account");
}

export async function deleteExpiredAccount(
  owner?: AccountStateOwner,
  now = Date.now(),
): Promise<boolean> {
  if (!isAccountExpired(owner?.data?.account, now)) {
    return false;
  }

  await deleteAccount(owner);
  return true;
}
