export function asErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    try {
      return JSON.stringify(err);
    } catch {
      return Object.prototype.toString.call(err);
    }
  }
  try {
    return String(err);
  } catch {
    return "Unknown error";
  }
}

export function sendBridgeResponse(
  sendResponse: ((value: unknown) => void) | undefined,
  payload: unknown,
): void {
  if (typeof sendResponse !== "function") return;
  try {
    sendResponse(payload);
  } catch {
    // ignore
  }
}

export function toStringRecord(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object") return {};

  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>)
      .filter(([, value]) =>
        ["string", "number", "boolean"].includes(typeof value),
      )
      .map(([key, value]) => [String(key), String(value)]),
  );
}
