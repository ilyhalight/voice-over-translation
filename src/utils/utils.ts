export { calculatedResLang } from "./localization";

/**
 * Creates a stable JSON string representation for consistent hashing
 * @param value The value to stringify
 * @returns A stable JSON string
 */
export function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === "object") {
      const obj = val as object;
      if (seen.has(obj)) {
        return "[Circular]";
      }
      seen.add(obj);
      if (Array.isArray(val)) return val;
      const sorted: Record<string, unknown> = {};
      const entries = Object.entries(val).sort(([leftKey], [rightKey]) =>
        leftKey.localeCompare(rightKey),
      );
      for (const [key, entryValue] of entries) {
        sorted[key] = entryValue;
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

export const isPiPAvailable = () =>
  "pictureInPictureEnabled" in document &&
  Boolean((document as any).pictureInPictureEnabled);

/** Downloads binary file with entered filename */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  revokeObjectUrlLater(url);
}

const DEFAULT_OBJECT_URL_REVOKE_DELAY_MS = 30_000;

export function revokeObjectUrlLater(
  url: string,
  delayMs = DEFAULT_OBJECT_URL_REVOKE_DELAY_MS,
): void {
  globalThis.setTimeout(() => URL.revokeObjectURL(url), delayMs);
}

export function clearFileName(filename: string) {
  const name = filename.trim();
  if (!name) return new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  return name.replace(/^https?:\/\//, "").replaceAll(/[\\/:*?"'<>|]/g, "-");
}

export const getTimestamp = () => Math.floor(Date.now() / 1000);

export const getHeaders = (headers?: HeadersInit): Record<string, string> =>
  headers ? Object.fromEntries(new Headers(headers).entries()) : {};

export const clamp = (value: number, min = 0, max = 100) =>
  Math.min(Math.max(value, min), max);

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

    const isPlainObject =
      val !== null && typeof val === "object" && !Array.isArray(val);

    if (!isPlainObject) {
      out[key] = val;
      continue;
    }

    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      stack.push([`${key}.${k}`, v]);
    }
  }

  return out as T;
}

export async function exitFullscreen() {
  const doc = document as DocumentWithFullscreen;

  if (!doc.fullscreenElement && !doc.webkitFullscreenElement) return;

  if (doc.exitFullscreen) return doc.exitFullscreen();
  return doc.webkitExitFullscreen?.();
}
