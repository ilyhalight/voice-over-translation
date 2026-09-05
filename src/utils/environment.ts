import { browserInfo } from "./browserInfo";

export type EnvironmentInfo = {
  os: string;
  browser: string;
  loader: string;
  scriptVersion: string;
  scriptName: string;
  url: string;
};

const UNKNOWN_VALUE = "unknown";

const joinParts = (...parts: Array<string | undefined | null>) => {
  const value = parts.filter(Boolean).join(" ").trim();
  return value || UNKNOWN_VALUE;
};

export function isDocumentHidden(): boolean {
  return typeof document !== "undefined" && document.hidden;
}

export function getEnvironmentInfo(): EnvironmentInfo {
  const os = joinParts(browserInfo.os?.name, browserInfo.os?.version);
  const browser = joinParts(
    browserInfo.browser?.name,
    browserInfo.browser?.version,
  );

  const safeGMInfo = typeof GM_info === "undefined" ? undefined : GM_info;
  const loader = (() => {
    const handler = safeGMInfo?.scriptHandler;
    const version = safeGMInfo?.version;
    if (handler && version) return `${handler} v${version}`;
    return handler || version || UNKNOWN_VALUE;
  })();

  const scriptVersion = safeGMInfo?.script?.version ?? UNKNOWN_VALUE;
  const scriptName = safeGMInfo?.script?.name ?? UNKNOWN_VALUE;
  const url = globalThis?.location?.href ?? UNKNOWN_VALUE;

  return {
    os,
    browser,
    loader,
    scriptVersion,
    scriptName,
    url,
  };
}
