export type BootstrapMode =
  | "skip"
  | "iframe-helper"
  | "top-full"
  | "iframe-lazy";

export type BootstrapPolicyInput = {
  isIframe: boolean;
  href: string;
  origin: string;
  hash: string;
  iframeHash: string;
};

export function shouldSkipIframeBootstrap(
  input: BootstrapPolicyInput,
): boolean {
  if (!input.isIframe) return false;
  if (input.hash.includes(input.iframeHash)) return false;
  return (
    input.href === "about:blank" ||
    input.href.startsWith("about:srcdoc") ||
    input.origin === "null"
  );
}

export function resolveBootstrapMode(
  input: BootstrapPolicyInput,
): BootstrapMode {
  if (input.isIframe && input.hash.includes(input.iframeHash)) {
    return "iframe-helper";
  }
  if (shouldSkipIframeBootstrap(input)) {
    return "skip";
  }
  if (input.isIframe) {
    return "iframe-lazy";
  }
  return "top-full";
}
