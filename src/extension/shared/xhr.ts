export type XhrResponse = {
  finalUrl: string;
  readyState: number;
  status: number;
  statusText: string;
  responseHeaders: string;
  responseType?: string;
  contentType?: string;
  response?: unknown;
  responseB64?: string;
  responseText?: string;
  error?: string;
};

export function createTerminalXhrError(
  url: string,
  error: string,
): XhrResponse {
  return {
    finalUrl: url,
    readyState: 4,
    status: 0,
    statusText: "",
    responseHeaders: "",
    response: null,
    responseText: "",
    error,
  };
}
