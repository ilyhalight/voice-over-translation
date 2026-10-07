import { browserInfo } from "../../utils/browserInfo";
import debug from "../../utils/debug";

const REQUEST_EVENT = "vot:safari-page-po-token:request";
const RESPONSE_EVENT = "vot:safari-page-po-token:response";
const BRIDGE_MARKER = "data-vot-safari-po-token-bridge";

const TOP_REQUEST_MESSAGE = "vot:safari-page-po-token:top-request";
const TOP_RESPONSE_MESSAGE = "vot:safari-page-po-token:top-response";
let topBrokerInstalled = false;

type TopPoTokenMessage = {
  type?: string;
  requestId?: string;
  binding?: string;
  token?: string;
  error?: string;
};

type PoTokenResponse = {
  requestId?: string;
  token?: string;
  error?: string;
};

function isSafariBrowser(): boolean {
  return browserInfo.browser?.name === "Safari";
}

function installSafariPageBridge(): boolean {
  if (!isSafariBrowser()) return false;
  if (document.documentElement.hasAttribute(BRIDGE_MARKER)) return true;

  const script = document.createElement("script");
  const nonceSource =
    document.querySelector<HTMLScriptElement>("script[nonce]");
  if (nonceSource?.nonce) script.nonce = nonceSource.nonce;

  // This source is intentionally self-contained. The injected script executes
  // in YouTube's real page realm, where bevasrsg/havuokmhhs-* is available.
  script.textContent = `(() => {
    const REQUEST_EVENT = ${JSON.stringify(REQUEST_EVENT)};
    const RESPONSE_EVENT = ${JSON.stringify(RESPONSE_EVENT)};
    const MARKER = ${JSON.stringify(BRIDGE_MARKER)};
    if (document.documentElement.hasAttribute(MARKER)) return;
    document.documentElement.setAttribute(MARKER, "1");

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async function mint(binding) {
      const keys = Object.getOwnPropertyNames(globalThis).filter(
        (key) => key === "bevasrsg" || key.startsWith("havuokmhhs-"),
      );
      if (!keys.length) {
        throw new Error("YouTube PO token provider is unavailable in page realm");
      }

      for (const key of keys) {
        let bevasrs;
        try {
          bevasrs = globalThis[key]?.bevasrs;
        } catch {
          continue;
        }
        const wpc = bevasrs?.wpc;
        if (typeof wpc !== "function") continue;

        for (let attempt = 0; attempt < 10; attempt++) {
          try {
            const minter = await wpc.call(bevasrs);
            const token = await minter?.mws?.({
              c: binding,
              mc: false,
              me: false,
            });
            if (typeof token === "string" && token) return token;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            if (!message.includes("SDF:notready")) break;
          }
          await delay(500);
        }
      }
      throw new Error("YouTube PO token mint failed in page realm");
    }

    addEventListener(REQUEST_EVENT, async (event) => {
      const detail = event?.detail;
      const requestId = detail?.requestId;
      const binding = detail?.binding;
      if (typeof requestId !== "string" || typeof binding !== "string" || !binding) {
        return;
      }

      try {
        const token = await mint(binding);
        dispatchEvent(new CustomEvent(RESPONSE_EVENT, {
          detail: { requestId, token },
        }));
      } catch (error) {
        dispatchEvent(new CustomEvent(RESPONSE_EVENT, {
          detail: {
            requestId,
            error: error instanceof Error ? error.message : String(error),
          },
        }));
      }
    });
  })();`;

  (document.documentElement || document.head).append(script);
  script.remove();
  return document.documentElement.hasAttribute(BRIDGE_MARKER);
}

