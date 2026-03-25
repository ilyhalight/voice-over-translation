export const AUTH_REFRESH_MESSAGE_SOURCE = "vot-auth";
export const AUTH_REFRESH_MESSAGE_TYPE = "account-updated";

export type AuthRefreshMessage = Readonly<{
  source: typeof AUTH_REFRESH_MESSAGE_SOURCE;
  type: typeof AUTH_REFRESH_MESSAGE_TYPE;
}>;

export function createAuthRefreshMessage(): AuthRefreshMessage {
  return {
    source: AUTH_REFRESH_MESSAGE_SOURCE,
    type: AUTH_REFRESH_MESSAGE_TYPE,
  };
}

export function isAuthRefreshMessage(
  value: unknown,
): value is AuthRefreshMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AuthRefreshMessage>;
  return (
    candidate.source === AUTH_REFRESH_MESSAGE_SOURCE &&
    candidate.type === AUTH_REFRESH_MESSAGE_TYPE
  );
}

export function notifyAuthOpener(
  target: Pick<Window, "postMessage"> | null | undefined = globalThis.opener,
): void {
  if (!target || typeof target.postMessage !== "function") {
    return;
  }

  target.postMessage(createAuthRefreshMessage(), "*");
}
