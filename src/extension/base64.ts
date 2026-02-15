/**
 * Small Base64 helpers used by the extension bridge.
 *
 * We keep these in a dedicated module to avoid duplicating the same logic in
 * both the content script and the service worker.
 */

export function bytesToBase64(bytes: Uint8Array): string {
  // Chunk to avoid stack overflows on large arrays.
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    binary += String.fromCodePoint(...sub);
  }
  return btoa(binary);
}

export function arrayBufferToBase64(ab: ArrayBuffer): string {
  return bytesToBase64(new Uint8Array(ab));
}

export function base64ToBytes(b64: string): Uint8Array {
  // Be tolerant to base64url variants and missing padding.
  let normalized = String(b64 || "").trim();
  normalized = normalized.replaceAll("-", "+").replaceAll("_", "/");
  const pad = normalized.length % 4;
  if (pad) normalized += "=".repeat(4 - pad);

  const binary = atob(normalized);
  const len = binary.length;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    out[i] = binary.codePointAt(i) ?? 0;
  }
  return out;
}

export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bytes = base64ToBytes(b64);
  const out = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(out).set(bytes);
  return out;
}
