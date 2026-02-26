import { base64ToBytes, bytesToBase64 } from "./base64";

/**
 * Shared helpers for serializing request bodies across the extension layers.
 *
 * Why this exists:
 * - `postMessage` + extension messaging only support JSON-serializable data.
 * - GM_xmlhttpRequest users often pass ArrayBuffer/TypedArray/Blob bodies.
 * - Firefox may pass values across compartments where `instanceof` checks throw.
 */

export type SerializedBody =
  | null
  | undefined
  | string
  | {
      __votExtBody: true;
      kind: "bytes" | "blob";
      b64: string;
      mime?: string | null;
    };

export type BodyDebugSummary = {
  kind: string;
  jsType: string;
  tag: string | null;
  ctor: string | null;
  byteLength?: number;
  textLength?: number;
  mime?: string | null;
  base64Length?: number;
  keyCount?: number;
  keys?: string[];
};

const MAX_RECOVERABLE_BYTES = 10_000_000;
const DEBUG_KEYS_LIMIT = 12;
const MAX_COERCE_DEPTH = 2;

type SerializedBodyData = Exclude<SerializedBody, null | undefined | string>;
type SerializedBodyEnvelope = {
  __votExtBody: true;
  b64: string;
  kind?: unknown;
  mime?: unknown;
};

function isObjectLike(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object";
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return safeObjectTag(v) === "[object Object]";
}

function safeObjectTag(v: unknown): string | null {
  try {
    return Object.prototype.toString.call(v);
  } catch {
    return null;
  }
}

function isArrayBufferLike(v: unknown): v is ArrayBuffer {
  return safeObjectTag(v) === "[object ArrayBuffer]";
}

function safeConstructorName(v: unknown): string | null {
  try {
    const ctorName = (v as any)?.constructor?.name;
    return typeof ctorName === "string" ? ctorName : null;
  } catch {
    return null;
  }
}

