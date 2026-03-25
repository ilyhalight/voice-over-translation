export type BootstrapMode = "skip" | "auth-eager" | "lazy";

export type BootstrapPolicyInput = {
  isIframe: boolean;
  href: string;
  origin: string;
  authOrigin: string;
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
  if (!input.isIframe && input.origin === input.authOrigin) {
    return "auth-eager";
  }
  return "lazy";
}
