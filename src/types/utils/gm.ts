export type FetchOpts = RequestInit & {
  timeout?: number;
  forceGmXhr?: boolean;
  // headers?: Record<string, unknown>;
};