function safeStringProp(obj: unknown, key: string): string | null {
  try {
    const value = (obj as any)?.[key];
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function isBlobLike(v: unknown): v is Blob {
  const tag = safeObjectTag(v);
  if (tag === "[object Blob]") return true;
  if (!v || typeof v !== "object") return false;
  try {
    const anyVal = v as any;
    const hasBuffer = typeof anyVal.arrayBuffer === "function";
    const hasSlice = typeof anyVal.slice === "function";
    const hasSize = typeof anyVal.size === "number";
    const hasType = typeof anyVal.type === "string";
    return (hasBuffer || hasSlice) && hasSize && hasType;
  } catch {
    return false;
  }
}

function safeJsonStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function toSafeLength(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const n = Math.trunc(value);
  if (n < 0 || n > MAX_RECOVERABLE_BYTES) return null;
  return n;
}

function toByte(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.trunc(value) & 0xff;
}

function toUint8FromNumericArray(
  values: readonly unknown[],
): Uint8Array | null {
  const len = values.length;
  if (len > MAX_RECOVERABLE_BYTES) return null;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    const byte = toByte(values[i]);
    if (byte === null) return null;
    out[i] = byte;
  }
  return out;
}

function viewAsBytes(view: ArrayBufferView): Uint8Array {
  return new Uint8Array(
    view.buffer as ArrayBufferLike,
    view.byteOffset,
    view.byteLength,
  );
}

function copyArrayBufferView(view: ArrayBufferView): Uint8Array {
  return viewAsBytes(view).slice();
}

function parseNonNegativeIntegerKey(key: string): number | null {
  if (key === "") return null;
  const n = Number(key);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null;
  return n;
}

function isSerializedBodyEnvelope(v: unknown): v is SerializedBodyEnvelope {
  if (!isObjectLike(v)) return false;
  const envelope = v;
  return envelope.__votExtBody === true && typeof envelope.b64 === "string";
}

export function isBodySerializedForPort(body: unknown): body is SerializedBody {
  if (body === null || body === undefined) return true;
  if (typeof body === "string") return true;
  return isSerializedBodyEnvelope(body);
}

function createSerializedBytes(bytes: Uint8Array): SerializedBodyData {
  return {
    __votExtBody: true,
    kind: "bytes",
    b64: bytesToBase64(bytes),
  };
}

function createSerializedBlob(
  bytes: Uint8Array,
  mime: string | null,
): SerializedBodyData {
  return {
    __votExtBody: true,
    kind: "blob",
    b64: bytesToBase64(bytes),
    mime,
  };
}

async function tryReadBlobBody(
  body: unknown,
): Promise<{ ab: ArrayBuffer; mime: string | null } | null> {
  if (!isObjectLike(body)) return null;

  try {
    const anyBody = body as any;
    if (typeof anyBody.arrayBuffer === "function") {
      const ab = await anyBody.arrayBuffer();
      return { ab, mime: safeStringProp(anyBody, "type") };
    }
  } catch {
    // ignore and fall through
  }

  // Cross-compartment Blob wrappers can fail direct method calls. The
  // Response constructor can often read such bodies safely.
  if (typeof Response !== "undefined") {
    try {
      const ab = await new Response(body as unknown as BodyInit).arrayBuffer();
      return { ab, mime: safeStringProp(body, "type") };
    } catch {
      // ignore and fall through
    }
  }

  if (typeof Blob !== "undefined" && isBlobLike(body)) {
    try {
      const ab = await (body as Blob).arrayBuffer();
      return { ab, mime: safeStringProp(body, "type") };
    } catch {
      // ignore and fall through
    }
  }

  return null;
}

function tryCoerceByteLikeObjectToUint8Array(
  v: unknown,
  depth = 0,
): Uint8Array | null {
  if (depth > MAX_COERCE_DEPTH) return null;

  if (!isObjectLike(v)) return null;
  const obj = v;

  // Already a byte container.
  if (isArrayBufferLike(v)) {
    return new Uint8Array(v);
  }

  try {
    if (ArrayBuffer.isView(v)) {
      return copyArrayBufferView(v);
    }
  } catch {
    // ignore and continue
  }

  // Common payload wrappers.
  if (Array.isArray(v)) {
    return toUint8FromNumericArray(v as unknown[]);
  }

  // Node.js Buffer JSON form: { type: "Buffer", data: number[] }
  if (obj.type === "Buffer" && Array.isArray(obj.data)) {
    const fromBufferJson = toUint8FromNumericArray(obj.data);
    if (fromBufferJson) return fromBufferJson;
  }

  // Some runtimes wrap bytes as { data: number[] } / { bytes: number[] }.
  if (Array.isArray(obj.data)) {
    const fromData = toUint8FromNumericArray(obj.data);
    if (fromData) return fromData;
  }

  if (Array.isArray(obj.bytes)) {
    const fromBytes = toUint8FromNumericArray(obj.bytes);
    if (fromBytes) return fromBytes;
  }

  // Base64 wrappers seen in bridge payloads.
  if (typeof obj.b64 === "string") {
    try {
      return base64ToBytes(obj.b64);
    } catch {
      // ignore and continue
    }
  }

  if (typeof obj.base64 === "string") {
    try {
      return base64ToBytes(obj.base64);
    } catch {
      // ignore and continue
    }
  }

  // TypedArray-like wrapper: { buffer, byteOffset, byteLength }.
  const byteLength = toSafeLength(obj.byteLength);
  const byteOffset = toSafeLength(obj.byteOffset ?? 0);
  if (byteLength !== null && byteOffset !== null) {
    const rawBuffer = obj.buffer;

    if (isArrayBufferLike(rawBuffer)) {
      try {
        return new Uint8Array(
          rawBuffer as ArrayBuffer,
          byteOffset,
          byteLength,
        ).slice();
      } catch {
        // ignore and continue
      }
    }

    // In some cross-world cases `buffer` itself is coerced to a plain object.
    if (rawBuffer && rawBuffer !== v) {
      const recoveredBuffer = tryCoerceByteLikeObjectToUint8Array(
        rawBuffer,
        depth + 1,
      );
      if (recoveredBuffer) {
        if (byteOffset > recoveredBuffer.byteLength) return null;
        const end = Math.min(
          recoveredBuffer.byteLength,
          byteOffset + byteLength,
        );
        return recoveredBuffer.slice(byteOffset, end);
      }
    }
  }

  // Array-like wrappers with numeric indexes + length.
  const length = toSafeLength(obj.length);
  if (length !== null) {
    const indexed = obj as Record<number, unknown>;
    const out = new Uint8Array(length);
    for (let i = 0; i < length; i += 1) {
      const byte = toByte(indexed[i]);
      if (byte === null) {
        // Not a true numeric array-like container.
        return null;
      }
      out[i] = byte;
    }
    return out;
  }

  // A plain object with numeric keys: {"0": 10, "1": 20, ...}
  if (isPlainObject(v)) {
    const keys = Object.keys(obj);
    if (!keys.length) return null;

    // Only consider objects whose keys are all non-negative integers.
    const indexes = new Array<number>(keys.length);
    let max = -1;
    for (let i = 0; i < keys.length; i += 1) {
      const idx = parseNonNegativeIntegerKey(keys[i]);
      if (idx === null || idx > MAX_RECOVERABLE_BYTES) return null;
      indexes[i] = idx;
      if (idx > max) max = idx;
    }

    // Sparse numeric object where only a few indexes are present.
    // Keep old behavior for compatibility with prior bridge payloads.
    const out = new Uint8Array(max + 1);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const byte = toByte(obj[key]);
      if (byte === null) return null;
      out[indexes[i]] = byte;
    }
    return out;
  }

  return null;
}

export function coerceBodyToBytes(body: any): Uint8Array | null {
  return tryCoerceByteLikeObjectToUint8Array(body);
}

