export type BootstrapMode = "skip" | "top-full" | "iframe-lazy";

export type BootstrapPolicyInput = {
  isIframe: boolean;
  href: string;
  origin: string;
};

export function shouldSkipIframeBootstrap(
  input: BootstrapPolicyInput,
): boolean {
  if (!input.isIframe) return false;
  return (
    input.href === "about:blank" ||
    input.href.startsWith("about:srcdoc") ||
    input.origin === "null"
  );
}

export function resolveBootstrapMode(
  input: BootstrapPolicyInput,
): BootstrapMode {
  if (shouldSkipIframeBootstrap(input)) {
    return "skip";
  }
  if (input.isIframe) {
    return "iframe-lazy";
  }
  return "top-full";
}
