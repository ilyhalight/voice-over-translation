export { calculatedResLang } from "./localization";

const DEFAULT_OBJECT_URL_REVOKE_DELAY_MS = 30_000;
const ASCII_CONTROL_CHARS_RE = /\p{Cc}/gu;
const INVALID_FILENAME_CHARS_RE = /[\\/:*?"'<>|]+/g;
const URL_PROTOCOL_RE = /^https?:\/\//i;
const MULTIPLE_DASHES_RE = /-{2,}/g;
const EDGE_FILE_CHARS_RE = /^[.\s-]+|[.\s-]+$/g;

type PlainRecord = Record<string, unknown>;
type NavigatorWithShare = Navigator & {
  canShare?: (data?: ShareData) => boolean;
};
type DownloadFileWritable = {
  write: (data: Blob) => Promise<void> | void;
  close: () => Promise<void> | void;
};

export type DownloadFileHandle = {
  createWritable: () => Promise<DownloadFileWritable>;
};
export type DownloadBlobOptions = {
  fileHandle?: DownloadFileHandle | null;
  preferShare?: boolean;
};

function getDateFallbackFilename(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function stripAsciiControlChars(value: string): string {
  return value.replace(ASCII_CONTROL_CHARS_RE, "");
}

/**
 * Creates a stable JSON string representation for consistent hashing
 * @param value The value to stringify
 * @returns A stable JSON string
 */
export function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>();

  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === "object") {
      if (seen.has(val)) {
        return "[Circular]";
      }

      seen.add(val);
      if (Array.isArray(val)) {
        return val;
      }

      const sorted: PlainRecord = {};
      const keys = Object.keys(val as PlainRecord).sort();
      for (const key of keys) {
        sorted[key] = (val as PlainRecord)[key];
      }

      return sorted;
    }

    return val;
  });
}

/**
 * Small, deterministic hash for cache keys. (Not crypto.)
 * @param str The string to hash
 * @returns A base36 string representation of the hash
 */
export function fnv1a32ToKeyPart(str: string): string {
  let hash = 0x811c9dc5; // 2166136261
  let i = 0;
  while (i < str.length) {
    const codePoint = str.codePointAt(i) ?? 0;
    hash ^= codePoint;
    hash = Math.imul(hash, 0x01000193); // 16777619
    i += codePoint > 0xffff ? 2 : 1;
  }
  // Unsigned 32-bit to a compact base36 string.
  return (hash >>> 0).toString(36);
}

export interface DocumentWithFullscreen extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
}

export const isPiPAvailable = () => Boolean(document.pictureInPictureEnabled);

async function writeBlobToHandle(
  handle: DownloadFileHandle,
  blob: Blob,
): Promise<boolean> {
  try {
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

async function shareBlob(
  blob: Blob,
  filename: string,
): Promise<"shared" | "unsupported" | "error"> {
  const nav =
    typeof navigator === "undefined"
      ? undefined
      : (navigator as NavigatorWithShare);
  if (!nav?.share || typeof File === "undefined") {
    return "unsupported";
  }

  let file: File;
  try {
    file = new File([blob], filename, {
      type: blob.type || "application/octet-stream",
    });
  } catch {
    return "unsupported";
  }

  if (typeof nav.canShare === "function" && !nav.canShare({ files: [file] })) {
    return "unsupported";
  }

  try {
    await nav.share({ files: [file], title: filename });
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      // Treat user cancellation as a completed interaction.
      return "shared";
    }

    return "error";
  }
}

function triggerBlobDownload(blob: Blob, filename: string): boolean {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener noreferrer";
  anchor.target = "_blank";
  anchor.style.position = "fixed";
  anchor.style.left = "-9999px";
  anchor.style.top = "0";
  (document.body ?? document.documentElement).append(anchor);

  try {
    anchor.click();
    return true;
  } catch {
    return false;
  } finally {
    anchor.remove();
    revokeObjectUrlLater(url);
  }
}

/** Downloads binary file with entered filename */
export async function downloadBlob(
  blob: Blob,
  filename: string,
  options: DownloadBlobOptions = {},
): Promise<boolean> {
  if (options.fileHandle) {
    const saved = await writeBlobToHandle(options.fileHandle, blob);
    if (saved) {
      return true;
    }
  }

  if (options.preferShare) {
    const shareResult = await shareBlob(blob, filename);
    return shareResult === "shared";
  }

  return triggerBlobDownload(blob, filename);
}

function revokeObjectUrlLater(
  url: string,
  delayMs = DEFAULT_OBJECT_URL_REVOKE_DELAY_MS,
): void {
  const safeDelayMs =
    Number.isFinite(delayMs) && delayMs >= 0
      ? delayMs
      : DEFAULT_OBJECT_URL_REVOKE_DELAY_MS;

  globalThis.setTimeout(() => URL.revokeObjectURL(url), safeDelayMs);
}

export function clearFileName(filename: string): string {
  const trimmed = filename.trim();
  if (!trimmed) return getDateFallbackFilename();

  const sanitized = stripAsciiControlChars(trimmed)
    .replace(URL_PROTOCOL_RE, "")
    .replace(INVALID_FILENAME_CHARS_RE, "-")
    .replace(MULTIPLE_DASHES_RE, "-")
    .replace(EDGE_FILE_CHARS_RE, "");

  return sanitized || getDateFallbackFilename();
}

export const getTimestamp = () => Math.floor(Date.now() / 1000);

export const getHeaders = (headers?: HeadersInit): Record<string, string> =>
  headers ? Object.fromEntries(new Headers(headers)) : {};

export function clamp(value: number, min = 0, max = 100): number {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  return Math.min(Math.max(value, lower), upper);
}

export function toFlatObj<T extends Record<string, unknown>>(
  data: Record<string, unknown>,
): T {
  const out: Record<string, unknown> = {};
  const stack: Array<[string, unknown]> = Object.entries(data);

  while (stack.length) {
    const entry = stack.pop();
    if (!entry) continue;
    const [key, val] = entry;
    if (val === undefined) continue;

    const isFlattenable =
      val !== null && typeof val === "object" && !Array.isArray(val);
    if (!isFlattenable) {
      out[key] = val;
      continue;
    }

    for (const [k, v] of Object.entries(val)) {
      stack.push([`${key}.${k}`, v]);
    }
  }

  return out as T;
}