export function summarizeBodyForDebug(body: any): BodyDebugSummary {
  const jsType = body === null ? "null" : typeof body;
  const tag = safeObjectTag(body);
  const ctor = safeConstructorName(body);

  if (body === null || body === undefined) {
    return { kind: "empty", jsType, tag, ctor };
  }

  if (typeof body === "string") {
    return { kind: "string", jsType, tag, ctor, textLength: body.length };
  }

  if (isSerializedBodyEnvelope(body)) {
    const kind =
      typeof body.kind === "string" && body.kind ? body.kind : "bytes";
    return {
      kind: `serialized:${kind}`,
      jsType,
      tag,
      ctor,
      base64Length: body.b64.length,
      mime: safeStringProp(body, "mime"),
    };
  }

  if (isArrayBufferLike(body)) {
    return {
      kind: "ArrayBuffer",
      jsType,
      tag,
      ctor,
      byteLength: (body as ArrayBuffer).byteLength,
    };
  }

  try {
    if (ArrayBuffer.isView(body)) {
      const view = body as ArrayBufferView;
      return {
        kind: ctor ? `TypedArray:${ctor}` : "TypedArray",
        jsType,
        tag,
        ctor,
        byteLength: view.byteLength,
      };
    }
  } catch {
    // ignore and continue
  }

  if (isBlobLike(body)) {
    return {
      kind: "BlobLike",
      jsType,
      tag,
      ctor,
      byteLength:
        typeof (body as any).size === "number"
          ? Number((body as any).size)
          : -1,
      mime: safeStringProp(body, "type"),
    };
  }

  const coerced = coerceBodyToBytes(body);
  if (coerced) {
    return {
      kind: "coerced-bytes",
      jsType,
      tag,
      ctor,
      byteLength: coerced.byteLength,
    };
  }

  if (isObjectLike(body)) {
    const keys = Object.keys(body);
    return {
      kind: "object",
      jsType,
      tag,
      ctor,
      keyCount: keys.length,
      keys: keys.slice(0, DEBUG_KEYS_LIMIT),
    };
  }

  return { kind: "primitive", jsType, tag, ctor };
}

/**
 * Serialize a GM_xmlhttpRequest body so it can be transported over
 * `postMessage` / extension messaging.
 */
export async function serializeBodyForPort(body: any): Promise<SerializedBody> {
  if (body === null || body === undefined) return body;

  // Strings are already JSON-serializable.
  if (typeof body === "string") return body;

  // Already serialized by upstream (prelude/bridge).
  if (isSerializedBodyEnvelope(body)) {
    if (body.kind === "blob") {
      return {
        __votExtBody: true,
        kind: "blob",
        b64: body.b64,
        mime: safeStringProp(body, "mime"),
      };
    }
    return {
      __votExtBody: true,
      kind: "bytes",
      b64: body.b64,
    };
  }

  // ArrayBuffer (guard against cross-compartment instanceof throws in Firefox).
  if (isArrayBufferLike(body)) {
    return createSerializedBytes(new Uint8Array(body));
  }

  // Typed arrays / DataView.
  try {
    if (ArrayBuffer.isView(body)) {
      return createSerializedBytes(viewAsBytes(body));
    }
  } catch {
    // ignore and continue with fallbacks
  }

  // Blob / File (cross-compartment safe).
  const blobData = await tryReadBlobBody(body);
  if (blobData) {
    return createSerializedBlob(new Uint8Array(blobData.ab), blobData.mime);
  }

  // Sometimes binary bodies get coerced into plain objects during message passing.
  // Attempt best-effort recovery.
  const recovered = coerceBodyToBytes(body);
  if (recovered) {
    return createSerializedBytes(recovered);
  }

  // Fallback. Preserve object payloads as JSON when possible instead of
  // turning them into the opaque "[object Object]" string.
  const summary = summarizeBodyForDebug(body);
  try {
    console.warn(
      "[VOT Extension] Unsupported GM_xmlhttpRequest body type; coercing fallback.",
      summary,
    );
  } catch {
    // ignore
  }

  if (isObjectLike(body)) {
    const json = safeJsonStringify(body);
    if (typeof json === "string") return json;
  }

  return String(body);
}

/**
 * Decode a previously serialized body into a fetch/XHR-compatible BodyInit.
 */
export function decodeSerializedBody(body: any): BodyInit | undefined {
  if (body === null || body === undefined) return undefined;
  if (typeof body === "string") return body;

  if (isSerializedBodyEnvelope(body)) {
    const bytes = base64ToBytes(body.b64);
    const kind =
      typeof body.kind === "string" && body.kind ? body.kind : "bytes";
    if (kind === "blob") {
      const mime = body.mime;
      const ab = bytes.buffer as ArrayBuffer;
      return typeof mime === "string" && mime
        ? new Blob([ab], { type: mime })
        : new Blob([ab]);
    }
    return bytes as unknown as BodyInit;
  }

  // Recovery for unexpected cross-world payload shapes.
  const recovered = coerceBodyToBytes(body);
  if (recovered) {
    return recovered as unknown as BodyInit;
  }

  if (isObjectLike(body)) {
    const json = safeJsonStringify(body);
    if (typeof json === "string") return json;
  }

  return String(body);
}
