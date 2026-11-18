function toFileHref(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "file:") return undefined;
    parsed.hash = "";
    parsed.search = "";
    return decodeURI(parsed.href);
  } catch {
    return undefined;
  }
}

function isFileScheme(url: string): boolean {
  try {
    return new URL(url).protocol === "file:";
  } catch {
    return url.trim().toLowerCase().startsWith("file:");
  }
}

/**
 * The page bridge does not authenticate page scripts, so the background must
 * not read an arbitrary local file for them: a file:// request is served only
 * for the very file opened in the requesting tab.
 */
export function isRequestUrlAllowed(
  url: string,
  senderUrl: string | undefined,
  localFileEnabled: boolean,
): boolean {
  if (!isFileScheme(url)) return true;
  if (!localFileEnabled) return false;
  const requested = toFileHref(url);
  return requested !== undefined && requested === toFileHref(senderUrl);
}
