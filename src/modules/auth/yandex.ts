import { getUUID } from "@vot.js/shared/secure";
import { captureException } from "#modules/telemetry/client.ts";
import { setAccount, updateAccount } from "#stores/account.ts";
import type { Account } from "#types/storage.ts";
import { GM_fetch } from "#utils/gm.ts";
import { votStorage } from "#utils/storage.ts";
import { base64UrlEncode } from "#utils/utils.ts";
import {
  YANDEX_AUTH_CLIENT_ID,
  YANDEX_AUTH_REDIRECT_URI,
  YANDEX_AUTH_TOKEN_URL,
  YANDEX_AUTH_URL,
  YANDEX_USER_INFO_URL,
} from "./consts";
import type { AuthMessageData } from "./types/message";
import type {
  AuthError,
  TokenError,
  TokenInfo,
  TokenResponse,
  UserInfo,
  UserInfoResponse,
} from "./types/yandex";

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

// Yandex refused the code or token (expired, revoked, already used): a normal
// user state rather than a failure worth reporting.
class AuthRejectedError extends Error {
  override name = "AuthRejectedError";
}

class AuthResponseError extends Error {
  override name = "AuthResponseError";
  readonly status: number;

  constructor(status: number, cause: unknown) {
    super(`Unreadable Yandex auth response (HTTP ${status})`, { cause });
    this.status = status;
  }
}

async function readAuthJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch (err) {
    throw new AuthResponseError(res.status, err);
  }
}

// Auth errors may echo tokens or response bodies, so only a fixed message is sent.
function reportAuthFailure(
  error: unknown,
  operation: string,
  message: string,
): void {
  if (error instanceof AuthRejectedError) return;

  captureException(error, {
    source: "auth",
    operation,
    redactedMessage: message,
    extra:
      error instanceof AuthResponseError ? { status: error.status } : undefined,
  });
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
    }).toString(),
  });
  const data = await readAuthJson<TokenResponse>(res);
  if (isTokenError(data)) {
    throw new AuthRejectedError(
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
  const data = await readAuthJson<UserInfoResponse>(res);
  if (isAuthError(data)) {
    throw new AuthRejectedError(
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
    const updatedAccount: Account = {
      ...account,
      username,
      avatarId,
    };
    await votStorage.set<Account>("account", updatedAccount);
    updateAccount(updatedAccount);
  } catch (err) {
    console.error("[VOT] Failed to fetch user info:", err);
    reportAuthFailure(
      err,
      "updateAccountInfo",
      "Failed to refresh Yandex account info",
    );
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

  let token: TokenInfo;
  try {
    token = await getOAuthTokenByCode(code);
  } catch (err) {
    reportAuthFailure(
      err,
      "exchangeCode",
      "Failed to exchange Yandex auth code",
    );
    throw err;
  }
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
