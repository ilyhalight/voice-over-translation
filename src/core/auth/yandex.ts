import { getUUID } from "@vot.js/shared/secure";

import {
  YANDEX_AUTH_CLIENT_ID,
  YANDEX_AUTH_REDIRECT_URI,
  YANDEX_AUTH_TOKEN_URL,
  YANDEX_AUTH_URL,
  YANDEX_USER_INFO_URL,
} from "../../config/auth";
import { setAccount, updateAccount } from "../../stores/account";
import type { AuthMessageData } from "../../types/core/auth/message";
import type {
  AuthError,
  TokenError,
  TokenInfo,
  TokenResponse,
  UserInfo,
  UserInfoResponse,
} from "../../types/core/auth/yandex";
import type { Account } from "../../types/storage";
import { GM_fetch } from "../../utils/gm";
import { votStorage } from "../../utils/storage";
import { base64UrlEncode } from "../../utils/utils";

function createCodeVerifier(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
}

async function createCodeChallenge(codeVerifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier),
  );

  return base64UrlEncode(new Uint8Array(digest));
}

const isTokenError = (data: unknown): data is TokenError => {
  return (
    typeof data === "object" &&
    data !== null &&
    Object.hasOwn(data, "error") &&
    typeof (data as any).error === "string"
  );
};

async function getOAuthTokenByCode(code: string): Promise<TokenInfo> {
  const res = await GM_fetch(YANDEX_AUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: YANDEX_AUTH_CLIENT_ID,
      redirect_uri: YANDEX_AUTH_REDIRECT_URI,
      code_verifier: sessionStorage.getItem("votYandexCodeVerifier") || "",
    }),
  });
  const data = (await res.json()) as TokenResponse;
  if (isTokenError(data)) {
    throw new Error(
      `Failed to fetch yandex OAuth token: ${data.error_description} (error: ${data.error})`,
    );
  }

  return data;
}

const isAuthError = (data: unknown): data is AuthError => {
  return (
    typeof data === "object" &&
    data !== null &&
    Object.hasOwn(data, "status") &&
    (data as any).status === "error"
  );
};

async function getUserInfo(token: string): Promise<UserInfo> {
  const res = await GM_fetch(`${YANDEX_USER_INFO_URL}?format=json`, {
    method: "GET",
    headers: {
      Authorization: `OAuth ${token}`,
    },
  });
  const data = (await res.json()) as UserInfoResponse;
  if (isAuthError(data)) {
    throw new Error(
      `[VOT] Failed to fetch yandex user info: ${data.message} (code: ${data.code})`,
    );
  }

  return data;
}

export async function updateAccountInfo() {
  const account = await votStorage.get<Account>("account");
  if (!account) {
    throw new Error("[VOT] No account found");
  }

  let username: string;
  let avatarId: string;
  try {
    setAccount("isRefreshing", true);
    const userInfo = await getUserInfo(account.token);
    username = userInfo.login;
    avatarId = userInfo.default_avatar_id;
    await votStorage.set<Account>("account", {
      ...account,
      username,
      avatarId,
    });
    updateAccount({
      ...account,
      token: account.token,
      expires: account.expires,
    });
  } catch (err) {
    console.error("[VOT] Failed to fetch user info:", err);
  } finally {
    setAccount("isRefreshing", false);
  }
}

export async function updateAccountByCallbackData(
  data: AuthMessageData,
): Promise<void> {
  const { state, code } = data;
  const storedState = sessionStorage.getItem("votYandexState");
  if (!state || state !== storedState) {
    throw new Error("[VOT] Invalid state value");
  }

  if (!code) {
    throw new Error("[VOT] Invalid auth code response");
  }

  const token = await getOAuthTokenByCode(code);
  const expires = Date.now() + token.expires_in * 1000;
  const account: Account = {
    token: token.access_token,
    expires,
    username: undefined,
    avatarId: undefined,
  };
  await votStorage.set<Account>("account", account);
  updateAccount(account);
  sessionStorage.removeItem("votYandexState");
  sessionStorage.removeItem("votYandexCodeVerifier");

  await updateAccountInfo();
}

export const createAuthLink = async (): Promise<string> => {
  const state = getUUID();
  const codeVerifier = createCodeVerifier();
  const codeChallenge = await createCodeChallenge(codeVerifier);
  sessionStorage.setItem("votYandexCodeVerifier", codeVerifier);
  sessionStorage.setItem("votYandexState", state);

  const params = new URLSearchParams({
    client_id: YANDEX_AUTH_CLIENT_ID,
    response_type: "code",
    redirect_uri: YANDEX_AUTH_REDIRECT_URI,
    et: Date.now().toString(),
    force_confirm: "1",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${YANDEX_AUTH_URL}?${params.toString()}`;
};
