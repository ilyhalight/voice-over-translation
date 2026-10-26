import { browser } from "wxt/browser";

export const runtimeMessagesUseStructuredClone =
  typeof (browser?.runtime as { getBrowserInfo?: unknown } | undefined)
    ?.getBrowserInfo === "function";

export function lastErrorMessage(): string | null {
  return browser?.runtime?.lastError?.message ?? null;
}

export class ExtensionContextInvalidatedError extends Error {
  constructor(message = "Extension context invalidated") {
    super(message);
    this.name = "ExtensionContextInvalidatedError";
  }
}

export function isExtensionContextValid(): boolean {
  try {
    return !!browser?.runtime?.id;
  } catch {
    return false;
  }
}

function isRuntimeGone(): boolean {
  try {
    const runtime = browser?.runtime;
    return !!runtime && !runtime.id;
  } catch {
    return true;
  }
}

export function isContextInvalidatedError(error: unknown): boolean {
  return error instanceof ExtensionContextInvalidatedError || isRuntimeGone();
}

export function assertExtensionContext(): void {
  if (!isExtensionContextValid()) throw new ExtensionContextInvalidatedError();
}

export async function runtimeSendMessage<T = unknown>(
  message: unknown,
): Promise<T> {
  assertExtensionContext();
  try {
    return (await browser.runtime.sendMessage(message)) as T;
  } catch (error) {
    if (!isRuntimeGone()) throw error;
    throw new ExtensionContextInvalidatedError(
      error instanceof Error ? error.message : undefined,
    );
  }
}
