import { IFRAME_HASH } from "../audioDownloader/strategies/bridgeProtocol";

export type BootstrapMode = "skip" | "audio-realm" | "auth-eager" | "lazy";

export type BootstrapPolicyInput = {
  isIframe: boolean;
  href: string;
  origin: string;
  authOrigin: string;
};

/**
 * The hidden youtube.com frame the audio downloader opens when the current
 * realm cannot talk to the YouTube session itself.
 *
 * It is our own frame, it carries no UI, and the download waits for it to
 * report itself ready — so it must never be dropped as a "non-runnable"
 * iframe, which is what left a userscript download waiting for its whole
 * timeout while the extension build (whose prelude runs in every frame)
 * answered right away.
 */
export function isAudioRealmFrame(input: BootstrapPolicyInput): boolean {
  return input.isIframe && input.href.includes(`#${IFRAME_HASH}`);
}

export function shouldSkipIframeBootstrap(
  input: BootstrapPolicyInput,
): boolean {
  if (!input.isIframe || isAudioRealmFrame(input)) return false;
  return (
    input.href === "about:blank" ||
    input.href.startsWith("about:srcdoc") ||
    (input.origin === "https://www.youtube.com" &&
      input.href.includes("#ya_iframe")) ||
    input.origin === "null"
  );
}

export function resolveBootstrapMode(
  input: BootstrapPolicyInput,
): BootstrapMode {
  if (isAudioRealmFrame(input)) {
    return "audio-realm";
  }
  if (shouldSkipIframeBootstrap(input)) {
    return "skip";
  }
  if (!input.isIframe && input.origin === input.authOrigin) {
    return "auth-eager";
  }
  return "lazy";
}
