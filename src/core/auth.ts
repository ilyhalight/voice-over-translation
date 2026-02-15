import type { Account } from "../types/storage";
import { votStorage } from "../utils/storage";

declare global {
  // instead of unsafeWindow
  const _userData: {
    avatar_id: string;
    username: string;
  };
}

async function handleAuthCallbackPage() {
  const { access_token: token, expires_in: expiresIn } = Object.fromEntries(
    new URLSearchParams(globalThis.location.hash.slice(1)),
  );

  if (!token || !expiresIn) {
    throw new Error("[VOT] Invalid token response");
  }

  const numExpiresIn = Number.parseInt(expiresIn, 10);
  if (Number.isNaN(numExpiresIn)) {
    throw new TypeError("[VOT] Invalid expires_in value");
  }

  await votStorage.set<Account>("account", {
    token,
    expires: Date.now() + numExpiresIn * 1000,
    username: undefined,
    avatarId: undefined,
  });
}

async function handleProfilePage() {
  const { avatar_id: avatarId, username } = _userData;

  if (!avatarId || !username) {
    throw new Error("[VOT] Invalid user data");
  }

  const data = await votStorage.get<Account>("account");
  if (!data) {
    throw new Error("[VOT] No account data found");
  }

  await votStorage.set<Account>("account", {
    ...data,
    username,
    avatarId,
  });
}

export async function initAuth() {
  if (globalThis.location.pathname === "/auth/callback") {
    return await handleAuthCallbackPage();
  }

  if (globalThis.location.pathname === "/my/profile") {
    return await handleProfilePage();
  }
}
