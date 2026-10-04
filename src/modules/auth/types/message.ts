export type AuthMessageData = {
  state: string;
  code?: string;
};

export const AUTH_DATA_MESSAGE_SOURCE = "vot-auth";
export const AUTH_DATA_MESSAGE_TYPE = "auth-data";

export type AuthDataMessage = Readonly<{
  source: typeof AUTH_DATA_MESSAGE_SOURCE;
  type: typeof AUTH_DATA_MESSAGE_TYPE;
  data: AuthMessageData;
}>;