async function requestSafariPagePoTokenLocal(
  binding: string,
  signal: AbortSignal,
): Promise<string | undefined> {
  if (!isSafariBrowser()) return undefined;
  signal.throwIfAborted();

  if (!installSafariPageBridge()) {
    debug.error("[VOT][PO_TOKEN] Safari page bridge injection failed");
    return undefined;
  }

  const requestId = crypto.randomUUID();
  debug.log("[VOT][PO_TOKEN] trying Safari page-realm bridge", {
    bindingLength: binding.length,
  });

  return await new Promise<string | undefined>((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => finish(undefined), 8000);

    const cleanup = () => {
      clearTimeout(timeout);
      removeEventListener(RESPONSE_EVENT, onResponse as EventListener);
      signal.removeEventListener("abort", onAbort);
    };

    const finish = (value: string | undefined) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(signal.reason);
    };

    const onResponse = (event: Event) => {
      const detail = (event as CustomEvent<PoTokenResponse>).detail;
      if (detail?.requestId !== requestId) return;
      if (typeof detail.token === "string" && detail.token) {
        finish(detail.token);
        return;
      }
      if (detail.error) {
        debug.error("[VOT][PO_TOKEN] Safari page-realm mint failed", {
          message: detail.error,
        });
      }
      finish(undefined);
    };

    addEventListener(RESPONSE_EVENT, onResponse as EventListener);
    signal.addEventListener("abort", onAbort, { once: true });
    dispatchEvent(
      new CustomEvent(REQUEST_EVENT, {
        detail: { requestId, binding },
      }),
    );
  });
}

/** Install a same-origin token broker in the top YouTube document.
 * WebABR may keep running in its legacy /embed player; only PO-token minting
 * is delegated to the top player document where Safari exposes the provider.
 */
export function initSafariPagePoTokenBroker(): void {
  if (!isSafariBrowser() || window !== window.top || topBrokerInstalled) return;
  topBrokerInstalled = true;
  addEventListener("message", (event: MessageEvent<TopPoTokenMessage>) => {
    const data = event.data;
    if (event.origin !== location.origin) return;
    if (data?.type !== TOP_REQUEST_MESSAGE) return;
    if (
      typeof data.requestId !== "string" ||
      typeof data.binding !== "string" ||
      !data.binding
    )
      return;
    const source = event.source as Window | null;
    if (!source) return;
    const controller = new AbortController();
    void requestSafariPagePoTokenLocal(data.binding, controller.signal)
      .then((token) => {
        source.postMessage(
          { type: TOP_RESPONSE_MESSAGE, requestId: data.requestId, token },
          event.origin,
        );
      })
      .catch((error) => {
        source.postMessage(
          {
            type: TOP_RESPONSE_MESSAGE,
            requestId: data.requestId,
            error: error instanceof Error ? error.message : String(error),
          },
          event.origin,
        );
      });
  });
  debug.log("[VOT][PO_TOKEN] top player token broker installed");
}

async function requestTopSafariPagePoToken(
  binding: string,
  signal: AbortSignal,
): Promise<string | undefined> {
  const requestId = crypto.randomUUID();
  debug.log("[VOT][PO_TOKEN] requesting token from top YouTube player", {
    bindingLength: binding.length,
  });
  return await new Promise<string | undefined>((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => finish(undefined), 8000);
    const cleanup = () => {
      clearTimeout(timeout);
      removeEventListener("message", onMessage);
      signal.removeEventListener("abort", onAbort);
    };
    const finish = (value: string | undefined) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };
    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(signal.reason);
    };
    const onMessage = (event: MessageEvent<TopPoTokenMessage>) => {
      if (event.source !== window.top || event.origin !== location.origin)
        return;
      const data = event.data;
      if (data?.type !== TOP_RESPONSE_MESSAGE || data.requestId !== requestId)
        return;
      if (typeof data.token === "string" && data.token) {
        debug.log("[VOT][PO_TOKEN] token received from top YouTube player", {
          tokenLength: data.token.length,
        });
        finish(data.token);
      } else {
        if (data.error)
          debug.error("[VOT][PO_TOKEN] top player token mint failed", {
            message: data.error,
          });
        finish(undefined);
      }
    };
    addEventListener("message", onMessage);
    signal.addEventListener("abort", onAbort, { once: true });
    window.top?.postMessage(
      { type: TOP_REQUEST_MESSAGE, requestId, binding },
      location.origin,
    );
  });
}

export async function requestSafariPagePoToken(
  binding: string,
  signal: AbortSignal,
): Promise<string | undefined> {
  if (!isSafariBrowser()) return undefined;
  signal.throwIfAborted();
  if (window !== window.top) {
    return requestTopSafariPagePoToken(binding, signal);
  }
  return requestSafariPagePoTokenLocal(binding, signal);
}
