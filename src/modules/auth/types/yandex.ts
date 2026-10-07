export type TokenInfo = {
  token_type: "bearer";
  access_token: string;
  /**
   * in seconds
   */
  expires_in: number;
  refresh_token: string;
  scope: string;
};

export type TokenErrorType =
  | "authorization_pending"
  | "bad_verification_code"
  | "invalid_client"
  | "invalid_grant"
  | "invalid_request"
  | "invalid_scope"
  | "unauthorized_client"
  | "unsupported_grant_type"
  | "Basic auth required"
  | "Malformed Authorization header";

export type TokenError = {
  error_description: string;
  error: TokenErrorType;
};

export type TokenResponse = TokenInfo | TokenError;

export type UserInfo = {
  id: string;
  login: string;
  client_id: string;
  default_avatar_id: string;
  is_avatar_empty: boolean;
  psuid: string;
};

export type AuthError = {
  code: "NOT_AUTHORIZED";
  details: Record<string, unknown>;
  message: string;
  status: "error";
};

export type UserInfoResponse = UserInfo | AuthError;
