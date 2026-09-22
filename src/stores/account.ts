import type VOTClient from "@vot.js/ext";
import { createStore } from "solid-js/store";

import type { Account, StorageData } from "../types/storage";
import { hasValidAccountToken, isAccountExpired } from "../utils/account";
import { votStorage } from "../utils/storage";

type AccountStore = {
  isRefreshing: boolean;
  isLoggedIn: boolean;
  username?: string;
  avatarId?: string;
  expires?: number;
  token?: string;
};

type AccountStateOwner = {
  data?: Partial<StorageData>;
  votClient?: VOTClient;
};

function createInitialState(): AccountStore {
  return {
    isRefreshing: false,
    isLoggedIn: false,
    username: undefined,
    avatarId: undefined,
    expires: undefined,
    token: undefined,
  };
}

export const [account, setAccount] = createStore<AccountStore>(
  createInitialState(),
);

export function resetAccount() {
  setAccount(createInitialState());
}

export function updateAccount(data: Partial<Account>) {
  if (hasValidAccountToken(data)) {
    return setAccount({
      isLoggedIn: true,
      ...data,
    });
  }

  resetAccount();
}

export async function updateAccountFromStorage() {
  const data = await votStorage.get<Partial<Account>>("account", {});
  updateAccount(data);
}

function clearAccountState(owner?: AccountStateOwner): void {
  if (owner?.data) {
    owner.data.account = {};
  }
  if (owner?.votClient) {
    owner.votClient.provider.apiToken = undefined;
  }
}

export async function deleteAccount(owner?: AccountStateOwner): Promise<void> {
  clearAccountState(owner);
  await votStorage.delete("account");
  resetAccount();
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
