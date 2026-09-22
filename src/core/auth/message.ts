import {
  AUTH_DATA_MESSAGE_SOURCE,
  AUTH_DATA_MESSAGE_TYPE,
  type AuthDataMessage,
  type AuthMessageData,
} from "../../types/core/auth/message";

function createAuthDataMessage(data: AuthMessageData): AuthDataMessage {
  return {
    source: AUTH_DATA_MESSAGE_SOURCE,
    type: AUTH_DATA_MESSAGE_TYPE,
    data,
  };
}

export function isAuthDataMessage(value: unknown): value is AuthDataMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AuthDataMessage>;
  return (
    candidate.source === AUTH_DATA_MESSAGE_SOURCE &&
    candidate.type === AUTH_DATA_MESSAGE_TYPE
  );
}

export async function handleAuthCallbackPage() {
  if (globalThis.location.pathname !== "/verification_code") {
    return;
  }

  const { state, code }: Partial<AuthMessageData> = Object.fromEntries(
    new URLSearchParams(globalThis.location.search),
  );
  if (!state || !code) {
    throw new Error("[VOT] Missing state or code value");
  }

  const target = globalThis.opener;
  if (!target || typeof target.postMessage !== "function") {
    return;
  }

  target.postMessage(
    createAuthDataMessage({
      state,
      code,
    }),
    "*",
  );
  globalThis.close();
}
