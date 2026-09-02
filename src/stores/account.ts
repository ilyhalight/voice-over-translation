import { createStore } from "solid-js/store";
import type { Account } from "../types/storage";
import { hasValidAccountToken } from "../utils/account";
import { votStorage } from "../utils/storage";

export type AccountStore = {
  isLoggedIn: boolean;
  username?: string;
  avatarId?: string;
  expires?: number;
  token?: string;
};

function createInitialState(): AccountStore {
  return {
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
