/**
 * Small Base64 helpers used by the extension bridge.
 *
 * We keep these in a dedicated module to avoid duplicating the same logic in
 * both the content script and the service worker.
 */

type FromBase64Options = {
  alphabet?: "base64" | "base64url";
  lastChunkHandling?: "loose" | "strict" | "stop-before-partial";
};

type Uint8ArrayPrototypeWithBase64 = {
  toBase64?: (this: Uint8Array) => string;
};

type Uint8ArrayConstructorWithBase64 = Uint8ArrayConstructor & {
  fromBase64?: (input: string, options?: FromBase64Options) => Uint8Array;
};

const BASE64URL_DECODE_OPTIONS: FromBase64Options = {
  alphabet: "base64url",
};
const nativeToBase64 =
  typeof (Uint8Array.prototype as Uint8ArrayPrototypeWithBase64).toBase64 ===
  "function"
    ? (Uint8Array.prototype as Uint8ArrayPrototypeWithBase64).toBase64
    : null;
const nativeFromBase64 = (Uint8Array as Uint8ArrayConstructorWithBase64)
  .fromBase64;

function normalizeBase64Input(input: string): string {
  // Allow surrounding / embedded whitespace and missing padding.
  const withoutWhitespace = String(input).replaceAll(/\s+/g, "");
  const remainder = withoutWhitespace.length % 4;
  if (remainder === 1) {
    throw new TypeError("Invalid base64 input.");
  }
  if (remainder === 0) return withoutWhitespace;
  return withoutWhitespace + "=".repeat(4 - remainder);
}

function bytesToBinaryString(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return binary;
}

function decodeWithLegacyBase64Normalized(
  normalizedBase64: string,
): Uint8Array {
  const atobFn = globalThis.atob;
  if (typeof atobFn !== "function") {
    throw new TypeError("Base64 decoder is not available in this environment.");
  }

  const binary = atobFn(normalizedBase64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function encodeWithLegacyBase64(bytes: Uint8Array): string {
  const btoaFn = globalThis.btoa;
  if (typeof btoaFn !== "function") {
    throw new TypeError("Base64 encoder is not available in this environment.");
  }
  return btoaFn(bytesToBinaryString(bytes));
}

function decodeBase64ToBytes(input: string): Uint8Array {
  const normalized = normalizeBase64Input(input);
  const normalizedStandard = normalized
    .replaceAll("-", "+")
    .replaceAll("_", "/");

  if (typeof nativeFromBase64 !== "function") {
    return decodeWithLegacyBase64Normalized(normalizedStandard);
  }

  const hasUrlAlphabet = normalized.includes("-") || normalized.includes("_");
  const hasStandardAlphabet =
    normalized.includes("+") || normalized.includes("/");

  if (hasUrlAlphabet && !hasStandardAlphabet) {
    return nativeFromBase64(normalized, BASE64URL_DECODE_OPTIONS);
  }
  return nativeFromBase64(
    hasUrlAlphabet && hasStandardAlphabet ? normalizedStandard : normalized,
  );
}

function bytesViewToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const { buffer, byteOffset, byteLength } = bytes;

  if (buffer instanceof ArrayBuffer) {
    if (byteOffset === 0 && byteLength === buffer.byteLength) return buffer;
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }

  const out = new ArrayBuffer(byteLength);
  new Uint8Array(out).set(bytes);
  return out;
}

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof nativeToBase64 === "function") {
    return nativeToBase64.call(bytes);
  }
  return encodeWithLegacyBase64(bytes);
}

export function arrayBufferToBase64(ab: ArrayBuffer): string {
  return bytesToBase64(new Uint8Array(ab));
}

export function base64ToBytes(b64: string): Uint8Array {
  return decodeBase64ToBytes(b64);
}

export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  return bytesViewToArrayBuffer(base64ToBytes(b64));
}
