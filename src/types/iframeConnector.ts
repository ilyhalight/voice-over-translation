export type MessagePayload<P = unknown, E = unknown> = {
  messageId: string;
  messageType: string;
  messageDirection: string;
  payload: P;
  error?: E;
};
